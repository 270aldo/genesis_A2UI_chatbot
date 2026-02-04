import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS, withOpacity, TEXT } from '../../theme';

interface FoodItem {
  name: string;
  kcal: number;
  protein: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  kcal: number;
  items: FoodItem[];
}

interface MealLogSectionProps {
  meals: Meal[];
}

export const MealLogSection: React.FC<MealLogSectionProps> = ({ meals }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <View className="gap-2">
      {meals.map((meal) => {
        const isOpen = expanded === meal.id;
        return (
          <View key={meal.id}>
            <Pressable
              onPress={() => toggle(meal.id)}
              accessibilityRole="button"
              accessibilityLabel={`${meal.name}, ${meal.kcal} kcal, ${meal.time}`}
              accessibilityState={{ expanded: isOpen }}
              className="flex-row items-center justify-between p-3 rounded-xl"
              style={{
                backgroundColor: isOpen
                  ? withOpacity(COLORS.nutrition, 0.06)
                  : 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: isOpen
                  ? withOpacity(COLORS.nutrition, 0.15)
                  : 'rgba(255,255,255,0.08)',
              }}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-text-muted font-bold w-10">{meal.time}</Text>
                <Text className="text-sm font-bold text-white/70">{meal.name}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs text-white/60 font-bold">{meal.kcal} kcal</Text>
                {isOpen ? (
                  <ChevronUp size={14} color={TEXT.disabled} />
                ) : (
                  <ChevronDown size={14} color={TEXT.disabled} />
                )}
              </View>
            </Pressable>

            {isOpen && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                className="mt-1 ml-12 gap-1"
              >
                {meal.items.map((item, idx) => (
                  <View key={idx} className="flex-row items-center justify-between py-1.5">
                    <Text className="text-xs text-white/65 flex-1">{item.name}</Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xs text-blue-400/60">{item.protein}g P</Text>
                      <Text className="text-xs text-white/50">{item.kcal}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        );
      })}
    </View>
  );
};
