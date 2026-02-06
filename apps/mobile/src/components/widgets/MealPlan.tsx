import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react-native';
import { GlassCard } from '../ui';
import { COLORS } from '../../theme';
import { FONTS } from '../../theme/fonts';

interface Meal {
  name: string;
  time?: string;
  calories?: number;
  kcal?: number;
  description?: string;
  highlight?: boolean;
  macros?: { protein: number; carbs: number; fat: number };
}

interface MealPlanData {
  title?: string;
  totalCalories?: number;
  totalKcal?: number;
  meals: Meal[];
  notes?: string;
}

export const MealPlan: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as MealPlanData;
  const totalCal = data.totalCalories || data.totalKcal;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <GlassCard accentColor={COLORS.nutrition}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-2">
          <UtensilsCrossed size={16} color={COLORS.nutrition} />
          <Text className="font-bold text-white text-base" style={{ fontFamily: FONTS.monoBold }}>
            {data.title || 'Plan'}
          </Text>
        </View>
        {totalCal != null && (
          <View
            className="px-2 py-1 rounded"
            style={{ backgroundColor: `${COLORS.nutrition}20` }}
          >
            <Text className="text-xs font-bold" style={{ color: COLORS.nutrition, fontFamily: FONTS.mono }}>
              {totalCal} kcal
            </Text>
          </View>
        )}
      </View>

      {/* Meals */}
      {data.meals?.map((meal, i) => {
        const cal = meal.calories || meal.kcal;
        const isExpanded = expandedIdx === i;
        const hasMacros = meal.macros || meal.description;

        return (
          <Pressable
            key={i}
            onPress={() => hasMacros && setExpandedIdx(isExpanded ? null : i)}
            className={`flex-row items-center p-3 rounded-xl mb-2 ${
              meal.highlight
                ? 'border'
                : ''
            }`}
            style={{
              backgroundColor: meal.highlight
                ? `${COLORS.habits}10`
                : 'rgba(255,255,255,0.03)',
              borderColor: meal.highlight ? `${COLORS.habits}33` : 'transparent',
            }}
          >
            {/* Time */}
            {meal.time && (
              <Text className="text-[10px] font-bold text-white/40 w-12">
                {meal.time}
              </Text>
            )}

            {/* Name + details */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-xs flex-1 ${
                    meal.highlight ? 'font-bold' : 'text-white'
                  }`}
                  style={meal.highlight ? { color: COLORS.habits } : undefined}
                >
                  {meal.name}
                </Text>
                <View className="flex-row items-center gap-1">
                  {cal != null && (
                    <Text className="text-[10px] text-white/30">{cal} kcal</Text>
                  )}
                  {hasMacros && (
                    isExpanded
                      ? <ChevronUp size={10} color="rgba(255,255,255,0.3)" />
                      : <ChevronDown size={10} color="rgba(255,255,255,0.3)" />
                  )}
                </View>
              </View>

              {/* Expanded details */}
              {isExpanded && (
                <View className="mt-2">
                  {meal.description && (
                    <Text className="text-[10px] text-white/50 mb-1">
                      {meal.description}
                    </Text>
                  )}
                  {meal.macros && (
                    <View className="flex-row gap-3 mt-1">
                      <MacroBadge label="P" value={meal.macros.protein} color="#3B82F6" />
                      <MacroBadge label="C" value={meal.macros.carbs} color="#F59E0B" />
                      <MacroBadge label="F" value={meal.macros.fat} color="#EF4444" />
                    </View>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      {/* Notes */}
      {data.notes && (
        <Text className="text-[10px] text-white/40 mt-2 italic">
          {data.notes}
        </Text>
      )}
    </GlassCard>
  );
};

const MacroBadge: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <View className="flex-row items-center gap-1">
    <View
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: color }}
    />
    <Text className="text-[10px] text-white/60">
      {label} {value}g
    </Text>
  </View>
);
