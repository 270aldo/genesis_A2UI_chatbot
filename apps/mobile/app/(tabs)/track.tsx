import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, SectionCard } from '../../src/components/shared';
import { SeasonProgress, MetricGrid, TrendChart, AchievementList } from '../../src/components/track';
import { TAB_BAR_HEIGHT } from '../../src/components/navigation';
import { MOCK_SEASON, MOCK_TREND_DATA, MOCK_ACHIEVEMENTS } from '../../src/data/mockData';

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
      <ScreenHeader title="Track" subtitle="Centro de Metricas" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
      >
        {/* Season Progress */}
        <SectionCard title="Temporada Actual" delay={100}>
          <SeasonProgress
            name={MOCK_SEASON.name}
            phase={MOCK_SEASON.phase}
            week={MOCK_SEASON.week}
            totalWeeks={MOCK_SEASON.totalWeeks}
          />
        </SectionCard>

        {/* Metric Grid */}
        <SectionCard title="Metricas Clave" delay={200}>
          <MetricGrid />
        </SectionCard>

        {/* Trend Chart */}
        <SectionCard title="Tendencias" delay={300}>
          <TrendChart data={MOCK_TREND_DATA} />
        </SectionCard>

        {/* Achievements */}
        <SectionCard title="Logros Recientes" delay={400}>
          <AchievementList achievements={MOCK_ACHIEVEMENTS} />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
