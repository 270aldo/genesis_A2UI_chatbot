import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChat } from '../hooks/useChat';

// Mock the shared API module
jest.mock('@genesis/shared', () => ({
  generateContent: jest.fn(),
}));

const { generateContent } = require('@genesis/shared');

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with empty messages and not loading', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('adds user message immediately on sendMessage', async () => {
    generateContent.mockResolvedValue({
      text: 'Hola!',
      agent: 'GENESIS',
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('test');
    });

    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].text).toBe('test');
  });

  it('calls generateContent and adds assistant response', async () => {
    generateContent.mockResolvedValue({
      text: 'Response from GENESIS',
      agent: 'GENESIS',
      payload: { type: 'quick-actions', props: { actions: [] } },
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('Hola');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.text).toBe('Response from GENESIS');
    expect(assistantMsg.agent).toBe('GENESIS');
    expect(assistantMsg.payload?.type).toBe('quick-actions');
  });

  it('sets isLoading during API call', async () => {
    let resolvePromise: (value: any) => void;
    generateContent.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.sendMessage('test');
    });

    // Should be loading after sending
    expect(result.current.isLoading).toBe(true);

    // Resolve the API call
    await act(async () => {
      resolvePromise!({ text: 'done', agent: 'GENESIS' });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles API errors gracefully', async () => {
    generateContent.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.sendMessage('test');
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    const errorMsg = result.current.messages[1];
    expect(errorMsg.role).toBe('assistant');
    expect(errorMsg.text).toContain('Error');
    expect(result.current.isLoading).toBe(false);
  });

  it('handleAction with quick-action sends the prompt', async () => {
    generateContent.mockResolvedValue({
      text: 'Response',
      agent: 'GENESIS',
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      result.current.handleAction('quick-action', { prompt: 'Dame una rutina' });
    });

    expect(generateContent).toHaveBeenCalledWith(
      'Dame una rutina',
      [],
      expect.any(String),
      'mobile-user'
    );
  });
});
