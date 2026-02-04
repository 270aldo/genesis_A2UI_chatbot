import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ActionButton } from '../ui';

const MOODS = ['😫', '😔', '😐', '🙂', '😄'];

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

  const NumberRow: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
    max?: number;
    color: string;
  }> = ({ label, value, onChange, max = 10, color }) => (
    <View className="mt-3">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-xs text-white/50 font-bold">{label}</Text>
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
            className="flex-1 h-8 rounded-lg items-center justify-center"
            style={{
              backgroundColor: n <= value ? `${color}20` : 'rgba(255,255,255,0.03)',
              borderWidth: 1,
              borderColor: n <= value ? `${color}40` : 'rgba(255,255,255,0.04)',
            }}
          >
            <Text
              className="text-[10px] font-bold"
              style={{ color: n <= value ? color : 'rgba(255,255,255,0.2)' }}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View>
      {/* Mood Emojis */}
      <Text className="text-xs text-white/50 font-bold mb-2">Estado de Animo</Text>
      <View className="flex-row justify-between">
        {MOODS.map((emoji, i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.selectionAsync();
              setMood(i + 1);
            }}
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{
              backgroundColor: mood === i + 1 ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.03)',
              borderWidth: mood === i + 1 ? 1 : 0,
              borderColor: 'rgba(168,85,247,0.3)',
              transform: [{ scale: mood === i + 1 ? 1.15 : 1 }],
            }}
          >
            <Text className="text-xl">{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <NumberRow label="Energia" value={energy} onChange={setEnergy} color="#22C55E" />
      <NumberRow label="Estres" value={stress} onChange={setStress} color="#EF4444" />
      <NumberRow label="Calidad de Sueno" value={sleep} onChange={setSleep} color="#6366F1" />

      <View className="mt-4">
        <ActionButton
          label="Enviar Check-in"
          onPress={() => {}}
          accentColor="#A855F7"
        />
      </View>
    </View>
  );
};
