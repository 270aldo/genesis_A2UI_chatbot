# NGX GENESIS A2UI

Multiagent AI fitness chatbot with React frontend and FastAPI + Google ADK backend.

## Architecture

```
GENESIS (Orchestrator)
    ├── BLAZE (Strength/Workouts) → workout-card
    ├── SAGE (Nutrition/Meals) → meal-plan
    ├── SPARK (Habits/Consistency) → checklist
    ├── STELLA (Mindset/Analytics) → progress-dashboard
    └── LOGOS (Education) → TEXT_ONLY
```

## Quick Start

### Option 1: Make Commands (Recommended)

```bash
# Install dependencies
make install

# Configure environment
cp backend/.env.example backend/.env  # Add GOOGLE_API_KEY

# Run both services
make dev
```

### Option 2: Manual Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add GOOGLE_API_KEY
python main.py        # Runs on port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev           # Runs on port 3000
```

### Option 3: Docker

```bash
# Set API key
export GOOGLE_API_KEY=your_key_here

# Run with Docker Compose
make docker-up
```

## Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Run backend + frontend |
| `make backend` | Run backend only |
| `make frontend` | Run frontend only |
| `make test` | Run backend tests |
| `make docker-up` | Start with Docker |
| `make clean` | Remove build artifacts |

## Project Structure

```
/
├── frontend/         # React + Vite + TypeScript
│   ├── App.tsx       # Main chat component
│   ├── components/   # UI components
│   ├── services/     # API client
│   └── types.ts      # TypeScript types
│
├── backend/          # FastAPI + Google ADK
│   ├── main.py       # API server
│   ├── agent/        # ADK agents (genesis + 5 specialists)
│   ├── tools/        # Widget generation tools
│   ├── instructions/ # Agent system prompts
│   └── schemas/      # Pydantic models
│
└── README.md         # This file
```

## API Response Format

```json
{
  "text": "Agent response text",
  "agent": "BLAZE",
  "payload": {
    "type": "workout-card",
    "props": { ... }
  }
}
```

## Environment Variables

### Backend (.env)
- `GOOGLE_API_KEY` - Gemini API key (required)
- `PORT` - Server port (default: 8000)
- `CORS_ORIGINS` - Allowed origins (default: ["*"])

## License

MIT
