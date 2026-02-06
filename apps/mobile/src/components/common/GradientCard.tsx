import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS } from '@genesis/shared';

interface GradientCardProps {
  children: React.ReactNode;
  accentColor?: string;
  frozen?: boolean;
  style?: ViewStyle;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  accentColor = COLORS.training,
  frozen = false,
  style,
}) => {
  if (frozen) {
    return (
      <View
        className="rounded-2xl mb-3 overflow-hidden"
        style={[
          {
            backgroundColor: '#14121aB3',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            opacity: 0.6,
          },
          style,
        ]}
      >
        <View className="p-5">{children}</View>
      </View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(400).springify()}
      style={style}
    >
      <View
        className="rounded-2xl mb-3 overflow-hidden"
        style={{
          borderWidth: 1.5,
          borderColor: `${accentColor}66`,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={[`${accentColor}1A`, 'rgba(20,18,26,0.9)', 'rgba(20,18,26,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5"
        >
          {/* Shine effect — 1px highlight on top edge */}
          <View
            className="absolute top-0 left-4 right-4 h-px"
            style={{ backgroundColor: `${accentColor}55` }}
          />
          {children}
        </LinearGradient>
      </View>
    </Animated.View>
  );
};
