import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { GlassCard, ProgressBar } from '../ui';
import { COLORS } from '../../theme';

interface ChecklistItem {
  id: string;
  label?: string;
  text?: string;
  completed?: boolean;
  checked?: boolean;
  category?: string;
}

interface ChecklistData {
  title: string;
  items: ChecklistItem[];
  progress?: number;
}

export const Checklist: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData, onAction }) => {
  const data = rawData as ChecklistData;
  const [items, setItems] = useState(() =>
    data.items.map((item) => ({
      ...item,
      done: item.completed ?? item.checked ?? false,
    }))
  );

  const completedCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const toggleItem = useCallback(
    (idx: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], done: !next[idx].done };
        return next;
      });
      const item = items[idx];
      onAction?.('checklist-toggle', {
        itemId: item.id,
        completed: !item.done,
      });
    },
    [items, onAction]
  );

  return (
    <GlassCard accentColor={COLORS.habits}>
      <Text className="font-bold text-white text-sm mb-1">{data.title}</Text>
      <Text className="text-[10px] text-white/40 mb-3">
        {completedCount}/{items.length} completado
      </Text>

      <ProgressBar
        progress={progress}
        color={COLORS.habits}
        height={4}
      />

      <View className="mt-3">
        {items.map((item, i) => (
          <ChecklistRow
            key={item.id}
            label={item.label ?? item.text ?? ''}
            done={item.done}
            onToggle={() => toggleItem(i)}
          />
        ))}
      </View>
    </GlassCard>
  );
};

const ChecklistRow: React.FC<{
  label: string;
  done: boolean;
  onToggle: () => void;
}> = ({ label, done, onToggle }) => {
  const scale = useSharedValue(1);

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.2, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      className={`flex-row items-center gap-3 p-3 rounded-xl mb-1.5 border ${
        done ? 'border-[#00FF88]/20' : 'border-transparent'
      }`}
      style={{
        backgroundColor: done ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.03)',
        opacity: done ? 0.6 : 1,
      }}
    >
      <Animated.View
        style={[
          {
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: done ? '#00FF88' : 'transparent',
            borderColor: done ? '#00FF88' : 'rgba(255,255,255,0.25)',
          },
          checkboxStyle,
        ]}
      >
        {done && <Check size={12} color="#000" />}
      </Animated.View>
      <Text
        className={`text-xs flex-1 ${done ? 'line-through text-white/50' : 'text-white'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
};
