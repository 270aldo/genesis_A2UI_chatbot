// ─── HOME ─────────────────────────────────────────────
export const MOCK_USER = {
  name: 'Aldo',
  day: 47,
  phase: 'Fuerza I',
  week: 4,
};

export const MOCK_MISSIONS = [
  { id: '1', title: 'Entrenar', subtitle: 'Push Day A', icon: 'dumbbell', done: false, color: '#EF4444' },
  { id: '2', title: 'Registrar Comida', subtitle: '3 comidas', icon: 'utensils', done: true, color: '#22C55E' },
  { id: '3', title: 'Check-in', subtitle: 'Energia y sueno', icon: 'clipboard-check', done: false, color: '#FBBF24' },
];

export const MOCK_WEEKLY = {
  progress: 67,
  workouts: '4/6',
  nutrition: '85%',
  sleep: '7.2h',
};

export const MOCK_STREAK = {
  days: 12,
  record: 21,
};

export const MOCK_GENESIS_MESSAGE = 'Buen ritmo esta semana. Hoy toca empujar: bench press, OHP y accesorios de pecho. Recuerda calentar rotadores antes de la primera serie pesada.';

export const MOCK_QUICK_ACTIONS = [
  { id: 'checkin', label: 'Check-in', icon: 'clipboard-check', color: '#FBBF24' },
  { id: 'scan', label: 'Escanear', icon: 'scan-line', color: '#0EA5E9' },
  { id: 'train', label: 'Entrenar', icon: 'dumbbell', color: '#EF4444' },
  { id: 'learn', label: 'Aprender', icon: 'book-open', color: '#A855F7' },
];

// ─── TRAIN ────────────────────────────────────────────
export const MOCK_WORKOUT = {
  title: 'Push Day A',
  subtitle: 'Pecho, Hombros, Triceps',
  duration: '55 min',
  exercises: [
    { name: 'Bench Press', sets: 4, reps: '6-8', weight: '80kg', rest: '180s' },
    { name: 'OHP', sets: 3, reps: '8-10', weight: '45kg', rest: '120s' },
    { name: 'Incline DB Press', sets: 3, reps: '10-12', weight: '28kg', rest: '90s' },
    { name: 'Lateral Raise', sets: 3, reps: '15', weight: '10kg', rest: '60s' },
    { name: 'Tricep Pushdown', sets: 3, reps: '12-15', weight: '25kg', rest: '60s' },
  ],
};

export const MOCK_WEEK_PLAN = [
  { label: 'L', status: 'done' as const, workout: 'Push' },
  { label: 'M', status: 'done' as const, workout: 'Pull' },
  { label: 'X', status: 'rest' as const, workout: 'Descanso' },
  { label: 'J', status: 'today' as const, workout: 'Pierna' },
  { label: 'V', status: 'upcoming' as const, workout: 'Push' },
  { label: 'S', status: 'upcoming' as const, workout: 'Pull' },
  { label: 'D', status: 'rest' as const, workout: 'Descanso' },
];

// ─── FUEL ─────────────────────────────────────────────
export const MOCK_MACROS = {
  calories: { current: 1850, target: 2400 },
  protein: { current: 145, target: 180, color: '#3B82F6' },
  carbs: { current: 180, target: 260, color: '#FBBF24' },
  fat: { current: 55, target: 70, color: '#EF4444' },
};

export const MOCK_MEALS = [
  {
    id: '1',
    name: 'Desayuno',
    time: '8:00',
    kcal: 520,
    items: [
      { name: 'Huevos revueltos (3)', kcal: 210, protein: 18 },
      { name: 'Tostada integral', kcal: 120, protein: 4 },
      { name: 'Aguacate 1/2', kcal: 120, protein: 2 },
      { name: 'Cafe negro', kcal: 5, protein: 0 },
    ],
  },
  {
    id: '2',
    name: 'Almuerzo',
    time: '13:00',
    kcal: 680,
    items: [
      { name: 'Pechuga pollo 200g', kcal: 330, protein: 62 },
      { name: 'Arroz integral 150g', kcal: 170, protein: 4 },
      { name: 'Ensalada mixta', kcal: 80, protein: 3 },
      { name: 'Aceite oliva 1 cda', kcal: 100, protein: 0 },
    ],
  },
  {
    id: '3',
    name: 'Snack',
    time: '16:30',
    kcal: 280,
    items: [
      { name: 'Whey protein', kcal: 120, protein: 25 },
      { name: 'Platano', kcal: 90, protein: 1 },
      { name: 'Almendras 15g', kcal: 70, protein: 3 },
    ],
  },
  {
    id: '4',
    name: 'Cena',
    time: '20:00',
    kcal: 370,
    items: [
      { name: 'Salmon 150g', kcal: 250, protein: 34 },
      { name: 'Brocoli al vapor', kcal: 55, protein: 4 },
      { name: 'Camote 100g', kcal: 65, protein: 1 },
    ],
  },
];

// ─── MIND ─────────────────────────────────────────────
export const MOCK_MENTAL_STATS = {
  mood: 4,
  energy: 7,
  stress: 3,
  sleep: 8,
};

export const MOCK_SESSIONS = [
  { id: '1', title: 'Respiracion', subtitle: '4-7-8', icon: 'wind', duration: '5 min', color: '#0EA5E9' },
  { id: '2', title: 'Enfoque', subtitle: 'Deep work', icon: 'target', duration: '25 min', color: '#A855F7' },
  { id: '3', title: 'Sueno', subtitle: 'Wind down', icon: 'moon', duration: '10 min', color: '#6366F1' },
  { id: '4', title: 'Reflexion', subtitle: 'Diario', icon: 'book-open', duration: '5 min', color: '#FBBF24' },
];

// ─── TRACK ────────────────────────────────────────────
export const MOCK_SEASON = {
  name: 'Temporada Fuerza I',
  phase: 'Hipertrofia',
  week: 4,
  totalWeeks: 12,
};

export const MOCK_TREND_DATA = {
  strength: [65, 68, 70, 72, 74, 76, 78, 80],
  composition: [18.5, 18.2, 17.9, 17.5, 17.3, 17.0, 16.8, 16.5],
  adherence: [85, 90, 78, 92, 88, 95, 91, 87],
  sleep: [6.8, 7.0, 7.2, 6.9, 7.5, 7.1, 7.3, 7.2],
};

export const MOCK_ACHIEVEMENTS = [
  { id: '1', title: 'PR Bench Press', subtitle: '80kg x 6', icon: 'trophy', date: 'Hace 3 dias', color: '#FBBF24' },
  { id: '2', title: 'Racha 10 dias', subtitle: 'Consistencia', icon: 'award', date: 'Hace 5 dias', color: '#A855F7' },
  { id: '3', title: 'Meta Proteina', subtitle: '180g x 7 dias', icon: 'flag', date: 'Semana pasada', color: '#22C55E' },
];
