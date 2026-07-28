// ============================================================================
// CARTÃO DE TREINO DO DIA
// Mostra os treinos programados para o dia selecionado, uma silhueta do corpo
// que "acende" os músculos trabalhados, estimativa de calorias, upload de foto,
// rastreamento por GPS (corrida/pedal) e a visão geral dos treinos da semana.
// Permite marcar treinos como concluídos, adicionar/editar atividades e anotações.
// ============================================================================

import { useState } from 'react';
import bodySilhouette from '@/assets/body-silhouette.png';
import { Dumbbell, Check, Waves, Trophy, PersonStanding, Pencil, Calendar, Clock, Plus, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailyTracking } from '@/hooks/useDailyTracking';
import type { UserWorkoutPlan } from '@/hooks/useUserWorkoutPlans';
import { EditWorkoutDialog } from './EditWorkoutDialog';
import { PhotoUploadButton } from './PhotoUploadButton';
import { WorkoutRouteTracker } from './WorkoutRouteTracker';
import { useWorkoutRoutes } from '@/hooks/useWorkoutRoutes';
import { toast } from 'sonner';

interface WorkoutCardProps {
  selectedDate: Date;
  tracking: DailyTracking | null;
  onUpdateWorkout: (completed: boolean, workoutType: string, notes?: string) => void;
  workoutPlans: UserWorkoutPlan[];
  onSaveWorkoutPlan: (workout: UserWorkoutPlan) => Promise<{ error: Error | null }>;
  onDeleteWorkoutPlan?: (workoutId: string) => Promise<{ error: Error | null }>;
  onAddWorkoutPlan?: (workout: Omit<UserWorkoutPlan, 'id' | 'user_id'>) => Promise<{ error: Error | null }>;
  workoutPhoto?: { id: string; photo_url: string } | null;
  onUploadWorkoutPhoto?: (file: File) => Promise<{ error: Error | null }>;
  onDeleteWorkoutPhoto?: () => Promise<{ error: Error | null }>;
  uploadingWorkoutPhoto?: boolean;
}

// Tabela de calorias aproximadas gastas por tipo de treino (para 60 min de sessão)
// Approximate calories burned per workout type (for 60 min session)
const workoutCalorieEstimates: Record<string, number> = {
  gym_upper: 350,
  gym_lower: 400,
  gym_full: 450,
  swimming: 500,
  running: 550,
  cycling: 450,
  yoga: 200,
  pilates: 250,
  crossfit: 600,
  functional: 400,
  volleyball: 350,
  dance: 350,
  martial_arts: 500,
  other: 300,
  rest: 0,
};

// Ícone visual correspondente a cada tipo de treino
const workoutIcons: Record<string, React.ReactNode> = {
  swimming: <Waves className="w-5 h-5" />,
  gym_upper: <Dumbbell className="w-5 h-5" />,
  gym_lower: <Dumbbell className="w-5 h-5" />,
  gym_full: <Dumbbell className="w-5 h-5" />,
  volleyball: <Trophy className="w-5 h-5" />,
  running: <PersonStanding className="w-5 h-5" />,
  cycling: <PersonStanding className="w-5 h-5" />,
  yoga: <PersonStanding className="w-5 h-5" />,
  pilates: <PersonStanding className="w-5 h-5" />,
  crossfit: <Dumbbell className="w-5 h-5" />,
  functional: <Dumbbell className="w-5 h-5" />,
  dance: <PersonStanding className="w-5 h-5" />,
  martial_arts: <PersonStanding className="w-5 h-5" />,
  rest: <PersonStanding className="w-5 h-5" />,
  other: <Dumbbell className="w-5 h-5" />,
};

// Relaciona cada tipo de treino aos grupos musculares que ele ativa
// Map workout types to activated muscle groups
type MuscleGroup = 'shoulders' | 'chest' | 'back' | 'biceps' | 'triceps' | 'core' | 'glutes' | 'quads' | 'hamstrings' | 'calves';

const workoutMuscleMap: Record<string, MuscleGroup[]> = {
  gym_upper: ['shoulders', 'chest', 'back', 'biceps', 'triceps'],
  gym_lower: ['glutes', 'quads', 'hamstrings', 'calves'],
  gym_full: ['shoulders', 'chest', 'back', 'biceps', 'triceps', 'core', 'glutes', 'quads', 'hamstrings', 'calves'],
  swimming: ['shoulders', 'back', 'core', 'glutes', 'quads'],
  running: ['core', 'glutes', 'quads', 'hamstrings', 'calves'],
  cycling: ['glutes', 'quads', 'hamstrings', 'calves', 'core'],
  yoga: ['shoulders', 'core', 'glutes', 'hamstrings'],
  pilates: ['core', 'glutes', 'quads', 'shoulders'],
  crossfit: ['shoulders', 'chest', 'back', 'biceps', 'triceps', 'core', 'glutes', 'quads', 'hamstrings', 'calves'],
  functional: ['shoulders', 'core', 'glutes', 'quads', 'hamstrings'],
  volleyball: ['shoulders', 'core', 'quads', 'calves'],
  dance: ['core', 'glutes', 'quads', 'calves'],
  martial_arts: ['shoulders', 'chest', 'core', 'quads', 'calves', 'biceps', 'triceps'],
  other: ['core'],
  rest: [],
};

// Muscle zones calibrated to the anatomical outline image (viewBox 0 0 120 280)
// object-contain renders image ~120x240 centered → ~20px offset top/bottom
// Figure body: head y≈30, shoulders y≈54, chest y≈60, navel y≈100, hips y≈112,
// crotch y≈130, knees y≈180, ankles y≈232. Center x=60, torso ~48-72.

// Desenhos (paths SVG) de cada grupo muscular sobre a silhueta do corpo, com o
// nome em português usado para exibição. São as "manchas" que acendem no boneco.
const muscleGroupPaths: Record<MuscleGroup, { paths: string[]; label: string }> = {
  shoulders: {
    paths: [
      // Left deltoid — tight cap hugging shoulder joint
      "M 38 53 Q 35 54 34 57 Q 34 60 35 62 L 40 60 Q 41 57 40 55 Z",
      // Right deltoid
      "M 82 53 Q 85 54 86 57 Q 86 60 85 62 L 80 60 Q 79 57 80 55 Z",
    ],
    label: "Ombros",
  },
  chest: {
    paths: [
      // Pectorals — narrow, following pec outline
      "M 47 59 Q 52 57 60 57 Q 68 57 73 59 L 72 68 Q 68 72 60 73 Q 52 72 48 68 Z",
    ],
    label: "Peitoral",
  },
  back: {
    paths: [
      // Left lat — thin strip at torso side
      "M 42 62 L 40 68 L 42 74 L 46 74 L 47 68 L 45 62 Z",
      // Right lat
      "M 78 62 L 80 68 L 78 74 L 74 74 L 73 68 L 75 62 Z",
    ],
    label: "Costas",
  },
  biceps: {
    paths: [
      // Left upper arm — thin strip following arm contour
      "M 30 59 L 34 58 Q 35 61 34 64 L 32 76 Q 31 78 29 77 L 27 76 Q 27 74 27 72 L 29 64 Z",
      // Right upper arm
      "M 90 59 L 86 58 Q 85 61 86 64 L 88 76 Q 89 78 91 77 L 93 76 Q 93 74 93 72 L 91 64 Z",
    ],
    label: "Bíceps",
  },
  triceps: {
    paths: [
      // Left forearm — thin strip
      "M 25 80 L 29 79 Q 30 82 29 85 L 27 100 Q 26 102 24 101 L 22 100 Q 22 98 22 96 L 24 86 Z",
      // Right forearm
      "M 95 80 L 91 79 Q 90 82 91 85 L 93 100 Q 94 102 96 101 L 98 100 Q 98 98 98 96 L 96 86 Z",
    ],
    label: "Tríceps",
  },
  core: {
    paths: [
      // Abdominals — narrow column matching torso width
      "M 50 73 Q 54 75 60 75 Q 66 75 70 73 L 69 106 Q 66 110 60 111 Q 54 110 51 106 Z",
    ],
    label: "Abdômen",
  },
  glutes: {
    paths: [
      // Hip/glute — compact, matching hip width
      "M 49 112 Q 54 109 60 109 Q 66 109 71 112 L 70 124 Q 66 128 60 129 Q 54 128 50 124 Z",
    ],
    label: "Glúteos",
  },
  quads: {
    paths: [
      // Left quad — narrow, follows leg
      "M 44 130 Q 43 134 42 140 L 42 174 Q 43 177 45 178 L 50 178 Q 52 177 53 174 L 53 140 Q 52 134 51 130 Z",
      // Right quad
      "M 69 130 Q 68 134 67 140 L 67 174 Q 68 177 70 178 L 75 178 Q 77 177 78 174 L 78 140 Q 77 134 76 130 Z",
    ],
    label: "Quadríceps",
  },
  hamstrings: {
    paths: [
      // Left inner thigh — very thin
      "M 52 132 L 55 132 L 55 176 L 51 176 Z",
      // Right inner thigh
      "M 65 132 L 69 132 L 69 176 L 65 176 Z",
    ],
    label: "Posterior",
  },
  calves: {
    paths: [
      // Left calf — narrow
      "M 42 184 Q 41 190 41 196 L 41 226 Q 42 229 44 230 L 50 230 Q 52 229 52 226 L 52 196 Q 52 190 51 184 Z",
      // Right calf
      "M 69 184 Q 68 190 68 196 L 68 226 Q 69 229 71 230 L 77 230 Q 79 229 79 226 L 79 196 Q 79 190 78 184 Z",
    ],
    label: "Panturrilhas",
  },
};

// Desenha a silhueta do corpo e ilumina os músculos ativados pelos treinos do dia.
// Só acende os músculos quando o treino está marcado como concluído (isCompleted).
function BodyActivation({ isCompleted, workoutTypes }: { isCompleted: boolean; workoutTypes: string[] }) {
  // Monta o conjunto de músculos ativados a partir dos treinos concluídos do dia
  const activatedMuscles = new Set<MuscleGroup>();
  if (isCompleted) {
    workoutTypes.forEach(type => {
      const muscles = workoutMuscleMap[type] || workoutMuscleMap.other;
      muscles.forEach(m => activatedMuscles.add(m));
    });
  }

  // Define se é dia de descanso e conta quantas regiões foram ativadas do total
  const isRestDay = workoutTypes.length === 0 || (workoutTypes.length === 1 && workoutTypes[0] === 'rest');
  const activatedCount = activatedMuscles.size;
  const totalGroups = Object.keys(muscleGroupPaths).length;

  return (
    <div className="flex flex-col items-center py-3">
      <div className="relative" style={{ width: 120, height: 280 }}>
        {/* Base body image */}
        <img 
          src={bodySilhouette} 
          alt="Corpo" 
          className="w-full h-full object-contain"
          style={{ opacity: 0.6, mixBlendMode: 'multiply' }}
        />
        {/* SVG overlay for muscle activation zones */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 120 280" 
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="muscleActiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(265 90% 82%)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(262 83% 60%)" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glowActive" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowOuter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
          </defs>

          {/* Muscle activation overlays — mapped to the silhouette image */}
          {(Object.entries(muscleGroupPaths) as [MuscleGroup, { paths: string[]; label: string }][]).map(([key, { paths }]) => {
            const isActive = activatedMuscles.has(key);
            return (
              <g key={key}>
                {paths.map((path, i) => (
                  <g key={`${key}-${i}`}>
                    {isActive && (
                      <motion.path d={path} fill="hsl(265 85% 72% / 0.2)" filter="url(#glowOuter)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.15, 0.4, 0.15] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                      />
                    )}
                    <motion.path d={path}
                      fill={isActive ? "url(#muscleActiveGrad)" : "transparent"}
                      stroke={isActive ? "hsl(265 85% 82% / 0.5)" : "transparent"}
                      strokeWidth={isActive ? "0.5" : "0"}
                      strokeLinejoin="round"
                      filter={isActive ? "url(#glowActive)" : undefined}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isActive ? [0.8, 1, 0.8] : 0 }}
                      transition={isActive
                        ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }
                        : { duration: 0.4 }
                      }
                    />
                  </g>
                ))}
              </g>
            );
          })}

          {activatedCount >= 8 && isCompleted && (
            <motion.ellipse cx="60" cy="140" rx="40" ry="100" fill="hsl(265 80% 70% / 0.04)"
              animate={{ opacity: [0.03, 0.08, 0.03] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </div>

      {isRestDay && !isCompleted ? (
        <div className="text-center mt-1">
          <p className="text-white/50 text-xs">Dia de descanso</p>
        </div>
      ) : (
        <div className="text-center mt-1">
          <motion.p className="text-2xl font-extrabold text-white"
            key={activatedCount} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {activatedCount}/{totalGroups}
          </motion.p>
          <p className="text-white/50 text-[11px]">
            {activatedCount === 0 ? 'Nenhuma região ativada' : activatedCount === totalGroups ? 'Corpo completo' : 'regiões ativadas'}
          </p>
        </div>
      )}
    </div>
  );
}
export function WorkoutCard({ 
  selectedDate, tracking, onUpdateWorkout, workoutPlans,
  onSaveWorkoutPlan, onDeleteWorkoutPlan, onAddWorkoutPlan,
  workoutPhoto, onUploadWorkoutPhoto, onDeleteWorkoutPhoto, uploadingWorkoutPhoto
}: WorkoutCardProps) {
  // Texto das anotações do treino (inicia com o que já estava salvo no dia)
  const [notes, setNotes] = useState(tracking?.workout_notes || '');
  // Guarda qual treino está com os detalhes expandidos (ou nenhum)
  const [showDetails, setShowDetails] = useState<string | null>(null);
  // Treino selecionado para edição no diálogo (ou nenhum)
  const [editingWorkout, setEditingWorkout] = useState<UserWorkoutPlan | null>(null);
  // Controla se a lista de todos os treinos da semana está aberta
  const [showAllActivities, setShowAllActivities] = useState(false);
  // Indica se o campo de calorias está no modo de edição manual
  const [editingCalories, setEditingCalories] = useState(false);
  // Tipo de atividade escolhido para o rastreamento por GPS (corrida ou pedal)
  const [gpsWorkoutType, setGpsWorkoutType] = useState<'running' | 'cycling'>('running');
  // Controla se a seção de rastreamento por GPS está visível
  const [showGPS, setShowGPS] = useState(false);

  // Busca no banco as rotas de GPS salvas para a data selecionada
  const { routes, saveRoute, deleteRoute, fetchRoutes } = useWorkoutRoutes(selectedDate);
  // Valor de calorias digitado manualmente pelo usuário (sobrepõe a estimativa)
  const [customCalories, setCustomCalories] = useState<string>('');

  // Descobre os treinos do dia selecionado e o estado (concluído, futuro, total semanal)
  const dayOfWeek = getDay(selectedDate);
  const todaysWorkouts = workoutPlans.filter(w => w.day_of_week === dayOfWeek);
  const isCompleted = tracking?.workout_completed || false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selectedDay = new Date(selectedDate); selectedDay.setHours(0, 0, 0, 0);
  const isFuture = selectedDay > today;
  const totalWeeklyWorkouts = workoutPlans.reduce((sum, w) => sum + (w.weekly_frequency || 1), 0);

  // Calcula as calorias estimadas somando cada treino do dia, ajustando pela duração
  // Calculate estimated calories
  const estimatedCalories = todaysWorkouts.reduce((sum, w) => {
    const base = workoutCalorieEstimates[w.workout_type] || 300;
    // Adjust based on duration if available
    const durationMin = w.duration ? parseInt(w.duration) : 60;
    return sum + Math.round(base * (durationMin / 60));
  }, 0);

  // Calorias exibidas: usa o valor manual se houver, senão a estimativa calculada
  const displayCalories = customCalories ? parseInt(customCalories) : estimatedCalories;

  // Marca/desmarca os treinos do dia como concluídos (bloqueia datas futuras)
  const handleToggleComplete = () => {
    if (isFuture) { toast.error('Não é possível marcar treinos em datas futuras'); return; }
    if (todaysWorkouts.length === 0) return;
    const newCompleted = !isCompleted;
    onUpdateWorkout(newCompleted, todaysWorkouts.map(w => w.workout_type).join(', '), notes);
    if (newCompleted) toast.success('Treino(s) concluído(s)! 💪');
  };

  // Salva as anotações escritas para os treinos do dia
  const handleSaveNotes = () => {
    if (todaysWorkouts.length === 0) return;
    onUpdateWorkout(isCompleted, todaysWorkouts.map(w => w.workout_type).join(', '), notes);
    toast.success('Anotações salvas!');
  };

  // Adiciona uma nova atividade em branco para o dia indicado (ou para o dia atual)
  const handleAddNewActivity = (forDay?: number) => {
    if (!onAddWorkoutPlan) return;
    const targetDay = forDay !== undefined ? forDay : dayOfWeek;
    onAddWorkoutPlan({
      day_of_week: targetDay, workout_type: 'other', workout_name: 'Nova Atividade',
      description: null, duration: '60 min', details: [], weekly_frequency: 1, order_index: workoutPlans.length,
    }).then(({ error }) => { if (!error) toast.success('Atividade adicionada!'); });
  };

  // Abre ou fecha os detalhes de um treino específico ao ser clicado
  const toggleDetails = (workoutId: string) => setShowDetails(prev => prev === workoutId ? null : workoutId);

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      {/* Header with Body Activation */}
      <div className="gradient-workout p-5 pb-2">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Corpo em Ativação</h3>
              <p className="text-white/70 text-xs capitalize">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
            </div>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <Check className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold text-white">Feito!</span>
            </div>
          )}
        </div>

        <BodyActivation isCompleted={isCompleted} workoutTypes={todaysWorkouts.map(w => w.workout_type)} />
      </div>

      {/* Body */}
      <div className="bg-card p-4 space-y-3">
        {/* Calorie estimate + Photo row */}
        {todaysWorkouts.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-orange-500/10 rounded-xl px-3 py-2">
              <Flame className="w-4 h-4 text-orange-500" />
              {editingCalories ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    type="number"
                    value={customCalories || String(estimatedCalories)}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="h-6 text-xs bg-transparent border-orange-300/50 rounded-lg px-2 w-20"
                    placeholder="kcal"
                    autoFocus
                  />
                  <span className="text-[10px] text-orange-600 font-medium">kcal</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-orange-500"
                    onClick={() => {
                      setEditingCalories(false);
                      if (customCalories) toast.success(`Calorias ajustadas para ${customCalories} kcal`);
                    }}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingCalories(true)}
                  className="flex items-center gap-1.5 flex-1"
                >
                  <span className="text-xs font-bold text-orange-600">~{displayCalories} kcal</span>
                  <span className="text-[10px] text-orange-500/60">estimado</span>
                  <Pencil className="w-3 h-3 text-orange-400 ml-auto" />
                </button>
              )}
            </div>

            {/* Workout Photo */}
            {onUploadWorkoutPhoto && (
              <PhotoUploadButton
                onUpload={onUploadWorkoutPhoto}
                existingPhotoUrl={workoutPhoto?.photo_url}
                onDelete={onDeleteWorkoutPhoto ? async () => onDeleteWorkoutPhoto() : undefined}
                uploading={uploadingWorkoutPhoto}
                size="md"
                variant="icon"
                className="rounded-xl bg-primary/10 text-primary hover:text-primary hover:bg-primary/20"
              />
            )}
          </div>
        )}

        <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Total semanal:</span>
          <span className="text-xs font-bold text-foreground ml-auto">{totalWeeklyWorkouts} treinos</span>
        </div>

        {/* Se houver treinos para hoje, lista cada um em um cartão; */}
        {/* caso contrário, mostra um aviso com botão para adicionar atividade. */}
        {todaysWorkouts.length > 0 ? (
          <>
          {todaysWorkouts.map((workout) => (
              <motion.div 
                key={workout.id || workout.order_index} 
                className="rounded-2xl border border-border/50 p-4 bg-muted/30"
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-workout/10 flex items-center justify-center text-workout">
                      {workoutIcons[workout.workout_type] || <Dumbbell className="w-4 h-4" />}
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{workout.workout_name}</h4>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg" onClick={() => setEditingWorkout(workout)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    <Calendar className="w-3 h-3" />{workout.weekly_frequency || 1}x/semana
                  </span>
                  {workout.duration && (
                    <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-0.5 rounded-lg text-[10px] font-bold">
                      <Clock className="w-3 h-3" />{workout.duration}
                    </span>
                  )}
                </div>
                
                {workout.description && <p className="text-xs text-muted-foreground mb-2">{workout.description}</p>}
                
                {workout.details && workout.details.length > 0 && (
                  <>
                    <button onClick={() => toggleDetails(workout.id || String(workout.order_index))} className="text-[11px] text-primary font-semibold hover:underline">
                      {showDetails === (workout.id || String(workout.order_index)) ? 'Ocultar detalhes' : 'Ver detalhes'}
                    </button>
                    {showDetails === (workout.id || String(workout.order_index)) && (
                      <ul className="mt-2 space-y-1 border-t border-border/30 pt-2">
                        {workout.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span><span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}


              </motion.div>
            ))}
            
            {onAddWorkoutPlan && (
              <Button onClick={() => handleAddNewActivity()} variant="outline" className="w-full rounded-xl border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30" size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Adicionar mais treino hoje
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum treino configurado</p>
            {onAddWorkoutPlan && (
              <Button onClick={() => handleAddNewActivity()} size="sm" className="rounded-xl gradient-hub text-white border-0 shadow-md">
                <Plus className="w-4 h-4 mr-1.5" /> Adicionar Atividade
              </Button>
            )}
          </div>
        )}

        {/* GPS Quick-Track Section — collapsed by default */}
        {!isFuture && !showGPS && (
          <button
            onClick={() => setShowGPS(true)}
            className="w-full flex items-center gap-2 rounded-2xl border border-border/40 bg-muted/20 px-4 py-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <span className="text-base">📍</span>
            <span className="text-sm font-semibold text-muted-foreground">Rastrear Corrida ou Pedal</span>
            <span className="ml-auto text-xs text-primary font-bold">GPS</span>
          </button>
        )}

        {!isFuture && showGPS && (
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📍</span>
              <span className="text-sm font-bold text-foreground">Rastreamento GPS</span>
              <button onClick={() => setShowGPS(false)} className="ml-auto text-[10px] text-muted-foreground hover:text-foreground">✕ fechar</button>
            </div>
            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setGpsWorkoutType('running')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-all ${
                  gpsWorkoutType === 'running'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-primary/40'
                }`}
              >
                🏃 Corrida
              </button>
              <button
                onClick={() => setGpsWorkoutType('cycling')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold border transition-all ${
                  gpsWorkoutType === 'cycling'
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-primary/40'
                }`}
              >
                🚴 Pedal
              </button>
            </div>
            <WorkoutRouteTracker
              workoutType={gpsWorkoutType}
              onSaveRoute={saveRoute}
              savedRoutes={routes.filter(r => r.workout_type === gpsWorkoutType)}
              onDeleteRoute={deleteRoute}
              onFetchRoutes={fetchRoutes}
            />
          </div>
        )}

        {/* Action Button */}
        {!isFuture && todaysWorkouts.length > 0 && (
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={handleToggleComplete} className={`w-full rounded-xl h-11 font-bold text-sm ${
              isCompleted ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'gradient-workout text-white shadow-lg hover:opacity-90'
            }`}>
              {isCompleted ? (
                <><Check className="w-4 h-4 mr-2" />{todaysWorkouts.length > 1 ? 'Treinos Concluídos' : 'Treino Concluído'}</>
              ) : (
                todaysWorkouts.length > 1 ? 'Marcar Treinos como Concluídos' : 'Marcar como Concluído'
              )}
            </Button>
          </motion.div>
        )}

        {isFuture && todaysWorkouts.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-muted-foreground text-xs">{todaysWorkouts.length > 1 ? 'Treinos programados' : 'Treino programado'} para este dia</p>
          </div>
        )}

        {/* Notes */}
        {!isFuture && todaysWorkouts.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Anotações (opcional)</p>
            <Textarea
              placeholder="Ex: Aumentei a carga no supino..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl resize-none h-20 text-sm"
            />
            {notes !== (tracking?.workout_notes || '') && (
              <Button onClick={handleSaveNotes} size="sm" className="mt-2 rounded-xl">Salvar Anotações</Button>
            )}
          </div>
        )}

        {/* View All Activities */}
        {/* Botão que expande a grade com os treinos de todos os dias da semana */}
        <div className="pt-3 border-t border-border/50">
          <button onClick={() => setShowAllActivities(!showAllActivities)} className="text-xs text-primary font-semibold hover:underline w-full text-center">
            {showAllActivities ? 'Ocultar atividades da semana' : 'Ver todas as atividades da semana'}
          </button>
          
          {showAllActivities && (
            <div className="mt-3 space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const dayWorkouts = workoutPlans.filter(w => w.day_of_week === day);
                const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day];
                return (
                  <div key={day} className="rounded-xl border border-border/30 p-3 bg-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-foreground">{dayName}</span>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary" onClick={() => handleAddNewActivity(day)}>
                        <Plus className="w-3 h-3 mr-0.5" />Add
                      </Button>
                    </div>
                    {dayWorkouts.length > 0 ? (
                      <div className="space-y-1">
                        {dayWorkouts.map((plan) => (
                          <div key={plan.id || plan.order_index} className="flex items-center justify-between bg-card rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded bg-workout/10 flex items-center justify-center text-workout">
                                {workoutIcons[plan.workout_type] || <Dumbbell className="w-3 h-3" />}
                              </div>
                              <span className="text-xs font-medium text-foreground">{plan.workout_name}</span>
                              <span className="text-[10px] text-muted-foreground">{plan.weekly_frequency}x</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary" onClick={() => setEditingWorkout(plan)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 text-center py-1">Sem treinos</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EditWorkoutDialog workout={editingWorkout} open={!!editingWorkout} onOpenChange={(open) => !open && setEditingWorkout(null)} onSave={onSaveWorkoutPlan} onDelete={onDeleteWorkoutPlan} />
    </div>
  );
}
