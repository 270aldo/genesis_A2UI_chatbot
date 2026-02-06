import React from 'react';
import { View, Text } from 'react-native';

interface ColoredPillProps {
  label: string;
  color: string;
}

export const ColoredPill: React.FC<ColoredPillProps> = ({ label, color }) => (
  <View
    className="px-2 py-0.5 rounded-full"
    style={{ backgroundColor: `${color}22` }}
  >
    <Text className="text-[10px] font-bold" style={{ color }}>
      {label}
    </Text>
  </View>
);
