import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu, Zap, UtensilsCrossed, Droplets, AlertTriangle,
  Clock, Moon, CheckCircle2, Play, Pause, RotateCcw,
  Pill, Flame, Activity, Heart, Waves, Dna, Apple,
  TrendingUp, TrendingDown, Lightbulb, Brain, Target,
  Sparkles, Timer, Trophy, PartyPopper, CircleDot,
  Bone, ShieldAlert, Gauge, Calendar, Sun, Coffee
} from 'lucide-react';
import { GlassCard, AgentBadge, ProgressBar, ActionButton, GlassInput, GlassSlider } from './BaseUI';
import { COLORS } from '../constants';
import { AgentType, WidgetPayload } from '../types';

// --- Types for Widgets ---

interface WorkoutCardProps {
  title: string;
  category: string;
  duration: string;
  workoutId: string;
  exercises: { name: string; sets: number; reps: string; load: string }[];
  coachNote?: string;
}

interface MealPlanProps {
  totalKcal: number;
  meals: { time: string; name: string; kcal: number; highlight?: boolean }[];
}

interface HydrationProps {
  current: number;
  goal: number;
}

interface DashboardProps {
  title: string;
  subtitle: string;
  progress: number;
  metrics: { label: string; value: string | number }[];
}

interface AlertProps {
  type: 'warning' | 'error' | 'success';
  message: string;
}

interface RecipeProps {
  title: string;
  kcal: number;
  time: string;
  tags: string[];
  ingredients: string[];
  instructions: string[];
}

interface SleepProps {
  score: number;
  duration: string;
  stages: { deep: string; rem: string; light: string };
  quality: string;
}

interface TimerProps {
  label: string;
  seconds: number;
  autoStart?: boolean;
}

interface QuoteProps {
  quote: string;
  author: string;
}

interface InsightProps {
  title: string;
  insight: string;
  trend?: 'positive' | 'negative' | 'neutral';
  recommendation?: string;
}

interface ChecklistProps {
  title: string;
  items: { id: string; text: string; checked: boolean }[];
}

interface SupplementProps {
  items: { name: string; dose: string; timing: string; taken: boolean }[];
}

interface DailyCheckInProps {
  date: string;
  questions: { id: string; label: string; type: 'number' | 'slider' | 'text'; min?: number; max?: number }[];
}

interface QuickActionsProps {
  title: string;
  actions: { id: string; label: string; icon: string }[];
}

interface LiveSessionProps {
  workoutId: string;
  title: string;
  exercises: {
    id: string;
    name: string;
    target: { sets: number; reps: string; rpe?: number };
    setsCompleted: { weight: number; reps: number }[];
  }[];
}

interface SmartGroceryListProps {
  title: string;
  categories: {
    name: string;
    items: { id: string; name: string; amount: string; checked: boolean }[];
  }[];
}

interface BodyCompVisualizerProps {
  title: string;
  metrics: string[]; // e.g., ["sleep", "energy"]
  dataPoints: { date: string; [key: string]: number | string }[];
}

interface PlateCalculatorProps {
  targetWeight: number;
  barWeight?: number; // default 20
}

interface HabitStreakProps {
  streakDays: number;
  message: string;
}

interface BreathworkProps {
  durationSeconds?: number;
  technique?: 'box' | '4-7-8' | 'calm';
}

// --- NEW WIDGET TYPES (Phase 5 - Happy Path) ---

interface MorningCheckinProps {
  date: string;
  greeting: string;
  questions: {
    id: string;
    label: string;
    type: 'slider' | 'select' | 'text';
    options?: string[];
    min?: number;
    max?: number;
  }[];
}

interface DailyBriefingProps {
  greeting: string;
  date: string;
  summary: string;
  items: {
    icon: string;
    label: string;
    value: string;
    status?: 'good' | 'warning' | 'neutral';
  }[];
  todaysFocus?: string;
}

interface RestTimerProps {
  seconds: number;
  exerciseName?: string;
  nextExercise?: string;
  autoStart?: boolean;
}

interface WorkoutCompleteProps {
  workoutId: string;
  title: string;
  duration: number;
  totalVolume: number;
  exercisesCompleted: number;
  prsHit?: number;
  calories?: number;
  message: string;
}

interface PainReportInlineProps {
  reportId?: string;
  bodyZone?: string;
  painLevel?: number;
  painType?: string;
  triggers?: string[];
  duration?: string;
  recommendation?: string;
}

interface SafeVariantProps {
  originalExercise: string;
  issue: string;
  variants: {
    name: string;
    reason: string;
    safetyLevel: 'green' | 'yellow' | 'red';
  }[];
  avoidCompletely?: string[];
}

interface PreWorkoutFuelProps {
  timeToWorkout: number;
  workoutType: string;
  workoutIntensity: 'low' | 'moderate' | 'high';
  recommendation: {
    timing: string;
    carbs: string;
    protein: string;
    fat: string;
    hydration: string;
  };
  mealSuggestions: {
    name: string;
    carbs: number;
    protein: number;
  }[];
  avoid?: string[];
}

interface PostWorkoutWindowProps {
  windowStatus: 'open' | 'closing' | 'closed';
  minutesSinceWorkout: number;
  optimalWindow: number;
  priority: {
    protein: { amount: string; reason: string };
    carbs: { amount: string; reason: string };
    hydration: { amount: string; reason: string };
  };
  suggestions: {
    name: string;
    protein: number;
    carbs: number;
  }[];
  urgency?: string;
}

interface HydrationReminderProps {
  targetLiters: number;
  consumed: number;
  remaining: number;
  glasses: { consumed: number; target: number };
  lastDrink?: string;
  reminder?: string;
  tips?: string[];
}

interface RecoveryScoreProps {
  score: number;
  status: 'excellent' | 'good' | 'moderate' | 'low';
  factors: {
    name: string;
    value: number;
    unit?: string;
    status: 'good' | 'below_baseline' | 'above_baseline' | 'elevated' | 'low';
  }[];
  recommendation: string;
  suggestedIntensity: 'high' | 'medium' | 'low' | 'rest';
}

type AgentMeta = {
  name: AgentType;
  color: string;
  icon: any;
};

const getAgentMeta = (agent?: AgentType, fallback: AgentType = 'GENESIS'): AgentMeta => {
  const resolved = (agent || fallback).toUpperCase();

  switch (resolved) {
    // Original 5 agents
    case 'BLAZE':
      return { name: 'BLAZE', color: COLORS.blaze, icon: Zap };
    case 'SAGE':
      return { name: 'SAGE', color: COLORS.sage, icon: UtensilsCrossed };
    case 'SPARK':
      return { name: 'SPARK', color: COLORS.spark, icon: Flame };
    case 'STELLA':
      return { name: 'STELLA', color: COLORS.stella, icon: Brain };
    case 'LOGOS':
      return { name: 'LOGOS', color: COLORS.logos, icon: Lightbulb };
    // New 7 agents (Phase 4)
    case 'TEMPO':
      return { name: 'TEMPO', color: COLORS.tempo, icon: Heart };
    case 'ATLAS':
      return { name: 'ATLAS', color: COLORS.atlas, icon: Bone };
    case 'WAVE':
      return { name: 'WAVE', color: COLORS.wave, icon: Waves };
    case 'METABOL':
      return { name: 'METABOL', color: COLORS.metabol, icon: Dna };
    case 'MACRO':
      return { name: 'MACRO', color: COLORS.macro, icon: Apple };
    case 'NOVA':
      return { name: 'NOVA', color: COLORS.nova, icon: Sparkles };
    case 'LUNA':
      return { name: 'LUNA', color: COLORS.luna, icon: Moon };
    default:
      return { name: 'GENESIS', color: COLORS.genesis, icon: Cpu };
  }
};

const AgentCard: React.FC<{
  agent?: AgentType;
  fallback: AgentType;
  className?: string;
  children: React.ReactNode;
}> = ({ agent, fallback, className, children }) => {
  const meta = getAgentMeta(agent, fallback);

  return (
    <GlassCard borderColor={meta.color} className={className}>
      <AgentBadge name={meta.name} color={meta.color} icon={meta.icon} />
      {children}
    </GlassCard>
  );
};

// --- Widget Components ---

export const ProgressDashboard: React.FC<{ data: DashboardProps; agent?: AgentType }> = ({ data, agent }) => {
  const meta = getAgentMeta(agent, 'STELLA');

  return (
    <AgentCard agent={agent} fallback="STELLA">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-white text-sm">{data.title || 'Resumen'}</h3>
          <p className="text-[10px] text-white/40">{data.subtitle}</p>
        </div>
        <span className="text-xl font-bold text-white">{data.progress}%</span>
      </div>
      <ProgressBar value={data.progress} max={100} color={meta.color} />
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.metrics?.map((m, i) => (
          <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5">
            <p className="text-[9px] uppercase text-white/40">{m.label}</p>
            <span className="font-bold text-white">{m.value}</span>
          </div>
        ))}
      </div>
    </AgentCard>
  );
};

export const WorkoutCard: React.FC<{ data: WorkoutCardProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'BLAZE');

  return (
    <AgentCard agent={agent} fallback="BLAZE">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-white">{data.title}</h3>
          <p className="text-[10px] text-white/40">{data.category}</p>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/70">{data.duration}</span>
      </div>
      <div className="space-y-2 mb-4">
        {data.exercises?.slice(0, 3).map((ex, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${meta.color}33`, color: meta.color }}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-xs text-white">{ex.name}</p>
              <p className="text-[10px] text-white/40">{ex.sets}×{ex.reps} · {ex.load}</p>
            </div>
          </div>
        ))}
      </div>
      {data.coachNote && (
        <div className="mb-4 p-3 rounded-lg text-xs text-white/80 italic" style={{ background: `${meta.color}1A`, border: `1px solid ${meta.color}33` }}>
          Note: {data.coachNote}
        </div>
      )}
      <ActionButton color={meta.color} onClick={() => onAction('START_WORKOUT', { id: data.workoutId })}>
        Comenzar
      </ActionButton>
    </AgentCard>
  );
};

export const MealPlan: React.FC<{ data: MealPlanProps; agent?: AgentType }> = ({ data, agent }) => (
  <AgentCard agent={agent} fallback="SAGE">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-bold text-white">Plan</h3>
      <span className="text-xs text-white/40">{data.totalKcal} kcal</span>
    </div>
    <div className="space-y-2">
      {data.meals?.map((m, i) => (
        <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${m.highlight ? 'bg-[#FBBF24]/10 border border-[#FBBF24]/20' : 'bg-white/5'}`}>
          <span className="text-[10px] font-bold text-white/50 w-12">{m.time}</span>
          <span className={`text-xs flex-1 ${m.highlight ? 'text-[#FBBF24] font-bold' : 'text-white'}`}>{m.name}</span>
          <span className="text-[10px] text-white/30">{m.kcal}</span>
        </div>
      ))}
    </div>
  </AgentCard>
);

export const HydrationTracker: React.FC<{ data: HydrationProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'SAGE');

  return (
    <AgentCard agent={agent} fallback="SAGE">
      <div className="flex justify-between items-end mb-3">
        <span className="text-[10px] font-bold text-white/40 uppercase">Hidratación</span>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: meta.color }}>{data.current}</span>
          <span className="text-xs text-white/30"> / {data.goal}ml</span>
        </div>
      </div>
      <ProgressBar value={data.current} max={data.goal} color={meta.color} />
      <div className="flex gap-2 mt-4">
        <ActionButton variant="secondary" onClick={() => onAction('ADD_WATER', 250)}>+250</ActionButton>
        <ActionButton color={meta.color} onClick={() => onAction('ADD_WATER', 500)}>+500</ActionButton>
      </div>
    </AgentCard>
  );
};

export const RecipeCard: React.FC<{ data: RecipeProps; agent?: AgentType }> = ({ data, agent }) => (
  <AgentCard agent={agent} fallback="SAGE">
    <div className="mb-4">
      <div className="flex gap-2 mb-2 flex-wrap">
        {data.tags?.map((tag, i) => (
          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 uppercase tracking-wide">
            {tag}
          </span>
        ))}
      </div>
      <h3 className="font-bold text-white text-lg">{data.title}</h3>
      <div className="flex gap-4 mt-2 text-xs text-white/50">
        <span className="flex items-center gap-1"><Clock size={12} /> {data.time}</span>
        <span className="flex items-center gap-1"><Flame size={12} /> {data.kcal} kcal</span>
      </div>
    </div>
    <div className="space-y-4">
      <div className="bg-white/5 p-3 rounded-xl">
        <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Ingredientes</p>
        <ul className="text-xs text-white/80 space-y-1">
          {data.ingredients?.map((ing, i) => <li key={i}>• {ing}</li>)}
        </ul>
      </div>
      <div>
        <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Instrucciones</p>
        <ol className="text-xs text-white/80 space-y-2 list-decimal list-inside">
          {data.instructions?.map((inst, i) => <li key={i} className="pl-1">{inst}</li>)}
        </ol>
      </div>
    </div>
  </AgentCard>
);

export const SleepAnalysis: React.FC<{ data: SleepProps; agent?: AgentType }> = ({ data, agent }) => {
  const meta = getAgentMeta(agent, 'STELLA');

  return (
    <AgentCard agent={agent} fallback="STELLA">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-white font-bold">Sleep Score</h3>
          <p className="text-xs text-white/50">{data.quality} Quality</p>
        </div>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
            <circle cx="32" cy="32" r="28" stroke={meta.color} strokeWidth="4" fill="none" 
              strokeDasharray={175} strokeDashoffset={175 - (175 * data.score) / 100} className="transition-all duration-1000" />
          </svg>
          <span className="absolute text-sm font-bold">{data.score}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40 uppercase">Deep</p>
          <p className="text-sm font-bold text-white">{data.stages.deep}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40 uppercase">REM</p>
          <p className="text-sm font-bold text-white">{data.stages.rem}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40 uppercase">Light</p>
          <p className="text-sm font-bold text-white">{data.stages.light}</p>
        </div>
      </div>
    </AgentCard>
  );
};

export const TimerWidget: React.FC<{ data: TimerProps; agent?: AgentType }> = ({ data, agent }) => {
  const [timeLeft, setTimeLeft] = useState(data.seconds);
  const [isActive, setIsActive] = useState(data.autoStart || false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AgentCard agent={agent} fallback="BLAZE">
      <div className="text-center py-4">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{data.label}</p>
        <div className="text-5xl font-mono font-bold text-white mb-6 tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="flex justify-center gap-3">
          <button onClick={() => setIsActive(!isActive)} 
            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-opacity-90 transition-all">
            {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          <button onClick={() => { setIsActive(false); setTimeLeft(data.seconds); }} 
            className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </AgentCard>
  );
};

export const QuoteCard: React.FC<{ data: QuoteProps; agent?: AgentType }> = ({ data, agent }) => (
  <AgentCard agent={agent} fallback="SPARK">
    <div className="text-center px-2 py-4">
      <p className="text-lg font-serif italic text-white/90 leading-relaxed mb-4">"{data.quote}"</p>
      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-2" />
      <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{data.author}</p>
    </div>
  </AgentCard>
);

// Insight Card - STELLA's analysis and recommendations
export const InsightCard: React.FC<{ data: InsightProps; agent?: AgentType }> = ({ data, agent }) => {
  const trendConfig = {
    positive: { icon: TrendingUp, color: '#00FF88', label: 'Positivo' },
    negative: { icon: TrendingDown, color: '#FF4444', label: 'Atención' },
    neutral: { icon: Activity, color: '#6366F1', label: 'Neutral' },
  };

  const trend = data.trend || 'neutral';
  const TrendIcon = trendConfig[trend].icon;
  const trendColor = trendConfig[trend].color;

  return (
    <AgentCard agent={agent} fallback="STELLA">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">{data.title}</h3>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${trendColor}20`, color: trendColor }}
          >
            <TrendIcon size={12} />
            <span>{trendConfig[trend].label}</span>
          </div>
        </div>

        <p className="text-white/80 text-sm leading-relaxed">{data.insight}</p>

        {data.recommendation && (
          <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-start gap-2">
              <Lightbulb size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/70 text-xs leading-relaxed">{data.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </AgentCard>
  );
};

export const SupplementStack: React.FC<{ data: SupplementProps; agent?: AgentType }> = ({ data, agent }) => (
  <AgentCard agent={agent} fallback="SAGE">
    <h3 className="font-bold text-white text-sm mb-3">Daily Stack</h3>
    <div className="space-y-2">
      {data.items?.map((item, i) => (
        <div key={i} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.taken ? 'bg-[#00FF88]' : 'bg-white/20'}`} />
            <div>
              <p className="text-xs font-bold text-white">{item.name}</p>
              <p className="text-[10px] text-white/40">{item.dose} · {item.timing}</p>
            </div>
          </div>
          {item.taken && <CheckCircle2 size={14} className="text-[#00FF88]" />}
        </div>
      ))}
    </div>
  </AgentCard>
);

export const ChecklistWidget: React.FC<{ data: ChecklistProps; agent?: AgentType }> = ({ data, agent }) => {
  const [items, setItems] = useState(data.items);

  const toggleItem = (idx: number) => {
    const newItems = [...items];
    newItems[idx].checked = !newItems[idx].checked;
    setItems(newItems);
  };

  return (
    <AgentCard agent={agent} fallback="SPARK">
      <h3 className="font-bold text-white text-sm mb-3">{data.title}</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div 
            key={i} 
            onClick={() => toggleItem(i)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              item.checked ? 'bg-[#00FF88]/10 border-[#00FF88]/20 opacity-60' : 'bg-white/5 border-transparent hover:bg-white/10'
            }`}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              item.checked ? 'bg-[#00FF88] border-[#00FF88]' : 'border-white/30'
            }`}>
              {item.checked && <CheckCircle2 size={12} className="text-black" />}
            </div>
            <span className={`text-xs ${item.checked ? 'line-through text-white/50' : 'text-white'}`}>{item.text}</span>
          </div>
        ))}
      </div>
    </AgentCard>
  );
};

// --- NEW INTERACTIVE WIDGETS ---

// 11. Daily Check-in Widget (Form)
export const DailyCheckIn: React.FC<{ data: DailyCheckInProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const meta = getAgentMeta(agent, 'SPARK');

  const handleChange = (id: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAction('SUBMIT_CHECKIN', { date: data.date, answers });
  };

  if (submitted) {
    return (
      <AgentCard agent={agent} fallback="SPARK">
        <div className="flex items-center gap-3 text-[#00FF88]">
          <CheckCircle2 size={24} />
          <p className="text-sm font-bold">Check-in Completado</p>
        </div>
      </AgentCard>
    );
  }

  return (
    <AgentCard agent={agent} fallback="SPARK">
      <h3 className="font-bold text-white text-sm mb-1">Daily Check-in</h3>
      <p className="text-[10px] text-white/40 mb-4">{data.date}</p>

      <div className="space-y-4 mb-6">
        {data.questions.map((q) => (
          <div key={q.id}>
            <p className="text-xs text-white/80 mb-2">{q.label}</p>
            {q.type === 'slider' ? (
              <GlassSlider 
                min={q.min || 1} 
                max={q.max || 10} 
                value={Number(answers[q.id] || q.min || 1)} 
                onChange={(val) => handleChange(q.id, val)}
              />
            ) : (
              <GlassInput 
                type={q.type} 
                placeholder="..." 
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <ActionButton onClick={handleSubmit} color={meta.color}>Guardar Registro</ActionButton>
    </AgentCard>
  );
};

// 12. Quick Actions
export const QuickActions: React.FC<{ data: QuickActionsProps; onAction: (id: string, payload: any) => void }> = ({ data, onAction }) => {
  const icons: Record<string, any> = { food: UtensilsCrossed, dumbbell: Zap, water: Droplets, sleep: Moon, activity: Activity };

  return (
    <div className="grid grid-cols-2 gap-2 mb-2 animate-in">
      {data.actions.map((action) => {
        const Icon = icons[action.icon] || Zap;
        return (
          <button 
            key={action.id}
            onClick={() => onAction(action.id, {})}
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/80">
              <Icon size={14} />
            </div>
            <span className="text-xs font-bold text-white/90">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// 13. Live Session Tracker
interface SetRecord {
  weight: number;
  reps: number;
}

interface ExerciseProgress {
  exerciseId: string;
  sets: SetRecord[];
}

export const LiveSessionTracker: React.FC<{ data: LiveSessionProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [isFinished, setIsFinished] = useState(false);
  const meta = getAgentMeta(agent, 'BLAZE');

  // Track all completed sets locally
  const [workoutLog, setWorkoutLog] = useState<ExerciseProgress[]>(
    data.exercises.map(ex => ({ exerciseId: ex.id, sets: [] }))
  );

  const currentExercise = data.exercises[currentExerciseIdx];
  const currentExerciseLog = workoutLog[currentExerciseIdx];

  // Calculate total progress
  const totalSets = data.exercises.reduce((sum, ex) => sum + ex.target.sets, 0);
  const completedSets = workoutLog.reduce((sum, ex) => sum + ex.sets.length, 0);
  const progress = (completedSets / totalSets) * 100;

  // Get previous set for reference
  const previousSet = currentExerciseLog.sets[currentSetIdx - 1];

  const handleLogSet = () => {
    const newSet: SetRecord = {
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0
    };

    // Update local workout log
    setWorkoutLog(prev => {
      const updated = [...prev];
      updated[currentExerciseIdx] = {
        ...updated[currentExerciseIdx],
        sets: [...updated[currentExerciseIdx].sets, newSet]
      };
      return updated;
    });

    // Advance to next set or exercise
    if (currentSetIdx < currentExercise.target.sets - 1) {
      setCurrentSetIdx(s => s + 1);
      setWeight('');
      setReps('');
    } else {
      // Exercise finished
      if (currentExerciseIdx < data.exercises.length - 1) {
        setCurrentExerciseIdx(e => e + 1);
        setCurrentSetIdx(0);
        setWeight('');
        setReps('');
      } else {
        // Workout finished - send summary to backend
        setIsFinished(true);
        const summary = {
          workoutId: data.workoutId,
          title: data.title,
          exercises: data.exercises.map((ex, idx) => ({
            name: ex.name,
            target: ex.target,
            completed: [...workoutLog[idx].sets, ...(idx === currentExerciseIdx ? [newSet] : [])]
          })),
          totalVolume: workoutLog.reduce((sum, ex, idx) => {
            const sets = idx === currentExerciseIdx ? [...ex.sets, newSet] : ex.sets;
            return sum + sets.reduce((s, set) => s + (set.weight * set.reps), 0);
          }, 0)
        };
        onAction('FINISH_WORKOUT', summary);
      }
    }
  };

  if (isFinished) {
    return (
      <AgentCard agent={agent} fallback="BLAZE">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔥</div>
          <h2 className="text-xl font-bold text-white mb-2">¡Entrenamiento Completado!</h2>
          <p className="text-white/60 text-sm">BLAZE está preparando tu resumen...</p>
        </div>
      </AgentCard>
    );
  }

  return (
    <AgentCard agent={agent} fallback="BLAZE">

      {/* Header Progress */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white text-sm">{data.title}</h3>
        <span className="text-[10px] text-white/50">{currentExerciseIdx + 1}/{data.exercises.length}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full mb-4">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: meta.color }} />
      </div>

      {/* Current Exercise */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">{currentExercise.name}</h2>
        <div className="flex gap-2 text-xs text-white/50">
          <span>Target: {currentExercise.target.sets} sets × {currentExercise.target.reps}</span>
          {currentExercise.target.rpe && <span>@ RPE {currentExercise.target.rpe}</span>}
        </div>
      </div>

      {/* Sets Progress Indicators */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: currentExercise.target.sets }).map((_, idx) => (
          <div
            key={idx}
            className={`flex-1 h-2 rounded-full transition-all ${
              idx < currentExerciseLog.sets.length
                ? ''
                : idx === currentSetIdx
                ? 'animate-pulse'
                : 'bg-white/10'
            }`}
            style={{ background: idx < currentExerciseLog.sets.length ? meta.color : idx === currentSetIdx ? `${meta.color}80` : undefined }}
          />
        ))}
      </div>

      {/* Completed Sets Summary */}
      {currentExerciseLog.sets.length > 0 && (
        <div className="mb-4 space-y-1">
          {currentExerciseLog.sets.map((set, idx) => (
            <div key={idx} className="flex justify-between text-xs text-white/50 bg-white/5 rounded-lg px-3 py-1">
              <span>Set {idx + 1}</span>
              <span>{set.weight}kg × {set.reps} reps</span>
            </div>
          ))}
        </div>
      )}

      {/* Set Input */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>
            Set {currentSetIdx + 1} / {currentExercise.target.sets}
          </span>
          <span className="text-[10px] text-white/40">
            {previousSet ? `Previous: ${previousSet.weight}kg × ${previousSet.reps}` : 'Previous: --'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-white/40 block mb-1 uppercase">Peso (kg)</label>
            <GlassInput
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 block mb-1 uppercase">Reps</label>
            <GlassInput
              type="text"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <ActionButton color={meta.color} onClick={handleLogSet}>
        {currentSetIdx < currentExercise.target.sets - 1
          ? `Registrar Set ${currentSetIdx + 1}`
          : currentExerciseIdx < data.exercises.length - 1
            ? 'Siguiente Ejercicio →'
            : '🔥 Terminar Entrenamiento'}
      </ActionButton>
    </AgentCard>
  );
};

// 14. Smart Grocery List
export const SmartGroceryList: React.FC<{ data: SmartGroceryListProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [categories, setCategories] = useState(data.categories);
  const meta = getAgentMeta(agent, 'SAGE');

  const toggleItem = (catIdx: number, itemIdx: number) => {
    const newCats = [...categories];
    newCats[catIdx].items[itemIdx].checked = !newCats[catIdx].items[itemIdx].checked;
    setCategories(newCats);
  };

  const handleFinish = () => {
    const checkedItems = categories.flatMap(c => c.items).filter(i => i.checked).map(i => i.id);
    onAction('GROCERY_CHECK', { itemsChecked: checkedItems });
  };

  return (
    <AgentCard agent={agent} fallback="SAGE">
      <h3 className="font-bold text-white mb-4">{data.title}</h3>
      
      <div className="space-y-6 mb-6">
        {categories.map((cat, cIdx) => (
          <div key={cIdx}>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">{cat.name}</p>
            <div className="space-y-2">
              {cat.items.map((item, iIdx) => (
                <div 
                  key={item.id}
                  onClick={() => toggleItem(cIdx, iIdx)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    item.checked ? 'bg-[#00FF88]/10 border-[#00FF88]/20 opacity-60' : 'bg-white/5 border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      item.checked ? 'bg-[#00FF88] border-[#00FF88]' : 'border-white/30'
                    }`}>
                      {item.checked && <CheckCircle2 size={12} className="text-black" />}
                    </div>
                    <span className={`text-xs ${item.checked ? 'line-through text-white/50' : 'text-white'}`}>{item.name}</span>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ActionButton color={meta.color} onClick={handleFinish}>
        Finalizar Compra
      </ActionButton>
    </AgentCard>
  );
};

// 15. Body Composition & Trends Visualizer
export const BodyCompVisualizer: React.FC<{ data: BodyCompVisualizerProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  // Simple SVG chart logic
  const height = 150;
  const width = 300;
  const padding = 20;
  const points = data.dataPoints;
  const metricA = data.metrics[0];
  const metricB = data.metrics[1];

  const getPoints = (metric: string) => {
    const max = Math.max(...points.map(p => Number(p[metric]) || 0)) || 10;
    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((Number(p[metric]) || 0) / max) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');
  };

  const handleClick = (pointIndex: number) => {
    onAction('ANALYZE_TREND', { 
      date: points[pointIndex].date,
      metrics: {
        [metricA]: points[pointIndex][metricA],
        [metricB]: points[pointIndex][metricB]
      }
    });
  };

  return (
    <AgentCard agent={agent} fallback="STELLA">
      <h3 className="font-bold text-white mb-1">{data.title}</h3>
      <div className="flex gap-4 text-[10px] uppercase tracking-wider mb-4">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#A855F7]"></span>
          <span className="text-white/60">{metricA}</span>
        </div>
        {metricB && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00D4FF]"></span>
            <span className="text-white/60">{metricB}</span>
          </div>
        )}
      </div>

      <div className="relative w-full h-[150px] bg-white/5 rounded-xl border border-white/5 overflow-hidden">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Metric A Line (Purple) */}
          <polyline 
            points={getPoints(metricA)} 
            fill="none" 
            stroke="#A855F7" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          
          {/* Metric B Line (Blue) */}
          {metricB && (
            <polyline 
              points={getPoints(metricB)} 
              fill="none" 
              stroke="#00D4FF" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeDasharray="4 4"
            />
          )}

          {/* Interactive Dots */}
          {points.map((p, i) => {
             const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
             return (
               <g key={i} onClick={() => handleClick(i)} className="cursor-pointer group">
                 <circle cx={x} cy={height-padding + 10} r="10" fill="transparent" />
                 <text x={x} y={height - 5} fontSize="8" fill="white" textAnchor="middle" opacity="0.5">{p.date}</text>
                 <line x1={x} y1={padding} x2={x} y2={height-padding} stroke="white" strokeWidth="1" opacity="0" className="group-hover:opacity-10 transition-opacity" />
               </g>
             );
          })}
        </svg>
      </div>
      <p className="text-[10px] text-white/30 text-center mt-2 italic">Toca un día para analizar correlaciones.</p>
    </AgentCard>
  );
};

// 16. Plate Calculator (Utility)
export const PlateCalculator: React.FC<{ data: PlateCalculatorProps; agent?: AgentType }> = ({ data, agent }) => {
  const [weight, setWeight] = useState(data.targetWeight);
  const bar = data.barWeight || 20;
  
  const calculatePlates = (target: number) => {
    if (target < bar) return [];
    let remaining = (target - bar) / 2;
    const plates: number[] = [];
    const available = [25, 20, 15, 10, 5, 2.5, 1.25];
    
    for (const p of available) {
      while (remaining >= p) {
        plates.push(p);
        remaining -= p;
      }
    }
    return plates;
  };

  const plates = calculatePlates(weight);

  return (
    <AgentCard agent={agent} fallback="BLAZE">
      <h3 className="font-bold text-white text-sm mb-4">Calculadora de Carga</h3>
      
      <div className="flex items-center gap-4 mb-6 justify-center">
        <button onClick={() => setWeight(w => w - 2.5)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">-</button>
        <div className="text-center">
          <span className="text-3xl font-bold text-white">{weight}</span>
          <span className="text-xs text-white/40 block">kg total</span>
        </div>
        <button onClick={() => setWeight(w => w + 2.5)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">+</button>
      </div>

      <div className="flex items-center justify-center gap-1 h-24 bg-white/5 rounded-xl mb-2 relative overflow-hidden">
        {/* Barbell end */}
        <div className="absolute left-0 w-full h-2 bg-gray-500 z-0"></div>
        <div className="h-4 w-8 bg-gray-400 z-10 rounded-sm"></div> {/* Collar */}
        
        {plates.map((p, i) => {
          // Visual scaling for plates
          const height = p >= 20 ? 80 : p >= 10 ? 60 : p >= 5 ? 40 : 25;
          const color = p >= 25 ? '#FF0000' : p >= 20 ? '#0000FF' : p >= 10 ? '#00FF00' : '#FFFFFF';
          return (
            <div key={i} className="w-4 z-10 rounded-sm border border-black/20 flex items-center justify-center shadow-lg" 
              style={{ height: `${height}px`, backgroundColor: color }}>
              {height > 30 && <span className="text-[8px] -rotate-90 font-bold text-black/50">{p}</span>}
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-white/40">Por lado (Barra {bar}kg)</p>
    </AgentCard>
  );
};

// 17. Habit Streak Flame (Gamification)
export const HabitStreakFlame: React.FC<{ data: HabitStreakProps; agent?: AgentType }> = ({ data, agent }) => {
  return (
    <AgentCard agent={agent} fallback="SPARK">
      <div className="text-center py-4">
        <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          {/* Simple CSS-like flame layers */}
          <div className="absolute bottom-0 w-16 h-16 bg-orange-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <Flame size={80} className="relative z-10 text-[#FFB800] drop-shadow-[0_0_15px_rgba(255,184,0,0.5)] animate-bounce" fill="currentColor" />
          <div className="absolute -bottom-2 w-12 h-4 bg-yellow-300 rounded-full blur-md opacity-80"></div>
        </div>
        <h2 className="text-4xl font-bold text-white mb-1">{data.streakDays}</h2>
        <p className="text-xs font-bold text-[#FFB800] uppercase tracking-widest mb-2">Días de Racha</p>
        <p className="text-xs text-white/60 italic">"{data.message}"</p>
      </div>
    </AgentCard>
  );
};

// 18. Breathwork Guide (Mindset Tool)
export const BreathworkGuide: React.FC<{ data: BreathworkProps; agent?: AgentType }> = ({ data, agent }) => {
  const [phase, setPhase] = useState<'Inhalar' | 'Sostener' | 'Exhalar'>('Inhalar');
  const [scale, setScale] = useState(1);
  const meta = getAgentMeta(agent, 'STELLA');
  
  useEffect(() => {
    // 4-4-4 Box Breathing loop
    const cycle = async () => {
      while(true) {
        setPhase('Inhalar'); setScale(1.5);
        await new Promise(r => setTimeout(r, 4000));
        setPhase('Sostener');
        await new Promise(r => setTimeout(r, 4000));
        setPhase('Exhalar'); setScale(1);
        await new Promise(r => setTimeout(r, 4000));
        setPhase('Sostener');
        await new Promise(r => setTimeout(r, 4000));
      }
    };
    cycle();
  }, []);

  return (
    <AgentCard agent={agent} fallback="STELLA">
      <div className="h-48 flex flex-col items-center justify-center py-4 relative overflow-hidden">
        <div 
          className="w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-[4000ms] ease-in-out relative z-10"
          style={{ borderColor: `${meta.color}4D`, transform: `scale(${scale})`, backgroundColor: `${meta.color}${scale === 1.5 ? '33' : '00'}` }}
        >
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        
        {/* Ripples */}
        <div className="absolute w-full h-full flex items-center justify-center pointer-events-none">
           <div className={`w-32 h-32 rounded-full border absolute transition-all duration-[4000ms] ${scale === 1.5 ? 'scale-150 opacity-0' : 'scale-50 opacity-100'}`} style={{ borderColor: `${meta.color}33` }} />
        </div>

        <div className="absolute bottom-4 text-center z-20">
          <p className="text-xl font-bold text-white tracking-widest uppercase animate-pulse">{phase}</p>
          <p className="text-[10px] text-white/40 mt-1">4-4-4 Box Breathing</p>
        </div>
      </div>
    </AgentCard>
  );
};

// ============================================
// PHASE 5 - HAPPY PATH WIDGETS
// ============================================

// 19. Morning Check-in (SPARK)
export const MorningCheckin: React.FC<{ data: MorningCheckinProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const meta = getAgentMeta(agent, 'SPARK');

  const handleChange = (id: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAction('SUBMIT_MORNING_CHECKIN', { date: data.date, answers });
  };

  if (submitted) {
    return (
      <AgentCard agent={agent} fallback="SPARK">
        <div className="text-center py-6">
          <Sun size={48} className="mx-auto mb-3" style={{ color: meta.color }} />
          <h3 className="text-lg font-bold text-white mb-1">¡Buenos días!</h3>
          <p className="text-sm text-white/60">Check-in registrado. GENESIS está preparando tu día.</p>
        </div>
      </AgentCard>
    );
  }

  return (
    <AgentCard agent={agent} fallback="SPARK">
      <div className="flex items-center gap-3 mb-4">
        <Sun size={24} style={{ color: meta.color }} />
        <div>
          <h3 className="font-bold text-white">{data.greeting}</h3>
          <p className="text-[10px] text-white/40">{data.date}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {data.questions.map((q) => (
          <div key={q.id}>
            <p className="text-xs text-white/80 mb-2">{q.label}</p>
            {q.type === 'slider' ? (
              <GlassSlider
                min={q.min || 1}
                max={q.max || 10}
                value={Number(answers[q.id] || q.min || 1)}
                onChange={(val) => handleChange(q.id, val)}
              />
            ) : q.type === 'select' && q.options ? (
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChange(q.id, opt)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      answers[q.id] === opt
                        ? 'text-black font-bold'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                    style={answers[q.id] === opt ? { backgroundColor: meta.color } : {}}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <GlassInput
                type="text"
                placeholder="..."
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <ActionButton onClick={handleSubmit} color={meta.color}>
        Comenzar el Día
      </ActionButton>
    </AgentCard>
  );
};

// 20. Daily Briefing (GENESIS)
export const DailyBriefing: React.FC<{ data: DailyBriefingProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'GENESIS');

  const iconMap: Record<string, any> = {
    workout: Zap,
    nutrition: UtensilsCrossed,
    sleep: Moon,
    recovery: Waves,
    hydration: Droplets,
    streak: Flame,
    focus: Target,
    default: Activity
  };

  const statusColors = {
    good: '#00FF88',
    warning: '#FFB800',
    neutral: 'rgba(255,255,255,0.5)'
  };

  return (
    <AgentCard agent={agent} fallback="GENESIS">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{data.greeting}</h3>
        <p className="text-[10px] text-white/40">{data.date}</p>
      </div>

      <p className="text-sm text-white/80 mb-4 leading-relaxed">{data.summary}</p>

      <div className="space-y-2 mb-4">
        {data.items.map((item, idx) => {
          const Icon = iconMap[item.icon] || iconMap.default;
          const statusColor = statusColors[item.status || 'neutral'];
          return (
            <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <Icon size={16} style={{ color: statusColor }} />
                <span className="text-xs text-white/70">{item.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: statusColor }}>{item.value}</span>
            </div>
          );
        })}
      </div>

      {data.todaysFocus && (
        <div className="p-3 rounded-xl border" style={{ backgroundColor: `${meta.color}15`, borderColor: `${meta.color}30` }}>
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} style={{ color: meta.color }} />
            <span className="text-[10px] font-bold text-white/50 uppercase">Enfoque del Día</span>
          </div>
          <p className="text-sm text-white font-medium">{data.todaysFocus}</p>
        </div>
      )}
    </AgentCard>
  );
};

// 21. Rest Timer (BLAZE) - Floating compact timer
export const RestTimer: React.FC<{ data: RestTimerProps; onAction?: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [timeLeft, setTimeLeft] = useState(data.seconds);
  const [isActive, setIsActive] = useState(data.autoStart ?? true);
  const meta = getAgentMeta(agent, 'BLAZE');

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      onAction?.('REST_COMPLETE', { exerciseName: data.exerciseName });
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onAction, data.exerciseName]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = ((data.seconds - timeLeft) / data.seconds) * 100;

  return (
    <div
      className="fixed bottom-24 right-4 z-50 p-4 rounded-2xl backdrop-blur-xl border shadow-2xl"
      style={{
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderColor: `${meta.color}40`,
        boxShadow: `0 0 30px ${meta.color}20`
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
            <circle
              cx="32" cy="32" r="28"
              stroke={meta.color}
              strokeWidth="4"
              fill="none"
              strokeDasharray={175}
              strokeDashoffset={175 - (175 * progress) / 100}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-mono font-bold text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-[10px] text-white/50 uppercase">Descanso</p>
          {data.nextExercise && (
            <p className="text-xs text-white/80">Siguiente: <span className="font-bold">{data.nextExercise}</span></p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsActive(!isActive)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: meta.color }}
          >
            {isActive ? <Pause size={16} className="text-black" /> : <Play size={16} className="text-black ml-0.5" />}
          </button>
          <button
            onClick={() => { setTimeLeft(data.seconds); setIsActive(true); }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <RotateCcw size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// 22. Workout Complete (BLAZE) - Celebration with stats
export const WorkoutComplete: React.FC<{ data: WorkoutCompleteProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const meta = getAgentMeta(agent, 'BLAZE');

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <AgentCard agent={agent} fallback="BLAZE">
      {/* Confetti effect (CSS-based) */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}px`,
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][i % 5],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center py-4 relative z-10">
        <div className="mb-4">
          <Trophy size={56} className="mx-auto mb-2" style={{ color: meta.color }} />
          <h2 className="text-2xl font-bold text-white mb-1">¡Completado!</h2>
          <p className="text-sm text-white/60">{data.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 p-3 rounded-xl">
            <Clock size={16} className="mx-auto mb-1 text-white/40" />
            <p className="text-lg font-bold text-white">{formatDuration(data.duration)}</p>
            <p className="text-[10px] text-white/40">Duración</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <Zap size={16} className="mx-auto mb-1 text-white/40" />
            <p className="text-lg font-bold text-white">{data.totalVolume.toLocaleString()}</p>
            <p className="text-[10px] text-white/40">Volumen (kg)</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl">
            <CheckCircle2 size={16} className="mx-auto mb-1 text-white/40" />
            <p className="text-lg font-bold text-white">{data.exercisesCompleted}</p>
            <p className="text-[10px] text-white/40">Ejercicios</p>
          </div>
          {data.prsHit && data.prsHit > 0 && (
            <div className="bg-white/5 p-3 rounded-xl" style={{ backgroundColor: `${meta.color}20` }}>
              <PartyPopper size={16} className="mx-auto mb-1" style={{ color: meta.color }} />
              <p className="text-lg font-bold" style={{ color: meta.color }}>{data.prsHit}</p>
              <p className="text-[10px] text-white/40">PRs Nuevos</p>
            </div>
          )}
        </div>

        <p className="text-sm text-white/80 italic mb-4">"{data.message}"</p>

        <ActionButton color={meta.color} onClick={() => onAction('SHARE_WORKOUT', { workoutId: data.workoutId })}>
          Compartir Logro
        </ActionButton>
      </div>
    </AgentCard>
  );
};

// 23. Pain Report Inline (ATLAS)
export const PainReportInline: React.FC<{ data: PainReportInlineProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const [painLevel, setPainLevel] = useState(data.painLevel || 5);
  const [bodyZone, setBodyZone] = useState(data.bodyZone || '');
  const [submitted, setSubmitted] = useState(false);
  const meta = getAgentMeta(agent, 'ATLAS');

  const zones = ['lower_back', 'upper_back', 'shoulders', 'knees', 'hips', 'neck', 'wrists', 'elbows'];
  const zoneLabels: Record<string, string> = {
    lower_back: 'Espalda Baja',
    upper_back: 'Espalda Alta',
    shoulders: 'Hombros',
    knees: 'Rodillas',
    hips: 'Caderas',
    neck: 'Cuello',
    wrists: 'Muñecas',
    elbows: 'Codos'
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAction('REPORT_PAIN', {
      reportId: data.reportId || `pain-${Date.now()}`,
      bodyZone,
      painLevel,
      timestamp: new Date().toISOString()
    });
  };

  if (submitted) {
    return (
      <AgentCard agent={agent} fallback="ATLAS">
        <div className="flex items-center gap-3">
          <ShieldAlert size={24} style={{ color: meta.color }} />
          <div>
            <p className="text-sm font-bold text-white">Dolor registrado</p>
            <p className="text-xs text-white/60">ATLAS está analizando alternativas seguras...</p>
          </div>
        </div>
      </AgentCard>
    );
  }

  return (
    <AgentCard agent={agent} fallback="ATLAS">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={20} style={{ color: meta.color }} />
        <h3 className="font-bold text-white text-sm">¿Sientes molestia?</h3>
      </div>

      <div className="mb-4">
        <p className="text-xs text-white/60 mb-2">Zona afectada</p>
        <div className="flex flex-wrap gap-2">
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setBodyZone(zone)}
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                bodyZone === zone
                  ? 'text-black font-bold'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
              style={bodyZone === zone ? { backgroundColor: meta.color } : {}}
            >
              {zoneLabels[zone]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-white/60">Nivel de dolor</p>
          <span className="text-sm font-bold" style={{ color: painLevel > 6 ? '#FF4444' : painLevel > 3 ? '#FFB800' : meta.color }}>
            {painLevel}/10
          </span>
        </div>
        <GlassSlider min={1} max={10} value={painLevel} onChange={setPainLevel} />
      </div>

      {data.recommendation && (
        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/80">{data.recommendation}</p>
        </div>
      )}

      <ActionButton color={meta.color} onClick={handleSubmit} disabled={!bodyZone}>
        Reportar y Ver Alternativas
      </ActionButton>
    </AgentCard>
  );
};

// 24. Safe Variant (ATLAS)
export const SafeVariant: React.FC<{ data: SafeVariantProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'ATLAS');

  const safetyColors = {
    green: '#00FF88',
    yellow: '#FFB800',
    red: '#FF4444'
  };

  return (
    <AgentCard agent={agent} fallback="ATLAS">
      <div className="mb-4">
        <p className="text-[10px] text-white/40 uppercase mb-1">Alternativas seguras para</p>
        <h3 className="text-lg font-bold text-white">{data.originalExercise}</h3>
        <p className="text-xs text-white/50">Debido a: {data.issue.replace(/_/g, ' ')}</p>
      </div>

      <div className="space-y-2 mb-4">
        {data.variants.map((variant, idx) => (
          <button
            key={idx}
            onClick={() => onAction('SELECT_VARIANT', { original: data.originalExercise, selected: variant.name })}
            className="w-full p-3 rounded-xl bg-white/5 border text-left transition-all hover:bg-white/10"
            style={{ borderColor: `${safetyColors[variant.safetyLevel]}40` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-white">{variant.name}</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: safetyColors[variant.safetyLevel] }}
              />
            </div>
            <p className="text-xs text-white/60">{variant.reason}</p>
          </button>
        ))}
      </div>

      {data.avoidCompletely && data.avoidCompletely.length > 0 && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-[10px] text-red-400 font-bold uppercase mb-1">Evitar hoy</p>
          <p className="text-xs text-white/70">{data.avoidCompletely.join(', ')}</p>
        </div>
      )}
    </AgentCard>
  );
};

// 25. Pre-Workout Fuel (MACRO)
export const PreWorkoutFuel: React.FC<{ data: PreWorkoutFuelProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'MACRO');

  return (
    <AgentCard agent={agent} fallback="MACRO">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coffee size={20} style={{ color: meta.color }} />
          <h3 className="font-bold text-white">Pre-Entreno</h3>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70">
          {data.timeToWorkout} min para entrenar
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40">Carbs</p>
          <p className="text-sm font-bold text-white">{data.recommendation.carbs}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40">Proteína</p>
          <p className="text-sm font-bold text-white">{data.recommendation.protein}</p>
        </div>
      </div>

      <p className="text-[10px] text-white/50 uppercase mb-2">Opciones rápidas</p>
      <div className="space-y-2 mb-4">
        {data.mealSuggestions.slice(0, 3).map((meal, idx) => (
          <button
            key={idx}
            onClick={() => onAction('LOG_PRE_WORKOUT', { meal: meal.name })}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
          >
            <span className="text-sm text-white">{meal.name}</span>
            <span className="text-xs text-white/40">{meal.carbs}c / {meal.protein}p</span>
          </button>
        ))}
      </div>

      {data.avoid && data.avoid.length > 0 && (
        <p className="text-[10px] text-white/40 text-center">
          Evitar: {data.avoid.join(', ')}
        </p>
      )}
    </AgentCard>
  );
};

// 26. Post-Workout Window (MACRO)
export const PostWorkoutWindow: React.FC<{ data: PostWorkoutWindowProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'MACRO');
  const remainingTime = data.optimalWindow - data.minutesSinceWorkout;
  const urgencyLevel = remainingTime < 15 ? 'high' : remainingTime < 30 ? 'medium' : 'low';

  const urgencyColors = {
    high: '#FF4444',
    medium: '#FFB800',
    low: meta.color
  };

  return (
    <AgentCard agent={agent} fallback="MACRO">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={20} style={{ color: urgencyColors[urgencyLevel] }} />
          <h3 className="font-bold text-white">Ventana Anabólica</h3>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-bold animate-pulse"
          style={{ backgroundColor: `${urgencyColors[urgencyLevel]}20`, color: urgencyColors[urgencyLevel] }}
        >
          {remainingTime > 0 ? `${remainingTime} min restantes` : 'Cerrada'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40">Proteína</p>
          <p className="text-xs font-bold text-white">{data.priority.protein.amount}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40">Carbs</p>
          <p className="text-xs font-bold text-white">{data.priority.carbs.amount}</p>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <p className="text-[10px] text-white/40">Agua</p>
          <p className="text-xs font-bold text-white">{data.priority.hydration.amount}</p>
        </div>
      </div>

      <p className="text-[10px] text-white/50 uppercase mb-2">Opciones post-entreno</p>
      <div className="space-y-2 mb-4">
        {data.suggestions.slice(0, 3).map((meal, idx) => (
          <button
            key={idx}
            onClick={() => onAction('LOG_POST_WORKOUT', { meal: meal.name })}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
          >
            <span className="text-sm text-white">{meal.name}</span>
            <span className="text-xs text-white/40">{meal.protein}p / {meal.carbs}c</span>
          </button>
        ))}
      </div>

      {data.urgency && (
        <p className="text-xs text-center font-bold" style={{ color: urgencyColors[urgencyLevel] }}>
          {data.urgency}
        </p>
      )}
    </AgentCard>
  );
};

// 27. Hydration Reminder (MACRO) - Floating widget
export const HydrationReminder: React.FC<{ data: HydrationReminderProps; onAction: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'MACRO');
  const progress = (data.consumed / data.targetLiters) * 100;

  return (
    <div
      className="fixed bottom-24 left-4 z-50 p-4 rounded-2xl backdrop-blur-xl border shadow-2xl max-w-[200px]"
      style={{
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderColor: `${meta.color}40`,
        boxShadow: `0 0 30px ${meta.color}20`
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Droplets size={20} style={{ color: meta.color }} />
        <div>
          <p className="text-xs font-bold text-white">{data.consumed.toFixed(1)}L / {data.targetLiters}L</p>
          <p className="text-[10px] text-white/40">{data.glasses.consumed} vasos</p>
        </div>
      </div>

      <div className="h-2 bg-white/10 rounded-full mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: meta.color }}
        />
      </div>

      {data.reminder && (
        <p className="text-[10px] text-white/60 mb-3">{data.reminder}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onAction('ADD_WATER', { amount: 250 })}
          className="flex-1 py-2 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-all"
        >
          +250ml
        </button>
        <button
          onClick={() => onAction('ADD_WATER', { amount: 500 })}
          className="flex-1 py-2 rounded-lg text-xs text-black font-bold transition-all"
          style={{ backgroundColor: meta.color }}
        >
          +500ml
        </button>
      </div>
    </div>
  );
};

// 28. Recovery Score (WAVE)
export const RecoveryScore: React.FC<{ data: RecoveryScoreProps; onAction?: (id: string, payload: any) => void; agent?: AgentType }> = ({ data, onAction, agent }) => {
  const meta = getAgentMeta(agent, 'WAVE');

  const statusColors = {
    excellent: '#00FF88',
    good: '#22C55E',
    moderate: '#FFB800',
    low: '#FF4444'
  };

  const factorStatusColors: Record<string, string> = {
    good: '#00FF88',
    below_baseline: '#FFB800',
    above_baseline: '#FFB800',
    elevated: '#FF4444',
    low: '#0EA5E9'
  };

  const intensityLabels = {
    high: 'Alta intensidad OK',
    medium: 'Intensidad moderada',
    low: 'Baja intensidad',
    rest: 'Día de descanso'
  };

  return (
    <AgentCard agent={agent} fallback="WAVE">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white">Recovery Score</h3>
          <p className="text-xs text-white/50 capitalize">{data.status}</p>
        </div>
        <div className="relative w-20 h-20">
          <svg className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="35" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
            <circle
              cx="40" cy="40" r="35"
              stroke={statusColors[data.status]}
              strokeWidth="6"
              fill="none"
              strokeDasharray={220}
              strokeDashoffset={220 - (220 * data.score) / 100}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{data.score}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {data.factors.map((factor, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
            <span className="text-xs text-white/70">{factor.name}</span>
            <span
              className="text-xs font-bold"
              style={{ color: factorStatusColors[factor.status] || meta.color }}
            >
              {factor.value}{factor.unit ? ` ${factor.unit}` : ''}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl" style={{ backgroundColor: `${statusColors[data.status]}15` }}>
        <div className="flex items-center gap-2 mb-1">
          <Gauge size={14} style={{ color: statusColors[data.status] }} />
          <span className="text-[10px] font-bold text-white/50 uppercase">Recomendación</span>
        </div>
        <p className="text-sm font-bold" style={{ color: statusColors[data.status] }}>
          {intensityLabels[data.suggestedIntensity]}
        </p>
        <p className="text-xs text-white/60 mt-1">{data.recommendation}</p>
      </div>
    </AgentCard>
  );
};

export const AlertBanner: React.FC<{ data: AlertProps }> = ({ data }) => (
  <div className={`p-3 rounded-xl border flex items-center gap-3 mb-2 ${
    data.type === 'warning' ? 'bg-[#FFB800]/10 border-[#FFB800]/20'
    : data.type === 'error' ? 'bg-[#FF4444]/10 border-[#FF4444]/20'
    : 'bg-[#00FF88]/10 border-[#00FF88]/20'
  }`}>
    <AlertTriangle size={18} className={
      data.type === 'warning' ? 'text-[#FFB800]'
      : data.type === 'error' ? 'text-[#FF4444]'
      : 'text-[#00FF88]'
    } />
    <p className="text-xs text-white/80 flex-1">{data.message}</p>
  </div>
);

// --- Mediator ---

interface A2UIMediatorProps {
  payload?: WidgetPayload;
  onAction: (id: string, data: any) => void;
  agent?: AgentType;
}

export const A2UIMediator: React.FC<A2UIMediatorProps> = ({ payload, onAction, agent }) => {
  if (!payload || !payload.type) return null;

  switch (payload.type) {
    case 'progress-dashboard':
      return <ProgressDashboard data={payload.props} agent={agent} />;
    case 'workout-card':
      return <WorkoutCard data={payload.props} onAction={onAction} agent={agent} />;
    case 'meal-plan':
      return <MealPlan data={payload.props} agent={agent} />;
    case 'hydration-tracker':
      return <HydrationTracker data={payload.props} onAction={onAction} agent={agent} />;
    case 'recipe-card':
      return <RecipeCard data={payload.props} agent={agent} />;
    case 'sleep-analysis':
      return <SleepAnalysis data={payload.props} agent={agent} />;
    case 'timer-widget':
      return <TimerWidget data={payload.props} agent={agent} />;
    case 'quote-card':
      return <QuoteCard data={payload.props} agent={agent} />;
    case 'insight-card':
      return <InsightCard data={payload.props} agent={agent} />;
    case 'checklist':
      return <ChecklistWidget data={payload.props} agent={agent} />;
    case 'supplement-stack':
      return <SupplementStack data={payload.props} agent={agent} />;
    case 'daily-checkin':
      return <DailyCheckIn data={payload.props} onAction={onAction} agent={agent} />;
    case 'quick-actions':
      return <QuickActions data={payload.props} onAction={onAction} />;
    case 'live-session-tracker':
      return <LiveSessionTracker data={payload.props} onAction={onAction} agent={agent} />;
    case 'smart-grocery-list':
      return <SmartGroceryList data={payload.props} onAction={onAction} agent={agent} />;
    case 'body-comp-visualizer':
      return <BodyCompVisualizer data={payload.props} onAction={onAction} agent={agent} />;
    case 'plate-calculator':
      return <PlateCalculator data={payload.props} agent={agent} />;
    case 'habit-streak':
      return <HabitStreakFlame data={payload.props} agent={agent} />;
    case 'breathwork-guide':
      return <BreathworkGuide data={payload.props} agent={agent} />;
    case 'alert-banner':
      return <AlertBanner data={payload.props} />;
    // Phase 5 - Happy Path Widgets
    case 'morning-checkin':
      return <MorningCheckin data={payload.props} onAction={onAction} agent={agent} />;
    case 'daily-briefing':
      return <DailyBriefing data={payload.props} agent={agent} />;
    case 'rest-timer':
      return <RestTimer data={payload.props} agent={agent} />;
    case 'workout-complete':
      return <WorkoutComplete data={payload.props} onAction={onAction} agent={agent} />;
    case 'pain-report-inline':
      return <PainReportInline data={payload.props} onAction={onAction} agent={agent} />;
    case 'safe-variant':
      return <SafeVariant data={payload.props} onAction={onAction} agent={agent} />;
    case 'pre-workout-fuel':
      return <PreWorkoutFuel data={payload.props} agent={agent} />;
    case 'post-workout-window':
      return <PostWorkoutWindow data={payload.props} onAction={onAction} agent={agent} />;
    case 'hydration-reminder':
      return <HydrationReminder data={payload.props} onAction={onAction} agent={agent} />;
    case 'recovery-score':
      return <RecoveryScore data={payload.props} agent={agent} />;
    default:
      return null;
  }
};