# CLAUDE CODE — NGX GENESIS A2UI Training Flow Master Prompt

> **Use this document as the single system prompt for Claude Code.**
> It contains every architecture rule, schema, interface, component spec, design token, and implementation order required to build the A2UI Training Flow.

---

## PROJECT CONTEXT

You are implementing the **A2UI Training Flow** for **NGX GENESIS**, a Performance & Longevity mobile app built with Expo SDK 54, React Native 0.81, and NativeWind.

**What already exists:**
- Expo app with 5 tabs (HOME, TRAIN, FUEL, MIND, TRACK) and a fullscreen chat modal
- FastAPI backend with Google ADK agent at `/api/chat`
- 11 registered A2UI widgets (WorkoutCard, MealPlan, MacroTracker, etc.)
- Supabase with 3 existing migrations
- Backend agent instructions at `backend/instructions/genesis_unified.txt`

**What this implementation adds:**
- Real Supabase persistence for workout data (no more mock data)
- Hybrid action model: micro-actions (direct REST) + macro-actions (agent events)
- A2UI protocol v0.10 layer for widget lifecycle management
- 3 widget transformations: WorkoutCard → LiveSessionTracker → WorkoutComplete
- Zustand stores with MMKV persistence bridging chat and tabs
- Genesis Fusion Design System applied across all components

**Design Doc:** `docs/plans/2026-02-05-a2ui-training-flow-design.md`
**Implementation Plan:** `docs/plans/2026-02-05-implementation-plan.md`

---

## TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo SDK | 54 |
| Runtime | React Native | 0.81 |
| Routing | Expo Router | v6 (file-based) |
| Styling | NativeWind | v4 (Tailwind for RN) |
| State | Zustand | latest + MMKV persist |
| Storage | react-native-mmkv | latest |
| Database | Supabase | PostgreSQL 16 |
| Realtime | Supabase Realtime | WebSockets |
| Backend | FastAPI | 0.109+ |
| Agent | Google ADK | latest |
| Icons | lucide-react-native | latest |
| Fonts | JetBrains Mono + Inter | via expo-font |

---

## 5 ARCHITECTURE RULES — NEVER BREAK THESE

### Rule 1: Single Source of Truth
Supabase is the canonical data store. Zustand stores are an in-memory cache that syncs via API calls. Chat widgets and Tab screens both read from the SAME Zustand stores. Never store authoritative data only in component state.

### Rule 2: Hybrid Action Model
**Micro-actions** = direct REST API calls, no LLM involved, <100ms response. Used for: logging sets, updating session status, fetching stats.
**Macro-actions** = POST /api/chat with an `event` field, GENESIS agent processes and returns A2UI widgets. Used for: starting workouts, completing workouts.

```
Micro-action: User logs set → POST /api/v1/sets → Supabase → store.update()
Macro-action: User starts workout → POST /api/chat {event} → GENESIS → A2UI widgets
```

### Rule 3: A2UI Protocol v0.10
All agent-generated widgets follow Google A2UI v0.10 message format. The backend sends arrays of A2UI messages (createSurface, updateComponents, updateDataModel). The frontend parses them into ChatMessage objects with widget payloads.

Custom catalog: `https://ngx.genesis/catalogs/v1/fitness.json`
Custom components: WorkoutCard, LiveSessionTracker, WorkoutComplete

### Rule 4: Widget Lifecycle
Each widget transformation creates a NEW chat message. The previous widget FREEZES (state → 'frozen', opacity 0.6, interactions disabled). Only ONE widget per conversation can be 'active' at any time. Frozen widgets use StandardCard; active widgets use GradientCard.

### Rule 5: Backend Instructions Syntax
When writing backend agent instructions (genesis_unified.txt), use `(variable)` NOT `{variable}`. The Google ADK template engine conflicts with curly braces.

```
✅ Correct: "Create session for (workout_title) with (exercises)"
❌ Wrong:  "Create session for {workout_title} with {exercises}"
```

---

## GENESIS FUSION DESIGN SYSTEM

### Color Tokens

```typescript
export const COLORS = {
  // Backgrounds
  bgPrimary: '#0D0D2B',
  bgSecondary: '#1A0A30',
  bgGradient: ['#0D0D2B', '#1A0A30'],  // LinearGradient

  // Accent
  primary: '#b39aff',        // Labels, active states, accents
  primaryDeep: '#6c3bff',    // Icons, glow shadows, CTAs
  primaryGradient: ['#b39aff', '#6c3bff'],  // Border gradient

  // Semantic
  success: '#22ff73',        // Completed, carbs
  warning: '#F97316',        // Streaks, fat
  error: '#ff6b6b',          // Pending items
  info: '#38bdf8',           // Water, scores
  protein: '#ff6b6b',        // Protein macro

  // Surfaces
  surface: '#14121aB3',          // Standard cards (70% opacity)
  surfaceElevated: '#1e1f2aCC',  // Featured cards, chat bubbles (80% opacity)
  surfaceBorder: 'rgba(255,255,255,0.10)',

  // Text
  textPrimary: 'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.75)',
  textTertiary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.45)',

  // Tab bar
  tabActive: '#b39aff',
  tabInactive: '#6b6b7b',
  tabBarBg: '#14121aCC',
} as const;
```

### Typography

| Use Case | Font | Weight | Notes |
|----------|------|--------|-------|
| Labels, stats, nav, pills, section headers | JetBrains Mono | 500-700 | Monospace precision |
| Titles, body, numbers, descriptions | Inter | 400-700 | Clean readability |

### Card Components

**GradientCard** (active widgets, featured sections):
```tsx
// apps/mobile/src/components/common/GradientCard.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { View, ViewProps } from 'react-native';

interface GradientCardProps extends ViewProps {
  frozen?: boolean;
  children: React.ReactNode;
}

export function GradientCard({ frozen, children, style, ...props }: GradientCardProps) {
  if (frozen) {
    return (
      <View
        className="bg-[#14121aB3] rounded-2xl p-4"
        style={[{ opacity: 0.6 }, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#b39aff', '#6c3bff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-[1px]"
      style={[{
        shadowColor: '#6c3bff',
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }, style]}
    >
      <View className="bg-[#1e1f2aCC] rounded-2xl p-4" {...props}>
        {children}
      </View>
    </LinearGradient>
  );
}
```

**StandardCard** (frozen widgets, list items):
```tsx
// apps/mobile/src/components/common/StandardCard.tsx
import { View, ViewProps } from 'react-native';

interface StandardCardProps extends ViewProps {
  children: React.ReactNode;
}

export function StandardCard({ children, style, ...props }: StandardCardProps) {
  return (
    <View
      className="bg-[#14121aB3] rounded-2xl p-4 border border-white/10"
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
```

**ShineEffect** (1px highlight on top edge):
```tsx
// apps/mobile/src/components/common/ShineEffect.tsx
import { View } from 'react-native';

export function ShineEffect() {
  return (
    <View
      className="absolute top-0 left-4 right-4 h-[1px]"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
    />
  );
}
```

**ColoredPill** (tags, status indicators):
```tsx
// apps/mobile/src/components/common/ColoredPill.tsx
import { View, Text } from 'react-native';

interface ColoredPillProps {
  label: string;
  color?: string;
  size?: 'sm' | 'md';
}

export function ColoredPill({ label, color = '#b39aff', size = 'sm' }: ColoredPillProps) {
  const py = size === 'sm' ? 'py-0.5' : 'py-1';
  const px = size === 'sm' ? 'px-2' : 'px-3';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View
      className={`${py} ${px} rounded-full`}
      style={{ backgroundColor: `${color}20` }}
    >
      <Text
        className={`${textSize} font-[JetBrainsMono-Medium] uppercase tracking-wider`}
        style={{ color }}
      >
        {label}
      </Text>
    </View>
  );
}
```

### Chat Bubble Styling

```
GENESIS messages: bg-[#1e1f2aCC], left-aligned, rounded-2xl rounded-bl-sm
User messages:    bg-[#6c3bff4D], right-aligned, rounded-2xl rounded-br-sm
```

### Tab Architecture — 3-Layer Model

Every tab follows this structure:
```
┌─────────────────────────┐
│ HEADER / HERO           │  ← Key metric, GradientCard
├─────────────────────────┤
│ MODULES                 │  ← Interactive cards section
├─────────────────────────┤
│ HISTORY / LIST          │  ← Recent entries, scrollable
└─────────────────────────┘
```

### Tab Bar Styling

```tsx
// In app/(tabs)/_layout.tsx
<Tabs screenOptions={{
  tabBarStyle: {
    backgroundColor: '#14121aCC',
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
    height: 80,
  },
  tabBarActiveTintColor: '#b39aff',
  tabBarInactiveTintColor: '#6b6b7b',
  tabBarLabelStyle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
}} />
```

Icons (22px, from lucide-react-native):
- Home → `Home`
- Train → `Dumbbell`
- Fuel → `Flame`
- Mind → `Brain`
- Track → `BarChart3`

Active tab has a 4px violet dot indicator below the icon.

---

## SUPABASE SCHEMA

Create migration at `supabase/migrations/20260205000001_workout_training_flow.sql`:

```sql
-- ===== WORKOUT SESSIONS =====
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON workout_sessions
  FOR ALL USING (auth.uid()::text = user_id);

CREATE INDEX idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(user_id, status);
CREATE INDEX idx_workout_sessions_season ON workout_sessions(season_id);
CREATE INDEX idx_workout_sessions_created ON workout_sessions(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE workout_sessions;

-- ===== SET LOGS =====
CREATE TABLE IF NOT EXISTS set_logs (
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

ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own set logs" ON set_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = set_logs.session_id
      AND ws.user_id = auth.uid()::text
    )
  );

CREATE INDEX idx_set_logs_session ON set_logs(session_id);
CREATE INDEX idx_set_logs_exercise ON set_logs(session_id, exercise_name);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE set_logs;

-- ===== DAILY STATS (materialized view pattern) =====
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_volume_kg FLOAT DEFAULT 0,
  meals_logged INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  workout_status TEXT DEFAULT 'rest'
    CHECK (workout_status IN ('planned','active','completed','rest')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own daily stats" ON daily_stats
  FOR ALL USING (auth.uid()::text = user_id);

CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);

-- ===== PERSONAL RECORDS =====
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  max_weight_kg FLOAT NOT NULL,
  max_reps INT,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  session_id UUID REFERENCES workout_sessions(id),
  UNIQUE(user_id, exercise_name)
);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own PRs" ON personal_records
  FOR ALL USING (auth.uid()::text = user_id);

CREATE INDEX idx_personal_records_user ON personal_records(user_id);

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_sessions_updated_at
  BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Existing tables (already migrated):** `seasons`, `profiles` — do NOT recreate these.

---

## API ENDPOINTS

### Micro-action Endpoints (no LLM, <100ms)

**POST /api/v1/sessions** — Create a new workout session
```typescript
// Request
interface CreateSessionRequest {
  user_id: string;
  title: string;
  exercises: Array<{
    name: string;
    targetSets: number;
    targetReps: string; // e.g. "8-12"
    muscleGroup: string;
  }>;
  season_id?: string;
  phase_week?: number;
}
// Response: WorkoutSession object with id
```

**PATCH /api/v1/sessions/:id** — Update session status
```typescript
// Request
interface UpdateSessionRequest {
  status?: 'planned' | 'active' | 'completed' | 'skipped';
  started_at?: string;   // ISO datetime
  completed_at?: string;
  genesis_note?: string;
  total_volume_kg?: number;
  duration_mins?: number;
}
// Response: Updated WorkoutSession object
```

**POST /api/v1/sets** — Log a single set
```typescript
// Request
interface LogSetRequest {
  session_id: string;
  exercise_name: string;
  exercise_order: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe?: number; // 6-10
}
// Response
interface LogSetResponse {
  id: string;
  is_pr: boolean;           // true if new PR for this exercise
  total_session_volume: number; // running total
  set_log: SetLog;           // full set record
}
```

**GET /api/v1/sessions/active** — Get active session
```typescript
// Query: ?user_id=xxx
// Response
interface ActiveSessionResponse {
  session: WorkoutSession | null;
  sets: SetLog[];            // all sets for active session
}
```

**GET /api/v1/sessions/:id/sets** — Get all sets for a session
```typescript
// Response: SetLog[]
```

**GET /api/v1/stats/today** — Get today's aggregated stats
```typescript
// Query: ?user_id=xxx
// Response
interface TodayStatsResponse {
  volume: number;           // total kg today
  meals_logged: number;
  streak: number;
  workout_status: 'planned' | 'active' | 'completed' | 'rest';
}
```

### Macro-action Endpoint (through GENESIS agent)

**POST /api/chat** — Extended with event field
```typescript
// Request
interface ChatRequest {
  message: string;
  session_id?: string;      // conversation session
  event?: {
    type: 'workout_started' | 'workout_completed';
    payload: Record<string, any>;
  };
}
// Response
interface ChatResponse {
  response: string;         // GENESIS text
  widgets?: A2UIMessage[];  // A2UI protocol messages array
}
```

Event types and expected payloads:
```
workout_started:
  payload: { session_id, workout_title, exercises[] }
  GENESIS responds with: LiveSessionTracker A2UI surface + encouragement

workout_completed:
  payload: { session_id, total_volume_kg, duration_mins, sets_count, prs[] }
  GENESIS responds with: WorkoutComplete A2UI surface + performance analysis
```

### Backend Router Structure

```
backend/
├── routers/
│   ├── __init__.py
│   └── v1/
│       ├── __init__.py      ← APIRouter prefix="/api/v1"
│       ├── sessions.py      ← POST, PATCH, GET active
│       ├── sets.py          ← POST, GET by session
│       └── stats.py         ← GET today
├── schemas/
│   ├── workout.py           ← Pydantic models for all endpoints
│   └── chat.py              ← ChatRequest/ChatResponse with event
└── main.py                  ← Register v1 router
```

---

## A2UI PROTOCOL SPECIFICATION

### Message Format (v0.10)

The backend returns an array of A2UI messages. Each message has exactly ONE action field:

```typescript
// apps/mobile/src/lib/a2ui/types.ts

interface A2UIMessage {
  version: 'v0.10';
  createSurface?: {
    surfaceId: string;
    catalogId: string;
    theme?: { primaryColor: string; agentDisplayName: string };
    sendDataModel?: boolean;
  };
  updateComponents?: {
    surfaceId: string;
    components: A2UIComponent[];
  };
  updateDataModel?: {
    surfaceId: string;
    dataModel: Record<string, any>;
  };
  deleteSurface?: {
    surfaceId: string;
  };
}

interface A2UIComponent {
  id: string;
  component: string;
  [key: string]: any;
  action?: {
    event: {
      name: string;
      context?: Record<string, any>;
    };
  };
}
```

### Custom NGX Catalog Components

**WorkoutCard** — Workout proposal widget
```
Properties:
  title: string
  exercises: Array<{ name, targetSets, targetReps, muscleGroup }>
  estimatedTime: string
  tags: string[]
Events:
  start_workout → { workoutId, sessionId }
```

**LiveSessionTracker** — Active workout tracking
```
Properties:
  sessionId: string
  currentExercise: { name, targetSets, targetReps }
  completedSets: SetLog[]
  totalVolume: number
  elapsedTime: number
  exerciseList: Exercise[]
Events:
  log_set → { sessionId, exerciseName, setNumber, weightKg, reps, rpe }
  complete_workout → { sessionId }
```

**WorkoutComplete** — Post-workout summary
```
Properties:
  totalVolume: number
  duration: number
  totalSets: number
  prs: Array<{ exercise, weight, reps }>
  genesisNote: string
Events: none (display only)
```

### Parser Implementation

```typescript
// apps/mobile/src/lib/a2ui/parser.ts
import { A2UIMessage, A2UIComponent } from './types';
import { ChatMessage } from '../../stores/chat-store';

export function parseA2UIResponse(
  textResponse: string,
  widgets?: A2UIMessage[]
): ChatMessage {
  const message: ChatMessage = {
    id: `genesis-${Date.now()}`,
    role: 'genesis',
    text: textResponse,
    timestamp: Date.now(),
  };

  if (!widgets || widgets.length === 0) return message;

  // Find the updateComponents message to extract widget type
  const componentMsg = widgets.find(w => w.updateComponents);
  const dataMsg = widgets.find(w => w.updateDataModel);
  const surfaceMsg = widgets.find(w => w.createSurface);

  if (componentMsg?.updateComponents) {
    const comp = componentMsg.updateComponents.components[0];
    const data = dataMsg?.updateDataModel?.dataModel || {};

    message.widget = {
      type: getComponentType(comp.component),
      props: resolveDataBindings(comp, data),
      state: 'active',
      surfaceId: surfaceMsg?.createSurface?.surfaceId || componentMsg.updateComponents.surfaceId,
    };
  }

  return message;
}

function getComponentType(component: string): string {
  const map: Record<string, string> = {
    'WorkoutCard': 'workout-card',
    'LiveSessionTracker': 'live-session-tracker',
    'WorkoutComplete': 'workout-complete',
  };
  return map[component] || component.toLowerCase();
}

function resolveDataBindings(
  component: A2UIComponent,
  dataModel: Record<string, any>
): Record<string, any> {
  const props: Record<string, any> = {};
  for (const [key, value] of Object.entries(component)) {
    if (key === 'id' || key === 'component' || key === 'action') continue;
    if (typeof value === 'object' && value?.path) {
      // JSON Pointer resolution
      const path = value.path.replace(/^\//, '').split('/');
      let resolved: any = dataModel;
      for (const segment of path) {
        resolved = resolved?.[segment];
      }
      props[key] = resolved;
    } else {
      props[key] = value;
    }
  }
  return props;
}
```

### Event Emitter Implementation

```typescript
// apps/mobile/src/lib/a2ui/event-emitter.ts
import { ChatEvent } from '../../stores/chat-store';

export function createWidgetEvent(
  actionName: string,
  context: Record<string, any>,
  surfaceId: string
): ChatEvent {
  return {
    type: actionName,
    payload: { ...context, surfaceId },
  };
}

export function createMicroAction(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'GET',
  body?: Record<string, any>
) {
  return { endpoint, method, body };
}
```

---

## ZUSTAND STORES

### workout-store.ts

```typescript
// apps/mobile/src/stores/workout-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { API_BASE } from '../services/config';

interface Exercise {
  name: string;
  targetSets: number;
  targetReps: string;
  muscleGroup: string;
}

interface WorkoutSession {
  id: string;
  title: string;
  status: 'planned' | 'active' | 'completed' | 'skipped';
  exercises: Exercise[];
  startedAt?: string;
  completedAt?: string;
  totalVolumeKg: number;
  durationMins?: number;
  genesisNote?: string;
}

interface SetLog {
  id: string;
  sessionId: string;
  exerciseName: string;
  exerciseOrder: number;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isPr: boolean;
  loggedAt: string;
}

interface WorkoutStore {
  activeSession: WorkoutSession | null;
  sets: SetLog[];
  status: 'idle' | 'active' | 'completed';

  startWorkout: (session: WorkoutSession) => Promise<void>;
  logSet: (input: Omit<SetLog, 'id' | 'loggedAt' | 'isPr'>) => Promise<SetLog & { isPr: boolean; totalSessionVolume: number }>;
  completeWorkout: () => Promise<void>;
  fetchActiveSession: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeSession: null,
      sets: [],
      status: 'idle',

      startWorkout: async (session) => {
        // PATCH session status to 'active'
        await fetch(`${API_BASE}/api/v1/sessions/${session.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'active',
            started_at: new Date().toISOString(),
          }),
        });
        set({
          activeSession: { ...session, status: 'active', startedAt: new Date().toISOString() },
          sets: [],
          status: 'active',
        });
      },

      logSet: async (input) => {
        const res = await fetch(`${API_BASE}/api/v1/sets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: input.sessionId,
            exercise_name: input.exerciseName,
            exercise_order: input.exerciseOrder,
            set_number: input.setNumber,
            weight_kg: input.weightKg,
            reps: input.reps,
            rpe: input.rpe,
          }),
        });
        const data = await res.json();
        const newSet: SetLog = {
          ...input,
          id: data.id,
          isPr: data.is_pr,
          loggedAt: new Date().toISOString(),
        };
        set((state) => ({
          sets: [...state.sets, newSet],
          activeSession: state.activeSession
            ? { ...state.activeSession, totalVolumeKg: data.total_session_volume }
            : null,
        }));
        return { ...newSet, totalSessionVolume: data.total_session_volume };
      },

      completeWorkout: async () => {
        const { activeSession, sets } = get();
        if (!activeSession) return;
        const startedAt = activeSession.startedAt ? new Date(activeSession.startedAt) : new Date();
        const durationMins = Math.round((Date.now() - startedAt.getTime()) / 60000);

        await fetch(`${API_BASE}/api/v1/sessions/${activeSession.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_mins: durationMins,
            total_volume_kg: activeSession.totalVolumeKg,
          }),
        });
        set({
          activeSession: { ...activeSession, status: 'completed', durationMins, completedAt: new Date().toISOString() },
          status: 'completed',
        });
      },

      fetchActiveSession: async (userId) => {
        const res = await fetch(`${API_BASE}/api/v1/sessions/active?user_id=${userId}`);
        const data = await res.json();
        if (data.session) {
          set({ activeSession: data.session, sets: data.sets || [], status: 'active' });
        }
      },

      reset: () => set({ activeSession: null, sets: [], status: 'idle' }),
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        activeSession: state.activeSession,
        sets: state.sets,
        status: state.status,
      }),
    }
  )
);
```

### chat-store.ts

```typescript
// apps/mobile/src/stores/chat-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { API_BASE } from '../services/config';
import { parseA2UIResponse } from '../lib/a2ui/parser';
import { A2UIMessage } from '../lib/a2ui/types';

export interface ChatEvent {
  type: string;
  payload: Record<string, any>;
}

export interface WidgetPayload {
  type: string;
  props: Record<string, any>;
  state: 'active' | 'frozen';
  surfaceId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'genesis';
  text: string;
  widget?: WidgetPayload;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  activeWidgetId: string | null;

  sendMessage: (text: string) => Promise<void>;
  sendEvent: (event: ChatEvent) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
  freezeActiveWidget: () => void;
  updateWidget: (msgId: string, updates: Partial<WidgetPayload>) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      activeWidgetId: null,

      sendMessage: async (text) => {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          text,
          timestamp: Date.now(),
        };
        set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          });
          const data = await res.json();
          const genesisMsg = parseA2UIResponse(data.response, data.widgets);

          // Freeze previous active widget if new one arrives
          if (genesisMsg.widget) {
            get().freezeActiveWidget();
          }

          set((s) => ({
            messages: [...s.messages, genesisMsg],
            isLoading: false,
            activeWidgetId: genesisMsg.widget ? genesisMsg.id : s.activeWidgetId,
          }));
        } catch (err) {
          set({ isLoading: false });
          console.error('[ChatStore] sendMessage error:', err);
        }
      },

      sendEvent: async (event) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: '', event }),
          });
          const data = await res.json();
          const genesisMsg = parseA2UIResponse(data.response, data.widgets);

          if (genesisMsg.widget) {
            get().freezeActiveWidget();
          }

          set((s) => ({
            messages: [...s.messages, genesisMsg],
            isLoading: false,
            activeWidgetId: genesisMsg.widget ? genesisMsg.id : s.activeWidgetId,
          }));
        } catch (err) {
          set({ isLoading: false });
          console.error('[ChatStore] sendEvent error:', err);
        }
      },

      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

      freezeActiveWidget: () => {
        const { messages, activeWidgetId } = get();
        if (!activeWidgetId) return;
        set({
          messages: messages.map((m) =>
            m.id === activeWidgetId && m.widget
              ? { ...m, widget: { ...m.widget, state: 'frozen' as const } }
              : m
          ),
        });
      },

      updateWidget: (msgId, updates) => {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === msgId && m.widget
              ? { ...m, widget: { ...m.widget, ...updates } }
              : m
          ),
        }));
      },

      reset: () => set({ messages: [], isLoading: false, activeWidgetId: null }),
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-50), // Keep last 50 messages
      }),
    }
  )
);
```

### user-store.ts

```typescript
// apps/mobile/src/stores/user-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { API_BASE } from '../services/config';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalWeeks: number;
}

interface TodayStats {
  volume: number;
  mealsLogged: number;
  streak: number;
  workoutStatus: 'planned' | 'active' | 'completed' | 'rest';
}

interface UserStore {
  profile: UserProfile | null;
  season: Season | null;
  currentWeek: number;
  todayStats: TodayStats | null;

  fetchProfile: () => Promise<void>;
  fetchTodayStats: () => Promise<void>;
  setSeason: (season: Season) => void;
  setCurrentWeek: (week: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      season: null,
      currentWeek: 1,
      todayStats: null,

      fetchProfile: async () => {
        // TODO: Use Supabase auth to get current user
        // const { data } = await supabase.from('profiles').select('*').single();
        // set({ profile: data });
      },

      fetchTodayStats: async () => {
        const profile = get().profile;
        if (!profile) return;
        try {
          const res = await fetch(`${API_BASE}/api/v1/stats/today?user_id=${profile.id}`);
          const data = await res.json();
          set({
            todayStats: {
              volume: data.volume,
              mealsLogged: data.meals_logged,
              streak: data.streak,
              workoutStatus: data.workout_status,
            },
          });
        } catch (err) {
          console.error('[UserStore] fetchTodayStats error:', err);
        }
      },

      setSeason: (season) => set({ season }),
      setCurrentWeek: (week) => set({ currentWeek: week }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        profile: state.profile,
        season: state.season,
        currentWeek: state.currentWeek,
      }),
    }
  )
);
```

### Store Barrel Export

```typescript
// apps/mobile/src/stores/index.ts
export { useWorkoutStore } from './workout-store';
export { useChatStore } from './chat-store';
export { useUserStore } from './user-store';
```

---

## WIDGET COMPONENTS

### WorkoutCard.tsx (Refactored)

```tsx
// apps/mobile/src/components/widgets/WorkoutCard.tsx
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Dumbbell, Clock, ChevronRight } from 'lucide-react-native';
import { GradientCard } from '../common/GradientCard';
import { ColoredPill } from '../common/ColoredPill';
import { ShineEffect } from '../common/ShineEffect';

interface WorkoutCardProps {
  title: string;
  exercises: Array<{
    name: string;
    targetSets: number;
    targetReps: string;
    muscleGroup: string;
  }>;
  estimatedTime?: string;
  tags?: string[];
  onStart?: () => void;
  frozen?: boolean;
}

export function WorkoutCard({ title, exercises, estimatedTime, tags, onStart, frozen }: WorkoutCardProps) {
  return (
    <GradientCard frozen={frozen}>
      <ShineEffect />

      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Dumbbell size={18} color="#b39aff" />
          <Text className="text-white font-[Inter-Bold] text-lg">{title}</Text>
        </View>
        {estimatedTime && (
          <View className="flex-row items-center gap-1">
            <Clock size={14} color="rgba(255,255,255,0.55)" />
            <Text className="text-white/55 font-[JetBrainsMono-Medium] text-xs">{estimatedTime}</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <ColoredPill key={tag} label={tag} />
          ))}
        </View>
      )}

      {/* Exercise List */}
      <View className="gap-2 mb-4">
        {exercises.map((ex, i) => (
          <View key={i} className="bg-white/5 rounded-xl px-3 py-2.5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white/95 font-[Inter-SemiBold] text-sm">{ex.name}</Text>
              <Text className="text-white/55 font-[JetBrainsMono-Regular] text-xs mt-0.5">
                {ex.targetSets} × {ex.targetReps}
              </Text>
            </View>
            <ColoredPill label={ex.muscleGroup} color="#38bdf8" size="sm" />
          </View>
        ))}
      </View>

      {/* CTA */}
      {!frozen && onStart && (
        <TouchableOpacity
          onPress={onStart}
          className="bg-[#6c3bff] rounded-xl py-3 flex-row items-center justify-center gap-2"
          style={{
            shadowColor: '#6c3bff',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Dumbbell size={18} color="#fff" />
          <Text className="text-white font-[JetBrainsMono-Bold] text-sm tracking-wider">
            START WORKOUT
          </Text>
          <ChevronRight size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </GradientCard>
  );
}
```

### LiveSessionTracker.tsx (New)

```tsx
// apps/mobile/src/components/widgets/LiveSessionTracker.tsx
import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Timer, Plus, Check, ChevronRight } from 'lucide-react-native';
import { GradientCard } from '../common/GradientCard';
import { ColoredPill } from '../common/ColoredPill';
import { ShineEffect } from '../common/ShineEffect';
import { COLORS } from '../../theme/colors';

interface SetLog {
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isPr?: boolean;
}

interface LiveSessionTrackerProps {
  sessionId: string;
  currentExercise: {
    name: string;
    targetSets: number;
    targetReps: string;
  };
  exerciseList: Array<{ name: string; targetSets: number; targetReps: string }>;
  completedSets: SetLog[];
  totalVolume: number;
  onLogSet: (data: { weightKg: number; reps: number; rpe?: number }) => void;
  onComplete: () => void;
  frozen?: boolean;
}

export function LiveSessionTracker({
  sessionId,
  currentExercise,
  exerciseList,
  completedSets,
  totalVolume,
  onLogSet,
  onComplete,
  frozen,
}: LiveSessionTrackerProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!frozen) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [frozen]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogSet = () => {
    if (!weight || !reps) return;
    onLogSet({
      weightKg: parseFloat(weight),
      reps: parseInt(reps),
      rpe: rpe ?? undefined,
    });
    setWeight('');
    setReps('');
    setRpe(null);
  };

  return (
    <GradientCard frozen={frozen}>
      <ShineEffect />

      {/* Timer Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Timer size={18} color="#22ff73" />
          <Text className="text-[#22ff73] font-[JetBrainsMono-Bold] text-lg">
            {formatTime(elapsed)}
          </Text>
        </View>
        <ColoredPill label={`${Math.round(totalVolume)} kg`} color="#b39aff" size="md" />
      </View>

      {/* Current Exercise */}
      <View className="bg-white/5 rounded-xl p-3 mb-3">
        <Text className="text-white font-[Inter-Bold] text-base">{currentExercise.name}</Text>
        <Text className="text-white/55 font-[JetBrainsMono-Regular] text-xs mt-1">
          Target: {currentExercise.targetSets} × {currentExercise.targetReps}
        </Text>
      </View>

      {/* Completed Sets */}
      {completedSets.length > 0 && (
        <View className="mb-3 gap-1.5">
          {completedSets.map((s, i) => (
            <View key={i} className="flex-row items-center justify-between px-2 py-1.5">
              <Text className="text-white/55 font-[JetBrainsMono-Medium] text-xs">
                Set {s.setNumber}
              </Text>
              <View className="flex-row items-center gap-3">
                <Text className="text-white font-[Inter-SemiBold] text-sm">
                  {s.weightKg}kg × {s.reps}
                </Text>
                {s.rpe && (
                  <Text className="text-white/45 font-[JetBrainsMono-Regular] text-xs">
                    RPE {s.rpe}
                  </Text>
                )}
                {s.isPr && <ColoredPill label="PR" color="#22ff73" size="sm" />}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Input Form */}
      {!frozen && (
        <>
          <View className="flex-row gap-2 mb-3">
            <View className="flex-1">
              <Text className="text-white/45 font-[JetBrainsMono-Medium] text-[10px] uppercase mb-1">
                Weight (kg)
              </Text>
              <TextInput
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-[Inter-Medium] text-base"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholderTextColor="rgba(255,255,255,0.25)"
                placeholder="0"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white/45 font-[JetBrainsMono-Medium] text-[10px] uppercase mb-1">
                Reps
              </Text>
              <TextInput
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-[Inter-Medium] text-base"
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholderTextColor="rgba(255,255,255,0.25)"
                placeholder="0"
              />
            </View>
            <View className="w-16">
              <Text className="text-white/45 font-[JetBrainsMono-Medium] text-[10px] uppercase mb-1">
                RPE
              </Text>
              <TextInput
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-[Inter-Medium] text-base text-center"
                value={rpe?.toString() || ''}
                onChangeText={(v) => setRpe(v ? parseInt(v) : null)}
                keyboardType="number-pad"
                placeholderTextColor="rgba(255,255,255,0.25)"
                placeholder="—"
                maxLength={2}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleLogSet}
              className="flex-1 bg-[#6c3bff] rounded-xl py-3 flex-row items-center justify-center gap-2"
              style={{
                shadowColor: '#6c3bff',
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Plus size={16} color="#fff" />
              <Text className="text-white font-[JetBrainsMono-Bold] text-xs tracking-wider">
                LOG SET
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onComplete}
              className="bg-[#22ff73]/15 rounded-xl px-4 py-3 flex-row items-center gap-1.5"
            >
              <Check size={16} color="#22ff73" />
              <Text className="text-[#22ff73] font-[JetBrainsMono-Bold] text-xs">DONE</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </GradientCard>
  );
}
```

### WorkoutComplete.tsx (New)

```tsx
// apps/mobile/src/components/widgets/WorkoutComplete.tsx
import { View, Text } from 'react-native';
import { Trophy, Clock, Dumbbell, Sparkles, TrendingUp } from 'lucide-react-native';
import { GradientCard } from '../common/GradientCard';
import { ColoredPill } from '../common/ColoredPill';
import { ShineEffect } from '../common/ShineEffect';

interface PR {
  exercise: string;
  weight: number;
  reps: number;
}

interface WorkoutCompleteProps {
  totalVolume: number;
  duration: number; // minutes
  totalSets: number;
  prs?: PR[];
  genesisNote?: string;
  frozen?: boolean;
}

export function WorkoutComplete({
  totalVolume,
  duration,
  totalSets,
  prs = [],
  genesisNote,
  frozen,
}: WorkoutCompleteProps) {
  return (
    <GradientCard frozen={frozen}>
      <ShineEffect />

      {/* Title */}
      <View className="flex-row items-center gap-2 mb-4">
        <Trophy size={20} color="#22ff73" />
        <Text className="text-[#22ff73] font-[JetBrainsMono-Bold] text-base tracking-wider uppercase">
          Workout Complete
        </Text>
      </View>

      {/* Stats Grid */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
          <Dumbbell size={16} color="#b39aff" />
          <Text className="text-white font-[Inter-Bold] text-xl mt-1">
            {Math.round(totalVolume)}
          </Text>
          <Text className="text-white/45 font-[JetBrainsMono-Medium] text-[10px] uppercase">
            kg volume
          </Text>
        </View>
        <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
          <Clock size={16} color="#38bdf8" />
          <Text className="text-white font-[Inter-Bold] text-xl mt-1">
            {duration}
          </Text>
          <Text className="text-white/45 font-[JetBrainsMono-Medium] text-[10px] uppercase">
            minutes
          </Text>
        </View>
        <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
          <TrendingUp size={16} color="#F97316" />
          <Text className="text-white font-[Inter-Bold] text-xl mt-1">
            {totalSets}
          </Text>
          <Text className="text-white/45 font-[JetBrainsMono-Medium] text-[10px] uppercase">
            sets
          </Text>
        </View>
      </View>

      {/* PR Badges */}
      {prs.length > 0 && (
        <View className="mb-4">
          <Text className="text-white/55 font-[JetBrainsMono-Medium] text-xs uppercase mb-2">
            New Records
          </Text>
          <View className="gap-2">
            {prs.map((pr, i) => (
              <View key={i} className="flex-row items-center gap-2 bg-[#22ff73]/10 rounded-lg px-3 py-2">
                <Trophy size={14} color="#22ff73" />
                <Text className="text-[#22ff73] font-[Inter-SemiBold] text-sm flex-1">
                  {pr.exercise}
                </Text>
                <Text className="text-white font-[JetBrainsMono-Bold] text-sm">
                  {pr.weight}kg × {pr.reps}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* GENESIS Note */}
      {genesisNote && (
        <View className="bg-white/5 rounded-xl p-3 flex-row gap-2">
          <Sparkles size={16} color="#b39aff" className="mt-0.5" />
          <Text className="text-white/75 font-[Inter-Regular] text-sm italic flex-1 leading-5">
            {genesisNote}
          </Text>
        </View>
      )}
    </GradientCard>
  );
}
```

---

## IMPLEMENTATION ORDER (12 Phases)

Execute phases sequentially. One commit per phase.

| Phase | Name | Duration | Key Files |
|-------|------|----------|-----------|
| 0 | Environment & Dependencies | 30min | supabase.ts, mmkv.ts, package.json |
| 1 | Supabase Schema Migration | 30min | migration SQL file |
| 2 | Backend Micro-action Endpoints | 2h | routers/v1/*.py, schemas/workout.py |
| 3 | Backend Macro-action Events | 1.5h | main.py, genesis.py, generate_widget.py |
| 4 | Zustand State Management | 1.5h | stores/*.ts |
| 5 | A2UI Protocol Layer | 1h | lib/a2ui/*.ts |
| 6 | Widget Components | 2h | WorkoutCard, LiveSessionTracker, WorkoutComplete, common/* |
| 7 | Chat Screen Integration | 2h | chat.tsx full rewrite |
| 8 | TRAIN Tab Real Data | 1.5h | train.tsx rewrite |
| 9 | HOME Tab Real Data | 1.5h | index.tsx rewrite |
| 10 | Tab Bar Styling | 30min | (tabs)/_layout.tsx |
| 11 | End-to-End Testing | 1h | Manual test + TypeScript check |

**Parallelizable:** Phases 4+5 after Phase 3. Phases 8+9 after Phase 7.

---

## CODING STANDARDS

### TypeScript
- Strict mode enabled. No `any` types except in A2UI data model resolution.
- Use `interface` for object shapes, `type` for unions/intersections.
- All async functions must have try/catch with meaningful error logs.

### NativeWind
- Use className for all styling. Avoid inline `style` objects except for shadows and dynamic values.
- Use `bg-[#hex]` format for custom colors from the design system.

### File Naming
- Components: PascalCase (e.g., `GradientCard.tsx`)
- Stores: kebab-case (e.g., `workout-store.ts`)
- Utils: kebab-case (e.g., `event-emitter.ts`)

### Import Order
```typescript
// 1. React / React Native
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
// 2. Third-party
import { Dumbbell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
// 3. Internal - stores
import { useWorkoutStore } from '../stores';
// 4. Internal - components
import { GradientCard } from '../components/common';
// 5. Internal - utils / types
import { COLORS } from '../theme/colors';
```

### API Calls
- Always use `API_BASE` from `../services/config.ts`
- Always include `Content-Type: application/json` header
- Always handle errors with try/catch

### State Updates
- Never mutate state directly. Always use store actions.
- Use `set((state) => ({ ...spread }))` pattern in Zustand.

---

## VALIDATION CHECKPOINTS

After each phase, verify:

- [ ] **Phase 0:** `npx expo start` runs, Supabase connects, MMKV works, fonts load
- [ ] **Phase 1:** Tables visible in Supabase Dashboard, RLS active
- [ ] **Phase 2:** All micro-endpoints return correct responses, <100ms
- [ ] **Phase 3:** `/api/chat` with event returns A2UI widget array
- [ ] **Phase 4:** Stores initialize, actions call APIs, MMKV persists
- [ ] **Phase 5:** A2UI parser converts sample JSON → ChatMessage
- [ ] **Phase 6:** All 3 widgets render with sample data, active/frozen states
- [ ] **Phase 7:** Full chat flow: send msg → get response → render widget
- [ ] **Phase 8:** TRAIN tab shows real Supabase data, no mocks
- [ ] **Phase 9:** HOME tab shows real stats, missions, streak
- [ ] **Phase 10:** Tab bar matches Genesis Fusion design exactly
- [ ] **Phase 11:** Complete training flow works end-to-end

---

## SUCCESS CRITERIA

### Functional
- [ ] User can receive a WorkoutCard from GENESIS in chat
- [ ] Tapping "START WORKOUT" creates session in Supabase and transforms to LiveSessionTracker
- [ ] User can log sets with weight, reps, RPE
- [ ] Each set logs to Supabase in <100ms
- [ ] PR detection works (compares vs personal_records table)
- [ ] "COMPLETE" transforms to WorkoutComplete with accurate stats
- [ ] Previous widgets freeze correctly (opacity 0.6, no interactions)
- [ ] TRAIN tab shows real workout data from Zustand stores
- [ ] HOME tab shows accurate daily missions and streak
- [ ] Chat and tabs read from the same stores (Single Source of Truth)
- [ ] Data persists across app restarts (MMKV + Supabase)
- [ ] RLS prevents cross-user data access

### Performance
- [ ] Micro-actions: <100ms response time
- [ ] Macro-actions: <2s response time
- [ ] Tab switching: <200ms render
- [ ] Widget transition: <100ms visual update
- [ ] App launch to interactive: <3s
- [ ] No memory leaks from timers or subscriptions

### Design
- [ ] All cards use Genesis Fusion Design System tokens
- [ ] GradientCard for active widgets, StandardCard for frozen
- [ ] JetBrains Mono for labels/stats/nav, Inter for body/titles
- [ ] Purple glow shadows (never gray)
- [ ] Dark gradient backgrounds (#0D0D2B → #1A0A30)
- [ ] Tab bar with violet dot indicator on active tab
- [ ] Chat bubbles with correct alignment and colors

### Code Quality
- [ ] No TypeScript errors: `npx tsc --noEmit` passes
- [ ] No `console.log` in production code (only `console.error` for error handling)
- [ ] All components have typed props interfaces
- [ ] No mock data imports remain in production screens
- [ ] All API URLs use `API_BASE` constant
- [ ] All stores use MMKV persistence
- [ ] Barrel exports for all module directories
- [ ] Backend uses Pydantic models for all request/response schemas

---

## ARCHITECTURE DIAGRAMS

### Data Flow: Create Workout → Complete

```
User taps "START WORKOUT" on WorkoutCard
    │
    ├─ 1. freezeActiveWidget() → WorkoutCard becomes frozen
    │
    ├─ 2. workoutStore.startWorkout(session)
    │      └─ PATCH /api/v1/sessions/:id {status: 'active'}
    │
    ├─ 3. chatStore.sendEvent({ type: 'workout_started', payload })
    │      └─ POST /api/chat {event} → GENESIS
    │           └─ Returns: text + A2UI [createSurface, updateComponents, updateDataModel]
    │                └─ parseA2UIResponse() → ChatMessage with LiveSessionTracker widget
    │
    └─ 4. New message with LiveSessionTracker (state: 'active')

User logs a set
    │
    ├─ 1. workoutStore.logSet(input)
    │      └─ POST /api/v1/sets → {id, is_pr, total_session_volume}
    │
    └─ 2. UI updates: new set in list, volume counter, PR badge if applicable

User taps "DONE"
    │
    ├─ 1. workoutStore.completeWorkout()
    │      └─ PATCH /api/v1/sessions/:id {status: 'completed', duration, volume}
    │
    ├─ 2. chatStore.sendEvent({ type: 'workout_completed', payload })
    │      └─ POST /api/chat {event} → GENESIS
    │           └─ Returns: text + A2UI WorkoutComplete widget
    │
    ├─ 3. freezeActiveWidget() → LiveSessionTracker becomes frozen
    │
    └─ 4. New message with WorkoutComplete (state: 'active')
```

### State Management Topology

```
                    ┌─────────────┐
                    │  Supabase   │ ← Single Source of Truth
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │  REST API   │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────┴─────┐  ┌──────┴──────┐  ┌─────┴─────┐
    │ Workout   │  │   Chat      │  │   User    │
    │ Store     │  │   Store     │  │   Store   │
    └─────┬─────┘  └──────┬──────┘  └─────┬─────┘
          │                │                │
    ┌─────┴────────────────┴────────────────┴─────┐
    │              React Components                │
    │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
    │  │ Chat     │ │ TRAIN    │ │ HOME Tab     │ │
    │  │ Screen   │ │ Tab      │ │              │ │
    │  └──────────┘ └──────────┘ └──────────────┘ │
    └─────────────────────────────────────────────┘
```

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|---------|
| NativeWind classes not applying | Ensure `nativewind/babel` in babel.config.js and restart Metro |
| MMKV crash on iOS | Run `cd ios && pod install` after installing react-native-mmkv |
| Supabase RLS blocking queries | Ensure auth.uid() matches user_id format (TEXT vs UUID) |
| LinearGradient not rendering | Install `expo-linear-gradient` via `npx expo install` |
| Font not loading | Check `expo-font` config in `_layout.tsx`, use exact family names |
| A2UI parse error | Verify backend returns `widgets` as array of objects, not string |

---

## CONFIGURATION FILES

### .env.local (frontend)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_BASE=http://localhost:8000
```

### backend/.env
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GOOGLE_CLOUD_PROJECT=ngx-genesis
```

---

## FILE CHECKLIST

### Create (23 new files)
```
[ ] supabase/migrations/20260205000001_workout_training_flow.sql
[ ] apps/mobile/src/lib/supabase.ts
[ ] apps/mobile/src/lib/mmkv.ts
[ ] apps/mobile/src/lib/a2ui/types.ts
[ ] apps/mobile/src/lib/a2ui/parser.ts
[ ] apps/mobile/src/lib/a2ui/event-emitter.ts
[ ] apps/mobile/src/lib/a2ui/index.ts
[ ] apps/mobile/src/stores/workout-store.ts
[ ] apps/mobile/src/stores/chat-store.ts
[ ] apps/mobile/src/stores/user-store.ts
[ ] apps/mobile/src/stores/index.ts
[ ] apps/mobile/src/components/common/GradientCard.tsx
[ ] apps/mobile/src/components/common/StandardCard.tsx
[ ] apps/mobile/src/components/common/ShineEffect.tsx
[ ] apps/mobile/src/components/common/ColoredPill.tsx
[ ] apps/mobile/src/components/common/index.ts
[ ] apps/mobile/src/components/widgets/LiveSessionTracker.tsx
[ ] apps/mobile/src/components/widgets/WorkoutComplete.tsx
[ ] backend/routers/__init__.py
[ ] backend/routers/v1/__init__.py
[ ] backend/routers/v1/sessions.py
[ ] backend/routers/v1/sets.py
[ ] backend/routers/v1/stats.py
```

### Modify (12 existing files)
```
[ ] apps/mobile/package.json
[ ] apps/mobile/app/chat.tsx
[ ] apps/mobile/app/(tabs)/_layout.tsx
[ ] apps/mobile/app/(tabs)/train.tsx
[ ] apps/mobile/app/(tabs)/index.tsx
[ ] apps/mobile/src/components/widgets/WorkoutCard.tsx
[ ] apps/mobile/src/components/widgets/A2UIMediator.tsx
[ ] apps/mobile/src/components/widgets/index.ts
[ ] backend/main.py
[ ] backend/agent/genesis.py
[ ] backend/instructions/genesis_unified.txt
[ ] backend/tools/generate_widget.py
```

---

**End of Master Prompt. Follow the Implementation Plan phase by phase. Commit after each phase passes validation.**
