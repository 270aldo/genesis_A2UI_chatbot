from __future__ import annotations

from datetime import date, datetime, timedelta
import os
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Body, HTTPException, Query, Request
from pydantic import BaseModel, Field

from wearables.apple_health import AppleHealthBridge
from wearables.garmin import GarminClient, parse_garmin_webhook
from wearables.oura import OuraClient, normalize_sleep_payload
from wearables.readiness import calculate_readiness
from wearables.store import (
    get_connection,
    list_active_connections,
    resolve_user_id,
    save_raw_payload,
    save_wearable_data,
    upsert_connection,
    touch_connection_sync,
)
from wearables.tasks import enqueue_http_task, is_tasks_configured
from services.auth import verify_internal_request
from wearables.whoop import WhoopClient, normalize_recovery_payload

wearables_router = APIRouter(prefix="/api/wearables", tags=["wearables"])

GARMIN = GarminClient()
OURA = OuraClient()
WHOOP = WhoopClient()
APPLE = AppleHealthBridge()

PROVIDERS = {
    "garmin": GARMIN,
    "oura": OURA,
    "whoop": WHOOP,
    "apple": APPLE,
}

API_BASE_URL = os.getenv("API_BASE_URL", "").rstrip("/")
SYNC_MIN_INTERVAL_MINUTES = int(os.getenv("SYNC_MIN_INTERVAL_MINUTES", "60"))


class AuthResponse(BaseModel):
    auth_url: str
    state: str


class CallbackResponse(BaseModel):
    status: str
    provider: str


class AppleIngestRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    payload: dict[str, Any] = Field(..., description="HealthKit payload")
    data_date: date | None = Field(default=None, description="Optional date override")


class SyncResponse(BaseModel):
    status: str
    provider: str
    records: int
    start_date: str
    end_date: str


class SyncAllResponse(BaseModel):
    status: str
    total_connections: int
    tasks_created: int
    providers: list[str]


@wearables_router.get("/providers")
async def list_providers() -> dict[str, Any]:
    return {
        "providers": [
            {
                "id": "garmin",
                "configured": GARMIN.is_configured(),
                "oauth": True,
            },
            {
                "id": "oura",
                "configured": OURA.is_configured(),
                "oauth": True,
            },
            {
                "id": "whoop",
                "configured": WHOOP.is_configured(),
                "oauth": True,
            },
            {
                "id": "apple",
                "configured": True,
                "oauth": False,
            },
        ]
    }


@wearables_router.get("/health")
async def wearables_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "providers": list(PROVIDERS.keys()),
        "tasks_configured": is_tasks_configured(),
        "sync_min_interval_minutes": SYNC_MIN_INTERVAL_MINUTES,
        "api_base_url": API_BASE_URL or None,
    }


@wearables_router.get("/{provider}/auth", response_model=AuthResponse)
async def start_auth(provider: str, state: str | None = Query(default=None)) -> AuthResponse:
    client = PROVIDERS.get(provider)
    if not client or provider == "apple":
        raise HTTPException(status_code=404, detail="Provider not supported")

    if not client.is_configured():
        raise HTTPException(status_code=400, detail=f"{provider} OAuth not configured")

    state_value = state or str(uuid4())
    auth_url = client.get_authorization_url(state_value)
    return AuthResponse(auth_url=auth_url, state=state_value)


@wearables_router.get("/{provider}/callback", response_model=CallbackResponse)
async def oauth_callback(
    provider: str,
    code: str = Query(..., description="OAuth authorization code"),
    user_id: str = Query(..., description="User identifier"),
):
    client = PROVIDERS.get(provider)
    if not client or provider == "apple":
        raise HTTPException(status_code=404, detail="Provider not supported")

    if not client.is_configured():
        raise HTTPException(status_code=400, detail=f"{provider} OAuth not configured")

    tokens = await client.exchange_code(code)
    await upsert_connection(user_id, provider, tokens)

    return CallbackResponse(status="connected", provider=provider)


@wearables_router.post("/{provider}/webhook")
async def wearable_webhook(
    provider: str,
    payload: dict[str, Any] = Body(...),
    user_id: str | None = Query(default=None, description="Optional override user id"),
):
    if provider not in PROVIDERS or provider == "apple":
        raise HTTPException(status_code=404, detail="Provider not supported")

    provider_user_id = payload.get("userId") or payload.get("user_id")
    resolved_user_id = None
    if provider_user_id:
        resolved_user_id = await resolve_user_id(provider, str(provider_user_id))

    effective_user_id = resolved_user_id or user_id
    if not effective_user_id:
        raise HTTPException(status_code=400, detail="user_id is required for this webhook")

    metrics_list: list = []
    if provider == "garmin":
        metrics_list = parse_garmin_webhook(payload, effective_user_id)
    elif provider == "oura":
        metrics_list = normalize_sleep_payload(payload, effective_user_id)
    elif provider == "whoop":
        metrics_list = normalize_recovery_payload(payload, effective_user_id)

    data_date = metrics_list[0].data_date if metrics_list else None
    await save_raw_payload(effective_user_id, provider, "webhook", payload, data_date=data_date)

    saved = 0
    for metrics in metrics_list:
        metrics.readiness_score = calculate_readiness(metrics)
        await save_wearable_data(metrics)
        saved += 1

    return {
        "status": "ok",
        "provider": provider,
        "records": saved,
    }


@wearables_router.post("/apple/ingest")
async def ingest_apple_health(request: AppleIngestRequest):
    metrics = APPLE.normalize_payload(request.payload, request.user_id)
    if request.data_date:
        metrics.data_date = request.data_date

    metrics.readiness_score = calculate_readiness(metrics)
    await save_wearable_data(metrics)
    await save_raw_payload(request.user_id, "apple", "ingest", request.payload, data_date=metrics.data_date)

    return {
        "status": "ok",
        "provider": "apple",
        "records": 1,
    }


def _parse_expires_at(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
    return None


async def _ensure_tokens(provider: str, user_id: str):
    client = PROVIDERS.get(provider)
    if not client or provider == "apple":
        raise HTTPException(status_code=404, detail="Provider not supported")

    connection = await get_connection(user_id, provider)
    if not connection:
        raise HTTPException(status_code=404, detail="Wearable connection not found")

    expires_at = _parse_expires_at(connection.get("token_expires_at"))
    access_token = connection.get("access_token")
    refresh_token = connection.get("refresh_token")

    if expires_at and expires_at <= datetime.utcnow() + timedelta(minutes=5):
        if hasattr(client, "refresh_access_token") and refresh_token:
            tokens = await client.refresh_access_token(refresh_token)
            await upsert_connection(user_id, provider, tokens)
            access_token = tokens.access_token

    if not access_token:
        raise HTTPException(status_code=400, detail="Access token missing")

    return access_token


def _should_sync(last_sync: Any) -> bool:
    if not last_sync:
        return True
    try:
        parsed = datetime.fromisoformat(str(last_sync).replace("Z", "+00:00"))
    except ValueError:
        return True
    return parsed <= datetime.utcnow() - timedelta(minutes=SYNC_MIN_INTERVAL_MINUTES)


async def _fetch_and_store(provider: str, user_id: str, start_date: date, end_date: date) -> int:
    access_token = await _ensure_tokens(provider, user_id)

    payload: dict[str, Any] | None = None
    metrics_list: list = []

    if provider == "oura":
        payload = await OURA.fetch_sleep(access_token, start_date.isoformat(), end_date.isoformat())
        metrics_list = normalize_sleep_payload(payload, user_id)
    elif provider == "whoop":
        payload = await WHOOP.fetch_recovery(access_token, start_date.isoformat(), end_date.isoformat())
        metrics_list = normalize_recovery_payload(payload, user_id)
    else:
        raise HTTPException(status_code=501, detail=f"{provider} backfill not implemented yet")

    data_date = metrics_list[0].data_date if metrics_list else None
    if payload:
        await save_raw_payload(user_id, provider, "sync", payload, data_date=data_date)

    saved = 0
    for metrics in metrics_list:
        metrics.readiness_score = calculate_readiness(metrics)
        await save_wearable_data(metrics)
        saved += 1

    if saved:
        await touch_connection_sync(user_id, provider)

    return saved


@wearables_router.post("/{provider}/backfill", response_model=SyncResponse)
async def backfill_provider(
    request: Request,
    provider: str,
    user_id: str = Query(..., description="User identifier"),
    days: int = Query(default=30, ge=1, le=365),
):
    verify_internal_request(request)
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    records = await _fetch_and_store(provider, user_id, start_date, end_date)
    return SyncResponse(
        status="ok",
        provider=provider,
        records=records,
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
    )


@wearables_router.post("/{provider}/sync", response_model=SyncResponse)
async def sync_provider(
    request: Request,
    provider: str,
    user_id: str = Query(..., description="User identifier"),
):
    verify_internal_request(request)
    end_date = date.today()
    start_date = end_date - timedelta(days=1)
    records = await _fetch_and_store(provider, user_id, start_date, end_date)
    return SyncResponse(
        status="ok",
        provider=provider,
        records=records,
        start_date=start_date.isoformat(),
        end_date=end_date.isoformat(),
    )


@wearables_router.post("/sync-all", response_model=SyncAllResponse)
async def sync_all_connections(
    request: Request,
    provider: str | None = Query(default=None, description="Optional provider filter"),
):
    verify_internal_request(request)
    connections = await list_active_connections(provider=provider)
    base_url = API_BASE_URL or request.base_url.rstrip("/")

    tasks_created = 0
    providers = sorted({conn["provider"] for conn in connections}) if connections else []

    for conn in connections:
        user_id = conn.get("user_id")
        provider_id = conn.get("provider")
        if not user_id or not provider_id:
            continue

        if not _should_sync(conn.get("last_sync")):
            continue

        target_url = f"{base_url}/api/wearables/{provider_id}/sync?user_id={user_id}"

        if is_tasks_configured():
            enqueue_http_task(target_url)
            tasks_created += 1
        else:
            await _fetch_and_store(provider_id, user_id, date.today() - timedelta(days=1), date.today())

    return SyncAllResponse(
        status="ok",
        total_connections=len(connections),
        tasks_created=tasks_created,
        providers=providers,
    )
