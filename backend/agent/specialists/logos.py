"""LOGOS - Education & Knowledge Specialist Agent."""

from pathlib import Path

from google.adk.agents import Agent

from tools import generate_widget

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent.parent / "instructions" / "logos.txt"
LOGOS_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

logos = Agent(
    name="logos",
    model="gemini-2.5-flash",
    description=(
        "Especialista en educación, explicación del 'por qué', conocimiento científico, "
        "desmitificación y autonomía del usuario. "
        "Usa para: por qué, explícame, concepto, ciencia, teoría, es verdad que, mito."
    ),
    instruction=LOGOS_INSTRUCTION,
    tools=[generate_widget],  # Rarely used - LOGOS is primarily TEXT_ONLY
)
