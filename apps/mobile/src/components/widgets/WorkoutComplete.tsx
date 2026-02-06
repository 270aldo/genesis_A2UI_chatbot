import React from 'react';
import { View, Text } from 'react-native';
import { Trophy, Clock, Dumbbell, Flame, Star } from 'lucide-react-native';
import { COLORS } from '@genesis/shared';
import { GradientCard } from '../common';

interface PRBadge {
  exercise: string;
  type: string;
  value?: string;
}

interface WorkoutCompleteData {
  sessionId?: string;
  title: string;
  totalVolume: number;
  totalSets: number;
  totalReps?: number;
  durationMins: number;
  prs?: PRBadge[];
  genesisNote?: string;
  _frozen?: boolean;
}

export const WorkoutComplete: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData }) => {
  const data = rawData as WorkoutCompleteData;
  const frozen = data._frozen ?? false;

  const stats = [
    {
      label: 'Volume',
      value: `${Math.round(data.totalVolume).toLocaleString()} kg`,
      icon: Dumbbell,
      color: COLORS.training,
    },
    {
      label: 'Duration',
      value: `${data.durationMins} min`,
      icon: Clock,
      color: '#0EA5E9',
    },
    {
      label: 'Sets',
      value: String(data.totalSets),
      icon: Flame,
      color: '#FBBF24',
    },
  ];

  if (data.totalReps) {
    stats.push({
      label: 'Reps',
      value: String(data.totalReps),
      icon: Star,
      color: '#A855F7',
    });
  }

  return (
    <GradientCard accentColor="#22C55E" frozen={frozen}>
      {/* Header */}
      <View className="items-center mb-4">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: '#22C55E22' }}
        >
          <Trophy size={24} color="#22C55E" />
        </View>
        <Text className="text-white font-bold text-base">{data.title}</Text>
        <Text className="text-white/40 text-xs mt-0.5">Workout Complete</Text>
      </View>

      {/* Stats grid */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {stats.map((stat) => (
          <View
            key={stat.label}
            className="flex-1 min-w-[30%] bg-white/5 rounded-xl p-3 items-center"
          >
            <stat.icon size={16} color={stat.color} />
            <Text className="text-white font-bold text-sm mt-1">
              {stat.value}
            </Text>
            <Text className="text-white/40 text-[10px] uppercase">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* PR badges */}
      {data.prs && data.prs.length > 0 && (
        <View className="mb-4">
          <Text className="text-white/50 text-[10px] uppercase font-bold mb-2">
            Personal Records
          </Text>
          {data.prs.map((pr, i) => (
            <View
              key={i}
              className="flex-row items-center gap-2 bg-yellow-500/10 p-2 rounded-lg mb-1"
            >
              <Trophy size={12} color="#FBBF24" />
              <Text className="text-white/80 text-xs flex-1">
                {pr.exercise}
              </Text>
              <Text className="text-[10px] font-bold" style={{ color: '#FBBF24' }}>
                {pr.type.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* GENESIS note */}
      {data.genesisNote && (
        <View
          className="p-3 rounded-xl"
          style={{
            backgroundColor: '#22C55E1A',
            borderWidth: 1,
            borderColor: '#22C55E33',
          }}
        >
          <Text className="text-xs text-white/80 italic">
            {data.genesisNote}
          </Text>
        </View>
      )}
    </GradientCard>
  );
};
