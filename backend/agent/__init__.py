"""NGX A2UI Agent System (V4 Architecture).

This module exports the root_agent (GENESIS) for use with ADK Runner.
V4 uses a unified GENESIS agent with internal specialization instead of sub_agents.
"""

from agent.genesis import genesis, root_agent

__all__ = ["genesis", "root_agent"]
