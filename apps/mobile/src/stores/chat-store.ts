import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkv';
import { API_BASE } from '../services/config';
import type { ChatEvent, ChatMessage } from '../lib/a2ui/types';
import { createUserMessage } from '../lib/a2ui/parser';
import { interpretResponse } from '../lib/a2ui/interpreter';
import { useSurfaceStore } from './surface-store';

const MAX_PERSISTED_MESSAGES = 50;

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string;

  sendMessage: (text: string) => Promise<void>;
  sendEvent: (event: ChatEvent, messageText?: string) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
  freezeActiveWidget: () => void;
  updateWidget: (messageId: string, updates: Partial<ChatMessage['widget']>) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      sessionId: `mobile-${Date.now()}`,

      sendMessage: async (text) => {
        const userMsg = createUserMessage(text);
        set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              session_id: get().sessionId,
              user_id: 'mobile-user',
            }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const result = interpretResponse(data);

          set((s) => ({ messages: [...s.messages, result.message] }));

          if (result.errors.length > 0) {
            console.warn('[chat-store] interpreter errors:', result.errors);
          }
        } catch (e) {
          console.error('[chat-store] sendMessage failed:', e);
          const errMsg: ChatMessage = {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text: 'Error de conexion. Verifica que el backend este corriendo.',
            agent: 'GENESIS',
            timestamp: new Date().toISOString(),
          };
          set((s) => ({ messages: [...s.messages, errMsg] }));
        } finally {
          set({ isLoading: false });
        }
      },

      sendEvent: async (event, messageText) => {
        const text = messageText || '';
        if (text) {
          const userMsg = createUserMessage(text);
          set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));
        } else {
          set({ isLoading: true });
        }

        try {
          const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text || `[event:${event.type}]`,
              session_id: get().sessionId,
              user_id: 'mobile-user',
              event,
            }),
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const result = interpretResponse(data);

          set((s) => ({ messages: [...s.messages, result.message] }));

          if (result.errors.length > 0) {
            console.warn('[chat-store] interpreter errors:', result.errors);
          }
        } catch (e) {
          console.error('[chat-store] sendEvent failed:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      addMessage: (msg) => {
        set((s) => ({ messages: [...s.messages, msg] }));
      },

      // Backward compat: freeze widgets embedded in old persisted messages
      freezeActiveWidget: () => {
        set((s) => ({
          messages: s.messages.map((msg) => {
            if (msg.widget?.state === 'active') {
              return {
                ...msg,
                widget: { ...msg.widget, state: 'frozen' as const },
              };
            }
            return msg;
          }),
        }));
      },

      // Backward compat: update widgets embedded in old persisted messages
      updateWidget: (messageId, updates) => {
        set((s) => ({
          messages: s.messages.map((msg) => {
            if (msg.id === messageId && msg.widget) {
              return {
                ...msg,
                widget: { ...msg.widget, ...updates },
              };
            }
            return msg;
          }),
        }));
      },

      clearMessages: () => {
        useSurfaceStore.getState().clearZone('stream');
        set({ messages: [], sessionId: `mobile-${Date.now()}` });
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
        sessionId: state.sessionId,
      }),
    }
  )
);
