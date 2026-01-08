"""METABOL - Metabolic Health Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "metabol.txt"
METABOL_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

metabol = Agent(
    name="metabol",
    model="gemini-2.5-flash",
    description=(
        "Especialista en salud metabólica, BMR, TDEE, sensibilidad a insulina, "
        "composición corporal, glucosa, ayuno intermitente, flexibilidad metabólica y reverse dieting. "
        "Usa para: metabolismo, calorías, TDEE, ayuno, glucosa, insulina, composición corporal, "
        "grasa corporal, masa muscular, metabolismo basal."
    ),
    instruction=METABOL_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
