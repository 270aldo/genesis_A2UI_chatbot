/**
 * GENESIS V3 Types
 *
 * V3 uses unified GENESIS identity - all responses come from "GENESIS".
 * Widget types remain for A2UI rendering but are categorized, not agent-specific.
 */

export interface Attachment {
  type: 'image';
  url: string;
  data?: string; // base64 (no data URI header)
  mimeType?: string;
  name?: string;
  size?: number;
}

/**
 * V3: Single unified agent identity.
 * All backend responses use "GENESIS" regardless of which CORE processed it.
 */
export type AgentType = 'GENESIS';

/**
 * Widget categories for color mapping.
 */
export type WidgetCategory =
  | 'training'
  | 'nutrition'
  | 'recovery'
  | 'habits'
  | 'analytics'
  | 'education';

/**
 * All supported widget types organized by category.
 */
export type WidgetType =
  // Training widgets
  | 'workout-card'
  | 'live-session-tracker'
  | 'workout-complete'
  | 'rest-timer'
  | 'timer-widget'
  | 'plate-calculator'
  | 'cardio-session-tracker'
  | 'hiit-interval-tracker'
  | 'heart-rate-zone'
  | 'equipment-recognition'
  | 'form-analysis'
  // Nutrition widgets
  | 'meal-plan'
  | 'recipe-card'
  | 'smart-grocery-list'
  | 'hydration-reminder'
  | 'hydration-tracker'
  | 'pre-workout-fuel'
  | 'post-workout-window'
  | 'quick-meal-log'
  | 'macro-tracker'
  | 'meal-photo-analysis'
  | 'supplement-stack'
  | 'supplement-timing'
  | 'interaction-checker'
  | 'supplement-recommendation'
  // Recovery widgets
  | 'recovery-score'
  | 'hrv-trend'
  | 'deload-suggestion'
  | 'sleep-analysis'
  | 'pain-report-inline'
  | 'safe-variant'
  | 'mobility-routine'
  | 'body-map'
  | 'cycle-tracker'
  | 'cycle-adjustment'
  | 'hormonal-insights'
  // Habits widgets
  | 'morning-checkin'
  | 'daily-checkin'
  | 'checklist'
  | 'habit-streak'
  | 'habit-tracker'
  | 'breathwork-guide'
  | 'breathwork-cooldown'
  | 'focus-ritual'
  | 'quote-card'
  | 'quick-actions'
  // Analytics widgets
  | 'progress-insight'
  | 'progress-dashboard'
  | 'weekly-summary'
  | 'pr-celebration'
  | 'body-comp-visualizer'
  | 'insight-card'
  // General widgets
  | 'daily-briefing'
  | 'phase-transition'
  | 'season-review'
  | 'next-season-proposal'
  | 'alert-banner'
  // Education widgets
  | 'micro-learning'
  | 'educational-prompt'
  | 'why-this-works';

/**
 * Widget payload for A2UI rendering.
 */
export interface WidgetPayload {
  type: WidgetType;
  props: Record<string, unknown>;
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