import React from 'react';
import { Trophy, Award, Flag } from 'lucide-react';
import { SectionCard } from '../shared/SectionCard';

// --- Constants ---

const TRACK_ACCENT = '#3B82F6';

const TYPE_CONFIG = {
  pr: { icon: Trophy, color: '#FBBF24', label: 'PR' },
  badge: { icon: Award, color: '#3B82F6', label: 'Badge' },
  milestone: { icon: Flag, color: '#A855F7', label: 'Hito' },
} as const;

// --- Types ---

type AchievementType = 'pr' | 'badge' | 'milestone';

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: AchievementType;
  value?: string | number;
}

interface AchievementListProps {
  achievements: Achievement[];
}

// --- Item Component ---

const AchievementItem: React.FC<{ achievement: Achievement }> = ({
  achievement,
}) => {
  const config = TYPE_CONFIG[achievement.type];
  const IconComponent = config.icon;

  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
        style={{ background: `${config.color}15` }}
      >
        <IconComponent size={16} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white truncate">
            {achievement.title}
          </span>
          {achievement.value && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{
                color: config.color,
                background: `${config.color}15`,
              }}
            >
              {achievement.value}
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">
          {achievement.description}
        </p>
        <span className="text-[9px] text-white/20 mt-1 block">
          {achievement.date}
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---

export const AchievementList: React.FC<AchievementListProps> = ({
  achievements,
}) => (
  <SectionCard title="Logros Recientes" accentColor={TRACK_ACCENT}>
    {achievements.length === 0 ? (
      <div className="flex items-center justify-center py-6">
        <span className="text-[11px] text-white/20">Sin logros recientes</span>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {achievements.map((achievement) => (
          <AchievementItem key={achievement.id} achievement={achievement} />
        ))}
      </div>
    )}
  </SectionCard>
);
