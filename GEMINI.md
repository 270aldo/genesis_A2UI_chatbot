# NGX GENESIS — Gemini Context

## Overview
NGX GENESIS is a Performance & Longevity mobile platform implementing A2UI (AI-to-UI) protocol. Single unified GENESIS agent with 6 internal domains, Expo SDK 54 mobile client, FastAPI + Google ADK backend, Supabase database.

## Architecture
- **Agent**: Single `genesis` agent (gemini-2.5-flash), no sub_agents
- **Instruction file**: `backend/instructions/genesis_unified.txt` (all 6 domains consolidated)
- **Tools**: generate_widget, get_user_context, update_user_context
- **Response**: `{ text, agent: "GENESIS", operations[] }`

## A2UI Protocol
The agent generates operations that create/update/delete widget surfaces in 3 UI zones:
- **context** — persistent top bar (workout summaries, macro trackers)
- **stream** — inline with chat messages (cards, plans, checklists)
- **overlay** — floating above tab bar (live session tracker, timers)

Operations: createSurface, updateComponents, updateDataModel, deleteSurface

## ADK Patterns

### Agent Definition
```python
from google.adk.agents import Agent
genesis = Agent(
    name="genesis",
    model="gemini-2.5-flash",
    instruction=GENESIS_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
```

### CRITICAL: Template Variables
In `.txt` instruction files, NEVER use `{ variable }` — ADK interprets curly braces as context variables. Use `(variable)` instead.

### Runner
```python
async for event in runner.run_async(user_id, session_id, new_message):
    final_result = event
```

### Tool Signatures
ADK requires simple types. No `Annotated[Literal[...]]`.
```python
def generate_widget(widget_type: str, props: dict[str, Any]) -> dict:
    """Docstring is read by LLM."""
    return format_as_a2ui(widget_type, props, zone="stream")
```

## Build Commands
- `cd backend && python main.py` — FastAPI on 8000
- `cd backend && adk web ./agent` — ADK visual testing
- `make test` — pytest
- `cd apps/mobile && npx expo start` — Mobile dev

## Key Files
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server, /api/chat |
| `backend/agent/genesis.py` | Agent definition |
| `backend/instructions/genesis_unified.txt` | All domain instructions |
| `backend/tools/generate_widget.py` | Widget generation with zone routing |
| `CLAUDE.md` | Complete project context |
