import React from 'react';
import { WidgetPayload } from '@genesis/shared';
import { FallbackWidget } from './FallbackWidget';

export type WidgetComponent = React.FC<{
  data: Record<string, any>;
  onAction?: (action: string, data?: any) => void;
}>;

const WIDGET_MAP = new Map<string, WidgetComponent>();

export const registerWidget = (type: string, component: WidgetComponent) => {
  WIDGET_MAP.set(type, component);
};

export const getWidgetComponent = (type: string): WidgetComponent | undefined => {
  return WIDGET_MAP.get(type);
};

interface A2UIMediatorProps {
  payload: WidgetPayload;
  onAction?: (action: string, data?: any) => void;
}

export const A2UIMediator: React.FC<A2UIMediatorProps> = ({ payload, onAction }) => {
  if (!payload?.type) return null;

  const Widget = WIDGET_MAP.get(payload.type);

  if (!Widget) return <FallbackWidget type={payload.type} />;

  return <Widget data={payload.props as Record<string, any>} onAction={onAction} />;
};
