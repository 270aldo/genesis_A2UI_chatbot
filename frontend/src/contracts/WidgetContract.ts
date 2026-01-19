/**
 * NGX GENESIS A2UI - Widget Contract
 *
 * REGLA DE ORO: Si no está aquí, no se renderiza.
 *
 * Este archivo es el CONTRATO ÚNICO entre backend y frontend.
 * - Backend: Solo puede enviar widgetType de este catálogo
 * - Frontend: Solo renderiza si pasa validación Zod
 * - Violación: Fallback a texto + log de error (sin crash)
 */

import { z } from 'zod';

// ============================================
// AGENT ID (V4: Unified identity with legacy categorization)
// ============================================

/**
 * V4: All API responses come from GENESIS.
 * Legacy agent names are kept for internal widget categorization only.
 * Users only see "GENESIS" - internal routing is hidden.
 */
export const AgentIdSchema = z.enum([
  'GENESIS',  // Unified identity (all API responses)
  // Legacy categories (for internal widget registry only):
  'SPARK',    // Habits/Mindset
  'BLAZE',    // Strength training
  'TEMPO',    // Cardio
  'ATLAS',    // Mobility/Pain
  'WAVE',     // Recovery
  'SAGE',     // Nutrition strategy
  'MACRO',    // Nutrition tracking
  'NOVA',     // Supplements
  'STELLA',   // Analytics
  'LUNA',     // Hormonal/Cycle
  'LOGOS',    // Education
]);

export type AgentId = z.infer<typeof AgentIdSchema>;

// ============================================
// WIDGET TYPES (Exhaustive whitelist)
// ============================================

export const WidgetTypeSchema = z.enum([
  // SPARK widgets
  'morning-checkin',
  'focus-ritual',
  'breathwork-cooldown',
  'habit-tracker',

  // GENESIS widgets
  'daily-briefing',
  'phase-transition',
  'season-review',
  'next-season-proposal',
  'quick-actions',

  // BLAZE widgets
  'workout-card',
  'live-session-tracker',
  'workout-complete',
  'rest-timer',
  'equipment-recognition',
  'form-analysis',
  'timer-widget',

  // TEMPO widgets
  'cardio-session-tracker',
  'hiit-interval-tracker',
  'heart-rate-zone',

  // ATLAS widgets
  'pain-report-inline',
  'safe-variant',
  'mobility-routine',
  'body-map',

  // WAVE widgets
  'recovery-score',
  'hrv-trend',
  'deload-suggestion',

  // SAGE widgets (nutrition strategy)
  'meal-plan',
  'recipe-card',
  'smart-grocery-list',

  // MACRO widgets (nutrition tracking)
  'hydration-reminder',
  'hydration-tracker',
  'pre-workout-fuel',
  'post-workout-window',
  'quick-meal-log',
  'macro-tracker',
  'meal-photo-analysis',

  // NOVA widgets
  'supplement-stack',
  'supplement-timing',
  'interaction-checker',
  'supplement-recommendation',

  // STELLA widgets
  'progress-insight',
  'progress-dashboard',
  'weekly-summary',
  'pr-celebration',
  'body-comp-visualizer',
  'insight-card',

  // LUNA widgets
  'cycle-tracker',
  'cycle-adjustment',
  'hormonal-insights',

  // LOGOS widgets
  'micro-learning',
  'educational-prompt',
  'why-this-works',

  // Legacy widgets (backward compatibility)
  'daily-checkin',
  'checklist',
  'sleep-analysis',
  'quote-card',
  'alert-banner',
  'plate-calculator',
  'habit-streak',
  'breathwork-guide',
]);

export type WidgetType = z.infer<typeof WidgetTypeSchema>;

// ============================================
// PRIORITY & POSITION (Constrained values)
// ============================================

export const PrioritySchema = z.enum(['high', 'medium', 'low']);
export type Priority = z.infer<typeof PrioritySchema>;

export const PositionSchema = z.enum(['inline', 'floating', 'fullscreen', 'bottom-sheet']);
export type Position = z.infer<typeof PositionSchema>;

export const QueueBehaviorSchema = z.enum(['defer', 'replace', 'stack']);
export type QueueBehavior = z.infer<typeof QueueBehaviorSchema>;

// ============================================
// BASE WIDGET PAYLOAD (All widgets must have this)
// ============================================

export const BaseWidgetPayloadSchema = z.object({
  // Required identity
  widgetId: z.string().uuid(),
  widgetType: WidgetTypeSchema,
  agentId: AgentIdSchema,

  // Display config
  priority: PrioritySchema.default('medium'),
  position: PositionSchema.default('inline'),

  // Queue behavior
  queueBehavior: QueueBehaviorSchema.default('defer'),
  expiresAt: z.string().datetime().optional(),
  ttlSeconds: z.number().positive().optional(),

  // Dismissal
  dismissable: z.boolean().default(true),
  autoDismissSeconds: z.number().positive().optional(),

  // Context
  sessionId: z.string().uuid().optional(),
  trigger: z.string().optional(),

  // Timestamp
  createdAt: z.string().datetime(),
});

export type BaseWidgetPayload = z.infer<typeof BaseWidgetPayloadSchema>;

// ============================================
// WIDGET-SPECIFIC DATA SCHEMAS
// ============================================

// SPARK: Morning Check-in
export const MorningCheckinDataSchema = z.object({
  userName: z.string().optional(),
  defaultValues: z.object({
    sleep: z.number().min(1).max(5).optional(),
    energy: z.number().min(1).max(5).optional(),
    stress: z.number().min(1).max(5).optional(),
  }).optional(),
  showPainInput: z.boolean().default(true),
});

// GENESIS: Daily Briefing
export const DailyBriefingDataSchema = z.object({
  greeting: z.string(),
  todayFocus: z.string(),
  adjustments: z.array(z.object({
    reason: z.string(),
    change: z.string(),
    source: AgentIdSchema,
  })).optional(),
  preview: z.object({
    sessionName: z.string(),
    duration: z.string(),
    exerciseCount: z.number(),
  }).optional(),
});

// BLAZE: Workout Card
export const WorkoutCardDataSchema = z.object({
  sessionName: z.string(),
  sessionType: z.enum(['strength', 'cardio', 'hiit', 'mobility', 'mixed']),
  duration: z.string(),
  difficulty: z.number().min(1).max(3),
  exercises: z.array(z.object({
    id: z.string(),
    name: z.string(),
    sets: z.number(),
    reps: z.string(),
    notes: z.string().optional(),
  })),
  equipment: z.array(z.string()).optional(),
  adjustedFor: z.string().optional(),
});

// BLAZE: Live Session Tracker
export const LiveSessionTrackerDataSchema = z.object({
  sessionId: z.string().uuid(),
  currentExercise: z.object({
    id: z.string(),
    name: z.string(),
    targetSets: z.number(),
    targetReps: z.string(),
    targetWeight: z.number().optional(),
    notes: z.string().optional(),
  }),
  currentSet: z.number(),
  totalSets: z.number(),
  completedSets: z.array(z.object({
    setNumber: z.number(),
    weight: z.number().optional(),
    reps: z.number(),
    rpe: z.number().optional(),
  })),
  nextExercise: z.string().optional(),
  restConfig: z.object({
    defaultSeconds: z.number(),
    autoStart: z.boolean(),
  }).optional(),
});

// BLAZE: Workout Complete
export const WorkoutCompleteDataSchema = z.object({
  sessionName: z.string(),
  duration: z.string(),
  totalVolume: z.number(),
  setsCompleted: z.number(),
  exercisesCompleted: z.number(),
  prs: z.array(z.object({
    exercise: z.string(),
    type: z.enum(['weight', 'reps', 'volume']),
    value: z.number(),
    previousBest: z.number().optional(),
  })).optional(),
  streak: z.number(),
  celebrationType: z.enum(['confetti', 'fireworks', 'streak']).default('confetti'),
});

// BLAZE: Rest Timer
export const RestTimerDataSchema = z.object({
  recommendedSeconds: z.number(),
  currentSeconds: z.number(),
  autoStart: z.boolean().default(true),
  alerts: z.array(z.object({
    atSeconds: z.number(),
    type: z.enum(['prepare', 'go']),
    haptic: z.enum(['light', 'strong']).optional(),
  })).optional(),
});

// ATLAS: Pain Report
export const PainReportDataSchema = z.object({
  currentExercise: z.string().optional(),
  preselectedZone: z.string().optional(),
  quickOptions: z.array(z.object({
    zone: z.string(),
    label: z.string(),
  })).optional(),
});

// ATLAS: Safe Variant
export const SafeVariantDataSchema = z.object({
  originalExercise: z.object({
    id: z.string(),
    name: z.string(),
  }),
  painZone: z.string(),
  painIntensity: z.number().min(1).max(3),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    reason: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  recommendation: z.string(),
});

// MACRO: Hydration Reminder
export const HydrationReminderDataSchema = z.object({
  targetMl: z.number(),
  consumedMl: z.number(),
  reminderText: z.string().optional(),
  quickAddOptions: z.array(z.number()).default([250, 500]),
});

// MACRO: Pre/Post Workout Fuel
export const NutritionWindowDataSchema = z.object({
  windowType: z.enum(['pre_workout', 'post_workout']),
  timing: z.string(),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  recommendation: z.object({
    primary: z.string(),
    macroTarget: z.object({
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional(),
    }).optional(),
    examples: z.array(z.string()).optional(),
  }),
  countdown: z.object({
    label: z.string(),
    endsAt: z.string().datetime(),
  }).optional(),
});

// MACRO: Quick Meal Log
export const QuickMealLogDataSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout']),
  suggestions: z.array(z.object({
    id: z.string(),
    name: z.string(),
    macros: z.object({
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  })).optional(),
  recentMeals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    lastUsed: z.string().datetime(),
  })).optional(),
  allowPhoto: z.boolean().default(true),
  allowVoice: z.boolean().default(true),
});

// STELLA: Progress Insight
export const ProgressInsightDataSchema = z.object({
  insightType: z.enum(['volume_trend', 'strength_gain', 'consistency', 'recovery_pattern']),
  title: z.string(),
  message: z.string(),
  data: z.object({
    current: z.number(),
    previous: z.number(),
    change: z.number(),
    changePercent: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }).optional(),
  visualization: z.enum(['sparkline', 'bar', 'none']).default('none'),
});

// STELLA: Weekly Summary
export const WeeklySummaryDataSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  metrics: z.object({
    sessionsPlanned: z.number(),
    sessionsCompleted: z.number(),
    totalVolume: z.number(),
    totalDuration: z.number(),
    streak: z.number(),
    prsCount: z.number(),
  }),
  insights: z.array(z.object({
    type: z.string(),
    message: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'needs_attention']),
  })),
  comparison: z.object({
    vsLastWeek: z.number(),
    vsAverage: z.number(),
  }).optional(),
});

// LOGOS: Micro Learning
export const MicroLearningDataSchema = z.object({
  topic: z.string(),
  content: z.string(),
  duration: z.string(),
  relatedTo: z.string().optional(),
  source: z.string().optional(),
  learnMoreUrl: z.string().url().optional(),
});

// ============================================
// FULL WIDGET PAYLOAD SCHEMAS (Type-specific)
// ============================================

export const MorningCheckinPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('morning-checkin'),
  agentId: z.literal('SPARK'),
  data: MorningCheckinDataSchema,
});

export const DailyBriefingPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('daily-briefing'),
  agentId: z.literal('GENESIS'),
  data: DailyBriefingDataSchema,
});

export const WorkoutCardPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('workout-card'),
  agentId: z.literal('BLAZE'),
  data: WorkoutCardDataSchema,
});

export const LiveSessionTrackerPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('live-session-tracker'),
  agentId: z.literal('BLAZE'),
  data: LiveSessionTrackerDataSchema,
});

export const WorkoutCompletePayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('workout-complete'),
  agentId: z.literal('BLAZE'),
  data: WorkoutCompleteDataSchema,
});

export const RestTimerPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('rest-timer'),
  agentId: z.literal('BLAZE'),
  data: RestTimerDataSchema,
});

export const PainReportPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('pain-report-inline'),
  agentId: z.literal('ATLAS'),
  data: PainReportDataSchema,
});

export const SafeVariantPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('safe-variant'),
  agentId: z.literal('ATLAS'),
  data: SafeVariantDataSchema,
});

export const HydrationReminderPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('hydration-reminder'),
  agentId: z.literal('MACRO'),
  data: HydrationReminderDataSchema,
});

export const NutritionWindowPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.enum(['pre-workout-fuel', 'post-workout-window']),
  agentId: z.literal('MACRO'),
  data: NutritionWindowDataSchema,
});

export const QuickMealLogPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('quick-meal-log'),
  agentId: z.literal('MACRO'),
  data: QuickMealLogDataSchema,
});

export const ProgressInsightPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('progress-insight'),
  agentId: z.literal('STELLA'),
  data: ProgressInsightDataSchema,
});

export const WeeklySummaryPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('weekly-summary'),
  agentId: z.literal('STELLA'),
  data: WeeklySummaryDataSchema,
});

export const MicroLearningPayloadSchema = BaseWidgetPayloadSchema.extend({
  widgetType: z.literal('micro-learning'),
  agentId: z.literal('LOGOS'),
  data: MicroLearningDataSchema,
});

// ============================================
// UNION TYPE (All valid payloads)
// ============================================

export const WidgetPayloadSchema = z.discriminatedUnion('widgetType', [
  MorningCheckinPayloadSchema,
  DailyBriefingPayloadSchema,
  WorkoutCardPayloadSchema,
  LiveSessionTrackerPayloadSchema,
  WorkoutCompletePayloadSchema,
  RestTimerPayloadSchema,
  PainReportPayloadSchema,
  SafeVariantPayloadSchema,
  HydrationReminderPayloadSchema,
  NutritionWindowPayloadSchema,
  QuickMealLogPayloadSchema,
  ProgressInsightPayloadSchema,
  WeeklySummaryPayloadSchema,
  MicroLearningPayloadSchema,
]);

export type ValidatedWidgetPayload = z.infer<typeof WidgetPayloadSchema>;

// ============================================
// VALIDATION FUNCTION
// ============================================

export interface ValidationResult {
  success: boolean;
  data?: ValidatedWidgetPayload;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function validateWidgetPayload(payload: unknown): ValidationResult {
  // First check if it's an object with widgetType
  if (!payload || typeof payload !== 'object' || !('widgetType' in payload)) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Payload must be an object with widgetType',
      },
    };
  }

  const { widgetType } = payload as { widgetType: string };

  // Check if widgetType is in whitelist
  const whitelistResult = WidgetTypeSchema.safeParse(widgetType);
  if (!whitelistResult.success) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_WIDGET_TYPE',
        message: `Widget type "${widgetType}" is not in the whitelist`,
        details: whitelistResult.error.issues,
      },
    };
  }

  // Full validation
  const result = WidgetPayloadSchema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      code: 'VALIDATION_FAILED',
      message: `Widget payload validation failed for type "${widgetType}"`,
      details: result.error.issues,
    },
  };
}

// ============================================
// LEGACY SUPPORT - Simple validation for backward compatibility
// ============================================

/**
 * Validates that a widget type is known (for backward compat with existing widgets)
 * Does NOT require full schema validation - just checks if type is whitelisted
 */
export function isKnownWidgetType(type: string): type is WidgetType {
  return WidgetTypeSchema.safeParse(type).success;
}

/**
 * Validates that an agent ID is known
 */
export function isKnownAgentId(id: string): id is AgentId {
  return AgentIdSchema.safeParse(id).success;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isMorningCheckin(payload: ValidatedWidgetPayload): payload is z.infer<typeof MorningCheckinPayloadSchema> {
  return payload.widgetType === 'morning-checkin';
}

export function isWorkoutCard(payload: ValidatedWidgetPayload): payload is z.infer<typeof WorkoutCardPayloadSchema> {
  return payload.widgetType === 'workout-card';
}

export function isLiveSessionTracker(payload: ValidatedWidgetPayload): payload is z.infer<typeof LiveSessionTrackerPayloadSchema> {
  return payload.widgetType === 'live-session-tracker';
}

export function isWorkoutComplete(payload: ValidatedWidgetPayload): payload is z.infer<typeof WorkoutCompletePayloadSchema> {
  return payload.widgetType === 'workout-complete';
}

export function isRestTimer(payload: ValidatedWidgetPayload): payload is z.infer<typeof RestTimerPayloadSchema> {
  return payload.widgetType === 'rest-timer';
}

export function isPainReport(payload: ValidatedWidgetPayload): payload is z.infer<typeof PainReportPayloadSchema> {
  return payload.widgetType === 'pain-report-inline';
}

export function isSafeVariant(payload: ValidatedWidgetPayload): payload is z.infer<typeof SafeVariantPayloadSchema> {
  return payload.widgetType === 'safe-variant';
}
