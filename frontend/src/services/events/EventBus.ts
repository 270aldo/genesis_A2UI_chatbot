/**
 * NGX GENESIS A2UI - Event Bus
 *
 * Sistema centralizado de eventos para comunicación entre componentes
 * y tracking de telemetría.
 *
 * Uso:
 * - Widgets emiten eventos cuando el usuario interactúa
 * - TelemetryService escucha y envía a Supabase
 * - Otros componentes pueden suscribirse para reaccionar
 */

import { v4 as uuid } from 'uuid';
import type { AgentId, WidgetType } from '../../contracts';

// ============================================
// EVENT TYPES
// ============================================

export type EventCategory =
  | 'widget'      // Widget lifecycle events
  | 'session'     // Workout session events
  | 'user'        // User actions
  | 'navigation'  // Screen/route changes
  | 'error'       // Error tracking
  | 'performance' // Performance metrics
  | 'ai';         // AI agent events

export type WidgetEventType =
  | 'widget_queued'
  | 'widget_shown'
  | 'widget_dismissed'
  | 'widget_completed'
  | 'widget_expired'
  | 'widget_dropped'
  | 'widget_deferred'
  | 'widget_interacted'
  | 'widget_error';

export type SessionEventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'session_abandoned'
  | 'set_logged'
  | 'exercise_skipped'
  | 'rest_started'
  | 'rest_completed';

export type UserEventType =
  | 'checkin_submitted'
  | 'pain_reported'
  | 'meal_logged'
  | 'hydration_logged'
  | 'supplement_taken'
  | 'feedback_given'
  | 'preference_changed';

export type NavigationEventType =
  | 'screen_view'
  | 'tab_changed'
  | 'modal_opened'
  | 'modal_closed';

export type AIEventType =
  | 'agent_invoked'
  | 'agent_responded'
  | 'agent_error'
  | 'tool_called';

export type EventType =
  | WidgetEventType
  | SessionEventType
  | UserEventType
  | NavigationEventType
  | AIEventType
  | 'error'
  | 'performance';

// ============================================
// BASE EVENT INTERFACE
// ============================================

export interface BaseEvent {
  // Identity
  eventId: string;
  eventType: EventType;
  category: EventCategory;

  // Context
  userId: string;
  sessionId?: string;
  widgetId?: string;
  agentId?: AgentId;

  // Timestamps
  timestamp: string;         // Server time (ISO)
  clientTimestamp: string;   // Client time (ISO)

  // Client info
  platform: 'web' | 'ios' | 'android';
  appVersion: string;

  // Event-specific data
  properties?: Record<string, unknown>;
}

// ============================================
// TYPED EVENT INTERFACES
// ============================================

export interface WidgetEvent extends BaseEvent {
  category: 'widget';
  eventType: WidgetEventType;
  widgetId: string;
  agentId: AgentId;
  properties: {
    widgetType: WidgetType;
    priority?: string;
    position?: string;
    timeVisibleMs?: number;
    timeToInteractMs?: number;
    timeToCompleteMs?: number;
    queueWaitMs?: number;
    reason?: string;
    outputData?: Record<string, unknown>;
  };
}

export interface SessionEvent extends BaseEvent {
  category: 'session';
  eventType: SessionEventType;
  sessionId: string;
  properties: {
    workoutId?: string;
    exerciseId?: string;
    setNumber?: number;
    weight?: number;
    reps?: number;
    rpe?: number;
    duration?: number;
    pauseReason?: string;
    completionPercentage?: number;
  };
}

export interface UserEvent extends BaseEvent {
  category: 'user';
  eventType: UserEventType;
  properties: {
    inputType?: string;
    values?: Record<string, unknown>;
    source?: string;
  };
}

export interface NavigationEvent extends BaseEvent {
  category: 'navigation';
  eventType: NavigationEventType;
  properties: {
    screenName?: string;
    previousScreen?: string;
    tabName?: string;
    modalName?: string;
  };
}

export interface AIEvent extends BaseEvent {
  category: 'ai';
  eventType: AIEventType;
  agentId: AgentId;
  properties: {
    prompt?: string;
    responseLength?: number;
    latencyMs?: number;
    toolName?: string;
    toolParams?: Record<string, unknown>;
    error?: string;
  };
}

export interface ErrorEvent extends BaseEvent {
  category: 'error';
  eventType: 'error';
  properties: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    componentName?: string;
    action?: string;
  };
}

export interface PerformanceEvent extends BaseEvent {
  category: 'performance';
  eventType: 'performance';
  properties: {
    metricName: string;
    value: number;
    unit: string;
    tags?: Record<string, string>;
  };
}

export type TypedEvent =
  | WidgetEvent
  | SessionEvent
  | UserEvent
  | NavigationEvent
  | AIEvent
  | ErrorEvent
  | PerformanceEvent;

// ============================================
// EVENT HANDLER TYPE
// ============================================

export type EventHandler<T extends BaseEvent = BaseEvent> = (event: T) => void;

export type UnsubscribeFn = () => void;

// ============================================
// EVENT BUS CLASS
// ============================================

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private eventQueue: BaseEvent[] = [];
  private isProcessing = false;
  private userId: string = '';
  private platform: 'web' | 'ios' | 'android' = 'web';
  private appVersion: string = '1.0.0';

  constructor() {
    // Initialize with defaults
    this.handlers = new Map();
    this.globalHandlers = new Set();
  }

  // ==========================================
  // CONFIGURATION
  // ==========================================

  /**
   * Set user context for all events
   */
  setUserContext(userId: string): void {
    this.userId = userId;
  }

  /**
   * Set platform info
   */
  setPlatform(platform: 'web' | 'ios' | 'android', version: string): void {
    this.platform = platform;
    this.appVersion = version;
  }

  // ==========================================
  // SUBSCRIPTION API
  // ==========================================

  /**
   * Subscribe to specific event type
   */
  on<T extends BaseEvent>(eventType: EventType, handler: EventHandler<T>): UnsubscribeFn {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to all events (for telemetry)
   */
  onAll(handler: EventHandler): UnsubscribeFn {
    this.globalHandlers.add(handler);
    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Subscribe to category of events
   */
  onCategory(category: EventCategory, handler: EventHandler): UnsubscribeFn {
    const wrappedHandler: EventHandler = (event) => {
      if (event.category === category) {
        handler(event);
      }
    };
    this.globalHandlers.add(wrappedHandler);
    return () => {
      this.globalHandlers.delete(wrappedHandler);
    };
  }

  // ==========================================
  // EMIT API
  // ==========================================

  /**
   * Emit an event
   */
  emit(event: Partial<BaseEvent> & { eventType: EventType; category: EventCategory }): void {
    const fullEvent: BaseEvent = {
      eventId: uuid(),
      userId: this.userId,
      platform: this.platform,
      appVersion: this.appVersion,
      timestamp: new Date().toISOString(),
      clientTimestamp: new Date().toISOString(),
      ...event,
    };

    this.eventQueue.push(fullEvent);
    this.processQueue();
  }

  /**
   * Emit widget event (convenience method)
   */
  emitWidget(
    eventType: WidgetEventType,
    widgetId: string,
    widgetType: WidgetType,
    agentId: AgentId,
    properties?: Partial<WidgetEvent['properties']>
  ): void {
    this.emit({
      eventType,
      category: 'widget',
      widgetId,
      agentId,
      properties: {
        widgetType,
        ...properties,
      },
    });
  }

  /**
   * Emit session event (convenience method)
   */
  emitSession(
    eventType: SessionEventType,
    sessionId: string,
    properties?: Partial<SessionEvent['properties']>
  ): void {
    this.emit({
      eventType,
      category: 'session',
      sessionId,
      properties,
    });
  }

  /**
   * Emit user event (convenience method)
   */
  emitUser(
    eventType: UserEventType,
    properties?: Partial<UserEvent['properties']>
  ): void {
    this.emit({
      eventType,
      category: 'user',
      properties,
    });
  }

  /**
   * Emit error event (convenience method)
   */
  emitError(
    errorType: string,
    errorMessage: string,
    extra?: Partial<ErrorEvent['properties']>
  ): void {
    this.emit({
      eventType: 'error',
      category: 'error',
      properties: {
        errorType,
        errorMessage,
        ...extra,
      },
    });
  }

  /**
   * Emit AI event (convenience method)
   */
  emitAI(
    eventType: AIEventType,
    agentId: AgentId,
    properties?: Partial<AIEvent['properties']>
  ): void {
    this.emit({
      eventType,
      category: 'ai',
      agentId,
      properties,
    });
  }

  // ==========================================
  // INTERNAL
  // ==========================================

  private processQueue(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;

      // Notify specific handlers
      const handlers = this.handlers.get(event.eventType);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error(`[EventBus] Handler error for ${event.eventType}:`, error);
          }
        });
      }

      // Notify global handlers
      this.globalHandlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[EventBus] Global handler error:`, error);
        }
      });
    }

    this.isProcessing = false;
  }

  /**
   * Clear all handlers (for testing/cleanup)
   */
  clear(): void {
    this.handlers.clear();
    this.globalHandlers.clear();
    this.eventQueue = [];
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const eventBus = new EventBus();

// Set default platform
eventBus.setPlatform('web', '1.0.0');

// ============================================
// REACT HOOK
// ============================================

import { useEffect, useCallback } from 'react';

export function useEventBus() {
  return {
    emit: eventBus.emit.bind(eventBus),
    emitWidget: eventBus.emitWidget.bind(eventBus),
    emitSession: eventBus.emitSession.bind(eventBus),
    emitUser: eventBus.emitUser.bind(eventBus),
    emitError: eventBus.emitError.bind(eventBus),
    emitAI: eventBus.emitAI.bind(eventBus),
    on: eventBus.on.bind(eventBus),
    onAll: eventBus.onAll.bind(eventBus),
    onCategory: eventBus.onCategory.bind(eventBus),
  };
}

/**
 * Hook to subscribe to specific event type
 */
export function useEventSubscription<T extends BaseEvent>(
  eventType: EventType,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
): void {
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    const unsubscribe = eventBus.on(eventType, memoizedHandler);
    return unsubscribe;
  }, [eventType, memoizedHandler]);
}

/**
 * Hook to subscribe to event category
 */
export function useCategorySubscription(
  category: EventCategory,
  handler: EventHandler,
  deps: React.DependencyList = []
): void {
  const memoizedHandler = useCallback(handler, deps);

  useEffect(() => {
    const unsubscribe = eventBus.onCategory(category, memoizedHandler);
    return unsubscribe;
  }, [category, memoizedHandler]);
}
