import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play, Clock, Check } from 'lucide-react-native';
import { ActionButton } from '../ui';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  rest: string;
}

interface WorkoutSessionViewProps {
  title: string;
  subtitle: string;
  duration: string;
  exercises: Exercise[];
}

export const WorkoutSessionView: React.FC<WorkoutSessionViewProps> = ({
  title,
  subtitle,
  duration,
  exercises,
}) => {
  const [completedSets, setCompletedSets] = useState<Record<string, boolean[]>>({});

  const toggleSet = (exerciseName: string, setIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedSets((prev) => {
      const current = prev[exerciseName] ?? Array(4).fill(false);
      const updated = [...current];
      updated[setIndex] = !updated[setIndex];
      return { ...prev, [exerciseName]: updated };
    });
  };

  return (
    <View>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-base font-black text-white">{title}</Text>
          <Text className="text-xs text-white/40 mt-0.5">{subtitle}</Text>
        </View>
        <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white/5">
          <Clock size={12} color="rgba(255,255,255,0.4)" />
          <Text className="text-[10px] text-white/40 font-bold">{duration}</Text>
        </View>
      </View>

      {/* Exercises */}
      {exercises.map((exercise, i) => {
        const sets = completedSets[exercise.name] ?? Array(exercise.sets).fill(false);
        const completedCount = sets.filter(Boolean).length;

        return (
          <View
            key={i}
            className="mb-3 p-3 rounded-xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.02)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.04)',
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-[10px] font-bold text-white/25 w-4">{i + 1}</Text>
                <Text className="text-sm font-bold text-white/80">{exercise.name}</Text>
              </View>
              <Text className="text-[10px] text-white/30">
                {exercise.reps} x {exercise.weight}
              </Text>
            </View>

            {/* Set toggles */}
            <View className="flex-row gap-2">
              {Array.from({ length: exercise.sets }).map((_, setIdx) => (
                <Pressable
                  key={setIdx}
                  onPress={() => toggleSet(exercise.name, setIdx)}
                  className="w-9 h-9 rounded-lg items-center justify-center"
                  style={{
                    backgroundColor: sets[setIdx]
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(255,255,255,0.04)',
                    borderWidth: 1,
                    borderColor: sets[setIdx]
                      ? 'rgba(239,68,68,0.3)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {sets[setIdx] ? (
                    <Check size={14} color="#EF4444" strokeWidth={3} />
                  ) : (
                    <Text className="text-[10px] text-white/30 font-bold">S{setIdx + 1}</Text>
                  )}
                </Pressable>
              ))}
              <Text className="text-[10px] text-white/20 self-center ml-auto">
                Rest {exercise.rest}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Start button */}
      <View className="mt-2">
        <ActionButton
          label="Comenzar Entrenamiento"
          onPress={() => {}}
          accentColor="#EF4444"
          icon={<Play size={14} color="white" fill="white" />}
        />
      </View>
    </View>
  );
};
