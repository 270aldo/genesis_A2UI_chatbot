import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Bell, Settings } from 'lucide-react-native';
import { TEXT, TOUCH } from '../../theme';

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
      entering={FadeInDown.duration(400).delay(50).springify()}
      className="px-5 pt-2 pb-4 flex-row items-start justify-between"
    >
      <View className="flex-1">
        <Text className="text-2xl font-black text-white">{title}</Text>
        {subtitle && (
          <Text className="text-xs text-text-muted mt-1 tracking-wide">
            {subtitle}
          </Text>
        )}
      </View>
      {rightActions && (
        <View className="flex-row items-center gap-4 mt-1">
          <Pressable hitSlop={TOUCH.hitSlop} accessibilityRole="button" accessibilityLabel="Notificaciones" style={{ minWidth: TOUCH.minTarget, minHeight: TOUCH.minTarget, alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color={TEXT.muted} />
          </Pressable>
          <Pressable hitSlop={TOUCH.hitSlop} accessibilityRole="button" accessibilityLabel="Ajustes" style={{ minWidth: TOUCH.minTarget, minHeight: TOUCH.minTarget, alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={20} color={TEXT.muted} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};
