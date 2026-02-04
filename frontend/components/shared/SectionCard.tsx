import React from 'react';
import { COLORS } from '../../constants';

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  className?: string;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  title,
  subtitle,
  accentColor = COLORS.genesis,
  className = '',
  noPadding = false,
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl ${noPadding ? '' : 'p-4'} ${className}`}
    style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(255,255,255,0.06)`,
    }}
  >
    {title && (
      <div className={`${noPadding ? 'px-4 pt-4' : ''} mb-3`}>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-white/40 mt-0.5">{subtitle}</p>
        )}
      </div>
    )}
    <div className={noPadding ? '' : 'relative z-10'}>{children}</div>
  </div>
);
