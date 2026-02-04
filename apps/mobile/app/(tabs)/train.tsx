import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, SectionCard } from '../../src/components/shared';
import { WorkoutSessionView, WeeklyCalendar, ScanMachineCard } from '../../src/components/train';
import { TAB_BAR_HEIGHT } from '../../src/components/navigation';
import { MOCK_WORKOUT, MOCK_WEEK_PLAN } from '../../src/data/mockData';

export default function TrainScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
      <ScreenHeader title="Train" subtitle="Centro de Entrenamiento" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 80 }}
      >
        {/* Workout Session */}
        <SectionCard title="Sesion de Hoy" delay={100}>
          <WorkoutSessionView
            title={MOCK_WORKOUT.title}
            subtitle={MOCK_WORKOUT.subtitle}
            duration={MOCK_WORKOUT.duration}
            exercises={MOCK_WORKOUT.exercises}
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
