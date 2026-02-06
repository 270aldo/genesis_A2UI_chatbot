import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { API_BASE } from '../services/config';

interface SetLog {
  id?: string;
  exerciseName: string;
  setNumber: number;
  exerciseOrder: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  isPr: boolean;
  prType?: string | null;
}

interface ActiveSession {
  id: string;
  title: string;
  sessionType: string;
  startedAt: string;
  exercises: Record<string, unknown>[];
  status: string;
}

interface WorkoutState {
  activeSession: ActiveSession | null;
  sets: SetLog[];
  totalVolume: number;
  isLoading: boolean;

  startWorkout: (data: {
    userId?: string;
    title: string;
    sessionType?: string;
    exercises: Record<string, unknown>[];
  }) => Promise<ActiveSession | null>;

  logSet: (data: {
    userId?: string;
    exerciseName: string;
    setNumber: number;
    exerciseOrder?: number;
    weightKg: number;
    reps: number;
    rpe?: number;
    isWarmup?: boolean;
  }) => Promise<SetLog | null>;

  completeWorkout: (data: {
    durationMins: number;
    rating?: number;
    notes?: string;
  }) => Promise<void>;

  fetchActiveSession: (userId?: string) => Promise<void>;
  clearSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      sets: [],
      totalVolume: 0,
      isLoading: false,

      startWorkout: async (data) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/api/v1/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: data.userId ?? 'mobile-user',
              title: data.title,
              session_type: data.sessionType ?? 'strength',
              exercises: data.exercises,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const session = await res.json();

          const active: ActiveSession = {
            id: session.id,
            title: session.title,
            sessionType: session.session_type,
            startedAt: session.started_at,
            exercises: session.exercises ?? data.exercises,
            status: 'active',
          };

          set({ activeSession: active, sets: [], totalVolume: 0 });
          return active;
        } catch (e) {
          console.error('[workout-store] startWorkout failed:', e);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      logSet: async (data) => {
        const session = get().activeSession;
        if (!session) return null;

        try {
          const res = await fetch(`${API_BASE}/api/v1/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: data.userId ?? 'mobile-user',
              session_id: session.id,
              exercise_name: data.exerciseName,
              set_number: data.setNumber,
              exercise_order: data.exerciseOrder ?? 0,
              weight_kg: data.weightKg,
              reps: data.reps,
              rpe: data.rpe,
              is_warmup: data.isWarmup ?? false,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const result = await res.json();

          const newSet: SetLog = {
            id: result.set_id,
            exerciseName: data.exerciseName,
            setNumber: data.setNumber,
            exerciseOrder: data.exerciseOrder ?? 0,
            weightKg: data.weightKg,
            reps: data.reps,
            rpe: data.rpe,
            isWarmup: data.isWarmup ?? false,
            isPr: result.is_pr,
            prType: result.pr_type,
          };

          set((s) => ({
            sets: [...s.sets, newSet],
            totalVolume: result.total_session_volume,
          }));

          return newSet;
        } catch (e) {
          console.error('[workout-store] logSet failed:', e);
          return null;
        }
      },

      completeWorkout: async (data) => {
        const session = get().activeSession;
        if (!session) return;

        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/api/v1/sessions/${session.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'completed',
              total_volume_kg: get().totalVolume,
              duration_mins: data.durationMins,
              total_duration_minutes: data.durationMins,
              exercises_completed: get().sets.filter((s) => !s.isWarmup).length,
              rating: data.rating,
              notes: data.notes,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          set((s) => ({
            activeSession: s.activeSession
              ? { ...s.activeSession, status: 'completed' }
              : null,
          }));
        } catch (e) {
          console.error('[workout-store] completeWorkout failed:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchActiveSession: async (userId) => {
        try {
          const uid = userId ?? 'mobile-user';
          const res = await fetch(
            `${API_BASE}/api/v1/sessions/active?user_id=${uid}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (data.session) {
            set({
              activeSession: {
                id: data.session.id,
                title: data.session.title,
                sessionType: data.session.session_type,
                startedAt: data.session.started_at,
                exercises: data.session.exercises ?? [],
                status: data.session.status,
              },
              sets: (data.sets ?? []).map((s: Record<string, unknown>) => ({
                id: s.id as string,
                exerciseName: s.exercise_name as string,
                setNumber: s.set_number as number,
                exerciseOrder: (s.exercise_order as number) ?? 0,
                weightKg: s.weight_kg as number,
                reps: s.reps as number,
                rpe: s.rpe as number | undefined,
                isWarmup: (s.is_warmup as boolean) ?? false,
                isPr: (s.is_pr as boolean) ?? false,
              })),
            });
          } else {
            set({ activeSession: null, sets: [], totalVolume: 0 });
          }
        } catch (e) {
          console.error('[workout-store] fetchActiveSession failed:', e);
        }
      },

      clearSession: () => {
        set({ activeSession: null, sets: [], totalVolume: 0 });
      },
    }),
    {
      name: 'workout-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
