import React, { useState } from 'react';
import { ScreenHeader } from '../components/shared/ScreenHeader';
import { SeasonProgress } from '../components/track/SeasonProgress';
import { MetricGrid } from '../components/track/MetricGrid';
import { TrendChart } from '../components/track/TrendChart';
import { AchievementList } from '../components/track/AchievementList';

// --- Mock Data ---

const MOCK_SEASON = {
  seasonName: 'Temporada Fuerza I',
  currentWeek: 4,
  totalWeeks: 12,
  phase: 'Hipertrofia',
  startDate: '6 Ene 2026',
};

type MetricKey = 'fuerza' | 'peso' | 'adherencia' | 'sueno';

const MOCK_TREND_DATA: Record<MetricKey, { label: string; value: number }[]> = {
  fuerza: [
    { label: 'S1', value: 70 },
    { label: 'S2', value: 73 },
    { label: 'S3', value: 72 },
    { label: 'S4', value: 78 },
    { label: 'S5', value: 80 },
    { label: 'S6', value: 82 },
  ],
  peso: [
    { label: 'S1', value: 82 },
    { label: 'S2', value: 81.5 },
    { label: 'S3', value: 81.2 },
    { label: 'S4', value: 80.8 },
    { label: 'S5', value: 80.5 },
    { label: 'S6', value: 80.1 },
  ],
  adherencia: [
    { label: 'S1', value: 65 },
    { label: 'S2', value: 70 },
    { label: 'S3', value: 75 },
    { label: 'S4', value: 82 },
    { label: 'S5', value: 85 },
    { label: 'S6', value: 88 },
  ],
  sueno: [
    { label: 'S1', value: 6.5 },
    { label: 'S2', value: 6.8 },
    { label: 'S3', value: 7.0 },
    { label: 'S4', value: 7.2 },
    { label: 'S5', value: 6.9 },
    { label: 'S6', value: 7.4 },
  ],
};

const MOCK_ACHIEVEMENTS = [
  {
    id: '1',
    title: 'PR Press Banca',
    description: 'Nuevo record: 85kg x 6 reps',
    date: '28 Ene',
    type: 'pr' as const,
    value: '85kg',
  },
  {
    id: '2',
    title: 'Racha de 7 dias',
    description: 'Completaste 7 dias consecutivos de entrenamiento',
    date: '25 Ene',
    type: 'badge' as const,
  },
  {
    id: '3',
    title: 'Mes Completo',
    description: 'Primer mes de temporada completado',
    date: '6 Feb',
    type: 'milestone' as const,
  },
];

// --- Screen Component ---

const TrackScreen: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('fuerza');

  return (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <ScreenHeader
        title="Track"
        subtitle="Centro de Metricas"
        accentColor="#3B82F6"
      />

      <div className="px-5 space-y-4 pb-6">
        <SeasonProgress
          seasonName={MOCK_SEASON.seasonName}
          currentWeek={MOCK_SEASON.currentWeek}
          totalWeeks={MOCK_SEASON.totalWeeks}
          phase={MOCK_SEASON.phase}
          startDate={MOCK_SEASON.startDate}
        />

        <MetricGrid />

        <TrendChart
          data={MOCK_TREND_DATA[activeMetric]}
          color="#3B82F6"
          activeMetric={activeMetric}
          onMetricChange={setActiveMetric}
        />

        <AchievementList achievements={MOCK_ACHIEVEMENTS} />
      </div>
    </div>
  );
};

export default TrackScreen;
