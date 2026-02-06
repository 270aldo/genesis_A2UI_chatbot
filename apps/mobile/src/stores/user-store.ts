import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { API_BASE } from '../services/config';

interface TodayStats {
  workoutsCompleted: number;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  trainingMinutes: number;
  streakDays: number;
  prsToday: number;
}

interface UserState {
  userId: string;
  todayStats: TodayStats;
  isLoading: boolean;

  fetchTodayStats: (userId?: string) => Promise<void>;
  setUserId: (id: string) => void;
}

const DEFAULT_STATS: TodayStats = {
  workoutsCompleted: 0,
  totalVolumeKg: 0,
  totalSets: 0,
  totalReps: 0,
  trainingMinutes: 0,
  streakDays: 0,
  prsToday: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: 'mobile-user',
      todayStats: DEFAULT_STATS,
      isLoading: false,

      fetchTodayStats: async (userId) => {
        const uid = userId ?? get().userId;
        set({ isLoading: true });
        try {
          const res = await fetch(
            `${API_BASE}/api/v1/stats/today?user_id=${uid}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          set({
            todayStats: {
              workoutsCompleted: data.workouts_completed ?? 0,
              totalVolumeKg: data.total_volume_kg ?? 0,
              totalSets: data.total_sets ?? 0,
              totalReps: data.total_reps ?? 0,
              trainingMinutes: data.training_minutes ?? 0,
              streakDays: data.streak_days ?? 0,
              prsToday: data.prs_today ?? 0,
            },
          });
        } catch (e) {
          console.error('[user-store] fetchTodayStats failed:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      setUserId: (id) => {
        set({ userId: id });
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
