/**
 * A2UI Response Parser — converts backend response to ChatMessage.
 *
 * Handles both legacy `payload` format and A2UI v0.10 `widgets` format.
 */

import type { A2UIMessage, ChatMessage, ChatWidget } from './types';

let _idCounter = 0;
const nextId = () => `msg-${++_idCounter}-${Date.now()}`;

/**
 * Resolve a JSON Pointer path against a data object.
 * e.g. resolvePointer({ workout: { title: "Push" } }, "/workout/title") → "Push"
 */
export function resolvePointer(
  data: Record<string, unknown>,
  pointer: string
): unknown {
  if (!pointer.startsWith('/')) return undefined;
  const parts = pointer.slice(1).split('/');
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Parse A2UI v0.10 messages array into a ChatWidget.
 */
function parseA2UIWidgets(messages: A2UIMessage[]): ChatWidget | undefined {
  let surfaceId: string | undefined;
  let widgetType: string | undefined;
  let dataModel: Record<string, unknown> = {};

  for (const msg of messages) {
    if (msg.createSurface) {
      surfaceId = msg.createSurface.surfaceId;
    }
    if (msg.updateComponents?.components?.length) {
      widgetType = msg.updateComponents.components[0].type;
      if (!surfaceId) surfaceId = msg.updateComponents.surfaceId;
    }
    if (msg.updateDataModel) {
      dataModel = msg.updateDataModel.dataModel as Record<string, unknown>;
      if (!surfaceId) surfaceId = msg.updateDataModel.surfaceId;
    }
  }

  if (!widgetType) return undefined;

  return {
    type: widgetType,
    props: dataModel,
    state: 'active',
    surfaceId,
  };
}

/**
 * Parse a backend response into a ChatMessage.
 *
 * Supports:
 * - A2UI v0.10 widgets array (preferred)
 * - Legacy payload format (fallback)
 */
export function parseResponse(response: {
  text: string;
  agent?: string;
  payload?: { type: string; props: Record<string, unknown> } | null;
  widgets?: A2UIMessage[] | null;
}): ChatMessage {
  let widget: ChatWidget | undefined;

  // Prefer A2UI v0.10 widgets
  if (response.widgets?.length) {
    widget = parseA2UIWidgets(response.widgets);
  }

  // Fallback to legacy payload
  if (!widget && response.payload) {
    widget = {
      type: response.payload.type,
      props: response.payload.props,
      state: 'active',
    };
  }

  return {
    id: nextId(),
    role: 'assistant',
    text: response.text,
    agent: response.agent ?? 'GENESIS',
    widget,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a user ChatMessage.
 */
export function createUserMessage(text: string): ChatMessage {
  return {
    id: nextId(),
    role: 'user',
    text,
    timestamp: new Date().toISOString(),
  };
}
