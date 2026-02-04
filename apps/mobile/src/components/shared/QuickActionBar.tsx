import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ClipboardCheck,
  ScanLine,
  Dumbbell,
  BookOpen,
  type LucideIcon,
} from 'lucide-react-native';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'clipboard-check': ClipboardCheck,
  'scan-line': ScanLine,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
};

interface QuickActionBarProps {
  actions: QuickAction[];
  onPress?: (action: QuickAction) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions,
  onPress,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      className="mb-4"
    >
      {actions.map((action) => {
        const Icon = ICON_MAP[action.icon];
        return (
          <Pressable
            key={action.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress?.(action);
            }}
            className="overflow-hidden rounded-xl"
          >
            <LinearGradient
              colors={[
                `${action.color ?? '#6D00FF'}20`,
                `${action.color ?? '#6D00FF'}08`,
              ]}
              className="flex-row items-center px-4 py-2.5 gap-2"
              style={{ borderWidth: 1, borderColor: `${action.color ?? '#6D00FF'}30`, borderRadius: 12 }}
            >
              {Icon && <Icon size={14} color={action.color ?? '#6D00FF'} />}
              <Text className="text-xs font-bold text-white/70">{action.label}</Text>
            </LinearGradient>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
