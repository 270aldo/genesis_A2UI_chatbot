import React, { useEffect } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { COLORS } from '@genesis/shared';
import { ScreenHeader, SectionCard, QuickActionBar, ProgressRing } from '../../src/components/shared';
import { GlassCard, ProgressBar, ActionButton } from '../../src/components/ui';
import { MissionCardRow, StatPill } from '../../src/components/home';
import { TAB_BAR_HEIGHT } from '../../src/components/navigation';
import {
  MOCK_USER,
  MOCK_MISSIONS,
  MOCK_WEEKLY,
  MOCK_STREAK,
  MOCK_GENESIS_MESSAGE,
  MOCK_QUICK_ACTIONS,
} from '../../src/data/mockData';

const ACTION_TAB_MAP: Record<string, string> = {
  checkin: '/mind',
  scan: '/fuel',
  train: '/train',
  learn: '/chat',
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flamePulse = useSharedValue(1);

  useEffect(() => {
    flamePulse.value = withRepeat(
      withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flamePulse.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top']}>
      <ScreenHeader
        title={`Buenos dias, ${MOCK_USER.name}`}
        subtitle={`Dia ${MOCK_USER.day} . ${MOCK_USER.phase} . Semana ${MOCK_USER.week}`}
        rightActions
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }}
      >
        {/* Mision del Dia */}
        <SectionCard title="Mision del Dia" delay={100}>
          <MissionCardRow
            missions={MOCK_MISSIONS}
            onPress={(m) => {
              const tab = m.icon === 'dumbbell' ? '/train' : m.icon === 'utensils' ? '/fuel' : '/mind';
              router.push(tab as any);
            }}
          />
        </SectionCard>

        {/* Progreso Semanal */}
        <SectionCard title="Progreso Semanal" delay={200}>
          <View className="flex-row items-center gap-4 mb-3">
            <ProgressRing size={64} progress={MOCK_WEEKLY.progress} color={COLORS.genesis} strokeWidth={6}>
              <Text className="text-sm font-black text-white">{MOCK_WEEKLY.progress}%</Text>
            </ProgressRing>
            <View className="flex-1">
              <ProgressBar
                progress={MOCK_WEEKLY.progress}
                color={COLORS.genesis}
                label="Semana"
                showPercentage
              />
            </View>
          </View>
          <View className="flex-row gap-2">
            <StatPill value={MOCK_WEEKLY.workouts} label="Entrenos" />
            <StatPill value={MOCK_WEEKLY.nutrition} label="Nutricion" />
            <StatPill value={MOCK_WEEKLY.sleep} label="Sueno" />
          </View>
        </SectionCard>

        {/* GENESIS Message */}
        <Animated.View entering={FadeInDown.duration(400).delay(300).springify()} className="mx-5 mb-4">
          <GlassCard animated={false}>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.genesis }} />
              <Text className="text-xs font-bold text-white/55 uppercase tracking-widest">
                GENESIS
              </Text>
            </View>
            <Text className="text-sm text-white/70 leading-5">
              {MOCK_GENESIS_MESSAGE}
            </Text>
            <View className="mt-3">
              <ActionButton label="Responder" variant="secondary" onPress={() => router.push('/chat')} compact />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Active Streak */}
        <SectionCard delay={400}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Animated.View
                style={flameStyle}
                className="w-10 h-10 rounded-full items-center justify-center bg-orange-500/15"
              >
                <Flame size={20} color="#F97316" fill="#F97316" />
              </Animated.View>
              <View>
                <Text className="text-lg font-black text-white">{MOCK_STREAK.days} dias</Text>
                <Text className="text-xs text-white/50">Racha activa</Text>
              </View>
            </View>
            <Text className="text-xs text-white/45">Record: {MOCK_STREAK.record} dias</Text>
          </View>
        </SectionCard>

        {/* Quick Actions */}
        <View className="mt-1">
          <Text className="text-xs font-bold text-white/50 uppercase tracking-widest px-5 mb-2">
            Acciones Rapidas
          </Text>
          <QuickActionBar
            actions={MOCK_QUICK_ACTIONS}
            onPress={(a) => {
              const target = ACTION_TAB_MAP[a.id];
              if (target) router.push(target as any);
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
