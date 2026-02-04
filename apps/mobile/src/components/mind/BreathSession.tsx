import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { withOpacity } from '../../theme';

const PHASES = ['Inhala', 'Sostener', 'Exhala'] as const;
const DURATIONS = [4000, 7000, 8000]; // 4-7-8 pattern

export const BreathSession: React.FC = () => {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const scale = useSharedValue(1);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (!active) {
      scale.value = withTiming(1, { duration: 300 });
      clearTimers();
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.4, { duration: 7000 }),
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    // Chain timeouts matching exact phase durations instead of drifting setInterval
    const schedulePhases = () => {
      let elapsed = 0;
      DURATIONS.forEach((dur, i) => {
        const nextPhase = (i + 1) % 3;
        elapsed += dur;
        const id = setTimeout(() => {
          setPhaseIndex(nextPhase);
          if (nextPhase === 0) schedulePhases(); // restart cycle
        }, elapsed);
        timersRef.current.push(id);
      });
    };
    schedulePhases();

    return clearTimers;
  }, [active, clearTimers]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setActive((prev) => !prev);
          setPhaseIndex(0);
        }}
      >
        <Animated.View
          style={animatedStyle}
          className="w-28 h-28 rounded-full items-center justify-center"
        >
          <View
            className="w-28 h-28 rounded-full items-center justify-center"
            style={{
              backgroundColor: active ? withOpacity('#6366F1', 0.15) : 'rgba(255,255,255,0.07)',
              borderWidth: 2,
              borderColor: active ? withOpacity('#6366F1', 0.3) : 'rgba(255,255,255,0.10)',
            }}
          >
            <Text className="text-xs font-bold" style={{ color: active ? '#818CF8' : 'rgba(255,255,255,0.50)' }}>
              {active ? PHASES[phaseIndex] : 'Iniciar'}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
      <Text className="text-[10px] text-text-muted mt-3">
        {active ? 'Toca para detener' : 'Respiracion 4-7-8'}
      </Text>
    </View>
  );
};
