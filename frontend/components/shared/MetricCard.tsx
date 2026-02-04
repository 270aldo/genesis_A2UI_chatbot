import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  accentColor = '#6D00FF',
  icon,
}) => {
  const isPositive = delta !== undefined && delta > 0;
  const isNegative = delta !== undefined && delta < 0;
  const isNeutral = delta === undefined || delta === 0;

  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-white/30">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: accentColor }}>{value}</span>
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {isPositive && <TrendingUp size={12} className="text-emerald-400" />}
          {isNegative && <TrendingDown size={12} className="text-red-400" />}
          {isNeutral && <Minus size={12} className="text-white/30" />}
          <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-white/30'}`}>
            {isPositive ? '+' : ''}{delta}%{deltaLabel ? ` ${deltaLabel}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};
