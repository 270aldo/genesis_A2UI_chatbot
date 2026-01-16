# GENESIS Voice Engine - Design Document

**Date**: January 16, 2026
**Status**: Approved
**Phase**: 2

---

## 1. Overview

GENESIS Voice Engine es un modo de conversación por voz inmersivo que permite interactuar con el coach de fitness mediante voz natural bidireccional, utilizando Gemini Live API.

### 1.1 Decisiones de Diseño

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| **Interaction Mode** | Voice Toggle | Balance entre privacidad y experiencia natural |
| **Visual Feedback** | Particle Orb (estilo Perplexity) | UI premium, minimalista, inmersiva |
| **Widget Integration** | Voice First, Widget After | Mantiene experiencia de voz, transiciona al terminar |
| **Colors** | GENESIS brand colors | #6D00FF (purple), #A855F7, #0EA5E9 |
| **Languages** | Español + English | Auto-detección, cubre mercado principal |
| **Latency** | Balanced (~500ms-1s) | Conversación natural sin sacrificar calidad |
| **Platform** | Web First, Mobile After | Iteración rápida, componentes reutilizables |

### 1.2 User Flow

```
[Chat Normal] → [Tap Voice Button] → [Full-screen Voice Mode]
                                            ↓
                              ┌─────────────────────────┐
                              │    Particle Orb         │
                              │    (GENESIS Purple)     │
                              │                         │
                              │  "Di algo..."           │
                              │  [X]            [🎤]    │
                              └─────────────────────────┘
                                            ↓
                              [User speaks] → [Orb pulses/listens]
                                            ↓
                              [GENESIS responds] → [Orb changes color]
                                            ↓
                              [If widget needed] → [Transition to widget]
                                            ↓
                              [Tap X or swipe] → [Return to chat]
```

### 1.3 Orb States

| State | Color | Animation |
|-------|-------|-----------|
| Idle/Ready | `#6D00FF` (Genesis Purple) | Particles floating gently |
| Listening | `#6D00FF` → brighter | Particles expanding with audio input |
| Processing | `#A855F7` (Stella Purple) | Particles spinning/condensing |
| Speaking | `#0EA5E9` (Wave Blue) | Particles pulsing with audio output |

---

## 2. Technical Architecture

### 2.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  VoiceMode.tsx          │  ParticleOrb.tsx (Canvas 2D)          │
│  - Toggle activation    │  - ~500 particles sphere              │
│  - State management     │  - Color transitions                  │
│  - Transcript display   │  - Audio-reactive animation           │
├─────────────────────────────────────────────────────────────────┤
│  useVoiceSession.ts (Hook)                                      │
│  - WebSocket connection to backend                              │
│  - MediaRecorder API (audio capture)                            │
│  - Audio playback queue                                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │ WebSocket (bidirectional streaming)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + ADK)                        │
├─────────────────────────────────────────────────────────────────┤
│  /ws/voice endpoint                                              │
│  - Receives audio chunks from client                            │
│  - Streams to Gemini Live API                                   │
│  - Returns audio + transcript + widget payloads                 │
├─────────────────────────────────────────────────────────────────┤
│  VoiceSession Manager                                            │
│  - Session state (clipboard integration)                        │
│  - Language detection (ES/EN)                                   │
│  - CORE routing (same as chat)                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Bidirectional Streaming
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI LIVE API                               │
│  - Model: gemini-2.0-flash-live                                 │
│  - Input: Audio stream (PCM 16-bit, 16kHz)                      │
│  - Output: Audio stream + text transcript                       │
│  - Voice: Puck (neutral, works for ES/EN)                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 WebSocket Protocol

```typescript
// Client → Server
{ type: "audio_chunk", data: base64_pcm }
{ type: "end_turn" }    // User finished speaking
{ type: "cancel" }      // User interrupted

// Server → Client
{ type: "transcript", text: "...", final: boolean }
{ type: "audio_chunk", data: base64_pcm }
{ type: "state", value: "listening" | "processing" | "speaking" }
{ type: "widget", payload: { type: "workout-card", props: {...} } }
{ type: "end_response" }
```

---

## 3. Frontend Components

### 3.1 File Structure

```
frontend/
├── components/
│   ├── voice/
│   │   ├── VoiceMode.tsx        # Full-screen container
│   │   ├── ParticleOrb.tsx      # Animated particle orb
│   │   ├── VoiceControls.tsx    # Close (X) and mic buttons
│   │   └── VoiceTranscript.tsx  # Real-time text display
│   └── ...existing widgets
├── hooks/
│   └── useVoiceSession.ts       # WebSocket + audio logic
├── services/
│   └── voiceApi.ts              # WebSocket client
└── types/
    └── voice.ts                 # Voice-specific types
```

### 3.2 VoiceMode.tsx

```tsx
interface VoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetReceived: (payload: WidgetPayload) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

// Behavior:
// - Full-screen overlay with background #050505
// - Centered orb that changes based on state
// - Transcript appears at top when GENESIS speaks
// - On widget received: fade out → onWidgetReceived → onClose
```

### 3.3 ParticleOrb.tsx

```tsx
interface ParticleOrbProps {
  state: VoiceState;
  audioLevel: number;  // 0-1 for reactivity
  size: 'large' | 'small';
}

// Implementation with Canvas 2D (lightweight, no Three.js)
// - ~500 particles in spherical formation
// - Colors per state (see table above)
// - audioLevel controls expansion/contraction
// - Smooth transitions with easing
```

### 3.4 useVoiceSession.ts

```tsx
interface UseVoiceSessionReturn {
  state: VoiceState;
  transcript: string;
  audioLevel: number;

  connect: () => Promise<void>;
  disconnect: () => void;

  isConnected: boolean;
  error: string | null;
}

// Responsibilities:
// 1. Establish WebSocket to /ws/voice
// 2. Capture audio with MediaRecorder (opus/webm)
// 3. Send chunks every 100ms
// 4. Receive and play audio response
// 5. Calculate audioLevel for orb animation
```

### 3.5 Integration with Chat

```tsx
// In App.tsx - Voice button next to input
<button onClick={() => setVoiceModeOpen(true)}>
  <MicIcon />
</button>

{voiceModeOpen && (
  <VoiceMode
    isOpen={voiceModeOpen}
    onClose={() => setVoiceModeOpen(false)}
    onWidgetReceived={(payload) => {
      addMessage({ agent: 'GENESIS', payload });
      setVoiceModeOpen(false);
    }}
  />
)}
```

---

## 4. Backend Implementation

### 4.1 File Structure

```
backend/
├── voice/
│   ├── __init__.py
│   ├── router.py            # WebSocket endpoint /ws/voice
│   ├── session.py           # VoiceSession manager
│   ├── gemini_live.py       # Gemini Live API client
│   └── audio_utils.py       # PCM conversion, chunking
├── agent/
│   ├── genesis.py           # Add voice context
│   └── cores/               # No changes needed
└── main.py                  # Add WebSocket route
```

### 4.2 WebSocket Endpoint

```python
# voice/router.py
from fastapi import WebSocket, WebSocketDisconnect
from voice.session import VoiceSession

@router.websocket("/ws/voice")
async def voice_endpoint(websocket: WebSocket, session_id: str = None):
    await websocket.accept()

    voice_session = VoiceSession(
        websocket=websocket,
        session_id=session_id or str(uuid4())
    )

    try:
        await voice_session.run()
    except WebSocketDisconnect:
        await voice_session.cleanup()
```

### 4.3 VoiceSession Manager

```python
# voice/session.py
class VoiceSession:
    def __init__(self, websocket: WebSocket, session_id: str):
        self.websocket = websocket
        self.session_id = session_id
        self.gemini_client = GeminiLiveClient()
        self.clipboard = SessionStore()  # Phase 1 integration

    async def run(self):
        # 1. Load user context from clipboard
        context = await self.clipboard.get(self.session_id)

        # 2. Initialize Gemini Live session with system prompt
        await self.gemini_client.connect(
            system_instruction=self._build_system_prompt(context)
        )

        # 3. Bidirectional streaming loop
        await asyncio.gather(
            self._receive_from_client(),
            self._receive_from_gemini(),
        )

    async def _receive_from_client(self):
        async for message in self.websocket.iter_json():
            if message["type"] == "audio_chunk":
                audio_bytes = base64.b64decode(message["data"])
                await self.gemini_client.send_audio(audio_bytes)
            elif message["type"] == "end_turn":
                await self.gemini_client.end_turn()

    async def _receive_from_gemini(self):
        pending_widget = None

        async for event in self.gemini_client.receive():
            if event.type == "audio":
                await self._send_audio(event.data)
            elif event.type == "transcript":
                await self._send_transcript(event.text, event.is_final)
            elif event.type == "tool_call":
                if event.name == "show_widget":
                    pending_widget = event.args
            elif event.type == "turn_complete":
                await self.websocket.send_json({"type": "state", "value": "idle"})
                if pending_widget:
                    await asyncio.sleep(0.5)
                    await self.websocket.send_json({
                        "type": "widget",
                        "payload": pending_widget
                    })
```

### 4.4 Gemini Live Client

```python
# voice/gemini_live.py
from google import genai
from google.genai import types

class GeminiLiveClient:
    MODEL = "gemini-2.0-flash-live"

    async def connect(self, system_instruction: str):
        self.client = genai.Client(
            http_options={"api_version": "v1beta"}
        )

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO", "TEXT"],
            tools=self._get_voice_tools(),
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name="Puck"
                    )
                )
            ),
            system_instruction=system_instruction,
        )

        self.session = await self.client.aio.live.connect(
            model=self.MODEL,
            config=config
        )

    def _get_voice_tools(self):
        return [
            types.Tool(
                function_declarations=[
                    types.FunctionDeclaration(
                        name="show_widget",
                        description="Show a visual widget after verbal explanation",
                        parameters={
                            "type": "object",
                            "properties": {
                                "widget_type": {
                                    "type": "string",
                                    "enum": ["workout-card", "meal-plan", "recipe-card",
                                            "daily-checkin", "progress-dashboard",
                                            "habit-streak", "supplement-stack",
                                            "recovery-dashboard"]
                                },
                                "props": {"type": "object"}
                            },
                            "required": ["widget_type", "props"]
                        }
                    )
                ]
            )
        ]
```

---

## 5. Widget Detection Flow

```
User: "Oye Genesis, dame una rutina de pecho para hoy"
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Gemini Live API processes audio                            │
│  1. Generates voice response explaining the routine         │
│  2. Detects intent → calls show_widget tool                │
└─────────────────────────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    ▼                               ▼
[Audio Stream]              [Tool Call Event]
"Perfecto, aquí tienes       {
una rutina de pecho           "name": "show_widget",
enfocada en..."               "args": {
                                "widget_type": "workout-card",
                                "props": {...}
                              }
                            }
                    │
                    ▼
[Voice finishes] → [0.5s pause] → [Widget appears] → [Exit voice mode]
```

---

## 6. Cleanup: Legacy Agent References

### 6.1 Problem

43 files still reference the 12 individual agents when V3 consolidated everything into 6 CORES with a single "GENESIS" identity.

### 6.2 New Identity Structure

```
BEFORE (V1/V2):                    AFTER (V3):
─────────────────                 ─────────────────
User sees: "BLAZE"                User sees: "GENESIS"
User sees: "SAGE"                 User sees: "GENESIS"
...12 names                       ...1 unique name

Internally: 12 agents             Internally: 6 CORES
                                  (invisible to user)
```

### 6.3 Files to Modify

| File | Change |
|------|--------|
| `frontend/constants.ts` | Simplify to 1 GENESIS color + UI colors |
| `frontend/types.ts` | `AgentType = 'GENESIS'` only |
| `frontend/components/Widgets.tsx` | Remove `agent` prop, always GENESIS |
| `frontend/CLAUDE.md` | Update documentation |
| `backend/CLAUDE.md` | Update to CORES architecture |
| `CLAUDE.md` (root) | Update architecture diagram |
| `backend/agent/specialists/` | **DELETE entire folder** |
| `backend/schemas/response.py` | `agent` always = "GENESIS" |

### 6.4 New constants.ts

```typescript
export const COLORS = {
  // Brand
  genesis: '#6D00FF',

  // Voice states
  voiceIdle: '#6D00FF',
  voiceListening: '#6D00FF',
  voiceProcessing: '#A855F7',
  voiceSpeaking: '#0EA5E9',

  // UI
  bg: '#050505',
  card: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',

  // Widget accents (by type, not agent)
  training: '#EF4444',
  nutrition: '#22C55E',
  recovery: '#0EA5E9',
  habits: '#FBBF24',
  analytics: '#A855F7',
};
```

### 6.5 New types.ts

```typescript
export type AgentType = 'GENESIS';

export interface WidgetPayload {
  type: string;
  props: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  payload?: WidgetPayload;
  timestamp: Date;
}
```

---

## 7. Dependencies

### 7.1 Backend (New)

```txt
# requirements.txt additions
google-genai>=0.4.0      # Gemini Live API client
websockets>=12.0         # WebSocket support (FastAPI uses this)
```

### 7.2 Frontend (New)

```json
// package.json additions - none required
// Using native Web Audio API and Canvas 2D
```

---

## 8. Testing Strategy

### 8.1 Backend Tests

- WebSocket connection lifecycle
- Audio chunk processing
- Gemini Live API mocking
- Widget tool call detection
- Session clipboard integration

### 8.2 Frontend Tests

- VoiceMode component mounting/unmounting
- State transitions (idle → listening → processing → speaking)
- Audio capture/playback
- Widget transition animation

### 8.3 E2E Tests

- Full voice conversation flow
- Widget generation via voice
- Error handling (network drop, API timeout)

---

## 9. Next Steps

1. Write implementation plan with detailed tasks
2. Create git worktree for isolated development
3. Implement backend voice module
4. Implement frontend voice components
5. Integration testing
6. Cleanup legacy agent references

---

*GENESIS Voice Engine - Phase 2 Design Document*
