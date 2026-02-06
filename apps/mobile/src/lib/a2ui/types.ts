/**
 * A2UI Protocol v0.10 — Type definitions for mobile client.
 */

export interface A2UICreateSurface {
  surfaceId: string;
  catalogId: string;
}

export interface A2UIComponent {
  type: string;
  id: string;
}

export interface A2UIUpdateComponents {
  surfaceId: string;
  components: A2UIComponent[];
}

export interface A2UIUpdateDataModel {
  surfaceId: string;
  dataModel: Record<string, unknown>;
}

export interface A2UIMessage {
  version: string;
  createSurface?: A2UICreateSurface;
  updateComponents?: A2UIUpdateComponents;
  updateDataModel?: A2UIUpdateDataModel;
}

export type WidgetState = 'active' | 'frozen';

export interface ChatWidget {
  type: string;
  props: Record<string, unknown>;
  state: WidgetState;
  surfaceId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  agent?: string;
  widget?: ChatWidget;
  timestamp: string;
}

export interface ChatEvent {
  type: string;
  payload: Record<string, unknown>;
}
