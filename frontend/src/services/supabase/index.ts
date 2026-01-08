/**
 * NGX GENESIS A2UI - Supabase Module
 *
 * Export all Supabase-related functionality
 */

export {
  // Client
  supabase,
  isSupabaseConfigured,
  getSupabaseClient,
  table,

  // Types
  type Database,

  // Common queries
  insertWidgetEvents,
  getUserProfile,
  getTodayCheckin,
  getActiveSession,
  getRecentPainReports,
} from './client';

export {
  // Status hook
  useSupabaseStatus,

  // Check-in hooks
  useTodayCheckin,
  useSubmitCheckin,

  // Workout session hooks
  useActiveSession,
  useWorkoutSession,

  // Nutrition hooks
  useNutritionLog,

  // Pain report hooks
  usePainReports,
  useReportPain,

  // Realtime hook
  useRealtimeSubscription,
} from './hooks/useSupabase';
