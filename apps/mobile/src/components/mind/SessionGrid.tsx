import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Wind, Target, Moon, BookOpen, type LucideIcon } from 'lucide-react-native';
import { TEXT, withOpacity } from '../../theme';

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
            accessibilityRole="button"
            accessibilityLabel={`${session.title}: ${session.subtitle}, ${session.duration}`}
            className="rounded-xl p-3 items-center"
            style={{
              flex: 1,
              minWidth: '44%',
              backgroundColor: withOpacity(session.color, 0.08),
              borderWidth: 1,
              borderColor: withOpacity(session.color, 0.20),
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center mb-2"
              style={{ backgroundColor: withOpacity(session.color, 0.15) }}
            >
              <Icon size={20} color={session.color} />
            </View>
            <Text className="text-sm font-bold text-white/85">{session.title}</Text>
            <Text className="text-xs text-white/50 mt-0.5">{session.subtitle}</Text>
            <Text className="text-xs text-text-muted mt-1">{session.duration}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};
