"""Specialist agents for NGX GENESIS."""

# Original 5 agents
from agent.specialists.blaze import blaze
from agent.specialists.logos import logos
from agent.specialists.sage import sage
from agent.specialists.spark import spark
from agent.specialists.stella import stella

# New 7 agents (Phase 4)
from agent.specialists.tempo import tempo
from agent.specialists.atlas import atlas
from agent.specialists.wave import wave
from agent.specialists.metabol import metabol
from agent.specialists.macro import macro
from agent.specialists.nova import nova
from agent.specialists.luna import luna

__all__ = [
    # Original
    "blaze",
    "sage",
    "spark",
    "stella",
    "logos",
    # New
    "tempo",
    "atlas",
    "wave",
    "metabol",
    "macro",
    "nova",
    "luna",
]
