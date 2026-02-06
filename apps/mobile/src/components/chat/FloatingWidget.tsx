import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useSurfaceStore } from '../../stores/surface-store';
import { SurfaceRenderer } from './SurfaceRenderer';

interface FloatingWidgetProps {
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({ onAction }) => {
  const overlaySurfaces = useSurfaceStore((s) => s.getOverlaySurfaces());
  const activeSurface = overlaySurfaces.find((s) => s.state === 'active');

  if (!activeSurface) return null;

  const handleDismiss = () => {
    useSurfaceStore.getState().deleteSurface(activeSurface.id);
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutDown.duration(200)}
      className="absolute left-4 right-4"
      style={{ bottom: 90, zIndex: 50 }}
    >
      <View className="relative">
        <SurfaceRenderer surface={activeSurface} onAction={onAction} />
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 items-center justify-center"
          style={{ zIndex: 51 }}
        >
          <X size={12} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>
    </Animated.View>
  );
};
