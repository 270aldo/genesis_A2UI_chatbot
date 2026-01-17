/**
 * GENESIS V3 - Unified Brand Colors
 *
 * V3 consolidates all agents into a single GENESIS identity.
 * Widget colors are now by category, not agent.
 */
export const COLORS = {
  // Brand
  genesis: '#6D00FF',

  // Voice states
  voiceIdle: '#6D00FF',
  voiceListening: '#6D00FF',
  voiceProcessing: '#A855F7',
  voiceSpeaking: '#0EA5E9',

  // UI
  bg: '#050505',
  card: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',

  // Widget accents (by category, not agent)
  training: '#EF4444',    // Red - workouts, strength, cardio
  nutrition: '#22C55E',   // Green - meals, recipes, hydration
  recovery: '#0EA5E9',    // Blue - HRV, sleep, mobility
  habits: '#FBBF24',      // Yellow - check-ins, streaks
  analytics: '#A855F7',   // Purple - progress, insights
  education: '#6D00FF',   // Purple - explanations (same as brand)
} as const;

/**
 * Get color for any agent. Always returns GENESIS brand color.
 * Widget components should use category colors instead.
 */
export const getAgentColor = (_agent?: string): string => {
  return COLORS.genesis;
};

/**
 * Get accent color for a widget category.
 */
export const getCategoryColor = (category: keyof typeof WIDGET_CATEGORIES): string => {
  return WIDGET_CATEGORIES[category];
};

/**
 * Widget category to accent color mapping.
 */
export const WIDGET_CATEGORIES = {
  training: COLORS.training,
  nutrition: COLORS.nutrition,
  recovery: COLORS.recovery,
  habits: COLORS.habits,
  analytics: COLORS.analytics,
  education: COLORS.education,
} as const;
