# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NGX GENESIS — Performance & Longevity mobile platform. Expo SDK 54 + React Native 0.81 + NativeWind v4 frontend, FastAPI + Google ADK backend, Supabase database. Implements A2UI (AI-to-UI) protocol where GENESIS agent generates dynamic widget surfaces routed to 3 UI zones.

**Architecture**: Single unified GENESIS agent (gemini-2.5-flash) with internal specialization across 6 domains: Training, Nutrition, Recovery, Habits, Analytics, Education. No sub_agents.

**Clients**: Mobile (`apps/mobile/`) is the primary client. Web (`frontend/`) exists as legacy reference.

**UI Language**: Spanish (all user-facing text).

## Development Commands

```bash
# Mobile (primary)
cd apps/mobile && npx expo start           # Dev server
cd apps/mobile && npx expo start --ios     # iOS simulator
cd apps/mobile && npx tsc --noEmit         # TypeScript check

# Backend
cd backend && python main.py               # FastAPI on port 8000
cd backend && adk web ./agent              # ADK visual testing UI

# Full stack
make dev              # Backend (8000) + Frontend (3000)
make install          # Install all dependencies
make test             # pytest tests/ -v

# Docker
make docker-up / make docker-down

# Supabase
supabase db push                  # Apply migrations
supabase migration list           # Check status
```

## Architecture — A2UI 3-Zone Layout

```
┌─────────────────────────────────────────────┐
│              Zone A: ContextBar              │
│  Sticky top (~80px). Persistent surfaces.    │
│  workout-summary, macro-tracker, active-plan │
├─────────────────────────────────────────────┤
│              Zone B: ChatStream              │
│  flex-1 FlatList. Text + inline widgets.     │
│  Messages + stream-zone surfaces             │
├─────────────────────────────────────────────┤
│           Zone C: FloatingWidget             │
│  Absolute overlay above tab bar.             │
│  live-session-tracker, timers, quick-actions │
├─────────────────────────────────────────────┤
│              CustomTabBar + ChatFAB          │
│  5 tabs: HOME, TRAIN, FUEL, MIND, TRACK     │
│  Labels rendered with JetBrains Mono 500     │
└─────────────────────────────────────────────┘
```

**Zone Routing**: Backend sends `zone` field per operation. Frontend SurfaceStore routes to correct zone component.

## Phase 1.5: Zones Architecture (Upcoming Implementation)

### Overview

Phase 1.5 introduces formal **Zone State Management** where each zone is a fully independent render tree with its own lifecycle. This replaces ad-hoc zone rendering with a unified, type-safe architecture.

### Zone Definitions

#### Zone A: ContextBar (Persistent/Top)
- **Position**: Fixed top, ~80px height
- **Purpose**: Persistent contextual information always visible
- **Surface Types**: workout-summary, macro-tracker, active-plan, daily-goal, streak-tracker
- **Max Surfaces**: 1-2 (stack vertically if multiple)
- **Lifecycle**: Persists across navigation, survives chat clear
- **Example Operations**:
  ```json
  {
    "type": "createSurface",
    "zone": "context",
    "widgetType": "workout-summary",
    "dataModel": { "reps": 3, "weight": 185 }
  }
  ```

#### Zone B: ChatStream (Main Content)
- **Position**: Flex-1 between ContextBar and TabBar
- **Purpose**: Main conversational interface + inline rich widgets
- **Surface Types**: message cards, checklist, meal-plan, insight-card, quote-card, recipe-card
- **Lifecycle**: Cleared on "Clear Chat", survives tab navigation (frozen)
- **Rendering**: Each message in FlatList with optional attached surface
- **Example Operations**:
  ```json
  {
    "type": "createSurface",
    "zone": "stream",
    "widgetType": "checklist",
    "dataModel": { "items": [...] }
  }
  ```

#### Zone C: FloatingWidget (Overlay)
- **Position**: Absolute overlay, above TabBar, ~120px height
- **Purpose**: Real-time tracking, timers, quick-action prompts
- **Surface Types**: live-session-tracker, timer, quick-actions, mini-recap
- **Lifecycle**: Floating, persistent across tabs, manually dismissible
- **Z-Index**: Above TabBar, below modals
- **Example Operations**:
  ```json
  {
    "type": "createSurface",
    "zone": "overlay",
    "widgetType": "live-session-tracker",
    "dataModel": { "duration": 1200, "reps": 5 }
  }
  ```

### Phase 1.5 Implementation Phases

1. **Phase 1a** (Foundation): Zone state containers, renderer registration, operation dispatch
2. **Phase 1b** (Context Bar): Implement ContextBar, test workout-summary + macro-tracker
3. **Phase 1c** (Chat Stream): Integrate ChatStream zones, test message-surface routing
4. **Phase 1d** (Overlay): Implement FloatingWidget, test live-session-tracker + timers
5. **Phase 1e** (Lifecycle): Add freeze/dismiss, chat clear behavior, persistence
6. **Phase 1f** (Polish): Animation, transitions, edge cases
7. **Phase 1g** (Testing): Integration tests, edge case coverage
8. **Phase 1h** (Documentation): Update README, add zone routing guide

### Zone-Specific Rendering Rules

| Zone | FlatList? | Scrollable? | Max Width | Overflow | Clear on Chat |
|------|-----------|-----------|-----------|----------|---------------|
| A (ContextBar) | No (Stack) | No | 100% | Stack | No |
| B (ChatStream) | Yes | Yes | 92% + margin | Scroll | Yes |
| C (Overlay) | No (Absolute) | No | 90% + center | Dismiss | No |

### Data Flow for Phase 1.5

```
Backend Response (zone: "context" | "stream" | "overlay")
       ↓
A2UI Interpreter (src/lib/a2ui/interpreter.ts)
       ↓
SurfaceStore.addSurface(zone, surfaceData)
       ↓
Zone Renderer (ContextBar / ChatStream / FloatingWidget)
       ↓
SurfaceRenderer → A2UIMediator → Widget Component
```

### New/Modified Files for Phase 1.5

| File | Purpose | Status |
|------|---------|--------|
| `src/stores/surface-store.ts` | SurfaceStore with zone partitioning | Modify |
| `src/lib/a2ui/zone-manager.ts` | Zone lifecycle + routing | NEW |
| `src/components/zones/ContextBar.tsx` | Zone A implementation | Implement |
| `src/components/zones/ChatStream.tsx` | Zone B with message-surface routing | Enhance |
| `src/components/zones/FloatingWidget.tsx` | Zone C overlay | Implement |
| `src/components/zones/ZoneController.tsx` | Master zone orchestrator | NEW |
| `src/components/widgets/SurfaceRenderer.tsx` | Zone-aware renderer | Enhance |
| `src/lib/a2ui/interpreter.ts` | Zone dispatch logic | Enhance |

### Backward Compatibility Notes

- Existing widgets continue to work; no breaking changes to widget interface
- Old surface data without zone field defaults to "stream"
- All existing surface types supported in all zones (though not all combinations are UI-sensible)

## Response Format (CRITICAL)

Backend `/api/chat` returns:

```json
{
  "text": "Texto de respuesta (markdown)",
  "agent": "GENESIS",
  "operations": [
    {
      "type": "createSurface",
      "surfaceId": "surface_uuid",
      "zone": "context",
      "widgetType": "workout-summary",
      "dataModel": { ... }
    },
    {
      "type": "updateDataModel",
      "surfaceId": "existing_surface_id",
      "dataModel": { ... }
    }
  ]
}
```

**A2UI Operations**: createSurface, updateComponents, updateDataModel, deleteSurface
**Zones**: "context" (Zone A), "stream" (Zone B), "overlay" (Zone C)

## State Management

**SurfaceStore** (Zustand + MMKV): Manages all widget surfaces separately from chat messages.
- `surfaces: Map<string, Surface>` — all active surfaces, partitioned by zone
- `addSurface()`, `updateSurface()`, `removeSurface()` — CRUD operations
- `getSurfacesByZone(zone)` — zone selectors for rendering
- `freezeActiveWidget()`, `dismissSurface()` — lifecycle
- `clearZone(zone)` — clear all surfaces in a zone (Phase 1.5)

**ChatStore** (Zustand + MMKV): Messages only, no widget embedding.
- `messages: ChatMessage[]` — text messages with optional `surfaceId` reference
- `addMessage()`, `setLoading()`

**A2UI Interpreter** (`src/lib/a2ui/interpreter.ts`): Replaces old parser. Processes ALL operations from backend response, routes to correct stores and zones.

## Key Files

### Mobile App (Primary Client)

**Navigation & Layout**
| File | Purpose |
|------|---------|
| `apps/mobile/app/_layout.tsx` | Root Stack: (tabs) + chat modal + ChatFAB |
| `apps/mobile/app/(tabs)/_layout.tsx` | 5-tab layout with CustomTabBar |
| `apps/mobile/app/chat.tsx` | Chat screen with 3-zone layout |

**Stores**
| File | Purpose |
|------|---------|
| `src/stores/surface-store.ts` | SurfaceStore — all widget surfaces by zone |
| `src/stores/chat-store.ts` | ChatStore — messages only |
| `src/stores/workout-store.ts` | Workout session state |

**A2UI System**
| File | Purpose |
|------|---------|
| `src/lib/a2ui/interpreter.ts` | interpretResponse() — processes all operations |
| `src/lib/a2ui/types.ts` | Surface, A2UIOperation, ChatMessage types |
| `src/lib/a2ui/zone-manager.ts` | Zone lifecycle + routing (Phase 1.5) |
| `src/components/widgets/A2UIMediator.tsx` | Widget registry + FallbackWidget |
| `src/components/widgets/SurfaceRenderer.tsx` | Renders surface by widgetType |

**Zone Components**
| File | Purpose |
|------|---------|
| `src/components/zones/ContextBar.tsx` | Zone A — persistent top bar |
| `src/components/zones/ChatStream.tsx` | Zone B — main chat content |
| `src/components/zones/FloatingWidget.tsx` | Zone C — overlay above tabs |
| `src/components/zones/ZoneController.tsx` | Master zone orchestrator (Phase 1.5) |

**Widget Components** (src/components/widgets/)
WorkoutCard, LiveSessionTracker, MealPlan, MacroTracker, Checklist, DailyCheckin, HabitStreak, QuoteCard, RecipeCard, InsightCard, ProgressDashboard, BodyCompVisualizer, PlateCalculator, QuickActions

**Shared Components** (src/components/)
GradientCard, StandardCard, ShineEffect, ActionButton, GlassCard, ProgressBar, CollapsibleSection

**Tab Screens** (apps/mobile/app/(tabs)/)
index.tsx (HOME), train.tsx (TRAIN), fuel.tsx (FUEL), mind.tsx (MIND), track.tsx (TRACK)

### Backend

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server, POST /api/chat, event processing |
| `backend/agent/genesis.py` | Unified GENESIS agent definition |
| `backend/instructions/genesis_unified.txt` | Agent instruction file (all 6 domains) |
| `backend/tools/generate_widget.py` | format_as_a2ui(zone) + generate_widget() |
| `backend/schemas/response.py` | AgentResponse with operations array |
| `backend/voice/` | Voice engine (Gemini Live + ElevenLabs) |

### Design System — Genesis Fusion

**Typography**
- Headers: JetBrains Mono (weight 700)
- Body: Inter (weight 400/500)
- Tab labels: JetBrains Mono (weight 500, 10px)
- Load via `expo-font` in `_layout.tsx`
- Reference: `src/theme/fonts.ts`

**Colors**
- Background gradient: #0D0D2B → #1A0A30
- Primary: #b39aff (light), #6c3bff (saturated)
- Surface: rgba(255,255,255,0.04) to 0.08
- Text: #EAEAEA (primary), #A0A0B8 (secondary)
- Category accents: Training #EF4444, Nutrition #22C55E, Recovery #A855F7, Habits #F59E0B, Analytics #3B82F6

**Tab Colors**
| Tab | Color | Icon |
|-----|-------|------|
| Home | #6D00FF | Home |
| Train | #EF4444 | Dumbbell |
| Fuel | #22C55E | Apple |
| Mind | #A855F7 | Brain |
| Track | #3B82F6 | BarChart3 |

## Supabase Database

Project ID: xaxygzwoouaiguyuwpvf

**Core Tables**: sessions, user_profiles, conversation_messages, wearable_connections, wearable_data, daily_checkins, workout_sessions, set_logs, widget_events

**RLS**: All user tables enforce `auth.uid()::text = user_id`

**Migrations**: `supabase/migrations/` (4+ files, timestamp format)

## ADK Patterns

```python
# Agent definition — V4 unified, no sub_agents
genesis = Agent(
    name="genesis",
    model="gemini-2.5-flash",
    instruction=GENESIS_INSTRUCTION,
    tools=[generate_widget, get_user_context, update_user_context],
)
```

**CRITICAL — Template variables in .txt files**: Use `(variable)` not `{ variable }`. ADK interprets curly braces as context variables.

**Runner**: `async for event in runner.run_async(user_id, session_id, new_message):`

## Gotchas

- **Spanish UI**: All user-facing text in Spanish. Backend agent responds in Spanish.
- **fontFamily required**: Every Text component with headers uses JetBrains Mono. Tab labels use JetBrains Mono. Body text uses Inter.
- **No widget embedding in messages**: ChatMessage stores only text + surfaceId reference. Widgets live in SurfaceStore.
- **Zone from backend**: Never hardcode zones in frontend. Backend operations include zone field.
- **ADK template syntax**: Use parentheses `(variable)` not braces `{variable}` in instruction files.
- **Operations array**: Backend returns operations[] not payload. Interpreter processes ALL operations, not just the first.
- **google-adk >= 1.1.0**: Not 1.21.0 (conflicts with FastAPI/starlette).
- **Tab bar bottom padding**: Tab screens use `TAB_BAR_HEIGHT + 80` bottom padding for absolute-positioned tab bar + FAB.
- **Widget registration in _layout.tsx**: Widget imports are in root layout. Moving them breaks A2UIMediator resolution.
- **MMKV persistence**: Both SurfaceStore and ChatStore persist via MMKV adapter.
- **Zone lifecycle (Phase 1.5)**: Zone A persists on chat clear, Zone B cleared, Zone C dismissed. Don't hardcode zone clearing logic in widgets.
- **Surface IDs**: Always UUID v4, never auto-increment or sequential IDs.

## Environment Variables

```bash
# backend/.env
GOOGLE_API_KEY=...           # Required (Gemini)
ELEVENLABS_API_KEY=...       # Required for TTS
ENCRYPTION_KEY=...           # Optional: Fernet for OAuth tokens
PORT=8000
CORS_ORIGINS=["*"]
SUPABASE_URL=https://xaxygzwoouaiguyuwpvf.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# mobile (Expo)
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Active Planning Documents

| Document | Purpose |
|----------|---------|
| `docs/plans/2026-02-06-a2ui-zones-design.md` | Architecture design (validated) |
| `docs/plans/2026-02-06-a2ui-zones-implementation-plan.md` | 8-phase implementation plan (Phase 1.5) |
| `docs/plans/2026-02-06-a2ui-zones-master-prompt.md` | Self-contained master prompt |
| `docs/plans/2026-02-06-claude-code-audit-report.md` | Phase 1 audit results |
| `docs/plans/2026-01-16-voice-engine-design.md` | Voice Engine (Sprint 2) |
| `docs/wearables/GARMIN_INTEGRATION.md` | Garmin API guide (future) |

## Quick Reference: When to Create/Update Surfaces

- **Zone A (ContextBar)**: User starts workout, macro tracker active, daily goal updated
- **Zone B (ChatStream)**: User asks question → GENESIS responds with widget, request checklist item
- **Zone C (FloatingWidget)**: Workout in progress (live-session-tracker), timer started (timer widget)

## When to Clear/Dismiss

- **Zone A**: Never cleared (persists across session)
- **Zone B**: Cleared when user taps "Clear Chat" in ChatStore
- **Zone C**: Manually dismissed by user, or automatically after timer/session ends

---

**Last Updated**: 2026-02-06
**Applicable Versions**: V4 Architecture + Phase 1.5 Zones (pre-implementation)
**Maintained by**: GENESIS Platform Team
