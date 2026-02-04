import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from '../ui';
import { COLORS, withOpacity } from '../../theme';

interface SeasonProgressProps {
  name: string;
  phase: string;
  week: number;
  totalWeeks: number;
}

export const SeasonProgress: React.FC<SeasonProgressProps> = ({
  name,
  phase,
  week,
  totalWeeks,
}) => {
  const progress = Math.round((week / totalWeeks) * 100);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-black text-white">{name}</Text>
        <View className="px-2 py-1 rounded-full" style={{ backgroundColor: withOpacity(COLORS.analytics, 0.15) }}>
          <Text className="text-[10px] font-bold" style={{ color: COLORS.analytics }}>
            {phase}
          </Text>
        </View>
      </View>
      <ProgressBar
        value={week}
        max={totalWeeks}
        color={COLORS.analytics}
        label={`Semana ${week} de ${totalWeeks}`}
        showPercentage
      />
    </View>
  );
};
