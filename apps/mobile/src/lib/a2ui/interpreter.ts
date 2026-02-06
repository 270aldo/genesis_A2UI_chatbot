/**
 * A2UI Interpreter — processes backend responses with zone-aware operations.
 *
 * Handles:
 * 1. New `operations[]` format (preferred)
 * 2. Legacy `widgets` (A2UI v0.10) format
 * 3. Legacy `payload` format
 */

import { useSurfaceStore } from '../../stores/surface-store';
import type {
  A2UIMessage,
  A2UIOperation,
  BackendResponse,
  ChatMessage,
  InterpretResult,
} from './types';

let _idCounter = 0;
const nextId = () => `msg-${++_idCounter}-${Date.now()}`;

/**
 * Process a backend response: create surfaces in SurfaceStore and return a ChatMessage.
 */
export function interpretResponse(response: BackendResponse): InterpretResult {
  const errors: string[] = [];
  let operationsProcessed = 0;
  let firstStreamSurfaceId: string | undefined;

  const store = useSurfaceStore.getState();

  // 1. Process operations[] if present (new format)
  if (response.operations && response.operations.length > 0) {
    for (const op of response.operations) {
      try {
        if (op.createSurface) {
          const { surfaceId, zone, catalogId } = op.createSurface;
          store.createSurface(surfaceId, zone, catalogId);
          if (zone === 'stream' && !firstStreamSurfaceId) {
            firstStreamSurfaceId = surfaceId;
          }
          operationsProcessed++;
        }

        if (op.updateComponents) {
          const { surfaceId, components } = op.updateComponents;
          if (components.length > 0) {
            store.updateComponents(surfaceId, components[0].type);
          }
          operationsProcessed++;
        }

        if (op.updateDataModel) {
          const { surfaceId, dataModel } = op.updateDataModel;
          store.updateDataModel(surfaceId, dataModel);
          operationsProcessed++;
        }

        if (op.deleteSurface) {
          const { surfaceId } = op.deleteSurface;
          // Special wildcard: delete all surfaces in a zone
          if (surfaceId === '*overlay*') {
            store.clearZone('overlay');
          } else if (surfaceId === '*context*') {
            store.clearZone('context');
          } else {
            store.deleteSurface(surfaceId);
          }
          operationsProcessed++;
        }
      } catch (e) {
        errors.push(`Operation failed: ${String(e)}`);
      }
    }
  } else {
    // 2. Legacy fallback: convert payload/widgets to surface operations
    const legacyResult = convertLegacyFormat(response, store);
    operationsProcessed = legacyResult.operationsProcessed;
    firstStreamSurfaceId = legacyResult.firstStreamSurfaceId;
    errors.push(...legacyResult.errors);
  }

  // 3. Create the chat message (text only, with optional surfaceId reference)
  const message: ChatMessage = {
    id: nextId(),
    role: 'assistant',
    text: response.text,
    agent: response.agent ?? 'GENESIS',
    surfaceId: firstStreamSurfaceId,
    timestamp: new Date().toISOString(),
  };

  return { message, operationsProcessed, errors };
}

/**
 * Convert legacy payload/widgets formats into SurfaceStore operations.
 */
function convertLegacyFormat(
  response: BackendResponse,
  store: ReturnType<typeof useSurfaceStore.getState>,
): { operationsProcessed: number; firstStreamSurfaceId?: string; errors: string[] } {
  const errors: string[] = [];
  let operationsProcessed = 0;
  let firstStreamSurfaceId: string | undefined;

  // Try A2UI v0.10 widgets array first
  if (response.widgets && response.widgets.length > 0) {
    const parsed = parseLegacyWidgets(response.widgets);
    if (parsed) {
      const surfaceId = parsed.surfaceId || generateSurfaceId();
      try {
        store.createSurface(surfaceId, 'stream', parsed.widgetType);
        store.updateDataModel(surfaceId, parsed.dataModel);
        firstStreamSurfaceId = surfaceId;
        operationsProcessed = 2;
      } catch (e) {
        errors.push(`Legacy widgets conversion failed: ${String(e)}`);
      }
    }
    return { operationsProcessed, firstStreamSurfaceId, errors };
  }

  // Fallback to legacy payload
  if (response.payload) {
    const surfaceId = generateSurfaceId();
    try {
      store.createSurface(surfaceId, 'stream', response.payload.type);
      store.updateDataModel(surfaceId, response.payload.props);
      firstStreamSurfaceId = surfaceId;
      operationsProcessed = 2;
    } catch (e) {
      errors.push(`Legacy payload conversion failed: ${String(e)}`);
    }
  }

  return { operationsProcessed, firstStreamSurfaceId, errors };
}

/**
 * Parse legacy A2UI v0.10 messages into widget type + data model.
 */
function parseLegacyWidgets(
  messages: A2UIMessage[],
): { surfaceId?: string; widgetType: string; dataModel: Record<string, unknown> } | undefined {
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

  return { surfaceId, widgetType, dataModel };
}

function generateSurfaceId(): string {
  return `surface-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
