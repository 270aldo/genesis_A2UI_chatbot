import React from 'react';
import { Calendar } from 'lucide-react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';
import { WeekdayStrip } from '../shared/WeekdayStrip';

// --- Types ---

type DayStatus = 'done' | 'today' | 'rest' | 'upcoming' | 'missed';

interface TrainingDay {
  dayLabel: string;
  muscleGroup: string;
  status: DayStatus;
}

interface WeeklyCalendarProps {
  days: TrainingDay[];
  title?: string;
}

// --- Helpers ---

const statusTextColor: Record<DayStatus, string> = {
  done: 'text-emerald-400/70',
  today: 'text-white/70',
  rest: 'text-white/20',
  upcoming: 'text-white/20',
  missed: 'text-red-400/50',
};

// --- Main Component ---

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  days,
  title = 'Split Semanal',
}) => {
  const stripDays = days.map((d) => ({
    label: d.dayLabel,
    status: d.status,
  }));

  const todayIndex = days.findIndex((d) => d.status === 'today');
  const todayGroup = todayIndex !== -1 ? days[todayIndex].muscleGroup : null;

  return (
    <SectionCard accentColor={COLORS.training}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: COLORS.training }} />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        {todayGroup && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{
              color: COLORS.training,
              background: `${COLORS.training}15`,
            }}
          >
            Hoy: {todayGroup}
          </span>
        )}
      </div>

      {/* Weekday status strip */}
      <WeekdayStrip days={stripDays} accentColor={COLORS.training} />

      {/* Muscle group labels */}
      <div className="flex gap-2 justify-between mt-2">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center w-8">
            <span
              className={`text-[9px] font-medium text-center leading-tight truncate w-full ${statusTextColor[day.status]}`}
            >
              {day.status === 'rest' ? '--' : day.muscleGroup}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
