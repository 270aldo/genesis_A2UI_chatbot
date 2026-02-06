# NGX GENESIS — A2UI Training Flow Architecture Design

## 1. Overview
NGX GENESIS is a Performance & Longevity platform built on Expo SDK 54, React Native 0.81, NativeWind, FastAPI + Google ADK, and Supabase. Chat serves as the primary hub where GENESIS AI generates interactive A2UI widgets that users can engage with. The app features five main tabs (HOME, TRAIN, FUEL, MIND, TRACK) that display the same underlying data in structured dashboard views. Widget interactions persist data to Supabase, enabling features like workout logging, meal tracking, and check-ins. The Training flow is the first reference implementation for this architecture.

## 2. Data Architecture — Single Source of Truth

Supabase functions as the canonical data store for all user data. The system supports two primary access paths: Chat + A2UI widgets and Tab screens. Both paths read from the same Zustand stores, which act as an in-memory bridge between the chat interface and tab navigation. Supabase Realtime ensures that changes sync instantly across all views, maintaining consistency and providing real-time updates to users.

## 3. A2UI Protocol Integration (Google A2UI v0.10 — Hybrid Adoption)

The architecture implements Google A2UI v0.10 with a custom hybrid approach that combines the A2UI protocol with NGX-specific components.

### Message Types
- `createSurface`: Initialize a new interactive surface
- `updateComponents`: Modify component properties and data bindings
- `updateDataModel`: Sync data changes to the widget state
- `deleteSurface`: Remove a surface and its associated widget

### Custom NGX Catalog
The system uses a custom catalog at `https://ngx.genesis/catalogs/v1/fitness.json` that extends beyond raw A2UI primitives. Custom components include WorkoutCard, LiveSessionTracker, WorkoutComplete, MealPlan, and MacroTracker.

### Data Binding
Components bind to data via JSON Pointers (e.g., `/workout/title`, `/workout/exercises`). Actions trigger named events that communicate back to the backend (e.g., `start_workout`, `log_set`, `complete_workout`).

### Example: createSurface Message
```json
{
  "version": "v0.10",
  "createSurface": {
    "surfaceId": "workout_session_abc123",
    "catalogId": "https://ngx.genesis/catalogs/v1/fitness.json",
    "theme": { "primaryColor": "#6D00FF", "agentDisplayName": "GENESIS" },
    "sendDataModel": true
  }
}
```

### Example: updateComponents with Custom WorkoutCard
```json
{
  "version": "v0.10",
  "updateComponents": {
    "surfaceId": "workout_session_abc123",
    "components": [{
      "id": "root",
      "component": "WorkoutCard",
      "title": { "path": "/workout/title" },
      "exercises": { "path": "/workout/exercises" },
      "estimatedTime": { "path": "/workout/estimatedTime" },
      "tags": { "path": "/workout/tags" },
      "action": {
        "event": {
          "name": "start_workout",
          "context": { "workoutId": { "path": "/workout/id" } }
        }
      }
    }]
  }
}
```

## 4. Training Flow — 3 Widget Transformations

The Training flow represents a user's journey through a complete workout session, implemented as three sequential widget transformations in the chat interface.

### Transformation 1: workout-card (Proposal)
GENESIS generates an A2UI surface containing a WorkoutCard component that presents the workout title, complete exercise list with sets and rep ranges, estimated time to complete, and muscle group tags. The primary CTA is a "START WORKOUT" button. When tapped, a macro-action event is sent through `/api/chat` with the event field.

### Transformation 2: live-session-tracker (Active Session)
GENESIS sends a new A2UI message containing the LiveSessionTracker component. The previous workout-card freezes in the chat history. The tracker displays the current exercise name and target metrics, an inline set logging form (weight, reps, RPE), a timer for rest periods, and real-time progress visualization.

Each time the user logs a set, a micro-action POST request to `/api/v1/sets` is sent directly to the API (no LLM processing, <100ms response). Each new set triggers an `updateDataModel` message to refresh the widget's displayed data. Only ONE active widget exists at a time.

### Transformation 3: workout-complete (Summary)
The LiveSessionTracker freezes when the workout ends. GENESIS sends a final message with the WorkoutComplete component showing total volume lifted, workout duration, PR badges, and a contextual GENESIS note. A macro-action button confirms completion via `/api/chat`. GENESIS responds with personalized analysis.

## 5. Hybrid Action Model

### Micro-actions (Direct REST, no LLM)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sets` | POST | Log a single set (weight, reps, RPE) |
| `/api/v1/sessions/:id` | PATCH | Update session status or metadata |
| `/api/v1/meals` | POST | Log a meal entry |
| `/api/v1/checkins` | POST | Register a mood or health check-in |
| `/api/v1/sessions/active` | GET | Retrieve the currently active session |
| `/api/v1/stats/today` | GET | Fetch today's aggregated metrics |

### Macro-actions (Through GENESIS Agent)
| Event Type | Trigger | GENESIS Response |
|-----------|---------|------------------|
| `workout_started` | User taps "START WORKOUT" | Generates LiveSessionTracker widget + encouragement |
| `workout_completed` | User finishes all exercises | Generates WorkoutComplete widget + analysis |

Macro-actions are sent via `POST /api/chat` with an `event` field:
```json
{
  "message": "",
  "event": {
    "type": "workout_started",
    "payload": { "session_id": "uuid", "workout_title": "Push Day" }
  }
}
```

## 6. Supabase Schema

### workout_sessions Table
```sql
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id),
  season_id UUID REFERENCES seasons(id),
  phase_week INT,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','active','completed','skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_mins INT,
  total_volume_kg FLOAT DEFAULT 0,
  exercises JSONB NOT NULL DEFAULT '[]',
  genesis_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON workout_sessions
  FOR ALL USING (auth.uid()::text = user_id);

-- Indexes
CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(user_id, status);
CREATE INDEX idx_workout_sessions_season ON workout_sessions(season_id);
```

### set_logs Table
```sql
CREATE TABLE set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  exercise_order INT NOT NULL,
  set_number INT NOT NULL,
  weight_kg FLOAT NOT NULL,
  reps INT NOT NULL,
  rpe INT CHECK (rpe BETWEEN 6 AND 10),
  is_pr BOOLEAN DEFAULT false,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (through session ownership)
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own set logs" ON set_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = set_logs.session_id
      AND ws.user_id = auth.uid()::text
    )
  );

-- Indexes
CREATE INDEX idx_set_logs_session ON set_logs(session_id);
CREATE INDEX idx_set_logs_exercise ON set_logs(session_id, exercise_name);
```

## 7. State Management — Zustand Stores

### useWorkoutStore
```typescript
interface WorkoutSession {
  id: string
  title: string
  status: 'planned' | 'active' | 'completed' | 'skipped'
  exercises: Exercise[]
  startedAt?: string
  totalVolumeKg: number
}

interface SetLog {
  id: string
  sessionId: string
  exerciseName: string
  exerciseOrder: number
  setNumber: number
  weightKg: number
  reps: number
  rpe?: number
  isPr: boolean
  loggedAt: string
}

interface WorkoutStore {
  activeSession: WorkoutSession | null
  sets: SetLog[]
  status: 'idle' | 'active' | 'completed'
  startWorkout: (session: WorkoutSession) => Promise<void>
  logSet: (set: Omit<SetLog, 'id' | 'loggedAt'>) => Promise<void>
  completeWorkout: () => Promise<void>
  reset: () => void
}
```

### useChatStore
```typescript
interface ChatEvent {
  type: string
  payload: Record<string, any>
}

interface ChatMessage {
  id: string
  role: 'user' | 'genesis'
  text: string
  widget?: {
    type: string
    props: Record<string, any>
    state: 'active' | 'frozen'
    surfaceId?: string
  }
  timestamp: number
}

interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (text: string) => Promise<void>
  sendEvent: (event: ChatEvent) => Promise<void>
  updateWidget: (msgId: string, newPayload: any) => void
  freezeActiveWidget: () => void
}
```

### useUserStore
```typescript
interface UserStore {
  profile: UserProfile | null
  season: Season | null
  currentWeek: number
  todayStats: {
    volume: number
    meals: number
    streak: number
    workoutStatus: 'planned' | 'active' | 'completed' | 'rest'
  }
  fetchProfile: () => Promise<void>
  fetchTodayStats: () => Promise<void>
}
```

### Persistence
All stores use `zustand/middleware` with MMKV storage adapter for offline resilience:
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '../utils/mmkv'
```

## 8. Widget Lifecycle in Chat

### Message Structure
```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'genesis'
  text: string
  widget?: {
    type: string        // A2UI component (e.g., "WorkoutCard")
    props: Record<string, any>
    state: 'active' | 'frozen'
    surfaceId?: string  // A2UI surface reference
  }
  timestamp: number
}
```

### Lifecycle Rules
1. **New Transformation = New Message**: Each widget transformation creates a new chat message. History is preserved.
2. **Previous Widget Freezes**: When a new widget becomes active, previous widgets change to `'frozen'` state with disabled interactions.
3. **One Active Widget**: Only ONE widget per conversation can be `'active'` at any moment.
4. **Frozen Styling**: Frozen widgets render with opacity 0.6, no glow shadow, Standard Card (not Gradient Card).

## 9. Tab Architecture — 3-Layer Structure

```
┌─────────────────────────────────┐
│ HEADER / HERO                   │  ← Key metric or today's focus
├─────────────────────────────────┤
│ MODULES (cards)                 │  ← Interactive sections
│ ┌─────┐ ┌─────┐ ┌─────┐       │
│ │     │ │     │ │     │       │
│ └─────┘ └─────┘ └─────┘       │
├─────────────────────────────────┤
│ HISTORY / LIST                  │  ← Recent entries, scrollable
│ ├── Item 1                      │
│ ├── Item 2                      │
│ └── Item 3                      │
└─────────────────────────────────┘
```

### TRAIN Tab
- **Header**: Today's workout title + status pill + muscle group tags (Gradient Card)
- **Modules**: Exercise cards (List Item Cards) with sets/reps, volume summary, PR tracker
- **History**: Recent workouts list with completion status, duration, and volume

All tabs read from the same Zustand stores that chat widgets populate.

## 10. UI/UX Visual Design — Genesis Fusion Design System

### A2UI Widgets in Chat
| State | Card Type | Shadow | Opacity | Interactions |
|-------|-----------|--------|---------|-------------|
| Active | Gradient Card (#b39aff → #6c3bff border) | Purple glow (0.25) | 1.0 | Enabled |
| Frozen | Standard Card (#14121aB3) | None | 0.6 | Disabled |

### Chat Bubbles
- **GENESIS**: surface-elevated (#1e1f2aCC), left-aligned
- **User**: primary-deep (#6c3bff at 30%), right-aligned

### Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| bg-gradient | #0D0D2B → #1A0A30 | Screen backgrounds |
| primary | #b39aff | Accents, labels, active tab |
| primary-deep | #6c3bff | Icons, glow shadows |
| success | #22ff73 | Completed states, carbs |
| warning | #F97316 | Streaks, fat macro |
| error | #ff6b6b | Pending items |
| info | #38bdf8 | Water, scores |
| surface | #14121aB3 | Standard cards |
| surface-elevated | #1e1f2aCC | Featured cards |

### Typography
- **JetBrains Mono**: Labels, stats, navigation, pills, section headers
- **Inter**: Titles, body text, numbers, descriptions
- Card border radius: 16px
- Shadows: colored glows (never gray)

## 11. Navigation Map

```
Tab Bar (persistent at bottom)
├── HOME ──── Dashboard, missions, AI message, streak
├── TRAIN ─── Workout detail, exercises, live tracking
├── FUEL ──── Nutrition tracking, meals, macros, hydration
├── MIND ──── Mood check-ins, meditation, sleep
└── TRACK ─── Scores, activity charts, personal records

Chat (fullScreenModal) ── GENESIS conversation + A2UI widgets
```

## 12. Future Considerations (Deferred)

- **Camera Integration**: Gym machine recognition, food photo tracking
- **Education Section**: Interactive GENESIS-led learning modules
- **Voice Agent Integration**: Voice commands (backend already built)
- **Wearable Data Sync**: Fitness tracker and smartwatch biometrics

---

**Validated by:** Aldo (NGX Founder)
**Date:** February 5, 2026
**Status:** Ready for Implementation
