import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@genesis/shared';

interface ProgressBarProps {
  value?: number;
  max?: number;
  progress?: number;
  color?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  progress,
  color = COLORS.genesis,
  height = 6,
  label,
  showPercentage = false,
}) => {
  const percentage =
    progress !== undefined
      ? Math.min(progress, 100)
      : value !== undefined
        ? Math.min((value / max) * 100, 100)
        : 0;

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(percentage, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View>
      {(label || showPercentage) && (
        <View className="flex-row justify-between mb-1">
          {label && (
            <Text className="text-xs text-white/65 uppercase font-bold">
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text className="text-xs text-white font-mono">
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}
      <View
        className="w-full bg-white/10 rounded-full overflow-hidden"
        style={{ height }}
      >
        <Animated.View
          className="h-full rounded-full"
          style={[{ backgroundColor: color }, animatedStyle]}
        />
      </View>
    </View>
  );
};
