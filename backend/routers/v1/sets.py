"""Set logging micro-action endpoint with PR detection."""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException

from schemas.workout import LogSetRequest, LogSetResponse
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sets", tags=["sets"])


def _detect_pr(
    user_id: str, exercise_name: str, weight_kg: float, reps: int, session_id: str
) -> tuple[bool, str | None]:
    """Check if this set is a personal record. Returns (is_pr, pr_type)."""
    try:
        volume = weight_kg * reps

        result = (
            supabase.table("personal_records")
            .select("*")
            .eq("user_id", user_id)
            .eq("exercise_name", exercise_name)
            .maybe_single()
            .execute()
        )

        existing = result.data
        is_pr = False
        pr_type = None

        if not existing:
            # First time doing this exercise — it's a PR by definition
            supabase.table("personal_records").insert(
                {
                    "user_id": user_id,
                    "exercise_name": exercise_name,
                    "best_weight_kg": weight_kg,
                    "best_reps": reps,
                    "best_volume": volume,
                    "achieved_at": datetime.now().isoformat(),
                    "session_id": session_id,
                }
            ).execute()
            is_pr = True
            pr_type = "first"
        else:
            update_fields: dict[str, Any] = {}

            if volume > (existing.get("best_volume") or 0):
                update_fields["best_volume"] = volume
                is_pr = True
                pr_type = "volume"

            if weight_kg > (existing.get("best_weight_kg") or 0):
                update_fields["best_weight_kg"] = weight_kg
                if pr_type:
                    pr_type = "weight+volume"
                else:
                    is_pr = True
                    pr_type = "weight"

            if is_pr and update_fields:
                update_fields["best_reps"] = reps
                update_fields["achieved_at"] = datetime.now().isoformat()
                update_fields["session_id"] = session_id

                (
                    supabase.table("personal_records")
                    .update(update_fields)
                    .eq("user_id", user_id)
                    .eq("exercise_name", exercise_name)
                    .execute()
                )

        return is_pr, pr_type
    except Exception as e:
        logger.warning(f"PR detection failed (non-blocking): {e}")
        return False, None


@router.post("", status_code=201, response_model=LogSetResponse)
async def log_set(req: LogSetRequest) -> LogSetResponse:
    """Log a single set and detect PRs."""
    try:
        # Detect PR before inserting
        is_pr, pr_type = _detect_pr(
            req.user_id,
            req.exercise_name,
            req.weight_kg,
            req.reps,
            req.session_id,
        )

        set_data = {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "exercise_name": req.exercise_name,
            "set_number": req.set_number,
            "exercise_order": req.exercise_order,
            "weight_kg": req.weight_kg,
            "reps": req.reps,
            "rpe": req.rpe,
            "is_warmup": req.is_warmup,
            "is_pr": is_pr,
            "rest_seconds": req.rest_seconds,
            "logged_at": datetime.now().isoformat(),
        }

        result = supabase.table("set_logs").insert(set_data).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to log set")

        set_id = result.data[0]["id"]

        # Calculate running session totals
        all_sets = (
            supabase.table("set_logs")
            .select("weight_kg, reps")
            .eq("session_id", req.session_id)
            .eq("is_warmup", False)
            .execute()
        )

        total_volume = sum(
            (s.get("weight_kg", 0) or 0) * (s.get("reps", 0) or 0)
            for s in (all_sets.data or [])
        )
        set_count = len(all_sets.data or [])

        return LogSetResponse(
            set_id=str(set_id),
            is_pr=is_pr,
            pr_type=pr_type,
            total_session_volume=total_volume,
            set_count=set_count,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging set: {e}")
        raise HTTPException(status_code=500, detail=str(e))
