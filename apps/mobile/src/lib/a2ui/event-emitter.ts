/**
 * A2UI Event Emitter — creates ChatEvent objects for macro-actions.
 */

import type { ChatEvent } from './types';

/**
 * Create a widget event for sending to the backend as a macro-action.
 */
export function createWidgetEvent(
  actionName: string,
  context: Record<string, unknown>,
  surfaceId?: string
): ChatEvent {
  return {
    type: actionName,
    payload: {
      ...context,
      ...(surfaceId ? { surfaceId } : {}),
    },
  };
}
