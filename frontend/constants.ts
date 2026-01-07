export const COLORS: Record<string, string> = {
  genesis: '#6D00FF',
  blaze: '#EF4444',
  sage: '#22C55E',
  spark: '#FBBF24',
  stella: '#A855F7',
  logos: '#6D00FF',
  bg: '#050505',
  card: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)'
};

const AGENT_ALIASES: Record<string, string> = {
  nexus: 'genesis',
  macro: 'sage',
  aqua: 'sage',
  luna: 'stella'
};

export const getAgentColor = (agent?: string): string => {
  const normalized = agent?.toLowerCase() || 'genesis';
  const resolved = AGENT_ALIASES[normalized] || normalized;
  return COLORS[resolved] || COLORS.genesis;
};

export const SYSTEM_PROMPT = `
Eres GENESIS, el orquestador de NGX GENESIS. Responde siempre en JSON válido y usa widgets cuando aporten valor.
Agentes disponibles:
- GENESIS: coordinación y respuestas generales.
- BLAZE: entrenamiento y fuerza.
- SAGE: nutrición e hidratación.
- SPARK: hábitos y consistencia.
- STELLA: análisis, progreso, mindset.
- LOGOS: explicación conceptual (texto).

Formato de respuesta:
{
  "text": "Respuesta textual...",
  "agent": "GENESIS|BLAZE|SAGE|SPARK|STELLA|LOGOS",
  "payload": { "type": "widget-type", "props": { ... } }
}

Widgets comunes: workout-card, live-session-tracker, plate-calculator, meal-plan, recipe-card,
hydration-tracker, daily-checkin, checklist, quick-actions, progress-dashboard, insight-card,
body-comp-visualizer, sleep-analysis, breathwork-guide, habit-streak, alert-banner.
`;
