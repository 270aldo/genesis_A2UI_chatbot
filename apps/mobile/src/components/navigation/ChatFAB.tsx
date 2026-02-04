import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MessageCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TAB_BAR_HEIGHT } from './CustomTabBar';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ChatFAB: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/chat') return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/chat');
  };

  return (
    <AnimatedPressable
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Abrir chat"
      style={[
        styles.fab,
        { bottom: TAB_BAR_HEIGHT + insets.bottom + 12 },
      ]}
    >
      <LinearGradient
        colors={['#6D00FF', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <MessageCircle size={24} color="white" fill="white" />
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    shadowColor: '#6D00FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  gradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
