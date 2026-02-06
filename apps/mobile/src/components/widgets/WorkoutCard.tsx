import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Dumbbell, Clock, ChevronDown, ChevronUp } from 'lucide-react-native';
import { ActionButton } from '../ui';
import { GradientCard } from '../common';
import { COLORS } from '../../theme';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest?: string;
  notes?: string;
  weight?: string;
  load?: string;
}

interface WorkoutCardData {
  title: string;
  description?: string;
  duration?: string;
  difficulty?: string;
  category?: string;
  workoutId?: string;
  exercises: Exercise[];
  warmup?: string[];
  cooldown?: string[];
  coachNote?: string;
  _frozen?: boolean;
}

export const WorkoutCard: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData, onAction }) => {
  const data = rawData as WorkoutCardData;
  const frozen = data._frozen ?? false;
  const [showWarmup, setShowWarmup] = useState(false);
  const [showCooldown, setShowCooldown] = useState(false);

  return (
    <GradientCard accentColor={COLORS.training} frozen={frozen}>
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 mr-3">
          <Text className="font-bold text-white text-base">{data.title}</Text>
          {data.description && (
            <Text className="text-white/40 text-xs mt-1">{data.description}</Text>
          )}
        </View>
        <View className="flex-row gap-2">
          {data.duration && (
            <View className="flex-row items-center bg-white/10 px-2 py-1 rounded gap-1">
              <Clock size={10} color="rgba(255,255,255,0.7)" />
              <Text className="text-[10px] text-white/70">{data.duration}</Text>
            </View>
          )}
          {data.difficulty && (
            <View className="bg-white/10 px-2 py-1 rounded">
              <Text className="text-[10px] text-white/70">{data.difficulty}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Warmup */}
      {data.warmup && data.warmup.length > 0 && (
        <CollapsibleSection
          title="Calentamiento"
          items={data.warmup}
          isOpen={showWarmup}
          onToggle={() => setShowWarmup(!showWarmup)}
          color={COLORS.training}
        />
      )}

      {/* Exercises */}
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 280 }}
      >
        {data.exercises?.map((ex, i) => (
          <View
            key={i}
            className="flex-row items-center gap-3 bg-white/5 p-3 rounded-xl mb-2"
          >
            <View
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{ backgroundColor: `${COLORS.training}33` }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: COLORS.training }}
              >
                {i + 1}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-white font-medium">{ex.name}</Text>
              <Text className="text-[10px] text-white/40">
                {ex.sets}x{ex.reps}
                {(ex.load || ex.weight) ? ` · ${ex.load || ex.weight}` : ''}
                {ex.rest ? ` · Rest ${ex.rest}` : ''}
              </Text>
              {ex.notes && (
                <Text className="text-[10px] text-white/30 italic mt-0.5">
                  {ex.notes}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Cooldown */}
      {data.cooldown && data.cooldown.length > 0 && (
        <CollapsibleSection
          title="Enfriamiento"
          items={data.cooldown}
          isOpen={showCooldown}
          onToggle={() => setShowCooldown(!showCooldown)}
          color={COLORS.training}
        />
      )}

      {/* Coach Note */}
      {data.coachNote && (
        <View
          className="mt-3 p-3 rounded-xl"
          style={{
            backgroundColor: `${COLORS.training}1A`,
            borderWidth: 1,
            borderColor: `${COLORS.training}33`,
          }}
        >
          <Text className="text-xs text-white/80 italic">
            {data.coachNote}
          </Text>
        </View>
      )}

      {/* Start Button */}
      {!frozen && (
        <View className="mt-4">
          <ActionButton
            label="Comenzar"
            accentColor={COLORS.training}
            icon={<Dumbbell size={14} color="white" />}
            onPress={() =>
              onAction?.('start-workout', {
                sessionId: data.workoutId,
                title: data.title,
                exercises: data.exercises,
              })
            }
          />
        </View>
      )}
    </GradientCard>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  items: string[];
  isOpen: boolean;
  onToggle: () => void;
  color: string;
}> = ({ title, items, isOpen, onToggle, color }) => (
  <View className="mb-2">
    <Pressable
      onPress={onToggle}
      className="flex-row items-center justify-between py-2"
    >
      <Text className="text-[10px] font-bold text-white/50 uppercase">
        {title}
      </Text>
      {isOpen ? (
        <ChevronUp size={12} color="rgba(255,255,255,0.4)" />
      ) : (
        <ChevronDown size={12} color="rgba(255,255,255,0.4)" />
      )}
    </Pressable>
    {isOpen && (
      <View className="pl-2">
        {items.map((item, i) => (
          <Text key={i} className="text-[10px] text-white/40 mb-1">
            • {item}
          </Text>
        ))}
      </View>
    )}
  </View>
);
