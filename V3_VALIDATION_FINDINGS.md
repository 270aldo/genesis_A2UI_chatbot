# NGX GENESIS V3 — Validation Findings

**Fecha**: Enero 2026
**Validadores**: Análisis técnico múltiple (Claude Opus + revisiones externas)
**Documento Base**: EVOLUTION_PLAN_V3.md
**Veredicto**: ✅ LUZ VERDE CONDICIONADA (4 bloqueadores a resolver)

---

## 🚦 RESUMEN EJECUTIVO

El EVOLUTION_PLAN_V3 está **arquitectónicamente sólido** y representa state-of-the-art para 2026. Sin embargo, se identificaron **4 bloqueadores críticos** que deben resolverse antes de implementación, más **9 ajustes finos** recomendados.

| Categoría | Estado |
|-----------|--------|
| Arquitectura General | ✅ Aprobada |
| Patrón GENESIS único + CORES ocultos | ✅ Correcto |
| A2A + A2UI | ✅ Bien implementado |
| Seguridad (NGX Fortress) | ⚠️ Requiere ajuste Cloud Armor |
| Observabilidad | ✅ Excelente |
| Wearables | ⚠️ Requiere corrección Garmin |
| Despliegue | 🔴 Requiere separación de pipelines |

---

## 🔴 4 BLOQUEADORES CRÍTICOS (Obligatorios para V3.1)

### 1. Cloud Armor + Cloud Run (Arquitectura de Red)

**Problema**: El V3 asume que Cloud Armor se conecta directamente a Cloud Run.

**Realidad**: Cloud Armor requiere **External HTTP(S) Load Balancer + Serverless NEG** para proteger Cloud Run.

**Fix Requerido**:
```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA CORRECTA                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Internet → Cloud Armor → External LB → Serverless NEG     │
│                                              ↓               │
│                                         Cloud Run            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Acción**: Actualizar Sección 6 (NGX Fortress) con:
- Configuración de External HTTP(S) Load Balancer
- Serverless NEG para cada servicio Cloud Run
- Cloud Armor policies aplicadas al LB

---

### 2. Garmin OAuth (Autenticación Wearables)

**Problema**: La tabla de wearables indica OAuth 1.0A para Garmin.

**Realidad**: Garmin Connect Developer Program actualmente usa **OAuth 2.0** y requiere aprobación.

**Fix Requerido**:
```python
# INCORRECTO (V3 actual)
"garmin": {"auth": "OAuth 1.0A", ...}

# CORRECTO (V3.1)
"garmin": {
    "auth": "OAuth 2.0",
    "approval_required": True,
    "program": "Garmin Connect Developer Program",
    "estimated_approval_time": "2-4 semanas"
}
```

**Acción**: Actualizar Sección 3.1 con OAuth 2.0 y documentar proceso de aprobación.

---

### 3. Clipboard Persistence (Estado del Orchestrator)

**Problema**: El patrón Clipboard asume que el Orchestrator mantiene estado en memoria.

**Realidad**: Cloud Run **no garantiza persistencia entre requests** (escala a 0, múltiples instancias, restarts).

**Fix Requerido**:
```python
# ARQUITECTURA DE PERSISTENCIA REQUERIDA

# Opción A: Redis/Memorystore (baja latencia, sesiones activas)
clipboard_store = redis.Redis(host=MEMORYSTORE_HOST)

# Opción B: Supabase/Postgres (durabilidad, histórico)
clipboard_store = supabase.table("session_clipboard")

# Datos mínimos a persistir:
{
    "session_id": str,
    "user_id": str,
    "session_context": dict,      # Contexto conversacional
    "routing_history": list,      # Últimas decisiones de routing
    "wearable_snapshot": dict,    # Último estado de wearables
    "user_profile_cache": dict,   # Perfil del usuario
    "last_updated": datetime
}
```

**Acción**: Agregar nueva subsección en Sección 5 (Router) con arquitectura de persistencia.

---

### 4. Separación de Pipelines de Deploy

**Problema**: El `deploy.sh` actual usa `gcloud run deploy` para todo, incluyendo servicios que deberían ser Agent Engine.

**Realidad**: Cloud Run y Vertex AI Agent Engine tienen **pipelines de despliegue completamente diferentes**.

**Fix Requerido**:
```yaml
# cloudbuild-cloudrun.yaml (Servicios Cloud Run)
services:
  - genesis-orchestrator
  - genesis-voice
  - genesis-analytics
  - genesis-recovery

# cloudbuild-agentengine.yaml (Vertex AI Agent Engine)
agents:
  - training-capability
  - nutrition-capability
  - habits-capability
  - education-capability
```

**Acción**:
1. Separar Sección 13 (CI/CD) en dos pipelines distintos
2. Documentar qué servicios van a Cloud Run vs Agent Engine
3. Actualizar diagrama de arquitectura

---

## ⚠️ 9 AJUSTES FINOS RECOMENDADOS

### AF-1: Versionado de A2UI Protocol

**Contexto**: A2UI está en Public Preview (v0.8/v0.9), el schema puede cambiar.

**Recomendación**: Definir versión explícita en `agent.json`:
```json
{
  "protocol": "a2ui/1.0-ngx-custom",
  "fallback_render": "text-only"
}
```

---

### AF-2: Partial Failures en Weekly Review

**Contexto**: Si un CORE falla, el usuario no debe ver error genérico.

**Recomendación**: Implementar renderizado parcial:
```python
# MAL UX
"Hubo un error cargando tu reporte."

# NGX UX (Correcto)
"Aquí tienes tu progreso de entrenamiento. Los datos de recuperación
se están actualizando y aparecerán en breve."
```

---

### AF-3: Context Caching para Voz

**Contexto**: El `system_instruction` de voz es largo y se re-envía en cada conexión.

**Recomendación**: Habilitar Context Caching en Vertex AI:
```python
# Reduce latencia inicial y costos
context_cache_id = vertex_ai.cache_context(GENESIS_VOICE_INSTRUCTION)
```

---

### AF-4: Modelo de Voz Configurable

**Contexto**: `gemini-2.0-flash-exp` es frágil (experimental).

**Recomendación**:
```python
VOICE_MODEL = os.getenv("GENESIS_VOICE_MODEL", "gemini-2.0-flash-live")
```

---

### AF-5: HRV Normalization Cross-Device

**Contexto**: HealthKit usa SDNN, otros usan RMSSD.

**Recomendación**: Agregar capa de normalización:
```python
def normalize_hrv(value: float, source: str, metric_type: str) -> float:
    """Normaliza HRV a escala común independiente de fuente"""
    # Conversión SDNN ↔ RMSSD según device
```

---

### AF-6: Wearable Schema Simplificado

**Contexto**: `wearable_data` actual tiene muchas columnas mezcladas.

**Recomendación**: Separar en 3 tablas:
```sql
-- wearable_daily: 1 fila por user/device/date (métricas diarias)
-- wearable_samples: time-series alta frecuencia
-- wearable_raw: payloads originales por auditoría
```

---

### AF-7: Token Encryption con Cloud KMS

**Contexto**: `oauth_token_encrypted TEXT` no especifica mecanismo.

**Recomendación**: Envelope encryption con Cloud KMS:
```python
from google.cloud import kms

def encrypt_token(token: str) -> tuple[bytes, str]:
    """Retorna (ciphertext, key_version) para auditoría"""
```

---

### AF-8: A2A Agent Card Path

**Contexto**: El estándar A2A usa `/.well-known/agent-card.json`.

**Recomendación**: Usar path estándar:
```
/.well-known/agent-card.json  # Estándar A2A
/agent.json                    # Alias NGX (opcional)
```

---

### AF-9: Breach Notification (LFPDPPP)

**Contexto**: V3 dice "72 horas" pero eso es GDPR.

**Recomendación**: En México usar "sin demora injustificada" + playbook:
```markdown
## Proceso de Notificación de Vulneración
1. Detección → Evaluación (24h máx)
2. Si afecta derechos → Notificar INAI + titulares sin demora
3. Documentar en registro de incidentes
```

---

## ✅ VALIDACIONES POSITIVAS (Lo que está excelente)

### Arquitectura de Voz
- ✅ Gemini Live API con streaming bidireccional
- ✅ `min-instances=1` para evitar cold start
- ✅ `GENESIS_VOICE_INSTRUCTION` sin mencionar CORES

### Patrón Router + Clipboard
- ✅ Orchestrator centralizado
- ✅ CORES stateless (escalan a 0)
- ✅ Contexto explícito en cada llamada A2A

### Seguridad
- ✅ OIDC Tokens para comunicación interna (Zero Trust real)
- ✅ Prompt injection defense con tags + sanitización
- ✅ Service Account por servicio

### Observabilidad
- ✅ Cloud Trace nativo con ADK
- ✅ BigQuery Analytics Plugin
- ✅ Circuit breaker con tenacity
- ✅ Business metrics custom
- ✅ Identity leak alerts

### ADK Eval Testing
- ✅ Golden datasets
- ✅ Identity integrity tests (tolerancia cero)
- ✅ Prompt injection tests
- ✅ Routing accuracy metrics

### Widgets A2UI
- ✅ 5 widgets núcleo bien definidos
- ✅ Schemas JSON completos
- ✅ Estados interactivos

---

## 📋 CHECKLIST PARA V3.1

### Bloqueadores (Obligatorios)
- [ ] Cloud Armor con LB + Serverless NEG
- [ ] Garmin OAuth 2.0 + proceso de aprobación
- [ ] Clipboard persistence (Redis o Supabase)
- [ ] Pipelines separados Cloud Run vs Agent Engine

### Ajustes Finos (Recomendados)
- [ ] AF-1: Versionado A2UI protocol
- [ ] AF-2: Partial failures UX
- [ ] AF-3: Context caching voz
- [ ] AF-4: Modelo voz configurable
- [ ] AF-5: HRV normalization
- [ ] AF-6: Wearable schema simplificado
- [ ] AF-7: Token encryption KMS
- [ ] AF-8: Agent card path estándar
- [ ] AF-9: Breach notification LFPDPPP

### Nomenclatura (Consistencia)
- [ ] Renombrar "CORES" → "Capabilities" en docs internas
- [ ] Mantener "GENESIS" como única entidad visible

---

## 🎯 SIGUIENTE PASO

**Crear V3.1 "Production-Grade"** que incorpore:
1. Los 4 fixes de bloqueadores
2. Los ajustes finos prioritarios (AF-1 a AF-4 mínimo)
3. Nomenclatura consistente

**Timeline sugerido**: 1-2 días de actualización documental antes de Sprint 1.

---

*Documento generado como consolidación de múltiples validaciones técnicas.*
*Referencia: EVOLUTION_PLAN_V3.md (2,277 líneas)*
