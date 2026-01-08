/**
 * useCheckin Hook
 *
 * Manages daily check-in state and persistence with Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUserId, DailyCheckin, DailyCheckinInsert } from '../services/supabase';

interface CheckinState {
  checkin: DailyCheckin | null;
  loading: boolean;
  error: string | null;
}

interface CheckinData {
  sleep_quality?: number;
  energy_level?: number;
  stress_level?: number;
  sleep_hours?: number;
  pain_zones?: string[];
  notes?: string;
}

export function useCheckin() {
  const [state, setState] = useState<CheckinState>({
    checkin: null,
    loading: true,
    error: null,
  });

  const userId = getCurrentUserId();
  const today = new Date().toISOString().split('T')[0];

  // Fetch today's check-in on mount
  useEffect(() => {
    const fetchCheckin = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_checkins')
          .select('*')
          .eq('user_id', userId)
          .eq('checkin_date', today)
          .maybeSingle();

        if (error) throw error;

        setState({ checkin: data, loading: false, error: null });
      } catch (err) {
        setState({
          checkin: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch check-in',
        });
      }
    };

    fetchCheckin();
  }, [userId, today]);

  // Save or update check-in
  const saveCheckin = useCallback(
    async (data: CheckinData): Promise<DailyCheckin | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const checkinData: DailyCheckinInsert = {
          user_id: userId,
          checkin_date: today,
          ...data,
        };

        const { data: result, error } = await supabase
          .from('daily_checkins')
          .upsert(checkinData, { onConflict: 'user_id,checkin_date' })
          .select()
          .single();

        if (error) throw error;

        setState({ checkin: result, loading: false, error: null });
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to save check-in';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
        return null;
      }
    },
    [userId, today]
  );

  // Check if user has completed check-in today
  const hasCheckedInToday = Boolean(state.checkin);

  return {
    checkin: state.checkin,
    loading: state.loading,
    error: state.error,
    hasCheckedInToday,
    saveCheckin,
  };
}
