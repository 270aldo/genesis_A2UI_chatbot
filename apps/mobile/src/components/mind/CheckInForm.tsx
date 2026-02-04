import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ActionButton } from '../ui';
import { COLORS, withOpacity, SURFACE, TEXT } from '../../theme';

const MOODS = ['😫', '😔', '😐', '🙂', '😄'];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MoodEmoji: React.FC<{
  emoji: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
}> = ({ emoji, index, selected, onSelect }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.15 : 1, { damping: 12 }) }],
  }));

  return (
    <AnimatedPressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Estado de animo ${index + 1} de 5`}
      className="w-12 h-12 rounded-xl items-center justify-center"
      style={[
        animatedStyle,
        {
          backgroundColor: selected ? withOpacity(COLORS.analytics, 0.15) : SURFACE.bg,
          borderWidth: selected ? 1 : 0,
          borderColor: withOpacity(COLORS.analytics, 0.3),
        },
      ]}
    >
      <Text className="text-xl">{emoji}</Text>
    </AnimatedPressable>
  );
};

const NumberRow: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  color: string;
}> = ({ label, value, onChange, max = 10, color }) => (
  <View className="mt-3">
    <View className="flex-row justify-between mb-1.5">
      <Text className="text-xs text-text-tertiary font-bold">{label}</Text>
      <Text className="text-xs font-black" style={{ color }}>{value}</Text>
    </View>
    <View className="flex-row gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <Pressable
          key={n}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(n);
          }}
          hitSlop={{ top: 4, bottom: 4 }}
          accessibilityRole="radio"
          accessibilityState={{ selected: n === value }}
          accessibilityLabel={`${label} ${n}`}
          className="flex-1 h-10 rounded-lg items-center justify-center"
          style={{
            backgroundColor: n <= value ? `${color}20` : SURFACE.bg,
            borderWidth: 1,
            borderColor: n <= value ? `${color}40` : 'rgba(255,255,255,0.07)',
          }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: n <= value ? color : TEXT.disabled }}
          >
            {n}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
);

interface CheckInFormProps {
  initialMood?: number;
  initialEnergy?: number;
  initialStress?: number;
  initialSleep?: number;
}

export const CheckInForm: React.FC<CheckInFormProps> = ({
  initialMood = 3,
  initialEnergy = 5,
  initialStress = 5,
  initialSleep = 5,
}) => {
  const [mood, setMood] = useState(initialMood);
  const [energy, setEnergy] = useState(initialEnergy);
  const [stress, setStress] = useState(initialStress);
  const [sleep, setSleep] = useState(initialSleep);
  const [submitted, setSubmitted] = useState(false);

  return (
    <View>
      {/* Mood Emojis */}
      <Text className="text-xs text-text-tertiary font-bold mb-2">Estado de Animo</Text>
      <View className="flex-row justify-between">
        {MOODS.map((emoji, i) => (
          <MoodEmoji
            key={i}
            emoji={emoji}
            index={i}
            selected={mood === i + 1}
            onSelect={() => {
              Haptics.selectionAsync();
              setMood(i + 1);
            }}
          />
        ))}
      </View>

      <NumberRow label="Energia" value={energy} onChange={setEnergy} color={COLORS.nutrition} />
      <NumberRow label="Estres" value={stress} onChange={setStress} color={COLORS.training} />
      <NumberRow label="Calidad de Sueno" value={sleep} onChange={setSleep} color="#6366F1" />

      <View className="mt-4">
        <ActionButton
          label={submitted ? 'Check-in Enviado' : 'Enviar Check-in'}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSubmitted(true);
            Alert.alert('Check-in Registrado', `Animo: ${mood}/5 · Energia: ${energy} · Estres: ${stress} · Sueno: ${sleep}`);
          }}
          accentColor={submitted ? '#22C55E' : COLORS.analytics}
          disabled={submitted}
        />
      </View>
    </View>
  );
};
