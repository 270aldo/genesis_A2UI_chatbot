"""NGX GENESIS V3 - CORES (Consolidated Orchestrated Response Engines).

CORES are stateless agents that receive full context via the SessionClipboard
and return responses without maintaining internal state.

Consolidation:
- Training CORE: BLAZE (strength) + TEMPO (cardio)
- Nutrition CORE: SAGE (planning) + MACRO (tracking) + NOVA (supplements)
- Recovery CORE: WAVE (HRV) + METABOL (metabolism) + ATLAS (mobility) + LUNA (cycle)
- Habits CORE: SPARK (habit formation)
- Analytics CORE: STELLA (progress tracking)
- Education CORE: LOGOS (explanations)
"""

from agent.cores.training import training_core
from agent.cores.nutrition import nutrition_core
from agent.cores.recovery import recovery_core
from agent.cores.habits import habits_core
from agent.cores.analytics import analytics_core
from agent.cores.education import education_core

__all__ = [
    "training_core",
    "nutrition_core",
    "recovery_core",
    "habits_core",
    "analytics_core",
    "education_core",
]
