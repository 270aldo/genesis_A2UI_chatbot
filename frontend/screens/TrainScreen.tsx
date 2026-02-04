import React from 'react';
import { ScreenHeader } from '../components/shared/ScreenHeader';
import { WorkoutSessionView } from '../components/train/WorkoutSessionView';
import { WeeklyCalendar } from '../components/train/WeeklyCalendar';
import { ScanMachineCard } from '../components/train/ScanMachineCard';
import { COLORS } from '../constants';

// --- Mock Data ---

const MOCK_WORKOUT = {
  name: 'Push Day — Pecho y Triceps',
  duration: 55,
  muscleGroups: ['Pecho', 'Triceps', 'Hombros'],
  exercises: [
    { name: 'Press Banca', sets: 4, reps: 8, weight: 80, restSeconds: 120 },
    { name: 'Press Inclinado Mancuernas', sets: 3, reps: 10, weight: 30, restSeconds: 90 },
    { name: 'Aperturas en Polea', sets: 3, reps: 12, weight: 15, restSeconds: 60 },
    { name: 'Fondos en Paralelas', sets: 3, reps: 10, weight: 0, restSeconds: 90 },
    { name: 'Extension Triceps Polea', sets: 3, reps: 12, weight: 25, restSeconds: 60 },
  ],
};

const MOCK_WEEK = [
  { dayLabel: 'L', muscleGroup: 'Push', status: 'done' as const },
  { dayLabel: 'M', muscleGroup: 'Pull', status: 'done' as const },
  { dayLabel: 'X', muscleGroup: 'Pierna', status: 'today' as const },
  { dayLabel: 'J', muscleGroup: 'Push', status: 'upcoming' as const },
  { dayLabel: 'V', muscleGroup: 'Pull', status: 'upcoming' as const },
  { dayLabel: 'S', muscleGroup: 'Pierna', status: 'upcoming' as const },
  { dayLabel: 'D', muscleGroup: '--', status: 'rest' as const },
];

// --- Screen ---

const TrainScreen: React.FC = () => (
  <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
    <ScreenHeader
      title="Train"
      subtitle="Centro de Entrenamiento"
      accentColor={COLORS.training}
    />
    <div className="px-5 space-y-4 pb-6">
      <WorkoutSessionView workout={MOCK_WORKOUT} />
      <WeeklyCalendar days={MOCK_WEEK} />
      <ScanMachineCard />
    </div>
  </div>
);

export default TrainScreen;
