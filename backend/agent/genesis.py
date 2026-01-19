"""GENESIS - Unified AI Coach (V4 Architecture).

V4 consolidates the 6 CORES into a single GENESIS agent with internal specialization:
- Training: strength, cardio, HIIT, workout programming
- Nutrition: meal planning, tracking, supplements
- Recovery: HRV, sleep, mobility, pain, cycle
- Habits: habit formation, streaks, check-ins
- Analytics: progress tracking, insights, trends
- Education: explanations, science, myth-busting (TEXT_ONLY)

GENESIS handles all queries directly using domain-specific knowledge
defined in the unified instruction file.
"""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from unified file (V4)
INSTRUCTION_PATH = Path(__file__).parent.parent / "instructions" / "genesis_unified.txt"

# Default instruction if file doesn't exist or can't be read
DEFAULT_GENESIS_INSTRUCTION = """Eres GENESIS, coach de fitness y longevidad con IA conversacional.

IMPORTANTE: Eres UNA sola entidad. NUNCA menciones "CORES", "modulos", "especialistas internos".

Tu conocimiento abarca: entrenamiento, nutricion, recuperacion, habitos, analytics, educacion.

FORMATO DE RESPUESTA:
{
  "text": "Tu respuesta (markdown permitido)",
  "agent": "GENESIS",
  "payload": {
    "type": "widget-type",
    "props": { ... }
  }
}

El campo "agent" SIEMPRE es "GENESIS". El campo "payload" es opcional.
"""

try:
    GENESIS_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")
except Exception:
    GENESIS_INSTRUCTION = DEFAULT_GENESIS_INSTRUCTION

genesis = Agent(
    name="genesis",
    model="gemini-2.5-flash",
    description=(
        "GENESIS - Coach unificado de fitness y longevidad. "
        "Especializacion interna en: entrenamiento (fuerza, cardio, HIIT), "
        "nutricion (planes, macros, suplementos), recuperacion (HRV, sueno, movilidad), "
        "habitos (consistencia, streaks), analytics (progreso, insights), "
        "y educacion (explicaciones, ciencia). "
        "Maneja todas las consultas directamente como una entidad unificada."
    ),
    instruction=GENESIS_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
    # V4: No sub_agents - all handled internally by GENESIS
)

# Export as root_agent for ADK
root_agent = genesis
