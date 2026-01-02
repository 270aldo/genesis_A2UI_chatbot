# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NGX GENESIS A2UI - Multiagent AI fitness chatbot with React frontend and FastAPI + Google ADK backend. Implements A2UI (AI-to-UI) paradigm where agents generate dynamic widgets based on user intent.

## Development Commands

```bash
# Full stack (recommended)
make dev              # Backend (8000) + Frontend (3000) simultaneously
make install          # Install all dependencies

# Individual services
make backend          # python main.py
make frontend         # npm run dev

# Testing
make test             # pytest tests/ -v
pytest tests/test_routing.py::test_blaze_routing -v  # Single test

# Docker
make docker-up        # Full stack in containers
make docker-down      # Stop containers

# ADK development
cd backend && adk web ./agent  # Visual agent testing UI
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  App.tsx → services/api.ts → POST /api/chat                 │
│  A2UIMediator renders widgets based on payload.type         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI + ADK)                     │
│  main.py → Runner.run_async() → Agent delegation            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Agent Hierarchy                           │
│  GENESIS (root_agent) → Routes based on description match   │
│      ├── BLAZE  → Strength (workout-card, timer-widget)     │
│      ├── SAGE   → Nutrition (meal-plan, recipe-card)        │
│      ├── SPARK  → Habits (checklist, daily-checkin)         │
│      ├── STELLA → Analytics (progress-dashboard)            │
│      └── LOGOS  → Education (TEXT_ONLY)                     │
└─────────────────────────────────────────────────────────────┘
```

## Response Format (CRITICAL)

Frontend expects exactly this structure from `/api/chat`:

```json
{
  "text": "Response text (markdown supported)",
  "agent": "BLAZE",
  "payload": {
    "type": "workout-card",
    "props": { ... }
  }
}
```

- `agent` must be UPPERCASE
- `payload` is optional (LOGOS typically returns none)
- `payload.type` determines which React component renders

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server, `/api/chat`, response parsing |
| `backend/agent/genesis.py` | Root orchestrator with `sub_agents=[...]` |
| `backend/agent/specialists/*.py` | Each agent loads from `instructions/*.txt` |
| `backend/tools/generate_widget.py` | Widget tool (14 types) |
| `backend/schemas/response.py` | `AgentResponse(text, agent, payload)` |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/App.tsx` | Main chat, message state, `handleSend()` |
| `frontend/services/api.ts` | Backend API client |
| `frontend/components/Widgets.tsx` | All widgets + `A2UIMediator` switch |
| `frontend/components/BaseUI.tsx` | `GlassCard`, buttons, inputs |
| `frontend/constants.ts` | Colors, agent config |

## ADK Patterns

### Agent Definition
```python
from google.adk.agents import Agent

agent = Agent(
    name="agent_name",           # lowercase, unique
    model="gemini-2.5-flash",    # always use this
    description="...",           # CRITICAL for routing - include keywords
    instruction=INSTRUCTION,     # loaded from instructions/*.txt
    tools=[generate_widget],
)
```

### Runner Usage (Async Generator)
```python
from google.genai import types

user_content = types.Content(
    role="user",
    parts=[types.Part(text=message)]
)

async for event in runner.run_async(
    user_id="default",
    session_id=session_id,
    new_message=user_content,
):
    final_result = event
```

### Tool Definition
```python
# ADK requires simple types - NO Annotated[Literal[...]]
def generate_widget(widget_type: str, props: dict[str, Any]) -> dict:
    """Docstring is read by LLM - be comprehensive."""
    return {"type": widget_type, "props": props}
```

## Agent Routing

| Query Keywords (Spanish) | Agent | Widget |
|--------------------------|-------|--------|
| entrenamiento, fuerza, rutina | BLAZE | workout-card |
| nutrición, comida, dieta | SAGE | meal-plan |
| hábitos, consistencia | SPARK | checklist |
| progreso, análisis, mindset | STELLA | progress-dashboard |
| por qué, explícame | LOGOS | None |
| hola, inicio | GENESIS | quick-actions |

## Adding New Agents

1. Create `backend/agent/specialists/new_agent.py`
2. Create `backend/instructions/new_agent.txt`
3. Add to `backend/agent/genesis.py` sub_agents list
4. Update `backend/agent/specialists/__init__.py`
5. Add routing tests in `backend/tests/`

## Adding New Widgets

1. Add props interface in `frontend/components/Widgets.tsx`
2. Create component with `GlassCard` + `AgentBadge`
3. Add case to `A2UIMediator` switch
4. Document in backend tool docstring
5. Update agent instructions

## Gotchas

- **Agent `description` is routing logic**: LLM uses it to decide which sub_agent handles query
- **Tool parameters must be simple types**: ADK can't parse `Annotated[Literal[...]]`
- **`runner.run_async()` returns async generator**: Use `async for`, not `await`
- **Message must be `types.Content`**: Not raw string
- **Response may have markdown wrapper**: Parse ` ```json ``` ` blocks
- **google-adk >= 1.1.0 required**: Not 1.21.0 (conflicts with FastAPI/starlette)
- **Frontend uses api.ts**: Not geminiService.ts (which was direct Gemini)

## Environment Variables

```bash
# backend/.env
GOOGLE_API_KEY=...      # Required
PORT=8000               # Default
CORS_ORIGINS=["*"]      # JSON array

# frontend (via Vite)
VITE_API_URL=http://localhost:8000  # Backend URL
```
