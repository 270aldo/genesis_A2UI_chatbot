/**
 * NGX GENESIS A2UI - useAttentionBudget Hook
 *
 * Manages attention budget configuration and workout focus mode.
 * Connects WidgetQueue events to EventBus for telemetry.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AttentionBudgetConfig,
  DEFAULT_ATTENTION_CONFIG,
  useWidgetQueue,
  QueueWidgetPayload,
  VisibleWidget,
  WidgetQueueEvent,
} from '../contracts/WidgetQueue';
import { eventBus } from '../services/events';

// ============================================
// TYPES
// ============================================

export interface AttentionBudgetState {
  isWorkoutActive: boolean;
  workoutSessionId: string | null;
  config: AttentionBudgetConfig;
}

export interface UseAttentionBudgetReturn {
  // Widget Queue API
  visible: VisibleWidget[];
  enqueue: (payload: QueueWidgetPayload) => void;
  dismiss: (widgetId: string, reason?: 'user_action' | 'completed') => void;
  markInteracted: (widgetId: string) => void;
  markCompleted: (widgetId: string, outputData?: Record<string, unknown>) => void;
  clear: () => void;

  // Attention Budget API
  state: AttentionBudgetState;
  startWorkout: (sessionId: string) => void;
  endWorkout: () => void;
  updateConfig: (config: Partial<AttentionBudgetConfig>) => void;

  // Status
  queueLength: number;
  visibleCount: number;
  canShowMore: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useAttentionBudget(
  initialConfig?: Partial<AttentionBudgetConfig>
): UseAttentionBudgetReturn {
  // State for attention budget
  const [budgetState, setBudgetState] = useState<AttentionBudgetState>({
    isWorkoutActive: false,
    workoutSessionId: null,
    config: { ...DEFAULT_ATTENTION_CONFIG, ...initialConfig },
  });

  // Use the widget queue with current config
  const {
    visible,
    enqueue: queueEnqueue,
    dismiss: queueDismiss,
    markInteracted,
    markCompleted,
    setWorkoutActive,
    clear,
    status,
    onEvent,
  } = useWidgetQueue(budgetState.config);

  // Track if we've connected to event bus
  const eventBusConnected = useRef(false);

  // Connect queue events to EventBus for telemetry
  useEffect(() => {
    if (eventBusConnected.current) return;
    eventBusConnected.current = true;

    const unsubscribe = onEvent((event: WidgetQueueEvent) => {
      // Map queue events to EventBus events
      eventBus.emitWidget(
        event.type,
        event.widgetId,
        event.widgetType,
        event.agentId,
        event.extra as Record<string, unknown> | undefined
      );
    });

    return () => {
      unsubscribe();
      eventBusConnected.current = false;
    };
  }, [onEvent]);

  // Start workout mode
  const startWorkout = useCallback((sessionId: string) => {
    setBudgetState(prev => ({
      ...prev,
      isWorkoutActive: true,
      workoutSessionId: sessionId,
      config: {
        ...prev.config,
        workoutFocusMode: true,
      },
    }));
    setWorkoutActive(true);

    // Emit session event
    eventBus.emitSession('session_started', sessionId);
  }, [setWorkoutActive]);

  // End workout mode
  const endWorkout = useCallback(() => {
    const sessionId = budgetState.workoutSessionId;

    setBudgetState(prev => ({
      ...prev,
      isWorkoutActive: false,
      workoutSessionId: null,
      config: {
        ...prev.config,
        workoutFocusMode: false,
      },
    }));
    setWorkoutActive(false);

    // Emit session event
    if (sessionId) {
      eventBus.emitSession('session_completed', sessionId);
    }
  }, [budgetState.workoutSessionId, setWorkoutActive]);

  // Update config
  const updateConfig = useCallback((config: Partial<AttentionBudgetConfig>) => {
    setBudgetState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        ...config,
      },
    }));
  }, []);

  // Enhanced enqueue that validates and adds context
  const enqueue = useCallback((payload: QueueWidgetPayload) => {
    // Add session context if in workout
    const enrichedPayload: QueueWidgetPayload = {
      ...payload,
      sessionId: budgetState.isWorkoutActive ? budgetState.workoutSessionId ?? undefined : undefined,
    };

    queueEnqueue(enrichedPayload);
  }, [queueEnqueue, budgetState.isWorkoutActive, budgetState.workoutSessionId]);

  // Enhanced dismiss that defaults reason
  const dismiss = useCallback((widgetId: string, reason: 'user_action' | 'completed' = 'user_action') => {
    queueDismiss(widgetId, reason);
  }, [queueDismiss]);

  // Calculate if we can show more widgets
  const canShowMore = status.visibleCount < budgetState.config.maxTotalVisible;

  return {
    // Widget Queue API
    visible,
    enqueue,
    dismiss,
    markInteracted,
    markCompleted,
    clear,

    // Attention Budget API
    state: budgetState,
    startWorkout,
    endWorkout,
    updateConfig,

    // Status
    queueLength: status.queueLength,
    visibleCount: status.visibleCount,
    canShowMore,
  };
}

// ============================================
// PRESET CONFIGURATIONS
// ============================================

/**
 * Strict attention config - minimal distractions
 */
export const STRICT_ATTENTION_CONFIG: Partial<AttentionBudgetConfig> = {
  maxHighPriorityVisible: 1,
  maxMediumPriorityVisible: 1,
  maxTotalVisible: 2,
  minIntervalBetweenHigh: 60000, // 1 min
  minIntervalBetweenMedium: 30000, // 30s
  minIntervalBetweenLow: 15000, // 15s
  workoutFocusMode: true,
};

/**
 * Relaxed attention config - more widgets allowed
 */
export const RELAXED_ATTENTION_CONFIG: Partial<AttentionBudgetConfig> = {
  maxHighPriorityVisible: 2,
  maxMediumPriorityVisible: 3,
  maxTotalVisible: 5,
  minIntervalBetweenHigh: 15000, // 15s
  minIntervalBetweenMedium: 5000, // 5s
  minIntervalBetweenLow: 2000, // 2s
  workoutFocusMode: false,
};
