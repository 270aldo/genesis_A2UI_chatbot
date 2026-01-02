export interface Attachment {
  type: 'image';
  url: string;
  name?: string;
}

export type AgentType = 'NEXUS' | 'BLAZE' | 'MACRO' | 'AQUA' | 'LUNA';

export interface WidgetPayload {
  type: 'workout-card' | 'meal-plan' | 'hydration-tracker' | 'progress-dashboard' | 'supplement-stack' | 'alert-banner' | 'recipe-card' | 'sleep-analysis' | 'timer-widget' | 'quote-card' | 'checklist' | 'daily-checkin' | 'quick-actions';
  props: any;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  agent?: AgentType;
  payload?: WidgetPayload;
  attachments?: Attachment[];
  timestamp: string;
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