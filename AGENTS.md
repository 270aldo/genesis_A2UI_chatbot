# Repository Guidelines

## Project Structure
Monorepo with `apps/mobile/` (Expo SDK 54, React Native 0.81, NativeWind v4), `frontend/` (React 19 + Vite, legacy), and `backend/` (FastAPI + Google ADK). Mobile is the primary client.

**Key entry points:**
- Mobile: `apps/mobile/app/_layout.tsx` (root), `apps/mobile/app/chat.tsx` (chat with 3-zone layout)
- Backend: `backend/main.py` (FastAPI), `backend/agent/genesis.py` (unified agent)
- Stores: `apps/mobile/src/stores/surface-store.ts`, `chat-store.ts`, `workout-store.ts`
- A2UI: `apps/mobile/src/lib/a2ui/interpreter.ts` (response processing), `types.ts`

**Reference docs:** `CLAUDE.md` (complete context), `docs/plans/` (active planning documents).

## Build & Development
- `cd apps/mobile && npx expo start` — Mobile dev server
- `cd backend && python main.py` — Backend on port 8000
- `make dev` — Backend + Frontend simultaneously
- `make test` — pytest in backend/tests/
- `cd apps/mobile && npx tsc --noEmit` — TypeScript check

## Architecture
- Single unified GENESIS agent (gemini-2.5-flash), no sub_agents
- 6 internal domains: Training, Nutrition, Recovery, Habits, Analytics, Education
- A2UI protocol with 3 zones: context (persistent top), stream (chat), overlay (floating)
- SurfaceStore manages widget surfaces separately from ChatStore messages
- Backend returns `{ text, agent, operations[] }` — each operation has zone field

## Coding Style
- Python: 4-space indent, simple types for ADK tool signatures
- TypeScript/React: 2-space indent, single quotes, PascalCase components
- UI language: Spanish for all user-facing text
- Typography: JetBrains Mono (headers), Inter (body)
- ADK instructions: Use `(variable)` not `{variable}` in .txt files

## Testing
- Backend: pytest + pytest-asyncio in `backend/tests/`
- Mobile: TypeScript check via `npx tsc --noEmit`
- No frontend test runner configured

## Commit Style
Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`
