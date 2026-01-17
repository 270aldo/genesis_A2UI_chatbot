from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urlencode

import httpx

from wearables.models import WearableMetrics, WearableTokens

OURA_AUTH_URL = os.getenv("OURA_AUTH_URL", "https://cloud.ouraring.com/oauth/authorize")
OURA_TOKEN_URL = os.getenv("OURA_TOKEN_URL", "https://api.ouraring.com/oauth/token")
OURA_API_BASE = os.getenv("OURA_API_BASE", "https://api.ouraring.com/v2")

OURA_CLIENT_ID = os.getenv("OURA_CLIENT_ID", "")
OURA_CLIENT_SECRET = os.getenv("OURA_CLIENT_SECRET", "")
OURA_REDIRECT_URI = os.getenv("OURA_REDIRECT_URI", "")


class OuraClient:
    def __init__(self) -> None:
        self.client_id = OURA_CLIENT_ID
        self.client_secret = OURA_CLIENT_SECRET
        self.redirect_uri = OURA_REDIRECT_URI

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret and self.redirect_uri)

    def get_authorization_url(self, state: str, scopes: list[str] | None = None) -> str:
        scopes = scopes or ["read_sleep", "read_readiness", "read_activity"]
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
        }
        return f"{OURA_AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> WearableTokens:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OURA_TOKEN_URL,
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
        async with httpx.AsyncClient() as client:
            response = await client.post(
                OURA_TOKEN_URL,
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

    async def fetch_sleep(self, access_token: str, start_date: str, end_date: str) -> dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"start_date": start_date, "end_date": end_date}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{OURA_API_BASE}/usercollection/sleep",
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


def normalize_sleep_payload(payload: dict[str, Any], user_id: str) -> list[WearableMetrics]:
    metrics: list[WearableMetrics] = []
    for record in payload.get("data", []):
        date_str = record.get("day") or record.get("day_utc")
        data_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else datetime.utcnow().date()
        metrics.append(
            WearableMetrics(
                user_id=user_id,
                provider="oura",
                data_date=data_date,
                sleep_score=record.get("score"),
                sleep_hours=(record.get("total_sleep_duration") or 0) / 3600 if record.get("total_sleep_duration") else None,
                deep_sleep_minutes=int((record.get("deep_sleep_duration") or 0) / 60) if record.get("deep_sleep_duration") else None,
                rem_sleep_minutes=int((record.get("rem_sleep_duration") or 0) / 60) if record.get("rem_sleep_duration") else None,
                light_sleep_minutes=int((record.get("light_sleep_duration") or 0) / 60) if record.get("light_sleep_duration") else None,
                awake_minutes=int((record.get("awake_time") or 0) / 60) if record.get("awake_time") else None,
                hrv_rmssd=record.get("average_hrv"),
                resting_hr=record.get("lowest_heart_rate"),
            )
        )
    return metrics
