"""GENESIS - Central Orchestrator Agent."""

from pathlib import Path

from google.adk.agents import Agent

from agent.specialists import blaze, logos, sage, spark, stella
from tools import generate_widget, get_user_context, update_user_context

# Load instruction from file
INSTRUCTION_PATH = Path(__file__).parent.parent / "instructions" / "genesis.txt"
GENESIS_INSTRUCTION = INSTRUCTION_PATH.read_text(encoding="utf-8")

genesis = Agent(
    name="genesis",
    model="gemini-2.5-flash",
    description=(
        "Orquestador central de NGX GENESIS. "
        "Recibe todas las consultas, clasifica la intención, "
        "y delega al especialista apropiado."
    ),
    instruction=GENESIS_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
    sub_agents=[blaze, sage, spark, stella, logos],
)

# Export as root_agent for ADK
root_agent = genesis
