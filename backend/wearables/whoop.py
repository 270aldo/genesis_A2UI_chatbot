from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urlencode

import httpx

from wearables.models import WearableMetrics, WearableTokens

WHOOP_AUTH_URL = os.getenv("WHOOP_AUTH_URL", "")
WHOOP_TOKEN_URL = os.getenv("WHOOP_TOKEN_URL", "")
WHOOP_API_BASE = os.getenv("WHOOP_API_BASE", "https://api.prod.whoop.com/developer")

WHOOP_CLIENT_ID = os.getenv("WHOOP_CLIENT_ID", "")
WHOOP_CLIENT_SECRET = os.getenv("WHOOP_CLIENT_SECRET", "")
WHOOP_REDIRECT_URI = os.getenv("WHOOP_REDIRECT_URI", "")


class WhoopClient:
    def __init__(self) -> None:
        self.client_id = WHOOP_CLIENT_ID
        self.client_secret = WHOOP_CLIENT_SECRET
        self.redirect_uri = WHOOP_REDIRECT_URI

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret and self.redirect_uri and WHOOP_AUTH_URL and WHOOP_TOKEN_URL)

    def get_authorization_url(self, state: str, scopes: list[str] | None = None) -> str:
        if not WHOOP_AUTH_URL:
            raise RuntimeError("WHOOP_AUTH_URL not configured")
        scopes = scopes or ["read:recovery", "read:cycles", "read:sleep"]
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
        }
        return f"{WHOOP_AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> WearableTokens:
        if not WHOOP_TOKEN_URL:
            raise RuntimeError("WHOOP_TOKEN_URL not configured")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                WHOOP_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                },
                timeout=20.0,
            )
        response.raise_for_status()
        token_data = response.json()
        return _tokens_from_response(token_data)

    async def refresh_access_token(self, refresh_token: str) -> WearableTokens:
        if not WHOOP_TOKEN_URL:
            raise RuntimeError("WHOOP_TOKEN_URL not configured")
        async with httpx.AsyncClient() as client:
            response = await client.post(
                WHOOP_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                timeout=20.0,
            )
        response.raise_for_status()
        token_data = response.json()
        return _tokens_from_response(token_data)

    async def fetch_recovery(self, access_token: str, start_date: str, end_date: str) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"start": start_date, "end": end_date}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{WHOOP_API_BASE}/v1/recovery",
                headers=headers,
                params=params,
                timeout=20.0,
            )
        response.raise_for_status()
        return response.json()


def _tokens_from_response(token_data: dict[str, Any]) -> WearableTokens:
    expires_at = None
    expires_in = token_data.get("expires_in")
    if expires_in:
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
        except ValueError:
            expires_at = None

    scopes = token_data.get("scope")
    scope_list = None
    if isinstance(scopes, str):
        scope_list = scopes.split()

    return WearableTokens(
        access_token=token_data.get("access_token", ""),
        refresh_token=token_data.get("refresh_token"),
        expires_at=expires_at,
        scopes=scope_list,
        provider_user_id=token_data.get("user_id"),
    )


def normalize_recovery_payload(payload: dict[str, Any], user_id: str) -> list[WearableMetrics]:
    metrics: list[WearableMetrics] = []
    for record in payload.get("records", []):
        date_str = record.get("date") or record.get("created_at")
        if date_str:
            try:
                data_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
            except ValueError:
                data_date = datetime.utcnow().date()
        else:
            data_date = datetime.utcnow().date()

        score = record.get("score", {})
        strain = record.get("strain", {})
        metrics.append(
            WearableMetrics(
                user_id=user_id,
                provider="whoop",
                data_date=data_date,
                recovery_score=score.get("recovery_score"),
                hrv_rmssd=score.get("hrv_rmssd_milli"),
                resting_hr=score.get("resting_heart_rate"),
                strain=strain.get("score"),
            )
        )
    return metrics
