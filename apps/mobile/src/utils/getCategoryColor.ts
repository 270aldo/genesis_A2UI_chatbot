import { WidgetType, WidgetCategory } from '@genesis/shared';
import { COLORS } from '../theme/colors';

const WIDGET_TO_CATEGORY: Record<string, WidgetCategory> = {
  // Training
  'workout-card': 'training',
  'live-session-tracker': 'training',
  'workout-complete': 'training',
  'rest-timer': 'training',
  'timer-widget': 'training',
  'plate-calculator': 'training',
  'cardio-session-tracker': 'training',
  'hiit-interval-tracker': 'training',
  'heart-rate-zone': 'training',
  'equipment-recognition': 'training',
  'form-analysis': 'training',
  // Nutrition
  'meal-plan': 'nutrition',
  'recipe-card': 'nutrition',
  'smart-grocery-list': 'nutrition',
  'hydration-reminder': 'nutrition',
  'hydration-tracker': 'nutrition',
  'pre-workout-fuel': 'nutrition',
  'post-workout-window': 'nutrition',
  'quick-meal-log': 'nutrition',
  'macro-tracker': 'nutrition',
  'meal-photo-analysis': 'nutrition',
  'supplement-stack': 'nutrition',
  'supplement-timing': 'nutrition',
  'interaction-checker': 'nutrition',
  'supplement-recommendation': 'nutrition',
  // Recovery
  'recovery-score': 'recovery',
  'hrv-trend': 'recovery',
  'deload-suggestion': 'recovery',
  'sleep-analysis': 'recovery',
  'pain-report-inline': 'recovery',
  'safe-variant': 'recovery',
  'mobility-routine': 'recovery',
  'body-map': 'recovery',
  'cycle-tracker': 'recovery',
  'cycle-adjustment': 'recovery',
  'hormonal-insights': 'recovery',
  // Habits
  'morning-checkin': 'habits',
  'daily-checkin': 'habits',
  'checklist': 'habits',
  'habit-streak': 'habits',
  'habit-tracker': 'habits',
  'breathwork-guide': 'habits',
  'breathwork-cooldown': 'habits',
  'focus-ritual': 'habits',
  'quote-card': 'habits',
  'quick-actions': 'habits',
  // Analytics
  'progress-insight': 'analytics',
  'progress-dashboard': 'analytics',
  'weekly-summary': 'analytics',
  'pr-celebration': 'analytics',
  'body-comp-visualizer': 'analytics',
  'insight-card': 'analytics',
  // General
  'daily-briefing': 'analytics',
  'phase-transition': 'analytics',
  'season-review': 'analytics',
  'next-season-proposal': 'analytics',
  'alert-banner': 'education',
  // Education
  'micro-learning': 'education',
  'educational-prompt': 'education',
  'why-this-works': 'education',
  // V3 Core
  'genesis-quick-actions': 'habits',
  'readiness-checkin': 'recovery',
  'plan-card': 'training',
  'live-tracker': 'training',
  'weekly-review-dashboard': 'analytics',
};

export const getCategoryForWidget = (type: WidgetType): WidgetCategory =>
  WIDGET_TO_CATEGORY[type] ?? 'education';

export const getColorForWidget = (type: WidgetType): string => {
  const category = getCategoryForWidget(type);
  return COLORS[category];
};
