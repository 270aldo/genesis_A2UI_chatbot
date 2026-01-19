/**
 * useWidgetTelemetry Hook
 *
 * Tracks widget interactions and visibility for analytics.
 */

import { useCallback, useRef, useEffect } from 'react';
import { supabase, getCurrentUserId, WidgetEventInsert, Json } from '../services/supabase';

type EventType = 'render' | 'interact' | 'dismiss' | 'complete' | 'error';

interface TelemetryOptions {
  widgetId: string;
  widgetType: string;
  agentId?: string;
}

export function useWidgetTelemetry(options: TelemetryOptions) {
  const { widgetId, widgetType, agentId } = options;
  const userId = getCurrentUserId();
  const renderTime = useRef<number>(Date.now());

  // Log event to Supabase
  const logEvent = useCallback(
    async (eventType: EventType, properties?: Record<string, unknown>) => {
      try {
        const event: WidgetEventInsert = {
          user_id: userId,
          event_type: eventType,
          widget_id: widgetId,
          widget_type: widgetType,
          agent_id: agentId,
          properties: (properties || {}) as Json,
          platform: 'web',
          client_version: '1.0.0',
        };

        // Type assertion needed when Supabase env vars are empty (dev mode)
        await (supabase.from('widget_events') as any).insert(event);
      } catch (err) {
        console.warn('Failed to log widget event:', err);
      }
    },
    [userId, widgetId, widgetType, agentId]
  );

  // Track render on mount
  useEffect(() => {
    renderTime.current = Date.now();
    logEvent('render');

    // Track visibility time on unmount
    return () => {
      const visibleSeconds = Math.round((Date.now() - renderTime.current) / 1000);
      if (visibleSeconds > 0) {
        logEvent('dismiss', { time_visible_seconds: visibleSeconds });
      }
    };
  }, [logEvent]);

  // Track user interaction
  const trackInteraction = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      logEvent('interact', { action, ...data });
    },
    [logEvent]
  );

  // Track completion (e.g., form submitted, workout finished)
  const trackComplete = useCallback(
    (data?: Record<string, unknown>) => {
      logEvent('complete', data);
    },
    [logEvent]
  );

  // Track error
  const trackError = useCallback(
    (error: string, data?: Record<string, unknown>) => {
      logEvent('error', { error, ...data });
    },
    [logEvent]
  );

  return {
    trackInteraction,
    trackComplete,
    trackError,
  };
}

/**
 * Lightweight hook for simple telemetry without tracking options
 */
export function useSimpleTelemetry() {
  const userId = getCurrentUserId();

  const track = useCallback(
    async (
      eventType: string,
      widgetType: string,
      properties?: Record<string, unknown>
    ) => {
      try {
        const event: WidgetEventInsert = {
          user_id: userId,
          event_type: eventType,
          widget_id: `${widgetType}-${Date.now()}`,
          widget_type: widgetType,
          properties: (properties || {}) as Json,
          platform: 'web',
          client_version: '1.0.0',
        };

        // Type assertion needed when Supabase env vars are empty (dev mode)
        await (supabase.from('widget_events') as any).insert(event);
      } catch (err) {
        console.warn('Failed to log event:', err);
      }
    },
    [userId]
  );

  return { track };
}
