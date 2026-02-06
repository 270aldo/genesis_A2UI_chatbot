import React from 'react';
import { View } from 'react-native';
import type { Surface } from '../../stores/surface-store';
import { getWidgetComponent } from '../widgets/A2UIMediator';
import { FallbackWidget } from '../widgets/FallbackWidget';

interface SurfaceRendererProps {
  surface: Surface;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const SurfaceRenderer: React.FC<SurfaceRendererProps> = ({
  surface,
  onAction,
}) => {
  const Widget = getWidgetComponent(surface.widgetType);
  const isFrozen = surface.state === 'frozen';

  const content = Widget ? (
    <Widget
      data={{ ...surface.dataModel, _frozen: isFrozen } as Record<string, any>}
      onAction={onAction}
    />
  ) : (
    <FallbackWidget type={surface.widgetType} />
  );

  return (
    <View
      style={isFrozen ? { opacity: 0.6 } : undefined}
      pointerEvents={isFrozen ? 'none' : 'auto'}
    >
      {content}
    </View>
  );
};
