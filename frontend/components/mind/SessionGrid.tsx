import React from 'react';
import { Wind, Target, Moon, BookOpen, LucideIcon } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';

// --- Types ---

export interface MindSession {
  id: string;
  title: string;
  duration: number;
  icon: string;
  color: string;
}

interface SessionGridProps {
  sessions?: MindSession[];
  onSelect: (session: MindSession) => void;
}

// --- Constants ---

const MIND_ACCENT = '#A855F7';

const ICON_MAP: Record<string, LucideIcon> = {
  Wind,
  Target,
  Moon,
  BookOpen,
};

const DEFAULT_SESSIONS: MindSession[] = [
  { id: 'breath', title: 'Respiracion', duration: 5, icon: 'Wind', color: '#A855F7' },
  { id: 'focus', title: 'Enfoque', duration: 10, icon: 'Target', color: '#3B82F6' },
  { id: 'sleep', title: 'Sueno', duration: 15, icon: 'Moon', color: '#6366F1' },
  { id: 'reflect', title: 'Reflexion', duration: 10, icon: 'BookOpen', color: '#EC4899' },
];

// --- Session Card ---

const SessionCard: React.FC<{
  session: MindSession;
  onSelect: () => void;
}> = ({ session, onSelect }) => {
  const IconComponent = ICON_MAP[session.icon];

  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2.5 rounded-xl p-4 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      aria-label={`Sesion de ${session.title}, ${session.duration} minutos`}
    >
      {/* Icon circle */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: `${session.color}15`,
          boxShadow: `0 0 16px ${session.color}20`,
        }}
      >
        {IconComponent && (
          <IconComponent size={20} style={{ color: session.color }} />
        )}
      </div>

      {/* Title */}
      <span className="text-xs font-semibold text-white">{session.title}</span>

      {/* Duration */}
      <span className="text-[10px] font-medium text-white/40 tabular-nums">
        {session.duration} min
      </span>
    </button>
  );
};

// --- Main Component ---

export const SessionGrid: React.FC<SessionGridProps> = ({
  sessions = DEFAULT_SESSIONS,
  onSelect,
}) => (
  <SectionCard title="Sesiones" accentColor={MIND_ACCENT}>
    <div className="grid grid-cols-2 gap-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onSelect={() => onSelect(session)}
        />
      ))}
    </div>
  </SectionCard>
);
