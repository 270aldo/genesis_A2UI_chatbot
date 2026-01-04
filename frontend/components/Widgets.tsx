import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, UtensilsCrossed, Droplets, AlertTriangle, 
  Clock, Moon, CheckCircle2, Play, Pause, RotateCcw,
  Pill, Quote, ListChecks, Flame, ClipboardList, Activity
} from 'lucide-react';
import { GlassCard, AgentBadge, ProgressBar, ActionButton, GlassInput, GlassSlider } from './BaseUI';
import { COLORS } from '../constants';
import { WidgetPayload } from '../types';

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

// --- Widget Components ---

export const ProgressDashboard: React.FC<{ data: DashboardProps }> = ({ data }) => (
  <GlassCard borderColor={COLORS.nexus}>
    <AgentBadge name="NEXUS" color={COLORS.nexus} icon={Cpu} />
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-white text-sm">{data.title || 'Resumen'}</h3>
        <p className="text-[10px] text-white/40">{data.subtitle}</p>
      </div>
      <span className="text-xl font-bold text-white">{data.progress}%</span>
    </div>
    <ProgressBar value={data.progress} max={100} color={COLORS.nexus} />
    <div className="grid grid-cols-2 gap-2 mt-4">
      {data.metrics?.map((m, i) => (
        <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5">
          <p className="text-[9px] uppercase text-white/40">{m.label}</p>
          <span className="font-bold text-white">{m.value}</span>
        </div>
      ))}
    </div>
  </GlassCard>
);

export const WorkoutCard: React.FC<{ data: WorkoutCardProps; onAction: (id: string, payload: any) => void }> = ({ data, onAction }) => (
  <GlassCard borderColor={COLORS.blaze}>
    <AgentBadge name="BLAZE" color={COLORS.blaze} icon={Zap} />
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
          <div className="w-6 h-6 rounded-full bg-[#FF4500]/20 text-[#FF4500] flex items-center justify-center text-[10px] font-bold">
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
      <div className="mb-4 p-3 bg-[#FF4500]/10 border border-[#FF4500]/20 rounded-lg text-xs text-white/80 italic">
        Note: {data.coachNote}
      </div>
    )}
    <ActionButton color={COLORS.blaze} onClick={() => onAction('START_WORKOUT', { id: data.workoutId })}>
      Comenzar
    </ActionButton>
  </GlassCard>
);

export const MealPlan: React.FC<{ data: MealPlanProps }> = ({ data }) => (
  <GlassCard borderColor={COLORS.macro}>
    <AgentBadge name="MACRO" color={COLORS.macro} icon={UtensilsCrossed} />
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-bold text-white">Plan</h3>
      <span className="text-xs text-white/40">{data.totalKcal} kcal</span>
    </div>
    <div className="space-y-2">
      {data.meals?.map((m, i) => (
        <div key={i} className={`flex justify-between items-center p-2 rounded-lg ${m.highlight ? 'bg-[#FFB800]/10 border border-[#FFB800]/20' : 'bg-white/5'}`}>
          <span className="text-[10px] font-bold text-white/50 w-12">{m.time}</span>
          <span className={`text-xs flex-1 ${m.highlight ? 'text-[#FFB800] font-bold' : 'text-white'}`}>{m.name}</span>
          <span className="text-[10px] text-white/30">{m.kcal}</span>
        </div>
      ))}
    </div>
  </GlassCard>
);

export const HydrationTracker: React.FC<{ data: HydrationProps; onAction: (id: string, payload: any) => void }> = ({ data, onAction }) => (
  <GlassCard borderColor={COLORS.aqua}>
    <AgentBadge name="AQUA" color={COLORS.aqua} icon={Droplets} />
    <div className="flex justify-between items-end mb-3">
      <span className="text-[10px] font-bold text-white/40 uppercase">Hidratación</span>
      <div className="text-right">
        <span className="text-2xl font-bold text-[#00D4FF]">{data.current}</span>
        <span className="text-xs text-white/30"> / {data.goal}ml</span>
      </div>
    </div>
    <ProgressBar value={data.current} max={data.goal} color={COLORS.aqua} />
    <div className="flex gap-2 mt-4">
      <ActionButton variant="secondary" onClick={() => onAction('ADD_WATER', 250)}>+250</ActionButton>
      <ActionButton color={COLORS.aqua} onClick={() => onAction('ADD_WATER', 500)}>+500</ActionButton>
    </div>
  </GlassCard>
);

export const RecipeCard: React.FC<{ data: RecipeProps }> = ({ data }) => (
  <GlassCard borderColor={COLORS.macro}>
    <AgentBadge name="MACRO" color={COLORS.macro} icon={UtensilsCrossed} />
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
  </GlassCard>
);

export const SleepAnalysis: React.FC<{ data: SleepProps }> = ({ data }) => (
  <GlassCard borderColor={COLORS.luna}>
    <AgentBadge name="LUNA" color={COLORS.luna} icon={Moon} />
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-white font-bold">Sleep Score</h3>
        <p className="text-xs text-white/50">{data.quality} Quality</p>
      </div>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
          <circle cx="32" cy="32" r="28" stroke={COLORS.luna} strokeWidth="4" fill="none" 
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
  </GlassCard>
);

export const TimerWidget: React.FC<{ data: TimerProps }> = ({ data }) => {
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
    <GlassCard borderColor={COLORS.blaze}>
      <AgentBadge name="BLAZE" color={COLORS.blaze} icon={Clock} />
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
    </GlassCard>
  );
};

export const QuoteCard: React.FC<{ data: QuoteProps }> = ({ data }) => (
  <GlassCard borderColor={COLORS.nexus}>
    <AgentBadge name="NEXUS" color={COLORS.nexus} icon={Quote} />
    <div className="text-center px-2 py-4">
      <p className="text-lg font-serif italic text-white/90 leading-relaxed mb-4">"{data.quote}"</p>
      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-2" />
      <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{data.author}</p>
    </div>
  </GlassCard>
);

export const SupplementStack: React.FC<{ data: SupplementProps }> = ({ data }) => (
  <GlassCard borderColor={COLORS.macro}>
    <AgentBadge name="MACRO" color={COLORS.macro} icon={Pill} />
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
  </GlassCard>
);

export const ChecklistWidget: React.FC<{ data: ChecklistProps }> = ({ data }) => {
  const [items, setItems] = useState(data.items);

  const toggleItem = (idx: number) => {
    const newItems = [...items];
    newItems[idx].checked = !newItems[idx].checked;
    setItems(newItems);
  };

  return (
    <GlassCard borderColor={COLORS.nexus}>
      <AgentBadge name="NEXUS" color={COLORS.nexus} icon={ListChecks} />
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
    </GlassCard>
  );
};

// --- NEW INTERACTIVE WIDGETS ---

// 11. Daily Check-in Widget (Form)
export const DailyCheckIn: React.FC<{ data: DailyCheckInProps; onAction: (id: string, payload: any) => void }> = ({ data, onAction }) => {
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (id: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onAction('SUBMIT_CHECKIN', { date: data.date, answers });
  };

  if (submitted) {
    return (
      <GlassCard borderColor={COLORS.nexus}>
        <AgentBadge name="NEXUS" color={COLORS.nexus} icon={ClipboardList} />
        <div className="flex items-center gap-3 text-[#00FF88]">
          <CheckCircle2 size={24} />
          <p className="text-sm font-bold">Check-in Completado</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard borderColor={COLORS.nexus}>
      <AgentBadge name="NEXUS" color={COLORS.nexus} icon={ClipboardList} />
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
      <ActionButton onClick={handleSubmit} color={COLORS.nexus}>Guardar Registro</ActionButton>
    </GlassCard>
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
export const LiveSessionTracker: React.FC<{ data: LiveSessionProps; onAction: (id: string, payload: any) => void }> = ({ data, onAction }) => {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);

  const currentExercise = data.exercises[currentExerciseIdx];
  const progress = ((currentExerciseIdx) / data.exercises.length) * 100;

  // Initialize inputs with previous set data or empty
  useEffect(() => {
    if (currentExercise.setsCompleted.length > currentSetIdx) {
      const prevSet = currentExercise.setsCompleted[currentSetIdx];
      setWeight(prevSet.weight);
      setReps(prevSet.reps);
    } else {
      setWeight(0);
      setReps(0);
    }
  }, [currentExerciseIdx, currentSetIdx, currentExercise]);

  const handleLogSet = () => {
    onAction('LOG_SET', {
      workoutId: data.workoutId,
      exerciseId: currentExercise.id,
      setIndex: currentSetIdx,
      weight,
      reps
    });

    if (currentSetIdx < currentExercise.target.sets - 1) {
      setCurrentSetIdx(s => s + 1);
    } else {
      // Exercise finished
      if (currentExerciseIdx < data.exercises.length - 1) {
        onAction('FINISH_EXERCISE', { exerciseId: currentExercise.id });
        setCurrentExerciseIdx(e => e + 1);
        setCurrentSetIdx(0);
      } else {
        onAction('FINISH_WORKOUT', { workoutId: data.workoutId });
      }
    }
  };

  return (
    <GlassCard borderColor={COLORS.blaze}>
      <AgentBadge name="BLAZE" color={COLORS.blaze} icon={Zap} />
      
      {/* Header Progress */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white text-sm">{data.title}</h3>
        <span className="text-[10px] text-white/50">{currentExerciseIdx + 1}/{data.exercises.length}</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full mb-4">
        <div className="h-full bg-[#FF4500] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Current Exercise */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">{currentExercise.name}</h2>
        <div className="flex gap-2 text-xs text-white/50">
          <span>Target: {currentExercise.target.sets} sets × {currentExercise.target.reps}</span>
          {currentExercise.target.rpe && <span>@ RPE {currentExercise.target.rpe}</span>}
        </div>
      </div>

      {/* Set Input */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-[#FF4500] uppercase tracking-wider">Set {currentSetIdx + 1}</span>
          <span className="text-[10px] text-white/40">Previous: --</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-white/40 block mb-1 uppercase">Peso (kg)</label>
            <GlassInput type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[10px] text-white/40 block mb-1 uppercase">Reps</label>
            <GlassInput type="number" value={reps} onChange={(e) => setReps(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <ActionButton color={COLORS.blaze} onClick={handleLogSet}>
        {currentSetIdx < currentExercise.target.sets - 1 ? 'Registrar Set' : 
         currentExerciseIdx < data.exercises.length - 1 ? 'Terminar Ejercicio' : 'Terminar Entrenamiento'}
      </ActionButton>
    </GlassCard>
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
}

export const A2UIMediator: React.FC<A2UIMediatorProps> = ({ payload, onAction }) => {
  if (!payload || !payload.type) return null;

  switch (payload.type) {
    case 'progress-dashboard':
      return <ProgressDashboard data={payload.props} />;
    case 'workout-card':
      return <WorkoutCard data={payload.props} onAction={onAction} />;
    case 'meal-plan':
      return <MealPlan data={payload.props} />;
    case 'hydration-tracker':
      return <HydrationTracker data={payload.props} onAction={onAction} />;
    case 'recipe-card':
      return <RecipeCard data={payload.props} />;
    case 'sleep-analysis':
      return <SleepAnalysis data={payload.props} />;
    case 'timer-widget':
      return <TimerWidget data={payload.props} />;
    case 'quote-card':
      return <QuoteCard data={payload.props} />;
    case 'checklist':
      return <ChecklistWidget data={payload.props} />;
    case 'supplement-stack':
      return <SupplementStack data={payload.props} />;
    case 'daily-checkin':
      return <DailyCheckIn data={payload.props} onAction={onAction} />;
    case 'quick-actions':
      return <QuickActions data={payload.props} onAction={onAction} />;
    case 'live-session-tracker':
      return <LiveSessionTracker data={payload.props} onAction={onAction} />;
    case 'alert-banner':
      return <AlertBanner data={payload.props} />;
    default:
      return null;
  }
};