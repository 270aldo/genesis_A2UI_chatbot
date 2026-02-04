# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NGX GENESIS A2UI V4 - Unified AI fitness coach with React web frontend, Expo React Native mobile app, and FastAPI + Google ADK backend. Implements A2UI (AI-to-UI) paradigm where the agent generates dynamic widgets based on user intent.

**V4 Architecture**: Single unified GENESIS agent with internal specialization across 6 domains (Training, Nutrition, Recovery, Habits, Analytics, Education). No sub_agents - all knowledge is consolidated in one instruction file.

**Clients**: Web (`frontend/`) and Mobile (`apps/mobile/`) — both consume the same backend API and render A2UI widgets.

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
pytest tests/test_routing.py::test_training_domain -v  # Single test

# Mobile (Expo)
cd apps/mobile && npx expo start           # Dev server
cd apps/mobile && npx expo start --ios     # Launch iOS simulator
cd apps/mobile && npx tsc --noEmit         # TypeScript check

# Docker
make docker-up        # Full stack in containers
make docker-down      # Stop containers

# ADK development
cd backend && adk web ./agent  # Visual agent testing UI
```

## Architecture (V4 - Unified GENESIS)

```
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│       Web Frontend (React)       │ │  Mobile (Expo/React Native)      │
│  App.tsx → services/api.ts       │ │  5-tab nav + chat modal          │
│  A2UIMediator → widgets          │ │  A2UIMediator → widgets          │
└───────────────┬──────────────────┘ └───────────────┬──────────────────┘
                │ HTTP POST /api/chat                │ HTTP POST /api/chat
                └───────────────┬────────────────────┘
┌──────────────────────────────▼──────────────────────────────┐
│                  Backend (FastAPI + ADK)                     │
│  main.py → Runner.run_async() → Single GENESIS agent        │
│  SessionClipboard (Redis + Supabase) for state              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    GENESIS (Unified Agent)                   │
│  Single agent with internal domain specialization           │
│  All responses come from "GENESIS"                          │
├─────────────────────────────────────────────────────────────┤
│  Training    → workout, cardio, HIIT, strength, gym         │
│  Nutrition   → meals, macros, supplements, hydration        │
│  Recovery    → HRV, sleep, mobility, pain, cycle            │
│  Habits      → streaks, check-ins, consistency, motivation  │
│  Analytics   → progress, insights, trends, metrics          │
│  Education   → explanations, science, myth-busting (TEXT)   │
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

- **V4**: `agent` is ALWAYS "GENESIS" - single unified identity
- `payload` is optional (Education domain typically returns none)
- `payload.type` determines which React component renders
- Widget colors are determined by `category` (training, nutrition, recovery, etc.)

## Key Files

### Backend
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server, `/api/chat`, response parsing |
| `backend/agent/genesis.py` | Unified GENESIS agent (no sub_agents) |
| `backend/instructions/genesis_unified.txt` | Consolidated instruction file (all 6 domains) |
| `backend/tools/generate_widget.py` | Widget tool (40+ types) |
| `backend/schemas/response.py` | `AgentResponse(text, agent="GENESIS", payload)` |
| `backend/voice/` | Voice engine module (Gemini Live + ElevenLabs) |
| `backend/services/crypto.py` | Fernet encryption for OAuth tokens |

### Frontend (Web)
| File | Purpose |
|------|---------|
| `frontend/App.tsx` | Main chat, message state, `handleSend()` |
| `frontend/services/api.ts` | Backend API client |
| `frontend/components/Widgets.tsx` | All widgets + `A2UIMediator` switch |
| `frontend/components/BaseUI.tsx` | `GlassCard`, buttons, inputs |
| `frontend/constants.ts` | GENESIS brand colors, category colors |
| `frontend/types/voice.ts` | Voice mode types (WebSocket, states) |

### Mobile App (Expo)

**Stack**: Expo SDK 54, React Native 0.81, Expo Router v6, NativeWind, react-native-reanimated, react-native-svg

#### Navigation
| File | Purpose |
|------|---------|
| `apps/mobile/app/_layout.tsx` | Root Stack: `(tabs)` group + `chat` fullScreenModal + ChatFAB |
| `apps/mobile/app/(tabs)/_layout.tsx` | 5-tab Tabs with CustomTabBar, fade transitions |
| `apps/mobile/app/(tabs)/index.tsx` | HOME — Mission Control (missions, progress, streak) |
| `apps/mobile/app/(tabs)/train.tsx` | TRAIN — Workout session, weekly calendar, scan |
| `apps/mobile/app/(tabs)/fuel.tsx` | FUEL — Macro dashboard, meal log, scan |
| `apps/mobile/app/(tabs)/mind.tsx` | MIND — Check-in, sessions, breath exercise |
| `apps/mobile/app/(tabs)/track.tsx` | TRACK — Season progress, metrics, trends, achievements |
| `apps/mobile/app/chat.tsx` | Chat modal (fullscreen, slide from bottom) |

#### Components
| Directory | Contents |
|-----------|----------|
| `src/components/navigation/` | `CustomTabBar` (BlurView + haptics), `ChatFAB` (gradient + animated) |
| `src/components/shared/` | `ScreenHeader`, `SectionCard`, `MetricCard`, `ProgressRing`, `WeekdayStrip`, `QuickActionBar` |
| `src/components/ui/` | `GlassCard`, `ActionButton`, `ProgressBar`, `GlassInput` |
| `src/components/home/` | `MissionCardRow`, `StatPill` |
| `src/components/train/` | `WorkoutSessionView`, `WeeklyCalendar`, `ScanMachineCard` |
| `src/components/fuel/` | `MacroDashboard`, `MealLogSection`, `ScanFoodCard` |
| `src/components/mind/` | `CheckInForm`, `SessionGrid`, `BreathSession` |
| `src/components/track/` | `SeasonProgress`, `MetricGrid`, `TrendChart`, `AchievementList` |
| `src/components/widgets/` | A2UI widget system (10+ widget types via `A2UIMediator`) |
| `src/components/chat/` | `ChatList`, `ChatInput`, `MessageBubble`, `WidgetMessage` |

#### Other
| File | Purpose |
|------|---------|
| `src/data/mockData.ts` | Centralized mock data for all 5 tab screens |
| `src/hooks/useChat.ts` | Chat state management (messages, loading, actions) |
| `src/services/config.ts` | API URL initialization (platform-aware) |
| `src/theme/colors.ts` | Re-exports `COLORS` from `@genesis/shared` + `withOpacity` util |
| `src/utils/getCategoryColor.ts` | Maps 60+ widget types to category accent colors |

#### Tab Colors
| Tab | Color | Icon |
|-----|-------|------|
| Home | `#6D00FF` (genesis) | Home |
| Train | `#EF4444` (red) | Dumbbell |
| Fuel | `#22C55E` (green) | Apple |
| Mind | `#A855F7` (purple) | Brain |
| Track | `#3B82F6` (blue) | BarChart3 |

## ADK Patterns

### Agent Definition (V4 - No sub_agents)
```python
from google.adk.agents import Agent

genesis = Agent(
    name="genesis",
    model="gemini-2.5-flash",
    description="GENESIS - Coach unificado de fitness y longevidad...",
    instruction=GENESIS_INSTRUCTION,  # From genesis_unified.txt
    tools=[generate_widget, get_user_context, update_user_context],
    # V4: No sub_agents - all handled internally
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

## Domain Routing (V4 - Internal)

GENESIS handles all domains internally based on query keywords:

| Query Keywords (Spanish) | Domain | Primary Widgets |
|--------------------------|--------|-----------------|
| entrenamiento, fuerza, rutina, ejercicio, gym, cardio, HIIT | Training | workout-card, live-session-tracker, cardio-session-tracker |
| nutricion, comida, dieta, macros, calorias, receta, suplementos | Nutrition | meal-plan, recipe-card, macro-tracker, supplement-stack |
| recuperacion, HRV, sueno, dolor, movilidad, ciclo | Recovery | recovery-dashboard, hrv-insight, sleep-analysis, cycle-tracker |
| habitos, consistencia, motivacion, check-in, racha | Habits | checklist, daily-checkin, habit-streak, quote-card |
| progreso, analisis, datos, metricas, tendencias | Analytics | progress-dashboard, insight-card, body-comp-visualizer |
| por que, explicame, concepto, ciencia, mito | Education | None (TEXT_ONLY) |
| hola, inicio | Greeting | quick-actions |

## Adding New Domains/Widgets (V4)

### Adding Widget to Existing Domain
1. Document widget schema in `backend/instructions/genesis_unified.txt`
2. **Web**: Add props interface in `frontend/components/Widgets.tsx`, create component, add to `A2UIMediator`
3. **Mobile**: Create component in `apps/mobile/src/components/widgets/`, register via `registerWidget()` in `index.ts`
4. Document in backend tool docstring

### Modifying Domain Behavior
1. Edit relevant section in `backend/instructions/genesis_unified.txt`
2. Follow the existing pattern (Keywords, Widgets, Guidelines)
3. Test with domain-specific queries

## Gotchas

- **V4 uses single instruction file**: All domain knowledge is in `genesis_unified.txt`
- **No sub_agents in V4**: GENESIS handles everything directly
- **Tool parameters must be simple types**: ADK can't parse `Annotated[Literal[...]]`
- **`runner.run_async()` returns async generator**: Use `async for`, not `await`
- **Message must be `types.Content`**: Not raw string
- **Response may have markdown wrapper**: Parse ` ```json ``` ` blocks
- **google-adk >= 1.1.0 required**: Not 1.21.0 (conflicts with FastAPI/starlette)
- **CRITICAL - ADK Template Variables**: In instruction `.txt` files, avoid `{ variable }` syntax as ADK interprets curly braces. Use `(variable)` instead.
- **Mobile uses mock data**: Tab screens currently render `src/data/mockData.ts`. Backend integration pending.
- **Mobile tab screens use `TAB_BAR_HEIGHT + 80` bottom padding**: Required so ScrollView content isn't hidden behind the absolute-positioned tab bar + FAB.
- **Mobile widget registration in `_layout.tsx`**: Widget imports are in root layout, not per-screen. Moving them breaks A2UIMediator resolution.

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
- **Output**: PCM 16-bit signed, little-endian, 16kHz mono (ElevenLabs pcm_16000)
- **Transport**: Base64 encoded over JSON WebSocket

### Models
- **Gemini (STT+LLM)**: `gemini-2.0-flash-exp` (TEXT mode for ElevenLabs handoff)
- **ElevenLabs (TTS)**: `eleven_turbo_v2_5` (low latency, multilingual)

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

## Supabase Database

Project: `genesis_A2UI` (xaxygzwoouaiguyuwpvf)

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `sessions` | Clipboard persistence | session_id, user_id, clipboard_data (JSONB), status |
| `user_profiles` | Extended user profiles | fitness_level, goals, wearables, preferences |
| `conversation_messages` | Chat history | session_id, role, content, agent, widget_type |
| `wearable_connections` | OAuth tokens | provider (garmin/oura/whoop/apple), tokens, scopes |
| `wearable_data` | Normalized metrics | HRV, sleep, recovery, steps (24 columns) |
| `wearable_raw` | Raw API payloads | endpoint, payload (JSONB) |

### Operational Tables

| Table | Purpose |
|-------|---------|
| `daily_checkins` | Daily check-ins |
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
├── 20260107000002_v3_schema_upgrade.sql   # Full schema
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

# mobile (via Expo)
EXPO_PUBLIC_API_URL=http://localhost:8000  # Backend URL (auto-detects platform)
```

## CLI Commands

```bash
# Supabase (use CLI, not MCP plugin)
supabase login                    # Authenticate
supabase link --project-ref ...   # Link project
supabase db push                  # Apply migrations
supabase migration list           # Check status
```
