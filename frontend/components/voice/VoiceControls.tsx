/**
 * VoiceControls Component
 *
 * Control buttons for voice mode:
 * - Close button (X) to exit voice mode
 * - Microphone button with push-to-talk behavior
 */

import React from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import type { VoiceState, VoiceConnectionState } from '../../types/voice';
import { COLORS } from '../../constants';

interface VoiceControlsProps {
  voiceState: VoiceState;
  connectionState: VoiceConnectionState;
  isListening: boolean;
  onClose: () => void;
  onMicPress: () => void;
  onMicRelease: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  voiceState,
  connectionState,
  isListening,
  onClose,
  onMicPress,
  onMicRelease,
}) => {
  const isConnected = connectionState === 'connected';
  const isProcessing = voiceState === 'processing';
  const isSpeaking = voiceState === 'speaking';

  // Disable mic while processing or speaking
  const micDisabled = !isConnected || isProcessing || isSpeaking;

  // Get mic button color based on state
  const getMicColor = () => {
    if (!isConnected) return 'rgba(255, 255, 255, 0.2)';
    if (isListening) return COLORS.voiceListening;
    return 'rgba(255, 255, 255, 0.6)';
  };

  // Get mic button background
  const getMicBackground = () => {
    if (isListening) {
      return `rgba(109, 0, 255, 0.3)`;
    }
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div className="flex items-center justify-center gap-6">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-3 rounded-full transition-all duration-200 hover:bg-white/10"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        aria-label="Close voice mode"
      >
        <X size={24} color="rgba(255, 255, 255, 0.7)" />
      </button>

      {/* Microphone Button - Push to Talk */}
      <button
        onMouseDown={!micDisabled ? onMicPress : undefined}
        onMouseUp={!micDisabled ? onMicRelease : undefined}
        onMouseLeave={isListening ? onMicRelease : undefined}
        onTouchStart={!micDisabled ? onMicPress : undefined}
        onTouchEnd={!micDisabled ? onMicRelease : undefined}
        disabled={micDisabled}
        className={`
          p-6 rounded-full transition-all duration-200
          ${micDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          ${isListening ? 'scale-110' : ''}
        `}
        style={{
          background: getMicBackground(),
          border: `2px solid ${getMicColor()}`,
          boxShadow: isListening
            ? `0 0 30px ${COLORS.voiceListening}40, 0 0 60px ${COLORS.voiceListening}20`
            : 'none',
        }}
        aria-label={isListening ? 'Release to stop' : 'Hold to speak'}
      >
        {isConnected ? (
          <Mic
            size={32}
            color={getMicColor()}
            className={isListening ? 'animate-pulse' : ''}
          />
        ) : (
          <MicOff size={32} color={getMicColor()} />
        )}
      </button>

      {/* Placeholder for symmetry */}
      <div className="w-12 h-12" />
    </div>
  );
};

/**
 * Connection status indicator
 */
export const ConnectionStatus: React.FC<{
  state: VoiceConnectionState;
  error?: string | null;
}> = ({ state, error }) => {
  const getStatusColor = () => {
    switch (state) {
      case 'connected':
        return '#22C55E';
      case 'connecting':
        return '#FBBF24';
      case 'error':
        return '#EF4444';
      default:
        return 'rgba(255, 255, 255, 0.4)';
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return error || 'Error de conexión';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${state === 'connecting' ? 'animate-pulse' : ''}`}
        style={{ backgroundColor: getStatusColor() }}
      />
      <span style={{ color: getStatusColor() }}>{getStatusText()}</span>
    </div>
  );
};

/**
 * Voice state hint text
 */
export const VoiceHint: React.FC<{
  voiceState: VoiceState;
  isListening: boolean;
}> = ({ voiceState, isListening }) => {
  const getHintText = () => {
    if (isListening) return 'Suelta para enviar...';
    switch (voiceState) {
      case 'processing':
        return 'Procesando...';
      case 'speaking':
        return 'GENESIS está hablando...';
      default:
        return 'Mantén presionado para hablar';
    }
  };

  return (
    <p
      className="text-center text-sm"
      style={{ color: 'rgba(255, 255, 255, 0.5)' }}
    >
      {getHintText()}
    </p>
  );
};

export default VoiceControls;
