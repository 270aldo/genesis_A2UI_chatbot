import React from 'react';
import { View, Text } from 'react-native';
import { Check, Minus } from 'lucide-react-native';
import { TEXT } from '../../theme';

export type DayStatus = 'done' | 'today' | 'rest' | 'upcoming';

interface WeekdayStripProps {
  days: { label: string; status: DayStatus }[];
  accentColor?: string;
}

const LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const WeekdayStrip: React.FC<WeekdayStripProps> = ({
  days,
  accentColor = '#6D00FF',
}) => {
  return (
    <View className="flex-row justify-between">
      {days.map((day, i) => (
        <View key={i} className="items-center gap-1.5">
          <Text className="text-xs text-white/50 font-bold">
            {day.label || LABELS[i]}
          </Text>
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={
              day.status === 'done'
                ? { backgroundColor: `${accentColor}20` }
                : day.status === 'today'
                  ? { borderWidth: 2, borderColor: accentColor }
                  : { backgroundColor: 'rgba(255,255,255,0.07)' } // slightly different from SURFACE.bg intentionally
            }
          >
            {day.status === 'done' && <Check size={12} color={accentColor} strokeWidth={3} />}
            {day.status === 'rest' && <Minus size={10} color={TEXT.disabled} />}
            {day.status === 'today' && (
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
};
