import React from 'react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';
import { ProgressBar } from '../BaseUI';
import { ProgressRing } from '../shared/ProgressRing';

// --- Types ---

interface MacroValue {
  current: number;
  goal: number;
}

interface MacroDashboardProps {
  calories: MacroValue;
  protein: MacroValue;
  carbs: MacroValue;
  fat: MacroValue;
}

// --- Macro Colors ---

const MACRO_COLORS = {
  protein: COLORS.nutrition,
  carbs: '#3B82F6',
  fat: '#FBBF24',
} as const;

// --- Macro Bar ---

const MacroBar: React.FC<{
  label: string;
  current: number;
  goal: number;
  color: string;
}> = ({ label, current, goal, color }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
        {label}
      </span>
      <span className="text-[11px] font-medium text-white/60 tabular-nums">
        {current}g / {goal}g
      </span>
    </div>
    <ProgressBar value={current} max={goal} color={color} height={5} />
  </div>
);

// --- Main Component ---

export const MacroDashboard: React.FC<MacroDashboardProps> = ({
  calories,
  protein,
  carbs,
  fat,
}) => {
  const calorieProgress =
    calories.goal > 0
      ? Math.min((calories.current / calories.goal) * 100, 100)
      : 0;

  return (
    <SectionCard title="Macros del Dia" accentColor={COLORS.nutrition}>
      {/* Calorie Ring */}
      <div className="flex justify-center mb-5">
        <ProgressRing
          progress={calorieProgress}
          size={120}
          strokeWidth={8}
          color={COLORS.nutrition}
        >
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white tabular-nums leading-tight">
              {calories.current}
            </span>
            <span className="text-[10px] text-white/30 tabular-nums">
              / {calories.goal}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/20 mt-0.5">
              kcal
            </span>
          </div>
        </ProgressRing>
      </div>

      {/* Macro Bars */}
      <div className="space-y-3">
        <MacroBar
          label="Proteina"
          current={protein.current}
          goal={protein.goal}
          color={MACRO_COLORS.protein}
        />
        <MacroBar
          label="Carbohidratos"
          current={carbs.current}
          goal={carbs.goal}
          color={MACRO_COLORS.carbs}
        />
        <MacroBar
          label="Grasas"
          current={fat.current}
          goal={fat.goal}
          color={MACRO_COLORS.fat}
        />
      </div>
    </SectionCard>
  );
};
