/**
 * NGX GENESIS A2UI - Supabase Client
 *
 * Cliente Supabase para persistencia de datos.
 * Se usa para:
 * - Widget events (telemetría)
 * - User profiles
 * - Workout sessions
 * - Check-ins
 * - Nutrition logs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
const isConfigured = supabaseUrl && supabaseAnonKey;

if (!isConfigured && import.meta.env.DEV) {
  console.warn(
    '[Supabase] No configurado. Agregar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a .env.local'
  );
}

// ============================================
// CLIENT INSTANCE
// ============================================

/**
 * Supabase client instance
 * Returns null if not configured
 */
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// ============================================
// DATABASE TYPES
// ============================================

/**
 * Database schema types
 * Match Supabase table structures from schema.sql
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          sleep_hours: number | null;
          sleep_quality: number | null;
          energy_level: number | null;
          stress_level: number | null;
          soreness_level: number | null;
          motivation: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_checkins']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['daily_checkins']['Insert']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string | null;
          started_at: string;
          completed_at: string | null;
          status: 'active' | 'paused' | 'completed' | 'abandoned';
          total_duration_secs: number | null;
          total_volume: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      set_logs: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight: number | null;
          reps: number | null;
          rpe: number | null;
          rest_secs: number | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: Omit<Database['public']['Tables']['set_logs']['Row'], 'id' | 'logged_at'>;
        Update: Partial<Database['public']['Tables']['set_logs']['Insert']>;
      };
      nutrition_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';
          description: string | null;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nutrition_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['nutrition_logs']['Insert']>;
      };
      hydration_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          amount_ml: number;
          logged_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hydration_logs']['Row'], 'id' | 'logged_at'>;
        Update: Partial<Database['public']['Tables']['hydration_logs']['Insert']>;
      };
      widget_events: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          event_type: string;
          category: string;
          widget_id: string | null;
          agent_id: string | null;
          session_id: string | null;
          properties: Record<string, unknown> | null;
          timestamp: string;
          client_timestamp: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['widget_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['widget_events']['Insert']>;
      };
      pain_reports: {
        Row: {
          id: string;
          user_id: string;
          reported_at: string;
          body_zone: string;
          pain_level: number;
          pain_type: string | null;
          notes: string | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pain_reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pain_reports']['Insert']>;
      };
    };
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseConfigured(): boolean {
  return isConfigured && supabase !== null;
}

/**
 * Get Supabase client or throw if not configured
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Agregar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a .env.local'
    );
  }
  return supabase;
}

// ============================================
// TYPED TABLE ACCESS
// ============================================

type TableName = keyof Database['public']['Tables'];

/**
 * Get typed access to a table
 */
export function table<T extends TableName>(tableName: T) {
  const client = getSupabaseClient();
  return client.from(tableName);
}

// ============================================
// COMMON QUERIES
// ============================================

/**
 * Insert widget events batch
 */
export async function insertWidgetEvents(
  events: Database['public']['Tables']['widget_events']['Insert'][]
): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase not configured') };
  }

  const { error } = await supabase.from('widget_events').insert(events);

  return { error: error ? new Error(error.message) : null };
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  return supabase.from('profiles').select('*').eq('id', userId).single();
}

/**
 * Get today's check-in
 */
export async function getTodayCheckin(userId: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const today = new Date().toISOString().split('T')[0];

  return supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .single();
}

/**
 * Get active workout session
 */
export async function getActiveSession(userId: string) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  return supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
}

/**
 * Get recent pain reports
 */
export async function getRecentPainReports(userId: string, days: number = 7) {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  return supabase
    .from('pain_reports')
    .select('*')
    .eq('user_id', userId)
    .is('resolved_at', null)
    .gte('reported_at', since.toISOString())
    .order('reported_at', { ascending: false });
}
