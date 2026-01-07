import React, { useState, useEffect } from 'react';
import {
  Cpu, Zap, UtensilsCrossed, Droplets, AlertTriangle,
  Clock, Moon, CheckCircle2, Play, Pause, RotateCcw,
  Pill, Flame, Activity,
  TrendingUp, TrendingDown, Lightbulb, Brain
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

type AgentMeta = {
  name: AgentType;
  color: string;
  icon: any;
};

const getAgentMeta = (agent?: AgentType, fallback: AgentType = 'GENESIS'): AgentMeta => {
  const resolved = (agent || fallback).toUpperCase();

  switch (resolved) {
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
    default:
      return null;
  }
};