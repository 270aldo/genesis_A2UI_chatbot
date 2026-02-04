import React from 'react';
import { View, Text } from 'react-native';
import { ProgressRing } from '../shared';
import { ProgressBar } from '../ui';
import { COLORS } from '../../theme';

interface MacroData {
  calories: { current: number; target: number };
  protein: { current: number; target: number; color: string };
  carbs: { current: number; target: number; color: string };
  fat: { current: number; target: number; color: string };
}

interface MacroDashboardProps {
  data: MacroData;
}

export const MacroDashboard: React.FC<MacroDashboardProps> = ({ data }) => {
  const calProgress = Math.round((data.calories.current / data.calories.target) * 100);

  return (
    <View className="flex-row gap-4">
      {/* Calorie Ring */}
      <ProgressRing size={100} progress={calProgress} color={COLORS.nutrition} strokeWidth={8}>
        <Text className="text-lg font-black text-white">{data.calories.current}</Text>
        <Text className="text-[11px] text-white/65 uppercase">/ {data.calories.target}</Text>
      </ProgressRing>

      {/* Macro Bars */}
      <View className="flex-1 justify-center gap-3">
        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs font-bold text-white/65">Proteina</Text>
            <Text className="text-xs text-white/65">
              {data.protein.current}/{data.protein.target}g
            </Text>
          </View>
          <ProgressBar
            value={data.protein.current}
            max={data.protein.target}
            color={data.protein.color}
            height={5}
          />
        </View>
        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs font-bold text-white/65">Carbos</Text>
            <Text className="text-xs text-white/65">
              {data.carbs.current}/{data.carbs.target}g
            </Text>
          </View>
          <ProgressBar
            value={data.carbs.current}
            max={data.carbs.target}
            color={data.carbs.color}
            height={5}
          />
        </View>
        <View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs font-bold text-white/65">Grasa</Text>
            <Text className="text-xs text-white/65">
              {data.fat.current}/{data.fat.target}g
            </Text>
          </View>
          <ProgressBar
            value={data.fat.current}
            max={data.fat.target}
            color={data.fat.color}
            height={5}
          />
        </View>
      </View>
    </View>
  );
};
