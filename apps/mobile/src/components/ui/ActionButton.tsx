import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@genesis/shared';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  accentColor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  accentColor = COLORS.genesis,
  icon,
  loading = false,
  disabled = false,
  className = '',
  compact = false,
}) => {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        className={`overflow-hidden rounded-xl ${isDisabled ? 'opacity-50' : ''} ${className}`}
      >
        <LinearGradient
          colors={[accentColor, `${accentColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className={`flex-row items-center justify-center ${compact ? 'px-4 py-2' : 'px-6 py-3'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              {icon && <View className="mr-2">{icon}</View>}
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                {label}
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className={`flex-row items-center justify-center rounded-xl ${
        compact ? 'px-4 py-2' : 'px-6 py-3'
      } ${
        variant === 'secondary' ? 'bg-white/5 border border-white/10' : ''
      } ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="rgba(255,255,255,0.6)" size="small" />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={`text-xs font-bold uppercase tracking-widest ${
              variant === 'secondary' ? 'text-white/60' : 'text-white/40'
            }`}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};
