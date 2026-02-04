import React from 'react';
import { View, Text } from 'react-native';
import { SURFACE } from '../../theme';

interface StatPillProps {
  value: string;
  label: string;
}

export const StatPill: React.FC<StatPillProps> = ({ value, label }) => {
  return (
    <View
      className="flex-1 px-3 py-2 rounded-xl items-center"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
    >
      <Text className="text-sm font-black text-white">{value}</Text>
      <Text className="text-[11px] text-white/50 uppercase tracking-wider mt-0.5">
        {label}
      </Text>
    </View>
  );
};
