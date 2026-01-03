# NGX GENESIS A2UI - Gemini Context

This document provides context and instructions for working on the NGX GENESIS A2UI project, a multi-agent AI fitness chatbot.

## 1. Project Overview

**NGX GENESIS A2UI** implements the **A2UI (AI-to-UI)** paradigm. The backend uses Google's Agent Developer Kit (ADK) to orchestrate a team of AI agents. These agents don't just reply with text; they generate structured payloads that the React frontend renders as interactive UI widgets (e.g., workout cards, meal plans).

### Key Technologies
*   **Backend:** Python 3.12+, FastAPI, Google ADK (`google-adk`), Pydantic.
*   **Frontend:** React 19, TypeScript, Vite, Tailwind CSS (implied by class names in typical React setups, verify if needed), Lucide React icons.
*   **Orchestration:** Local multi-agent routing using ADK's `root_agent` and `sub_agents`.

## 2. Architecture & Agents

### Agent Hierarchy
The system uses a hub-and-spoke model where **GENESIS** delegates to specialists.

*   **GENESIS (Orchestrator):** Root agent. Receives all messages, detects intent, and routes to a specialist.
    *   **BLAZE (Strength):** Generates workout routines (`workout-card`), timers.
    *   **SAGE (Nutrition):** Creates meal plans (`meal-plan`), recipes.
    *   **SPARK (Habits):** Manages habits (`checklist`), daily check-ins.
    *   **STELLA (Analytics):** Visualizes progress (`progress-dashboard`).
    *   **LOGOS (Education):** Pure text explanations (no widgets).

### Data Flow
1.  **User** sends message via Frontend.
2.  **Frontend** POSTs to `http://localhost:8000/api/chat`.
3.  **FastAPI** receives request, passes text to ADK `Runner`.
4.  **GENESIS** analyzes text and routes to a sub-agent (e.g., BLAZE) based on the agent's `description`.
5.  **Sub-agent** may call the `generate_widget` tool.
6.  **Backend** returns a JSON response (parsed from agent output).
7.  **Frontend** `A2UIMediator` component renders the appropriate widget based on `payload.type`.

## 3. Building and Running

### Prerequisites
*   Python 3.12+
*   Node.js & npm
*   `GOOGLE_API_KEY` set in `backend/.env` (copy from `backend/.env.example`)

### Commands (Makefile)

| Command | Description |
| :--- | :--- |
| `make dev` | **Recommended.** Runs Backend (port 8000) and Frontend (port 3000) concurrently. |
| `make install` | Installs Python dependencies (`requirements.txt`) and Node modules (`package.json`). |
| `make backend` | Runs only the FastAPI backend (`python main.py`). |
| `make frontend` | Runs only the Vite frontend (`npm run dev`). |
| `make test` | Runs backend tests (`pytest`). |
| `make docker-up` | Builds and starts the full stack using Docker Compose. |
| `make clean` | Removes build artifacts (`__pycache__`, `node_modules`, `dist`). |

## 4. Development Conventions

### Backend (Python/ADK)
*   **Agent Definition:** Agents are defined in `backend/agent/`.
    *   `genesis.py`: Root agent.
    *   `specialists/`: Sub-agents.
*   **Routing Logic:** The `description` parameter in the `Agent()` constructor is **critical**. The ADK uses semantic matching against this description to route user queries. **Include keywords** in the description (e.g., "entrenamiento", "dieta").
*   **Tools:** defined in `backend/tools/`.
    *   **Type Safety:** ADK requires simple types in tool signatures (e.g., `str`, `int`, `dict`). Avoid complex `Annotated` or `Literal` types in tool function arguments as they may cause parsing issues.
*   **Instructions:** System prompts are stored as `.txt` files in `backend/instructions/`.

### Frontend (React/TypeScript)
*   **Widget Rendering:** `frontend/components/Widgets.tsx` contains the `A2UIMediator` which switches on `payload.type`.
    *   To add a widget: Create component -> Add interface -> Add to Mediator switch case.
*   **API Client:** Use `frontend/services/api.ts` for backend communication.

### Response Format Contract
The frontend strictly expects this JSON structure from the API:

```json
{
  "text": "Markdown supported response text",
  "agent": "AGENT_NAME",
  "payload": {
    "type": "widget-type-identifier",
    "props": {
      "key": "value"
    }
  }
}
```
*   `agent`: Must be UPPERCASE (e.g., "BLAZE").
*   `payload`: Optional (null for text-only).

## 5. Directory Structure Key

*   `backend/main.py`: Entry point for FastAPI.
*   `backend/agent/`: ADK agent definitions.
*   `backend/instructions/`: Prompt text files.
*   `backend/tools/`: Python functions exposed to agents as tools.
*   `frontend/App.tsx`: Main application component.
*   `frontend/components/`: React UI components.

## 6. Common Tasks

### Adding a New Agent
1.  Create `backend/agent/specialists/new_agent.py`.
2.  Create `backend/instructions/new_agent.txt`.
3.  Register the agent in `backend/agent/genesis.py` (add to `sub_agents` list).
4.  Export it in `backend/agent/specialists/__init__.py`.

### Adding a New Widget
1.  Define the widget component in `frontend/components/Widgets.tsx`.
2.  Update `backend/tools/generate_widget.py` to support the new type (if validation logic exists there).
3.  Update agent instructions to know when/how to call `generate_widget` with the new type.
