/**
 * NGX GENESIS A2UI - Widget Queue & Attention Budget
 *
 * REGLA DE ORO: Máx 1 widget "high" visible. Máx 3 widgets totales. Cooldown entre notificaciones.
 *
 * Este sistema previene el "widget spam" que mata a las apps de A2UI.
 * Sin esto, 13 agentes compitiendo = caos visual.
 */

import { v4 as uuid } from 'uuid';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Priority, QueueBehavior, AgentId, WidgetType } from './WidgetContract';
import { getWidgetConfig } from './WidgetRegistry';

// ============================================
// ATTENTION BUDGET CONFIG
// ============================================

export interface AttentionBudgetConfig {
  // Maximum simultaneous widgets
  maxHighPriorityVisible: number;      // Default: 1
  maxMediumPriorityVisible: number;    // Default: 2
  maxTotalVisible: number;             // Default: 3

  // Cooldowns (milliseconds)
  minIntervalBetweenHigh: number;      // Default: 30000 (30s)
  minIntervalBetweenMedium: number;    // Default: 15000 (15s)
  minIntervalBetweenLow: number;       // Default: 5000 (5s)

  // Workout focus mode
  workoutFocusMode: boolean;           // When true, only allow allowDuringWorkout widgets

  // Queue limits
  maxQueueSize: number;                // Default: 20
  defaultTtlMs: number;                // Default: 300000 (5 min)
}

export const DEFAULT_ATTENTION_CONFIG: AttentionBudgetConfig = {
  maxHighPriorityVisible: 1,
  maxMediumPriorityVisible: 2,
  maxTotalVisible: 3,
  minIntervalBetweenHigh: 30000,
  minIntervalBetweenMedium: 15000,
  minIntervalBetweenLow: 5000,
  workoutFocusMode: false,
  maxQueueSize: 20,
  defaultTtlMs: 300000,
};

// ============================================
// WIDGET PAYLOAD TYPE (Simplified for queue)
// ============================================

export interface QueueWidgetPayload {
  widgetId: string;
  widgetType: WidgetType;
  agentId: AgentId;
  priority: Priority;
  position: 'inline' | 'floating' | 'fullscreen' | 'bottom-sheet';
  queueBehavior: QueueBehavior;
  expiresAt?: string;
  ttlSeconds?: number;
  dismissable: boolean;
  autoDismissSeconds?: number;
  sessionId?: string;
  trigger?: string;
  createdAt: string;
  data?: unknown;
}

// ============================================
// QUEUE ITEM TYPE
// ============================================

export interface QueuedWidget {
  id: string;                          // Queue item ID (not widget ID)
  payload: QueueWidgetPayload;
  queuedAt: number;                    // Timestamp when queued
  expiresAt: number;                   // Timestamp when expires
  priority: Priority;
  queueBehavior: QueueBehavior;
  attempts: number;                    // How many times we tried to show it
}

export interface VisibleWidget {
  id: string;                          // Same as payload.widgetId
  payload: QueueWidgetPayload;
  shownAt: number;
  autoDismissAt?: number;
}

// ============================================
// QUEUE STATE
// ============================================

interface QueueState {
  queue: QueuedWidget[];
  visible: VisibleWidget[];
  lastShownByPriority: Record<Priority, number>;
  isWorkoutActive: boolean;
}

// ============================================
// EVENT TYPES
// ============================================

export type WidgetQueueEventType =
  | 'widget_queued'
  | 'widget_shown'
  | 'widget_dismissed'
  | 'widget_completed'
  | 'widget_expired'
  | 'widget_dropped'
  | 'widget_deferred'
  | 'widget_interacted';

export interface WidgetQueueEvent {
  type: WidgetQueueEventType;
  widgetId: string;
  widgetType: WidgetType;
  agentId: AgentId;
  timestamp: string;
  extra?: Record<string, unknown>;
}

export type WidgetQueueEventHandler = (event: WidgetQueueEvent) => void;

// ============================================
// WIDGET QUEUE CLASS
// ============================================

export class WidgetQueue {
  private state: QueueState;
  private config: AttentionBudgetConfig;
  private processInterval: ReturnType<typeof setInterval> | null = null;
  private onVisibleChange: (visible: VisibleWidget[]) => void;
  private eventHandlers: WidgetQueueEventHandler[] = [];

  constructor(
    onVisibleChange: (visible: VisibleWidget[]) => void,
    config: Partial<AttentionBudgetConfig> = {}
  ) {
    this.onVisibleChange = onVisibleChange;
    this.config = { ...DEFAULT_ATTENTION_CONFIG, ...config };

    this.state = {
      queue: [],
      visible: [],
      lastShownByPriority: {
        high: 0,
        medium: 0,
        low: 0,
      },
      isWorkoutActive: false,
    };

    // Start processing queue every 500ms
    this.startProcessing();
  }

  // ==========================================
  // EVENT HANDLING
  // ==========================================

  onEvent(handler: WidgetQueueEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  private emitEvent(
    type: WidgetQueueEventType,
    payload: QueueWidgetPayload,
    extra?: Record<string, unknown>
  ): void {
    const event: WidgetQueueEvent = {
      type,
      widgetId: payload.widgetId,
      widgetType: payload.widgetType,
      agentId: payload.agentId,
      timestamp: new Date().toISOString(),
      extra,
    };
    this.eventHandlers.forEach(handler => handler(event));
  }

  // ==========================================
  // PUBLIC API
  // ==========================================

  /**
   * Enqueue a widget for display
   */
  enqueue(payload: QueueWidgetPayload): void {
    const config = getWidgetConfig(payload.widgetType);
    const now = Date.now();

    // Calculate expiration
    const ttlMs = payload.ttlSeconds
      ? payload.ttlSeconds * 1000
      : (config.defaultTtl ? config.defaultTtl * 1000 : this.config.defaultTtlMs);

    const queuedWidget: QueuedWidget = {
      id: uuid(),
      payload,
      queuedAt: now,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt).getTime() : now + ttlMs,
      priority: payload.priority,
      queueBehavior: payload.queueBehavior,
      attempts: 0,
    };

    // Handle queue behavior
    switch (queuedWidget.queueBehavior) {
      case 'replace':
        // Remove existing widgets of same type
        this.state.queue = this.state.queue.filter(
          w => w.payload.widgetType !== payload.widgetType
        );
        // Also dismiss visible widget of same type
        this.dismissByType(payload.widgetType, 'replaced');
        break;

      case 'stack':
        // Just add to queue (no special handling)
        break;

      case 'defer':
      default:
        // Check if same type already queued or visible
        const existsInQueue = this.state.queue.some(
          w => w.payload.widgetType === payload.widgetType
        );
        const existsVisible = this.state.visible.some(
          w => w.payload.widgetType === payload.widgetType
        );
        if (existsInQueue || existsVisible) {
          // Don't add duplicate
          this.emitEvent('widget_deferred', payload);
          return;
        }
        break;
    }

    // Check queue size limit
    if (this.state.queue.length >= this.config.maxQueueSize) {
      // Remove oldest low priority item
      const lowPriorityIndex = this.state.queue.findIndex(w => w.priority === 'low');
      if (lowPriorityIndex >= 0) {
        const removed = this.state.queue.splice(lowPriorityIndex, 1)[0];
        this.emitEvent('widget_dropped', removed.payload, { reason: 'queue_full' });
      } else {
        // Queue is full of high/medium priority - drop this one
        this.emitEvent('widget_dropped', payload, { reason: 'queue_full' });
        return;
      }
    }

    // Add to queue
    this.state.queue.push(queuedWidget);
    this.emitEvent('widget_queued', payload, {
      queuePosition: this.state.queue.length,
      expiresAt: queuedWidget.expiresAt,
    });

    // Try to process immediately
    this.processQueue();
  }

  /**
   * Dismiss a visible widget
   */
  dismiss(widgetId: string, reason: 'user_action' | 'completed' | 'expired' | 'replaced' | 'error' | 'navigation'): void {
    const index = this.state.visible.findIndex(w => w.id === widgetId);
    if (index < 0) return;

    const widget = this.state.visible[index];
    this.state.visible.splice(index, 1);

    this.emitEvent('widget_dismissed', widget.payload, {
      reason,
      timeVisibleMs: Date.now() - widget.shownAt,
    });

    this.notifyVisibleChange();
    this.processQueue(); // Try to show next widget
  }

  /**
   * Dismiss all visible widgets of a type
   */
  dismissByType(widgetType: WidgetType, reason: 'replaced' | 'navigation'): void {
    const toRemove = this.state.visible.filter(w => w.payload.widgetType === widgetType);
    toRemove.forEach(w => this.dismiss(w.id, reason));
  }

  /**
   * Mark widget as interacted (affects priority for future)
   */
  markInteracted(widgetId: string): void {
    const widget = this.state.visible.find(w => w.id === widgetId);
    if (widget) {
      this.emitEvent('widget_interacted', widget.payload, {
        timeToInteractMs: Date.now() - widget.shownAt,
      });
    }
  }

  /**
   * Mark widget as completed
   */
  markCompleted(widgetId: string, outputData?: Record<string, unknown>): void {
    const widget = this.state.visible.find(w => w.id === widgetId);
    if (widget) {
      this.emitEvent('widget_completed', widget.payload, {
        timeToCompleteMs: Date.now() - widget.shownAt,
        outputData,
      });
      this.dismiss(widgetId, 'completed');
    }
  }

  /**
   * Set workout active state (enables focus mode)
   */
  setWorkoutActive(active: boolean): void {
    this.state.isWorkoutActive = active;

    if (active && this.config.workoutFocusMode) {
      // Dismiss non-workout widgets
      const toRemove = this.state.visible.filter(w => {
        const config = getWidgetConfig(w.payload.widgetType);
        return !config.allowDuringWorkout;
      });
      toRemove.forEach(w => this.dismiss(w.id, 'navigation'));
    }

    this.processQueue();
  }

  /**
   * Clear all widgets (on navigation, logout, etc.)
   */
  clear(): void {
    this.state.visible.forEach(w => this.dismiss(w.id, 'navigation'));
    this.state.queue = [];
  }

  /**
   * Get current visible widgets
   */
  getVisible(): VisibleWidget[] {
    return [...this.state.visible];
  }

  /**
   * Get queue status (for debugging/monitoring)
   */
  getStatus(): {
    queueLength: number;
    visibleCount: number;
    visibleByPriority: Record<Priority, number>;
    oldestQueuedAt: number | null;
  } {
    return {
      queueLength: this.state.queue.length,
      visibleCount: this.state.visible.length,
      visibleByPriority: {
        high: this.state.visible.filter(w => w.payload.priority === 'high').length,
        medium: this.state.visible.filter(w => w.payload.priority === 'medium').length,
        low: this.state.visible.filter(w => w.payload.priority === 'low').length,
      },
      oldestQueuedAt: this.state.queue.length > 0
        ? Math.min(...this.state.queue.map(w => w.queuedAt))
        : null,
    };
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
    }
    this.eventHandlers = [];
  }

  // ==========================================
  // PRIVATE METHODS
  // ==========================================

  private startProcessing(): void {
    this.processInterval = setInterval(() => {
      this.cleanupExpired();
      this.processQueue();
    }, 500);
  }

  private cleanupExpired(): void {
    const now = Date.now();

    // Expire queued widgets
    const expiredQueued = this.state.queue.filter(w => w.expiresAt <= now);
    expiredQueued.forEach(w => {
      this.emitEvent('widget_expired', w.payload, {
        queuedFor: now - w.queuedAt,
        neverShown: true,
      });
    });
    this.state.queue = this.state.queue.filter(w => w.expiresAt > now);

    // Auto-dismiss visible widgets
    const expiredVisible = this.state.visible.filter(w => {
      if (!w.autoDismissAt) return false;
      return w.autoDismissAt <= now;
    });
    expiredVisible.forEach(w => this.dismiss(w.id, 'expired'));
  }

  private processQueue(): void {
    const now = Date.now();

    // Sort queue by priority (high first) then by queuedAt (oldest first)
    this.state.queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.queuedAt - b.queuedAt;
    });

    // Try to show widgets from queue
    for (const queued of [...this.state.queue]) {
      if (this.canShow(queued, now)) {
        this.show(queued, now);
      }
    }
  }

  private canShow(queued: QueuedWidget, now: number): boolean {
    const { priority, payload } = queued;
    const config = getWidgetConfig(payload.widgetType);

    // Check workout focus mode
    if (this.state.isWorkoutActive && this.config.workoutFocusMode) {
      if (!config.allowDuringWorkout) {
        return false;
      }
    }

    // Check priority limits
    const visibleByPriority = {
      high: this.state.visible.filter(w => w.payload.priority === 'high').length,
      medium: this.state.visible.filter(w => w.payload.priority === 'medium').length,
      low: this.state.visible.filter(w => w.payload.priority === 'low').length,
    };

    if (priority === 'high' && visibleByPriority.high >= this.config.maxHighPriorityVisible) {
      return false;
    }

    if (priority === 'medium' && visibleByPriority.medium >= this.config.maxMediumPriorityVisible) {
      return false;
    }

    // Check total limit
    if (this.state.visible.length >= this.config.maxTotalVisible) {
      return false;
    }

    // Check cooldown
    const lastShown = this.state.lastShownByPriority[priority];
    const cooldown = {
      high: this.config.minIntervalBetweenHigh,
      medium: this.config.minIntervalBetweenMedium,
      low: this.config.minIntervalBetweenLow,
    }[priority];

    if (now - lastShown < cooldown) {
      return false;
    }

    return true;
  }

  private show(queued: QueuedWidget, now: number): void {
    // Remove from queue
    this.state.queue = this.state.queue.filter(w => w.id !== queued.id);

    const config = getWidgetConfig(queued.payload.widgetType);

    // Add to visible
    const visible: VisibleWidget = {
      id: queued.payload.widgetId,
      payload: queued.payload,
      shownAt: now,
      autoDismissAt: queued.payload.autoDismissSeconds
        ? now + queued.payload.autoDismissSeconds * 1000
        : config.autoDismissAfter
          ? now + config.autoDismissAfter * 1000
          : undefined,
    };

    this.state.visible.push(visible);
    this.state.lastShownByPriority[queued.priority] = now;

    // Emit event
    this.emitEvent('widget_shown', queued.payload, {
      queueWaitMs: now - queued.queuedAt,
      queuePosition: queued.attempts,
    });

    this.notifyVisibleChange();
  }

  private notifyVisibleChange(): void {
    this.onVisibleChange([...this.state.visible]);
  }
}

// ============================================
// REACT HOOK
// ============================================

export function useWidgetQueue(
  config?: Partial<AttentionBudgetConfig>
): {
  visible: VisibleWidget[];
  enqueue: (payload: QueueWidgetPayload) => void;
  dismiss: (widgetId: string, reason: 'user_action' | 'completed') => void;
  markInteracted: (widgetId: string) => void;
  markCompleted: (widgetId: string, outputData?: Record<string, unknown>) => void;
  setWorkoutActive: (active: boolean) => void;
  clear: () => void;
  status: ReturnType<WidgetQueue['getStatus']>;
  onEvent: (handler: WidgetQueueEventHandler) => () => void;
} {
  const [visible, setVisible] = useState<VisibleWidget[]>([]);
  const queueRef = useRef<WidgetQueue | null>(null);

  useEffect(() => {
    queueRef.current = new WidgetQueue(setVisible, config);
    return () => {
      queueRef.current?.destroy();
    };
  }, [config]);

  const enqueue = useCallback((payload: QueueWidgetPayload) => {
    queueRef.current?.enqueue(payload);
  }, []);

  const dismiss = useCallback((widgetId: string, reason: 'user_action' | 'completed') => {
    queueRef.current?.dismiss(widgetId, reason);
  }, []);

  const markInteracted = useCallback((widgetId: string) => {
    queueRef.current?.markInteracted(widgetId);
  }, []);

  const markCompleted = useCallback((widgetId: string, outputData?: Record<string, unknown>) => {
    queueRef.current?.markCompleted(widgetId, outputData);
  }, []);

  const setWorkoutActive = useCallback((active: boolean) => {
    queueRef.current?.setWorkoutActive(active);
  }, []);

  const clear = useCallback(() => {
    queueRef.current?.clear();
  }, []);

  const onEvent = useCallback((handler: WidgetQueueEventHandler) => {
    return queueRef.current?.onEvent(handler) ?? (() => {});
  }, []);

  const status = useMemo(() => {
    return queueRef.current?.getStatus() ?? {
      queueLength: 0,
      visibleCount: 0,
      visibleByPriority: { high: 0, medium: 0, low: 0 },
      oldestQueuedAt: null,
    };
  }, [visible]);

  return {
    visible,
    enqueue,
    dismiss,
    markInteracted,
    markCompleted,
    setWorkoutActive,
    clear,
    status,
    onEvent,
  };
}
