/**
 * useVoiceSession Hook
 *
 * Manages voice mode state, audio capture/playback, and WebSocket communication.
 * Provides a complete interface for voice interaction with GENESIS.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { WidgetPayload } from '../types';
import type {
  VoiceState,
  VoiceConnectionState,
  DEFAULT_AUDIO_CONFIG,
} from '../types/voice';
import { VoiceWebSocketClient, audioUtils } from '../services/voiceApi';

// Audio configuration
const AUDIO_CONFIG = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

// Chunk sending interval (ms)
const CHUNK_INTERVAL = 100;

export interface UseVoiceSessionReturn {
  // State
  connectionState: VoiceConnectionState;
  voiceState: VoiceState;
  transcript: string;
  audioLevel: number;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;

  // Status
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}

export interface UseVoiceSessionOptions {
  onWidgetReceived?: (payload: WidgetPayload) => void;
  sessionId?: string;
  userId?: string;
  language?: string;
}

/**
 * Hook for managing voice session with GENESIS.
 */
export function useVoiceSession(options: UseVoiceSessionOptions = {}): UseVoiceSessionReturn {
  const { onWidgetReceived, sessionId, userId, language = 'es' } = options;

  // State
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('disconnected');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling
  const wsClientRef = useRef<VoiceWebSocketClient | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  /**
   * Connect to voice WebSocket.
   */
  const connect = useCallback(async () => {
    if (wsClientRef.current?.isConnected) {
      return;
    }

    setError(null);

    const client = new VoiceWebSocketClient(
      {
        onConnectionChange: setConnectionState,
        onStateChange: setVoiceState,
        onTranscript: (text, final) => {
          if (final) {
            setTranscript(text);
          } else {
            setTranscript((prev) => prev + text);
          }
        },
        onWidget: (payload) => {
          onWidgetReceived?.(payload);
        },
        onError: (err) => {
          setError(err);
        },
        // Extended callbacks via any cast
        onAudioChunk: (base64: string) => {
          const buffer = audioUtils.decodeBase64ToAudio(base64);
          audioQueueRef.current.push(buffer);
          playNextChunk();
        },
        onAudioLevel: (level: number) => {
          setAudioLevel(level);
        },
        onEndResponse: () => {
          setTranscript('');
        },
      } as any,
      { autoReconnect: true }
    );

    wsClientRef.current = client;

    try {
      await client.connect(sessionId, language, userId);
    } catch (err) {
      setError('Failed to connect to voice service');
      throw err;
    }
  }, [sessionId, userId, language, onWidgetReceived]);

  /**
   * Disconnect from voice WebSocket.
   */
  const disconnect = useCallback(() => {
    stopListening();

    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }

    // Cleanup audio contexts
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    setConnectionState('disconnected');
    setVoiceState('idle');
    setTranscript('');
    setAudioLevel(0);
  }, []);

  /**
   * Start capturing and sending audio.
   */
  const startListening = useCallback(async () => {
    if (!wsClientRef.current?.isConnected) {
      throw new Error('Not connected to voice service');
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_CONFIG.sampleRate,
          channelCount: AUDIO_CONFIG.channelCount,
          echoCancellation: AUDIO_CONFIG.echoCancellation,
          noiseSuppression: AUDIO_CONFIG.noiseSuppression,
          autoGainControl: AUDIO_CONFIG.autoGainControl,
        },
      });

      mediaStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: AUDIO_CONFIG.sampleRate });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessor for audio data access
      // Note: ScriptProcessor is deprecated but AudioWorklet requires more setup
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Convert float32 to int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Calculate local audio level for immediate feedback
        const level = audioUtils.calculateAudioLevel(pcmData.buffer);
        setAudioLevel(level);

        // Send to server
        const base64 = audioUtils.encodeAudioToBase64(pcmData.buffer);
        wsClientRef.current?.sendAudioChunk(base64);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setVoiceState('listening');
    } catch (err) {
      console.error('Failed to start audio capture:', err);
      setError('Failed to access microphone');
      throw err;
    }
  }, []);

  /**
   * Stop capturing audio and signal end of turn.
   */
  const stopListening = useCallback(() => {
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Signal end of turn to server
    wsClientRef.current?.sendEndTurn();

    setAudioLevel(0);
  }, []);

  /**
   * Play next audio chunk from queue.
   */
  const playNextChunk = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;

    // Initialize playback context if needed
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({ sampleRate: 16000 }); // ElevenLabs pcm_16000
    }

    const context = playbackContextRef.current;

    while (audioQueueRef.current.length > 0) {
      const buffer = audioQueueRef.current.shift()!;

      try {
        // Convert PCM to AudioBuffer
        const pcm = new Int16Array(buffer);
        const audioBuffer = context.createBuffer(1, pcm.length, 16000);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < pcm.length; i++) {
          channelData[i] = pcm[i] / 32768;
        }

        // Play the chunk
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);

        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      } catch (err) {
        console.error('Error playing audio chunk:', err);
      }
    }

    isPlayingRef.current = false;
  }, []);

  return {
    // State
    connectionState,
    voiceState,
    transcript,
    audioLevel,
    error,

    // Actions
    connect,
    disconnect,
    startListening,
    stopListening,

    // Status
    isConnected: connectionState === 'connected',
    isListening: voiceState === 'listening',
    isSpeaking: voiceState === 'speaking',
  };
}

export default useVoiceSession;
