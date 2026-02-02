import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Activity, Lightbulb } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { GlassCard, ActionButton } from '../ui';
import { COLORS } from '../../theme';
import { getCategoryForWidget } from '../../utils/getCategoryColor';

const TREND_MAP: Record<string, { Icon: LucideIcon; color: string; label: string }> = {
  positive: { Icon: TrendingUp, color: '#00FF88', label: 'Positivo' },
  negative: { Icon: TrendingDown, color: '#FF4444', label: 'Atencion' },
  neutral: { Icon: Activity, color: '#6366F1', label: 'Neutral' },
  up: { Icon: TrendingUp, color: '#00FF88', label: 'Positivo' },
  down: { Icon: TrendingDown, color: '#FF4444', label: 'Atencion' },
  stable: { Icon: Activity, color: '#FFB800', label: 'Estable' },
};

interface InsightCardData {
  title: string;
  insight: string;
  metric?: { label: string; value: string | number; change?: number };
  category?: string;
  trend?: string;
  recommendation?: string;
  actionLabel?: string;
  actionPrompt?: string;
}

export const InsightCard: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData, onAction }) => {
  const data = rawData as InsightCardData;
  const accentColor = data.category
    ? COLORS[data.category as keyof typeof COLORS] ?? COLORS.analytics
    : COLORS.analytics;

  const trendKey = data.trend ?? 'neutral';
  const trendCfg = TREND_MAP[trendKey] ?? TREND_MAP.neutral;

  return (
    <GlassCard accentColor={accentColor}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="font-bold text-white text-sm flex-1 mr-2">
          {data.title}
        </Text>
        {data.trend && (
          <View
            className="flex-row items-center gap-1 px-2 py-1 rounded-full"
            style={{ backgroundColor: `${trendCfg.color}20` }}
          >
            <trendCfg.Icon size={12} color={trendCfg.color} />
            <Text className="text-[10px] font-medium" style={{ color: trendCfg.color }}>
              {trendCfg.label}
            </Text>
          </View>
        )}
      </View>

      {/* Insight text */}
      <Text className="text-sm text-white/80 leading-5 mb-3">
        {data.insight}
      </Text>

      {/* Metric highlight */}
      {data.metric && (
        <View className="bg-white/5 rounded-xl p-3 mb-3 flex-row items-center justify-between">
          <Text className="text-xs text-white/50">{data.metric.label}</Text>
          <View className="flex-row items-baseline gap-1">
            <Text className="text-lg font-bold text-white">
              {data.metric.value}
            </Text>
            {data.metric.change != null && (
              <Text
                className="text-xs font-bold"
                style={{
                  color:
                    data.metric.change > 0
                      ? '#00FF88'
                      : data.metric.change < 0
                        ? '#FF4444'
                        : '#FFB800',
                }}
              >
                {data.metric.change > 0 ? '+' : ''}
                {data.metric.change}%
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Recommendation */}
      {data.recommendation && (
        <View className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
          <View className="flex-row items-start gap-2">
            <Lightbulb size={14} color="#FBBF24" style={{ marginTop: 1 }} />
            <Text className="text-white/70 text-xs leading-4 flex-1">
              {data.recommendation}
            </Text>
          </View>
        </View>
      )}

      {/* Action button */}
      {data.actionLabel && data.actionPrompt && (
        <ActionButton
          label={data.actionLabel}
          accentColor={accentColor}
          variant="secondary"
          onPress={() => onAction?.('quick-action', { prompt: data.actionPrompt })}
        />
      )}
    </GlassCard>
  );
};
