import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

type MetricKey = 'strength' | 'composition' | 'adherence' | 'sleep';

interface TrendChartProps {
  data: Record<MetricKey, number[]>;
}

const METRICS: { key: MetricKey; label: string; color: string; unit: string }[] = [
  { key: 'strength', label: 'Fuerza', color: '#EF4444', unit: 'kg' },
  { key: 'composition', label: 'Composicion', color: '#22C55E', unit: '%' },
  { key: 'adherence', label: 'Adherencia', color: '#A855F7', unit: '%' },
  { key: 'sleep', label: 'Sueno', color: '#6366F1', unit: 'h' },
];

const CHART_HEIGHT = 120;
const PADDING = 16;

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [active, setActive] = useState<MetricKey>('strength');
  const chartWidth = Dimensions.get('window').width - 40 - PADDING * 2;

  const values = data[active];
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = PADDING + (i / (values.length - 1)) * (chartWidth - PADDING);
      const y = CHART_HEIGHT - ((v - min) / range) * (CHART_HEIGHT - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const metric = METRICS.find((m) => m.key === active)!;

  return (
    <View>
      {/* Toggle pills */}
      <View className="flex-row gap-2 mb-3">
        {METRICS.map((m) => (
          <Pressable
            key={m.key}
            onPress={() => {
              Haptics.selectionAsync();
              setActive(m.key);
            }}
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: active === m.key ? `${m.color}20` : 'rgba(255,255,255,0.03)',
              borderWidth: 1,
              borderColor: active === m.key ? `${m.color}40` : 'rgba(255,255,255,0.04)',
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: active === m.key ? m.color : 'rgba(255,255,255,0.3)' }}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Chart */}
      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <Svg width={chartWidth + PADDING} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={metric.color} stopOpacity={0.15} />
              <Stop offset="1" stopColor={metric.color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={chartWidth + PADDING} height={CHART_HEIGHT} fill="url(#chartGrad)" />
          <Polyline
            points={points}
            fill="none"
            stroke={metric.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>

        {/* Labels */}
        <View className="flex-row justify-between px-3 pb-2">
          <Text className="text-[9px] text-white/20">8 semanas</Text>
          <Text className="text-[10px] font-bold" style={{ color: metric.color }}>
            {values[values.length - 1]}{metric.unit}
          </Text>
        </View>
      </View>
    </View>
  );
};
