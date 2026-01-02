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

### Backend (FastAPI + ADK)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add GOOGLE_API_KEY
python main.py        # Runs on port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev           # Runs on port 3000
```

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
