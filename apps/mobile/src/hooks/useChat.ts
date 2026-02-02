import { useState, useCallback, useRef } from 'react';
import { Message, generateContent } from '@genesis/shared';

let _idCounter = 0;
const nextId = () => String(++_idCounter);

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef(`mobile-${Date.now()}`).current;

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await generateContent(text, [], sessionId, 'mobile-user');

      const assistantMessage: Message = {
        role: 'assistant',
        text: response.text,
        agent: response.agent,
        payload: response.payload,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        text: 'Error de conexion. Verifica que el backend este corriendo.',
        agent: 'GENESIS',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const handleAction = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      if (action === 'quick-action' && data?.prompt) {
        sendMessage(data.prompt as string);
        return;
      }
      sendMessage(`[action:${action}] ${JSON.stringify(data ?? {})}`);
    },
    [sendMessage]
  );

  return { messages, isLoading, sendMessage, handleAction };
}
