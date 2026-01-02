# Master Prompt: NGX A2UI Backend

## Context

You are implementing **NGX A2UI Backend**, a multiagent system using Google ADK that powers the NGX GENESIS chatbot with 6 specialized AI agents.

**Your Role**: Senior Python developer building the ADK backend that integrates with an existing React frontend.

**Project Stage**: Initialization → Full implementation

## Current State

### Repository Status
- **Status**: Empty - needs full implementation
- **Branch**: `main`
- **Target**: Working backend with 6 agents

### Environment
- **Dependencies**: Need to install from requirements.txt
- **Config**: Need .env with GOOGLE_API_KEY
- **Frontend**: Already exists at github.com/270aldo/genesis_A2UI_chatbot

### Blocking Issues
- None - greenfield implementation

## Mission

Build a complete FastAPI + ADK backend with 6 specialized agents (GENESIS, BLAZE, SAGE, SPARK, STELLA, LOGOS) that responds to chat messages with the exact JSON format the existing frontend expects. GENESIS orchestrates the specialists using ADK's hierarchical delegation pattern.

## Immediate Tasks

Execute these tasks IN ORDER:

### Task 1: Project Setup
**Goal**: Create project structure and install dependencies
**Files**: All directories and config files
**Commands**:
```bash
cd /home/claude/ngx-a2ui-backend
pip install google-adk==1.21.0 fastapi==0.115.6 uvicorn==0.34.0 pydantic==2.10.3 python-dotenv==1.0.1
```
**Success Criteria**: 
- [ ] Directory structure matches PRD.md
- [ ] requirements.txt created
- [ ] .env.example created

### Task 2: Schemas & Tools
**Goal**: Define request/response schemas and tools
**Files**: 
- `schemas/request.py`
- `schemas/response.py`
- `tools/generate_widget.py`
- `tools/user_context.py`
**Success Criteria**:
- [ ] ChatRequest model with `message` and `session_id`
- [ ] AgentResponse model with `text`, `agent`, `payload`
- [ ] generate_widget tool with all widget types
- [ ] get_user_context tool with mock data

### Task 3: Agent Instructions
**Goal**: Create system prompts for each agent
**Files**: `instructions/*.txt`
**Success Criteria**:
- [ ] genesis.txt with routing rules
- [ ] blaze.txt with strength personality
- [ ] sage.txt with nutrition personality
- [ ] spark.txt with habits personality
- [ ] stella.txt with mindset personality
- [ ] logos.txt with education personality

### Task 4: Specialist Agents
**Goal**: Implement 5 specialist agents
**Files**: `agent/specialists/*.py`
**Success Criteria**:
- [ ] BLAZE agent with generate_widget tool
- [ ] SAGE agent with generate_widget tool
- [ ] SPARK agent with generate_widget tool
- [ ] STELLA agent with generate_widget tool
- [ ] LOGOS agent with generate_widget tool (minimal use)

### Task 5: GENESIS Orchestrator
**Goal**: Implement orchestrator with sub_agents
**Files**: 
- `agent/genesis.py`
- `agent/__init__.py`
**Success Criteria**:
- [ ] GENESIS with all 5 specialists as sub_agents
- [ ] Routing instruction in place
- [ ] Exported as root_agent

### Task 6: FastAPI Server
**Goal**: Create HTTP server with /api/chat endpoint
**Files**: `main.py`
**Success Criteria**:
- [ ] POST /api/chat endpoint
- [ ] GET /health endpoint
- [ ] CORS configured for frontend
- [ ] Response format matches exactly

### Task 7: Testing
**Goal**: Verify routing and responses
**Files**: `tests/test_routing.py`, `tests/test_responses.py`
**Success Criteria**:
- [ ] Test BLAZE routing works
- [ ] Test SAGE routing works
- [ ] Test LOGOS TEXT_ONLY works
- [ ] Test response format is correct

## Constraints

### DO
- ✅ Use `gemini-2.5-flash` for ALL agents
- ✅ Use `Annotated` for ALL tool parameters
- ✅ Include comprehensive docstrings on tools
- ✅ Keep response format EXACTLY as frontend expects
- ✅ Read instructions from .txt files at startup
- ✅ Use specific `description` for each agent (critical for routing)
- ✅ Export `root_agent` from `agent/__init__.py`

### DO NOT
- ❌ Modify the response format - frontend depends on exact structure
- ❌ Use streaming responses (frontend not configured for it)
- ❌ Add extra dependencies not in requirements.txt
- ❌ Create complex state management (use InMemorySessionService)
- ❌ Generate widgets from LOGOS unless absolutely necessary
- ❌ Use async session service operations

### VERIFY Before Proceeding
- [ ] GOOGLE_API_KEY is set in environment
- [ ] All imports resolve correctly
- [ ] Server starts without errors
- [ ] /health endpoint returns 200

## Reference Files

Read these files before starting:
- **PRD**: `./PRD.md` - Full requirements and architecture
- **Context**: `./CLAUDE.md` - Development guidelines
- **Voice Bible**: Agent personalities (in project knowledge)
- **Frontend**: github.com/270aldo/genesis_A2UI_chatbot (response format reference)

## Session Success Criteria

This session is complete when:
- [ ] All 6 agents are implemented with correct personalities
- [ ] Server starts and /api/chat accepts POST requests
- [ ] Response format matches: `{ text, agent, payload? }`
- [ ] BLAZE responds to "¿Qué entreno hoy?" with workout-card
- [ ] SAGE responds to "¿Qué como?" with meal-plan
- [ ] LOGOS responds to "¿Por qué?" with TEXT_ONLY
- [ ] GENESIS responds to "Hola" with quick-actions
- [ ] All files committed with descriptive messages

## Implementation Notes

### Agent Description Pattern
The `description` field is CRITICAL. ADK uses it for routing:
```python
# GOOD - Specific triggers
description="Especialista en entrenamiento de fuerza, hipertrofia, rutinas, ejercicios, series y repeticiones"

# BAD - Too vague
description="Fitness agent"
```

### Response Parsing
After agent.invoke(), parse the response to match frontend format:
```python
# Agent returns various formats, normalize to:
{
    "text": str,
    "agent": str,  # UPPERCASE
    "payload": Optional[dict]
}
```

### Widget Generation
Tool output becomes payload:
```python
# In agent instruction:
"Usa generate_widget cuando necesites mostrar datos estructurados"

# Tool returns:
{"type": "workout-card", "props": {...}}

# This becomes response.payload
```

### LOGOS Exception
LOGOS uses TEXT_ONLY 90% of time:
```python
# In logos.txt instruction:
"Raramente usas widgets. Tu especialidad es explicar con palabras.
Solo genera widget si necesitas mostrar datos comparativos o visuales."
```

## Quick Verification Commands

```bash
# Start server
python main.py

# Test health
curl http://localhost:8000/health

# Test chat
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Qué entreno hoy?", "session_id": "test"}'

# Expected response structure:
# {
#   "text": "¡BLAZE activado! ...",
#   "agent": "BLAZE",
#   "payload": {"type": "workout-card", "props": {...}}
# }
```

---

**START IMPLEMENTING NOW. Begin with Task 1: Project Setup.**
