import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, SectionCard } from '../../src/components/shared';
import { MacroDashboard, MealLogSection, ScanFoodCard } from '../../src/components/fuel';
import { TAB_BAR_HEIGHT } from '../../src/components/navigation';
import { MOCK_MACROS, MOCK_MEALS } from '../../src/data/mockData';

export default function FuelScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
      <ScreenHeader title="Fuel" subtitle="Centro de Nutricion" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
      >
        {/* Macro Dashboard */}
        <SectionCard title="Macros de Hoy" delay={100}>
          <MacroDashboard data={MOCK_MACROS} />
        </SectionCard>

        {/* Meal Log */}
        <SectionCard title="Registro de Comidas" delay={200}>
          <MealLogSection meals={MOCK_MEALS} />
        </SectionCard>

        {/* Scan Food */}
        <SectionCard title="Vision" delay={300}>
          <ScanFoodCard />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
