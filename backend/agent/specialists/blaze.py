"""BLAZE - Strength Training Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "blaze.txt"
BLAZE_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

blaze = Agent(
    name="blaze",
    model="gemini-2.5-flash",
    description=(
        "Especialista en entrenamiento de fuerza, hipertrofia, periodización, "
        "rutinas de ejercicio, series, repeticiones, cargas y técnica. "
        "Usa para: entrenar, rutina, ejercicio, fuerza, músculo, gym, pesas, sets, reps."
    ),
    instruction=BLAZE_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
