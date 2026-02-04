import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';

// --- Types ---

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  name: string;
  items: FoodItem[];
  totalCalories: number;
}

interface MealLogSectionProps {
  meals: Meal[];
  onAddFood?: (mealName: string) => void;
}

// --- Food Item Row ---

const FoodItemRow: React.FC<{ item: FoodItem }> = ({ item }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
    <span className="text-[12px] text-white/70 font-medium">{item.name}</span>
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-white/30 tabular-nums">
        P {item.protein}g
      </span>
      <span className="text-[10px] text-white/30 tabular-nums">
        C {item.carbs}g
      </span>
      <span className="text-[10px] text-white/30 tabular-nums">
        G {item.fat}g
      </span>
      <span className="text-[11px] text-white/50 font-semibold tabular-nums min-w-[40px] text-right">
        {item.calories}
      </span>
    </div>
  </div>
);

// --- Meal Card ---

const MealCard: React.FC<{
  meal: Meal;
  onAddFood?: () => void;
}> = ({ meal, onAddFood }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-white/[0.02] transition-colors"
        aria-expanded={expanded}
        aria-label={`${meal.name} - ${meal.totalCalories} calorias`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: COLORS.nutrition }}
          />
          <span className="text-sm font-semibold text-white">{meal.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/40 font-medium tabular-nums">
            {meal.totalCalories} kcal
          </span>
          <ChevronIcon size={14} className="text-white/30" />
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3.5 pb-3">
          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-1" />

          {/* Food items */}
          {meal.items.length > 0 ? (
            <div>
              {meal.items.map((item, i) => (
                <FoodItemRow key={i} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-white/20 text-center py-3">
              Sin alimentos registrados
            </p>
          )}

          {/* Add food button */}
          <button
            onClick={onAddFood}
            className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            <Plus size={12} style={{ color: COLORS.nutrition }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.1em]"
              style={{ color: COLORS.nutrition }}
            >
              Agregar alimento
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export const MealLogSection: React.FC<MealLogSectionProps> = ({
  meals,
  onAddFood,
}) => {
  return (
    <SectionCard title="Registro de Comidas" accentColor={COLORS.nutrition}>
      <div className="space-y-2">
        {meals.map((meal, i) => (
          <MealCard
            key={i}
            meal={meal}
            onAddFood={onAddFood ? () => onAddFood(meal.name) : undefined}
          />
        ))}
      </div>
    </SectionCard>
  );
};
