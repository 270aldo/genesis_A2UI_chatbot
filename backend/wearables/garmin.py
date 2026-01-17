from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urlencode, parse_qs

import httpx

from wearables.models import WearableMetrics, WearableTokens

GARMIN_AUTH_URL = os.getenv("GARMIN_AUTH_URL", "https://connect.garmin.com/oauthConfirm")
GARMIN_TOKEN_URL = os.getenv("GARMIN_TOKEN_URL", "https://connectapi.garmin.com/oauth-service/oauth/access_token")
GARMIN_API_BASE = os.getenv("GARMIN_API_BASE", "https://apis.garmin.com/wellness-api/rest")

GARMIN_CLIENT_ID = os.getenv("GARMIN_CLIENT_ID", "")
GARMIN_CLIENT_SECRET = os.getenv("GARMIN_CLIENT_SECRET", "")
GARMIN_REDIRECT_URI = os.getenv("GARMIN_REDIRECT_URI", "")


class GarminClient:
    def __init__(self) -> None:
        self.client_id = GARMIN_CLIENT_ID
        self.client_secret = GARMIN_CLIENT_SECRET
        self.redirect_uri = GARMIN_REDIRECT_URI

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret and self.redirect_uri)

    def get_authorization_url(self, state: str, scopes: list[str] | None = None) -> str:
        scopes = scopes or ["activity", "heart", "sleep", "stress"]
        params = {
            "client_id": self.client_id,
            "response_type": "code",
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
        }
        return f"{GARMIN_AUTH_URL}?{urlencode(params)}"

    async def exchange_code(self, code: str) -> WearableTokens:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GARMIN_TOKEN_URL,
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
        token_data = _parse_token_response(response)
        return _tokens_from_response(token_data)

    async def refresh_access_token(self, refresh_token: str) -> WearableTokens:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GARMIN_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                },
                timeout=20.0,
            )
        response.raise_for_status()
        token_data = _parse_token_response(response)
        return _tokens_from_response(token_data)


def _parse_token_response(response: httpx.Response) -> dict[str, Any]:
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        return response.json()
    parsed = parse_qs(response.text, keep_blank_values=True)
    return {key: values[0] if values else "" for key, values in parsed.items()}


def _tokens_from_response(token_data: dict[str, Any]) -> WearableTokens:
    access_token = token_data.get("access_token") or token_data.get("oauth_token")
    refresh_token = token_data.get("refresh_token") or token_data.get("oauth_token_secret")
    expires_in = token_data.get("expires_in")
    expires_at = None
    if expires_in:
        try:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
        except ValueError:
            expires_at = None
    scopes = token_data.get("scope")
    scope_list = None
    if isinstance(scopes, str):
        scope_list = scopes.split()
    provider_user_id = token_data.get("user_id") or token_data.get("userId")
    return WearableTokens(
        access_token=access_token or "",
        refresh_token=refresh_token,
        expires_at=expires_at,
        scopes=scope_list,
        provider_user_id=provider_user_id,
    )


def parse_garmin_webhook(payload: dict[str, Any], user_id: str) -> list[WearableMetrics]:
    metrics: list[WearableMetrics] = []
    for daily in payload.get("dailies", []):
        start_ts = daily.get("startTimeInSeconds") or daily.get("summaryStartTimeInSeconds")
        if start_ts:
            data_date = datetime.utcfromtimestamp(int(start_ts)).date()
        else:
            data_date = datetime.utcnow().date()

        metrics.append(
            WearableMetrics(
                user_id=user_id,
                provider="garmin",
                data_date=data_date,
                resting_hr=daily.get("restingHeartRateInBeatsPerMinute"),
                steps=daily.get("steps") or daily.get("totalSteps"),
                active_calories=daily.get("activeKilocalories"),
                total_calories=daily.get("totalKilocalories"),
                body_battery=daily.get("bodyBatteryMostRecentValue"),
                stress_level=daily.get("averageStressLevel"),
                sleep_hours=(daily.get("sleepingSeconds") or 0) / 3600 if daily.get("sleepingSeconds") else None,
            )
        )
    return metrics
