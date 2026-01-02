# NGX A2UI Backend

Multiagent backend for NGX GENESIS chatbot using Google ADK.

## Overview

This backend implements 6 specialized AI agents:

| Agent | Domain | Color |
|-------|--------|-------|
| **GENESIS** | Orchestration | #6D00FF |
| **BLAZE** | Strength Training | #EF4444 |
| **SAGE** | Nutrition | #22C55E |
| **SPARK** | Habits | #FBBF24 |
| **STELLA** | Mindset & Data | #A855F7 |
| **LOGOS** | Education | #6D00FF |

## Quick Start

```bash
# 1. Clone and enter directory
cd ngx-a2ui-backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY

# 4. Run server
python main.py
```

Server runs at `http://localhost:8000`

## Endpoints

### POST /api/chat

```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Qué entreno hoy?", "session_id": "test"}'
```

**Response:**
```json
{
  "text": "¡BLAZE activado! Tu sesión de fuerza está lista.",
  "agent": "BLAZE",
  "payload": {
    "type": "workout-card",
    "props": { ... }
  }
}
```

### GET /health

```bash
curl http://localhost:8000/health
```

## Docker

```bash
# Build and run
docker-compose up --build

# Or without compose
docker build -t ngx-a2ui-backend .
docker run -p 8000:8000 -e GOOGLE_API_KEY=your_key ngx-a2ui-backend
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_routing.py::test_blaze_routing -v
```

## Frontend Integration

This backend is designed to work with the existing NGX GENESIS Chat frontend:
https://github.com/270aldo/genesis_A2UI_chatbot

Update the frontend's `geminiService.ts` to point to this backend:

```typescript
const response = await fetch('http://localhost:8000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: prompt, session_id: 'default' })
});
```

## Project Structure

```
ngx-a2ui-backend/
├── main.py                    # FastAPI server
├── agent/
│   ├── genesis.py            # GENESIS orchestrator
│   └── specialists/          # 5 specialist agents
├── tools/                    # Agent tools
├── instructions/             # System prompts
├── schemas/                  # Pydantic models
└── tests/                    # Test suite
```

## Documentation

- `PRD.md` - Full product requirements
- `CLAUDE.md` - Development context
- `MASTER_PROMPT.md` - Implementation guide

---

**NGX GENESIS** | *"Rinde hoy. Vive mejor mañana."*
