import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check, Timer, Dumbbell } from 'lucide-react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';
import { ProgressBar } from '../BaseUI';

// --- Types ---

interface ExerciseData {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
}

interface WorkoutData {
  name: string;
  duration: number;
  muscleGroups: string[];
  exercises: ExerciseData[];
}

interface WorkoutSessionViewProps {
  workout: WorkoutData;
  onStart?: () => void;
  onComplete?: () => void;
}

// --- Set Indicator ---

const SetIndicator: React.FC<{
  index: number;
  completed: boolean;
  active: boolean;
  onToggle: () => void;
}> = ({ index, completed, active, onToggle }) => (
  <button
    onClick={onToggle}
    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
      completed
        ? 'bg-[#EF4444] text-white scale-95'
        : active
          ? 'ring-1 ring-[#EF4444]/60 bg-white/10 text-white'
          : 'bg-white/5 text-white/30'
    }`}
    aria-label={`Set ${index + 1}${completed ? ' completado' : ''}`}
  >
    {completed ? <Check size={12} strokeWidth={3} /> : index + 1}
  </button>
);

// --- Rest Timer ---

const RestTimer: React.FC<{
  seconds: number;
  onFinish: () => void;
}> = ({ seconds, onFinish }) => {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running || remaining <= 0) {
      if (remaining <= 0 && running) {
        setRunning(false);
        onFinish();
      }
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running, remaining, onFinish]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <Timer size={14} className="text-white/40 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
            Descanso
          </span>
          <span className="text-sm font-mono text-white tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
        <ProgressBar progress={progress} color={COLORS.training} height={3} />
      </div>
      <button
        onClick={() => {
          if (remaining <= 0) {
            setRemaining(seconds);
          }
          setRunning((prev) => !prev);
        }}
        className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
        aria-label={running ? 'Pausar' : 'Iniciar'}
      >
        {remaining <= 0 ? (
          <RotateCcw size={12} />
        ) : running ? (
          <Pause size={12} />
        ) : (
          <Play size={12} />
        )}
      </button>
    </div>
  );
};

// --- Exercise Row ---

const ExerciseRow: React.FC<{
  exercise: ExerciseData;
  index: number;
  isActive: boolean;
  completedSets: boolean[];
  onToggleSet: (setIndex: number) => void;
  onRestFinish: () => void;
}> = ({ exercise, index, isActive, completedSets, onToggleSet, onRestFinish }) => {
  const completedCount = completedSets.filter(Boolean).length;
  const allDone = completedCount === exercise.sets;
  const showRest = isActive && completedCount > 0 && !allDone;

  return (
    <div
      className={`rounded-xl p-3.5 transition-all duration-200 ${
        isActive ? 'bg-white/[0.05] border border-white/[0.08]' : 'bg-transparent'
      } ${allDone ? 'opacity-50' : ''}`}
    >
      {/* Exercise header */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{
              background: allDone ? `${COLORS.training}20` : 'rgba(255,255,255,0.05)',
              color: allDone ? COLORS.training : 'rgba(255,255,255,0.4)',
            }}
          >
            {allDone ? <Check size={12} /> : index + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{exercise.name}</p>
            <p className="text-[11px] text-white/40 mt-0.5">
              {exercise.sets} x {exercise.reps} @ {exercise.weight} kg
            </p>
          </div>
        </div>
        <span className="text-[10px] text-white/30 font-medium tabular-nums">
          {completedCount}/{exercise.sets}
        </span>
      </div>

      {/* Set indicators */}
      <div className="flex gap-1.5 mb-2">
        {completedSets.map((done, si) => (
          <SetIndicator
            key={si}
            index={si}
            completed={done}
            active={isActive && !done && completedSets.filter(Boolean).length === si}
            onToggle={() => onToggleSet(si)}
          />
        ))}
      </div>

      {/* Rest timer */}
      {showRest && (
        <div className="mt-2">
          <RestTimer seconds={exercise.restSeconds} onFinish={onRestFinish} />
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export const WorkoutSessionView: React.FC<WorkoutSessionViewProps> = ({
  workout,
  onStart,
  onComplete,
}) => {
  const [started, setStarted] = useState(false);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [setsState, setSetsState] = useState<boolean[][]>(
    workout.exercises.map((ex) => Array(ex.sets).fill(false))
  );

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completedSets = setsState.flat().filter(Boolean).length;
  const allComplete = completedSets === totalSets;

  const handleStart = useCallback(() => {
    setStarted(true);
    onStart?.();
  }, [onStart]);

  const handleToggleSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setSetsState((prev) => {
        const next = prev.map((row) => [...row]);
        next[exerciseIndex][setIndex] = !next[exerciseIndex][setIndex];
        return next;
      });
    },
    []
  );

  const handleRestFinish = useCallback(() => {
    // No-op: user can proceed at their own pace
  }, []);

  useEffect(() => {
    if (allComplete && started) {
      onComplete?.();
    }
  }, [allComplete, started, onComplete]);

  return (
    <SectionCard accentColor={COLORS.training}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={14} style={{ color: COLORS.training }} />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: COLORS.training }}
          >
            Sesion de Entrenamiento
          </span>
        </div>
        <h2 className="text-lg font-bold text-white">{workout.name}</h2>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[11px] text-white/40">{workout.duration} min</span>
          <span className="text-white/10">|</span>
          <span className="text-[11px] text-white/40">
            {workout.muscleGroups.join(' / ')}
          </span>
        </div>
      </div>

      {/* Progress */}
      {started && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
              Progreso
            </span>
            <span className="text-[11px] text-white/60 font-medium tabular-nums">
              {completedSets}/{totalSets} sets
            </span>
          </div>
          <ProgressBar value={completedSets} max={totalSets} color={COLORS.training} height={4} />
        </div>
      )}

      {/* CTA or Exercise list */}
      {!started ? (
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all hover:opacity-90 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${COLORS.training}, ${COLORS.training}CC)`,
          }}
        >
          Comenzar Sesion
        </button>
      ) : (
        <div className="space-y-1">
          {workout.exercises.map((exercise, i) => (
            <ExerciseRow
              key={i}
              exercise={exercise}
              index={i}
              isActive={i === activeExerciseIndex}
              completedSets={setsState[i]}
              onToggleSet={(si) => {
                handleToggleSet(i, si);
                // Auto-advance active exercise when all sets done
                const updatedSets = [...setsState[i]];
                updatedSets[si] = !updatedSets[si];
                if (updatedSets.every(Boolean) && i < workout.exercises.length - 1) {
                  setActiveExerciseIndex(i + 1);
                }
              }}
              onRestFinish={handleRestFinish}
            />
          ))}
        </div>
      )}

      {/* Completion */}
      {allComplete && started && (
        <div
          className="mt-4 rounded-xl p-3 text-center"
          style={{ background: `${COLORS.training}15` }}
        >
          <p className="text-sm font-semibold text-white">Sesion completada</p>
          <p className="text-[11px] text-white/50 mt-0.5">
            {totalSets} sets en {workout.duration} min
          </p>
        </div>
      )}
    </SectionCard>
  );
};
