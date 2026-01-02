"""SAGE - Nutrition Science Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "sage.txt"
SAGE_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

sage = Agent(
    name="sage",
    model="gemini-2.5-flash",
    description=(
        "Especialista en ciencia nutricional, estrategia alimenticia, macronutrientes, "
        "timing nutricional, planes de comida, hidratación y recetas. "
        "Usa para: nutrición, comida, dieta, macros, calorías, comer, receta, agua, hidratación."
    ),
    instruction=SAGE_INSTRUCTION,
    tools=[generate_widget],
)
