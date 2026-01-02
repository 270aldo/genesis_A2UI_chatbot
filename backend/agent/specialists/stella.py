"""STELLA - Mindset & Data Analysis Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "stella.txt"
STELLA_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

stella = Agent(
    name="stella",
    model="gemini-2.5-flash",
    description=(
        "Especialista en mindset, rendimiento mental, análisis de progreso, "
        "visualización de datos, insights y barreras psicológicas. "
        "Usa para: progreso, datos, análisis, mindset, estrés, cómo voy, métricas, mental."
    ),
    instruction=STELLA_INSTRUCTION,
    tools=[generate_widget],
)
