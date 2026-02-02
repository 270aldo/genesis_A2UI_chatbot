import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { A2UIMediator, registerWidget } from '../components/widgets/A2UIMediator';
import { WidgetPayload } from '@genesis/shared';

// Register a test widget
const TestWidget: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <Text testID="test-widget">{data.message || 'test widget'}</Text>
);

beforeAll(() => {
  registerWidget('test-widget', TestWidget);
});

describe('A2UIMediator', () => {
  it('renders null for empty payload', () => {
    const { toJSON } = render(
      <A2UIMediator payload={null as any} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders null for payload without type', () => {
    const { toJSON } = render(
      <A2UIMediator payload={{} as any} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders FallbackWidget for unknown type', () => {
    const payload: WidgetPayload = {
      type: 'unknown-type' as any,
      props: {},
    };
    render(<A2UIMediator payload={payload} />);
    expect(screen.getByText('unknown-type')).toBeTruthy();
    expect(screen.getByText('Widget not yet available on mobile')).toBeTruthy();
  });

  it('renders registered widget for known type', () => {
    const payload: WidgetPayload = {
      type: 'test-widget' as any,
      props: { message: 'hello from test' },
    };
    render(<A2UIMediator payload={payload} />);
    expect(screen.getByText('hello from test')).toBeTruthy();
  });

  it('passes onAction to rendered widget', () => {
    const onAction = jest.fn();
    const ActionWidget: React.FC<{
      data: Record<string, any>;
      onAction?: (a: string) => void;
    }> = ({ onAction: oa }) => {
      oa?.('test-action');
      return <Text>action widget</Text>;
    };

    registerWidget('action-widget', ActionWidget);

    const payload: WidgetPayload = {
      type: 'action-widget' as any,
      props: {},
    };
    render(<A2UIMediator payload={payload} onAction={onAction} />);
    expect(onAction).toHaveBeenCalledWith('test-action');
  });
});
