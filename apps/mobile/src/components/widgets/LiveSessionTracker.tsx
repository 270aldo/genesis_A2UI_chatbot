import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Play, Check, Trophy } from 'lucide-react-native';
import { COLORS } from '@genesis/shared';
import { GradientCard } from '../common';
import { ActionButton } from '../ui';

interface TargetSet {
  sets: number;
  reps: string;
  rpe?: number;
}

interface CompletedSet {
  weight: number;
  reps: number;
  isPr?: boolean;
}

interface TrackerExercise {
  id: string;
  name: string;
  target: TargetSet;
  setsCompleted: CompletedSet[];
}

interface LiveSessionTrackerData {
  workoutId: string;
  title: string;
  exercises: TrackerExercise[];
  _frozen?: boolean;
}

export const LiveSessionTracker: React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}> = ({ data: rawData, onAction }) => {
  const data = rawData as LiveSessionTrackerData;
  const frozen = data._frozen ?? false;

  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (frozen) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [frozen]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentExercise = data.exercises?.[currentExIdx];
  const totalSetsCompleted = data.exercises?.reduce(
    (acc, ex) => acc + (ex.setsCompleted?.length ?? 0),
    0
  ) ?? 0;

  const handleLogSet = () => {
    if (!weight || !reps) return;
    onAction?.('log-set', {
      exerciseName: currentExercise?.name,
      exerciseOrder: currentExIdx,
      setNumber: (currentExercise?.setsCompleted?.length ?? 0) + 1,
      weightKg: parseFloat(weight),
      reps: parseInt(reps, 10),
      rpe: rpe ? parseFloat(rpe) : undefined,
    });
    setWeight('');
    setReps('');
    setRpe('');

    // Auto-advance to next exercise if all sets done
    if (
      currentExercise &&
      (currentExercise.setsCompleted?.length ?? 0) + 1 >= currentExercise.target.sets &&
      currentExIdx < (data.exercises?.length ?? 0) - 1
    ) {
      setCurrentExIdx(currentExIdx + 1);
    }
  };

  const handleDone = () => {
    onAction?.('complete', {
      sessionId: data.workoutId,
      durationMins: Math.round(elapsed / 60),
      totalSets: totalSetsCompleted,
    });
  };

  return (
    <GradientCard accentColor={COLORS.training} frozen={frozen}>
      {/* Header with timer */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1">
          <Text className="text-white font-bold text-base">{data.title}</Text>
          <Text className="text-white/40 text-xs mt-0.5">
            {totalSetsCompleted} sets logged
          </Text>
        </View>
        <View className="bg-white/10 px-3 py-1.5 rounded-lg">
          <Text className="text-white font-mono font-bold text-sm">
            {formatTime(elapsed)}
          </Text>
        </View>
      </View>

      {!frozen && (
        <>
          {/* Current exercise */}
          {currentExercise && (
            <View className="mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${COLORS.training}33` }}
                >
                  <Text
                    className="text-[10px] font-bold"
                    style={{ color: COLORS.training }}
                  >
                    {currentExIdx + 1}
                  </Text>
                </View>
                <Text className="text-white font-bold text-sm flex-1">
                  {currentExercise.name}
                </Text>
                <Text className="text-white/40 text-xs">
                  {currentExercise.setsCompleted?.length ?? 0}/{currentExercise.target.sets}
                </Text>
              </View>

              <Text className="text-white/40 text-xs mb-3">
                Target: {currentExercise.target.sets} x {currentExercise.target.reps}
                {currentExercise.target.rpe ? ` @ RPE ${currentExercise.target.rpe}` : ''}
              </Text>

              {/* Input row */}
              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <Text className="text-white/40 text-[10px] mb-1 uppercase">
                    Kg
                  </Text>
                  <TextInput
                    className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm text-center"
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/40 text-[10px] mb-1 uppercase">
                    Reps
                  </Text>
                  <TextInput
                    className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm text-center"
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={reps}
                    onChangeText={setReps}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white/40 text-[10px] mb-1 uppercase">
                    RPE
                  </Text>
                  <TextInput
                    className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm text-center"
                    keyboardType="decimal-pad"
                    placeholder="-"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={rpe}
                    onChangeText={setRpe}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Completed sets for current exercise */}
          {currentExercise?.setsCompleted && currentExercise.setsCompleted.length > 0 && (
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 120 }}
              className="mb-3"
            >
              {currentExercise.setsCompleted.map((s, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-2 bg-white/5 p-2 rounded-lg mb-1"
                >
                  <Check size={12} color={COLORS.training} />
                  <Text className="text-white/70 text-xs flex-1">
                    Set {i + 1}: {s.weight}kg x {s.reps}
                  </Text>
                  {s.isPr && (
                    <View className="flex-row items-center gap-1">
                      <Trophy size={10} color="#FBBF24" />
                      <Text className="text-[10px] font-bold" style={{ color: '#FBBF24' }}>
                        PR
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Exercise nav pills */}
          <View className="flex-row gap-1 mb-4">
            {data.exercises?.map((ex, i) => (
              <View
                key={ex.id}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i === currentExIdx
                      ? COLORS.training
                      : (ex.setsCompleted?.length ?? 0) >= ex.target.sets
                      ? `${COLORS.training}66`
                      : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <ActionButton
                label="LOG SET"
                accentColor={COLORS.training}
                icon={<Play size={14} color="white" />}
                onPress={handleLogSet}
              />
            </View>
            <View className="flex-1">
              <ActionButton
                label="DONE"
                accentColor="rgba(255,255,255,0.2)"
                icon={<Check size={14} color="white" />}
                onPress={handleDone}
              />
            </View>
          </View>
        </>
      )}
    </GradientCard>
  );
};
