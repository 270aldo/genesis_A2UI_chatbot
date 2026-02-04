import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';

// --- Types ---

export interface BreathPattern {
  inhale: number;
  hold: number;
  exhale: number;
}

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

interface BreathSessionProps {
  pattern?: BreathPattern;
  onComplete?: () => void;
}

// --- Constants ---

const MIND_ACCENT = '#A855F7';

const DEFAULT_PATTERN: BreathPattern = {
  inhale: 4,
  hold: 4,
  exhale: 6,
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  idle: 'Listo',
  inhale: 'Inhala...',
  hold: 'Mantener...',
  exhale: 'Exhala...',
};

// --- Helper ---

const getPhaseSequence = (): BreathPhase[] => ['inhale', 'hold', 'exhale'];

// --- Breath Circle ---

const BreathCircle: React.FC<{
  phase: BreathPhase;
  secondsLeft: number;
  phaseDuration: number;
}> = ({ phase, secondsLeft, phaseDuration }) => {
  const isInhale = phase === 'inhale';
  const isExhale = phase === 'exhale';
  const isHold = phase === 'hold';
  const isIdle = phase === 'idle';

  // Compute scale based on phase:
  //   inhale: grow from 1.0 to 1.4 as time progresses
  //   hold: stay at 1.4
  //   exhale: shrink from 1.4 to 1.0 as time progresses
  //   idle: 1.0
  let scale = 1;
  if (isInhale && phaseDuration > 0) {
    const elapsed = phaseDuration - secondsLeft;
    scale = 1 + (0.4 * elapsed) / phaseDuration;
  } else if (isHold) {
    scale = 1.4;
  } else if (isExhale && phaseDuration > 0) {
    const elapsed = phaseDuration - secondsLeft;
    scale = 1.4 - (0.4 * elapsed) / phaseDuration;
  }

  // Glow intensity: brighter during inhale, softer during exhale
  const glowOpacity = isInhale ? 0.5 : isHold ? 0.4 : isExhale ? 0.2 : 0.15;
  const glowSpread = isInhale ? 40 : isHold ? 30 : isExhale ? 15 : 10;

  // Transition duration matches each phase's total seconds for smooth CSS scaling
  const transitionDuration = isIdle ? 0.3 : 1;

  return (
    <div className="flex justify-center py-6">
      <div
        className="relative w-40 h-40 rounded-full flex items-center justify-center"
        style={{
          transform: `scale(${scale})`,
          transition: `transform ${transitionDuration}s ease-in-out`,
        }}
      >
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${MIND_ACCENT}${Math.round(glowOpacity * 255)
              .toString(16)
              .padStart(2, '0')} 0%, transparent 70%)`,
            boxShadow: `0 0 ${glowSpread}px ${MIND_ACCENT}${Math.round(glowOpacity * 255)
              .toString(16)
              .padStart(2, '0')}`,
            transition: `all ${transitionDuration}s ease-in-out`,
          }}
        />

        {/* Inner circle */}
        <div
          className="relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${MIND_ACCENT}30, ${MIND_ACCENT}10)`,
            border: `2px solid ${MIND_ACCENT}40`,
          }}
        >
          {/* Phase label */}
          <span className="text-sm font-semibold text-white mb-1">
            {PHASE_LABELS[phase]}
          </span>

          {/* Timer countdown */}
          {!isIdle && (
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: MIND_ACCENT }}
            >
              {secondsLeft}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export const BreathSession: React.FC<BreathSessionProps> = ({
  pattern = DEFAULT_PATTERN,
  onComplete,
}) => {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseIndexRef = useRef(0);

  const getPhaseDuration = useCallback(
    (p: BreathPhase): number => {
      switch (p) {
        case 'inhale':
          return pattern.inhale;
        case 'hold':
          return pattern.hold;
        case 'exhale':
          return pattern.exhale;
        default:
          return 0;
      }
    },
    [pattern]
  );

  const currentPhaseDuration = getPhaseDuration(phase);

  // Start a new phase
  const startPhase = useCallback(
    (index: number) => {
      const sequence = getPhaseSequence();
      const nextPhase = sequence[index % sequence.length];
      setPhase(nextPhase);
      setSecondsLeft(getPhaseDuration(nextPhase));
      phaseIndexRef.current = index;
    },
    [getPhaseDuration]
  );

  // Handle start/stop
  const handleToggle = useCallback(() => {
    if (running) {
      // Stop
      setRunning(false);
      setPhase('idle');
      setSecondsLeft(0);
      phaseIndexRef.current = 0;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start
      setRunning(true);
      setCycleCount(0);
      startPhase(0);
    }
  }, [running, startPhase]);

  // Timer interval
  useEffect(() => {
    if (!running || phase === 'idle') return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Move to next phase
          const nextIndex = phaseIndexRef.current + 1;
          const sequence = getPhaseSequence();

          // Check if we completed a full cycle (inhale -> hold -> exhale)
          if (nextIndex % sequence.length === 0) {
            setCycleCount((c) => c + 1);
          }

          startPhase(nextIndex);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, phase, startPhase]);

  // Call onComplete after a set number of cycles (optional behavior)
  useEffect(() => {
    if (cycleCount > 0 && onComplete) {
      // Fires after each cycle; consumer decides when to stop
    }
  }, [cycleCount, onComplete]);

  const totalCycleSeconds = pattern.inhale + pattern.hold + pattern.exhale;

  return (
    <SectionCard title="Ejercicio de Respiracion" accentColor={MIND_ACCENT}>
      {/* Pattern info */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40">Inhala</span>
          <span className="text-xs font-bold text-white tabular-nums">{pattern.inhale}s</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40">Mantener</span>
          <span className="text-xs font-bold text-white tabular-nums">{pattern.hold}s</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/40">Exhala</span>
          <span className="text-xs font-bold text-white tabular-nums">{pattern.exhale}s</span>
        </div>
      </div>

      {/* Breath circle */}
      <BreathCircle
        phase={phase}
        secondsLeft={secondsLeft}
        phaseDuration={currentPhaseDuration}
      />

      {/* Cycle counter */}
      {running && (
        <div className="text-center mb-4">
          <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
            Ciclo {cycleCount + 1}
          </span>
          <span className="text-[10px] text-white/20 ml-2">
            ({totalCycleSeconds}s por ciclo)
          </span>
        </div>
      )}

      {/* Start/Stop button */}
      <button
        onClick={handleToggle}
        className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
        style={{
          background: running
            ? 'rgba(255,255,255,0.08)'
            : `linear-gradient(135deg, ${MIND_ACCENT}, ${MIND_ACCENT}CC)`,
          border: running ? '1px solid rgba(255,255,255,0.1)' : 'none',
        }}
        aria-label={running ? 'Detener ejercicio de respiracion' : 'Iniciar ejercicio de respiracion'}
      >
        {running ? (
          <>
            <Square size={14} fill="currentColor" />
            Detener
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" />
            Comenzar
          </>
        )}
      </button>
    </SectionCard>
  );
};
