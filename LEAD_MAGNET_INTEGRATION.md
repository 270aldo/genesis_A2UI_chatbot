# GENESIS Integration with NGX Transform Lead Magnet
## Connection Guide for Agent Demo in Lead Magnet Flow

**Status**: Integration Ready  
**Target**: Embed GENESIS agent responses in ngx-transform results page
**Timeline**: v2.2 Release (2 weeks)

---

## INTEGRATION OVERVIEW

NGX Transform (lead magnet) will embed a live GENESIS chatbot demo on the results page to showcase how the multi-agent system will execute the user's personalized transformation plan.

### Data Flow
```
ngx-transform results page
    ↓
[User clicks "Ver Demo en Vivo"]
    ↓
POST /api/genesis-demo
    ↓
BACKEND: genesis_A2UI_chatbot
    ↓
GENESIS API responds with agent orchestration
    ↓
Embedded chatbot shows response
    ↓
[User sees GENESIS handling their specific needs]
```

---

## API ENDPOINT SPECIFICATION

### GENESIS Backend Endpoint
**Location**: `backend/src/routes/demo.route.ts` (or similar)

**Request**:
```http
POST /api/v1/demo/agent-response
Content-Type: application/json
Authorization: Bearer <API_KEY>

{
  "sessionId": "share-xyz123",
  "userQuestion": "¿Cuánto tiempo para ver resultados?",
  "context": {
    "projectedMuscleGain": 12,
    "projectedFatLoss": 8.5,
    "timelineMonths": 12,
    "userAge": 28,
    "userBodyType": "endomorph",
    "fitnessLevel": "intermedio",
    "weeklyHours": 5,
    "stressLevel": 7,
    "sleepQuality": 6,
    "disciplineRating": 8
  },
  "mode": "demo",
  "sampleConversations": 3
}
```

**Response**:
```json
{
  "success": true,
  "response": "Basado en tu perfil (endomorfo, intermedio, 5h/semana), los primeros cambios visibles en 4 semanas. Tu stress (7/10) es factor clave - APOLLO priorizaremos sleep optimization. Tus 12kg músculo proyectados requieren hipercalórico controlado (TRINITY) + fuerza (BLAZE) en días no-volumen.",
  "agentName": "GENESIS",
  "agentsInvolved": ["BLAZE", "TRINITY", "APOLLO"],
  "confidence": 0.94,
  "executionPlan": {
    "phase1": "4 semanas adaptación",
    "phase2": "8 semanas hipertrofia",
    "phase3": "Semanas 9-12 peak preparación"
  }
}
```

---

## IMPLEMENTATION: GENESIS BACKEND

### New Route: `backend/src/routes/demo.route.ts`

```typescript
// demo.route.ts - Lead magnet demo endpoint
import express, { Router, Request, Response } from 'express';
import { validateDemoRequest } from '../validators/demo.validator';
import { genesisOrchestrator } from '../services/genesis.orchestrator';

const router: Router = express.Router();

interface DemoRequest {
  sessionId: string;
  userQuestion: string;
  context: {
    projectedMuscleGain: number;
    projectedFatLoss: number;
    timelineMonths: number;
    userAge?: number;
    userBodyType?: string;
    fitnessLevel?: string;
    weeklyHours?: number;
    stressLevel?: number;
    sleepQuality?: number;
    disciplineRating?: number;
  };
  mode: 'demo' | 'live';
  sampleConversations?: number;
}

router.post('/agent-response', async (req: Request, res: Response) => {
  try {
    const body: DemoRequest = req.body;

    // Validate input
    const validation = validateDemoRequest(body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors,
      });
    }

    // Route to GENESIS orchestrator
    const agentResponse = await genesisOrchestrator.generateDemoResponse({
      userQuestion: body.userQuestion,
      userProfile: {
        projectedStats: {
          muscleGain: body.context.projectedMuscleGain,
          fatLoss: body.context.projectedFatLoss,
          timeline: body.context.timelineMonths,
        },
        psychology: {
          stressLevel: body.context.stressLevel || 5,
          sleepQuality: body.context.sleepQuality || 5,
          disciplineRating: body.context.disciplineRating || 5,
        },
        fitness: {
          bodyType: body.context.userBodyType || 'mesomorph',
          level: body.context.fitnessLevel || 'novato',
          weeklyHours: body.context.weeklyHours || 3,
          age: body.context.userAge || 25,
        },
      },
      mode: body.mode,
    });

    return res.json({
      success: true,
      response: agentResponse.message,
      agentName: 'GENESIS',
      agentsInvolved: agentResponse.subAgents,
      confidence: agentResponse.confidence,
      executionPlan: agentResponse.executionPlan || null,
    });
  } catch (error) {
    console.error('[DEMO] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate agent response',
    });
  }
});

export const demoRoutes = router;
```

### Service: `backend/src/services/genesis.orchestrator.ts`

```typescript
// Simplified version - orchestrates agents for demo
import { blazeService } from './blaze.service';
import { trinityService } from './trinity.service';
import { apolloService } from './apollo.service';
import { geminiAPI } from './gemini.api';

interface DemoGenerationRequest {
  userQuestion: string;
  userProfile: {
    projectedStats: {
      muscleGain: number;
      fatLoss: number;
      timeline: number;
    };
    psychology: {
      stressLevel: number;
      sleepQuality: number;
      disciplineRating: number;
    };
    fitness: {
      bodyType: string;
      level: string;
      weeklyHours: number;
      age: number;
    };
  };
  mode: 'demo' | 'live';
}

export class GenesisOrchestrator {
  async generateDemoResponse(request: DemoGenerationRequest) {
    const { userQuestion, userProfile, mode } = request;

    // 1. Analyze which agents are needed
    const requiredAgents = this.determineAgents(userQuestion, userProfile);

    // 2. Build context prompt for GENESIS persona
    const systemPrompt = `
You are GENESIS, NGX's AI agent orchestrator.

Your role:
- Coordinate BLAZE (Workout AI), TRINITY (Nutrition AI), APOLLO (Recovery & Mindset AI)
- Provide personalized, confident responses about the user's transformation
- Reference agent involvement naturally
- Speak with authority but empathy

User Profile:
- ${userProfile.fitness.age} years old, ${userProfile.fitness.bodyType} body type
- Fitness level: ${userProfile.fitness.level}
- Available: ${userProfile.fitness.weeklyHours}h/week for training
- Stress: ${userProfile.psychology.stressLevel}/10 | Sleep: ${userProfile.psychology.sleepQuality}/10 | Discipline: ${userProfile.psychology.disciplineRating}/10
- Projected gain: +${userProfile.projectedStats.muscleGain}kg muscle, -${userProfile.projectedStats.fatLoss}% body fat over ${userProfile.projectedStats.timeline} months

Respond as if orchestrating real agents behind your response. Name them if relevant.
`;

    // 3. Call Gemini to generate response
    const response = await geminiAPI.generateText({
      systemPrompt,
      userMessage: userQuestion,
      temperature: 0.7,
      maxTokens: 250,
    });

    // 4. Build structured response
    return {
      message: response.text,
      subAgents: requiredAgents,
      confidence: 0.92,
      executionPlan: this.buildExecutionPlan(userProfile),
    };
  }

  private determineAgents(question: string, profile: any): string[] {
    const agents = new Set<string>();

    if (
      question.toLowerCase().includes('workout') ||
      question.toLowerCase().includes('rutina') ||
      question.toLowerCase().includes('ejercicio')
    ) {
      agents.add('BLAZE');
    }

    if (
      question.toLowerCase().includes('nutricion') ||
      question.toLowerCase().includes('comida') ||
      question.toLowerCase().includes('macro')
    ) {
      agents.add('TRINITY');
    }

    if (
      question.toLowerCase().includes('stress') ||
      question.toLowerCase().includes('sleep') ||
      question.toLowerCase().includes('motivaci') ||
      question.toLowerCase().includes('disciplina')
    ) {
      agents.add('APOLLO');
    }

    // High stress = prioritize APOLLO
    if (profile.psychology.stressLevel > 7) {
      agents.add('APOLLO');
    }

    // Generic questions = all agents
    if (agents.size === 0) {
      agents.add('BLAZE');
      agents.add('TRINITY');
      agents.add('APOLLO');
    }

    return Array.from(agents);
  }

  private buildExecutionPlan(profile: any) {
    const timeline = profile.projectedStats.timeline;
    return {
      phase1: `Semanas 1-4: Adaptación neural + hormonal`,
      phase2: `Semanas 5-${timeline / 2}: Hipertrofia sostenida`,
      phase3: `Semanas ${timeline / 2 + 1}-${timeline}: Peak preparación`,
    };
  }
}

export const genesisOrchestrator = new GenesisOrchestrator();
```

---

## DEMO CONVERSATION SAMPLES

For fallback/pre-loaded demos in case API is slow:

```typescript
// frontend demo samples
const SAMPLE_CONVERSATIONS = [
  {
    userMessage: '¿Cuánto tiempo para ver resultados?',
    agentResponse: `Basado en tu perfil, los primeros cambios visibles en 4 semanas. Adaptación neural + hormonal + musculatura.

BLAZE crea tu programa dinámico cada semana.
TRINITY ajusta nutrición diaria según peso.
APOLLO monitorea tu stress (actualmente 7/10) y sleep quality para maximizar recuperación.

Todo orquestado por mí (GENESIS) en tiempo real.`,
    subAgents: ['BLAZE', 'TRINITY', 'APOLLO'],
  },
  {
    userMessage: '¿Cuál será mi rutina?',
    agentResponse: `BLAZE genera tu programa dinámico cada semana basado en tu progreso.

Dada tu disponibilidad (5h/semana) y tu cuerpo (endomorfo), te recomendamos:
- 3 días fuerza hipertrofia (músculo)
- 2 días metabolismo + movilidad

TRINITY ajusta tus macros diarios. APOLLO monitorea tu mentalidad para mantener disciplina.
Sin rigidez. Adaptación inteligente.`,
    subAgents: ['BLAZE', 'TRINITY', 'APOLLO'],
  },
  {
    userMessage: '¿Qué pasa si me desanimo?',
    agentResponse: `APOLLO tiene módulo de mentalidad dedicado.

Cuando detecte baja disciplina (ahora 8/10, excelente), recalibramos inteligentemente:
- Celebramos pequeñas victorias
- Ajustamos volumen (no abandonas)
- Reforzamos micro-hábitos

No es castigo. Es comprensión. Todos tenemos días bajos.
TRINITY y BLAZE se adaptan al mismo ritmo.`,
    subAgents: ['APOLLO', 'BLAZE', 'TRINITY'],
  },
];
```

---

## AUTHENTICATION & SECURITY

### API Key Management
```bash
# .env in ngx-transform frontend
GENESIS_API_KEY=ngx_transform_lead_magnet_demo_key
GENESIS_API_URL=https://genesis-api.ngx.app/api/v1
```

### Rate Limiting
```typescript
// In GENESIS backend
router.post(
  '/agent-response',
  rateLimit({
    windowMs: 60 * 1000,      // 1 minute
    max: 30,                   // 30 requests per minute
    keyGenerator: (req) => req.body.sessionId,
  }),
  demoController.agentResponse
);
```

### CORS Configuration
```typescript
// GENESIS backend
app.use(
  cors({
    origin: ['https://ngx.app', 'https://transform.ngx.app'],
    credentials: true,
  })
);
```

---

## TESTING CHECKLIST

### Unit Tests
- [ ] `genesisOrchestrator.generateDemoResponse()` with various profiles
- [ ] `determineAgents()` logic for keyword matching
- [ ] Fallback to sample conversations if API fails

### Integration Tests
- [ ] ngx-transform → GENESIS API → response → chatbot render
- [ ] Network latency (aim for <2s response time)
- [ ] Error handling (timeout, 500 error, etc.)

### UX Tests
- [ ] Demo button visibility on results page
- [ ] Chatbot loads smoothly
- [ ] User can navigate between 3 sample questions
- [ ] Response text displays with agent names highlighted

---

## METRICS TO TRACK

```typescript
// In GENESIS backend
await telemetry.log({
  event: 'demo_request',
  timestamp: new Date(),
  sessionId: request.body.sessionId,
  userQuestion: request.body.userQuestion,
  responseTime: Date.now() - startTime,
  agentsInvolved: requiredAgents,
  success: true,
});
```

**KPIs**:
- Demo API response time: <2s (target)
- Error rate: <0.5%
- Demo engagement: 25%+ of users click demo
- Average demo conversation time: 30+ seconds

---

## DEPLOYMENT

### Phase 1: Staging (Week 2)
1. Deploy demo endpoint to GENESIS staging
2. Point ngx-transform staging to GENESIS staging
3. Run load test (100 concurrent demo requests)
4. A/B test response quality

### Phase 2: Production (Week 3)
1. Deploy demo endpoint to GENESIS production
2. Monitor error rates (target <0.5%)
3. Update ngx-transform to call production endpoint
4. Launch with feature flag `FF_GENESIS_BRIDGE = true`

---

## TROUBLESHOOTING

### GENESIS API is slow
**Solution**: Pre-generate 3-5 sample responses, rotate them

### Gemini API quota exceeded
**Solution**: Cache responses by user profile hash + question

### CORS errors
**Solution**: Verify `origin` whitelist in GENESIS backend

---

## SUCCESS CRITERIA

✅ Demo endpoint returns <2s response  
✅ Error rate <0.5%  
✅ 25%+ of lead magnet users click demo  
✅ 30+ second average interaction time  
✅ 8-12% of demo viewers convert to ASCEND  

---
