import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play, Pause, Clock, Check } from 'lucide-react-native';
import { ActionButton } from '../ui';
import { COLORS, withOpacity, SURFACE, TEXT } from '../../theme';

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
  const [isActive, setIsActive] = useState(false);

  const toggleSet = (exerciseName: string, setIndex: number, totalSets: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedSets((prev) => {
      const current = prev[exerciseName] ?? Array(totalSets).fill(false);
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
          <Text className="text-xs text-white/55 mt-0.5">{subtitle}</Text>
        </View>
        <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white/5">
          <Clock size={12} color={TEXT.muted} />
          <Text className="text-xs text-text-muted font-bold">{duration}</Text>
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
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: SURFACE.border,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-text-muted w-4">{i + 1}</Text>
                <Text className="text-sm font-bold text-white/80">{exercise.name}</Text>
              </View>
              <Text className="text-xs text-white/50">
                {exercise.reps} x {exercise.weight}
              </Text>
            </View>

            {/* Set toggles */}
            <View className="flex-row gap-2">
              {Array.from({ length: exercise.sets }).map((_, setIdx) => (
                <Pressable
                  key={setIdx}
                  onPress={() => toggleSet(exercise.name, setIdx, exercise.sets)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: sets[setIdx] ?? false }}
                  accessibilityLabel={`Set ${setIdx + 1} de ${exercise.name}`}
                  className="w-11 h-11 rounded-lg items-center justify-center"
                  style={{
                    backgroundColor: sets[setIdx]
                      ? withOpacity(COLORS.training, 0.15)
                      : 'rgba(255,255,255,0.07)',
                    borderWidth: 1,
                    borderColor: sets[setIdx]
                      ? withOpacity(COLORS.training, 0.3)
                      : SURFACE.border,
                  }}
                >
                  {sets[setIdx] ? (
                    <Check size={14} color="#EF4444" strokeWidth={3} />
                  ) : (
                    <Text className="text-xs text-text-muted font-bold">S{setIdx + 1}</Text>
                  )}
                </Pressable>
              ))}
              <Text className="text-xs text-text-muted self-center ml-auto">
                Rest {exercise.rest}
              </Text>
            </View>
          </View>
        );
      })}

      {/* Start/Stop button */}
      <View className="mt-2">
        <ActionButton
          label={isActive ? 'Finalizar Sesion' : 'Comenzar Entrenamiento'}
          onPress={() => {
            Haptics.notificationAsync(
              isActive ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
            );
            if (isActive) {
              const total = exercises.reduce((sum, e) => sum + e.sets, 0);
              const done = Object.values(completedSets).reduce(
                (sum, arr) => sum + arr.filter(Boolean).length, 0,
              );
              Alert.alert('Sesion Finalizada', `Completaste ${done}/${total} sets.`);
              setCompletedSets({});
            }
            setIsActive(!isActive);
          }}
          accentColor={isActive ? '#22C55E' : '#EF4444'}
          icon={isActive
            ? <Check size={14} color="white" strokeWidth={3} />
            : <Play size={14} color="white" fill="white" />
          }
        />
      </View>
    </View>
  );
};
