// ============================================================================
// EnergyCard — Cartão "Energia do Dia" com um raio animado.
// Mostra, em forma de raio que enche/esvazia, quanta energia o corpo tem ao
// longo do dia. A energia começa cheia à meia-noite e cai com o passar das
// horas; refeições concluídas recarregam, treinos consomem e a hidratação
// regula a eficiência (bem hidratado rende mais; desidratado deixa o raio
// instável e mais fraco). Também traz um botão de ajuda explicando as regras.
// ============================================================================
import { Zap as ZapIcon, Info, Droplets } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DailyTracking } from '@/hooks/useDailyTracking';
import type { UserMealPlan } from '@/hooks/useUserMealPlans';
import type { UserWorkoutPlan } from '@/hooks/useUserWorkoutPlans';

// Liga o código de cada refeição ao campo que marca se ela foi concluída
// no acompanhamento diário (ex.: 'breakfast' -> 'breakfast_completed').
const mealKeyToTrackingKey: Record<string, keyof DailyTracking> = {
  'breakfast': 'breakfast_completed',
  'morning_snack': 'morning_snack_completed',
  'lunch': 'lunch_completed',
  'afternoon_snack': 'afternoon_snack_completed',
  'dinner': 'dinner_completed',
  'night_snack': 'night_snack_completed',
};

// Converte um horário em texto "HH:MM" para um número de horas (ex.: "12:30" -> 12.5).
function parseTimeToHours(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + (m || 0) / 60;
}

type EnergyState = 'full' | 'high' | 'medium' | 'low' | 'critical';

// Classifica a energia (0 a 100%) em faixas: cheia, alta, média, baixa ou crítica.
function getEnergyState(pct: number): EnergyState {
  if (pct >= 85) return 'full';
  if (pct >= 65) return 'high';
  if (pct >= 40) return 'medium';
  if (pct >= 20) return 'low';
  return 'critical';
}

type HydrationState = 'optimal' | 'good' | 'moderate' | 'low' | 'critical';

// Classifica a hidratação (0 a 100%) em faixas: ótima, boa, moderada, baixa ou crítica.
function getHydrationState(pct: number): HydrationState {
  if (pct >= 80) return 'optimal';
  if (pct >= 60) return 'good';
  if (pct >= 40) return 'moderate';
  if (pct >= 20) return 'low';
  return 'critical';
}

// Hydration efficiency multiplier: how well the body can use energy
// optimal=1.0, good=0.92, moderate=0.8, low=0.65, critical=0.5
const hydrationEfficiency: Record<HydrationState, number> = {
  optimal: 1.0,
  good: 0.92,
  moderate: 0.8,
  low: 0.65,
  critical: 0.5,
};

// Extra workout cost multiplier when dehydrated
const hydrationWorkoutPenalty: Record<HydrationState, number> = {
  optimal: 1.0,
  good: 1.05,
  moderate: 1.2,
  low: 1.4,
  critical: 1.6,
};

// Texto amigável mostrado para cada faixa de hidratação.
const hydrationLabels: Record<HydrationState, string> = {
  optimal: 'Eficiência máxima',
  good: 'Boa eficiência',
  moderate: 'Eficiência parcial',
  low: 'Sistema comprometido',
  critical: 'Eficiência crítica',
};

// Texto amigável mostrado para cada faixa de energia.
const energyLabels: Record<EnergyState, string> = {
  full: 'Corpo bem sustentado',
  high: 'Energia estável',
  medium: 'Sustentação parcial',
  low: 'Dia exaustivo',
  critical: 'Energia instável',
};

// Cores do raio para cada faixa de energia (degradê 'from'->'to' e o brilho 'glow').
const energyColors: Record<EnergyState, { from: string; to: string; glow: string }> = {
  full:     { from: '#facc15', to: '#f59e0b', glow: 'rgba(250,204,21,0.5)' },
  high:     { from: '#fbbf24', to: '#f59e0b', glow: 'rgba(251,191,36,0.4)' },
  medium:   { from: '#fb923c', to: '#ea580c', glow: 'rgba(251,146,60,0.3)' },
  low:      { from: '#f87171', to: '#dc2626', glow: 'rgba(248,113,113,0.25)' },
  critical: { from: '#a1a1aa', to: '#71717a', glow: 'rgba(161,161,170,0.15)' },
};

// Quanto de energia (em %) cada tipo de treino consome quando concluído.
const workoutEnergyCost: Record<string, number> = {
  gym_upper: 18, gym_lower: 20, gym_full: 25, swimming: 18, running: 22,
  cycling: 20, volleyball: 16, crossfit: 25, functional: 18, pilates: 10,
  yoga: 8, dance: 14, martial_arts: 22, rest: 3, other: 15,
};

// Hook (cálculo) central: recebe refeições, acompanhamento do dia, data
// escolhida, treinos do dia e a hidratação; devolve a energia final em % e
// dados de apoio (teto máximo, faixa, custo do treino, hidratação e
// eficiência). É aqui que ficam todas as regras do "triângulo metabólico".
function useEnergyLevel(
  meals: UserMealPlan[],
  tracking: DailyTracking | null,
  selectedDate: Date,
  todayWorkouts: UserWorkoutPlan[] = [],
  hydrationPct: number = 0,
) {
  // useMemo: só refaz a conta pesada quando algum dado de entrada muda.
  return useMemo(() => {
    // Descobre se a data escolhida é hoje, um dia passado ou futuro, e qual a
    // "hora atual" a considerar (dia passado conta como 24h; futuro como 0h).
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const isToday = today.getTime() === selected.getTime();
    const isPastDay = selected.getTime() < today.getTime();
    const currentHour = isPastDay ? 24 : (isToday ? now.getHours() + now.getMinutes() / 60 : 0);
    const TOLERANCE_MIN = 40;

    // Hydration efficiency
    const hydState = getHydrationState(hydrationPct);
    const efficiency = hydrationEfficiency[hydState];
    const workoutPenalty = hydrationWorkoutPenalty[hydState];

    // Custo do treino: soma o gasto de cada treino do dia, só se o treino foi
    // concluído. Depois multiplica pela penalidade da desidratação.
    const workoutCompleted = !!tracking?.workout_completed;
    const baseWorkoutCost = workoutCompleted
      ? todayWorkouts.reduce((sum, w) => sum + (workoutEnergyCost[w.workout_type] || 15), 0)
      : 0;
    // Dehydrated = workout costs more energy
    const workoutCost = Math.round(baseWorkoutCost * workoutPenalty);

    // Desgaste natural: quanto mais tarde no dia, mais energia já foi gasta.
    // Desidratado esvazia mais rápido (até 25% a mais). Soma-se o custo do treino.
    // Dehydrated = base depletion is faster (efficiency < 1 means drains faster)
    const depletionMultiplier = 1 + (1 - efficiency) * 0.5; // up to 25% faster drain
    const baseDepletion = (currentHour / 24) * 100 * depletionMultiplier;
    const totalDepletion = baseDepletion + workoutCost;
    let energy = 100 - totalDepletion;

    // Sem refeições cadastradas, devolve só a energia do desgaste (limitada a 0-100%).
    if (!meals.length) {
      const pct = Math.max(0, Math.min(100, energy));
      return { energyPct: pct, ceiling: 100, state: getEnergyState(pct), workoutCost, hydState, efficiency };
    }

    // Ordena as refeições pelo horário (da mais cedo para a mais tarde).
    const sorted = [...meals]
      .map(m => ({ ...m, hour: parseTimeToHours(m.meal_time) }))
      .sort((a, b) => a.hour - b.hour);

    // Teto máximo de energia. A desidratação forte já derruba esse teto.
    let ceiling = 100;
    // Dehydrated = ceiling is lower even with perfect meals
    if (efficiency < 0.8) {
      ceiling -= (1 - efficiency) * 15; // up to 7.5% lower ceiling
    }
    // Recarga total a distribuir entre as refeições (repõe 100% + o gasto do treino).
    const totalRecharge = 100 + baseWorkoutCost;
    const perMeal = totalRecharge / sorted.length;

    // Para cada refeição: se foi concluída, recarrega energia (mais se feita no
    // horário certo; menos se atrasada). Se estava prevista e foi pulada, baixa o teto.
    for (const meal of sorted) {
      const isCompleted = !!tracking?.[mealKeyToTrackingKey[meal.meal_key]];
      const mealHour = meal.hour;
      const toleranceHour = mealHour + TOLERANCE_MIN / 60;
      const isPast = currentHour > toleranceHour;
      const isInWindow = currentHour >= mealHour && currentHour <= toleranceHour;

      if (isCompleted) {
        // Meal recharge is scaled by hydration efficiency
        const rechargeMultiplier = efficiency;
        if (currentHour <= mealHour) energy += perMeal * 0.95 * rechargeMultiplier;
        else if (isInWindow || !isPast) energy += perMeal * 0.85 * rechargeMultiplier;
        else { energy += perMeal * 0.6 * rechargeMultiplier; ceiling -= perMeal * 0.15; }
      } else if (isPast) {
        ceiling -= perMeal * 0.7;
      }
    }

    // Bônus de recuperação: dia passado terminado bem hidratado ganha um pouco de energia.
    // Recovery bonus: good hydration at end of day
    if (isPastDay && efficiency >= 0.92) {
      energy += 3; // small bonus for well-hydrated day
    }

    // Energia final limitada entre 0, o teto máximo e 100%.
    const energyPct = Math.max(0, Math.min(ceiling, Math.min(100, energy)));
    return { energyPct, ceiling: Math.max(0, ceiling), state: getEnergyState(energyPct), workoutCost, hydState, efficiency };
  }, [meals, tracking, selectedDate, todayWorkouts, hydrationPct]);
}

// Pequeno traço animado que "escapa" do raio, dando o efeito de faíscas
// de energia se dissipando. Recebe o caminho a desenhar, cor, atraso e duração.
function DissipationTrail({ pathD, delay, color, duration }: { pathD: string; delay: number; color: string; duration: number }) {
  return (
    <motion.path
      d={pathD} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: [0, 0.6, 1], opacity: [0, 0.6, 0], strokeWidth: [1.2, 0.6, 0] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 1.5 + Math.random() * 2, ease: 'easeOut' }}
    />
  );
}

// Desenha o raio em si (SVG animado) e os números embaixo: porcentagem de
// energia, faixa em texto, refeições concluídas e indicadores de treino e
// hidratação. Usa o cálculo do useEnergyLevel para saber como preencher/animar.
function EnergyBolt({ meals, tracking, selectedDate, todayWorkouts = [], hydrationPct = 0 }: {
  meals: UserMealPlan[]; tracking: DailyTracking | null; selectedDate: Date;
  todayWorkouts?: UserWorkoutPlan[]; hydrationPct?: number;
}) {
  // Pega a energia calculada e os dados de apoio.
  const { energyPct, ceiling, state, workoutCost, hydState, efficiency } = useEnergyLevel(meals, tracking, selectedDate, todayWorkouts, hydrationPct);
  const colors = energyColors[state];
  // Quantas refeições do dia já foram concluídas.
  const completedCount = meals.filter(m => tracking?.[mealKeyToTrackingKey[m.meal_key]]).length;
  const isFull = state === 'full';

  // Bolt visual stability based on hydration
  // Well hydrated = clean, crisp bolt. Dehydrated = jittery, dim
  const isDehydrated = efficiency < 0.8;
  const boltOpacityBase = 0.5 + efficiency * 0.5; // 0.75 to 1.0
  const glowIntensity = efficiency; // dims glow when dehydrated
  // Jitter effect for dehydrated bolt
  const jitterAmount = isDehydrated ? (1 - efficiency) * 2 : 0;

  // Desenhos (em coordenadas SVG) do corpo principal do raio e de suas ramificações.
  const boltMain = "M 58 2 L 46 28 L 60 32 L 42 58 L 58 62 L 34 98 L 72 56 L 54 52 L 70 28 L 52 24 L 66 2 Z";
  const boltFork1 = "M 46 28 L 34 38 L 28 52 L 32 50 L 30 60";
  const boltFork2 = "M 42 58 L 30 66 L 24 78 L 28 76";
  const boltFork3 = "M 60 32 L 72 22 L 78 14";
  const boltFork4 = "M 58 62 L 68 70 L 74 66";
  const allPaths = [boltMain, boltFork1, boltFork2, boltFork3, boltFork4];

  // Calcula até que altura o raio deve aparecer preenchido (revealY) e onde
  // fica a linha do teto máximo (ceilingY). Mais energia = preenchido mais alto.
  const boltTop = 2;
  const boltBottom = 98;
  const revealY = boltTop + (boltBottom - boltTop) * (1 - energyPct / 100);
  const ceilingY = boltTop + (boltBottom - boltTop) * (1 - ceiling / 100);

  const dissipationPaths = [
    "M 28 52 L 20 48 L 16 54 L 12 50",
    "M 24 78 L 16 82 L 10 78 L 6 84",
    "M 78 14 L 84 10 L 90 14 L 94 8",
    "M 74 66 L 80 62 L 86 66 L 90 60",
    "M 34 98 L 28 104 L 22 100 L 18 106",
    "M 72 56 L 80 52 L 86 56",
  ];

  // Monta o SVG do raio (brilho, esqueleto vazio, parte preenchida e efeitos
  // de animação) e, embaixo, os textos com a porcentagem e indicadores.
  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative">
        <svg width="110" height="130" viewBox="0 0 110 130">
          <defs>
            <linearGradient id="boltGradE" x1="0" y1="0" x2="0" y2="1">
              <motion.stop offset="0%" animate={{ stopColor: colors.from }} transition={{ duration: 0.8 }} />
              <motion.stop offset="100%" animate={{ stopColor: colors.to }} transition={{ duration: 0.8 }} />
            </linearGradient>
            <filter id="boltGlowE" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={isDehydrated ? 2 : 3.5} result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="boltOuterGlowE" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={isDehydrated ? 4 : 8} />
            </filter>
            <clipPath id="energyClipE">
              <motion.rect
                x="-10" width="130"
                animate={{ y: revealY, height: boltBottom - revealY + 30 }}
                transition={{ duration: 1.2, type: 'spring', stiffness: 50, damping: 14 }}
              />
            </clipPath>
            {/* Dehydration noise filter for unstable look */}
            {isDehydrated && (
              <filter id="dehydrateNoise">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale={jitterAmount * 3} />
              </filter>
            )}
          </defs>

          {/* Ambient outer glow — dimmed when dehydrated */}
          {energyPct > 25 && (
            <g>
              {allPaths.map((p, i) => (
                <motion.path key={`glow-${i}`} d={p} fill="none" stroke={colors.glow} strokeWidth="6" strokeLinecap="round" filter="url(#boltOuterGlowE)"
                  animate={{ opacity: (isFull ? [0.3, 0.6, 0.3] : energyPct / 300) as number | number[] }}
                  transition={isFull ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : { duration: 1 }}
                  style={{ opacity: glowIntensity }}
                />
              ))}
            </g>
          )}

          {/* Empty bolt skeleton */}
          {allPaths.map((p, i) => (
            <path key={`empty-${i}`} d={p} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={i === 0 ? 3 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {/* Ceiling indicator */}
          {ceiling < 96 && (
            <motion.line x1="20" x2="85" animate={{ y1: ceilingY, y2: ceilingY }} transition={{ duration: 0.8 }}
              stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" strokeDasharray="3 4" />
          )}

          {/* Filled energy — apply dehydration filter for unstable look */}
          <g clipPath="url(#energyClipE)" filter={isDehydrated ? "url(#dehydrateNoise)" : undefined}>
            {allPaths.map((p, i) => (
              <motion.path key={`fill-${i}`} d={p} fill="none" stroke="url(#boltGradE)" strokeWidth={i === 0 ? 3.5 : 2}
                strokeLinecap="round" strokeLinejoin="round" filter={energyPct > 40 ? "url(#boltGlowE)" : undefined}
                animate={{ opacity: energyPct > 5 ? boltOpacityBase : 0.2 }} transition={{ duration: 0.6 }}
              />
            ))}
            <path d={boltMain} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" />
          </g>

          {/* Dissipation trails — reduced when dehydrated */}
          {energyPct > 30 && dissipationPaths.map((dp, i) => (
            <DissipationTrail key={`dissipate-${i}`} pathD={dp} delay={i * 0.5}
              color={energyPct > 60 ? colors.from : colors.to} duration={isDehydrated ? 1.2 + i * 0.1 : 1.8 + i * 0.2} />
          ))}

          {/* Full-energy pulse — only when well hydrated */}
          {isFull && !isDehydrated && (
            <motion.path d={boltMain} fill="none" stroke={colors.from} strokeWidth="2" strokeLinecap="round"
              initial={{ opacity: 0.5 }} animate={{ opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          )}

          {/* Dehydrated flicker effect */}
          {isDehydrated && energyPct > 10 && (
            <motion.g
              animate={{ opacity: [boltOpacityBase, boltOpacityBase * 0.6, boltOpacityBase, boltOpacityBase * 0.7, boltOpacityBase] }}
              transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: 'linear' }}
            >
              <path d={boltMain} fill="none" stroke={colors.from} strokeWidth="1" strokeLinecap="round" opacity={0.3} />
            </motion.g>
          )}
        </svg>
      </div>

      <motion.p className="text-2xl font-extrabold text-white mt-1" key={Math.round(energyPct)}
        initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
        {Math.round(energyPct)}%
      </motion.p>
      <p className="text-white/50 text-[11px]">{energyLabels[state]}</p>
      <p className="text-white/40 text-[10px] mt-0.5">{completedCount}/{meals.length} refeições</p>
      
      {/* Status indicators */}
      <div className="flex items-center gap-3 mt-1">
        {workoutCost > 0 && (
          <p className="text-white/35 text-[9px]">⚡ -{workoutCost}% treino</p>
        )}
        <p className={`text-[9px] flex items-center gap-0.5 ${
          efficiency >= 0.92 ? 'text-cyan-300/60' : efficiency >= 0.8 ? 'text-white/35' : 'text-orange-300/50'
        }`}>
          <Droplets className="w-2.5 h-2.5" />
          {Math.round(efficiency * 100)}% eficiência
        </p>
      </div>
    </div>
  );
}

interface EnergyCardProps {
  selectedDate: Date;
  tracking: DailyTracking | null;
  mealPlans: UserMealPlan[];
  workoutPlans: UserWorkoutPlan[];
  waterMl: number;
  hydrationGoalMl: number;
}

// Componente principal exportado: o cartão completo mostrado nas telas.
// Prepara os dados (treinos do dia e % de hidratação) e desenha o cabeçalho
// com o botão de ajuda e o raio (EnergyBolt).
export function EnergyCard({ selectedDate, tracking, mealPlans, workoutPlans, waterMl, hydrationGoalMl }: EnergyCardProps) {
  // Filtra apenas os treinos previstos para o dia da semana da data escolhida.
  const todayWorkouts = workoutPlans.filter(w => w.day_of_week === selectedDate.getDay());
  // Calcula a porcentagem de hidratação (água bebida / meta), limitada a 100%.
  const hydrationPct = hydrationGoalMl > 0 ? Math.min(100, (waterMl / hydrationGoalMl) * 100) : 0;

  // Monta o cartão: faixa colorida com título, botão de ajuda (Popover que
  // explica as regras) e o raio de energia embaixo.
  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      <div className="gradient-meals p-5 pb-3">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ZapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Energia do Dia</h3>
              <p className="text-white/70 text-xs">Sustentação ao longo do tempo</p>
            </div>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors mt-1">
                <Info className="w-4 h-4 text-white" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" side="bottom" align="end">
              <div className="space-y-3">
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <ZapIcon className="w-4 h-4 text-primary" /> Como funciona o Raio
                </h4>
                <div className="space-y-2 text-muted-foreground text-xs leading-relaxed">
                  <p><span className="font-semibold text-foreground">⚡ Início do dia:</span> O raio começa 100% carregado à meia-noite e se descarrega naturalmente ao longo das 24h.</p>
                  <p><span className="font-semibold text-foreground">🍽️ Refeições recarregam:</span> Cada refeição concluída recarrega energia. Quanto mais refeições no horário, mais sustentação.</p>
                  <p><span className="font-semibold text-foreground">🏋️ Treinos consomem:</span> Exercícios gastam energia extra. Desidratado, o custo é ainda maior.</p>
                  <p><span className="font-semibold text-foreground">💧 Água = eficiência:</span> A hidratação não cria energia, mas regula a eficiência de tudo. Bem hidratado, a comida rende mais, o treino drena menos e o raio descarrega mais devagar.</p>
                  <p><span className="font-semibold text-foreground">❌ Desidratado:</span> O raio fica instável, a recarga por refeição diminui e o custo do treino aumenta. O teto máximo pode cair.</p>
                </div>
                <div className="border-t border-border pt-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground/70 font-semibold">Triângulo metabólico:</p>
                  <p className="text-[10px] text-muted-foreground/70">🍽️ Alimentação → abastece &nbsp;|&nbsp; 🏋️ Treino → consome &nbsp;|&nbsp; 💧 Água → regula</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <EnergyBolt meals={mealPlans} tracking={tracking} selectedDate={selectedDate} todayWorkouts={todayWorkouts} hydrationPct={hydrationPct} />
      </div>
    </div>
  );
}
