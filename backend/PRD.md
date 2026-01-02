# PRD: NGX A2UI Multiagent Backend

## TL;DR

Backend ADK que implementa 6 agentes especializados (GENESIS + 5 especialistas) para el chatbot NGX GENESIS. El sistema usa Google ADK con patrón hierarchical delegation donde GENESIS orquesta a BLAZE, SAGE, SPARK, STELLA y LOGOS. El frontend React existente consume el endpoint `/api/chat` sin modificaciones gracias a formato de respuesta compatible.

---

## Problem Statement

**User Need**: El chatbot NGX actual simula multiagente vía prompt de Gemini. No hay orquestación real, routing inteligente, ni especialización verdadera. Los agentes son "actuados" por un solo modelo.

**Why ADK**: 
- Orquestación nativa de múltiples agentes con `sub_agents`
- Routing inteligente basado en `description` de cada agente
- Escalabilidad hacia A2A cuando sea necesario
- Integración nativa con Gemini 2.5

**Deployment Target**: Local (desarrollo) → Cloud Run (producción)

---

## Agent Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Sin cambios)                    │
│  App.tsx → chatApi.ts → POST /api/chat                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 │ { message, session_id }
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + ADK)                       │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    GENESIS (root_agent)                    │  │
│  │                                                            │  │
│  │  • Recibe TODAS las queries                                │  │
│  │  • Clasifica intent                                        │  │
│  │  • Decide response_type (TEXT/HYBRID/MULTI)                │  │
│  │  • Delega a especialista apropiado                         │  │
│  │                                                            │  │
│  │  sub_agents:                                               │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │  │
│  │  │  BLAZE  │ │  SAGE   │ │ SPARK   │ │ STELLA  │          │  │
│  │  │ Fuerza  │ │Nutrición│ │ Hábitos │ │ Mindset │          │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │  │
│  │                    ┌─────────┐                             │  │
│  │                    │  LOGOS  │                             │  │
│  │                    │Educación│                             │  │
│  │                    └─────────┘                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Response: { text, agent, payload }                              │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Definitions

| Agent | Type | Model | Role | Color |
|-------|------|-------|------|-------|
| `genesis` | LlmAgent | gemini-2.5-flash | Orquestador central, routing, multi-widget | #6D00FF |
| `blaze` | LlmAgent | gemini-2.5-flash | Entrenamiento, fuerza, periodización | #EF4444 |
| `sage` | LlmAgent | gemini-2.5-flash | Nutrición estratégica, ciencia nutricional | #22C55E |
| `spark` | LlmAgent | gemini-2.5-flash | Hábitos, consistencia, motivación | #FBBF24 |
| `stella` | LlmAgent | gemini-2.5-flash | Mindset, datos, progreso, insights | #A855F7 |
| `logos` | LlmAgent | gemini-2.5-flash | Educación, explicaciones, autonomía | #6D00FF |

### Agent Configurations

```python
# GENESIS - Orchestrator
genesis = Agent(
    name="genesis",
    model="gemini-2.5-flash",
    description="Coordinador central del sistema NGX GENESIS",
    instruction=GENESIS_INSTRUCTION,
    tools=[generate_widget, get_user_context],
    sub_agents=[blaze, sage, spark, stella, logos],
)

# BLAZE - Strength Specialist
blaze = Agent(
    name="blaze",
    model="gemini-2.5-flash",
    description="Especialista en entrenamiento de fuerza, hipertrofia y periodización. Usa para rutinas, ejercicios, series, repeticiones.",
    instruction=BLAZE_INSTRUCTION,
    tools=[generate_widget],
)

# SAGE - Nutrition Specialist
sage = Agent(
    name="sage",
    model="gemini-2.5-flash",
    description="Especialista en ciencia nutricional y estrategia alimenticia. Usa para planes de comida, macros, timing nutricional.",
    instruction=SAGE_INSTRUCTION,
    tools=[generate_widget],
)

# SPARK - Habits Specialist
spark = Agent(
    name="spark",
    model="gemini-2.5-flash",
    description="Especialista en formación de hábitos y consistencia. Usa para check-ins, motivación, rutinas diarias.",
    instruction=SPARK_INSTRUCTION,
    tools=[generate_widget],
)

# STELLA - Mindset & Data Specialist
stella = Agent(
    name="stella",
    model="gemini-2.5-flash",
    description="Especialista en mindset, análisis de datos y progreso. Usa para dashboards, insights, barreras psicológicas.",
    instruction=STELLA_INSTRUCTION,
    tools=[generate_widget],
)

# LOGOS - Education Specialist
logos = Agent(
    name="logos",
    model="gemini-2.5-flash",
    description="Especialista en educación y explicación. Usa para preguntas de 'por qué', conceptos, ciencia detrás de las recomendaciones.",
    instruction=LOGOS_INSTRUCTION,
    tools=[generate_widget],
)
```

---

## Tools Specification

### Custom Tools

#### generate_widget

```python
from typing import Annotated, Literal

def generate_widget(
    widget_type: Annotated[
        Literal[
            "workout-card", "meal-plan", "hydration-tracker", 
            "progress-dashboard", "daily-checkin", "timer-widget",
            "checklist", "quick-actions", "alert-banner",
            "recipe-card", "sleep-analysis", "supplement-stack",
            "quote-card", "insight-card"
        ],
        "Tipo de widget a generar"
    ],
    props: Annotated[dict, "Propiedades del widget según su tipo"],
) -> dict:
    """
    Genera un widget visual para el frontend A2UI.
    
    Usa este tool cuando necesites mostrar información estructurada,
    datos interactivos, o acciones que el usuario puede tomar.
    
    Widgets por agente:
    - BLAZE: workout-card, timer-widget
    - SAGE: meal-plan, recipe-card, hydration-tracker
    - SPARK: daily-checkin, checklist, quick-actions, quote-card
    - STELLA: progress-dashboard, insight-card, sleep-analysis
    - GENESIS: quick-actions, progress-dashboard (coordinación)
    - LOGOS: Raramente usa widgets (TEXT_ONLY primario)
    
    Returns:
        Dict con type y props listo para A2UIMediator
    """
    return {
        "type": widget_type,
        "props": props
    }
```

#### get_user_context

```python
def get_user_context(
    context_type: Annotated[
        Literal["profile", "today", "history", "goals"],
        "Tipo de contexto a obtener"
    ],
) -> dict:
    """
    Obtiene contexto del usuario para personalizar respuestas.
    
    Args:
        context_type: 
            - profile: Datos básicos (nombre, objetivos, restricciones)
            - today: Estado del día (check-in, entrenamientos, comidas)
            - history: Historial reciente (última semana)
            - goals: Objetivos activos y progreso
    
    Returns:
        Dict con el contexto solicitado
    """
    # Mock implementation for prototype
    if context_type == "profile":
        return {
            "name": "Usuario",
            "goal": "Recomposición corporal",
            "level": "Intermedio",
            "restrictions": []
        }
    elif context_type == "today":
        return {
            "checkin_done": False,
            "workout_done": False,
            "meals_logged": 0,
            "water_ml": 750
        }
    # ... etc
    return {}
```

### Widget Props Reference

| Widget | Required Props | Optional Props |
|--------|---------------|----------------|
| `workout-card` | `title`, `exercises[]` | `duration`, `category`, `coachNote`, `workoutId` |
| `meal-plan` | `meals[]`, `totalKcal` | `date` |
| `daily-checkin` | `questions[]` | `date` |
| `progress-dashboard` | `title`, `progress` | `subtitle`, `metrics[]` |
| `hydration-tracker` | `current`, `goal` | - |
| `timer-widget` | `label`, `seconds` | `autoStart` |
| `checklist` | `title`, `items[]` | - |
| `quick-actions` | `actions[]` | `title` |
| `alert-banner` | `type`, `message` | - |
| `insight-card` | `title`, `insight` | `trend`, `recommendation` |

---

## Response Format

### Schema (Compatible con Frontend Existente)

```python
from pydantic import BaseModel
from typing import Optional, List, Literal

class WidgetPayload(BaseModel):
    type: str
    props: dict

class AgentResponse(BaseModel):
    text: str
    agent: Literal["GENESIS", "BLAZE", "SAGE", "SPARK", "STELLA", "LOGOS"]
    payload: Optional[WidgetPayload] = None
```

### Response Type Decision Matrix

| Pattern | Trigger | Agent Típico | Widgets |
|---------|---------|--------------|---------|
| **TEXT_ONLY** | Preguntas conceptuales, "¿por qué?", explicaciones | LOGOS | None |
| **WIDGET_ONLY** | "Muéstrame...", comandos directos | STELLA | 1 |
| **HYBRID** | Contexto + datos accionables (70% de casos) | Cualquiera | 1 |
| **MULTI_WIDGET** | "Plan del día", vista completa | GENESIS | 2-4 |
| **INTERACTIVE** | "Registrar...", input requerido | SPARK, SAGE | 1 |

---

## Routing Rules

### GENESIS Instruction (Routing Logic)

```python
GENESIS_INSTRUCTION = """
Eres GENESIS, el orquestador central de NGX GENESIS.

## TU ROL
Recibes TODAS las consultas del usuario. Tu trabajo es:
1. Entender la intención
2. Decidir el response_type apropiado
3. Delegar al especialista correcto
4. Para planes completos, coordinar múltiples especialistas

## REGLAS DE ROUTING

### Por Dominio:
- Entrenamiento, fuerza, ejercicio, rutina, series, repeticiones → BLAZE
- Nutrición, comida, dieta, macros, calorías, receta → SAGE  
- Hábitos, consistencia, motivación, check-in, rutina diaria → SPARK
- Progreso, datos, análisis, mindset, estrés, barreras → STELLA
- "Por qué", explicación, educación, ciencia, concepto → LOGOS

### Por Response Type:
- Pregunta conceptual sin datos → TEXT_ONLY (delega a LOGOS)
- "Muéstrame X" sin contexto → WIDGET_ONLY
- Pregunta con datos accionables → HYBRID (70% de casos)
- "Plan del día", "resumen completo" → MULTI_WIDGET (tú coordinas)

### Cuándo TÚ respondes directamente:
- Saludos iniciales → quick-actions
- Solicitudes que involucran múltiples dominios
- Resúmenes que requieren información de varios especialistas

## PERSONALIDAD
- Tono: Estratégico, coordinador, big-picture
- Frases: "Tu objetivo involucra múltiples sistemas. Déjame coordinar."
- MBTI: INTJ - El Arquitecto

## FORMATO DE RESPUESTA
Siempre responde en JSON con este esquema:
{
  "text": "Tu respuesta textual aquí",
  "agent": "GENESIS",
  "payload": { "type": "widget-type", "props": {...} }  // opcional
}

Si delegas a un especialista, su respuesta será el output final.
"""
```

---

## API Specification

### Endpoint: POST /api/chat

**Request:**
```json
{
  "message": "¿Qué entreno hoy?",
  "session_id": "user-123-session-456"
}
```

**Response:**
```json
{
  "text": "¡BLAZE activado! Tu sesión de fuerza está lista. Hoy trabajamos Upper Body con enfoque en press.",
  "agent": "BLAZE",
  "payload": {
    "type": "workout-card",
    "props": {
      "title": "Upper Body A - Push",
      "category": "Hipertrofia",
      "duration": "55 min",
      "workoutId": "ub-a-001",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": "8-10", "load": "75% 1RM" },
        { "name": "Incline DB Press", "sets": 3, "reps": "10-12", "load": "Moderate" },
        { "name": "Cable Fly", "sets": 3, "reps": "12-15", "load": "Light" }
      ],
      "coachNote": "Enfócate en la conexión mente-músculo en cada rep."
    }
  }
}
```

### Endpoint: GET /health

**Response:**
```json
{
  "status": "healthy",
  "agents": ["genesis", "blaze", "sage", "spark", "stella", "logos"],
  "model": "gemini-2.5-flash",
  "version": "0.1.0"
}
```

---

## Implementation Phases

### Phase 1: Core Setup (1 hora)
- [ ] Crear estructura de proyecto
- [ ] Configurar FastAPI con CORS
- [ ] Implementar endpoint `/api/chat` básico
- [ ] Configurar ADK con InMemorySessionService
- [ ] Verificar conexión con Gemini API

### Phase 2: Agent Implementation (1.5 horas)
- [ ] Implementar GENESIS con instruction completa
- [ ] Implementar BLAZE con personalidad y widgets
- [ ] Implementar SAGE con personalidad y widgets
- [ ] Implementar SPARK con personalidad y widgets
- [ ] Implementar STELLA con personalidad y widgets
- [ ] Implementar LOGOS con personalidad (TEXT_ONLY primary)
- [ ] Conectar sub_agents a GENESIS

### Phase 3: Tools & Response (45 min)
- [ ] Implementar `generate_widget` tool
- [ ] Implementar `get_user_context` tool (mock)
- [ ] Configurar response parsing para formato compatible
- [ ] Manejar errores y fallbacks

### Phase 4: Testing (30 min)
- [ ] Test: Routing a BLAZE (entrenamiento)
- [ ] Test: Routing a SAGE (nutrición)
- [ ] Test: Routing a SPARK (hábitos)
- [ ] Test: Routing a STELLA (progreso)
- [ ] Test: Routing a LOGOS (educación)
- [ ] Test: MULTI_WIDGET coordinado por GENESIS

---

## Code Structure

```
ngx-a2ui-backend/
├── main.py                        # FastAPI app, /api/chat endpoint
├── agent/
│   ├── __init__.py               # Exports root_agent
│   ├── genesis.py                # GENESIS orchestrator
│   └── specialists/
│       ├── __init__.py
│       ├── blaze.py              # Fuerza
│       ├── sage.py               # Nutrición
│       ├── spark.py              # Hábitos
│       ├── stella.py             # Mindset
│       └── logos.py              # Educación
├── tools/
│   ├── __init__.py
│   ├── generate_widget.py        # Widget generation tool
│   └── user_context.py           # User context tool (mock)
├── schemas/
│   ├── __init__.py
│   ├── request.py                # ChatRequest model
│   └── response.py               # AgentResponse model
├── config/
│   └── settings.py               # Environment variables
├── instructions/
│   ├── genesis.txt               # GENESIS system prompt
│   ├── blaze.txt                 # BLAZE system prompt
│   ├── sage.txt                  # SAGE system prompt
│   ├── spark.txt                 # SPARK system prompt
│   ├── stella.txt                # STELLA system prompt
│   └── logos.txt                 # LOGOS system prompt
├── tests/
│   ├── test_routing.py           # Routing tests
│   └── test_responses.py         # Response format tests
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── CLAUDE.md                     # Claude Code context
└── README.md
```

---

## Test Scenarios

| # | Query | Expected Agent | Response Type | Widget |
|---|-------|----------------|---------------|--------|
| 1 | "¿Qué entreno hoy?" | BLAZE | HYBRID | workout-card |
| 2 | "¿Qué como después de entrenar?" | SAGE | HYBRID | meal-plan |
| 3 | "No puedo ser consistente con el ejercicio" | SPARK | HYBRID | checklist |
| 4 | "¿Cómo voy con mis objetivos?" | STELLA | HYBRID | progress-dashboard |
| 5 | "¿Por qué debo hacer deload cada 4 semanas?" | LOGOS | TEXT_ONLY | None |
| 6 | "Dame el plan completo de hoy" | GENESIS | MULTI_WIDGET | workout-card + meal-plan + daily-checkin |
| 7 | "Hola" | GENESIS | HYBRID | quick-actions |
| 8 | "Registrar que tomé agua" | SAGE | INTERACTIVE | hydration-tracker |

---

## Environment Variables

| Variable | Purpose | Required | Default |
|----------|---------|----------|---------|
| `GOOGLE_API_KEY` | Gemini API key | Yes | - |
| `PORT` | Server port | No | 8000 |
| `LOG_LEVEL` | Logging level | No | INFO |
| `CORS_ORIGINS` | Allowed origins | No | `["*"]` |

---

## Success Criteria

### Functional
- [ ] 6 agentes funcionando con personalidades distintivas
- [ ] Routing correcto en 95%+ de queries de prueba
- [ ] Widgets generados con props válidos
- [ ] Respuestas en <3 segundos

### Integration
- [ ] Frontend existente conecta sin modificaciones
- [ ] Formato de respuesta 100% compatible
- [ ] Sesiones mantienen contexto básico

### Quality
- [ ] Código documentado con docstrings
- [ ] Type hints en todas las funciones
- [ ] Tests para escenarios críticos

---

## Dependencies

```txt
# requirements.txt
google-adk==1.21.0
fastapi==0.115.6
uvicorn==0.34.0
pydantic==2.10.3
python-dotenv==1.0.1
```

---

## References

- NGX Agent Voice Bible: Personalidades completas de agentes
- ADK Patterns: `/mnt/skills/user/adk-a2a-framework/references/adk_patterns.md`
- A2UI Widget Catalog: `/mnt/skills/user/ngx-a2ui-widgets/`
- Frontend Repo: `github.com/270aldo/genesis_A2UI_chatbot`
