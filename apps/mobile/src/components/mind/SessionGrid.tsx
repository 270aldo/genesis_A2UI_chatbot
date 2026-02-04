import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Wind, Target, Moon, BookOpen, type LucideIcon } from 'lucide-react-native';

interface Session {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  duration: string;
  color: string;
}

interface SessionGridProps {
  sessions: Session[];
  onPress?: (session: Session) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  wind: Wind,
  target: Target,
  moon: Moon,
  'book-open': BookOpen,
};

export const SessionGrid: React.FC<SessionGridProps> = ({ sessions, onPress }) => {
  return (
    <View className="flex-row flex-wrap gap-3">
      {sessions.map((session) => {
        const Icon = ICON_MAP[session.icon] ?? Wind;
        return (
          <Pressable
            key={session.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress?.(session);
            }}
            className="rounded-xl p-3 items-center"
            style={{
              width: '47%',
              backgroundColor: `${session.color}08`,
              borderWidth: 1,
              borderColor: `${session.color}15`,
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: `${session.color}15` }}
            >
              <Icon size={20} color={session.color} />
            </View>
            <Text className="text-xs font-bold text-white/70">{session.title}</Text>
            <Text className="text-[10px] text-white/30 mt-0.5">{session.subtitle}</Text>
            <Text className="text-[9px] text-white/20 mt-1">{session.duration}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
