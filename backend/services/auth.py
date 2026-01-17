"""Authentication helpers for backend endpoints."""

from __future__ import annotations

import os
from typing import Mapping

import jwt
from fastapi import HTTPException, Request
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SYNC_AUTH_AUDIENCE = os.getenv("SYNC_AUTH_AUDIENCE", "") or os.getenv("API_BASE_URL", "")
SYNC_API_KEY = os.getenv("SYNC_API_KEY", "")


def _extract_bearer_token(headers: Mapping[str, str]) -> str | None:
    auth_header = headers.get("authorization") or headers.get("Authorization")
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


def _decode_supabase_jwt(token: str) -> str | None:
    if not SUPABASE_JWT_SECRET:
        return None
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
    except Exception:
        return None
    return payload.get("sub") or payload.get("user_id")


def resolve_user_id_from_headers(headers: Mapping[str, str], fallback: str) -> str:
    token = _extract_bearer_token(headers)
    if token:
        user_id = _decode_supabase_jwt(token)
        if user_id:
            return user_id
    return fallback


def resolve_user_id_from_request(request: Request, fallback: str) -> str:
    return resolve_user_id_from_headers(request.headers, fallback)


def verify_internal_request(request: Request) -> None:
    if SYNC_API_KEY:
        api_key = request.headers.get("x-api-key") or request.headers.get("X-API-Key")
        bearer = _extract_bearer_token(request.headers)
        if api_key == SYNC_API_KEY or bearer == SYNC_API_KEY:
            return

    if SYNC_AUTH_AUDIENCE:
        token = _extract_bearer_token(request.headers)
        if not token:
            raise HTTPException(status_code=401, detail="Missing auth token")
        try:
            google_id_token.verify_oauth2_token(token, GoogleRequest(), SYNC_AUTH_AUDIENCE)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid auth token")
        return

    if SYNC_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid sync API key")
