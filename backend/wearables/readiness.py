from __future__ import annotations

from typing import Iterable

from wearables.models import WearableMetrics


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def _score_from_range(value: float, low: float, high: float) -> float:
    if high == low:
        return 50.0
    return _clamp((value - low) / (high - low) * 100.0)


def _weighted_average(scores: Iterable[tuple[float, float]]) -> float | None:
    total_weight = 0.0
    total_score = 0.0
    for score, weight in scores:
        total_weight += weight
        total_score += score * weight
    if total_weight <= 0:
        return None
    return total_score / total_weight


def calculate_readiness(metrics: WearableMetrics, baselines: dict[str, float] | None = None) -> float | None:
    """Calculate a normalized readiness score (0-100) from wearable metrics.

    Uses a weighted blend of available signals. Baselines are optional.
    """
    baselines = baselines or {}
    scored: list[tuple[float, float]] = []

    if metrics.sleep_score is not None:
        scored.append((_clamp(metrics.sleep_score), 0.30))
    elif metrics.sleep_hours is not None:
        scored.append((_score_from_range(metrics.sleep_hours, 5.0, 9.0), 0.20))

    if metrics.hrv_rmssd is not None:
        baseline = baselines.get("hrv_rmssd")
        if baseline:
            deviation = (metrics.hrv_rmssd - baseline) / baseline
            scored.append((_clamp(50.0 + deviation * 50.0), 0.30))
        else:
            scored.append((_score_from_range(metrics.hrv_rmssd, 20.0, 120.0), 0.25))

    if metrics.resting_hr is not None:
        baseline = baselines.get("resting_hr")
        if baseline:
            deviation = (baseline - metrics.resting_hr) / baseline
            scored.append((_clamp(50.0 + deviation * 50.0), 0.20))
        else:
            score = _score_from_range(90.0 - metrics.resting_hr, 10.0, 50.0)
            scored.append((score, 0.15))

    if metrics.recovery_score is not None:
        scored.append((_clamp(metrics.recovery_score), 0.20))

    if metrics.body_battery is not None:
        scored.append((_clamp(metrics.body_battery), 0.15))

    if metrics.strain is not None:
        strain_score = _clamp(100.0 - _score_from_range(metrics.strain, 0.0, 21.0))
        scored.append((strain_score, 0.10))

    return _weighted_average(scored)
