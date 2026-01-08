"""NOVA - Supplements Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "nova.txt"
NOVA_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

nova = Agent(
    name="nova",
    model="gemini-2.5-flash",
    description=(
        "Especialista en suplementación deportiva, vitaminas, minerales, proteína en polvo, "
        "pre-workouts, creatina, timing de suplementos e interacciones. "
        "Usa para: suplementos, creatina, proteína polvo, vitaminas, minerales, pre-workout, "
        "whey, omega-3, interacciones suplementos, qué suplemento tomar."
    ),
    instruction=NOVA_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
