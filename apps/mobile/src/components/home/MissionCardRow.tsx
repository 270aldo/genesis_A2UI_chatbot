import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Dumbbell,
  UtensilsCrossed,
  ClipboardCheck,
  Check,
  type LucideIcon,
} from 'lucide-react-native';

interface Mission {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  done: boolean;
  color: string;
}

interface MissionCardRowProps {
  missions: Mission[];
  onPress?: (mission: Mission) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  dumbbell: Dumbbell,
  utensils: UtensilsCrossed,
  'clipboard-check': ClipboardCheck,
};

export const MissionCardRow: React.FC<MissionCardRowProps> = ({
  missions,
  onPress,
}) => {
  return (
    <View className="flex-row gap-3">
      {missions.map((mission) => {
        const Icon = ICON_MAP[mission.icon] ?? ClipboardCheck;
        return (
          <Pressable
            key={mission.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress?.(mission);
            }}
            className="flex-1 p-3 rounded-xl items-center"
            style={{
              backgroundColor: mission.done
                ? `${mission.color}10`
                : 'rgba(255,255,255,0.03)',
              borderWidth: 1,
              borderColor: mission.done
                ? `${mission.color}30`
                : 'rgba(255,255,255,0.06)',
            }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mb-2"
              style={{
                backgroundColor: mission.done
                  ? `${mission.color}20`
                  : 'rgba(255,255,255,0.05)',
              }}
            >
              {mission.done ? (
                <Check size={18} color={mission.color} strokeWidth={3} />
              ) : (
                <Icon size={18} color={mission.color} />
              )}
            </View>
            <Text
              className="text-[11px] font-bold text-white/80 text-center"
              numberOfLines={1}
            >
              {mission.title}
            </Text>
            <Text className="text-[9px] text-white/35 text-center mt-0.5">
              {mission.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
