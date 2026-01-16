/**
 * VoiceTranscript Component
 *
 * Displays real-time speech-to-text transcript during voice interaction.
 * Shows both user speech (while listening) and GENESIS response (while speaking).
 */

import React, { useEffect, useRef } from 'react';
import type { VoiceState } from '../../types/voice';
import { COLORS } from '../../constants';

interface VoiceTranscriptProps {
  transcript: string;
  voiceState: VoiceState;
  isListening: boolean;
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  transcript,
  voiceState,
  isListening,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  // Determine text color based on state
  const getTextColor = () => {
    if (isListening) return COLORS.voiceListening;
    if (voiceState === 'speaking') return COLORS.voiceSpeaking;
    return 'rgba(255, 255, 255, 0.7)';
  };

  // Determine label
  const getLabel = () => {
    if (isListening) return 'Tú';
    if (voiceState === 'speaking') return 'GENESIS';
    if (voiceState === 'processing') return 'Procesando';
    return '';
  };

  // Don't render if no transcript
  if (!transcript && voiceState === 'idle') {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto px-4"
      style={{
        maxHeight: '150px',
        overflowY: 'auto',
      }}
    >
      {/* Label */}
      {getLabel() && (
        <div
          className="text-xs font-medium mb-2 uppercase tracking-wider"
          style={{ color: getTextColor() }}
        >
          {getLabel()}
        </div>
      )}

      {/* Transcript Text */}
      <div
        className="text-lg leading-relaxed transition-colors duration-300"
        style={{ color: getTextColor() }}
      >
        {transcript || (voiceState === 'processing' && (
          <ProcessingIndicator />
        ))}
      </div>
    </div>
  );
};

/**
 * Animated processing indicator
 */
const ProcessingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{
            backgroundColor: COLORS.voiceProcessing,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Conversation history for voice mode
 * Shows previous exchanges in a scrollable list
 */
export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface VoiceHistoryProps {
  messages: VoiceMessage[];
}

export const VoiceHistory: React.FC<VoiceHistoryProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="w-full max-w-lg mx-auto px-4 space-y-4"
      style={{
        maxHeight: '200px',
        overflowY: 'auto',
      }}
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <span
            className="inline-block px-3 py-2 rounded-lg"
            style={{
              backgroundColor:
                msg.role === 'user'
                  ? 'rgba(109, 0, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.05)',
              color:
                msg.role === 'user'
                  ? COLORS.voiceListening
                  : 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {msg.text}
          </span>
        </div>
      ))}
    </div>
  );
};

export default VoiceTranscript;
