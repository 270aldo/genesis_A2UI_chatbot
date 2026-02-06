import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Zap, UtensilsCrossed, Droplets, Moon, Activity,
  Dumbbell, BarChart3, CheckCircle2, Brain, Target,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { GlassCard } from '../ui';
import { COLORS } from '../../theme';
import { FONTS } from '../../theme/fonts';
import { getCategoryForWidget } from '../../utils/getCategoryColor';

const ICON_MAP: Record<string, LucideIcon> = {
  pulse: Activity,
  dumbbell: Dumbbell,
  fork: UtensilsCrossed,
  moon: Moon,
  chart: BarChart3,
  check: CheckCircle2,
  food: UtensilsCrossed,
  water: Droplets,
  activity: Activity,
  brain: Brain,
  target: Target,
  zap: Zap,
};

interface QuickActionsData {
  title?: string;
  actions: Array<{
    id: string;
    label: string;
    icon?: string;
    highlight?: boolean;
    category?: string;
    prompt?: string;
  }>;
  recommendation?: {
    actionId: string;
    reason: string;
  };
}

export const QuickActions: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData, onAction }) => {
  const data = rawData as QuickActionsData;

  const handlePress = (action: QuickActionsData['actions'][0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action.prompt) {
      onAction?.('quick-action', { prompt: action.prompt });
    } else {
      onAction?.('quick-action', { prompt: action.label });
    }
  };

  return (
    <GlassCard accentColor={COLORS.genesis}>
      {data.title && (
        <Text className="text-sm font-semibold text-white/90 mb-3" style={{ fontFamily: FONTS.monoBold }}>
          {data.title}
        </Text>
      )}

      {data.recommendation && (
        <View className="flex-row items-center gap-2 p-2 rounded-lg bg-genesis/10 border border-genesis/20 mb-3">
          <Brain size={14} color={COLORS.genesis} />
          <Text className="text-xs flex-1" style={{ color: `${COLORS.genesis}CC` }}>
            {data.recommendation.reason}
          </Text>
        </View>
      )}

      <View className="flex-row flex-wrap gap-2">
        {data.actions?.map((action) => {
          const Icon = ICON_MAP[action.icon ?? ''] ?? Zap;
          const isHighlighted =
            action.highlight || data.recommendation?.actionId === action.id;
          const categoryColor = action.category
            ? COLORS[action.category as keyof typeof COLORS] ?? COLORS.genesis
            : COLORS.genesis;

          return (
            <Pressable
              key={action.id}
              onPress={() => handlePress(action)}
              className={`flex-row items-center gap-2 px-3 py-2.5 rounded-2xl border ${
                isHighlighted
                  ? 'bg-genesis/20 border-genesis/40'
                  : 'bg-white/5 border-white/5'
              }`}
              style={{ minWidth: '46%', flexGrow: 1 }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isHighlighted
                    ? `${COLORS.genesis}30`
                    : 'rgba(255,255,255,0.05)',
                }}
              >
                <Icon
                  size={14}
                  color={isHighlighted ? COLORS.genesis : 'rgba(255,255,255,0.8)'}
                />
              </View>
              <Text
                className="text-xs font-bold flex-1"
                style={{
                  color: isHighlighted ? COLORS.genesis : 'rgba(255,255,255,0.9)',
                  fontFamily: FONTS.mono,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
};
