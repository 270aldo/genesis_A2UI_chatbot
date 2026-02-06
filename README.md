# NGX GENESIS

Performance & Longevity platform powered by AI. GENESIS is an intelligent coach that generates interactive UI surfaces through natural conversation, covering training, nutrition, recovery, habits, analytics, and education.

## Architecture

```
Mobile App (Expo SDK 54)              Backend (FastAPI + Google ADK)
┌─────────────────────────┐           ┌──────────────────────────┐
│  3-Zone Layout          │           │  GENESIS Agent           │
│  ├─ ContextBar (top)    │  HTTP     │  (gemini-2.5-flash)      │
│  ├─ ChatStream (center) │◄────────►│  6 internal domains      │
│  └─ FloatingWidget      │  /api/   │  A2UI operations[]       │
│                         │  chat    │                          │
│  5 Tab Navigation       │           │  Supabase (persistence)  │
│  HOME TRAIN FUEL MIND   │           │  Voice Engine            │
│  TRACK                  │           │                          │
└─────────────────────────┘           └──────────────────────────┘
```

**A2UI Protocol**: The agent doesn't just reply with text — it generates structured operations that create, update, and delete interactive widget surfaces across 3 UI zones.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo SDK 54, React Native 0.81, Expo Router v6, NativeWind v4 |
| Backend | Python 3.12+, FastAPI, Google ADK (Agent Developer Kit) |
| AI Model | Gemini 2.5 Flash |
| Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State | Zustand v5 + MMKV persistence |
| Voice | Gemini Live API (STT+LLM) + ElevenLabs (TTS) |

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Google API Key (Gemini)

### Setup

```bash
# Clone and install
git clone <repo-url>
make install

# Configure backend
cp backend/.env.example backend/.env
# Add GOOGLE_API_KEY to backend/.env

# Run backend
cd backend && python main.py

# Run mobile (new terminal)
cd apps/mobile && npx expo start
```

### Docker

```bash
export GOOGLE_API_KEY=your_key
make docker-up
```

## Project Structure

```
├── apps/mobile/           # Expo React Native (primary client)
│   ├── app/               # Expo Router screens
│   │   ├── (tabs)/        # 5-tab navigation
│   │   └── chat.tsx       # Chat with 3-zone layout
│   └── src/
│       ├── components/    # UI components + widgets
│       ├── stores/        # Zustand stores (surface, chat, workout)
│       ├── lib/a2ui/      # A2UI interpreter + types
│       └── theme/         # Design tokens (colors, fonts)
│
├── backend/               # FastAPI + Google ADK
│   ├── main.py            # API server
│   ├── agent/             # GENESIS agent definition
│   ├── instructions/      # Agent system prompt
│   ├── tools/             # Widget generation tools
│   └── voice/             # Voice engine module
│
├── frontend/              # React web client (legacy)
├── supabase/              # Migrations + config
├── infrastructure/        # Terraform (GCP)
└── docs/                  # Planning documents
```

## Development

| Command | Description |
|---------|-------------|
| `cd apps/mobile && npx expo start` | Mobile dev server |
| `cd backend && python main.py` | Backend on port 8000 |
| `make dev` | Backend + web frontend |
| `make test` | Run backend tests |
| `cd apps/mobile && npx tsc --noEmit` | TypeScript check |

## Documentation

- `CLAUDE.md` — Complete project context for AI agents
- `docs/plans/` — Active design and implementation documents
- `docs/wearables/` — Wearable integration guides
- `docs/archive/` — Historical documentation

## License

MIT
