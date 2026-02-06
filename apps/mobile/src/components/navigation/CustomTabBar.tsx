import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SURFACE } from '../../theme';
import {
  Home,
  Dumbbell,
  Apple,
  Brain,
  BarChart3,
  type LucideIcon,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export const TAB_BAR_HEIGHT = 72;

interface TabConfig {
  icon: LucideIcon;
  label: string;
  color: string;
}

const ACTIVE_TINT = '#b39aff';
const INACTIVE_TINT = '#6b6b7b';

const TAB_CONFIG: Record<string, TabConfig> = {
  index: { icon: Home, label: 'Home', color: '#6D00FF' },
  train: { icon: Dumbbell, label: 'Train', color: '#EF4444' },
  fuel: { icon: Apple, label: 'Fuel', color: '#22C55E' },
  mind: { icon: Brain, label: 'Mind', color: '#A855F7' },
  track: { icon: BarChart3, label: 'Track', color: '#3B82F6' },
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.0)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.topBorder} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const Icon = config.icon;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
            >
              <Icon
                size={22}
                color={isFocused ? config.color : INACTIVE_TINT}
                strokeWidth={isFocused ? 2.5 : 1.5}
              />
              {isFocused && (
                <View style={[styles.dot, { backgroundColor: ACTIVE_TINT }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  topBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SURFACE.border,
  },
  tabRow: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
