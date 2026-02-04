import React from 'react';
import { Check, Circle, Minus } from 'lucide-react';

type DayStatus = 'done' | 'today' | 'rest' | 'upcoming' | 'missed';

interface DayData {
  label: string;      // "L", "M", "X", "J", "V", "S", "D"
  status: DayStatus;
}

interface WeekdayStripProps {
  days: DayData[];
  accentColor?: string;
}

const statusConfig: Record<DayStatus, { bg: string; icon: 'check' | 'circle' | 'minus' | 'none'; textColor: string }> = {
  done: { bg: 'bg-emerald-500/20', icon: 'check', textColor: 'text-emerald-400' },
  today: { bg: 'bg-[#6D00FF]/30', icon: 'circle', textColor: 'text-white' },
  rest: { bg: 'bg-white/5', icon: 'minus', textColor: 'text-white/30' },
  upcoming: { bg: 'bg-white/5', icon: 'none', textColor: 'text-white/20' },
  missed: { bg: 'bg-red-500/20', icon: 'none', textColor: 'text-red-400/60' },
};

export const WeekdayStrip: React.FC<WeekdayStripProps> = ({ days, accentColor = '#6D00FF' }) => (
  <div className="flex gap-2 justify-between">
    {days.map((day, i) => {
      const config = statusConfig[day.status];
      return (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <span className={`text-[10px] font-medium ${config.textColor}`}>{day.label}</span>
          <div
            className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center ${
              day.status === 'today' ? 'ring-1 ring-[#6D00FF]/50' : ''
            }`}
          >
            {config.icon === 'check' && <Check size={14} className="text-emerald-400" />}
            {config.icon === 'circle' && <Circle size={10} fill={accentColor} stroke="none" />}
            {config.icon === 'minus' && <Minus size={12} className="text-white/20" />}
          </div>
        </div>
      );
    })}
  </div>
);
