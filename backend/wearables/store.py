from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any

from services import supabase_client
from wearables.models import WearableMetrics, WearableTokens

logger = logging.getLogger(__name__)

SUPABASE_ENABLED = bool(supabase_client.SUPABASE_URL and supabase_client.SUPABASE_KEY)
SUPABASE = supabase_client.supabase


async def upsert_connection(
    user_id: str,
    provider: str,
    tokens: WearableTokens,
    status: str = "active",
) -> dict[str, Any] | None:
    if not SUPABASE_ENABLED:
        logger.warning("Supabase not configured. Skipping wearable connection save.")
        return None

    payload = {
        "user_id": user_id,
        "provider": provider,
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
        "token_expires_at": tokens.expires_at.isoformat() if tokens.expires_at else None,
        "status": status,
        "provider_user_id": tokens.provider_user_id,
        "scopes": tokens.scopes or [],
        "updated_at": datetime.utcnow().isoformat(),
    }

    try:
        result = SUPABASE.table("wearable_connections").upsert(
            payload,
            on_conflict="user_id,provider",
        ).execute()
        return result.data[0] if result.data else None
    except Exception as exc:
        logger.exception("Failed to upsert wearable connection: %s", exc)
        return None


async def get_connection(user_id: str, provider: str) -> dict[str, Any] | None:
    if not SUPABASE_ENABLED:
        logger.warning("Supabase not configured. Skipping wearable connection fetch.")
        return None

    try:
        result = SUPABASE.table("wearable_connections").select("*").eq(
            "user_id", user_id
        ).eq("provider", provider).maybe_single().execute()
        return result.data if result.data else None
    except Exception as exc:
        logger.exception("Failed to fetch wearable connection: %s", exc)
        return None


async def save_wearable_data(metrics: WearableMetrics) -> dict[str, Any] | None:
    if not SUPABASE_ENABLED:
        logger.warning("Supabase not configured. Skipping wearable data save.")
        return None

    try:
        payload = metrics.to_record()
        result = SUPABASE.table("wearable_data").upsert(
            payload,
            on_conflict="user_id,provider,data_date",
        ).execute()
        return result.data[0] if result.data else None
    except Exception as exc:
        logger.exception("Failed to save wearable data: %s", exc)
        return None


async def save_raw_payload(
    user_id: str,
    provider: str,
    endpoint: str,
    payload: dict[str, Any],
    data_date: date | None = None,
) -> dict[str, Any] | None:
    if not SUPABASE_ENABLED:
        logger.warning("Supabase not configured. Skipping raw wearable payload save.")
        return None

    try:
        raw_payload = {
            "user_id": user_id,
            "provider": provider,
            "endpoint": endpoint,
            "data_date": data_date.isoformat() if data_date else None,
            "payload": payload,
            "synced_at": datetime.utcnow().isoformat(),
        }
        result = SUPABASE.table("wearable_raw").insert(raw_payload).execute()
        return result.data[0] if result.data else None
    except Exception as exc:
        logger.exception("Failed to save wearable raw payload: %s", exc)
        return None


async def resolve_user_id(provider: str, provider_user_id: str) -> str | None:
    if not SUPABASE_ENABLED:
        return None

    try:
        result = SUPABASE.table("wearable_connections").select("user_id").eq(
            "provider", provider
        ).eq("provider_user_id", provider_user_id).maybe_single().execute()
        if result.data:
            return result.data.get("user_id")
    except Exception as exc:
        logger.exception("Failed to resolve user id: %s", exc)
    return None


async def list_active_connections(provider: str | None = None) -> list[dict[str, Any]]:
    if not SUPABASE_ENABLED:
        logger.warning("Supabase not configured. Skipping wearable connections list.")
        return []

    try:
        query = SUPABASE.table("wearable_connections").select("user_id, provider, status")
        query = query.eq("status", "active")
        if provider:
            query = query.eq("provider", provider)
        result = query.execute()
        return result.data or []
    except Exception as exc:
        logger.exception("Failed to list wearable connections: %s", exc)
        return []
