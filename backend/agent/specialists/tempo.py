"""TEMPO - Cardio & HIIT Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "tempo.txt"
TEMPO_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

tempo = Agent(
    name="tempo",
    model="gemini-2.5-flash",
    description=(
        "Especialista en entrenamiento cardiovascular, HIIT, intervalos, "
        "resistencia aeróbica/anaeróbica, zonas de frecuencia cardíaca y condicionamiento. "
        "Usa para: cardio, correr, HIIT, intervalos, resistencia, frecuencia cardíaca, bicicleta, remo."
    ),
    instruction=TEMPO_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
