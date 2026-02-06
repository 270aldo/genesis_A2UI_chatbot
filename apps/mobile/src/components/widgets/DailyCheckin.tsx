import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CheckCircle2 } from 'lucide-react-native';
import { GlassCard, ActionButton, GlassInput } from '../ui';
import { COLORS } from '../../theme';
import { FONTS } from '../../theme/fonts';

interface CheckinField {
  name: string;
  label: string;
  type: 'slider' | 'select' | 'text' | 'number';
  id?: string;
  min?: number;
  max?: number;
  options?: string[];
  value?: number | string;
}

interface DailyCheckinData {
  fields?: CheckinField[];
  questions?: CheckinField[];
  greeting?: string;
  date?: string;
}

export const DailyCheckin: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData, onAction }) => {
  const data = rawData as DailyCheckinData;
  const fields = data.fields ?? data.questions ?? [];
  const [answers, setAnswers] = useState<Record<string, number | string>>(() => {
    const init: Record<string, number | string> = {};
    fields.forEach((f) => {
      const key = f.id ?? f.name;
      init[key] = f.value ?? f.min ?? 5;
    });
    return init;
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = useCallback((key: string, value: number | string) => {
    Haptics.selectionAsync();
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    onAction?.('checkin-submit', { date: data.date, values: answers });
  };

  if (submitted) {
    return (
      <GlassCard accentColor="#00FF88">
        <Animated.View entering={FadeIn} className="flex-row items-center gap-3 py-2">
          <CheckCircle2 size={24} color="#00FF88" />
          <Text className="text-sm font-bold" style={{ color: '#00FF88', fontFamily: FONTS.monoBold }}>
            Check-in Completado
          </Text>
        </Animated.View>
      </GlassCard>
    );
  }

  return (
    <GlassCard accentColor={COLORS.habits}>
      <Text className="font-bold text-white text-sm mb-1" style={{ fontFamily: FONTS.monoBold }}>Daily Check-in</Text>
      {(data.greeting || data.date) && (
        <Text className="text-[10px] text-white/40 mb-4">
          {data.greeting || data.date}
        </Text>
      )}

      {fields.map((field) => {
        const key = field.id ?? field.name;
        const value = answers[key];

        return (
          <View key={key} className="mb-4">
            <Text className="text-xs text-white/80 mb-2">{field.label}</Text>
            {field.type === 'slider' || field.type === 'number' ? (
              <SliderControl
                value={Number(value)}
                min={field.min ?? 1}
                max={field.max ?? 10}
                onChange={(v) => handleChange(key, v)}
                color={COLORS.habits}
              />
            ) : field.type === 'select' && field.options ? (
              <SelectControl
                options={field.options}
                value={String(value)}
                onChange={(v) => handleChange(key, v)}
                color={COLORS.habits}
              />
            ) : (
              <GlassInput
                placeholder="..."
                value={String(value ?? '')}
                onChangeText={(v) => handleChange(key, v)}
              />
            )}
          </View>
        );
      })}

      <ActionButton
        label="Guardar Registro"
        accentColor={COLORS.habits}
        onPress={handleSubmit}
      />
    </GlassCard>
  );
};

const SliderControl: React.FC<{
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ value, min, max, onChange, color }) => {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-[10px] text-white/30">{min}</Text>
        <Text className="text-sm font-bold text-white">{value}</Text>
        <Text className="text-[10px] text-white/30">{max}</Text>
      </View>
      <View className="flex-row gap-1">
        {steps.map((step) => (
          <Pressable
            key={step}
            onPress={() => onChange(step)}
            className="flex-1 h-8 rounded-lg items-center justify-center"
            style={{
              backgroundColor:
                step <= value ? `${color}${step === value ? '60' : '25'}` : 'rgba(255,255,255,0.03)',
            }}
          >
            {step === value && (
              <Text className="text-[10px] font-bold" style={{ color }}>
                {step}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const SelectControl: React.FC<{
  options: string[];
  value: string;
  onChange: (v: string) => void;
  color: string;
}> = ({ options, value, onChange, color }) => (
  <View className="flex-row flex-wrap gap-2">
    {options.map((opt) => {
      const selected = opt === value;
      return (
        <Pressable
          key={opt}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(opt);
          }}
          className={`px-3 py-2 rounded-xl border ${
            selected ? '' : 'border-white/10 bg-white/5'
          }`}
          style={
            selected
              ? { backgroundColor: `${color}25`, borderColor: `${color}60`, borderWidth: 1 }
              : undefined
          }
        >
          <Text
            className="text-xs font-medium"
            style={{ color: selected ? color : 'rgba(255,255,255,0.7)' }}
          >
            {opt}
          </Text>
        </Pressable>
      );
    })}
  </View>
);
