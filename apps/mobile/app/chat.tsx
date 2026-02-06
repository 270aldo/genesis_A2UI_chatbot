import { useCallback } from 'react';
import { KeyboardAvoidingView, Platform, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '@genesis/shared';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useChatStore, useWorkoutStore } from '../src/stores';
import { createWidgetEvent } from '../src/lib/a2ui';
import { ChatList, ChatInput } from '../src/components/chat';

export default function ChatModal() {
  const router = useRouter();

  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sendEvent = useChatStore((s) => s.sendEvent);
  const freezeActiveWidget = useChatStore((s) => s.freezeActiveWidget);

  const startWorkout = useWorkoutStore((s) => s.startWorkout);
  const logSet = useWorkoutStore((s) => s.logSet);
  const completeWorkout = useWorkoutStore((s) => s.completeWorkout);
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const sets = useWorkoutStore((s) => s.sets);
  const totalVolume = useWorkoutStore((s) => s.totalVolume);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAction = useCallback(
    async (action: string, data?: Record<string, unknown>) => {
      switch (action) {
        case 'start-workout': {
          // Freeze the WorkoutCard, start workout, send event for LiveSessionTracker
          freezeActiveWidget();
          const session = await startWorkout({
            title: (data?.title as string) ?? 'Workout',
            exercises: (data?.exercises as Record<string, unknown>[]) ?? [],
          });
          if (session) {
            const event = createWidgetEvent('workout_started', {
              sessionId: session.id,
              title: session.title,
              exercises: session.exercises,
            });
            await sendEvent(event, '');
          }
          break;
        }

        case 'log-set': {
          if (!activeSession) break;
          const result = await logSet({
            exerciseName: (data?.exerciseName as string) ?? '',
            setNumber: (data?.setNumber as number) ?? 1,
            exerciseOrder: (data?.exerciseOrder as number) ?? 0,
            weightKg: (data?.weightKg as number) ?? 0,
            reps: (data?.reps as number) ?? 0,
            rpe: data?.rpe as number | undefined,
          });

          // Update the LiveSessionTracker widget in-place with new set data
          if (result) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.widget?.type === 'live-session-tracker') {
              const updatedExercises = [
                ...((lastMsg.widget.props.exercises as any[]) ?? []),
              ];
              const exIdx = data?.exerciseOrder as number ?? 0;
              if (updatedExercises[exIdx]) {
                const completedSets = [
                  ...((updatedExercises[exIdx].setsCompleted as any[]) ?? []),
                  {
                    weight: data?.weightKg,
                    reps: data?.reps,
                    isPr: result.isPr,
                  },
                ];
                updatedExercises[exIdx] = {
                  ...updatedExercises[exIdx],
                  setsCompleted: completedSets,
                };
              }
              useChatStore.getState().updateWidget(lastMsg.id, {
                props: {
                  ...lastMsg.widget.props,
                  exercises: updatedExercises,
                },
              });
            }
          }
          break;
        }

        case 'complete': {
          if (!activeSession) break;
          const durationMins = (data?.durationMins as number) ??
            Math.round(
              (Date.now() - new Date(activeSession.startedAt).getTime()) / 60000
            );

          freezeActiveWidget();
          await completeWorkout({ durationMins });

          const prs = sets
            .filter((s) => s.isPr)
            .map((s) => ({
              exercise: s.exerciseName,
              type: s.prType ?? 'volume',
            }));

          const event = createWidgetEvent('workout_completed', {
            sessionId: activeSession.id,
            title: activeSession.title,
            totalVolume,
            totalSets: sets.filter((s) => !s.isWarmup).length,
            totalReps: sets.reduce((acc, s) => acc + s.reps, 0),
            durationMins,
            prs,
          });
          await sendEvent(event, '');
          break;
        }

        case 'quick-action': {
          if (data?.prompt) {
            await sendMessage(data.prompt as string);
          }
          break;
        }

        default: {
          await sendMessage(`[action:${action}] ${JSON.stringify(data ?? {})}`);
          break;
        }
      }
    },
    [
      activeSession,
      sets,
      totalVolume,
      messages,
      freezeActiveWidget,
      startWorkout,
      logSet,
      completeWorkout,
      sendEvent,
      sendMessage,
    ]
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-dark" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="px-5 py-3 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center gap-2">
          <View
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLORS.genesis }}
          />
          <Text className="text-sm font-black tracking-widest text-white/90">
            GENESIS
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {isLoading && (
            <ActivityIndicator size="small" color={COLORS.genesis} />
          )}
          <Pressable onPress={handleClose} hitSlop={12}>
            <X size={20} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>
      </View>

      {/* Chat */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ChatList messages={messages} onAction={handleAction} />
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
