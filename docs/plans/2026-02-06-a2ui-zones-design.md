# NGX GENESIS A2UI Zones Architecture Design Document

**Version:** 1.0
**Date:** 2026-02-06
**Status:** Validated Design (Post-Brainstorm)
**Stack:** Expo SDK 54, React Native 0.81, Expo Router v6, NativeWind v4, Zustand v5, FastAPI

---

## Executive Summary

This document captures the validated architecture for NGX GENESIS mobile app's UI/interaction evolution. The core innovation is a **3-Zone Layout System** that separates concerns between persistent application state (ContextBar), conversational flow (ChatStream), and high-priority overlays (FloatingWidget). This is paired with a new **A2UI Interpreter** that processes multi-operation backend responses and routes them to appropriate stores and UI zones.

The design standardizes on **GENESIS as the UI Director** — a fully autonomous agent capable of orchestrating complex UI workflows across all three zones in a single response, without app-level logic intermediaries.

---

## Table of Contents

1. [3-Zone Layout Architecture](#3-zone-layout-architecture)
2. [SurfaceStore: The Widget State Management Layer](#surfacestore-the-widget-state-management-layer)
3. [A2UI Interpreter: Response Processing Pipeline](#a2ui-interpreter-response-processing-pipeline)
4. [Backend Orchestration & Protocol Changes](#backend-orchestration--protocol-changes)
5. [Data Flow: Before & After](#data-flow-before--after)
6. [Sprint 2: Micro-Acciones Silenciosas (Milestone Futuro)](#sprint-2-micro-acciones-silenciosas-milestone-futuro)
7. [Typography & UI Language Integration](#typography--ui-language-integration)
8. [Technical Specifications](#technical-specifications)
9. [Remediation Items Integrated](#remediation-items-integrated)
10. [Source Analysis Credits](#source-analysis-credits)

---

## 3-Zone Layout Architecture

### Overview

The chat screen is divided into three distinct zones, each with its own lifecycle, update mechanism, and persistence strategy:

```
┌─────────────────────────────────────────┐
│  ZONE A: ContextBar (Sticky, ~80px)     │  <- GENESIS metrics, session state, timer
│  Controlled by Surface ID 'context'     │
├─────────────────────────────────────────┤
│                                         │
│  ZONE B: ChatStream (Flex-1)            │
│  ├─ FlatList (inverted chat)            │  <- Text messages only
│  ├─ Message rendering                  │  <- Linked surfaces via surfaceId
│  └─ ChatInput component                 │
│                                         │
│  Flex-1 container with scroll           │
├──────────────────┬──────────────────────┤
│                  │                      │
│                  │  ZONE C:             │
│                  │  FloatingWidget      │  <- LiveSessionTracker, rest timer
│                  │  Absolute, ~90px     │     High-priority overlays
│                  │  above tab bar       │
│                  │                      │
└──────────────────┴──────────────────────┘
      TAB BAR (with labels in JetBrains Mono)
```

### Zone A: ContextBar

**Purpose:** Display persistent application state, live metrics, session information.

**Characteristics:**
- Fixed height: ~80px
- Position: Sticky, sticky top (always visible)
- Controlled by GENESIS via SurfaceStore
- Mounts/unmounts based on active surface with `zone: "context"`
- Renders ONE active context surface at a time
- Examples: training session metrics, live heart rate, rep counter, timer display

**Rendering Logic:**
```jsx
// app/screens/chat.tsx - Zone A
const contextSurfaces = surfaceStore.getContextSurfaces();
const activeSurface = contextSurfaces.find(s => s.state === 'active');

return (
  <View style={styles.zoneA}>
    {activeSurface && (
      <Surface
        surface={activeSurface}
        zone="context"
      />
    )}
  </View>
);
```

### Zone B: ChatStream

**Purpose:** Conversational message flow with simplified message rendering.

**Characteristics:**
- Flex-1 container with KeyboardAvoidingView
- InvertedFlatList for chat messages
- Only supports text messages (no embedded widgets)
- ChatInput component at bottom
- Messages can link to surfaces via `surfaceId` field
- Simplified message shape: `{id, role, text, agent, timestamp, surfaceId?}`

**Update Triggers:**
- User sends text via ChatInput → POST /api/chat → response text operations → chat-store.addMessage()
- Response includes surfaceId if a surface is active in overlay zone
- No direct widget mounting in this zone — surfaces appear in Zone C (overlay)

**Rendering Logic:**
```jsx
// app/screens/chat.tsx - Zone B
const messages = chatStore.messages;

return (
  <FlatList
    inverted
    data={messages}
    renderItem={({ item }) => (
      <View style={styles.messageBubble}>
        <Text>{item.text}</Text>
        {item.agent && <AgentLabel>{item.agent}</AgentLabel>}
        {/* Surface reference: item.surfaceId links to Zone C */}
      </View>
    )}
  />
);
```

### Zone C: FloatingWidget

**Purpose:** High-priority, user-attention-demanding overlays and micro-interactions.

**Characteristics:**
- Absolute positioning, bottom ~90px above tab bar
- Only ONE surface active at a time in overlay zone
- Mounts/unmounts based on GENESIS createSurface with `zone: "overlay"`
- Use cases: LiveSessionTracker (countdown timer), rest timer, session completion widget
- Can receive updates via updateDataModel or updateComponents
- Dismissed via deleteSurface or user action (freezeActiveWidget)

**Update Triggers:**
- GENESIS sends createSurface operation with `zone: "overlay"` → surface-store.createSurface()
- Surface-store triggers re-render in Zone C
- DataModel updates via updateDataModel operation
- Deletion via deleteSurface operation or auto-dismiss after timeout

**Rendering Logic:**
```jsx
// app/screens/chat.tsx - Zone C
const overlaySurfaces = surfaceStore.getOverlaySurfaces();
const activeSurface = overlaySurfaces.find(s => s.state === 'active');

return (
  <View style={styles.zoneC}>
    {activeSurface && (
      <Surface
        surface={activeSurface}
        zone="overlay"
        onDismiss={() => surfaceStore.deleteSurface(activeSurface.id)}
      />
    )}
  </View>
);
```

---

## SurfaceStore: The Widget State Management Layer

### Purpose

A dedicated Zustand store that manages ALL widget surfaces across the three zones. Surfaces represent instantiated widgets with full lifecycle management.

### Store Shape

```typescript
interface Surface {
  id: string;                        // Unique surface ID (UUID)
  zone: 'context' | 'stream' | 'overlay';  // Target zone
  widgetType: string;               // e.g., 'LiveSessionTracker', 'RestTimer'
  dataModel: Record<string, any>;    // Widget-specific data
  state: 'active' | 'frozen' | 'dismissed';  // Lifecycle state
  linkedMessageId?: string;          // Back-reference to message in chat
  createdAt: number;                 // Timestamp
}

interface SurfaceStore {
  surfaces: Surface[];
  createSurface(params: CreateSurfaceParams): Surface;
  updateComponents(surfaceId: string, changes: any): void;
  updateDataModel(surfaceId: string, dataModel: any): void;
  deleteSurface(surfaceId: string): void;
  freezeSurface(surfaceId: string): void;
  getContextSurfaces(): Surface[];
  getStreamSurfaces(): Surface[];
  getOverlaySurfaces(): Surface[];
}
```

### Key Actions

#### createSurface
```typescript
surfaceStore.createSurface({
  zone: 'overlay',
  widgetType: 'LiveSessionTracker',
  dataModel: {
    exerciseName: 'Bench Press',
    repsRemaining: 8,
    timerSeconds: 30,
    sessionState: 'active'
  },
  linkedMessageId: 'msg-123'
});
// Returns Surface object with auto-generated id
```

#### updateDataModel
Updates widget internal state without remounting:
```typescript
surfaceStore.updateDataModel('surface-456', {
  timerSeconds: 29,
  repsRemaining: 7
});
// Triggers re-render with new dataModel
```

#### freezeSurface
Freezes surface (no updates) but keeps visible. Used when transitioning between zones:
```typescript
surfaceStore.freezeSurface('surface-456');
// surface.state = 'frozen'
// Component receives frozen=true prop, stops listening to updates
```

#### deleteSurface
Removes surface from store and unmounts component:
```typescript
surfaceStore.deleteSurface('surface-456');
// Removes from surfaces array, triggers re-render in zone
```

### Persistence

All surfaces persisted via **MMKV** (React Native key-value store):
- Key: `genesis:surfaces`
- Value: JSON stringified surfaces array
- Hydrated on app launch via Zustand's persist middleware
- Cleared on logout

### Zone Selectors

```typescript
// Get all surfaces for a specific zone
const contextSurfaces = surfaceStore.getContextSurfaces();
const overlaySurfaces = surfaceStore.getOverlaySurfaces();

// Typically used to find single active surface:
const activeSurface = overlaySurfaces.find(s => s.state === 'active');
```

---

## A2UI Interpreter: Response Processing Pipeline

### Purpose

New function `interpretResponse()` replaces old `parseResponse()`. Processes ALL operations in the backend response's operations array and routes each to appropriate store.

### Architecture

```
Backend Response
       ↓
┌─────────────────────────────────────┐
│   interpretResponse(response)        │
│   - Validate operations array        │
│   - Iterate each operation           │
└─────────────────────────────────────┘
       ↓
   ┌───┴────────────────────────────┬──────────┐
   ↓                                ↓          ↓
[TEXT]                      [createSurface] [updateDataModel]
   ↓                                ↓          ↓
chat-store                   surface-store  surface-store
.addMessage()                .createSurface().updateDataModel()
   ↓                                ↓          ↓
Zone B                          Zone A/C    Zone A/C
```

### Function Signature

```typescript
function interpretResponse(response: APIResponse): void {
  if (!response.operations || !Array.isArray(response.operations)) {
    console.warn('No operations in response');
    return;
  }

  response.operations.forEach((op) => {
    switch (op.type) {
      case 'text':
        handleTextOperation(op);
        break;
      case 'createSurface':
        handleCreateSurfaceOperation(op);
        break;
      case 'updateComponents':
        handleUpdateComponentsOperation(op);
        break;
      case 'updateDataModel':
        handleUpdateDataModelOperation(op);
        break;
      case 'deleteSurface':
        handleDeleteSurfaceOperation(op);
        break;
      default:
        console.warn(`Unknown operation type: ${op.type}`);
    }
  });
}
```

### Operation Handlers

#### Text Operation Handler
```typescript
function handleTextOperation(op: TextOperation): void {
  chatStore.addMessage({
    id: op.id || generateId(),
    role: op.role || 'assistant',
    text: op.text,
    agent: op.agent,
    timestamp: Date.now(),
    surfaceId: op.surfaceId  // Optional: links to overlay surface
  });
}
```

#### CreateSurface Operation Handler
```typescript
function handleCreateSurfaceOperation(op: CreateSurfaceOp): void {
  surfaceStore.createSurface({
    zone: op.zone,
    widgetType: op.widgetType,
    dataModel: op.dataModel || {},
    linkedMessageId: op.linkedMessageId
  });
}
```

#### UpdateDataModel Operation Handler
```typescript
function handleUpdateDataModelOperation(op: UpdateDataModelOp): void {
  surfaceStore.updateDataModel(op.surfaceId, op.dataModel);
}
```

#### UpdateComponents Operation Handler
```typescript
function handleUpdateComponentsOperation(op: UpdateComponentsOp): void {
  // For future use: component-level updates (styling, visibility)
  surfaceStore.updateComponents(op.surfaceId, op.changes);
}
```

#### DeleteSurface Operation Handler
```typescript
function handleDeleteSurfaceOperation(op: DeleteSurfaceOp): void {
  surfaceStore.deleteSurface(op.surfaceId);
}
```

### Response Processing Flow (Detailed)

1. **API Call:** User sends message via ChatInput
2. **Backend Processing:** FastAPI receives message, calls GENESIS via ADK
3. **GENESIS Response:** Returns operations array with multiple operations
4. **interpretResponse():** Iterates operations array
5. **Routing:** Each operation routed to correct store/handler
6. **State Updates:** Stores update their state (chat-store, surface-store)
7. **Re-renders:** React components re-render with new state
8. **UI Update:** Zone A/B/C display updated surfaces and messages

**Example Response:**
```json
{
  "operations": [
    {
      "type": "text",
      "role": "assistant",
      "text": "Great! Let's start your workout. I'll track your progress.",
      "agent": "GENESIS"
    },
    {
      "type": "createSurface",
      "zone": "context",
      "widgetType": "SessionMetrics",
      "dataModel": {
        "exerciseName": "Bench Press",
        "sets": 3,
        "reps": 8,
        "weight": "185 lbs"
      }
    },
    {
      "type": "createSurface",
      "zone": "overlay",
      "widgetType": "LiveSessionTracker",
      "dataModel": {
        "currentSet": 1,
        "repsRemaining": 8,
        "timerSeconds": 120
      }
    }
  ]
}
```

---

## Backend Orchestration & Protocol Changes

### Response Format Evolution

**Old Format (Phase 1):**
```json
{
  "message": "text response",
  "widget": { "type": "...", "data": {} }
}
```

**New Format (Phase 2 - A2UI v0.10):**
```json
{
  "operations": [
    { "type": "text", "text": "...", "role": "assistant" },
    { "type": "createSurface", "zone": "overlay", ... },
    { "type": "updateDataModel", "surfaceId": "...", ... }
  ]
}
```

### Backend Generate Widget Endpoint

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "message": "Start training",
  "sessionId": "session-123",
  "metadata": {
    "userId": "user-456",
    "device": "iphone"
  }
}
```

**Response (New Structure):**
```json
{
  "operations": [
    {
      "type": "text",
      "text": "Starting your training session...",
      "agent": "GENESIS"
    },
    {
      "type": "updateDataModel",
      "surfaceId": "context-surface-1",
      "dataModel": {
        "sessionState": "active",
        "startTime": 1707287000000
      }
    },
    {
      "type": "createSurface",
      "zone": "overlay",
      "widgetType": "LiveSessionTracker",
      "dataModel": {
        "exerciseName": "Bench Press",
        "repsRemaining": 8,
        "timerSeconds": 30
      }
    }
  ]
}
```

### GENESIS Unified Instructions (genesis_unified.txt)

Updated system prompt teaches GENESIS when to use each zone and operation type:

```
# Zone Selection Guidelines

## Zone A (ContextBar)
Use createSurface with zone="context" when:
- Displaying persistent session metrics (exercise name, sets/reps, timer)
- Showing live user data that doesn't demand immediate user action
- Creating stable header information that stays visible during chat

## Zone B (ChatStream)
Use createSurface with zone="stream" when:
- Content is supplementary to conversational flow
- NOTE: Currently unused — reserved for future message enhancements

## Zone C (FloatingWidget/Overlay)
Use createSurface with zone="overlay" when:
- Widget demands immediate user attention (countdown timer, form)
- Widget requires high-priority interaction (set complete dialog, form submission)
- Widget will trigger app actions (end session, save progress)

# Multi-Operation Responses

GENESIS may send multiple operations in single response:
1. Text message describing the action
2. createSurface for new widget
3. updateDataModel for existing widgets
4. deleteSurface for cleanup

Avoid duplicate operations. All operations processed atomically by app.
```

### GENESIS as UI Director

GENESIS now acts as the **autonomous UI Director** — it determines:
- Which zones to activate
- Which widgets to mount
- When to update metrics vs. show dialogs
- When to clean up surfaces
- How to sequence multi-zone updates

Example GENESIS behavior:
- User says "Start training" → GENESIS sends 3 operations: text + updateDataModel(context) + createSurface(overlay)
- User says "Rest 30 seconds" → GENESIS sends 2 operations: text + createSurface(overlay, RestTimer)
- User says "Finish session" → GENESIS sends 3 operations: text + deleteSurface(overlay) + updateDataModel(context, state=complete)

---

## Data Flow: Before & After

### Before (Phase 1)

```
┌──────────────┐
│  User Types  │
└──────┬───────┘
       │
       v
┌─────────────────────────────┐
│  ChatInput → POST /api/chat  │
└──────┬──────────────────────┘
       │
       v
┌──────────────────────────────┐
│  Backend Response:           │
│  {                           │
│    message: "...",           │
│    widget: { type, data }    │  <- Single widget
│  }                           │
└──────┬───────────────────────┘
       │
       v
┌────────────────────────────┐
│  parseResponse()           │
│  - Extract message         │
│  - Extract widget          │
│  - App logic chooses zone  │  <- App decides placement
└──────┬─────────────────────┘
       │
       ├─────────────────┬──────────────┐
       v                 v              v
    chat-store      [APP LOGIC]   widget-store
       │                 │              │
       v                 v              v
    Zone B          Zone A/C ?      Zone A/C ?
```

**Problems:**
- Single widget per response limits orchestration
- App logic chooses zone placement (not backend)
- No standardized routing for multiple operations
- Widget lifecycle not fully managed by stores

### After (Phase 2)

```
┌──────────────┐
│  User Types  │
└──────┬───────┘
       │
       v
┌─────────────────────────────┐
│  ChatInput → POST /api/chat  │
└──────┬──────────────────────┘
       │
       v
┌──────────────────────────────┐
│  Backend Response:           │
│  {                           │
│    operations: [             │
│      { type, text, ... },    │  <- Multiple ops
│      { type, zone, ... },    │     GENESIS decides
│      { type, ... }           │     placement
│    ]                         │
│  }                           │
└──────┬───────────────────────┘
       │
       v
┌────────────────────────────────┐
│  interpretResponse()           │
│  - Iterate operations array    │
│  - Route by type + zone        │  <- Deterministic routing
└──────┬───────────────┬─────────┘
       │               │
       v               v
┌──────────────┐  ┌──────────────────┐
│ chat-store   │  │ surface-store    │
├──────────────┤  ├──────────────────┤
│ - messages[] │  │ - surfaces[]     │
└──────┬───────┘  └──────┬───────────┘
       │                 │
       ├────────┬────────┤
       v        v        v
    Zone B   Zone A   Zone C
```

**Improvements:**
- Multiple operations per response (full orchestration)
- GENESIS controls zone placement + widget sequencing
- Deterministic routing via interpretResponse()
- Surface-store manages all widget lifecycles
- No app-level placement logic

---

## Sprint 2: Micro-Acciones Silenciosas (Milestone Futuro)

### Overview

**Purpose:** Enable ultra-low-latency UI interactions without LLM round-trip. Users perform micro-actions (checkbox toggle, timer pause, slider adjust) that immediately update surfaces and return to backend without calling GENESIS.

**Key Property:** <100ms response time, no LLM processing.

### New Endpoint: POST /api/a2ui/event

**Route:** `POST /api/a2ui/event`

**Request Shape:**
```typescript
interface A2UIEventRequest {
  surfaceId: string;              // Which surface triggered the event
  action: string;                 // Action type (e.g., 'toggle', 'updateValue', 'pause')
  payload: Record<string, any>;    // Action-specific data
  userId: string;                 // Authentication
  sessionId: string;              // Session context
  timestamp: number;              // Client timestamp
}
```

**Request Example:**
```json
{
  "surfaceId": "surface-overlay-123",
  "action": "toggleRest",
  "payload": {
    "enabled": true
  },
  "userId": "user-456",
  "sessionId": "session-789",
  "timestamp": 1707287000000
}
```

**Response Shape:**
```typescript
interface A2UIEventResponse {
  success: boolean;
  operations: Operation[];         // Surface updates only
  timestamp: number;
}
```

**Response Example:**
```json
{
  "success": true,
  "operations": [
    {
      "type": "updateDataModel",
      "surfaceId": "surface-overlay-123",
      "dataModel": {
        "restEnabled": true,
        "repsRemaining": 7,
        "timerSeconds": 30
      }
    }
  ],
  "timestamp": 1707287001000
}
```

### Supported Actions (Phase 2)

| Action | Widget | Payload | Example |
|--------|--------|---------|---------|
| `toggleRest` | RestTimer | `{ enabled: bool }` | User clicks "Start Rest" |
| `updateValue` | Slider/Input | `{ value: number }` | User drags weight slider |
| `completeRep` | RepCounter | `{ repNumber: number }` | User taps "Rep Done" |
| `pauseTimer` | LiveSessionTracker | `{ paused: bool }` | User taps pause button |
| `selectExercise` | ExerciseDropdown | `{ exerciseId: string }` | User picks exercise |

### Implementation Notes (Current Phase)

**For now (Phase 1 → Phase 2 transition):**
- All user events continue routing through `/api/chat` with `event` field
- `/api/a2ui/event` endpoint designed but NOT IMPLEMENTED
- Add TODO markers in code: `// TODO: Sprint 2 - Route to /api/a2ui/event`

**Backend Routing (Current):**
```python
# FastAPI route (Phase 1 approach)
@app.post("/api/chat")
async def chat_endpoint(message: str, event: Optional[dict] = None):
    if event:
        # Route to event handler (doesn't call GENESIS)
        return handle_event(event)
    else:
        # Normal LLM path
        return generate_response(message)
```

**Future Implementation (Sprint 2):**
```python
# Split into two endpoints
@app.post("/api/chat")
async def chat_endpoint(message: str):
    # LLM path only
    return generate_response(message)

@app.post("/api/a2ui/event")
async def event_endpoint(request: A2UIEventRequest):
    # Micro-action handler, <100ms
    return handle_event(request)
```

### Use Cases (Future)

1. **Rep Counter:** User taps "Completed Rep" → increments count → updateDataModel sent to surface
2. **Rest Timer:** User clicks "Skip Rest" → timer dismissed → deleteSurface sent
3. **Exercise Selector:** User picks exercise from dropdown → surface updates → no chat message
4. **Weight Adjustment:** User drags slider → updateDataModel sent with new weight value
5. **Form Submission:** User completes form in surface → POST event → surface dismisses

### Benefits

- **Speed:** <100ms vs. 1-2s LLM round-trip
- **Autonomy:** GENESIS not involved in micro-interactions
- **Scalability:** Reduces LLM API calls by ~60% on active sessions
- **UX:** Immediate visual feedback to user actions
- **Backend:** Dedicated handler optimized for quick database updates

### Documentation Location

This section intentionally DETAILED and PROMINENT so future developers immediately understand:
- Why `/api/a2ui/event` exists
- When to use it vs. `/api/chat`
- How to route events in the interpreter
- What the response format looks like
- Current implementation status (not yet active)

---

## Typography & UI Language Integration

### Typography System

Configured during app initialization in `app/_layout.tsx`:

```typescript
import * as Font from 'expo-font';

export default function RootLayout() {
  useEffect(() => {
    Font.loadAsync({
      'JetBrainsMono': require('@assets/fonts/JetBrainsMono-Regular.ttf'),
      'JetBrainsMonoBold': require('@assets/fonts/JetBrainsMono-Bold.ttf'),
      'Inter': require('@assets/fonts/Inter-Regular.ttf'),
      'InterSemiBold': require('@assets/fonts/Inter-SemiBold.ttf'),
    });
  }, []);

  return (
    <ThemeProvider>
      <Stack>{/* ... */}</Stack>
    </ThemeProvider>
  );
}
```

### Font Constants (theme/fonts.ts)

```typescript
export const fonts = {
  // Monospace (metrics, timers, rep counts)
  mono: {
    regular: 'JetBrainsMono',
    bold: 'JetBrainsMonoBold',
  },

  // Body text (messages, labels)
  sans: {
    regular: 'Inter',
    semibold: 'InterSemiBold',
  },
};

export const fontSizes = {
  xs: 10,           // Tab labels
  sm: 12,           // Small text
  base: 14,         // Default
  lg: 16,           // Headers
  xl: 20,           // Large headers
  '2xl': 24,        // Display
};
```

### Tab Bar Labels Styling

```jsx
// app/(tabs)/_layout.tsx
<Tab.Screen
  name="chat"
  options={{
    tabBarLabel: ({ color }) => (
      <Text
        style={{
          fontFamily: fonts.mono.regular,
          fontSize: fontSizes.xs,
          color: color,
        }}
      >
        CHAT
      </Text>
    ),
  }}
/>
```

### UI Language: Spanish Localization

All user-facing labels in Spanish:

| English | Spanish | Context |
|---------|---------|---------|
| Start | Comenzar | Button for starting session |
| Begin | Iniciar | Button for initiating workout |
| Complete | Completar | Button for marking done |
| Register Set | Registrar Set | Record completed set |
| Finish | Finalizar | End session |
| Rest | Descanso | Rest period |
| Pause | Pausar | Pause timer |
| Resume | Reanudar | Continue session |

### Implementation Example

```jsx
// components/buttons/StartButton.tsx
export function StartButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Text style={{ fontFamily: fonts.sans.semibold }}>
        Comenzar
      </Text>
    </TouchableOpacity>
  );
}

// components/widgets/LiveSessionTracker.tsx
<Text style={{ fontFamily: fonts.mono.bold, fontSize: fontSizes.xl }}>
  {timerSeconds}s
</Text>
<Text style={{ fontFamily: fonts.sans.regular, fontSize: fontSizes.sm }}>
  Descanso
</Text>
```

---

## Technical Specifications

### Technology Stack

- **Frontend:** Expo SDK 54, React Native 0.81, Expo Router v6
- **Styling:** NativeWind v4 (Tailwind for React Native)
- **State Management:** Zustand v5 (chat-store, surface-store, user-store)
- **Persistence:** MMKV (React Native key-value store)
- **Backend:** FastAPI (Python), Google Generative AI SDK
- **Database:** Supabase (PostgreSQL)
- **LLM:** Gemini 2.5 Flash via Google ADK
- **Authentication:** Supabase Auth

### Design System: Genesis Fusion

**Color Palette:**
- Primary Gradient: `#b39aff` → `#6c3bff` (purple)
- Background Dark: `#0D0D2B` → `#1A0A30` (navy-purple)
- Accent: `#FF6B9D` (pink, secondary actions)
- Text: `#FFFFFF` (primary), `#C9C9E1` (secondary)

**Component Hierarchy:**
- Surface: Container for zone content (context/stream/overlay)
- StandardCard: Card component extracted during refactor
- ShineEffect: Animated shimmer effect for loading states
- LiveSessionTracker: High-priority overlay widget
- RestTimer: Countdown timer surface
- SessionMetrics: Context bar widget

### API Endpoints

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| POST | `/api/chat` | Send message + get response | `{ operations[] }` |
| POST | `/api/a2ui/event` | Micro-action (Sprint 2) | `{ operations[] }` |
| GET | `/api/session/{id}` | Fetch session data | `{ session: {...} }` |
| PUT | `/api/session/{id}` | Update session | `{ success: bool }` |
| POST | `/api/logout` | End session | `{ success: bool }` |

### A2UI Protocol v0.10 Operations

```typescript
type Operation =
  | TextOperation
  | CreateSurfaceOperation
  | UpdateComponentsOperation
  | UpdateDataModelOperation
  | DeleteSurfaceOperation;

interface TextOperation {
  type: 'text';
  text: string;
  role?: 'assistant' | 'user';
  agent?: string;
  id?: string;
  surfaceId?: string;
}

interface CreateSurfaceOperation {
  type: 'createSurface';
  zone: 'context' | 'stream' | 'overlay';
  widgetType: string;
  dataModel?: Record<string, any>;
  linkedMessageId?: string;
}

interface UpdateDataModelOperation {
  type: 'updateDataModel';
  surfaceId: string;
  dataModel: Record<string, any>;
}

interface UpdateComponentsOperation {
  type: 'updateComponents';
  surfaceId: string;
  changes: Record<string, any>;
}

interface DeleteSurfaceOperation {
  type: 'deleteSurface';
  surfaceId: string;
}
```

---

## Remediation Items Integrated

During the Phase 1 to Phase 2 transition, the following remediation items were systematically integrated into the architecture (not as separate patches):

### 1. Typography System
- **Issue:** Missing JetBrains Mono + Inter configuration
- **Solution:** Configured in `app/_layout.tsx` with expo-font, constants in `theme/fonts.ts`
- **Integration:** All widgets use font constants, tab labels render with JetBrains Mono 10px

### 2. Tab Bar Labels
- **Issue:** Tab icons lacked text labels
- **Solution:** Custom label components rendering JetBrains Mono text below icons
- **Integration:** `app/(tabs)/_layout.tsx` updated for all tab screens

### 3. Component Extraction
- **Issue:** Widget code was monolithic
- **Solution:** `StandardCard.tsx` and `ShineEffect.tsx` extracted as reusable components
- **Integration:** All new surfaces built using these extracted components

### 4. UI Language (Spanish)
- **Issue:** Mixed English/Spanish labels
- **Solution:** Standardized all user-facing text to Spanish
- **Integration:** Button labels (Comenzar, Iniciar, Completar), surface text, all instructions

### 5. Surface Composition
- **Issue:** Widgets tightly coupled to rendering logic
- **Solution:** Surface container abstraction with zone-aware rendering
- **Integration:** Each zone renders surfaces via dedicated Surface component wrapper

---

## Source Analysis Credits

This design represents synthesis of architectural ideas from multiple sources:

### Manus AI
- Identified A2UI interpreter pattern and its benefits
- Suggested backend refactoring approach with operation routing
- Proposed zone-based surface management concept

### Gemini (NGX Command Center)
- Proposed 3-zone architectural concept (Persistent/Stream/Overlay)
- Suggested SurfaceStore as dedicated management layer
- Defined zone-selector pattern for querying surfaces

### ChatGPT
- Validated updateDataModel operation necessity and use cases
- Provided phase-by-phase implementation plan structure
- Suggested GENESIS as autonomous UI Director model
- Outlined Sprint 2 micro-actions architecture

### Claude (Cowork Audit)
- Conducted file-level audit of Phase 1 implementation
- Identified missing typography configuration
- Documented extracted components (StandardCard, ShineEffect)
- Flagged naming inconsistencies and missing Spanish labels

---

## Implementation Roadmap

### Phase 2A (Current Sprint)
- [ ] Create SurfaceStore (Zustand store)
- [ ] Implement interpretResponse() function
- [ ] Update chat-store message shape
- [ ] Create Surface component wrapper
- [ ] Implement ContextBar (Zone A)
- [ ] Migrate ChatStream (Zone B)
- [ ] Implement FloatingWidget (Zone C)
- [ ] Update backend response format
- [ ] Test multi-operation responses

### Phase 2B (Next Sprint)
- [ ] Create LiveSessionTracker widget
- [ ] Create RestTimer widget
- [ ] Implement updateDataModel operations
- [ ] Add event field to chat endpoint (pre-Sprint 2)
- [ ] Create /api/a2ui/event endpoint (Sprint 2 milestone)

### Phase 2C (Polish)
- [ ] Performance optimization (surface persistence)
- [ ] Error handling for malformed operations
- [ ] Analytics for zone interactions
- [ ] User testing with 3-zone layout

---

## Conclusion

This architecture establishes GENESIS as the autonomous UI Director, capable of orchestrating complex multi-zone workflows through a simple, extensible A2UI operations model. The 3-Zone Layout provides clear separation of concerns, while SurfaceStore offers unified widget lifecycle management.

The design is forward-compatible with Sprint 2's micro-actions framework, ensuring that future low-latency interactions can plug into the same infrastructure without architectural changes.

**Document Version:** 1.0
**Last Updated:** 2026-02-06
**Next Review:** After Phase 2A completion
