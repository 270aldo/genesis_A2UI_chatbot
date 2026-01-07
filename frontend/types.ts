export interface Attachment {
  type: 'image';
  url: string;
  data?: string; // base64 (no data URI header)
  mimeType?: string;
  name?: string;
  size?: number;
}

export type AgentType = 'GENESIS' | 'BLAZE' | 'SAGE' | 'SPARK' | 'STELLA' | 'LOGOS';

export interface WidgetPayload {
  type: 'workout-card' | 'meal-plan' | 'hydration-tracker' | 'progress-dashboard' | 'supplement-stack' | 'alert-banner' | 'recipe-card' | 'sleep-analysis' | 'timer-widget' | 'quote-card' | 'checklist' | 'daily-checkin' | 'quick-actions' | 'live-session-tracker' | 'smart-grocery-list' | 'body-comp-visualizer' | 'plate-calculator' | 'habit-streak' | 'breathwork-guide';
  props: any;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  agent?: AgentType;
  payload?: WidgetPayload;
  attachments?: Attachment[];
  timestamp: string;
  isHidden?: boolean;
}

export interface GeminiResponse {
  text: string;
  agent: AgentType;
  payload?: WidgetPayload;
}

export interface Session {
  id: string;
  title: string;
  date: string; // ISO String
  preview: string;
}