/**
 * NGX GENESIS A2UI - Events Module
 *
 * Export all event-related functionality
 */

export {
  // Event types
  type EventCategory,
  type WidgetEventType,
  type SessionEventType,
  type UserEventType,
  type NavigationEventType,
  type AIEventType,
  type EventType,

  // Event interfaces
  type BaseEvent,
  type WidgetEvent,
  type SessionEvent,
  type UserEvent,
  type NavigationEvent,
  type AIEvent,
  type ErrorEvent,
  type PerformanceEvent,
  type TypedEvent,

  // Handler types
  type EventHandler,
  type UnsubscribeFn,

  // EventBus class and singleton
  EventBus,
  eventBus,

  // React hooks
  useEventBus,
  useEventSubscription,
  useCategorySubscription,
} from './EventBus';

export {
  // Telemetry config
  type TelemetryConfig,

  // Telemetry service class and singleton
  TelemetryService,
  telemetryService,

  // React hooks
  useTelemetry,
  useScreenTracking,
} from './TelemetryService';
