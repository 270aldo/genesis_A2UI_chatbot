import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, SectionCard } from '../../src/components/shared';
import { WorkoutSessionView, WeeklyCalendar, ScanMachineCard } from '../../src/components/train';
import { TAB_BAR_HEIGHT } from '../../src/components/navigation';
import { useWorkoutStore } from '../../src/stores';
import { MOCK_WORKOUT, MOCK_WEEK_PLAN } from '../../src/data/mockData';

export default function TrainScreen() {
  const insets = useSafeAreaInsets();
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const fetchActiveSession = useWorkoutStore((s) => s.fetchActiveSession);

  useEffect(() => {
    fetchActiveSession('mobile-user');
  }, []);

  // Use active session data when available, otherwise fallback to mock
  const workout = useMemo(() => {
    if (activeSession && activeSession.status === 'active') {
      const exercises = (activeSession.exercises ?? []).map((ex: Record<string, any>) => ({
        name: ex.name ?? ex.exercise ?? '',
        sets: ex.sets ?? 3,
        reps: String(ex.reps ?? '8-12'),
        weight: ex.weight ?? ex.load ?? '',
        rest: ex.rest ?? '120s',
      }));
      return {
        title: activeSession.title,
        subtitle: activeSession.sessionType === 'strength' ? 'Fuerza' : activeSession.sessionType,
        duration: '--',
        exercises,
      };
    }
    return MOCK_WORKOUT;
  }, [activeSession]);

  const headerSubtitle = activeSession?.status === 'active'
    ? 'Sesion Activa'
    : 'Centro de Entrenamiento';

  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
      <ScreenHeader title="Train" subtitle={headerSubtitle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
      >
        {/* Workout Session */}
        <SectionCard title="Sesion de Hoy" delay={100}>
          <WorkoutSessionView
            title={workout.title}
            subtitle={workout.subtitle}
            duration={workout.duration}
            exercises={workout.exercises}
          />
        </SectionCard>

        {/* Weekly Calendar */}
        <SectionCard title="Semana" delay={200}>
          <WeeklyCalendar days={MOCK_WEEK_PLAN} />
        </SectionCard>

        {/* Scan Machine */}
        <SectionCard title="Vision" delay={300}>
          <ScanMachineCard />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
