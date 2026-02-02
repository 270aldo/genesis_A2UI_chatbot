import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS } from '@genesis/shared';

interface GlassCardProps {
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  accentColor = COLORS.genesis,
  className = '',
  style,
  animated = true,
}) => {
  const content = (
    <View
      className={`overflow-hidden rounded-2xl mb-3 ${className}`}
      style={[
        {
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        style,
      ]}
    >
      <BlurView intensity={20} tint="dark" className="overflow-hidden rounded-2xl">
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-5"
        >
          {/* Subtle accent glow at top */}
          <View
            className="absolute top-0 left-0 right-0 h-px"
            style={{ backgroundColor: `${accentColor}40` }}
          />
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );

  if (!animated) return content;

  return (
    <Animated.View entering={FadeInDown.duration(400).springify()}>
      {content}
    </Animated.View>
  );
};
