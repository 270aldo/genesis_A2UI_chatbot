"""Daily stats endpoint."""

import logging
from datetime import date

from fastapi import APIRouter, HTTPException

from schemas.workout import TodayStatsResponse
from services.supabase_client import supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/today", response_model=TodayStatsResponse)
async def get_today_stats(user_id: str = "default-user") -> TodayStatsResponse:
    """Get aggregated training stats for today."""
    try:
        today = date.today().isoformat()

        # Check daily_stats table first (pre-aggregated)
        stats_result = (
            supabase.table("daily_stats")
            .select("*")
            .eq("user_id", user_id)
            .eq("stat_date", today)
            .maybe_single()
            .execute()
        )

        if stats_result.data:
            row = stats_result.data
            return TodayStatsResponse(
                workouts_completed=row.get("workouts_completed", 0),
                total_volume_kg=float(row.get("total_volume_kg", 0)),
                total_sets=row.get("total_sets", 0),
                total_reps=row.get("total_reps", 0),
                training_minutes=row.get("training_minutes", 0),
                streak_days=row.get("streak_days", 0),
                prs_today=row.get("prs_today", 0),
            )

        # Fallback: compute from raw tables
        sessions_result = (
            supabase.table("workout_sessions")
            .select("id, status, total_volume_kg, total_duration_minutes")
            .eq("user_id", user_id)
            .gte("started_at", f"{today}T00:00:00")
            .execute()
        )

        sessions = sessions_result.data or []
        completed = [s for s in sessions if s.get("status") == "completed"]

        total_volume = sum(float(s.get("total_volume_kg", 0) or 0) for s in completed)
        training_mins = sum(int(s.get("total_duration_minutes", 0) or 0) for s in completed)

        # Count sets
        session_ids = [s["id"] for s in sessions]
        total_sets = 0
        total_reps = 0
        prs = 0

        if session_ids:
            for sid in session_ids:
                sets_result = (
                    supabase.table("set_logs")
                    .select("reps, is_pr, is_warmup")
                    .eq("session_id", sid)
                    .execute()
                )
                for s in sets_result.data or []:
                    if not s.get("is_warmup", False):
                        total_sets += 1
                        total_reps += s.get("reps", 0) or 0
                    if s.get("is_pr", False):
                        prs += 1

        return TodayStatsResponse(
            workouts_completed=len(completed),
            total_volume_kg=total_volume,
            total_sets=total_sets,
            total_reps=total_reps,
            training_minutes=training_mins,
            streak_days=0,
            prs_today=prs,
        )
    except Exception as e:
        logger.error(f"Error fetching today stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
