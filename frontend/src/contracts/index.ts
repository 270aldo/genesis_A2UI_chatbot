/**
 * NGX GENESIS A2UI - Contract System
 *
 * Export all contracts for easy importing:
 *
 * import { AgentId, WidgetType, validateWidgetPayload } from '@/contracts';
 * import { getWidgetConfig, WIDGET_REGISTRY } from '@/contracts';
 * import { useWidgetQueue } from '@/contracts';
 */

// Widget Contract - Zod schemas and validation
export {
  // Agent IDs
  AgentIdSchema,
  type AgentId,

  // Widget Types
  WidgetTypeSchema,
  type WidgetType,

  // Priority, Position, Queue Behavior
  PrioritySchema,
  PositionSchema,
  QueueBehaviorSchema,
  type Priority,
  type Position,
  type QueueBehavior,

  // Base Payload
  BaseWidgetPayloadSchema,
  type BaseWidgetPayload,

  // Data Schemas
  MorningCheckinDataSchema,
  DailyBriefingDataSchema,
  WorkoutCardDataSchema,
  LiveSessionTrackerDataSchema,
  WorkoutCompleteDataSchema,
  RestTimerDataSchema,
  PainReportDataSchema,
  SafeVariantDataSchema,
  HydrationReminderDataSchema,
  NutritionWindowDataSchema,
  QuickMealLogDataSchema,
  ProgressInsightDataSchema,
  WeeklySummaryDataSchema,
  MicroLearningDataSchema,

  // Full Payload Schemas
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

  // Union Schema
  WidgetPayloadSchema,
  type ValidatedWidgetPayload,

  // Validation
  type ValidationResult,
  validateWidgetPayload,

  // Legacy support
  isKnownWidgetType,
  isKnownAgentId,

  // Type guards
  isMorningCheckin,
  isWorkoutCard,
  isLiveSessionTracker,
  isWorkoutComplete,
  isRestTimer,
  isPainReport,
  isSafeVariant,
} from './WidgetContract';

// Widget Registry - Configuration metadata
export {
  type WidgetConfig,
  WIDGET_REGISTRY,
  getWidgetConfig,
  isWidgetAllowedDuringWorkout,
  getWidgetsByAgent,
  getWidgetsByPriority,
  getAllWidgetTypes,
  getAgentWidgetCount,
} from './WidgetRegistry';

// Widget Queue - Attention budget system
export {
  type AttentionBudgetConfig,
  DEFAULT_ATTENTION_CONFIG,
  type QueueWidgetPayload,
  type QueuedWidget,
  type VisibleWidget,
  type WidgetQueueEventType,
  type WidgetQueueEvent,
  type WidgetQueueEventHandler,
  WidgetQueue,
  useWidgetQueue,
} from './WidgetQueue';
