/**
 * NGX GENESIS A2UI - Supabase React Hooks
 *
 * Hooks para integración con Supabase en componentes React.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  Database,
  getTodayCheckin,
  getActiveSession,
  getRecentPainReports,
} from '../client';

// ============================================
// TYPES
// ============================================

type CheckinRow = Database['public']['Tables']['daily_checkins']['Row'];
type CheckinInsert = Database['public']['Tables']['daily_checkins']['Insert'];
type SessionRow = Database['public']['Tables']['workout_sessions']['Row'];
type SetLogInsert = Database['public']['Tables']['set_logs']['Insert'];
type NutritionInsert = Database['public']['Tables']['nutrition_logs']['Insert'];
type HydrationInsert = Database['public']['Tables']['hydration_logs']['Insert'];
type PainReportRow = Database['public']['Tables']['pain_reports']['Row'];
type PainReportInsert = Database['public']['Tables']['pain_reports']['Insert'];

interface UseSupabaseResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// ============================================
// BASE HOOK
// ============================================

/**
 * Check if Supabase is available
 */
export function useSupabaseStatus() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(isSupabaseConfigured());
  }, []);

  return { isReady, supabase };
}

// ============================================
// CHECK-IN HOOKS
// ============================================

/**
 * Hook to get today's check-in
 */
export function useTodayCheckin(userId: string): UseSupabaseResult<CheckinRow> {
  const [data, setData] = useState<CheckinRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getTodayCheckin(userId);

    if (result.error && ('code' in result.error ? result.error.code : '') !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error for us)
      setError(new Error(result.error.message));
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to submit daily check-in
 */
export function useSubmitCheckin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(async (checkin: CheckinInsert): Promise<CheckinRow | null> => {
    if (!supabase) {
      setError(new Error('Supabase not configured'));
      return null;
    }

    setLoading(true);
    setError(null);

    const { data, error: submitError } = await supabase
      .from('daily_checkins')
      .upsert(checkin, {
        onConflict: 'user_id,checkin_date',
      })
      .select()
      .single();

    if (submitError) {
      setError(new Error(submitError.message));
      setLoading(false);
      return null;
    }

    setLoading(false);
    return data;
  }, []);

  return { submit, loading, error };
}

// ============================================
// WORKOUT SESSION HOOKS
// ============================================

/**
 * Hook to get active workout session
 */
export function useActiveSession(userId: string): UseSupabaseResult<SessionRow> {
  const [data, setData] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getActiveSession(userId);

    if (result.error && ('code' in result.error ? result.error.code : '') !== 'PGRST116') {
      setError(new Error(result.error.message));
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to manage workout session
 */
export function useWorkoutSession(userId: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startSession = useCallback(
    async (workoutId?: string): Promise<string | null> => {
      if (!supabase) {
        setError(new Error('Supabase not configured'));
        return null;
      }

      setLoading(true);
      setError(null);

      const { data, error: insertError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: userId,
          workout_id: workoutId || null,
          started_at: new Date().toISOString(),
          status: 'active',
        })
        .select('id')
        .single();

      if (insertError) {
        setError(new Error(insertError.message));
        setLoading(false);
        return null;
      }

      setSessionId(data.id);
      setLoading(false);
      return data.id;
    },
    [userId]
  );

  const pauseSession = useCallback(async () => {
    if (!supabase || !sessionId) return;

    await supabase
      .from('workout_sessions')
      .update({ status: 'paused' })
      .eq('id', sessionId);
  }, [sessionId]);

  const resumeSession = useCallback(async () => {
    if (!supabase || !sessionId) return;

    await supabase
      .from('workout_sessions')
      .update({ status: 'active' })
      .eq('id', sessionId);
  }, [sessionId]);

  const completeSession = useCallback(
    async (totalVolume?: number, notes?: string) => {
      if (!supabase || !sessionId) return;

      const now = new Date().toISOString();

      await supabase
        .from('workout_sessions')
        .update({
          status: 'completed',
          completed_at: now,
          total_volume: totalVolume,
          notes,
        })
        .eq('id', sessionId);

      setSessionId(null);
    },
    [sessionId]
  );

  const abandonSession = useCallback(async () => {
    if (!supabase || !sessionId) return;

    await supabase
      .from('workout_sessions')
      .update({ status: 'abandoned' })
      .eq('id', sessionId);

    setSessionId(null);
  }, [sessionId]);

  const logSet = useCallback(
    async (set: Omit<SetLogInsert, 'session_id'>): Promise<boolean> => {
      if (!supabase || !sessionId) {
        setError(new Error('No active session'));
        return false;
      }

      const { error: insertError } = await supabase.from('set_logs').insert({
        ...set,
        session_id: sessionId,
      });

      if (insertError) {
        setError(new Error(insertError.message));
        return false;
      }

      return true;
    },
    [sessionId]
  );

  return {
    sessionId,
    loading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    logSet,
  };
}

// ============================================
// NUTRITION HOOKS
// ============================================

/**
 * Hook to log nutrition
 */
export function useNutritionLog(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logMeal = useCallback(
    async (meal: Omit<NutritionInsert, 'user_id'>): Promise<boolean> => {
      if (!supabase) {
        setError(new Error('Supabase not configured'));
        return false;
      }

      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase.from('nutrition_logs').insert({
        ...meal,
        user_id: userId,
      });

      if (insertError) {
        setError(new Error(insertError.message));
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    },
    [userId]
  );

  const logHydration = useCallback(
    async (amountMl: number): Promise<boolean> => {
      if (!supabase) {
        setError(new Error('Supabase not configured'));
        return false;
      }

      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      const { error: insertError } = await supabase.from('hydration_logs').insert({
        user_id: userId,
        log_date: today,
        amount_ml: amountMl,
      } as HydrationInsert);

      if (insertError) {
        setError(new Error(insertError.message));
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    },
    [userId]
  );

  return { logMeal, logHydration, loading, error };
}

// ============================================
// PAIN REPORT HOOKS
// ============================================

/**
 * Hook to get recent pain reports
 */
export function usePainReports(userId: string, days: number = 7): UseSupabaseResult<PainReportRow[]> {
  const [data, setData] = useState<PainReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getRecentPainReports(userId, days);

    if (result.error) {
      setError(new Error(result.error.message));
    } else {
      setData(result.data);
    }

    setLoading(false);
  }, [userId, days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook to report pain
 */
export function useReportPain(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const report = useCallback(
    async (pain: Omit<PainReportInsert, 'user_id'>): Promise<boolean> => {
      if (!supabase) {
        setError(new Error('Supabase not configured'));
        return false;
      }

      setLoading(true);
      setError(null);

      const { error: insertError } = await supabase.from('pain_reports').insert({
        ...pain,
        user_id: userId,
      });

      if (insertError) {
        setError(new Error(insertError.message));
        setLoading(false);
        return false;
      }

      setLoading(false);
      return true;
    },
    [userId]
  );

  const resolve = useCallback(
    async (reportId: string): Promise<boolean> => {
      if (!supabase) {
        setError(new Error('Supabase not configured'));
        return false;
      }

      const { error: updateError } = await supabase
        .from('pain_reports')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', reportId)
        .eq('user_id', userId);

      if (updateError) {
        setError(new Error(updateError.message));
        return false;
      }

      return true;
    },
    [userId]
  );

  return { report, resolve, loading, error };
}

// ============================================
// REALTIME SUBSCRIPTION HOOK
// ============================================

/**
 * Hook to subscribe to realtime updates
 */
export function useRealtimeSubscription<T extends keyof Database['public']['Tables']>(
  table: T,
  filter?: { column: string; value: string },
  onInsert?: (payload: Database['public']['Tables'][T]['Row']) => void,
  onUpdate?: (payload: Database['public']['Tables'][T]['Row']) => void,
  onDelete?: (payload: { id: string }) => void
) {
  useEffect(() => {
    if (!supabase) return;

    let channel = supabase.channel(`${table}-changes`);

    if (filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload.new as Database['public']['Tables'][T]['Row']);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload.new as Database['public']['Tables'][T]['Row']);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete({ id: (payload.old as { id: string }).id });
          }
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value, onInsert, onUpdate, onDelete]);
}
