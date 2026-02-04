import React from 'react';
import { CalendarDays } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';
import { ProgressBar } from '../BaseUI';

// --- Constants ---

const TRACK_ACCENT = '#3B82F6';

// --- Types ---

interface SeasonProgressProps {
  seasonName: string;
  currentWeek: number;
  totalWeeks: number;
  phase: string;
  startDate: string;
}

// --- Main Component ---

export const SeasonProgress: React.FC<SeasonProgressProps> = ({
  seasonName,
  currentWeek,
  totalWeeks,
  phase,
  startDate,
}) => {
  const progressPercent =
    totalWeeks > 0 ? Math.min((currentWeek / totalWeeks) * 100, 100) : 0;

  return (
    <SectionCard accentColor={TRACK_ACCENT}>
      {/* Header row: season name + phase badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} style={{ color: TRACK_ACCENT }} />
          <span className="text-sm font-bold text-white">{seasonName}</span>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md"
          style={{
            color: TRACK_ACCENT,
            background: `${TRACK_ACCENT}15`,
          }}
        >
          {phase}
        </span>
      </div>

      {/* Week progress text */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-white/60">
          Semana{' '}
          <span className="font-bold text-white tabular-nums">{currentWeek}</span>{' '}
          de{' '}
          <span className="font-bold text-white tabular-nums">{totalWeeks}</span>
        </span>
        <span className="text-[10px] text-white/30 tabular-nums">
          {Math.round(progressPercent)}%
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar
        value={currentWeek}
        max={totalWeeks}
        color={TRACK_ACCENT}
        height={6}
      />

      {/* Start date subtitle */}
      <p className="text-[10px] text-white/30 mt-2.5">
        Inicio: {startDate}
      </p>
    </SectionCard>
  );
};
