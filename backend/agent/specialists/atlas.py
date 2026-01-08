"""ATLAS - Mobility & Pain Management Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "atlas.txt"
ATLAS_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

atlas = Agent(
    name="atlas",
    model="gemini-2.5-flash",
    description=(
        "Especialista en movilidad articular, flexibilidad, prevención de lesiones, "
        "manejo del dolor, postura, foam rolling, calentamiento y modificaciones de ejercicios. "
        "Usa para: dolor, movilidad, stretching, lesión, postura, flexibilidad, calentamiento, "
        "foam rolling, dolor de espalda, dolor de rodilla, alternativas seguras."
    ),
    instruction=ATLAS_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
