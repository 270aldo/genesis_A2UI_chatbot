"""Workout schemas for micro-action endpoints."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class CreateSessionRequest(BaseModel):
    """Request body for POST /api/v1/sessions."""

    user_id: str = Field(default="default-user")
    title: str = Field(default="Workout")
    session_type: str = Field(default="strength")
    exercises: list[dict[str, Any]] = Field(default_factory=list)
    season_id: Optional[str] = Field(default=None)
    phase_week: Optional[int] = Field(default=None)


class UpdateSessionRequest(BaseModel):
    """Request body for PATCH /api/v1/sessions/{session_id}."""

    status: Optional[str] = Field(default=None)
    total_volume_kg: Optional[float] = Field(default=None)
    total_duration_minutes: Optional[int] = Field(default=None)
    exercises_completed: Optional[int] = Field(default=None)
    duration_mins: Optional[int] = Field(default=None)
    rating: Optional[int] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    genesis_note: Optional[str] = Field(default=None)


class LogSetRequest(BaseModel):
    """Request body for POST /api/v1/sets."""

    user_id: str = Field(default="default-user")
    session_id: str
    exercise_name: str
    set_number: int = Field(default=1)
    exercise_order: int = Field(default=0)
    weight_kg: float
    reps: int
    rpe: Optional[float] = Field(default=None)
    is_warmup: bool = Field(default=False)
    rest_seconds: Optional[int] = Field(default=None)


class LogSetResponse(BaseModel):
    """Response from POST /api/v1/sets."""

    set_id: str
    is_pr: bool = Field(default=False)
    pr_type: Optional[str] = Field(default=None)
    total_session_volume: float = Field(default=0)
    set_count: int = Field(default=0)


class ActiveSessionResponse(BaseModel):
    """Response from GET /api/v1/sessions/active."""

    session: Optional[dict[str, Any]] = Field(default=None)
    sets: list[dict[str, Any]] = Field(default_factory=list)


class TodayStatsResponse(BaseModel):
    """Response from GET /api/v1/stats/today."""

    workouts_completed: int = Field(default=0)
    total_volume_kg: float = Field(default=0)
    total_sets: int = Field(default=0)
    total_reps: int = Field(default=0)
    training_minutes: int = Field(default=0)
    streak_days: int = Field(default=0)
    prs_today: int = Field(default=0)
