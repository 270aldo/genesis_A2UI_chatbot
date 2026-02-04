import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color?: string;
}

interface QuickActionBarProps {
  actions: QuickAction[];
  onAction: (id: string) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({ actions, onAction }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
    {actions.map((action) => (
      <button
        key={action.id}
        onClick={() => onAction(action.id)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 transition-all shrink-0 group"
      >
        <action.icon
          size={16}
          className="transition-colors"
          style={{ color: action.color || '#6D00FF' }}
        />
        <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
          {action.label}
        </span>
      </button>
    ))}
  </div>
);
