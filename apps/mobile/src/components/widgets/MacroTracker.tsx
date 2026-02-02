import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GlassCard } from '../ui';
import { COLORS } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroData {
  current: number;
  target: number;
}

interface MacroTrackerData {
  calories: MacroData;
  protein: MacroData;
  carbs: MacroData;
  fat: MacroData;
}

const MACRO_CONFIG = [
  { key: 'calories', label: 'Calorias', unit: 'kcal', color: COLORS.nutrition },
  { key: 'protein', label: 'Proteina', unit: 'g', color: '#3B82F6' },
  { key: 'carbs', label: 'Carbos', unit: 'g', color: '#F59E0B' },
  { key: 'fat', label: 'Grasa', unit: 'g', color: '#EF4444' },
] as const;

export const MacroTracker: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as MacroTrackerData;

  return (
    <GlassCard accentColor={COLORS.nutrition}>
      <Text className="text-sm font-bold text-white mb-4">Macros del Dia</Text>
      <View className="flex-row justify-between">
        {MACRO_CONFIG.map((cfg) => {
          const macro = data[cfg.key as keyof MacroTrackerData];
          if (!macro) return null;
          return (
            <CircularProgress
              key={cfg.key}
              current={macro.current}
              target={macro.target}
              label={cfg.label}
              unit={cfg.unit}
              color={cfg.color}
            />
          );
        })}
      </View>
    </GlassCard>
  );
};

const SIZE = 68;
const STROKE = 5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const CircularProgress: React.FC<{
  current: number;
  target: number;
  label: string;
  unit: string;
  color: string;
}> = ({ current, target, label, unit, color }) => {
  const progress = Math.min(current / Math.max(target, 1), 1);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - animatedProgress.value),
  }));

  return (
    <View className="items-center">
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background circle */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress circle */}
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        {/* Center text */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-xs font-bold text-white">{current}</Text>
          <Text className="text-[8px] text-white/30">/ {target}</Text>
        </View>
      </View>
      <Text className="text-[10px] text-white/50 mt-1">{label}</Text>
    </View>
  );
};
