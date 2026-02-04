import React from 'react';
import { View, Text } from 'react-native';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react-native';

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  delta,
  deltaDirection = 'neutral',
  icon: Icon,
  color = 'rgba(255,255,255,0.6)',
}) => {
  const DeltaIcon =
    deltaDirection === 'up' ? TrendingUp :
    deltaDirection === 'down' ? TrendingDown :
    Minus;

  const deltaColor =
    deltaDirection === 'up' ? '#22C55E' :
    deltaDirection === 'down' ? '#EF4444' :
    'rgba(255,255,255,0.3)';

  return (
    <View
      className="flex-1 p-3 rounded-xl"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        {Icon && <Icon size={16} color={color} />}
        {delta && (
          <View className="flex-row items-center gap-1">
            <DeltaIcon size={10} color={deltaColor} />
            <Text style={{ color: deltaColor, fontSize: 10, fontWeight: '600' }}>
              {delta}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-lg font-black text-white">{value}</Text>
      <Text className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
        {label}
      </Text>
    </View>
  );
};
