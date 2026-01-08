export const COLORS: Record<string, string> = {
  // Original 6 agents
  genesis: '#6D00FF',  // Purple - Orchestrator
  blaze: '#EF4444',    // Red - Strength training
  sage: '#22C55E',     // Green - Nutrition strategy
  spark: '#FBBF24',    // Yellow - Habits/Mindset
  stella: '#A855F7',   // Light purple - Analytics
  logos: '#6D00FF',    // Purple - Education

  // New 7 agents
  tempo: '#F97316',    // Orange - Cardio/HIIT
  atlas: '#F59E0B',    // Amber - Mobility/Pain
  wave: '#0EA5E9',     // Sky blue - Recovery/HRV
  metabol: '#14B8A6',  // Teal - Metabolic health
  macro: '#10B981',    // Emerald - Nutrition tracking
  nova: '#D946EF',     // Fuchsia - Supplements
  luna: '#6366F1',     // Indigo - Hormonal/Cycle

  // UI colors
  bg: '#050505',
  card: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)'
};

const AGENT_ALIASES: Record<string, string> = {
  nexus: 'genesis',
  aqua: 'sage',        // Legacy alias
  nutrition: 'sage',   // Alternative name
};

export const getAgentColor = (agent?: string): string => {
  const normalized = agent?.toLowerCase() || 'genesis';
  const resolved = AGENT_ALIASES[normalized] || normalized;
  return COLORS[resolved] || COLORS.genesis;
};

export const SYSTEM_PROMPT = `
Eres GENESIS, el orquestador de NGX GENESIS. Responde siempre en JSON válido y usa widgets cuando aporten valor.

Agentes disponibles (13 especialistas):
- GENESIS: Orquestación y coordinación general
- BLAZE: Entrenamiento de fuerza (workout-card, live-session-tracker)
- TEMPO: Cardio y HIIT (cardio-session-tracker, hiit-interval-tracker)
- ATLAS: Movilidad y dolor (pain-report-inline, safe-variant)
- WAVE: Recuperación y HRV (recovery-score, deload-suggestion)
- SAGE: Estrategia nutricional (meal-plan, recipe-card)
- METABOL: Salud metabólica
- MACRO: Tracking nutricional (hydration-reminder, quick-meal-log)
- NOVA: Suplementos (supplement-stack, supplement-timing)
- SPARK: Hábitos y mindset (morning-checkin, daily-checkin)
- STELLA: Analytics (progress-insight, weekly-summary)
- LUNA: Ciclo hormonal (cycle-tracker, cycle-adjustment)
- LOGOS: Educación (micro-learning, why-this-works)

Formato de respuesta:
(
  "text": "Respuesta textual...",
  "agent": "GENESIS|BLAZE|TEMPO|ATLAS|WAVE|SAGE|METABOL|MACRO|NOVA|SPARK|STELLA|LUNA|LOGOS",
  "payload": ( "type": "widget-type", "props": ( ... ) )
)

Widgets comunes: workout-card, live-session-tracker, morning-checkin, daily-briefing,
pain-report-inline, safe-variant, recovery-score, meal-plan, hydration-reminder,
pre-workout-fuel, post-workout-window, supplement-stack, progress-insight, weekly-summary,
micro-learning, quick-actions, alert-banner.
`;
