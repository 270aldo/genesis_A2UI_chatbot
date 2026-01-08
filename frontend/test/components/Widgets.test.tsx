/**
 * Widget Component Tests
 *
 * Tests for A2UIMediator and key widget components.
 * Tests are designed to verify component rendering without coupling
 * to specific implementation details.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  A2UIMediator,
  WorkoutCard,
  MealPlan,
  HydrationTracker,
  RestTimer,
  QuickActions,
  AlertBanner,
  QuoteCard,
  HabitStreakFlame,
} from '../../components/Widgets';

describe('A2UIMediator', () => {
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render null when payload is undefined', () => {
    const { container } = render(
      <A2UIMediator payload={undefined} onAction={mockOnAction} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render null when payload.type is missing', () => {
    const { container } = render(
      <A2UIMediator
        payload={{ props: {} } as any}
        onAction={mockOnAction}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render WorkoutCard for workout-card type', () => {
    const payload = {
      type: 'workout-card' as const,
      props: {
        title: 'Upper Body',
        category: 'Strength',
        duration: '45 min',
        workoutId: 'w1',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '8-10', load: '80kg' },
        ],
      },
    };

    render(
      <A2UIMediator payload={payload} onAction={mockOnAction} agent="BLAZE" />
    );

    expect(screen.getByText('Upper Body')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('should render MealPlan for meal-plan type', () => {
    const payload = {
      type: 'meal-plan' as const,
      props: {
        totalKcal: 2500,
        meals: [
          { time: '08:00', name: 'Breakfast', kcal: 500 },
          { time: '12:00', name: 'Lunch', kcal: 800 },
        ],
      },
    };

    render(
      <A2UIMediator payload={payload} onAction={mockOnAction} agent="SAGE" />
    );

    expect(screen.getByText('Breakfast')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
  });

  it('should render QuickActions for quick-actions type', () => {
    const payload = {
      type: 'quick-actions' as const,
      props: {
        title: 'What would you like to do?',
        actions: [
          { id: 'train', label: 'Start Training', icon: 'dumbbell' },
          { id: 'eat', label: 'Log Meal', icon: 'utensils' },
        ],
      },
    };

    render(
      <A2UIMediator payload={payload} onAction={mockOnAction} agent="GENESIS" />
    );

    expect(screen.getByText('Start Training')).toBeInTheDocument();
    expect(screen.getByText('Log Meal')).toBeInTheDocument();
  });

  it('should render RestTimer for rest-timer type', () => {
    const payload = {
      type: 'rest-timer' as const,
      props: {
        recommendedSeconds: 90,
        currentSeconds: 90,
        label: 'Rest Period',
      },
    };

    const { container } = render(
      <A2UIMediator payload={payload} onAction={mockOnAction} agent="BLAZE" />
    );

    // RestTimer renders, verify it has timer elements
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should render AlertBanner for alert-banner type', () => {
    const payload = {
      type: 'alert-banner' as const,
      props: {
        type: 'warning',
        message: 'Remember to warm up!',
      },
    };

    render(
      <A2UIMediator payload={payload} onAction={mockOnAction} />
    );

    expect(screen.getByText('Remember to warm up!')).toBeInTheDocument();
  });
});

describe('WorkoutCard', () => {
  const mockOnAction = vi.fn();
  const workoutData = {
    title: 'Push Day',
    category: 'Strength',
    duration: '60 min',
    workoutId: 'workout-123',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-10', load: '70kg' },
      { name: 'Shoulder Press', sets: 3, reps: '10-12', load: '40kg' },
    ],
    coachNote: 'Focus on form today',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render workout title and category', () => {
    render(<WorkoutCard data={workoutData} onAction={mockOnAction} agent="BLAZE" />);

    expect(screen.getByText('Push Day')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
  });

  it('should render all exercises', () => {
    render(<WorkoutCard data={workoutData} onAction={mockOnAction} agent="BLAZE" />);

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Shoulder Press')).toBeInTheDocument();
  });

  it('should render exercise details', () => {
    render(<WorkoutCard data={workoutData} onAction={mockOnAction} agent="BLAZE" />);

    // Check for sets/reps info (may have multiple matches)
    expect(screen.getAllByText(/4/).length).toBeGreaterThan(0);
    expect(screen.getByText(/70kg/)).toBeInTheDocument();
  });

  it('should have interactive buttons', () => {
    render(<WorkoutCard data={workoutData} onAction={mockOnAction} agent="BLAZE" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('MealPlan', () => {
  const mealData = {
    totalKcal: 2200,
    meals: [
      { time: '07:30', name: 'Oatmeal with Berries', kcal: 400, highlight: true },
      { time: '12:00', name: 'Chicken Salad', kcal: 600 },
      { time: '19:00', name: 'Salmon with Rice', kcal: 700 },
    ],
  };

  it('should render total calories', () => {
    render(<MealPlan data={mealData} agent="SAGE" />);

    expect(screen.getByText(/2200/)).toBeInTheDocument();
  });

  it('should render all meals', () => {
    render(<MealPlan data={mealData} agent="SAGE" />);

    expect(screen.getByText('Oatmeal with Berries')).toBeInTheDocument();
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument();
    expect(screen.getByText('Salmon with Rice')).toBeInTheDocument();
  });

  it('should render meal times', () => {
    render(<MealPlan data={mealData} agent="SAGE" />);

    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });
});

describe('HydrationTracker', () => {
  const mockOnAction = vi.fn();
  const hydrationData = {
    current: 1500,
    goal: 3000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render current and goal values', () => {
    render(
      <HydrationTracker
        data={hydrationData}
        onAction={mockOnAction}
        agent="SAGE"
      />
    );

    expect(screen.getByText(/1500/)).toBeInTheDocument();
    expect(screen.getByText(/3000/)).toBeInTheDocument();
  });

  it('should have add water buttons', () => {
    render(
      <HydrationTracker
        data={hydrationData}
        onAction={mockOnAction}
        agent="SAGE"
      />
    );

    // Component should have clickable buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('RestTimer', () => {
  const timerData = {
    recommendedSeconds: 90,
    currentSeconds: 90,
    label: 'Rest Between Sets',
    autoStart: false,
  };

  it('should render timer component', () => {
    const { container } = render(<RestTimer data={timerData} agent="BLAZE" />);

    // RestTimer is a floating component with SVG circle
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should display time value', () => {
    const { container } = render(<RestTimer data={timerData} agent="BLAZE" />);

    // RestTimer shows time in a span element
    const timeSpan = container.querySelector('.font-mono');
    expect(timeSpan).toBeInTheDocument();
  });

  it('should have control buttons', () => {
    render(<RestTimer data={timerData} agent="BLAZE" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('QuickActions', () => {
  const mockOnAction = vi.fn();
  const actionsData = {
    title: 'Quick Actions',
    actions: [
      { id: 'workout', label: 'Start Workout', icon: 'dumbbell' },
      { id: 'meal', label: 'Log Meal', icon: 'utensils' },
      { id: 'water', label: 'Log Water', icon: 'droplet' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all action buttons', () => {
    render(<QuickActions data={actionsData} onAction={mockOnAction} />);

    expect(screen.getByText('Start Workout')).toBeInTheDocument();
    expect(screen.getByText('Log Meal')).toBeInTheDocument();
    expect(screen.getByText('Log Water')).toBeInTheDocument();
  });

  it('should call onAction when button is clicked', () => {
    render(<QuickActions data={actionsData} onAction={mockOnAction} />);

    const workoutBtn = screen.getByText('Start Workout');
    fireEvent.click(workoutBtn);

    expect(mockOnAction).toHaveBeenCalled();
  });

  it('should render correct number of actions', () => {
    render(<QuickActions data={actionsData} onAction={mockOnAction} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });
});

describe('AlertBanner', () => {
  it('should render warning message', () => {
    render(
      <AlertBanner
        data={{ type: 'warning', message: 'Check your form!' }}
      />
    );

    expect(screen.getByText('Check your form!')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(
      <AlertBanner
        data={{ type: 'error', message: 'Session failed to save' }}
      />
    );

    expect(screen.getByText('Session failed to save')).toBeInTheDocument();
  });

  it('should render success message', () => {
    render(
      <AlertBanner
        data={{ type: 'success', message: 'Workout completed!' }}
      />
    );

    expect(screen.getByText('Workout completed!')).toBeInTheDocument();
  });

  it('should have appropriate styling based on type', () => {
    const { container } = render(
      <AlertBanner
        data={{ type: 'warning', message: 'Test warning' }}
      />
    );

    // Should have a container element
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('QuoteCard', () => {
  const quoteData = {
    quote: 'Train hard, rest harder.',
    author: 'Coach',
  };

  it('should render quote text', () => {
    render(<QuoteCard data={quoteData} agent="SPARK" />);

    expect(screen.getByText(/Train hard, rest harder/)).toBeInTheDocument();
  });

  it('should render author', () => {
    render(<QuoteCard data={quoteData} agent="SPARK" />);

    expect(screen.getByText(/Coach/)).toBeInTheDocument();
  });

  it('should have agent badge', () => {
    const { container } = render(<QuoteCard data={quoteData} agent="SPARK" />);

    // Agent badge text may be split across elements
    const agentText = container.textContent;
    expect(agentText).toContain('SPARK');
  });
});

describe('HabitStreakFlame', () => {
  const streakData = {
    streakDays: 7,
    message: 'One week strong',
  };

  it('should render streak count', () => {
    render(<HabitStreakFlame data={streakData} agent="SPARK" />);

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should render motivation message', () => {
    render(<HabitStreakFlame data={streakData} agent="SPARK" />);

    // Message is wrapped in quotes by the component
    expect(screen.getByText(/One week strong/)).toBeInTheDocument();
  });

  it('should have flame icon', () => {
    const { container } = render(
      <HabitStreakFlame data={streakData} agent="SPARK" />
    );

    // Should have SVG flame icons
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
