import React, { useState, useCallback } from 'react';
import { COLORS } from '../../constants';
import { SectionCard } from '../shared/SectionCard';

// --- Types ---

export interface CheckInData {
  mood: number;
  energy: number;
  sleepQuality: number;
  stressLevel: number;
}

interface CheckInFormProps {
  onSubmit: (data: CheckInData) => void;
}

// --- Constants ---

const MIND_ACCENT = '#A855F7';

const MOOD_OPTIONS = [
  { value: 1, emoji: '\u{1F62B}', label: 'Terrible' },
  { value: 2, emoji: '\u{1F615}', label: 'Mal' },
  { value: 3, emoji: '\u{1F610}', label: 'Normal' },
  { value: 4, emoji: '\u{1F642}', label: 'Bien' },
  { value: 5, emoji: '\u{1F604}', label: 'Genial' },
] as const;

const SLIDER_FIELDS = [
  { key: 'energy' as const, label: 'Energia', min: 1, max: 10 },
  { key: 'sleepQuality' as const, label: 'Calidad de Sueno', min: 1, max: 10 },
  { key: 'stressLevel' as const, label: 'Nivel de Estres', min: 1, max: 10 },
] as const;

// --- Mood Button ---

const MoodButton: React.FC<{
  emoji: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}> = ({ emoji, label, selected, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`flex flex-col items-center gap-1 transition-all duration-200 ${
      selected ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-80'
    }`}
    aria-label={`Estado de animo: ${label}`}
    aria-pressed={selected}
  >
    <div
      className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl transition-all duration-200 ${
        selected ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''
      }`}
      style={{
        background: selected ? `${MIND_ACCENT}20` : 'rgba(255,255,255,0.05)',
        boxShadow: selected
          ? `0 0 0 2px ${MIND_ACCENT}, 0 0 12px ${MIND_ACCENT}40`
          : 'none',
      }}
    >
      <span className="leading-none">{emoji}</span>
    </div>
    <span
      className={`text-[9px] font-semibold uppercase tracking-wider transition-colors duration-200 ${
        selected ? 'text-white/80' : 'text-white/30'
      }`}
    >
      {label}
    </span>
  </button>
);

// --- Slider Row ---

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, onChange }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-white/50">{label}</span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: MIND_ACCENT }}
        >
          {value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${MIND_ACCENT} 0%, ${MIND_ACCENT} ${percentage}%, rgba(255,255,255,0.08) ${percentage}%, rgba(255,255,255,0.08) 100%)`,
          }}
          aria-label={label}
        />
      </div>
    </div>
  );
};

// --- Main Component ---

export const CheckInForm: React.FC<CheckInFormProps> = ({ onSubmit }) => {
  const [mood, setMood] = useState<number>(0);
  const [energy, setEnergy] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);

  const sliderState: Record<string, { value: number; setter: (v: number) => void }> = {
    energy: { value: energy, setter: setEnergy },
    sleepQuality: { value: sleepQuality, setter: setSleepQuality },
    stressLevel: { value: stressLevel, setter: setStressLevel },
  };

  const handleSubmit = useCallback(() => {
    if (mood === 0) return;
    onSubmit({ mood, energy, sleepQuality, stressLevel });
  }, [mood, energy, sleepQuality, stressLevel, onSubmit]);

  const isValid = mood > 0;

  return (
    <SectionCard title="Check-in Diario" accentColor={MIND_ACCENT}>
      {/* Mood Selector */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3">
          Como te sientes hoy?
        </p>
        <div className="flex items-center justify-between px-2">
          {MOOD_OPTIONS.map((option) => (
            <MoodButton
              key={option.value}
              emoji={option.emoji}
              label={option.label}
              selected={mood === option.value}
              onSelect={() => setMood(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mb-4" />

      {/* Sliders */}
      <div className="space-y-4 mb-5">
        {SLIDER_FIELDS.map((field) => (
          <SliderRow
            key={field.key}
            label={field.label}
            value={sliderState[field.key].value}
            min={field.min}
            max={field.max}
            onChange={sliderState[field.key].setter}
          />
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 ${
          isValid
            ? 'hover:opacity-90 shadow-lg active:scale-[0.98]'
            : 'opacity-30 cursor-not-allowed'
        }`}
        style={{
          background: isValid
            ? `linear-gradient(135deg, ${MIND_ACCENT}, ${MIND_ACCENT}CC)`
            : 'rgba(255,255,255,0.05)',
        }}
        aria-label="Registrar check-in diario"
      >
        Registrar Check-in
      </button>
    </SectionCard>
  );
};
