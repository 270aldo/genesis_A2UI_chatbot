/**
 * Widget Contract Tests
 *
 * Tests Zod validation schemas for widget payloads.
 */

import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentIdSchema,
  WidgetTypeSchema,
  validateWidgetPayload,
  isKnownWidgetType,
  isKnownAgentId,
  BaseWidgetPayloadSchema,
  MorningCheckinDataSchema,
  WorkoutCardDataSchema,
  RestTimerDataSchema,
} from '../../src/contracts/WidgetContract';

describe('AgentIdSchema', () => {
  it('should accept all 13 valid agent IDs', () => {
    const validAgents = [
      'GENESIS', 'BLAZE', 'SAGE', 'SPARK', 'STELLA', 'LOGOS',
      'TEMPO', 'ATLAS', 'WAVE', 'METABOL', 'MACRO', 'NOVA', 'LUNA',
    ];

    validAgents.forEach((agent) => {
      expect(AgentIdSchema.safeParse(agent).success).toBe(true);
    });
  });

  it('should reject invalid agent IDs', () => {
    const invalidAgents = ['INVALID', 'genesis', 'Blaze', '', null, 123];

    invalidAgents.forEach((agent) => {
      expect(AgentIdSchema.safeParse(agent).success).toBe(false);
    });
  });
});

describe('WidgetTypeSchema', () => {
  it('should accept known widget types', () => {
    const validTypes = [
      'workout-card',
      'meal-plan',
      'daily-checkin',
      'progress-dashboard',
      'morning-checkin',
      'live-session-tracker',
      'rest-timer',
      'cycle-tracker',
    ];

    validTypes.forEach((type) => {
      expect(WidgetTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it('should reject unknown widget types', () => {
    const invalidTypes = ['unknown-widget', 'my-custom-widget', '', null];

    invalidTypes.forEach((type) => {
      expect(WidgetTypeSchema.safeParse(type).success).toBe(false);
    });
  });
});

describe('isKnownWidgetType', () => {
  it('should return true for known widget types', () => {
    expect(isKnownWidgetType('workout-card')).toBe(true);
    expect(isKnownWidgetType('meal-plan')).toBe(true);
    expect(isKnownWidgetType('cycle-tracker')).toBe(true);
  });

  it('should return false for unknown widget types', () => {
    expect(isKnownWidgetType('fake-widget')).toBe(false);
    expect(isKnownWidgetType('')).toBe(false);
  });
});

describe('isKnownAgentId', () => {
  it('should return true for known agent IDs', () => {
    expect(isKnownAgentId('BLAZE')).toBe(true);
    expect(isKnownAgentId('GENESIS')).toBe(true);
    expect(isKnownAgentId('LUNA')).toBe(true);
  });

  it('should return false for unknown agent IDs', () => {
    expect(isKnownAgentId('FAKE')).toBe(false);
    expect(isKnownAgentId('blaze')).toBe(false);
  });
});

describe('BaseWidgetPayloadSchema', () => {
  const createBasePayload = (overrides = {}) => ({
    widgetId: uuidv4(),
    widgetType: 'workout-card',
    agentId: 'BLAZE',
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  it('should validate a minimal valid payload', () => {
    const payload = createBasePayload();
    const result = BaseWidgetPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should apply default values', () => {
    const payload = createBasePayload();
    const result = BaseWidgetPayloadSchema.parse(payload);

    expect(result.priority).toBe('medium');
    expect(result.position).toBe('inline');
    expect(result.dismissable).toBe(true);
    expect(result.queueBehavior).toBe('defer');
  });

  it('should reject invalid widgetId (not UUID)', () => {
    const payload = createBasePayload({ widgetId: 'not-a-uuid' });
    const result = BaseWidgetPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should reject invalid agentId', () => {
    const payload = createBasePayload({ agentId: 'FAKE_AGENT' });
    const result = BaseWidgetPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it('should reject invalid priority', () => {
    const payload = createBasePayload({ priority: 'urgent' });
    const result = BaseWidgetPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});

describe('MorningCheckinDataSchema', () => {
  it('should validate empty object (all optional)', () => {
    const result = MorningCheckinDataSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate with userName', () => {
    const result = MorningCheckinDataSchema.safeParse({
      userName: 'John',
    });
    expect(result.success).toBe(true);
  });

  it('should validate with default values', () => {
    const result = MorningCheckinDataSchema.safeParse({
      defaultValues: {
        sleep: 4,
        energy: 3,
        stress: 2,
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid sleep value (out of range)', () => {
    const result = MorningCheckinDataSchema.safeParse({
      defaultValues: {
        sleep: 10, // max is 5
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('WorkoutCardDataSchema', () => {
  const validWorkoutCard = {
    sessionName: 'Upper Body Power',
    sessionType: 'strength',
    duration: '45 min',
    difficulty: 2,
    exercises: [
      {
        id: '1',
        name: 'Bench Press',
        sets: 4,
        reps: '8-10',
      },
    ],
  };

  it('should validate a complete workout card', () => {
    const result = WorkoutCardDataSchema.safeParse(validWorkoutCard);
    expect(result.success).toBe(true);
  });

  it('should reject invalid sessionType', () => {
    const result = WorkoutCardDataSchema.safeParse({
      ...validWorkoutCard,
      sessionType: 'yoga', // not in enum
    });
    expect(result.success).toBe(false);
  });

  it('should reject difficulty out of range', () => {
    const result = WorkoutCardDataSchema.safeParse({
      ...validWorkoutCard,
      difficulty: 5, // max is 3
    });
    expect(result.success).toBe(false);
  });

  it('should require exercises array', () => {
    const { exercises, ...withoutExercises } = validWorkoutCard;
    const result = WorkoutCardDataSchema.safeParse(withoutExercises);
    expect(result.success).toBe(false);
  });
});

describe('RestTimerDataSchema', () => {
  it('should validate valid rest timer', () => {
    const result = RestTimerDataSchema.safeParse({
      recommendedSeconds: 90,
      currentSeconds: 90,
    });
    expect(result.success).toBe(true);
  });

  it('should apply default autoStart', () => {
    const result = RestTimerDataSchema.parse({
      recommendedSeconds: 60,
      currentSeconds: 60,
    });
    expect(result.autoStart).toBe(true);
  });

  it('should validate with alerts', () => {
    const result = RestTimerDataSchema.safeParse({
      recommendedSeconds: 90,
      currentSeconds: 90,
      alerts: [
        { atSeconds: 10, type: 'prepare' },
        { atSeconds: 0, type: 'go', haptic: 'strong' },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('validateWidgetPayload', () => {
  it('should reject null payload', () => {
    const result = validateWidgetPayload(null);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_PAYLOAD');
  });

  it('should reject payload without widgetType', () => {
    const result = validateWidgetPayload({ someField: 'value' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_PAYLOAD');
  });

  it('should reject unknown widget type', () => {
    const result = validateWidgetPayload({
      widgetType: 'unknown-widget',
      agentId: 'BLAZE',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('UNKNOWN_WIDGET_TYPE');
  });

  it('should validate a complete morning-checkin payload', () => {
    const payload = {
      widgetId: uuidv4(),
      widgetType: 'morning-checkin',
      agentId: 'SPARK',
      createdAt: new Date().toISOString(),
      data: {
        userName: 'Test User',
        showPainInput: true,
      },
    };

    const result = validateWidgetPayload(payload);
    expect(result.success).toBe(true);
    expect(result.data?.widgetType).toBe('morning-checkin');
  });

  it('should reject morning-checkin with wrong agentId', () => {
    const payload = {
      widgetId: uuidv4(),
      widgetType: 'morning-checkin',
      agentId: 'BLAZE', // Should be SPARK
      createdAt: new Date().toISOString(),
      data: {},
    };

    const result = validateWidgetPayload(payload);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_FAILED');
  });
});
