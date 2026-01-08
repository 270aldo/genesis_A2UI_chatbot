/**
 * Supabase Services - Main Export
 */

export { supabase, getCurrentUserId, testConnection } from './client';
export type {
  Database,
  Json,
  Profile,
  DailyCheckin,
  WorkoutSession,
  SetLog,
  PainReport,
  HydrationLog,
  CycleLog,
  TrainingSeason,
  TrainingPhase,
  WeeklySummary,
  WidgetEvent,
  DailyCheckinInsert,
  SetLogInsert,
  PainReportInsert,
  HydrationLogInsert,
  WidgetEventInsert,
} from './types';
