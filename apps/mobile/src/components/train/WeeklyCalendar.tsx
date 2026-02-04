import React from 'react';
import { View, Text } from 'react-native';
import { WeekdayStrip, type DayStatus } from '../shared';
import { COLORS, TEXT } from '../../theme';

interface DayPlan {
  label: string;
  status: DayStatus;
  workout: string;
}

interface WeeklyCalendarProps {
  days: DayPlan[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ days }) => {
  return (
    <View>
      <WeekdayStrip days={days} accentColor={COLORS.training} />
      <View className="flex-row justify-between mt-2">
        {days.map((day, i) => (
          <View key={i} className="items-center" style={{ width: 28 }}>
            <Text
              className="text-[11px] text-center"
              style={{
                color:
                  day.status === 'today'
                    ? COLORS.training
                    : day.status === 'done'
                      ? TEXT.muted
                      : TEXT.disabled,
              }}
              numberOfLines={1}
            >
              {day.workout}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};
