# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NGX GENESIS A2UI V3 - Multiagent AI fitness chatbot with React frontend and FastAPI + Google ADK backend. Implements A2UI (AI-to-UI) paradigm where agents generate dynamic widgets based on user intent.

**V3 Architecture**: Consolidated 12 specialists into 6 CORES (Consolidated Orchestrated Response Engines) with stateless operation via Session Clipboard pattern.

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

## Architecture (V3 - CORES)

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
│  SessionClipboard (Redis + Supabase) for state              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    GENESIS Orchestrator                      │
│  Unified identity - users only see "GENESIS"                │
│  Routes to 6 stateless CORES based on intent                │
├─────────────────────────────────────────────────────────────┤
│  Training CORE    → BLAZE+TEMPO (workout, cardio, HIIT)     │
│  Nutrition CORE   → SAGE+MACRO+NOVA (meals, tracking, supps)│
│  Recovery CORE    → WAVE+METABOL+ATLAS+LUNA (HRV, sleep)    │
│  Habits CORE      → SPARK (habits, streaks, check-ins)      │
│  Analytics CORE   → STELLA (progress, insights, trends)     │
│  Education CORE   → LOGOS (explanations, TEXT_ONLY)         │
└─────────────────────────────────────────────────────────────┘
```

## Response Format (CRITICAL)

Frontend expects exactly this structure from `/api/chat`:

```json
{
  "text": "Response text (markdown supported)",
  "agent": "GENESIS",
  "payload": {
    "type": "workout-card",
    "props": { ... }
  }
}
```

- **V3**: `agent` is ALWAYS "GENESIS" - unified identity regardless of which CORE processed the request
- `payload` is optional (Education CORE typically returns none)
- `payload.type` determines which React component renders
- Widget colors are determined by `category` (training, nutrition, recovery, etc.), not by agent

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server, `/api/chat`, response parsing |
| `backend/agent/genesis.py` | Root orchestrator with `sub_agents=[...]` |
| `backend/agent/cores/*.py` | V3 CORES (Training, Nutrition, etc.) |
| `backend/tools/generate_widget.py` | Widget tool (40+ types) |
| `backend/schemas/response.py` | `AgentResponse(text, agent="GENESIS", payload)` |
| `backend/voice/` | Voice engine module (Gemini Live + ElevenLabs) |
| `backend/services/crypto.py` | Fernet encryption for OAuth tokens |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/App.tsx` | Main chat, message state, `handleSend()` |
| `frontend/services/api.ts` | Backend API client |
| `frontend/components/Widgets.tsx` | All widgets + `A2UIMediator` switch |
| `frontend/components/BaseUI.tsx` | `GlassCard`, buttons, inputs |
| `frontend/constants.ts` | GENESIS brand colors, category colors |
| `frontend/types/voice.ts` | Voice mode types (WebSocket, states) |

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

| Query Keywords (Spanish) | Agent | Primary Widgets |
|--------------------------|-------|-----------------|
| entrenamiento, fuerza, rutina, ejercicio | BLAZE | workout-card, live-session-tracker |
| nutrición, comida, dieta, macros, calorías | SAGE | meal-plan, recipe-card, smart-grocery-list |
| hábitos, consistencia, sueño, motivación | SPARK | checklist, daily-checkin, habit-streak |
| progreso, análisis, datos, mindset | STELLA | insight-card, progress-dashboard |
| por qué, explícame, concepto | LOGOS | None (TEXT_ONLY) |
| hola, inicio | GENESIS | quick-actions |

## Adding New CORES (V3)

1. Create `backend/agent/cores/new_core.py`
2. Create `backend/instructions/new_core.txt`
3. Add to `backend/agent/genesis.py` sub_agents list
4. Update `backend/agent/cores/__init__.py`
5. Add routing tests in `backend/tests/`

**Note**: V3 uses unified GENESIS identity. All responses appear from "GENESIS" regardless of which CORE processed them.

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
- **CRITICAL - ADK Template Variables**: In instruction `.txt` files, avoid `{ variable }` syntax as ADK interprets curly braces as context variables. Use `(variable)` instead to document payload structures

## Voice Engine

Real-time voice interaction using **Gemini Live API (STT + LLM)** and **ElevenLabs (TTS)**.

### Architecture
```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Frontend       │◄──────────────────►│  Backend        │
│  VoiceMode.tsx  │   /ws/voice        │  voice/router   │
│  ParticleOrb    │                    │  voice/session  │
│  useVoiceSession│                    │                 │
└─────────────────┘                    └────────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
           ┌────────▼────────┐         ┌────────▼────────┐         ┌────────▼────────┐
           │  Gemini Live    │         │  tts_text_queue │         │  ElevenLabs     │
           │  STT + LLM      │────────►│  (async queue)  │────────►│  TTS Streaming  │
           │  TEXT mode      │         │                 │         │  WebSocket      │
           └─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Pipeline**: Audio → Gemini (STT+LLM, TEXT only) → Queue → ElevenLabs (TTS) → Audio

### Key Files
| File | Purpose |
|------|---------|
| `backend/voice/router.py` | WebSocket `/ws/voice` endpoint |
| `backend/voice/session.py` | Voice session manager + TTS pipeline |
| `backend/voice/gemini_live.py` | Gemini Live API client (TEXT mode) |
| `backend/voice/elevenlabs_client.py` | ElevenLabs WebSocket TTS |
| `backend/voice/audio_utils.py` | PCM encoding/decoding |
| `frontend/components/voice/VoiceMode.tsx` | Full-screen voice UI |
| `frontend/components/voice/ParticleOrb.tsx` | Animated orb visualization |
| `frontend/hooks/useVoiceSession.ts` | Voice state management |
| `frontend/services/voiceApi.ts` | WebSocket client |

### Audio Format
- **Input**: PCM 16-bit signed, little-endian, 16kHz mono
- **Output**: PCM 16-bit signed, little-endian, 24kHz mono (ElevenLabs)
- **Transport**: Base64 encoded over JSON WebSocket

### Voice States
- `idle`: Ready, particles floating gently
- `listening`: User speaking, particles expanding
- `processing`: Gemini processing, particles spinning
- `speaking`: GENESIS responding, particles pulsing

### WebSocket Protocol
```typescript
// Client → Server
{ type: 'audio_chunk', data: '<base64 PCM>' }
{ type: 'end_turn' }
{ type: 'cancel' }

// Server → Client
{ type: 'transcript', text: '...', final: boolean }
{ type: 'audio_chunk', data: '<base64 PCM>' }
{ type: 'state', value: 'listening' | 'processing' | 'speaking' }
{ type: 'widget', payload: WidgetPayload }
{ type: 'end_response' }
{ type: 'error', message: '...' }
```

## Supabase Database (V3 Schema)

Project: `genesis_A2UI` (xaxygzwoouaiguyuwpvf)

### V3 Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `sessions` | Clipboard persistence | session_id, user_id, clipboard_data (JSONB), status |
| `user_profiles` | Extended user profiles | fitness_level, goals, wearables, preferences |
| `conversation_messages` | Chat history | session_id, role, content, agent, widget_type |
| `routing_history` | CORE routing analytics | selected_core, confidence, response_time_ms |
| `wearable_connections` | OAuth tokens | provider (garmin/oura/whoop/apple), tokens, scopes |
| `wearable_data` | Normalized metrics | HRV, sleep, recovery, steps (24 columns) |
| `wearable_raw` | Raw API payloads | endpoint, payload (JSONB) |

### Operational Tables

| Table | Purpose |
|-------|---------|
| `daily_checkins` | Daily check-ins (SPARK) |
| `workout_sessions` | Training sessions |
| `set_logs` | Exercise set details |
| `widget_events` | Widget analytics |

### Views

| View | Definition |
|------|------------|
| `active_sessions` | workout_sessions WHERE status='active' |
| `todays_checkin` | daily_checkins WHERE date=today |

### Migrations

```bash
# Migration files (timestamp format required by Supabase CLI)
supabase/migrations/
├── 20260107000001_clipboard_schema.sql    # Initial clipboard + sessions
├── 20260107000002_v3_schema_upgrade.sql   # V3 full schema
└── 20260117000003_security_hardening.sql  # RLS policies (auth.uid())
```

### Security
- **OAuth Token Encryption**: `backend/services/crypto.py` encrypts wearable tokens at rest using Fernet
- **RLS Policies**: All user tables enforce `auth.uid()::text = user_id`
- **Graceful Degradation**: If `ENCRYPTION_KEY` not set, tokens stored unencrypted (dev mode)

## Environment Variables

```bash
# backend/.env
GOOGLE_API_KEY=...        # Required for chat and voice (Gemini)
ELEVENLABS_API_KEY=...    # Required for TTS streaming
ENCRYPTION_KEY=...        # Optional: Fernet key for OAuth token encryption
PORT=8000                 # Default
CORS_ORIGINS=["*"]        # JSON array

# Supabase (optional - falls back to mock)
SUPABASE_URL=https://xaxygzwoouaiguyuwpvf.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# frontend (via Vite)
VITE_API_URL=http://localhost:8000  # Backend URL
```

## CLI Commands

```bash
# Supabase (use CLI, not MCP plugin)
supabase login                    # Authenticate
supabase link --project-ref ...   # Link project
supabase db push                  # Apply migrations
supabase migration list           # Check status
```
