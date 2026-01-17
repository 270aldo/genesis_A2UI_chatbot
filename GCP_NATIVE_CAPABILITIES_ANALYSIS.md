# Análisis: Capacidades Nativas de GCP vs Recomendaciones Adicionales

## Investigación de Observabilidad, Fallback y Métricas de Negocio

**Fecha**: Enero 2026
**Propósito**: Determinar qué capacidades ya ofrece GCP y qué necesitamos implementar manualmente

---

## 1. OBSERVABILIDAD Y TRACING

### ✅ LO QUE YA OFRECE GCP (No necesitamos implementar)

#### ADK Cloud Trace Integration
Google ADK tiene **integración nativa con Cloud Trace** que captura automáticamente:

| Span | Qué captura | Configuración |
|------|-------------|---------------|
| `invocation` | Request completo al agente | Automático |
| `agent_run` | Ejecución del agente | Automático |
| `call_llm` | Llamadas a Gemini/LLM | Automático |
| `execute_tool` | Ejecución de herramientas | Automático |

**Cómo habilitarlo:**
```python
# Opción 1: CLI flag
adk deploy agent_engine --trace_to_cloud

# Opción 2: Python SDK
from google.adk import AdkApp
app = AdkApp(enable_tracing=True)
```

#### Vertex AI Agent Engine Built-in Metrics
Agent Engine proporciona métricas **automáticas sin configuración**:

| Métrica | Descripción | Labels disponibles |
|---------|-------------|-------------------|
| `request_count` | Requests por segundo | response_code, agent_id |
| `request_latencies` | Latencia P50/P95/P99 | agent_id, location |
| `tool_calling_count` | Invocaciones de herramientas | tool_id, agent_id |
| `token_usage` | Tokens consumidos | agent_id |
| `error_rate` | Tasa de errores | error_type |

**Recurso monitoreado:** `aiplatform.googleapis.com/ReasoningEngine`

#### OpenTelemetry Nativo (Septiembre 2025)
Google Cloud ahora soporta **OTLP nativo** en Cloud Trace:
- Atributos hasta 512 bytes (antes 128)
- Valores hasta 64 KiB (antes 256)
- Hasta 1024 atributos por span (antes 32)
- Sin necesidad de agentes adicionales

### ⚠️ LO QUE NECESITAMOS AGREGAR

**Solo configuración, no implementación:**

```yaml
# Agregar a cloudbuild.yaml para habilitar tracing
- name: 'gcr.io/cloud-builders/gcloud'
  args:
    - 'run'
    - 'deploy'
    - 'genesis-orchestrator'
    - '--set-env-vars=ENABLE_CLOUD_TRACE=true'
```

```python
# genesis_orchestrator/main.py - Solo 2 líneas
from google.adk import AdkApp

app = AdkApp(
    enable_tracing=True,  # ← Habilita Cloud Trace automático
    trace_to_cloud=True   # ← Envía a Cloud Trace
)
```

### 📊 RESULTADO: No necesitamos implementar OpenTelemetry manualmente
GCP lo hace por nosotros con `enable_tracing=True`

---

## 2. FALLBACK Y CIRCUIT BREAKER

### ❌ LO QUE GCP NO OFRECE NATIVAMENTE

Cloud Run **NO tiene circuit breaker built-in**. Solo ofrece:
- Retry básico para jobs (0-10 intentos)
- Retry para event-driven functions (exponential backoff)

Google **recomienda** implementar circuit breakers a nivel de aplicación.

### ✅ SOLUCIÓN: Cloud Workflows para Orquestación con Fallback

Cloud Workflows **SÍ soporta** try/catch/retry nativo:

```yaml
# genesis_workflow.yaml - Orquestación con fallback
main:
  steps:
    - call_training_core:
        try:
          call: http.post
          args:
            url: ${TRAINING_CORE_URL}
            body: ${context}
            timeout: 30
          result: training_response
        retry:
          predicate: ${default_retry_predicate}
          max_retries: 3
          backoff:
            initial_delay: 1
            max_delay: 60
            multiplier: 2
        except:
          as: e
          steps:
            - fallback_response:
                assign:
                  - training_response:
                      status: "degraded"
                      message: "Estoy procesando tu solicitud. Dame un momento."
                      fallback: true
```

### ⚠️ RECOMENDACIÓN PARA V3

**Opción A: Usar Cloud Workflows** (Recomendado)
- Orquestación declarativa con retry/fallback
- Sin código adicional
- Costo: ~$0.01 por 1000 ejecuciones

**Opción B: Implementar en código** (Si no queremos Workflows)
```python
# genesis_orchestrator/resilience.py
from tenacity import retry, stop_after_attempt, wait_exponential
from circuitbreaker import circuit

@circuit(failure_threshold=3, recovery_timeout=30)
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
async def call_core_with_fallback(core_url: str, context: dict) -> dict:
    try:
        return await httpx.post(core_url, json=context, timeout=30)
    except Exception:
        return {
            "status": "degraded",
            "message": "GENESIS está procesando tu solicitud.",
            "fallback": True
        }
```

### 📊 RESULTADO: Implementar fallback simple en código (10 líneas)
O usar Cloud Workflows para orquestación completa

---

## 3. MÉTRICAS DE NEGOCIO

### ✅ LO QUE YA OFRECE GCP: BigQuery Agent Analytics Plugin

El **BigQuery Agent Analytics Plugin** de ADK captura automáticamente:

| Evento | Datos capturados |
|--------|------------------|
| `request` | Input del usuario, timestamp, session_id |
| `response` | Output del agente, latencia, tokens |
| `tool_call` | Herramienta invocada, parámetros, resultado |
| `llm_call` | Modelo usado, prompt, completion, tokens |
| `error` | Tipo de error, stack trace |

**Habilitarlo es 1 línea de código:**
```python
from google.adk.plugins import BigQueryAnalyticsPlugin

app = AdkApp(
    plugins=[
        BigQueryAnalyticsPlugin(
            project_id="ngx-genesis-prod",
            dataset_id="agent_analytics",
            table_id="genesis_events"
        )
    ]
)
```

### ⚠️ LO QUE NECESITAMOS AGREGAR: Métricas de Negocio Específicas de NGX

El plugin captura eventos técnicos, pero **NO** métricas de negocio como:

| Métrica NGX | Por qué importa | Cómo capturar |
|-------------|-----------------|---------------|
| `widget_interaction_rate` | ¿Los widgets son útiles? | Evento frontend |
| `voice_session_duration` | ¿La voz engancha? | Timestamp diff |
| `readiness_to_workout_conversion` | ¿El sistema motiva acción? | Join de eventos |
| `wearable_sync_frequency` | ¿Usan los wearables? | Query a Supabase |

### ✅ SOLUCIÓN: Extender con eventos custom en BigQuery

```python
# genesis_orchestrator/business_metrics.py
from google.cloud import bigquery

bq_client = bigquery.Client()

async def log_business_event(event_type: str, user_id: str, data: dict):
    """Log eventos de negocio a BigQuery"""
    row = {
        "event_type": event_type,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "data": json.dumps(data)
    }

    errors = bq_client.insert_rows_json(
        "ngx-genesis-prod.business_metrics.events",
        [row]
    )

# Uso en el código
await log_business_event(
    "widget_interaction",
    user_id,
    {"widget_type": "plan-card", "action": "start_workout"}
)

await log_business_event(
    "readiness_to_workout",
    user_id,
    {"readiness_score": 78, "started_workout": True, "time_to_start_minutes": 5}
)
```

### 📊 Dashboard en Looker Studio

```sql
-- Query para dashboard de métricas de negocio
SELECT
    DATE(timestamp) as date,

    -- Widget engagement
    COUNTIF(event_type = 'widget_interaction') as total_interactions,
    COUNTIF(event_type = 'widget_interaction' AND JSON_VALUE(data, '$.action') = 'start_workout')
        / COUNTIF(event_type = 'widget_shown') as widget_conversion_rate,

    -- Voice engagement
    AVG(CASE WHEN event_type = 'voice_session_end'
        THEN CAST(JSON_VALUE(data, '$.duration_seconds') AS INT64) END) as avg_voice_duration,

    -- Readiness to workout
    COUNTIF(event_type = 'readiness_to_workout' AND JSON_VALUE(data, '$.started_workout') = 'true')
        / COUNTIF(event_type = 'readiness_checkin') as readiness_conversion,

    -- Wearable engagement
    COUNT(DISTINCT CASE WHEN event_type = 'wearable_sync' THEN user_id END) as users_syncing

FROM `ngx-genesis-prod.business_metrics.events`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC
```

---

## 4. RESUMEN EJECUTIVO

### ✅ YA LO OFRECE GCP (Solo habilitar)

| Capacidad | Servicio GCP | Configuración |
|-----------|--------------|---------------|
| **Agent Tracing** | Cloud Trace + ADK | `enable_tracing=True` |
| **Métricas de latencia/errores** | Cloud Monitoring | Automático en Agent Engine |
| **Token usage tracking** | Agent Engine Metrics | Automático |
| **Tool call analytics** | BigQuery Analytics Plugin | 1 línea de código |
| **Retry con backoff** | Cloud Workflows | YAML declarativo |
| **Alertas** | Cloud Monitoring | Configurar thresholds |

### ⚠️ NECESITAMOS IMPLEMENTAR (Mínimo esfuerzo)

| Capacidad | Esfuerzo | Implementación |
|-----------|----------|----------------|
| **Circuit breaker** | 10 líneas | `tenacity` + `circuitbreaker` libs |
| **Fallback response** | 5 líneas | Try/except con respuesta degradada |
| **Métricas de negocio NGX** | 20 líneas | Eventos custom a BigQuery |
| **Dashboard Looker** | 2 horas | SQL + configuración visual |

### 📋 RECOMENDACIÓN FINAL PARA V3

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILIDAD NGX GENESIS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NIVEL 1: HABILITADO POR DEFECTO (0 código)                     │
│  ├── Cloud Trace (ADK nativo)                                   │
│  ├── Agent Engine Metrics                                       │
│  └── Cloud Monitoring Dashboards                                │
│                                                                  │
│  NIVEL 2: CONFIGURAR (1-5 líneas)                               │
│  ├── BigQuery Agent Analytics Plugin                            │
│  ├── Alertas de latencia/errores                                │
│  └── enable_tracing=True                                        │
│                                                                  │
│  NIVEL 3: IMPLEMENTAR (20-30 líneas)                            │
│  ├── Circuit breaker para CORES                                 │
│  ├── Fallback responses                                         │
│  └── Business metrics custom                                    │
│                                                                  │
│  NIVEL 4: POST-LAUNCH (Sprint 2)                                │
│  ├── Looker Studio dashboard                                    │
│  └── Análisis de conversión                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CÓDIGO A AGREGAR A V3

### 5.1 Habilitar observabilidad nativa

```python
# genesis_orchestrator/main.py
from google.adk import AdkApp
from google.adk.plugins import BigQueryAnalyticsPlugin

app = AdkApp(
    # Observabilidad nativa
    enable_tracing=True,
    trace_to_cloud=True,

    # Analytics a BigQuery
    plugins=[
        BigQueryAnalyticsPlugin(
            project_id="ngx-genesis-prod",
            dataset_id="agent_analytics",
            table_id="genesis_events"
        )
    ]
)
```

### 5.2 Circuit breaker minimalista

```python
# genesis_orchestrator/resilience.py
from tenacity import retry, stop_after_attempt, wait_exponential

FALLBACK_RESPONSE = {
    "text": "Dame un momento mientras proceso tu solicitud.",
    "status": "processing",
    "widgets": None
}

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def call_core(core_url: str, context: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(core_url, json=context)
            return response.json()
    except Exception as e:
        logger.warning(f"CORE {core_url} failed: {e}")
        raise  # Retry lo manejará

async def call_core_safe(core_url: str, context: dict) -> dict:
    """Wrapper con fallback garantizado"""
    try:
        return await call_core(core_url, context)
    except Exception:
        logger.error(f"CORE {core_url} exhausted retries")
        return FALLBACK_RESPONSE
```

### 5.3 Business metrics

```python
# genesis_orchestrator/metrics.py
from google.cloud import bigquery
from datetime import datetime
import json

bq = bigquery.Client()
TABLE = "ngx-genesis-prod.business_metrics.events"

def log_event(event_type: str, user_id: str, **data):
    """Fire-and-forget business event logging"""
    try:
        bq.insert_rows_json(TABLE, [{
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "data": json.dumps(data)
        }])
    except Exception as e:
        logger.warning(f"Failed to log event: {e}")  # No bloquear
```

---

## Referencias

- [Cloud Trace - ADK Documentation](https://google.github.io/adk-docs/observability/cloud-trace/)
- [BigQuery Agent Analytics Plugin](https://google.github.io/adk-docs/observability/bigquery-agent-analytics/)
- [Agent Engine Monitoring](https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/manage/monitoring)
- [OpenTelemetry in Google Cloud](https://cloud.google.com/blog/products/management-tools/opentelemetry-now-in-google-cloud-observability)
- [Cloud Workflows Error Handling](https://cloud.google.com/workflows/docs/reference/syntax/catching-errors)
- [Instrument ADK with OpenTelemetry](https://docs.cloud.google.com/stackdriver/docs/instrumentation/ai-agent-adk)

---

*Análisis completado: Enero 2026*
