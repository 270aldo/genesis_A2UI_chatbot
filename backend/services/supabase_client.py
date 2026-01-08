"""Supabase Client - Backend.

Provides database access and user context retrieval for ADK agents.
"""

import os
from datetime import date, datetime, timedelta
from typing import Any

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials not found. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


async def get_user_context_from_db(user_id: str) -> dict[str, Any]:
    """Retrieve comprehensive user context for ADK agents.

    Returns:
        Dict with keys: checkin, pain_zones, recent_sessions, cycle_phase, streak
    """
    context: dict[str, Any] = {
        "checkin": None,
        "pain_zones": [],
        "recent_sessions": [],
        "cycle_phase": None,
        "streak": 0,
        "hydration_today": 0,
    }

    today = date.today().isoformat()
    week_ago = (date.today() - timedelta(days=7)).isoformat()

    try:
        # Today's check-in
        checkin_result = supabase.table("daily_checkins").select("*").eq(
            "user_id", user_id
        ).eq("checkin_date", today).maybe_single().execute()

        if checkin_result.data:
            context["checkin"] = checkin_result.data
            context["pain_zones"] = checkin_result.data.get("pain_zones", [])

        # Recent workout sessions (last 7 days)
        sessions_result = supabase.table("workout_sessions").select(
            "id, title, started_at, status, total_volume_kg"
        ).eq("user_id", user_id).gte("started_at", week_ago).order(
            "started_at", desc=True
        ).limit(5).execute()

        if sessions_result.data:
            context["recent_sessions"] = sessions_result.data

        # Cycle phase (for LUNA)
        cycle_result = supabase.table("cycle_logs").select("*").eq(
            "user_id", user_id
        ).eq("log_date", today).maybe_single().execute()

        if cycle_result.data:
            context["cycle_phase"] = {
                "day": cycle_result.data.get("cycle_day"),
                "phase": cycle_result.data.get("phase"),
                "energy_modifier": cycle_result.data.get("energy_modifier"),
            }

        # Weekly summary for streak
        summary_result = supabase.table("weekly_summaries").select(
            "current_streak"
        ).eq("user_id", user_id).order("week_end", desc=True).limit(1).execute()

        if summary_result.data:
            context["streak"] = summary_result.data[0].get("current_streak", 0)

        # Today's hydration
        hydration_result = supabase.table("hydration_logs").select(
            "amount_ml"
        ).eq("user_id", user_id).gte(
            "created_at", f"{today}T00:00:00"
        ).execute()

        if hydration_result.data:
            context["hydration_today"] = sum(
                h.get("amount_ml", 0) for h in hydration_result.data
            )

    except Exception as e:
        print(f"Error fetching user context: {e}")

    return context


async def save_checkin(user_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    """Save a daily check-in to the database."""
    try:
        checkin_data = {
            "user_id": user_id,
            "checkin_date": date.today().isoformat(),
            "sleep_quality": data.get("sleep_quality"),
            "energy_level": data.get("energy_level"),
            "stress_level": data.get("stress_level"),
            "sleep_hours": data.get("sleep_hours"),
            "pain_zones": data.get("pain_zones", []),
            "notes": data.get("notes"),
        }

        result = supabase.table("daily_checkins").upsert(
            checkin_data,
            on_conflict="user_id,checkin_date"
        ).execute()

        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error saving check-in: {e}")
        return None


async def save_set_log(user_id: str, session_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    """Save a set log to the database."""
    try:
        set_data = {
            "user_id": user_id,
            "session_id": session_id,
            "exercise_name": data.get("exercise_name", "Unknown"),
            "set_number": data.get("set_number", 1),
            "weight_kg": data.get("weight_kg"),
            "reps": data.get("reps"),
            "rpe": data.get("rpe"),
            "is_warmup": data.get("is_warmup", False),
            "is_pr": data.get("is_pr", False),
            "rest_seconds": data.get("rest_seconds"),
        }

        result = supabase.table("set_logs").insert(set_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error saving set log: {e}")
        return None


async def save_pain_report(user_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    """Save a pain report to the database."""
    try:
        report_data = {
            "user_id": user_id,
            "zone": data.get("zone", "unknown"),
            "intensity": data.get("intensity", 5),
            "session_id": data.get("session_id"),
            "exercise_id": data.get("exercise_id"),
            "action_taken": data.get("action_taken"),
            "variant_used": data.get("variant_used"),
        }

        result = supabase.table("pain_reports").insert(report_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error saving pain report: {e}")
        return None


async def save_hydration(user_id: str, amount_ml: int, session_id: str | None = None) -> dict[str, Any] | None:
    """Save a hydration log entry."""
    try:
        hydration_data = {
            "user_id": user_id,
            "amount_ml": amount_ml,
            "session_id": session_id,
        }

        result = supabase.table("hydration_logs").insert(hydration_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error saving hydration: {e}")
        return None


async def create_workout_session(user_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    """Create a new workout session."""
    try:
        session_data = {
            "user_id": user_id,
            "started_at": datetime.now().isoformat(),
            "status": "active",
            "title": data.get("title", "Workout"),
            "session_type": data.get("session_type", "strength"),
        }

        result = supabase.table("workout_sessions").insert(session_data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error creating workout session: {e}")
        return None


async def complete_workout_session(session_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    """Mark a workout session as completed."""
    try:
        update_data = {
            "completed_at": datetime.now().isoformat(),
            "status": "completed",
            "total_volume_kg": data.get("total_volume_kg"),
            "total_duration_minutes": data.get("total_duration_minutes"),
            "exercises_completed": data.get("exercises_completed"),
            "rating": data.get("rating"),
            "notes": data.get("notes"),
        }

        result = supabase.table("workout_sessions").update(update_data).eq(
            "id", session_id
        ).execute()

        return result.data[0] if result.data else None
    except Exception as e:
        print(f"Error completing workout session: {e}")
        return None


async def log_widget_event(
    user_id: str,
    event_type: str,
    widget_id: str,
    widget_type: str,
    agent_id: str | None = None,
    properties: dict[str, Any] | None = None,
) -> None:
    """Log a widget telemetry event."""
    try:
        event_data = {
            "user_id": user_id,
            "event_type": event_type,
            "widget_id": widget_id,
            "widget_type": widget_type,
            "agent_id": agent_id,
            "properties": properties or {},
            "platform": "web",
            "client_version": "1.0.0",
        }

        supabase.table("widget_events").insert(event_data).execute()
    except Exception as e:
        print(f"Error logging widget event: {e}")
