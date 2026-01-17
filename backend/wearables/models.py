from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any


@dataclass
class WearableTokens:
    access_token: str
    refresh_token: str | None = None
    expires_at: datetime | None = None
    scopes: list[str] | None = None
    provider_user_id: str | None = None


@dataclass
class WearableMetrics:
    user_id: str
    provider: str
    data_date: date
    hrv_rmssd: float | None = None
    hrv_sdnn: float | None = None
    resting_hr: int | None = None
    sleep_score: float | None = None
    sleep_hours: float | None = None
    deep_sleep_minutes: int | None = None
    rem_sleep_minutes: int | None = None
    light_sleep_minutes: int | None = None
    awake_minutes: int | None = None
    recovery_score: float | None = None
    readiness_score: float | None = None
    stress_level: int | None = None
    body_battery: int | None = None
    strain: float | None = None
    steps: int | None = None
    active_calories: int | None = None
    total_calories: int | None = None
    active_minutes: int | None = None
    synced_at: datetime | None = None
    raw_data_id: str | None = None

    def to_record(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "provider": self.provider,
            "data_date": self.data_date.isoformat(),
            "hrv_rmssd": self.hrv_rmssd,
            "hrv_sdnn": self.hrv_sdnn,
            "resting_hr": self.resting_hr,
            "sleep_score": self.sleep_score,
            "sleep_hours": self.sleep_hours,
            "deep_sleep_minutes": self.deep_sleep_minutes,
            "rem_sleep_minutes": self.rem_sleep_minutes,
            "light_sleep_minutes": self.light_sleep_minutes,
            "awake_minutes": self.awake_minutes,
            "recovery_score": self.recovery_score,
            "readiness_score": self.readiness_score,
            "stress_level": self.stress_level,
            "body_battery": self.body_battery,
            "strain": self.strain,
            "steps": self.steps,
            "active_calories": self.active_calories,
            "total_calories": self.total_calories,
            "active_minutes": self.active_minutes,
            "raw_data_id": self.raw_data_id,
            "synced_at": self.synced_at.isoformat() if self.synced_at else None,
        }
