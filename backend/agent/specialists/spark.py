"""SPARK - Habit Formation Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "spark.txt"
SPARK_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

spark = Agent(
    name="spark",
    model="gemini-2.5-flash",
    description=(
        "Especialista en formación de hábitos, consistencia, motivación, "
        "check-ins diarios, rutinas, gamificación y accountability. "
        "Usa para: hábitos, consistencia, motivación, check-in, rutina diaria, no puedo, difícil."
    ),
    instruction=SPARK_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
