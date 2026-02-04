import React from 'react';
import { ScanLine, Barcode, Camera } from 'lucide-react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';

// --- Types ---

interface ScanFoodCardProps {
  onScanBarcode?: () => void;
  onScanPhoto?: () => void;
}

// --- Main Component ---

export const ScanFoodCard: React.FC<ScanFoodCardProps> = ({
  onScanBarcode,
  onScanPhoto,
}) => {
  return (
    <SectionCard accentColor={COLORS.nutrition}>
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: `${COLORS.nutrition}10`,
            border: `1px solid ${COLORS.nutrition}20`,
          }}
        >
          <ScanLine size={22} style={{ color: COLORS.nutrition }} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-1">
          Escanear Alimento
        </h3>

        {/* Subtitle */}
        <p className="text-[11px] text-white/40 leading-relaxed max-w-[240px] mb-4">
          Escanea un codigo de barras o toma una foto de tu comida
        </p>

        {/* Proximamente badge */}
        <span
          className="text-[9px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full mb-3"
          style={{
            color: COLORS.nutrition,
            background: `${COLORS.nutrition}12`,
          }}
        >
          Proximamente
        </span>

        {/* Action buttons - side by side */}
        <div className="flex gap-2 w-full">
          <button
            onClick={onScanBarcode}
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 text-white/30 cursor-not-allowed transition-all"
            aria-disabled="true"
            aria-label="Escanear codigo de barras"
          >
            <Barcode size={14} />
            Codigo
          </button>
          <button
            onClick={onScanPhoto}
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white/5 text-white/30 cursor-not-allowed transition-all"
            aria-disabled="true"
            aria-label="Tomar foto de comida"
          >
            <Camera size={14} />
            Foto
          </button>
        </div>
      </div>
    </SectionCard>
  );
};
