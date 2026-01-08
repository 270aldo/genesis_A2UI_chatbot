"""GENESIS - Central Orchestrator Agent."""

from pathlib import Path

from google.adk.agents import Agent

from agent.specialists import (
    # Original 5 agents
    blaze,
    logos,
    sage,
    spark,
    stella,
    # New 7 agents (Phase 4)
    tempo,
    atlas,
    wave,
    metabol,
    macro,
    nova,
    luna,
)
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
    sub_agents=[
        # Strength & Training
        blaze,      # Strength training
        tempo,      # Cardio & HIIT
        # Nutrition & Supplements
        sage,       # Nutrition planning
        macro,      # Nutrition tracking
        nova,       # Supplements
        metabol,    # Metabolic health
        # Recovery & Health
        wave,       # Recovery & HRV
        atlas,      # Mobility & Pain
        luna,       # Hormonal & Cycle
        # Mindset & Habits
        spark,      # Habits & Motivation
        stella,     # Analytics & Mindset
        # Education
        logos,      # Education (TEXT_ONLY)
    ],
)

# Export as root_agent for ADK
root_agent = genesis
