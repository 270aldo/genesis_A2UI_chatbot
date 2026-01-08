/**
 * Supabase Database Types
 *
 * Auto-generated from database schema.
 * Run `supabase gen types typescript` to update.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string | null;
          subscription_tier: string | null;
          subscription_started_at: string | null;
          preferred_units: string | null;
          language: string | null;
          onboarding_completed: boolean | null;
          onboarding_step: number | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          subscription_tier?: string | null;
          subscription_started_at?: string | null;
          preferred_units?: string | null;
          language?: string | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          subscription_tier?: string | null;
          subscription_started_at?: string | null;
          preferred_units?: string | null;
          language?: string | null;
          onboarding_completed?: boolean | null;
          onboarding_step?: number | null;
        };
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          checkin_date: string;
          sleep_quality: number | null;
          energy_level: number | null;
          stress_level: number | null;
          sleep_hours: number | null;
          pain_zones: Json | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          checkin_date: string;
          sleep_quality?: number | null;
          energy_level?: number | null;
          stress_level?: number | null;
          sleep_hours?: number | null;
          pain_zones?: Json | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          checkin_date?: string;
          sleep_quality?: number | null;
          energy_level?: number | null;
          stress_level?: number | null;
          sleep_hours?: number | null;
          pain_zones?: Json | null;
          notes?: string | null;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          started_at: string;
          completed_at: string | null;
          status: string;
          session_type: string | null;
          title: string | null;
          phase_id: string | null;
          season_id: string | null;
          total_volume_kg: number | null;
          total_duration_minutes: number | null;
          exercises_completed: number | null;
          exercises_planned: number | null;
          notes: string | null;
          rating: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          started_at: string;
          completed_at?: string | null;
          status?: string;
          session_type?: string | null;
          title?: string | null;
          phase_id?: string | null;
          season_id?: string | null;
          total_volume_kg?: number | null;
          total_duration_minutes?: number | null;
          exercises_completed?: number | null;
          exercises_planned?: number | null;
          notes?: string | null;
          rating?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          session_type?: string | null;
          title?: string | null;
          phase_id?: string | null;
          season_id?: string | null;
          total_volume_kg?: number | null;
          total_duration_minutes?: number | null;
          exercises_completed?: number | null;
          exercises_planned?: number | null;
          notes?: string | null;
          rating?: number | null;
        };
      };
      set_logs: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          created_at: string;
          exercise_id: string | null;
          exercise_name: string;
          set_number: number;
          weight_kg: number | null;
          reps: number | null;
          rpe: number | null;
          duration_seconds: number | null;
          is_warmup: boolean | null;
          is_pr: boolean | null;
          was_modified: boolean | null;
          modification_reason: string | null;
          rest_seconds: number | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          created_at?: string;
          exercise_id?: string | null;
          exercise_name: string;
          set_number: number;
          weight_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          duration_seconds?: number | null;
          is_warmup?: boolean | null;
          is_pr?: boolean | null;
          was_modified?: boolean | null;
          modification_reason?: string | null;
          rest_seconds?: number | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          created_at?: string;
          exercise_id?: string | null;
          exercise_name?: string;
          set_number?: number;
          weight_kg?: number | null;
          reps?: number | null;
          rpe?: number | null;
          duration_seconds?: number | null;
          is_warmup?: boolean | null;
          is_pr?: boolean | null;
          was_modified?: boolean | null;
          modification_reason?: string | null;
          rest_seconds?: number | null;
        };
      };
      pain_reports: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          zone: string;
          intensity: number;
          session_id: string | null;
          exercise_id: string | null;
          action_taken: string | null;
          variant_used: string | null;
          followup_scheduled: boolean | null;
          followup_completed: boolean | null;
          followup_notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          zone: string;
          intensity: number;
          session_id?: string | null;
          exercise_id?: string | null;
          action_taken?: string | null;
          variant_used?: string | null;
          followup_scheduled?: boolean | null;
          followup_completed?: boolean | null;
          followup_notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          zone?: string;
          intensity?: number;
          session_id?: string | null;
          exercise_id?: string | null;
          action_taken?: string | null;
          variant_used?: string | null;
          followup_scheduled?: boolean | null;
          followup_completed?: boolean | null;
          followup_notes?: string | null;
        };
      };
      hydration_logs: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          amount_ml: number;
          session_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          amount_ml: number;
          session_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          amount_ml?: number;
          session_id?: string | null;
        };
      };
      cycle_logs: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          cycle_day: number;
          phase: string;
          symptoms: Json | null;
          energy_modifier: number | null;
          log_date: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          cycle_day: number;
          phase: string;
          symptoms?: Json | null;
          energy_modifier?: number | null;
          log_date: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          cycle_day?: number;
          phase?: string;
          symptoms?: Json | null;
          energy_modifier?: number | null;
          log_date?: string;
        };
      };
      training_seasons: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          name: string;
          goal: string | null;
          started_at: string;
          completed_at: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          name: string;
          goal?: string | null;
          started_at: string;
          completed_at?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          name?: string;
          goal?: string | null;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
        };
      };
      training_phases: {
        Row: {
          id: string;
          season_id: string;
          user_id: string;
          phase_number: number;
          name: string;
          focus: string | null;
          weeks: number;
          started_at: string | null;
          completed_at: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          user_id: string;
          phase_number: number;
          name: string;
          focus?: string | null;
          weeks: number;
          started_at?: string | null;
          completed_at?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          user_id?: string;
          phase_number?: number;
          name?: string;
          focus?: string | null;
          weeks?: number;
          started_at?: string | null;
          completed_at?: string | null;
          status?: string;
        };
      };
      weekly_summaries: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          week_start: string;
          week_end: string;
          season_id: string | null;
          phase_id: string | null;
          sessions_planned: number | null;
          sessions_completed: number | null;
          total_volume_kg: number | null;
          total_duration_minutes: number | null;
          current_streak: number | null;
          prs_count: number | null;
          checkin_compliance: number | null;
          nutrition_compliance: number | null;
          insights: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          week_start: string;
          week_end: string;
          season_id?: string | null;
          phase_id?: string | null;
          sessions_planned?: number | null;
          sessions_completed?: number | null;
          total_volume_kg?: number | null;
          total_duration_minutes?: number | null;
          current_streak?: number | null;
          prs_count?: number | null;
          checkin_compliance?: number | null;
          nutrition_compliance?: number | null;
          insights?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          week_start?: string;
          week_end?: string;
          season_id?: string | null;
          phase_id?: string | null;
          sessions_planned?: number | null;
          sessions_completed?: number | null;
          total_volume_kg?: number | null;
          total_duration_minutes?: number | null;
          current_streak?: number | null;
          prs_count?: number | null;
          checkin_compliance?: number | null;
          nutrition_compliance?: number | null;
          insights?: Json | null;
        };
      };
      widget_events: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          event_type: string;
          widget_id: string;
          widget_type: string;
          agent_id: string | null;
          session_id: string | null;
          properties: Json | null;
          time_visible_seconds: number | null;
          client_version: string | null;
          platform: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          event_type: string;
          widget_id: string;
          widget_type: string;
          agent_id?: string | null;
          session_id?: string | null;
          properties?: Json | null;
          time_visible_seconds?: number | null;
          client_version?: string | null;
          platform?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          event_type?: string;
          widget_id?: string;
          widget_type?: string;
          agent_id?: string | null;
          session_id?: string | null;
          properties?: Json | null;
          time_visible_seconds?: number | null;
          client_version?: string | null;
          platform?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row'];
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type SetLog = Database['public']['Tables']['set_logs']['Row'];
export type PainReport = Database['public']['Tables']['pain_reports']['Row'];
export type HydrationLog = Database['public']['Tables']['hydration_logs']['Row'];
export type CycleLog = Database['public']['Tables']['cycle_logs']['Row'];
export type TrainingSeason = Database['public']['Tables']['training_seasons']['Row'];
export type TrainingPhase = Database['public']['Tables']['training_phases']['Row'];
export type WeeklySummary = Database['public']['Tables']['weekly_summaries']['Row'];
export type WidgetEvent = Database['public']['Tables']['widget_events']['Row'];

// Insert types
export type DailyCheckinInsert = Database['public']['Tables']['daily_checkins']['Insert'];
export type SetLogInsert = Database['public']['Tables']['set_logs']['Insert'];
export type PainReportInsert = Database['public']['Tables']['pain_reports']['Insert'];
export type HydrationLogInsert = Database['public']['Tables']['hydration_logs']['Insert'];
export type WidgetEventInsert = Database['public']['Tables']['widget_events']['Insert'];
