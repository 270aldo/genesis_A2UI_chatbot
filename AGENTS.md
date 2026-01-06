# Repository Guidelines

## Project Structure & Module Organization
- Monorepo with `frontend/` (React 19 + Vite + TypeScript) and `backend/` (FastAPI + Google ADK).
- Frontend entry: `frontend/App.tsx`; widget registry + routing lives in `frontend/components/Widgets.tsx`; UI primitives in `frontend/components/BaseUI.tsx`; API client in `frontend/services/api.ts`.
- Backend entry: `backend/main.py`; agents in `backend/agent/` with prompts in `backend/instructions/`; tools in `backend/tools/` (`generate_widget.py`, `user_context.py`); schemas in `backend/schemas/`; tests in `backend/tests/`.
- Reference docs: `README.md`, `CLAUDE.md`, `GEMINI.md`, `backend/MASTER_PROMPT.md`, `backend/PRD.md`.

## Build, Test, and Development Commands
- `make install` installs Python + Node dependencies.
- `make dev` runs backend (8000) and frontend (3000) concurrently.
- `make backend` / `make frontend` run a single service.
- `make test` runs `pytest` in `backend/tests/`.
- `cd frontend && npm run build` builds the Vite app.
- `cd backend && adk web ./agent` opens the ADK visual agent UI (if ADK is installed).
- `make docker-up` / `make docker-down` run the full stack via Docker Compose.

## Coding Style & Naming Conventions
- Python: 4-space indent, keep tool signatures to simple types for ADK compatibility.
- TypeScript/React: 2-space indent, single quotes, semicolons, PascalCase components.
- API contract is strict: `{ text, agent: UPPERCASE, payload?: { type, props } }`. Keep payload `type` in sync with `A2UIMediator`.

## Testing Guidelines
- Framework: pytest + pytest-asyncio.
- Location: `backend/tests/` with `test_*.py` files and `test_*` functions.
- Run: `make test` or `cd backend && pytest tests/ -v`.
- No frontend test runner is configured yet.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits in history: `feat:`, `refactor:`, `docs:`.
- PRs should include a concise description, testing notes (commands + results), and screenshots/GIFs for UI changes.

## Configuration & Secrets
- Backend uses `backend/.env` (copy from `.env.example`) with `GOOGLE_API_KEY`, `PORT`, `CORS_ORIGINS`.
- Frontend uses `VITE_API_URL` for backend base URL; `GEMINI_API_KEY` is only needed for legacy `frontend/services/geminiService.ts`.
- Never commit real API keys or secrets.
