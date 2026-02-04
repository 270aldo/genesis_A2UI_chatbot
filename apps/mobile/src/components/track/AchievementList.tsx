import React from 'react';
import { View, Text } from 'react-native';
import { Trophy, Award, Flag, type LucideIcon } from 'lucide-react-native';

interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  date: string;
  color: string;
}

interface AchievementListProps {
  achievements: Achievement[];
}

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  flag: Flag,
};

export const AchievementList: React.FC<AchievementListProps> = ({ achievements }) => {
  return (
    <View className="gap-3">
      {achievements.map((a) => {
        const Icon = ICON_MAP[a.icon] ?? Trophy;
        return (
          <View
            key={a.id}
            className="flex-row items-center gap-3 p-3 rounded-xl"
            style={{
              backgroundColor: `${a.color}08`,
              borderWidth: 1,
              borderColor: `${a.color}15`,
            }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${a.color}15` }}
            >
              <Icon size={18} color={a.color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white/80">{a.title}</Text>
              <Text className="text-[10px] text-white/35 mt-0.5">{a.subtitle}</Text>
            </View>
            <Text className="text-[10px] text-white/20">{a.date}</Text>
          </View>
        );
      })}
    </View>
  );
};
