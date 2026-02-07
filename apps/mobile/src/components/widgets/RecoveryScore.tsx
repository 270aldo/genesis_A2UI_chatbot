import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gauge } from 'lucide-react-native';
import { GlassCard } from '../ui';
import { COLORS } from '../../theme';
import { FONTS } from '../../theme/fonts';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STATUS_COLORS: Record<string, string> = {
  excellent: '#00FF88',
  optimal: '#00FF88',
  good: '#22C55E',
  moderate: '#FFB800',
  low: '#FF4444',
};

const FACTOR_STATUS_COLORS: Record<string, string> = {
  good: '#00FF88',
  below_baseline: '#FFB800',
  above_baseline: '#FFB800',
  warning: '#FFB800',
  elevated: '#FF4444',
  alert: '#FF4444',
  low: '#0EA5E9',
};

const INTENSITY_LABELS: Record<string, string> = {
  high: 'Alta intensidad OK',
  medium: 'Intensidad moderada',
  low: 'Baja intensidad',
  rest: 'Dia de descanso',
};

interface Factor {
  name: string;
  value: number;
  unit?: string;
  status: string;
}

interface RecoveryScoreData {
  score: number;
  status: string;
  factors: Factor[];
  recommendation?: string;
  suggestedIntensity?: string;
}

export const RecoveryScore: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as RecoveryScoreData;
  const statusColor = STATUS_COLORS[data.status] ?? COLORS.recovery;

  return (
    <GlassCard accentColor={COLORS.recovery}>
      {/* Header with score ring */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="font-bold text-white text-base" style={{ fontFamily: FONTS.monoBold }}>Score de Recuperación</Text>
          <Text className="text-xs text-white/50 capitalize">{data.status}</Text>
        </View>
        <ScoreRing score={data.score} color={statusColor} />
      </View>

      {/* Factors */}
      <View className="mb-4">
        {data.factors?.map((factor, i) => (
          <View
            key={i}
            className="flex-row items-center justify-between bg-white/5 p-2.5 rounded-xl mb-1.5"
          >
            <Text className="text-xs text-white/70">{factor.name}</Text>
            <Text
              className="text-xs font-bold"
              style={{ color: FACTOR_STATUS_COLORS[factor.status] ?? COLORS.recovery }}
            >
              {factor.value}
              {factor.unit ? ` ${factor.unit}` : ''}
            </Text>
          </View>
        ))}
      </View>

      {/* Recommendation */}
      {(data.recommendation || data.suggestedIntensity) && (
        <View
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${statusColor}15` }}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Gauge size={14} color={statusColor} />
            <Text className="text-[10px] font-bold text-white/50 uppercase">
              Recomendacion
            </Text>
          </View>
          {data.suggestedIntensity && (
            <Text className="text-sm font-bold" style={{ color: statusColor }}>
              {INTENSITY_LABELS[data.suggestedIntensity] ?? data.suggestedIntensity}
            </Text>
          )}
          {data.recommendation && (
            <Text className="text-xs text-white/60 mt-1">
              {data.recommendation}
            </Text>
          )}
        </View>
      )}
    </GlassCard>
  );
};

const RING_SIZE = 72;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ScoreRing: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const progress = Math.min(score / 100, 1);
  const animValue = useSharedValue(0);

  useEffect(() => {
    animValue.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - animValue.value),
  }));

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={RING_CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-xl font-bold text-white" style={{ fontFamily: FONTS.monoBold }}>{score}</Text>
      </View>
    </View>
  );
};
