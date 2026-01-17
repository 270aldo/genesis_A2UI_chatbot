from __future__ import annotations

from datetime import date
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Body, HTTPException, Query
from pydantic import BaseModel, Field

from wearables.apple_health import AppleHealthBridge
from wearables.garmin import GarminClient, parse_garmin_webhook
from wearables.oura import OuraClient, normalize_sleep_payload
from wearables.readiness import calculate_readiness
from wearables.store import resolve_user_id, save_raw_payload, save_wearable_data, upsert_connection
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
