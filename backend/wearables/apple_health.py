from __future__ import annotations

from datetime import datetime
from typing import Any

from wearables.models import WearableMetrics


class AppleHealthBridge:
    def normalize_payload(self, payload: dict[str, Any], user_id: str) -> WearableMetrics:
        date_str = payload.get("date")
        if date_str:
            try:
                data_date = datetime.fromisoformat(date_str).date()
            except ValueError:
                data_date = datetime.utcnow().date()
        else:
            data_date = datetime.utcnow().date()

        def _safe_div(value: Any, divisor: float) -> float | None:
            try:
                return float(value) / divisor
            except (TypeError, ValueError):
                return None

        return WearableMetrics(
            user_id=user_id,
            provider="apple",
            data_date=data_date,
            hrv_sdnn=payload.get("HKQuantityTypeIdentifierHeartRateVariabilitySDNN"),
            resting_hr=payload.get("HKQuantityTypeIdentifierRestingHeartRate"),
            steps=payload.get("HKQuantityTypeIdentifierStepCount"),
            sleep_hours=_safe_div(payload.get("HKCategoryTypeIdentifierSleepAnalysis"), 3600),
            active_calories=payload.get("HKQuantityTypeIdentifierActiveEnergyBurned"),
        )
