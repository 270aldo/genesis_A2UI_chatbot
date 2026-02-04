import React from 'react';
import { ScreenHeader } from '../components/shared/ScreenHeader';
import { MacroDashboard } from '../components/fuel/MacroDashboard';
import { MealLogSection } from '../components/fuel/MealLogSection';
import { ScanFoodCard } from '../components/fuel/ScanFoodCard';
import { COLORS } from '../constants';

// --- Mock Data ---

const MOCK_MACROS = {
  calories: { current: 1850, goal: 2400 },
  protein: { current: 120, goal: 160 },
  carbs: { current: 200, goal: 280 },
  fat: { current: 55, goal: 75 },
};

const MOCK_MEALS = [
  {
    name: 'Desayuno',
    totalCalories: 520,
    items: [
      { name: 'Avena con platano', calories: 320, protein: 12, carbs: 58, fat: 6 },
      { name: 'Cafe con leche', calories: 80, protein: 4, carbs: 8, fat: 3 },
      { name: 'Huevos revueltos (2)', calories: 120, protein: 14, carbs: 2, fat: 8 },
    ],
  },
  {
    name: 'Almuerzo',
    totalCalories: 680,
    items: [
      { name: 'Pollo a la plancha', calories: 280, protein: 42, carbs: 0, fat: 12 },
      { name: 'Arroz integral', calories: 220, protein: 5, carbs: 46, fat: 2 },
      { name: 'Ensalada mixta', calories: 80, protein: 3, carbs: 12, fat: 4 },
      { name: 'Aceite de oliva', calories: 100, protein: 0, carbs: 0, fat: 11 },
    ],
  },
  {
    name: 'Cena',
    totalCalories: 450,
    items: [
      { name: 'Salmon al horno', calories: 300, protein: 34, carbs: 0, fat: 18 },
      { name: 'Verduras salteadas', calories: 150, protein: 4, carbs: 20, fat: 6 },
    ],
  },
  {
    name: 'Snacks',
    totalCalories: 200,
    items: [
      { name: 'Proteina whey', calories: 120, protein: 24, carbs: 4, fat: 2 },
      { name: 'Almendras (30g)', calories: 80, protein: 3, carbs: 3, fat: 7 },
    ],
  },
];

// --- Screen Component ---

const FuelScreen: React.FC = () => (
  <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
    <ScreenHeader
      title="Fuel"
      subtitle="Centro de Nutricion"
      accentColor={COLORS.nutrition}
    />

    <div className="px-5 space-y-4 pb-6">
      <MacroDashboard
        calories={MOCK_MACROS.calories}
        protein={MOCK_MACROS.protein}
        carbs={MOCK_MACROS.carbs}
        fat={MOCK_MACROS.fat}
      />

      <MealLogSection meals={MOCK_MEALS} />

      <ScanFoodCard />
    </div>
  </div>
);

export default FuelScreen;
