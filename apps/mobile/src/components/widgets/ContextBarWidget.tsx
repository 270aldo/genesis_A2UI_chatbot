import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { COLORS } from '@genesis/shared';
import { FONTS } from '../../theme/fonts';

interface ContextBarData {
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  elapsed: number;
  totalSetsCompleted: number;
}

export const ContextBarWidget: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as ContextBarData;
  const [elapsed, setElapsed] = useState(data.elapsed ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-row items-center px-4 py-3 gap-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
      <View
        className="w-8 h-8 rounded-full items-center justify-center"
        style={{ backgroundColor: `${COLORS.training}33` }}
      >
        <Dumbbell size={14} color={COLORS.training} />
      </View>
      <View className="flex-1">
        <Text
          className="text-white text-xs"
          style={{ fontFamily: FONTS.monoBold }}
          numberOfLines={1}
        >
          {data.exerciseName || 'Entrenamiento'}
        </Text>
        <Text className="text-white/40 text-[10px]" style={{ fontFamily: FONTS.sans }}>
          {data.totalSetsCompleted ?? 0} sets · {data.targetSets}x{data.targetReps}
        </Text>
      </View>
      <View className="bg-white/10 px-3 py-1.5 rounded-lg">
        <Text className="text-white text-sm" style={{ fontFamily: FONTS.monoBold }}>
          {formatTime(elapsed)}
        </Text>
      </View>
    </View>
  );
};
