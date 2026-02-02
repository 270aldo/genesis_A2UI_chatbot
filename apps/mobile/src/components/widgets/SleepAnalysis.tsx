import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Moon } from 'lucide-react-native';
import { GlassCard } from '../ui';
import { COLORS } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SleepStages {
  deep: number;
  light: number;
  rem: number;
  awake: number;
}

interface SleepAnalysisData {
  duration: string;
  quality: number | string;
  score?: number;
  stages?: SleepStages | { deep: string; rem: string; light: string };
  insights?: string[];
}

const STAGE_COLORS = {
  deep: '#1E40AF',
  rem: '#7C3AED',
  light: '#0EA5E9',
  awake: '#F59E0B',
};

export const SleepAnalysis: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as SleepAnalysisData;
  const score =
    data.score ?? (typeof data.quality === 'number' ? data.quality : 0);
  const qualityLabel =
    typeof data.quality === 'string' ? data.quality : getQualityLabel(score);

  // Normalize stages to numeric (backend may send strings like "2h 10m")
  const numericStages = normalizeStages(data.stages);

  return (
    <GlassCard accentColor={COLORS.recovery}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <View className="flex-row items-center gap-2">
            <Moon size={16} color={COLORS.recovery} />
            <Text className="font-bold text-white text-base">Sleep</Text>
          </View>
          <Text className="text-xs text-white/50 mt-0.5">
            {data.duration} · {qualityLabel}
          </Text>
        </View>
        <ScoreRing score={score} />
      </View>

      {/* Sleep stages bar */}
      {numericStages && (
        <View className="mb-4">
          <Text className="text-[10px] text-white/40 uppercase font-bold mb-2">
            Etapas del sueno
          </Text>
          <StagesBar stages={numericStages} />
          <View className="flex-row justify-between mt-2">
            {Object.entries(STAGE_COLORS).map(([key, color]) => (
              <View key={key} className="flex-row items-center gap-1">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <Text className="text-[10px] text-white/40 capitalize">{key}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* String-based stages fallback (grid) */}
      {!numericStages && data.stages && (
        <View className="flex-row gap-2 mb-4">
          {Object.entries(data.stages).map(([key, val]) => (
            <View key={key} className="flex-1 bg-white/5 p-2 rounded-lg items-center">
              <Text className="text-[10px] text-white/40 uppercase">{key}</Text>
              <Text className="text-sm font-bold text-white">{String(val)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <View>
          <Text className="text-[10px] text-white/40 uppercase font-bold mb-1.5">
            Insights
          </Text>
          {data.insights.map((insight, i) => (
            <Text key={i} className="text-xs text-white/60 mb-1">
              • {insight}
            </Text>
          ))}
        </View>
      )}
    </GlassCard>
  );
};

const StagesBar: React.FC<{ stages: SleepStages }> = ({ stages }) => {
  const total = stages.deep + stages.light + stages.rem + stages.awake || 1;

  return (
    <View className="flex-row h-3 rounded-full overflow-hidden">
      {(['deep', 'rem', 'light', 'awake'] as const).map((key) => {
        const pct = (stages[key] / total) * 100;
        if (pct <= 0) return null;
        return (
          <AnimatedBar
            key={key}
            percentage={pct}
            color={STAGE_COLORS[key]}
          />
        );
      })}
    </View>
  );
};

const AnimatedBar: React.FC<{ percentage: number; color: string }> = ({
  percentage,
  color,
}) => {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percentage, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <Animated.View className="h-full" style={[{ backgroundColor: color }, style]} />
  );
};

const SCORE_SIZE = 56;
const SCORE_STROKE = 4;
const SCORE_R = (SCORE_SIZE - SCORE_STROKE) / 2;
const SCORE_CIRC = 2 * Math.PI * SCORE_R;

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const progress = Math.min(score / 100, 1);
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(progress, { duration: 1000 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: SCORE_CIRC * (1 - anim.value),
  }));

  return (
    <View style={{ width: SCORE_SIZE, height: SCORE_SIZE }}>
      <Svg width={SCORE_SIZE} height={SCORE_SIZE}>
        <Circle
          cx={SCORE_SIZE / 2}
          cy={SCORE_SIZE / 2}
          r={SCORE_R}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={SCORE_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SCORE_SIZE / 2}
          cy={SCORE_SIZE / 2}
          r={SCORE_R}
          stroke={COLORS.recovery}
          strokeWidth={SCORE_STROKE}
          fill="none"
          strokeDasharray={SCORE_CIRC}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${SCORE_SIZE / 2} ${SCORE_SIZE / 2})`}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-sm font-bold text-white">{score}</Text>
      </View>
    </View>
  );
};

function normalizeStages(
  stages?: SleepStages | Record<string, string | number>
): SleepStages | null {
  if (!stages) return null;
  const deep = Number(stages.deep);
  const light = Number(stages.light);
  const rem = Number(stages.rem);
  const awake = Number(stages.awake ?? 0);
  if ([deep, light, rem].some(isNaN)) return null;
  return { deep, light, rem, awake };
}

function getQualityLabel(score: number): string {
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Buena';
  if (score >= 50) return 'Regular';
  return 'Baja';
}
