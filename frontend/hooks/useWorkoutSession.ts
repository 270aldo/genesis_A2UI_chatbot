/**
 * useWorkoutSession Hook
 *
 * Manages workout session state and set logging with Supabase.
 */

import { useState, useCallback } from 'react';
import {
  supabase,
  getCurrentUserId,
  WorkoutSession,
  SetLog,
} from '../services/supabase';
import type { Database } from '../services/supabase/types';

type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert'];
type SetLogInsert = Database['public']['Tables']['set_logs']['Insert'];
type WorkoutSessionUpdate = Database['public']['Tables']['workout_sessions']['Update'];

interface SessionState {
  session: WorkoutSession | null;
  sets: SetLog[];
  loading: boolean;
  error: string | null;
}

interface SetData {
  exercise_name: string;
  set_number: number;
  weight_kg?: number;
  reps?: number;
  rpe?: number;
  is_warmup?: boolean;
  is_pr?: boolean;
  rest_seconds?: number;
}

interface SessionSummary {
  total_volume_kg: number;
  total_duration_minutes: number;
  exercises_completed: number;
  rating?: number;
  notes?: string;
}

export function useWorkoutSession() {
  const [state, setState] = useState<SessionState>({
    session: null,
    sets: [],
    loading: false,
    error: null,
  });

  const userId = getCurrentUserId();

  // Start a new workout session
  const startSession = useCallback(
    async (title: string, sessionType: string = 'strength'): Promise<WorkoutSession | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const insertData: WorkoutSessionInsert = {
          user_id: userId,
          started_at: new Date().toISOString(),
          status: 'active',
          title,
          session_type: sessionType,
        };

        // Type assertion needed when Supabase env vars are empty (dev mode)
        const { data, error } = await (supabase
          .from('workout_sessions') as any)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        setState({ session: data, sets: [], loading: false, error: null });
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to start session';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
        return null;
      }
    },
    [userId]
  );

  // Log a set
  const logSet = useCallback(
    async (data: SetData): Promise<SetLog | null> => {
      if (!state.session) {
        setState((prev) => ({ ...prev, error: 'No active session' }));
        return null;
      }

      try {
        const insertData: SetLogInsert = {
          user_id: userId,
          session_id: state.session.id,
          exercise_name: data.exercise_name,
          set_number: data.set_number,
          weight_kg: data.weight_kg,
          reps: data.reps,
          rpe: data.rpe,
          is_warmup: data.is_warmup,
          is_pr: data.is_pr,
          rest_seconds: data.rest_seconds,
        };

        // Type assertion needed when Supabase env vars are empty (dev mode)
        const { data: result, error } = await (supabase
          .from('set_logs') as any)
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;

        setState((prev) => ({
          ...prev,
          sets: [...prev.sets, result],
        }));

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to log set';
        setState((prev) => ({ ...prev, error: errorMsg }));
        return null;
      }
    },
    [userId, state.session]
  );

  // Complete the workout session
  const completeSession = useCallback(
    async (summary: SessionSummary): Promise<WorkoutSession | null> => {
      if (!state.session) {
        setState((prev) => ({ ...prev, error: 'No active session' }));
        return null;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const updateData: WorkoutSessionUpdate = {
          completed_at: new Date().toISOString(),
          status: 'completed',
          total_volume_kg: summary.total_volume_kg,
          total_duration_minutes: summary.total_duration_minutes,
          exercises_completed: summary.exercises_completed,
          rating: summary.rating,
          notes: summary.notes,
        };

        // Type assertion needed when Supabase env vars are empty (dev mode)
        const { data, error } = await (supabase
          .from('workout_sessions') as any)
          .update(updateData)
          .eq('id', state.session.id)
          .select()
          .single();

        if (error) throw error;

        setState({ session: data, sets: state.sets, loading: false, error: null });
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to complete session';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
        return null;
      }
    },
    [state.session, state.sets]
  );

  // Cancel the workout session
  const cancelSession = useCallback(async (): Promise<boolean> => {
    if (!state.session) return false;

    try {
      const updateData: WorkoutSessionUpdate = { status: 'cancelled' };

      // Type assertion needed when Supabase env vars are empty (dev mode)
      const { error } = await (supabase
        .from('workout_sessions') as any)
        .update(updateData)
        .eq('id', state.session.id);

      if (error) throw error;

      setState({ session: null, sets: [], loading: false, error: null });
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel session';
      setState((prev) => ({ ...prev, error: errorMsg }));
      return false;
    }
  }, [state.session]);

  // Calculate current volume
  const currentVolume = state.sets.reduce((total, set) => {
    if (set.weight_kg && set.reps && !set.is_warmup) {
      return total + set.weight_kg * set.reps;
    }
    return total;
  }, 0);

  // Check if there's an active session
  const isActive = state.session?.status === 'active';

  return {
    session: state.session,
    sets: state.sets,
    loading: state.loading,
    error: state.error,
    isActive,
    currentVolume,
    startSession,
    logSet,
    completeSession,
    cancelSession,
  };
}
