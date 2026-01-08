/**
 * NGX GENESIS A2UI - Hooks Module
 *
 * Re-export all custom hooks
 */

// Attention Budget
export {
  useAttentionBudget,
  STRICT_ATTENTION_CONFIG,
  RELAXED_ATTENTION_CONFIG,
  type UseAttentionBudgetReturn,
  type AttentionBudgetState,
} from './useAttentionBudget';

// Re-export from contracts for convenience
export {
  useWidgetQueue,
  type QueueWidgetPayload,
  type VisibleWidget,
  type QueuedWidget,
  type AttentionBudgetConfig,
  DEFAULT_ATTENTION_CONFIG,
} from '../contracts/WidgetQueue';

// Re-export event hooks from services
export {
  useEventBus,
  useEventSubscription,
  useCategorySubscription,
} from '../services/events';

// Re-export supabase hooks
export {
  useSupabaseStatus,
  useTodayCheckin,
  useSubmitCheckin,
  useActiveSession,
  useWorkoutSession,
  useNutritionLog,
  usePainReports,
  useReportPain,
  useRealtimeSubscription,
} from '../services/supabase';

// Re-export telemetry hooks
export {
  useTelemetry,
  useScreenTracking,
} from '../services/events';
