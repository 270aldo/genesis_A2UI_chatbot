"""MACRO - Nutrition Tracking Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "macro.txt"
MACRO_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

macro = Agent(
    name="macro",
    model="gemini-2.5-flash",
    description=(
        "Especialista en tracking nutricional, macronutrientes, timing de comidas, "
        "hidratación, nutrición pre y post entreno, y registro de alimentos. "
        "Usa para: registrar comida, macros, proteína, carbohidratos, calorías diarias, "
        "hidratación, agua, pre-entreno comida, post-entreno comida, ventana anabólica."
    ),
    instruction=MACRO_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
