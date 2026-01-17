/**
 * VoiceMode Component
 *
 * Full-screen voice interaction mode for GENESIS.
 * Combines ParticleOrb, VoiceControls, and VoiceTranscript into
 * an immersive voice-first experience.
 */

import React, { useEffect, useCallback } from 'react';
import { ParticleOrb } from './ParticleOrb';
import { VoiceControls, ConnectionStatus, VoiceHint } from './VoiceControls';
import { VoiceTranscript } from './VoiceTranscript';
import { useVoiceSession } from '../../hooks/useVoiceSession';
import type { WidgetPayload } from '../../types';
import { COLORS } from '../../constants';

interface VoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onWidgetReceived?: (payload: WidgetPayload) => void;
  sessionId?: string;
  userId?: string;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({
  isOpen,
  onClose,
  onWidgetReceived,
  sessionId,
  userId,
}) => {
  const {
    connectionState,
    voiceState,
    transcript,
    audioLevel,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    isConnected,
    isListening,
  } = useVoiceSession({
    onWidgetReceived,
    sessionId,
    userId,
    language: 'es',
  });

  // Connect when opened, disconnect when closed
  useEffect(() => {
    if (isOpen) {
      connect().catch((err) => {
        console.error('Failed to connect voice session:', err);
      });
    } else {
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  // Handle close with cleanup
  const handleClose = useCallback(() => {
    disconnect();
    onClose();
  }, [disconnect, onClose]);

  // Handle mic press (start listening)
  const handleMicPress = useCallback(() => {
    startListening().catch((err) => {
      console.error('Failed to start listening:', err);
    });
  }, [startListening]);

  // Handle mic release (stop listening)
  const handleMicRelease = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: COLORS.bg,
        backgroundImage: `
          radial-gradient(circle at 50% 30%, ${COLORS.genesis}15 0%, transparent 50%),
          radial-gradient(circle at 50% 70%, ${COLORS.voiceSpeaking}10 0%, transparent 40%)
        `,
      }}
    >
      {/* Header with connection status */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* GENESIS Logo/Text */}
          <span
            className="text-xl font-bold"
            style={{ color: COLORS.genesis }}
          >
            GENESIS
          </span>
          <span
            className="text-sm"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            Voice Mode
          </span>
        </div>

        <ConnectionStatus state={connectionState} error={error} />
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        {/* Particle Orb */}
        <div className="relative">
          <ParticleOrb
            state={voiceState}
            audioLevel={audioLevel}
            size="large"
          />
        </div>

        {/* Transcript area */}
        <div className="h-32 flex items-center justify-center">
          <VoiceTranscript
            transcript={transcript}
            voiceState={voiceState}
            isListening={isListening}
          />
        </div>
      </main>

      {/* Footer with controls */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-center gap-4">
        <VoiceHint voiceState={voiceState} isListening={isListening} />

        <VoiceControls
          voiceState={voiceState}
          connectionState={connectionState}
          isListening={isListening}
          onClose={handleClose}
          onMicPress={handleMicPress}
          onMicRelease={handleMicRelease}
        />
      </footer>

      {/* Error toast */}
      {error && (
        <div
          className="absolute bottom-32 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
          }}
        >
          <p className="text-sm" style={{ color: '#EF4444' }}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Voice mode trigger button for the main chat interface
 */
interface VoiceButtonProps {
  onClick: () => void;
  size?: 'small' | 'large';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onClick,
  size = 'small',
}) => {
  const iconSize = size === 'large' ? 24 : 20;
  const padding = size === 'large' ? 'p-4' : 'p-3';

  return (
    <button
      onClick={onClick}
      className={`${padding} rounded-full transition-all duration-200 hover:scale-105`}
      style={{
        background: `linear-gradient(135deg, ${COLORS.genesis}40, ${COLORS.genesis}20)`,
        border: `1px solid ${COLORS.genesis}60`,
        boxShadow: `0 0 20px ${COLORS.genesis}30`,
      }}
      aria-label="Activar modo de voz"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={COLORS.genesis}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    </button>
  );
};

export default VoiceMode;
