"""WAVE - Recovery & HRV Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "wave.txt"
WAVE_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

wave = Agent(
    name="wave",
    model="gemini-2.5-flash",
    description=(
        "Especialista en recuperación, HRV, calidad del sueño, deload, periodización, "
        "estrés, sistema nervioso, readiness y balance simpático/parasimpático. "
        "Usa para: recuperación, HRV, sueño, descanso, fatiga, sobreentrenamiento, "
        "deload, estrés, variabilidad cardíaca, readiness."
    ),
    instruction=WAVE_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
