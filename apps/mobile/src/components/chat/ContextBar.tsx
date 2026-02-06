import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSurfaceStore } from '../../stores/surface-store';
import { SurfaceRenderer } from './SurfaceRenderer';

interface ContextBarProps {
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const ContextBar: React.FC<ContextBarProps> = ({ onAction }) => {
  const contextSurfaces = useSurfaceStore((s) => s.getContextSurfaces());
  const activeSurface = contextSurfaces.find((s) => s.state === 'active');

  if (!activeSurface) return null;

  return (
    <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
      <View className="border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <SurfaceRenderer surface={activeSurface} onAction={onAction} />
      </View>
    </Animated.View>
  );
};
