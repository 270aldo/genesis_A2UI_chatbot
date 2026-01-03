# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + Vite + TypeScript UI. Key paths: `frontend/App.tsx`, `frontend/components/`, `frontend/services/`, `frontend/types.ts`.
- `backend/`: FastAPI + Google ADK API. Key paths: `backend/main.py`, `backend/agent/`, `backend/tools/`, `backend/instructions/`, `backend/schemas/`, `backend/tests/`.
- Root: `Makefile`, `docker-compose.yml`, `README.md`.

## Build, Test, and Development Commands
- `make install` installs backend Python deps and frontend npm deps.
- `make dev` runs backend (port 8000) and frontend (port 3000) together.
- `make backend` / `make frontend` run a single service.
- `make test` runs backend pytest suite.
- `make docker-up` / `make docker-down` start or stop Docker Compose.
- `cd frontend && npm run build` creates a production build.
- `cd backend && python main.py` runs the API directly.

## Coding Style & Naming Conventions
- Python: 4-space indentation, keep imports grouped (stdlib, third-party, local), follow existing double-quote usage.
- TypeScript/React: 2-space indentation, single quotes, semicolons, PascalCase components (e.g., `Widgets.tsx`).
- Keep `AgentResponse` shape consistent: `text`, `agent` (uppercase), optional `payload`.

## Testing Guidelines
- Framework: pytest + pytest-asyncio.
- Location: `backend/tests/` with `test_*.py` and `test_*` functions.
- Run: `make test` or `cd backend && pytest tests/ -v`.
- No frontend test runner is configured yet.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits seen in history: `feat:`, `refactor:`, `docs:` with short, imperative summaries.
- PRs should include a concise description, testing notes (commands + results), and screenshots/GIFs for UI changes.

## Configuration & Secrets
- Backend uses `backend/.env` (copy from `.env.example`) with `GOOGLE_API_KEY`, `PORT`, `CORS_ORIGINS`.
- Frontend reads `VITE_API_URL` for the backend base URL.
- Never commit real API keys or secrets.
