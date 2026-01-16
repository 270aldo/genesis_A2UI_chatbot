/**
 * GENESIS Voice Engine Types
 *
 * Types for voice mode: WebSocket messages, state management, and audio handling.
 * Based on Gemini Live API integration with bidirectional streaming.
 */

import type { WidgetPayload } from '../types';

// ============================================================================
// Voice States
// ============================================================================

/**
 * Voice session states for UI feedback.
 *
 * - idle: Ready to start, particles floating gently
 * - listening: User is speaking, particles expanding with audio
 * - processing: Gemini processing, particles spinning/condensing
 * - speaking: GENESIS responding, particles pulsing with audio
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

/**
 * Voice session connection states.
 */
export type VoiceConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// ============================================================================
// WebSocket Messages - Client to Server
// ============================================================================

/**
 * Audio chunk message: PCM audio data from microphone.
 */
export interface ClientAudioChunkMessage {
  type: 'audio_chunk';
  data: string; // base64 encoded PCM 16-bit, 16kHz
}

/**
 * End turn message: User finished speaking.
 */
export interface ClientEndTurnMessage {
  type: 'end_turn';
}

/**
 * Cancel message: User interrupted/cancelled.
 */
export interface ClientCancelMessage {
  type: 'cancel';
}

/**
 * All client message types.
 */
export type ClientVoiceMessage =
  | ClientAudioChunkMessage
  | ClientEndTurnMessage
  | ClientCancelMessage;

// ============================================================================
// WebSocket Messages - Server to Client
// ============================================================================

/**
 * Transcript message: Real-time speech-to-text.
 */
export interface ServerTranscriptMessage {
  type: 'transcript';
  text: string;
  final: boolean; // true when transcript is finalized
}

/**
 * Audio chunk message: Audio response from GENESIS.
 */
export interface ServerAudioChunkMessage {
  type: 'audio_chunk';
  data: string; // base64 encoded PCM audio
}

/**
 * State change message: Voice state update.
 */
export interface ServerStateMessage {
  type: 'state';
  value: VoiceState;
}

/**
 * Widget message: A2UI widget payload from voice response.
 */
export interface ServerWidgetMessage {
  type: 'widget';
  payload: WidgetPayload;
}

/**
 * End response message: GENESIS finished responding.
 */
export interface ServerEndResponseMessage {
  type: 'end_response';
}

/**
 * Error message: Server-side error.
 */
export interface ServerErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * Audio level message: For orb animation reactivity.
 */
export interface ServerAudioLevelMessage {
  type: 'audio_level';
  value: number; // 0-1
}

/**
 * All server message types.
 */
export type ServerVoiceMessage =
  | ServerTranscriptMessage
  | ServerAudioChunkMessage
  | ServerStateMessage
  | ServerWidgetMessage
  | ServerEndResponseMessage
  | ServerErrorMessage
  | ServerAudioLevelMessage;

// ============================================================================
// Voice Session
// ============================================================================

/**
 * Voice session state for hook management.
 */
export interface VoiceSessionState {
  connectionState: VoiceConnectionState;
  voiceState: VoiceState;
  transcript: string;
  isUserSpeaking: boolean;
  pendingWidget: WidgetPayload | null;
  error: string | null;
}

/**
 * Voice session callbacks.
 */
export interface VoiceSessionCallbacks {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (text: string, final: boolean) => void;
  onWidget?: (payload: WidgetPayload) => void;
  onError?: (error: string) => void;
  onConnectionChange?: (state: VoiceConnectionState) => void;
}

/**
 * Voice session options.
 */
export interface VoiceSessionOptions {
  wsUrl?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

// ============================================================================
// Audio Processing
// ============================================================================

/**
 * Audio capture configuration.
 */
export interface AudioCaptureConfig {
  sampleRate: number; // Default: 16000 (16kHz)
  channelCount: number; // Default: 1 (mono)
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

/**
 * Default audio config for Gemini Live.
 */
export const DEFAULT_AUDIO_CONFIG: AudioCaptureConfig = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * Audio playback state.
 */
export interface AudioPlaybackState {
  isPlaying: boolean;
  queue: string[]; // base64 audio chunks
  currentChunk: number;
}

// ============================================================================
// Particle Orb
// ============================================================================

/**
 * Particle orb color configuration by state.
 */
export interface OrbColors {
  idle: string;
  listening: string;
  processing: string;
  speaking: string;
}

/**
 * Default orb colors (GENESIS brand).
 */
export const DEFAULT_ORB_COLORS: OrbColors = {
  idle: '#6D00FF', // Genesis Purple
  listening: '#6D00FF', // Brighter on input
  processing: '#A855F7', // Stella Purple
  speaking: '#0EA5E9', // Wave Blue
};

/**
 * Particle orb animation parameters.
 */
export interface OrbAnimationParams {
  particleCount: number;
  baseRadius: number;
  expansionFactor: number; // How much orb expands when listening
  rotationSpeed: number;
  audioReactivity: number; // 0-1, how much audio affects particles
}

/**
 * Default orb animation params.
 */
export const DEFAULT_ORB_PARAMS: OrbAnimationParams = {
  particleCount: 500,
  baseRadius: 120,
  expansionFactor: 1.3,
  rotationSpeed: 0.001,
  audioReactivity: 0.8,
};
