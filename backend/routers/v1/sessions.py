"""Session micro-action endpoints."""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException

from schemas.workout import (
    ActiveSessionResponse,
    CreateSessionRequest,
    UpdateSessionRequest,
)
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", status_code=201)
async def create_session(req: CreateSessionRequest) -> dict[str, Any]:
    """Create a new workout session."""
    try:
        session_data = {
            "user_id": req.user_id,
            "title": req.title,
            "session_type": req.session_type,
            "started_at": datetime.now().isoformat(),
            "status": "active",
            "exercises": req.exercises,
        }
        if req.season_id:
            session_data["season_id"] = req.season_id
        if req.phase_week is not None:
            session_data["phase_week"] = req.phase_week

        result = supabase.table("workout_sessions").insert(session_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create session")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{session_id}")
async def update_session(
    session_id: str, req: UpdateSessionRequest
) -> dict[str, Any]:
    """Update an existing workout session (complete, skip, etc.)."""
    try:
        update_data: dict[str, Any] = {}
        for field, value in req.model_dump(exclude_none=True).items():
            update_data[field] = value

        if req.status == "completed":
            update_data["completed_at"] = datetime.now().isoformat()

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = (
            supabase.table("workout_sessions")
            .update(update_data)
            .eq("id", session_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Session not found")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active", response_model=ActiveSessionResponse)
async def get_active_session(user_id: str = "default-user") -> ActiveSessionResponse:
    """Get the currently active workout session for a user."""
    try:
        session_result = (
            supabase.table("workout_sessions")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "active")
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )

        if not session_result.data:
            return ActiveSessionResponse(session=None, sets=[])

        session = session_result.data[0]

        sets_result = (
            supabase.table("set_logs")
            .select("*")
            .eq("session_id", session["id"])
            .order("created_at")
            .execute()
        )

        return ActiveSessionResponse(
            session=session,
            sets=sets_result.data or [],
        )
    except Exception as e:
        logger.error(f"Error fetching active session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
