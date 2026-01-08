export interface Attachment {
  type: 'image';
  url: string;
  data?: string; // base64 (no data URI header)
  mimeType?: string;
  name?: string;
  size?: number;
}

// Legacy type - use AgentId from contracts for new code
export type AgentType =
  | 'GENESIS'  // Orchestrator
  | 'BLAZE'    // Strength training
  | 'TEMPO'    // Cardio/HIIT
  | 'ATLAS'    // Mobility/Pain
  | 'WAVE'     // Recovery/HRV
  | 'SAGE'     // Nutrition strategy
  | 'METABOL'  // Metabolic health
  | 'MACRO'    // Nutrition tracking
  | 'NOVA'     // Supplements
  | 'SPARK'    // Habits/Mindset
  | 'STELLA'   // Analytics
  | 'LUNA'     // Hormonal/Cycle
  | 'LOGOS';   // Education

// Legacy WidgetPayload - for backward compatibility
// New code should use validated payloads from contracts/WidgetContract.ts
export interface WidgetPayload {
  type:
    // SPARK widgets
    | 'morning-checkin'
    | 'focus-ritual'
    | 'breathwork-cooldown'
    | 'habit-tracker'
    | 'daily-checkin'
    | 'checklist'
    | 'habit-streak'
    | 'breathwork-guide'
    | 'quote-card'

    // GENESIS widgets
    | 'daily-briefing'
    | 'phase-transition'
    | 'season-review'
    | 'next-season-proposal'
    | 'quick-actions'
    | 'alert-banner'

    // BLAZE widgets
    | 'workout-card'
    | 'live-session-tracker'
    | 'workout-complete'
    | 'rest-timer'
    | 'equipment-recognition'
    | 'form-analysis'
    | 'timer-widget'
    | 'plate-calculator'

    // TEMPO widgets
    | 'cardio-session-tracker'
    | 'hiit-interval-tracker'
    | 'heart-rate-zone'

    // ATLAS widgets
    | 'pain-report-inline'
    | 'safe-variant'
    | 'mobility-routine'
    | 'body-map'

    // WAVE widgets
    | 'recovery-score'
    | 'hrv-trend'
    | 'deload-suggestion'
    | 'sleep-analysis'

    // SAGE widgets
    | 'meal-plan'
    | 'recipe-card'
    | 'smart-grocery-list'

    // MACRO widgets
    | 'hydration-reminder'
    | 'hydration-tracker'
    | 'pre-workout-fuel'
    | 'post-workout-window'
    | 'quick-meal-log'
    | 'macro-tracker'
    | 'meal-photo-analysis'

    // NOVA widgets
    | 'supplement-stack'
    | 'supplement-timing'
    | 'interaction-checker'
    | 'supplement-recommendation'

    // STELLA widgets
    | 'progress-insight'
    | 'progress-dashboard'
    | 'weekly-summary'
    | 'pr-celebration'
    | 'body-comp-visualizer'
    | 'insight-card'

    // LUNA widgets
    | 'cycle-tracker'
    | 'cycle-adjustment'
    | 'hormonal-insights'

    // LOGOS widgets
    | 'micro-learning'
    | 'educational-prompt'
    | 'why-this-works';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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