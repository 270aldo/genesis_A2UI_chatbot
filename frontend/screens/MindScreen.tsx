import React from 'react';
import { ScreenHeader } from '../components/shared/ScreenHeader';
import { SectionCard } from '../components/shared/SectionCard';
import { CheckInForm } from '../components/mind/CheckInForm';
import { SessionGrid } from '../components/mind/SessionGrid';
import { BreathSession } from '../components/mind/BreathSession';

import type { CheckInData } from '../components/mind/CheckInForm';
import type { MindSession } from '../components/mind/SessionGrid';

// --- Mock Data ---

const MOCK_MENTAL_STATS = {
  avgMood: 3.8,
  checkinCount: 5,
  avgEnergy: 7.2,
  avgSleep: 6.8,
};

const MIND_ACCENT = '#A855F7';

// --- Stat Pill ---

const StatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="flex flex-col items-center gap-1 rounded-xl py-3 px-2"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <span
      className="text-base font-bold tabular-nums"
      style={{ color: MIND_ACCENT }}
    >
      {value}
    </span>
    <span className="text-[10px] font-medium text-white/40 text-center leading-tight">
      {label}
    </span>
  </div>
);

// --- Main Screen ---

const MindScreen: React.FC = () => {
  const handleCheckInSubmit = (data: CheckInData) => {
    console.log('Check-in submitted:', data);
  };

  const handleSessionSelect = (session: MindSession) => {
    console.log('Session selected:', session);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      <ScreenHeader
        title="Mind"
        subtitle="Centro de Bienestar"
        accentColor={MIND_ACCENT}
      />

      <div className="px-5 space-y-4 pb-6">
        {/* Daily Check-in */}
        <CheckInForm onSubmit={handleCheckInSubmit} />

        {/* Session Grid */}
        <SessionGrid onSelect={handleSessionSelect} />

        {/* Weekly Mental Stats */}
        <SectionCard title="Estadisticas Semanales" accentColor={MIND_ACCENT}>
          <div className="grid grid-cols-2 gap-3">
            <StatPill
              label="Animo promedio"
              value={`${MOCK_MENTAL_STATS.avgMood}/5`}
            />
            <StatPill
              label="Check-ins"
              value={String(MOCK_MENTAL_STATS.checkinCount)}
            />
            <StatPill
              label="Energia"
              value={`${MOCK_MENTAL_STATS.avgEnergy}/10`}
            />
            <StatPill
              label="Sueno"
              value={`${MOCK_MENTAL_STATS.avgSleep}/10`}
            />
          </div>
        </SectionCard>

        {/* Breath Session */}
        <BreathSession />
      </div>
    </div>
  );
};

export default MindScreen;
