"""NGX GENESIS V3 - Session Store (Redis + Supabase Hybrid).

Provides sub-millisecond session access with durable fallback.

Architecture:
- Redis (Primary): Active sessions with 30-minute TTL
- Supabase (Fallback): Durable storage, session recovery

Flow:
1. Get session: Redis → hit? return : Supabase → found? hydrate Redis
2. Set session: Write to Redis, async persist to Supabase
3. On TTL expiry: Session persisted to Supabase before eviction
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Any

import redis.asyncio as redis
from dotenv import load_dotenv

from schemas.clipboard import SessionClipboard, UserProfile

load_dotenv()

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
SESSION_TTL_SECONDS = 1800  # 30 minutes

# Session key prefix
SESSION_PREFIX = "ngx:session:"
USER_PROFILE_PREFIX = "ngx:profile:"


class SessionStore:
    """Hybrid session store with Redis primary and Supabase fallback."""

    def __init__(self):
        self._redis: redis.Redis | None = None
        self._supabase: Any = None
        self._connected = False

    async def connect(self) -> None:
        """Initialize Redis connection pool."""
        if self._connected:
            return

        try:
            self._redis = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )

            # Test connection
            await self._redis.ping()
            self._connected = True
            print(f"Redis connected: {REDIS_HOST}:{REDIS_PORT}")

        except Exception as e:
            print(f"Redis connection failed: {e}")
            # Continue without Redis - will use Supabase only
            self._redis = None

        # Import Supabase client (lazy import to avoid circular deps)
        try:
            from services.supabase_client import supabase
            self._supabase = supabase
        except ImportError:
            print("Supabase client not available")

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._connected = False

    def _session_key(self, session_id: str) -> str:
        """Generate Redis key for session."""
        return f"{SESSION_PREFIX}{session_id}"

    def _profile_key(self, user_id: str) -> str:
        """Generate Redis key for user profile."""
        return f"{USER_PROFILE_PREFIX}{user_id}"

    # =========================================================================
    # Session Operations
    # =========================================================================

    async def get_session(self, session_id: str) -> SessionClipboard | None:
        """Get session from Redis, fallback to Supabase.

        Args:
            session_id: Unique session identifier

        Returns:
            SessionClipboard if found, None otherwise
        """
        await self.connect()

        # Try Redis first
        if self._redis:
            try:
                data = await self._redis.get(self._session_key(session_id))
                if data:
                    clipboard = SessionClipboard.from_redis_dict(json.loads(data))
                    # Refresh TTL on access
                    await self._redis.expire(
                        self._session_key(session_id),
                        SESSION_TTL_SECONDS
                    )
                    return clipboard
            except Exception as e:
                print(f"Redis get failed: {e}")

        # Fallback to Supabase
        if self._supabase:
            try:
                result = self._supabase.table("sessions").select("*").eq(
                    "session_id", session_id
                ).maybe_single().execute()

                if result.data:
                    clipboard = SessionClipboard.from_redis_dict(result.data["clipboard_data"])
                    # Hydrate Redis cache
                    await self._cache_session(clipboard)
                    return clipboard
            except Exception as e:
                print(f"Supabase session fetch failed: {e}")

        return None

    async def set_session(self, clipboard: SessionClipboard) -> None:
        """Save session to Redis and async persist to Supabase.

        Args:
            clipboard: Session clipboard to save
        """
        await self.connect()
        clipboard.last_activity = datetime.utcnow()

        # Write to Redis (primary)
        if self._redis:
            try:
                await self._redis.setex(
                    self._session_key(clipboard.session_id),
                    SESSION_TTL_SECONDS,
                    json.dumps(clipboard.to_redis_dict())
                )
            except Exception as e:
                print(f"Redis set failed: {e}")

        # Async persist to Supabase (background)
        asyncio.create_task(self._persist_to_supabase(clipboard))

    async def delete_session(self, session_id: str) -> None:
        """Delete session from both stores."""
        await self.connect()

        # Delete from Redis
        if self._redis:
            try:
                await self._redis.delete(self._session_key(session_id))
            except Exception as e:
                print(f"Redis delete failed: {e}")

        # Mark as ended in Supabase
        if self._supabase:
            try:
                self._supabase.table("sessions").update({
                    "ended_at": datetime.utcnow().isoformat(),
                    "status": "ended"
                }).eq("session_id", session_id).execute()
            except Exception as e:
                print(f"Supabase session end failed: {e}")

    async def _cache_session(self, clipboard: SessionClipboard) -> None:
        """Cache session in Redis."""
        if self._redis:
            try:
                await self._redis.setex(
                    self._session_key(clipboard.session_id),
                    SESSION_TTL_SECONDS,
                    json.dumps(clipboard.to_redis_dict())
                )
            except Exception as e:
                print(f"Redis cache failed: {e}")

    async def _persist_to_supabase(self, clipboard: SessionClipboard) -> None:
        """Persist session to Supabase (background task)."""
        if not self._supabase:
            return

        try:
            session_data = {
                "session_id": clipboard.session_id,
                "user_id": clipboard.user_id,
                "clipboard_data": clipboard.to_redis_dict(),
                "last_activity": clipboard.last_activity.isoformat(),
                "message_count": len(clipboard.session_context),
                "status": "active"
            }

            self._supabase.table("sessions").upsert(
                session_data,
                on_conflict="session_id"
            ).execute()
        except Exception as e:
            print(f"Supabase persist failed: {e}")

    # =========================================================================
    # User Profile Operations
    # =========================================================================

    async def get_user_profile(self, user_id: str) -> UserProfile | None:
        """Get user profile from cache or Supabase.

        Args:
            user_id: User identifier

        Returns:
            UserProfile if found, None otherwise
        """
        await self.connect()

        # Try Redis cache first
        if self._redis:
            try:
                data = await self._redis.get(self._profile_key(user_id))
                if data:
                    return UserProfile.model_validate(json.loads(data))
            except Exception as e:
                print(f"Redis profile get failed: {e}")

        # Fallback to Supabase
        if self._supabase:
            try:
                result = self._supabase.table("user_profiles").select("*").eq(
                    "user_id", user_id
                ).maybe_single().execute()

                if result.data:
                    profile = UserProfile.model_validate(result.data)
                    # Cache in Redis
                    await self._cache_profile(profile)
                    return profile
            except Exception as e:
                print(f"Supabase profile fetch failed: {e}")

        return None

    async def set_user_profile(self, profile: UserProfile) -> None:
        """Save user profile to cache and Supabase.

        Args:
            profile: User profile to save
        """
        await self.connect()
        profile.updated_at = datetime.utcnow()

        # Cache in Redis (1 hour TTL)
        if self._redis:
            try:
                await self._redis.setex(
                    self._profile_key(profile.user_id),
                    3600,  # 1 hour
                    json.dumps(profile.model_dump(mode="json"))
                )
            except Exception as e:
                print(f"Redis profile set failed: {e}")

        # Persist to Supabase
        if self._supabase:
            try:
                self._supabase.table("user_profiles").upsert(
                    profile.model_dump(mode="json"),
                    on_conflict="user_id"
                ).execute()
            except Exception as e:
                print(f"Supabase profile persist failed: {e}")

    async def _cache_profile(self, profile: UserProfile) -> None:
        """Cache profile in Redis."""
        if self._redis:
            try:
                await self._redis.setex(
                    self._profile_key(profile.user_id),
                    3600,  # 1 hour
                    json.dumps(profile.model_dump(mode="json"))
                )
            except Exception as e:
                print(f"Redis profile cache failed: {e}")

    # =========================================================================
    # Session Factory
    # =========================================================================

    async def create_session(self, session_id: str, user_id: str) -> SessionClipboard:
        """Create a new session, loading user profile if exists.

        Args:
            session_id: Unique session identifier
            user_id: User identifier

        Returns:
            New SessionClipboard with user profile loaded
        """
        # Try to load existing user profile
        profile = await self.get_user_profile(user_id)

        clipboard = SessionClipboard(
            session_id=session_id,
            user_id=user_id,
            user_profile=profile,
        )

        await self.set_session(clipboard)
        return clipboard

    async def get_or_create_session(self, session_id: str, user_id: str) -> SessionClipboard:
        """Get existing session or create new one.

        Args:
            session_id: Unique session identifier
            user_id: User identifier

        Returns:
            SessionClipboard (existing or new)
        """
        existing = await self.get_session(session_id)
        if existing:
            return existing

        return await self.create_session(session_id, user_id)


# Global session store instance
session_store = SessionStore()


# Convenience functions
async def get_session(session_id: str) -> SessionClipboard | None:
    """Get session from store."""
    return await session_store.get_session(session_id)


async def set_session(clipboard: SessionClipboard) -> None:
    """Save session to store."""
    await session_store.set_session(clipboard)


async def get_or_create_session(session_id: str, user_id: str) -> SessionClipboard:
    """Get or create session."""
    return await session_store.get_or_create_session(session_id, user_id)
