import React from 'react';
import { WidgetPayload } from '@genesis/shared';
import { A2UIMediator } from '../widgets/A2UIMediator';

interface WidgetMessageProps {
  payload: WidgetPayload;
  onAction?: (action: string, data?: Record<string, unknown>) => void;
}

export const WidgetMessage: React.FC<WidgetMessageProps> = ({ payload, onAction }) => {
  return <A2UIMediator payload={payload} onAction={onAction} />;
};
