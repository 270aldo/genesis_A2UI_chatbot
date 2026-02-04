import React from 'react';
import { Camera } from 'lucide-react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';

// --- Types ---

interface ScanMachineCardProps {
  onScan?: () => void;
}

// --- Main Component ---

export const ScanMachineCard: React.FC<ScanMachineCardProps> = ({ onScan }) => {
  return (
    <SectionCard accentColor={COLORS.training}>
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: `${COLORS.training}10`,
            border: `1px solid ${COLORS.training}20`,
          }}
        >
          <Camera size={22} style={{ color: COLORS.training }} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-1">Escanear Maquina</h3>

        {/* Subtitle */}
        <p className="text-[11px] text-white/40 leading-relaxed max-w-[220px] mb-4">
          Apunta la camara a una maquina para obtener ejercicios recomendados
        </p>

        {/* Proximamente badge */}
        <span
          className="text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-3"
          style={{
            color: COLORS.training,
            background: `${COLORS.training}12`,
          }}
        >
          Proximamente
        </span>

        {/* CTA button - disabled */}
        <button
          onClick={onScan}
          disabled
          className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 text-white/30 cursor-not-allowed transition-all"
          aria-disabled="true"
        >
          Escanear
        </button>
      </div>
    </SectionCard>
  );
};
