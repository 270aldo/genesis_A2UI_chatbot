import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  delay?: number;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  subtitle,
  style,
  delay = 0,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify()}
      className="mx-5 mb-4 p-4 rounded-2xl"
      style={[
        {
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        style,
      ]}
    >
      {(title || subtitle) && (
        <View className="mb-3">
          {title && (
            <Text className="text-xs font-bold text-white/50 uppercase tracking-widest">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-[10px] text-white/30 mt-0.5">{subtitle}</Text>
          )}
        </View>
      )}
      {children}
    </Animated.View>
  );
};
