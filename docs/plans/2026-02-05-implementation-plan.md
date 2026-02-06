# NGX GENESIS — A2UI Training Flow Implementation Plan

**Target:** Complete implementation of the A2UI Training Flow (reference flow)
**Design Doc:** `docs/plans/2026-02-05-a2ui-training-flow-design.md`
**Master Prompt:** `docs/plans/2026-02-05-claude-code-master-prompt.md`

---

## Phase 0: Environment & Dependencies Setup

### What to Build
Verify and install all required dependencies for both frontend and backend. Ensure Supabase connection works. Create utility files for storage and database client.

### Files to Create/Modify
```
apps/mobile/src/lib/supabase.ts        ← Supabase client with auth context
apps/mobile/src/lib/mmkv.ts            ← MMKV storage adapter for Zustand
apps/mobile/package.json               ← Add new dependencies
backend/requirements.txt               ← Verify FastAPI deps
.env.example                           ← Document env vars needed
```

### Dependencies to Install

**Frontend (npm):**
```bash
cd apps/mobile
npx expo install zustand react-native-mmkv expo-linear-gradient @supabase/supabase-js
npx expo install lucide-react-native react-native-svg
```

**Backend (pip):**
```bash
pip install supabase python-dotenv
```

### Validation
- [ ] `npx expo start` runs without errors
- [ ] Supabase client initializes and connects
- [ ] MMKV storage reads/writes test data
- [ ] All fonts (JetBrains Mono, Inter) load correctly

---

## Phase 1: Supabase Schema Migration

### What to Build
Create database tables for workout tracking with RLS policies and indexes.

### Files to Create
```
supabase/migrations/20260205000001_workout_training_flow.sql
```

### SQL Migration Content
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
```

### Dependencies
- Phase 0 complete (Supabase client working)
- `seasons` table must exist (from previous migrations)

### Validation
- [ ] `supabase db push` or `supabase migration up` succeeds
- [ ] Tables visible in Supabase dashboard
- [ ] RLS policies active (test with different user IDs)
- [ ] Indexes created

---

## Phase 2: Backend Micro-action Endpoints

### What to Build
New FastAPI router with direct REST endpoints for fast, LLM-free data operations.

### Files to Create/Modify
```
backend/routers/__init__.py              ← Package init
backend/routers/v1/__init__.py           ← V1 router package
backend/routers/v1/sets.py               ← POST /api/v1/sets
backend/routers/v1/sessions.py           ← PATCH/GET session endpoints
backend/routers/v1/stats.py              ← GET /api/v1/stats/today
backend/routers/v1/meals.py              ← POST /api/v1/meals
backend/schemas/workout.py               ← Pydantic models
backend/main.py                          ← Register new router
```

### Endpoint Specifications

**POST /api/v1/sets**
```python
class SetLogCreate(BaseModel):
    session_id: str
    exercise_name: str
    exercise_order: int
    set_number: int
    weight_kg: float
    reps: int
    rpe: Optional[int] = None

class SetLogResponse(BaseModel):
    id: str
    is_pr: bool
    total_session_volume: float
```

**PATCH /api/v1/sessions/{session_id}**
```python
class SessionUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    genesis_note: Optional[str] = None
```

**GET /api/v1/sessions/active**
- Query param: `user_id`
- Returns active session with set_logs joined

**GET /api/v1/stats/today**
- Query param: `user_id`
- Returns: `{ volume, meals_logged, streak, workout_status }`

**POST /api/v1/meals**
```python
class MealLogCreate(BaseModel):
    user_id: str
    meal_type: str  # breakfast, lunch, dinner, snack
    food_items: list[str]
    calories: Optional[int] = None
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
```

### Dependencies
- Phase 1 complete (tables exist)
- Supabase service client configured

### Validation
- [ ] Each endpoint returns correct status codes
- [ ] POST /api/v1/sets creates record in Supabase
- [ ] PR detection works (compares against previous max for same exercise)
- [ ] Volume calculation is accurate
- [ ] Response time <100ms for all micro-actions

---

## Phase 3: Backend Macro-action Event System

### What to Build
Extend the existing `/api/chat` endpoint to accept an optional `event` field that provides context to GENESIS for generating situational A2UI widgets.

### Files to Modify
```
backend/main.py                          ← Add event field to ChatRequest
backend/agent/genesis.py                 ← Process events before agent call
backend/instructions/genesis_unified.txt ← Add workout event handling rules
backend/tools/generate_widget.py         ← Output A2UI protocol format
backend/schemas/chat.py                  ← ChatRequest/Response models
```

### Key Changes

**ChatRequest schema update:**
```python
class ChatEvent(BaseModel):
    type: str  # "workout_started", "workout_completed"
    payload: dict

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    event: Optional[ChatEvent] = None
```

**ChatResponse update:**
```python
class ChatResponse(BaseModel):
    response: str
    widgets: Optional[list[dict]] = None  # A2UI messages
```

**Agent instruction additions (use (variable) syntax):**
```
When receiving a workout_started event:
- Create a LiveSessionTracker A2UI surface for session (session_id)
- Include exercise list from (exercises) in the data model
- Respond with encouragement for (workout_title)

When receiving a workout_completed event:
- Create a WorkoutComplete A2UI surface
- Include summary: (total_volume)kg in (duration)min
- Analyze performance vs previous sessions
- Generate insight for next session
```

**Widget output format (A2UI v0.10):**
```python
def generate_a2ui_widget(widget_type: str, surface_id: str, data: dict) -> list[dict]:
    return [
        {
            "version": "v0.10",
            "createSurface": {
                "surfaceId": surface_id,
                "catalogId": "https://ngx.genesis/catalogs/v1/fitness.json",
                "theme": {"primaryColor": "#6D00FF", "agentDisplayName": "GENESIS"},
                "sendDataModel": True
            }
        },
        {
            "version": "v0.10",
            "updateComponents": {
                "surfaceId": surface_id,
                "components": [build_component(widget_type, data)]
            }
        },
        {
            "version": "v0.10",
            "updateDataModel": {
                "surfaceId": surface_id,
                "dataModel": data
            }
        }
    ]
```

### Dependencies
- Phase 2 complete (micro-actions work)
- Existing /api/chat endpoint functional

### Validation
- [ ] POST /api/chat with event field returns widgets array
- [ ] GENESIS contextualizes response based on event type
- [ ] A2UI messages parse correctly (valid JSON structure)
- [ ] No regression on normal text-only chat

---

## Phase 4: Zustand State Management

### What to Build
Three Zustand stores that serve as the bridge between chat and tabs, with MMKV persistence.

### Files to Create
```
apps/mobile/src/stores/workout-store.ts
apps/mobile/src/stores/chat-store.ts
apps/mobile/src/stores/user-store.ts
apps/mobile/src/stores/index.ts          ← Barrel export
```

### Store Specifications

**workout-store.ts:**
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mmkvStorage } from '../lib/mmkv'

interface WorkoutStore {
  activeSession: WorkoutSession | null
  sets: SetLog[]
  status: 'idle' | 'active' | 'completed'

  startWorkout: (session: WorkoutSession) => Promise<void>
  logSet: (input: SetLogInput) => Promise<SetLog>
  completeWorkout: () => Promise<void>
  reset: () => void
}

// startWorkout: PATCH session status → 'active', update store
// logSet: POST /api/v1/sets, push to sets[], update volume
// completeWorkout: PATCH session status → 'completed', trigger chat event
```

**chat-store.ts:**
```typescript
interface ChatStore {
  messages: ChatMessage[]
  isLoading: boolean
  activeWidgetId: string | null

  sendMessage: (text: string) => Promise<void>
  sendEvent: (event: ChatEvent) => Promise<void>
  addMessage: (msg: ChatMessage) => void
  freezeActiveWidget: () => void
  updateWidget: (msgId: string, updates: Partial<WidgetPayload>) => void
  reset: () => void
}

// sendMessage: POST /api/chat, parse response, add messages
// sendEvent: POST /api/chat with event field, parse A2UI widgets
// freezeActiveWidget: find active widget, set state → 'frozen'
```

**user-store.ts:**
```typescript
interface UserStore {
  profile: UserProfile | null
  season: Season | null
  currentWeek: number
  todayStats: TodayStats | null

  fetchProfile: () => Promise<void>
  fetchTodayStats: () => Promise<void>
}

// fetchProfile: GET from Supabase user_profiles
// fetchTodayStats: GET /api/v1/stats/today
```

### Dependencies
- Phase 0 complete (MMKV installed)
- Phase 2 complete (API endpoints exist for logSet, etc.)

### Validation
- [ ] Stores initialize without errors
- [ ] Actions trigger API calls correctly
- [ ] MMKV persistence survives app restart
- [ ] Multiple stores can read/write independently

---

## Phase 5: A2UI Protocol Layer

### What to Build
TypeScript layer that parses A2UI v0.10 messages from the backend and converts widget actions into events sent back.

### Files to Create
```
apps/mobile/src/lib/a2ui/types.ts        ← A2UI v0.10 interfaces
apps/mobile/src/lib/a2ui/parser.ts       ← Parse backend response → ChatMessages
apps/mobile/src/lib/a2ui/event-emitter.ts ← Widget actions → API events
apps/mobile/src/lib/a2ui/index.ts        ← Barrel export
```

### Type Definitions (types.ts)
```typescript
interface A2UIMessage {
  version: 'v0.10'
  createSurface?: CreateSurface
  updateComponents?: UpdateComponents
  updateDataModel?: UpdateDataModel
  deleteSurface?: DeleteSurface
}

interface CreateSurface {
  surfaceId: string
  catalogId: string
  theme?: { primaryColor: string; agentDisplayName: string }
  sendDataModel?: boolean
}

interface UpdateComponents {
  surfaceId: string
  components: A2UIComponent[]
}

interface A2UIComponent {
  id: string
  component: string  // "WorkoutCard", "LiveSessionTracker", etc.
  [key: string]: any  // Props with JSON Pointer data bindings
  action?: {
    event: {
      name: string
      context?: Record<string, any>
    }
  }
}

interface UpdateDataModel {
  surfaceId: string
  dataModel: Record<string, any>
}

interface DeleteSurface {
  surfaceId: string
}
```

### Parser (parser.ts)
```typescript
export function parseA2UIResponse(
  widgets: A2UIMessage[],
  textResponse: string
): ChatMessage {
  // Group messages by surfaceId
  // Extract component type and props
  // Resolve JSON Pointer data bindings against dataModel
  // Return ChatMessage with widget field populated
}
```

### Event Emitter (event-emitter.ts)
```typescript
export function createWidgetEvent(
  actionName: string,
  context: Record<string, any>,
  surfaceId: string
): ChatEvent {
  return {
    type: actionName,
    payload: { ...context, surfaceId }
  }
}
```

### Modify Existing
```
apps/mobile/src/components/widgets/A2UIMediator.tsx ← Use new parser
```

### Dependencies
- Phase 4 complete (stores exist to consume parsed messages)

### Validation
- [ ] Parse sample A2UI JSON → correct ChatMessage structure
- [ ] JSON Pointer resolution works ("/workout/title" → actual value)
- [ ] Event emitter produces correct payload format
- [ ] A2UIMediator renders correct component based on type

---

## Phase 6: Widget Components — Training Flow

### What to Build
Three core widgets for the training flow, plus shared card components, all styled with Genesis Fusion Design System.

### Files to Create/Modify
```
apps/mobile/src/components/common/GradientCard.tsx     ← Reusable gradient border card
apps/mobile/src/components/common/StandardCard.tsx     ← Reusable standard card
apps/mobile/src/components/common/ShineEffect.tsx      ← 1px shine overlay
apps/mobile/src/components/common/ColoredPill.tsx      ← Tag/pill component
apps/mobile/src/components/common/index.ts

apps/mobile/src/components/widgets/WorkoutCard.tsx     ← REFACTOR for A2UI + events
apps/mobile/src/components/widgets/LiveSessionTracker.tsx  ← NEW
apps/mobile/src/components/widgets/WorkoutComplete.tsx     ← NEW
apps/mobile/src/components/widgets/index.ts            ← Update exports
```

### Component Specifications

**GradientCard.tsx:**
- LinearGradient border: `#b39aff` → `#6c3bff`
- Inner bg: `#1e1f2aCC`
- Shadow: `shadowColor: '#6c3bff', opacity: 0.25, radius: 16`
- Props: `children, frozen?: boolean` (if frozen: no glow, opacity 0.6)

**WorkoutCard.tsx (refactored):**
- Accept A2UI-style props: `{ title, exercises, estimatedTime, tags, onStart }`
- Accept `frozen` prop for lifecycle
- Layout: title → exercise list (List Item Cards) → time pill → CTA button
- CTA: "START WORKOUT" gradient button → calls `onStart` → triggers macro-action
- Active: Gradient Card | Frozen: Standard Card with opacity 0.6

**LiveSessionTracker.tsx (new):**
- Props: `{ sessionId, currentExercise, completedSets, onLogSet, onComplete, frozen }`
- Layout: exercise header → completed sets list → input form → buttons
- Input form: weight (TextInput), reps (TextInput), RPE (1-10 selector)
- "LOG SET" button → calls `onLogSet` → micro-action POST /api/v1/sets
- "COMPLETE" button → calls `onComplete` → macro-action
- Live timer using `useEffect` with `setInterval`
- Volume counter updates on each logged set

**WorkoutComplete.tsx (new):**
- Props: `{ totalVolume, duration, totalSets, prs[], genesisNote, frozen }`
- Layout: volume (large number) → duration → PR badges → genesis note
- Non-interactive (display only)
- PR badges: green pill with trophy icon for each PR
- Genesis note: italic text with sparkles icon

### Dependencies
- Phase 5 complete (A2UI types and parser exist)
- Phase 4 complete (stores for logSet, completeWorkout)

### Validation
- [ ] Each widget renders with sample data
- [ ] Active vs frozen styling is visually distinct
- [ ] WorkoutCard CTA triggers event correctly
- [ ] LiveSessionTracker form validates inputs
- [ ] Timer increments every second
- [ ] WorkoutComplete shows PR badges correctly

---

## Phase 7: Chat Screen Integration

### What to Build
Rewrite the chat screen to use Zustand stores, render A2UI widgets inline, and manage widget lifecycle.

### Files to Modify
```
apps/mobile/app/chat.tsx                 ← Full rewrite
apps/mobile/src/hooks/useChat.ts         ← Replace with store-based hook (or remove)
```

### Chat Screen Layout
```
┌─────────────────────────────────┐
│ Header: "GENESIS" + back button │
├─────────────────────────────────┤
│ ScrollView (messages)           │
│ ├── Genesis text message        │
│ ├── User text message           │
│ ├── Genesis msg + WorkoutCard   │ ← active widget
│ ├── User msg "Starting!"        │
│ ├── Genesis msg + Tracker       │ ← active widget (prev freezes)
│ └── ...                         │
├─────────────────────────────────┤
│ Input bar: TextInput + Send btn │
└─────────────────────────────────┘
```

### Key Implementation Details
- Use `useChatStore` for all message state
- Render widget based on `message.widget.type` using switch statement
- Pass `frozen={message.widget.state === 'frozen'}` to widget components
- Connect widget action handlers to `useChatStore.sendEvent()`
- Connect `LiveSessionTracker.onLogSet` to `useWorkoutStore.logSet()`
- Auto-scroll to bottom on new message
- Loading state: typing indicator when `isLoading`
- Chat bubble styling:
  - GENESIS: surface-elevated bg, left-aligned, rounded-[16px] (no bottom-left)
  - User: primary-deep bg at 30%, right-aligned, rounded-[16px] (no bottom-right)

### Dependencies
- Phase 6 complete (widgets exist)
- Phase 4 complete (stores working)
- Phase 5 complete (A2UI parser converts backend response to messages)

### Validation
- [ ] Messages render correctly (text + widgets)
- [ ] Widget lifecycle works: new widget → previous freezes
- [ ] Send message triggers API call and shows response
- [ ] Send event triggers macro-action and shows new widget
- [ ] Log set in LiveSessionTracker works (micro-action)
- [ ] Auto-scroll works on new messages
- [ ] Loading indicator shows during API calls

---

## Phase 8: TRAIN Tab — Real Data

### What to Build
Replace mock data in TRAIN tab with real Supabase data via Zustand stores. Implement 3-layer layout.

### Files to Modify
```
apps/mobile/app/(tabs)/train.tsx         ← Full rewrite
```

### Layout Structure
```
Header (Gradient Card):
  - Today's workout title
  - Status pill (planned/active/completed)
  - Muscle group pills

Modules (exercise cards):
  - List Item Cards for each exercise
  - Sets/reps targets
  - Volume summary card

History (recent workouts):
  - Last 5-10 workout sessions
  - Each: title, date, volume, status pill
  - Tap to view details
```

### Data Sources
- `useWorkoutStore.activeSession` → current workout
- `useUserStore.todayStats` → status indicators
- Supabase query for workout history (past sessions)

### Dependencies
- Phase 4 complete (stores)
- Phase 1 complete (tables with data)

### Validation
- [ ] Tab shows real workout data from Supabase
- [ ] Active session shows inline if in progress
- [ ] Exercise cards display correctly with Genesis Fusion styling
- [ ] History list loads and scrolls
- [ ] No mock data references remain

---

## Phase 9: HOME Tab — Real Data

### What to Build
Replace mock data in HOME tab with real user stats and today's mission status.

### Files to Modify
```
apps/mobile/app/(tabs)/index.tsx         ← Full rewrite
```

### Layout (from design doc)
```
Header:
  - "Hey, [Name]" greeting
  - "Ready to conquer today?" subtitle

DAILY MISSIONS (3 cards):
  - Train: from workout status
  - Log: from meals logged count
  - Check-in: from checkin status

THIS WEEK (progress card):
  - Week progress bar
  - Day indicators (Mon-Sun)

GENESIS AI (message card):
  - Latest GENESIS message from chat
  - Gradient Card styling

STREAK (card):
  - Streak count from todayStats
  - Flame icon
```

### Data Sources
- `useUserStore.profile` → name
- `useUserStore.todayStats` → missions, streak
- `useChatStore.messages` → latest GENESIS message

### Dependencies
- Phase 4 complete (stores)
- Phase 8 complete (TRAIN tab pattern established)

### Validation
- [ ] Greeting shows real user name
- [ ] Mission cards reflect actual completion status
- [ ] Week progress uses real data
- [ ] Streak is accurate
- [ ] No mock data references remain

---

## Phase 10: Tab Bar Styling

### What to Build
Apply Genesis Fusion Design System to the tab bar navigation.

### Files to Modify
```
apps/mobile/app/(tabs)/_layout.tsx       ← Tab bar styling
```

### Specifications
- Background: `#14121aCC` with blur effect
- Icons: 22px from `lucide-react-native`
  - Home → `Home`
  - Train → `Dumbbell`
  - Fuel → `Flame`
  - Mind → `Brain`
  - Track → `BarChart3`
- Labels: JetBrains Mono, 9px, uppercase, tracking 0.5px
- Active: `#b39aff` text + 4px dot indicator below
- Inactive: `#6b6b7b` text
- Safe area padding at bottom

### Dependencies
- Phase 0 complete (fonts and icons installed)

### Validation
- [ ] Tab bar matches Genesis Fusion design
- [ ] Active/inactive states correct
- [ ] Dot indicator visible on active tab
- [ ] Blur background effect works on iOS
- [ ] Labels use JetBrains Mono

---

## Phase 11: End-to-End Testing

### What to Test

**Test 1: Complete Training Flow**
1. Open HOME tab → see today's workout in missions
2. Navigate to chat → GENESIS proposes workout (WorkoutCard widget)
3. Tap "START WORKOUT" → widget freezes → LiveSessionTracker appears
4. Log 3 sets (weight, reps, RPE) → each set appears in tracker
5. Tap "COMPLETE" → tracker freezes → WorkoutComplete appears
6. See summary with volume, duration, GENESIS note
7. Navigate to TRAIN tab → see completed workout
8. Navigate to HOME → see updated mission status

**Test 2: Cross-View Sync**
1. Start workout in chat
2. Switch to TRAIN tab → see active session
3. Log set in TRAIN tab → switch to chat → see updated tracker
4. Complete in chat → TRAIN tab shows completed

**Test 3: Persistence**
1. Start workout → log 2 sets → kill app
2. Reopen app → active session restores from MMKV
3. Continue logging → complete → data intact in Supabase

**Test 4: RLS Security**
1. Log in as User A → create workout → log sets
2. Log in as User B → verify cannot see User A's data
3. Verify RLS on both workout_sessions and set_logs

### Performance Targets
- Micro-actions (log set): <100ms response
- Macro-actions (start/complete workout): <2s response
- Tab switching: <200ms render
- Widget freeze/transform: <100ms visual update

### Validation
- [ ] All 4 test scenarios pass
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No console errors during flow
- [ ] Performance targets met
- [ ] App builds for both iOS and Android

---

## Critical Path

```
Phase 0 (Environment)
    │
    ▼
Phase 1 (Schema) ──────────────────┐
    │                               │
    ▼                               │
Phase 2 (Micro-actions) ◄──────────┘
    │
    ▼
Phase 3 (Macro-actions)
    │
    ├── Phase 4 (Stores) ──── Phase 5 (A2UI Layer)
    │                              │
    │                              ▼
    │                         Phase 6 (Widgets)
    │                              │
    └──────────────────────── Phase 7 (Chat Screen)
                                   │
                              ┌────┴────┐
                              ▼         ▼
                         Phase 8    Phase 9
                         (TRAIN)    (HOME)
                              │         │
                              └────┬────┘
                                   ▼
                              Phase 10 (Tab Bar)
                                   │
                                   ▼
                              Phase 11 (E2E Test)
```

**Parallelizable:** Phases 4+5 can run in parallel after Phase 3.
**Parallelizable:** Phases 8+9 can run in parallel after Phase 7.

---

## File Summary at Completion

### New Files (21)
```
supabase/migrations/20260205000001_workout_training_flow.sql
backend/routers/__init__.py
backend/routers/v1/__init__.py
backend/routers/v1/sets.py
backend/routers/v1/sessions.py
backend/routers/v1/stats.py
backend/routers/v1/meals.py
backend/schemas/workout.py
apps/mobile/src/lib/supabase.ts
apps/mobile/src/lib/mmkv.ts
apps/mobile/src/stores/workout-store.ts
apps/mobile/src/stores/chat-store.ts
apps/mobile/src/stores/user-store.ts
apps/mobile/src/stores/index.ts
apps/mobile/src/lib/a2ui/types.ts
apps/mobile/src/lib/a2ui/parser.ts
apps/mobile/src/lib/a2ui/event-emitter.ts
apps/mobile/src/lib/a2ui/index.ts
apps/mobile/src/components/common/GradientCard.tsx
apps/mobile/src/components/common/StandardCard.tsx
apps/mobile/src/components/common/ShineEffect.tsx
apps/mobile/src/components/common/ColoredPill.tsx
apps/mobile/src/components/common/index.ts
```

### Modified Files (12)
```
apps/mobile/package.json
backend/requirements.txt
backend/main.py
backend/agent/genesis.py
backend/instructions/genesis_unified.txt
backend/tools/generate_widget.py
apps/mobile/src/components/widgets/WorkoutCard.tsx
apps/mobile/src/components/widgets/A2UIMediator.tsx
apps/mobile/src/components/widgets/index.ts
apps/mobile/app/chat.tsx
apps/mobile/app/(tabs)/train.tsx
apps/mobile/app/(tabs)/index.tsx
apps/mobile/app/(tabs)/_layout.tsx
```

### New Widget Files (2)
```
apps/mobile/src/components/widgets/LiveSessionTracker.tsx
apps/mobile/src/components/widgets/WorkoutComplete.tsx
```

---

**Total estimated phases:** 12 (including Phase 0)
**Commit strategy:** One commit per completed phase
**Rollback strategy:** Each phase is independently revertible
