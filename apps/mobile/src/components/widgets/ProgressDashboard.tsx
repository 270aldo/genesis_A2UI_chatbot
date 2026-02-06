import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { GlassCard } from '../ui';
import { COLORS } from '../../theme';
import { FONTS } from '../../theme/fonts';

interface Metric {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  unit?: string;
}

interface ProgressDashboardData {
  title: string;
  period?: string;
  metrics: Metric[];
  summary?: string;
}

const TREND_CONFIG = {
  up: { Icon: TrendingUp, color: '#00FF88' },
  down: { Icon: TrendingDown, color: '#FF4444' },
  stable: { Icon: Minus, color: '#FFB800' },
};

export const ProgressDashboard: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as ProgressDashboardData;

  return (
    <GlassCard accentColor={COLORS.analytics}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="font-bold text-white text-base" style={{ fontFamily: FONTS.monoBold }}>{data.title}</Text>
        {data.period && (
          <View
            className="px-2 py-1 rounded"
            style={{ backgroundColor: `${COLORS.analytics}20` }}
          >
            <Text className="text-[10px] font-bold" style={{ color: COLORS.analytics }}>
              {data.period}
            </Text>
          </View>
        )}
      </View>

      {/* Metrics grid — 2 columns */}
      <View className="flex-row flex-wrap -mx-1">
        {data.metrics?.map((metric, i) => (
          <View key={i} className="w-1/2 px-1 mb-2">
            <MetricCard metric={metric} />
          </View>
        ))}
      </View>

      {/* Summary */}
      {data.summary && (
        <Text className="text-xs text-white/50 mt-2 leading-4">
          {data.summary}
        </Text>
      )}
    </GlassCard>
  );
};

const MetricCard: React.FC<{ metric: Metric }> = ({ metric }) => {
  const trend = metric.trend ?? (metric.change != null
    ? metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable'
    : undefined);

  const trendCfg = trend ? TREND_CONFIG[trend] : null;

  return (
    <View className="bg-white/5 rounded-xl p-3">
      {/* Value */}
      <AnimatedValue value={metric.value} unit={metric.unit} />

      {/* Label */}
      <Text className="text-[10px] text-white/40 mt-1">{metric.label}</Text>

      {/* Trend + change */}
      {trendCfg && metric.change != null && (
        <View className="flex-row items-center gap-1 mt-1.5">
          <trendCfg.Icon size={10} color={trendCfg.color} />
          <Text className="text-[10px] font-bold" style={{ color: trendCfg.color }}>
            {metric.change > 0 ? '+' : ''}
            {metric.change}%
          </Text>
        </View>
      )}
    </View>
  );
};

const AnimatedValue: React.FC<{ value: number | string; unit?: string }> = ({
  value,
  unit,
}) => {
  // For numeric values, animate the counter
  if (typeof value === 'number') {
    return <NumberCounter target={value} unit={unit} />;
  }

  return (
    <Text className="text-lg font-bold text-white" style={{ fontFamily: FONTS.monoBold }}>
      {value}
      {unit && <Text className="text-xs text-white/40"> {unit}</Text>}
    </Text>
  );
};

const AnimatedText = Animated.createAnimatedComponent(Text);

const NumberCounter: React.FC<{ target: number; unit?: string }> = ({
  target,
  unit,
}) => {
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(target, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [target]);

  const animatedProps = useAnimatedProps(() => {
    const display = Number.isInteger(target)
      ? Math.round(anim.value).toString()
      : anim.value.toFixed(1);
    return {
      text: unit ? `${display}` : display,
      defaultValue: unit ? `${display}` : display,
    } as any;
  });

  return (
    <View className="flex-row items-baseline">
      <AnimatedText
        className="text-lg font-bold text-white"
        animatedProps={animatedProps}
      />
      {unit && (
        <Text className="text-xs text-white/40 ml-0.5">{unit}</Text>
      )}
    </View>
  );
};
