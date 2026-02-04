import React from 'react';
import { Settings, Bell } from 'lucide-react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  rightAction?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  accentColor = '#6D00FF',
  rightAction,
}) => (
  <div className="flex items-center justify-between px-5 pt-6 pb-4">
    <div>
      <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
      )}
    </div>
    <div className="flex items-center gap-2">
      {rightAction}
      <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
        <Bell size={18} />
      </button>
      <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
        <Settings size={18} />
      </button>
    </div>
  </div>
);
