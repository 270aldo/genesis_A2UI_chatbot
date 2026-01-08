"""LUNA - Hormonal & Cycle Optimization Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "luna.txt"
LUNA_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

luna = Agent(
    name="luna",
    model="gemini-2.5-flash",
    description=(
        "Especialista en ciclo menstrual, fases hormonales, entrenamiento según ciclo, "
        "nutrición hormonal, síntomas menstruales y optimización del rendimiento femenino. "
        "Usa para: ciclo menstrual, periodo, menstruación, fase luteal, fase folicular, "
        "ovulación, PMS, calambres, hormonas, entrenamiento mujer, menopausia."
    ),
    instruction=LUNA_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
