import React from 'react';
import { View, Text } from 'react-native';
import { WeekdayStrip, type DayStatus } from '../shared';

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
      <WeekdayStrip days={days} accentColor="#EF4444" />
      <View className="flex-row justify-between mt-2">
        {days.map((day, i) => (
          <View key={i} className="items-center" style={{ width: 28 }}>
            <Text
              className="text-[8px] text-center"
              style={{
                color:
                  day.status === 'today'
                    ? '#EF4444'
                    : day.status === 'done'
                      ? 'rgba(255,255,255,0.4)'
                      : 'rgba(255,255,255,0.2)',
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
