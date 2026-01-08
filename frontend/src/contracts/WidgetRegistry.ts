/**
 * NGX GENESIS A2UI - Widget Registry
 *
 * REGLA DE ORO: El agente NUNCA inventa UI. Solo pide widgetType de este catálogo.
 *
 * Este registry es la ÚNICA fuente de verdad para:
 * - Qué widgets existen
 * - Sus defaults (priority, position, ttl)
 * - Su agente propietario
 *
 * NOTA: Los componentes se renderizan en Widgets.tsx (A2UIMediator)
 * Este archivo es solo metadata/configuración
 */

import {
  WidgetType,
  AgentId,
  Priority,
  Position,
  QueueBehavior,
} from './WidgetContract';

// ============================================
// WIDGET CONFIGURATION TYPE
// ============================================

export interface WidgetConfig {
  // Identity
  widgetType: WidgetType;
  ownerAgent: AgentId;

  // Display defaults (can be overridden by payload)
  defaultPriority: Priority;
  defaultPosition: Position;
  defaultQueueBehavior: QueueBehavior;

  // TTL defaults (seconds)
  defaultTtl?: number;
  autoDismissAfter?: number;

  // Attention budget
  attentionCost: number; // 1-3, affects queue priority
  allowDuringWorkout: boolean;

  // Fallback text if render fails
  fallbackMessage: string;
}

// ============================================
// THE REGISTRY (Single Source of Truth)
// ============================================

export const WIDGET_REGISTRY: Record<WidgetType, WidgetConfig> = {
  // ==========================================
  // SPARK WIDGETS (Habits/Mindset)
  // ==========================================
  'morning-checkin': {
    widgetType: 'morning-checkin',
    ownerAgent: 'SPARK',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    defaultTtl: 14400, // 4 hours
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: '¿Cómo te sientes hoy? Cuéntame sobre tu sueño, energía y estrés.',
  },

  'focus-ritual': {
    widgetType: 'focus-ritual',
    ownerAgent: 'SPARK',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    defaultTtl: 300,
    attentionCost: 1,
    allowDuringWorkout: true,
    fallbackMessage: 'Tómate un momento para enfocar tu mente antes de empezar.',
  },

  'breathwork-cooldown': {
    widgetType: 'breathwork-cooldown',
    ownerAgent: 'SPARK',
    defaultPriority: 'medium',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Respira profundo. Vamos a hacer un cooldown de respiración.',
  },

  'habit-tracker': {
    widgetType: 'habit-tracker',
    ownerAgent: 'SPARK',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: '¿Completaste tus hábitos hoy?',
  },

  // Legacy SPARK widgets
  'daily-checkin': {
    widgetType: 'daily-checkin',
    ownerAgent: 'SPARK',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    defaultTtl: 14400,
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: '¿Cómo te sientes hoy?',
  },

  'checklist': {
    widgetType: 'checklist',
    ownerAgent: 'SPARK',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu lista de tareas.',
  },

  'habit-streak': {
    widgetType: 'habit-streak',
    ownerAgent: 'SPARK',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu racha de hábitos.',
  },

  'breathwork-guide': {
    widgetType: 'breathwork-guide',
    ownerAgent: 'SPARK',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Guía de respiración.',
  },

  // ==========================================
  // GENESIS WIDGETS (Orchestrator)
  // ==========================================
  'daily-briefing': {
    widgetType: 'daily-briefing',
    ownerAgent: 'GENESIS',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    defaultTtl: 7200,
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Aquí está tu plan para hoy. ¿Listo para empezar?',
  },

  'phase-transition': {
    widgetType: 'phase-transition',
    ownerAgent: 'GENESIS',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: false,
    fallbackMessage: 'Completaste una fase de tu entrenamiento. Veamos qué sigue.',
  },

  'season-review': {
    widgetType: 'season-review',
    ownerAgent: 'GENESIS',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: false,
    fallbackMessage: '¡Temporada completada! Revisemos tu progreso.',
  },

  'next-season-proposal': {
    widgetType: 'next-season-proposal',
    ownerAgent: 'GENESIS',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: false,
    fallbackMessage: 'Basado en tu progreso, aquí está mi propuesta para tu próxima temporada.',
  },

  'quick-actions': {
    widgetType: 'quick-actions',
    ownerAgent: 'GENESIS',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Acciones rápidas disponibles.',
  },

  // ==========================================
  // BLAZE WIDGETS (Strength)
  // ==========================================
  'workout-card': {
    widgetType: 'workout-card',
    ownerAgent: 'BLAZE',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    defaultTtl: 3600,
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu sesión de hoy está lista. ¿Comenzamos?',
  },

  'live-session-tracker': {
    widgetType: 'live-session-tracker',
    ownerAgent: 'BLAZE',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: true,
    fallbackMessage: 'Tracking tu sesión en vivo.',
  },

  'workout-complete': {
    widgetType: 'workout-complete',
    ownerAgent: 'BLAZE',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    autoDismissAfter: 30,
    attentionCost: 3,
    allowDuringWorkout: false,
    fallbackMessage: '¡Sesión completada! Excelente trabajo.',
  },

  'rest-timer': {
    widgetType: 'rest-timer',
    ownerAgent: 'BLAZE',
    defaultPriority: 'high',
    defaultPosition: 'floating',
    defaultQueueBehavior: 'replace',
    attentionCost: 1,
    allowDuringWorkout: true,
    fallbackMessage: 'Descansando...',
  },

  'equipment-recognition': {
    widgetType: 'equipment-recognition',
    ownerAgent: 'BLAZE',
    defaultPriority: 'medium',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'defer',
    defaultTtl: 300,
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Identificando equipo...',
  },

  'form-analysis': {
    widgetType: 'form-analysis',
    ownerAgent: 'BLAZE',
    defaultPriority: 'medium',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'defer',
    defaultTtl: 300,
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Analizando tu forma...',
  },

  'timer-widget': {
    widgetType: 'timer-widget',
    ownerAgent: 'BLAZE',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    attentionCost: 1,
    allowDuringWorkout: true,
    fallbackMessage: 'Timer activo.',
  },

  'plate-calculator': {
    widgetType: 'plate-calculator',
    ownerAgent: 'BLAZE',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: true,
    fallbackMessage: 'Calculadora de discos.',
  },

  // ==========================================
  // TEMPO WIDGETS (Cardio)
  // ==========================================
  'cardio-session-tracker': {
    widgetType: 'cardio-session-tracker',
    ownerAgent: 'TEMPO',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: true,
    fallbackMessage: 'Tracking tu sesión de cardio.',
  },

  'hiit-interval-tracker': {
    widgetType: 'hiit-interval-tracker',
    ownerAgent: 'TEMPO',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: true,
    fallbackMessage: 'HIIT en progreso.',
  },

  'heart-rate-zone': {
    widgetType: 'heart-rate-zone',
    ownerAgent: 'TEMPO',
    defaultPriority: 'medium',
    defaultPosition: 'floating',
    defaultQueueBehavior: 'replace',
    attentionCost: 1,
    allowDuringWorkout: true,
    fallbackMessage: 'Zona cardíaca actual.',
  },

  // ==========================================
  // ATLAS WIDGETS (Mobility/Pain)
  // ==========================================
  'pain-report-inline': {
    widgetType: 'pain-report-inline',
    ownerAgent: 'ATLAS',
    defaultPriority: 'high',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'replace',
    defaultTtl: 60,
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: '¿Dónde sientes molestia? Vamos a ajustar.',
  },

  'safe-variant': {
    widgetType: 'safe-variant',
    ownerAgent: 'ATLAS',
    defaultPriority: 'high',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'replace',
    defaultTtl: 120,
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Aquí hay una alternativa más segura para ti.',
  },

  'mobility-routine': {
    widgetType: 'mobility-routine',
    ownerAgent: 'ATLAS',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Rutina de movilidad recomendada.',
  },

  'body-map': {
    widgetType: 'body-map',
    ownerAgent: 'ATLAS',
    defaultPriority: 'medium',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Selecciona las zonas afectadas.',
  },

  // ==========================================
  // WAVE WIDGETS (Recovery)
  // ==========================================
  'recovery-score': {
    widgetType: 'recovery-score',
    ownerAgent: 'WAVE',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu score de recuperación de hoy.',
  },

  'hrv-trend': {
    widgetType: 'hrv-trend',
    ownerAgent: 'WAVE',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tendencia de HRV.',
  },

  'deload-suggestion': {
    widgetType: 'deload-suggestion',
    ownerAgent: 'WAVE',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu cuerpo necesita un deload.',
  },

  'sleep-analysis': {
    widgetType: 'sleep-analysis',
    ownerAgent: 'WAVE',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Análisis de sueño.',
  },

  // ==========================================
  // SAGE WIDGETS (Nutrition Strategy)
  // ==========================================
  'meal-plan': {
    widgetType: 'meal-plan',
    ownerAgent: 'SAGE',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu plan de comidas.',
  },

  'recipe-card': {
    widgetType: 'recipe-card',
    ownerAgent: 'SAGE',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Receta sugerida.',
  },

  'smart-grocery-list': {
    widgetType: 'smart-grocery-list',
    ownerAgent: 'SAGE',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu lista de compras.',
  },

  // ==========================================
  // MACRO WIDGETS (Nutrition Tracking)
  // ==========================================
  'hydration-reminder': {
    widgetType: 'hydration-reminder',
    ownerAgent: 'MACRO',
    defaultPriority: 'low',
    defaultPosition: 'floating',
    defaultQueueBehavior: 'defer',
    defaultTtl: 1200,
    autoDismissAfter: 10,
    attentionCost: 1,
    allowDuringWorkout: true,
    fallbackMessage: 'Hora de hidratarte.',
  },

  'hydration-tracker': {
    widgetType: 'hydration-tracker',
    ownerAgent: 'MACRO',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu progreso de hidratación.',
  },

  'pre-workout-fuel': {
    widgetType: 'pre-workout-fuel',
    ownerAgent: 'MACRO',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    defaultTtl: 5400,
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Prepara tu combustible pre-workout.',
  },

  'post-workout-window': {
    widgetType: 'post-workout-window',
    ownerAgent: 'MACRO',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'replace',
    defaultTtl: 3600,
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Ventana anabólica abierta. Es hora de tu proteína.',
  },

  'quick-meal-log': {
    widgetType: 'quick-meal-log',
    ownerAgent: 'MACRO',
    defaultPriority: 'medium',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: '¿Qué comiste?',
  },

  'macro-tracker': {
    widgetType: 'macro-tracker',
    ownerAgent: 'MACRO',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu progreso de macros hoy.',
  },

  'meal-photo-analysis': {
    widgetType: 'meal-photo-analysis',
    ownerAgent: 'MACRO',
    defaultPriority: 'medium',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'defer',
    defaultTtl: 300,
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Analizando tu comida...',
  },

  // ==========================================
  // NOVA WIDGETS (Supplements)
  // ==========================================
  'supplement-stack': {
    widgetType: 'supplement-stack',
    ownerAgent: 'NOVA',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu stack de suplementos.',
  },

  'supplement-timing': {
    widgetType: 'supplement-timing',
    ownerAgent: 'NOVA',
    defaultPriority: 'low',
    defaultPosition: 'floating',
    defaultQueueBehavior: 'defer',
    defaultTtl: 3600,
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Recordatorio de suplemento.',
  },

  'interaction-checker': {
    widgetType: 'interaction-checker',
    ownerAgent: 'NOVA',
    defaultPriority: 'high',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'replace',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Verificando interacciones...',
  },

  'supplement-recommendation': {
    widgetType: 'supplement-recommendation',
    ownerAgent: 'NOVA',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Recomendación de suplemento.',
  },

  // ==========================================
  // STELLA WIDGETS (Analytics)
  // ==========================================
  'progress-insight': {
    widgetType: 'progress-insight',
    ownerAgent: 'STELLA',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Aquí está tu insight de progreso.',
  },

  'progress-dashboard': {
    widgetType: 'progress-dashboard',
    ownerAgent: 'STELLA',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu dashboard de progreso.',
  },

  'weekly-summary': {
    widgetType: 'weekly-summary',
    ownerAgent: 'STELLA',
    defaultPriority: 'medium',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    attentionCost: 3,
    allowDuringWorkout: false,
    fallbackMessage: 'Resumen de tu semana.',
  },

  'pr-celebration': {
    widgetType: 'pr-celebration',
    ownerAgent: 'STELLA',
    defaultPriority: 'high',
    defaultPosition: 'fullscreen',
    defaultQueueBehavior: 'replace',
    autoDismissAfter: 10,
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: '¡NUEVO PR!',
  },

  'body-comp-visualizer': {
    widgetType: 'body-comp-visualizer',
    ownerAgent: 'STELLA',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 2,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu composición corporal.',
  },

  'insight-card': {
    widgetType: 'insight-card',
    ownerAgent: 'STELLA',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Insight basado en tus datos.',
  },

  // ==========================================
  // LUNA WIDGETS (Hormonal/Cycle)
  // ==========================================
  'cycle-tracker': {
    widgetType: 'cycle-tracker',
    ownerAgent: 'LUNA',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Tu ciclo hormonal.',
  },

  'cycle-adjustment': {
    widgetType: 'cycle-adjustment',
    ownerAgent: 'LUNA',
    defaultPriority: 'medium',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Ajustes por fase hormonal.',
  },

  'hormonal-insights': {
    widgetType: 'hormonal-insights',
    ownerAgent: 'LUNA',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Insights hormonales.',
  },

  // ==========================================
  // LOGOS WIDGETS (Education)
  // ==========================================
  'micro-learning': {
    widgetType: 'micro-learning',
    ownerAgent: 'LOGOS',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    defaultTtl: 86400,
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Dato rápido de hoy.',
  },

  'educational-prompt': {
    widgetType: 'educational-prompt',
    ownerAgent: 'LOGOS',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: '¿Quieres saber más?',
  },

  'why-this-works': {
    widgetType: 'why-this-works',
    ownerAgent: 'LOGOS',
    defaultPriority: 'low',
    defaultPosition: 'bottom-sheet',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Por qué esto funciona.',
  },

  // Legacy widgets
  'quote-card': {
    widgetType: 'quote-card',
    ownerAgent: 'SPARK',
    defaultPriority: 'low',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'defer',
    attentionCost: 1,
    allowDuringWorkout: false,
    fallbackMessage: 'Cita motivacional.',
  },

  'alert-banner': {
    widgetType: 'alert-banner',
    ownerAgent: 'GENESIS',
    defaultPriority: 'high',
    defaultPosition: 'inline',
    defaultQueueBehavior: 'stack',
    attentionCost: 2,
    allowDuringWorkout: true,
    fallbackMessage: 'Alerta importante.',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getWidgetConfig(widgetType: WidgetType): WidgetConfig {
  const config = WIDGET_REGISTRY[widgetType];
  if (!config) {
    throw new Error(`Widget type "${widgetType}" not found in registry`);
  }
  return config;
}

export function isWidgetAllowedDuringWorkout(widgetType: WidgetType): boolean {
  return WIDGET_REGISTRY[widgetType]?.allowDuringWorkout ?? false;
}

export function getWidgetsByAgent(agentId: AgentId): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY).filter(config => config.ownerAgent === agentId);
}

export function getWidgetsByPriority(priority: Priority): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY).filter(config => config.defaultPriority === priority);
}

export function getAllWidgetTypes(): WidgetType[] {
  return Object.keys(WIDGET_REGISTRY) as WidgetType[];
}

export function getAgentWidgetCount(agentId: AgentId): number {
  return getWidgetsByAgent(agentId).length;
}
