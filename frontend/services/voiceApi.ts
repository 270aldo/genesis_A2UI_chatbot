/**
 * GENESIS Voice WebSocket Client
 *
 * Manages WebSocket connection to /ws/voice endpoint for real-time
 * bidirectional audio streaming with Gemini Live API.
 */

import type {
  ClientVoiceMessage,
  ServerVoiceMessage,
  VoiceConnectionState,
  VoiceSessionCallbacks,
  VoiceSessionOptions,
} from '../types/voice';

// Default WebSocket URL (uses same host as API)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_URL.replace(/^http/, 'ws');

/**
 * Voice WebSocket client for real-time audio streaming.
 */
export class VoiceWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private callbacks: VoiceSessionCallbacks;
  private options: Required<VoiceSessionOptions>;
  private connectionState: VoiceConnectionState = 'disconnected';

  constructor(
    callbacks: VoiceSessionCallbacks = {},
    options: VoiceSessionOptions = {}
  ) {
    this.callbacks = callbacks;
    this.options = {
      wsUrl: options.wsUrl || `${WS_URL}/ws/voice`,
      autoReconnect: options.autoReconnect ?? false,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 3,
    };
  }

  /**
   * Connect to voice WebSocket endpoint.
   */
  async connect(sessionId?: string, language: string = 'es'): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('VoiceWebSocket: Already connected');
      return;
    }

    this.setConnectionState('connecting');

    // Build URL with query params
    const url = new URL(this.options.wsUrl);
    if (sessionId) url.searchParams.set('session_id', sessionId);
    url.searchParams.set('language', language);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          console.log('VoiceWebSocket: Connected');
          this.reconnectAttempts = 0;
          this.setConnectionState('connected');
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log(`VoiceWebSocket: Closed (code=${event.code})`);
          this.setConnectionState('disconnected');
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('VoiceWebSocket: Error', error);
          this.setConnectionState('error');
          this.callbacks.onError?.('WebSocket connection error');
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        this.setConnectionState('error');
        reject(error);
      }
    });
  }

  /**
   * Disconnect from voice WebSocket.
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
    console.log('VoiceWebSocket: Disconnected');
  }

  /**
   * Send audio chunk to server.
   */
  sendAudioChunk(audioData: string): void {
    this.sendMessage({ type: 'audio_chunk', data: audioData });
  }

  /**
   * Signal end of user's turn (finished speaking).
   */
  sendEndTurn(): void {
    this.sendMessage({ type: 'end_turn' });
  }

  /**
   * Cancel current interaction.
   */
  sendCancel(): void {
    this.sendMessage({ type: 'cancel' });
  }

  /**
   * Check if connected.
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state.
   */
  get state(): VoiceConnectionState {
    return this.connectionState;
  }

  // =========================================================================
  // Private methods
  // =========================================================================

  private sendMessage(message: ClientVoiceMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('VoiceWebSocket: Cannot send - not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    try {
      const message: ServerVoiceMessage = JSON.parse(data);

      switch (message.type) {
        case 'state':
          this.callbacks.onStateChange?.(message.value);
          break;

        case 'transcript':
          this.callbacks.onTranscript?.(message.text, message.final);
          break;

        case 'audio_chunk':
          // Audio chunks are handled by useVoiceSession for playback
          // This is a passthrough for any additional handling
          (this.callbacks as any).onAudioChunk?.(message.data);
          break;

        case 'audio_level':
          (this.callbacks as any).onAudioLevel?.((message as any).value);
          break;

        case 'widget':
          this.callbacks.onWidget?.(message.payload);
          break;

        case 'end_response':
          // Signal that GENESIS finished responding
          (this.callbacks as any).onEndResponse?.();
          break;

        case 'error':
          this.callbacks.onError?.(message.message);
          break;

        default:
          console.warn('VoiceWebSocket: Unknown message type', message);
      }
    } catch (error) {
      console.error('VoiceWebSocket: Failed to parse message', error);
    }
  }

  private setConnectionState(state: VoiceConnectionState): void {
    this.connectionState = state;
    this.callbacks.onConnectionChange?.(state);
  }

  private handleDisconnect(): void {
    if (!this.options.autoReconnect) return;

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.log('VoiceWebSocket: Max reconnect attempts reached');
      this.callbacks.onError?.('Connection lost. Please try again.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(`VoiceWebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('VoiceWebSocket: Reconnect failed', error);
      });
    }, delay);
  }
}

/**
 * Audio utilities for voice processing.
 */
export const audioUtils = {
  /**
   * Encode audio buffer to base64.
   */
  encodeAudioToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Decode base64 to audio buffer.
   */
  decodeBase64ToAudio(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },

  /**
   * Calculate audio level from PCM data (0-1).
   */
  calculateAudioLevel(buffer: ArrayBuffer): number {
    const view = new Int16Array(buffer);
    if (view.length === 0) return 0;

    let sum = 0;
    for (let i = 0; i < view.length; i++) {
      sum += view[i] * view[i];
    }

    const rms = Math.sqrt(sum / view.length);
    return Math.min(1, (rms / 32767) * 1.5);
  },
};

/**
 * Create and return a voice WebSocket client instance.
 */
export function createVoiceClient(
  callbacks: VoiceSessionCallbacks,
  options?: VoiceSessionOptions
): VoiceWebSocketClient {
  return new VoiceWebSocketClient(callbacks, options);
}
