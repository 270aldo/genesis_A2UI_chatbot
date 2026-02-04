import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, SectionCard } from '../../src/components/shared';
import { CheckInForm, SessionGrid, BreathSession } from '../../src/components/mind';
import { StatPill } from '../../src/components/home';
import { TAB_BAR_HEIGHT } from '../../src/components/navigation';
import { MOCK_MENTAL_STATS, MOCK_SESSIONS } from '../../src/data/mockData';

export default function MindScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
      <ScreenHeader title="Mind" subtitle="Centro de Bienestar" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
      >
        {/* Check-in Form */}
        <SectionCard title="Check-in Diario" delay={100}>
          <CheckInForm
            initialMood={MOCK_MENTAL_STATS.mood}
            initialEnergy={MOCK_MENTAL_STATS.energy}
            initialStress={MOCK_MENTAL_STATS.stress}
            initialSleep={MOCK_MENTAL_STATS.sleep}
          />
        </SectionCard>

        {/* Session Grid */}
        <SectionCard title="Sesiones" delay={200}>
          <SessionGrid sessions={MOCK_SESSIONS} />
        </SectionCard>

        {/* Weekly Stats */}
        <SectionCard title="Estadisticas Semana" delay={300}>
          <View className="flex-row gap-2">
            <StatPill value="4.2" label="Animo Prom." />
            <StatPill value="7.1" label="Energia Prom." />
            <StatPill value="3" label="Sesiones" />
            <StatPill value="85%" label="Adherencia" />
          </View>
        </SectionCard>

        {/* Breath Session */}
        <SectionCard title="Respiracion" delay={400}>
          <BreathSession />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
