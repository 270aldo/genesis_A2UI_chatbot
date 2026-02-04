import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, Settings } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightActions?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightActions = false,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(50)}
      className="px-5 pt-2 pb-4 flex-row items-start justify-between"
    >
      <View className="flex-1">
        <Text className="text-2xl font-black text-white">{title}</Text>
        {subtitle && (
          <Text className="text-xs text-white/40 mt-1 tracking-wide">
            {subtitle}
          </Text>
        )}
      </View>
      {rightActions && (
        <View className="flex-row items-center gap-4 mt-1">
          <Pressable hitSlop={8}>
            <Bell size={20} color="rgba(255,255,255,0.35)" />
          </Pressable>
          <Pressable hitSlop={8}>
            <Settings size={20} color="rgba(255,255,255,0.35)" />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};
