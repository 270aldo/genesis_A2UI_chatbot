import React from 'react';
import {
  Flame,
  Dumbbell,
  Utensils,
  Activity,
  Camera,
  BookOpen,
  MessageCircle,
  ChevronRight,
  Zap,
  Check,
} from 'lucide-react';
import { ScreenHeader } from '../components/shared/ScreenHeader';
import { SectionCard } from '../components/shared/SectionCard';
import { ProgressBar } from '../components/BaseUI';
import { ProgressRing } from '../components/shared/ProgressRing';
import { QuickActionBar } from '../components/shared/QuickActionBar';
import { COLORS } from '../constants';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USER = { name: 'Aldo', dayCount: 47, seasonName: 'Fuerza I', seasonWeek: 4 };

const MOCK_MISSIONS: MissionItem[] = [
  { id: 'train', label: 'Entrenar', icon: Dumbbell, done: false, color: '#EF4444' },
  { id: 'log_food', label: 'Registrar Comida', icon: Utensils, done: true, color: '#22C55E' },
  { id: 'checkin', label: 'Check-in', icon: Activity, done: false, color: '#FBBF24' },
];

const MOCK_WEEKLY = { completed: 4, total: 6, sessions: 3, checkins: 4 };

const MOCK_STREAK = 12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MissionItem {
  id: string;
  label: string;
  icon: LucideIcon;
  done: boolean;
  color: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Individual mission action card displayed inside the "Today's Mission" row. */
const MissionCard: React.FC<{ mission: MissionItem }> = ({ mission }) => {
  const Icon = mission.icon;

  return (
    <button
      className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all relative group"
      aria-label={mission.label}
    >
      {/* Colored icon circle */}
      <div
        className="relative w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
        style={{ background: `${mission.color}18` }}
      >
        <Icon size={20} style={{ color: mission.color }} />

        {/* Check overlay when completed */}
        {mission.done && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center ring-2 ring-[#050505]">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Label */}
      <span
        className={`text-[11px] font-medium transition-colors ${
          mission.done ? 'text-white/30 line-through' : 'text-white/70'
        }`}
      >
        {mission.label}
      </span>
    </button>
  );
};

/** Small pill used to display a stat value (e.g. "3 sesiones"). */
const StatPill: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.06]">
    <span className="text-xs font-semibold text-white">{value}</span>
    <span className="text-[11px] text-white/40">{label}</span>
  </span>
);

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

const HomeScreen: React.FC = () => {
  const weeklyPercent = Math.round(
    (MOCK_WEEKLY.completed / MOCK_WEEKLY.total) * 100,
  );

  return (
    <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
      {/* ------ Greeting Header ------ */}
      <ScreenHeader
        title={`Buenos dias, ${MOCK_USER.name}`}
        subtitle={`Dia ${MOCK_USER.dayCount} · ${MOCK_USER.seasonName} · Semana ${MOCK_USER.seasonWeek}`}
      />

      <div className="px-5 space-y-4 pb-6">
        {/* ------ Today's Mission ------ */}
        <SectionCard title="Mision del Dia">
          <div className="flex gap-3">
            {MOCK_MISSIONS.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </SectionCard>

        {/* ------ Weekly Progress ------ */}
        <SectionCard title="Progreso Semanal">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">
                {weeklyPercent}% completado
              </span>
              <span className="text-[11px] text-white/30">
                {MOCK_WEEKLY.completed}/{MOCK_WEEKLY.total}
              </span>
            </div>

            <ProgressBar
              value={MOCK_WEEKLY.completed}
              max={MOCK_WEEKLY.total}
              color={COLORS.genesis}
              height={6}
            />

            <div className="flex gap-2 pt-1">
              <StatPill value={MOCK_WEEKLY.sessions} label="sesiones" />
              <StatPill value={MOCK_WEEKLY.checkins} label="check-ins" />
            </div>
          </div>
        </SectionCard>

        {/* ------ GENESIS Message ------ */}
        <SectionCard accentColor={COLORS.genesis}>
          <div className="flex items-start gap-3">
            {/* Brand icon */}
            <div
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${COLORS.genesis}20` }}
            >
              <Zap size={18} style={{ color: COLORS.genesis }} />
            </div>

            <div className="flex-1 space-y-2.5">
              <p className="text-[13px] leading-relaxed text-white/70">
                Tu adherencia ha mejorado 15% esta semana. Mantiene el enfoque
                en la recuperacion activa entre sesiones.
              </p>

              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.10] transition-all text-white/60 hover:text-white">
                <MessageCircle size={14} />
                <span className="text-[11px] font-medium">Responder</span>
              </button>
            </div>
          </div>
        </SectionCard>

        {/* ------ Active Streak ------ */}
        <SectionCard>
          <div className="flex items-center gap-4">
            {/* Flame with pulse */}
            <div className="relative shrink-0">
              <div className="animate-pulse">
                <Flame size={40} className="text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white tracking-tight">
                  {MOCK_STREAK}
                </span>
                <span className="text-sm font-medium text-white/40">dias</span>
              </div>
              <p className="text-[11px] text-white/30 mt-0.5">
                Tu mejor racha: 18 dias
              </p>
            </div>

            <ChevronRight size={18} className="text-white/20 shrink-0" />
          </div>
        </SectionCard>

        {/* ------ Quick Actions ------ */}
        <QuickActionBar
          actions={[
            { id: 'checkin', label: 'Check-in', icon: Activity, color: COLORS.habits },
            { id: 'scan', label: 'Escanear', icon: Camera, color: COLORS.nutrition },
            { id: 'train', label: 'Entrenar', icon: Dumbbell, color: COLORS.training },
            { id: 'learn', label: 'Aprender', icon: BookOpen, color: COLORS.education },
          ]}
          onAction={(id) => {
            // Visual only for now
            console.log(`Quick action: ${id}`);
          }}
        />
      </div>
    </div>
  );
};

export default HomeScreen;
