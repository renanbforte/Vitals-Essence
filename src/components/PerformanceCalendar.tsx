// ============================================================================
// PerformanceCalendar — Calendário de desempenho do usuário.
// Mostra a "sequência" (dias seguidos cumprindo metas) com um fogo animado que
// fica mais intenso conforme a sequência cresce, e um calendário mensal onde
// cada dia é colorido de acordo com a nota de desempenho (refeições, água e
// treino). Também traz navegação de mês e uma legenda de cores.
// ============================================================================
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isSameDay,
  isAfter,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DailyTracking } from '@/hooks/useDailyTracking';

interface PerformanceCalendarProps {
  trackingHistory: DailyTracking[];
}

// Iniciais dos dias da semana (Domingo a Sábado) para o cabeçalho do calendário.
const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Calcula a nota do dia (0 a 100) combinando três metas:
// 40% pelas refeições cumpridas, 30% pela água bebida, 30% pelo treino feito.
function getDayScore(t: DailyTracking): number {
  let score = 0;
  const meals = [
    t.breakfast_completed,
    t.morning_snack_completed,
    t.lunch_completed,
    t.afternoon_snack_completed,
    t.dinner_completed,
    t.night_snack_completed,
  ].filter(Boolean).length;
  score += (meals / 6) * 40; // 40% meals
  score += Math.min((t.water_ml || 0) / 3000, 1) * 30; // 30% water
  score += t.workout_completed ? 30 : 0; // 30% workout
  return Math.round(score);
}

// Escolhe a cor de fundo do dia conforme a nota: quanto maior a nota,
// mais forte fica o roxo (0% cinza, 100% roxo cheio).
function getScoreColor(score: number): string {
  if (score === 0) return 'bg-muted/60';
  if (score < 30) return 'bg-[hsl(262_83%_58%/0.15)]';
  if (score < 60) return 'bg-[hsl(262_83%_58%/0.35)]';
  if (score < 80) return 'bg-[hsl(262_83%_58%/0.6)]';
  return 'bg-primary';
}

// Escolhe a cor do número do dia para dar contraste com o fundo:
// texto claro em fundos escuros (notas altas) e texto normal nos demais.
function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-primary-foreground';
  if (score >= 60) return 'text-primary-foreground';
  return 'text-foreground';
}

// Calcula a "sequência": quantos dias seguidos (a partir de hoje, voltando no
// tempo) o usuário teve nota mínima de 30. Para de contar no primeiro dia que
// falhou. Detalhe: se hoje ainda não tem dados, começa a checar por ontem.
function computeStreak(trackingHistory: DailyTracking[]): number {
  if (!trackingHistory.length) return 0;
  const today = new Date();
  let streak = 0;
  let checkDate = today;

  // Organiza o histórico por data para consultar cada dia rapidamente.
  const trackingMap = new Map<string, DailyTracking>();
  trackingHistory.forEach(t => trackingMap.set(t.date, t));

  // Volta dia a dia (até 1 ano) contando enquanto a meta mínima foi cumprida.
  for (let i = 0; i < 365; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    const t = trackingMap.get(dateStr);
    if (t && getDayScore(t) >= 30) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else if (i === 0) {
      // today might not have data yet, check yesterday
      checkDate = subDays(checkDate, 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/* ── Animated Fire ── */
// Desenha o fogo animado que representa a sequência. Quanto maior a sequência,
// maior, mais colorido e mais "vivo" (tremeluzente) o fogo fica.
function AnimatedFire({ streak }: { streak: number }) {
  // "intensidade" de 0 a 1: 0 dias = fogo apagado, 30+ dias = fogo no máximo.
  // intensity 0-1 based on streak: 0 days = 0, 30+ days = 1
  const intensity = Math.min(streak / 30, 1);
  // Tamanho do fogo cresce com a intensidade (de 60 a 110px de altura).
  const height = 60 + intensity * 50; // 60-110px
  const width = height * 0.8;

  // As três cores do fogo (interna, meio e externa). Sem sequência ficam roxo
  // apagado; com sequência ficam roxo/magenta vibrante e quente.
  // Colors shift from dim purple to vibrant hot purple/magenta
  const innerColor = streak === 0
    ? 'hsl(262 30% 70%)'
    : `hsl(${280 + intensity * 20} ${60 + intensity * 30}% ${65 + intensity * 10}%)`;
  const midColor = streak === 0
    ? 'hsl(262 40% 55%)'
    : `hsl(${262 + intensity * 10} ${70 + intensity * 15}% ${50 + intensity * 10}%)`;
  const outerColor = streak === 0
    ? 'hsl(262 50% 40%)'
    : `hsl(${255} ${80 + intensity * 10}% ${35 + intensity * 15}%)`;

  // Velocidade da animação: sequência maior faz o fogo tremeluzir mais rápido.
  // Animation speeds — higher streak = faster flicker
  const flickerDuration = Math.max(0.4, 1.2 - intensity * 0.8);
  const swayDuration = Math.max(0.8, 2 - intensity * 1.2);

  // Quantidade de faíscas subindo — aumenta junto com a intensidade.
  // Particle count scales with intensity
  const particleCount = Math.floor(intensity * 6);

  // Medidas de apoio para desenhar o fogo (altura total, centro e base).
  const h = height + 16;
  const cx = width / 2;
  const base = h - 6; // bottom of flame

  // Desenho do fogo em SVG: camadas de chama + faíscas, todas animadas.
  return (
    <div className="flex justify-center" style={{ height: h }}>
      <svg
        width={width}
        height={h}
        viewBox={`0 0 ${width} ${h}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3 + intensity * 5} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#fireGlow)">
          {/* Outer flame — wide at bottom, narrow tip at top */}
          <motion.path
            d={`M${cx} 6
                C${cx + width * 0.05} ${h * 0.15}, ${cx + width * 0.45} ${h * 0.3}, ${cx + width * 0.4} ${h * 0.55}
                C${cx + width * 0.35} ${h * 0.75}, ${cx + width * 0.15} ${h * 0.9}, ${cx} ${base}
                C${cx - width * 0.15} ${h * 0.9}, ${cx - width * 0.35} ${h * 0.75}, ${cx - width * 0.4} ${h * 0.55}
                C${cx - width * 0.45} ${h * 0.3}, ${cx - width * 0.05} ${h * 0.15}, ${cx} 6Z`}
            fill={outerColor}
            opacity={streak === 0 ? 0.2 : 0.7 + intensity * 0.3}
            animate={{
              scaleY: [1, 1.05 + intensity * 0.05, 0.97, 1.03, 1],
              scaleX: [1, 0.97, 1.03, 0.98, 1],
            }}
            transition={{ duration: flickerDuration, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: `${cx}px ${base}px` }}
          />

          {/* Mid flame */}
          <motion.path
            d={`M${cx} ${h * 0.12}
                C${cx + width * 0.04} ${h * 0.22}, ${cx + width * 0.32} ${h * 0.38}, ${cx + width * 0.28} ${h * 0.58}
                C${cx + width * 0.24} ${h * 0.75}, ${cx + width * 0.1} ${h * 0.88}, ${cx} ${base}
                C${cx - width * 0.1} ${h * 0.88}, ${cx - width * 0.24} ${h * 0.75}, ${cx - width * 0.28} ${h * 0.58}
                C${cx - width * 0.32} ${h * 0.38}, ${cx - width * 0.04} ${h * 0.22}, ${cx} ${h * 0.12}Z`}
            fill={midColor}
            opacity={streak === 0 ? 0.15 : 0.8}
            animate={{
              scaleY: [1, 1.07 + intensity * 0.06, 0.95, 1],
              scaleX: [1, 0.96, 1.04, 1],
            }}
            transition={{ duration: flickerDuration * 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
            style={{ transformOrigin: `${cx}px ${base}px` }}
          />

          {/* Inner bright core — ellipse near base */}
          <motion.ellipse
            cx={cx}
            cy={h * 0.7}
            rx={width * 0.12}
            ry={height * 0.14}
            fill={innerColor}
            opacity={streak === 0 ? 0.1 : 0.9}
            animate={{
              ry: [height * 0.14, height * (0.17 + intensity * 0.03), height * 0.12, height * 0.14],
              opacity: streak === 0 ? [0.1] : [0.9, 1, 0.85, 0.9],
            }}
            transition={{ duration: flickerDuration * 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>

        {/* Sparks / particles — rise upward from tip */}
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * 120 - 60;
          const rad = (angle * Math.PI) / 180;
          const px = cx + Math.sin(rad) * (width * 0.15);

          return (
            <motion.circle
              key={i}
              cx={px}
              cy={h * 0.25}
              r={1.5 + intensity}
              fill={innerColor}
              opacity={0}
              animate={{
                cy: [h * 0.25, h * 0.1, -10],
                opacity: [0, 0.8, 0],
                cx: [px, px + Math.sin(rad) * 8],
              }}
              transition={{
                duration: 1 + Math.random(),
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// Componente principal do calendário. Recebe o histórico de acompanhamento
// diário (trackingHistory) e monta a tela completa.
export function PerformanceCalendar({ trackingHistory }: PerformanceCalendarProps) {
  // Guarda qual mês está sendo exibido (começa no mês atual).
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Organiza o histórico por data para consulta rápida (recalcula só quando
  // o histórico muda), evitando refazer esse trabalho a cada redesenho.
  const trackingMap = useMemo(() => {
    const map = new Map<string, DailyTracking>();
    trackingHistory.forEach(t => map.set(t.date, t));
    return map;
  }, [trackingHistory]);

  // Calcula a sequência atual de dias (memorizada, recalcula só se mudar o histórico).
  const streak = useMemo(() => computeStreak(trackingHistory), [trackingHistory]);

  // Descobre os limites e os dias do mês exibido, além do dia da semana em que
  // ele começa (para alinhar o calendário) e a data de hoje.
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const today = new Date();

  // Texto do mês/ano em português (ex.: "julho 2026").
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: ptBR });

  // Monta a tela: fogo + sequência, navegação de mês, grade de dias e legenda.
  return (
    <div className="bg-card rounded-2xl p-5 shadow-lg border space-y-5">
      {/* Animated Fire + Streak */}
      <div className="text-center space-y-1">
        <AnimatedFire streak={streak} />
        <motion.p
          key={streak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-extrabold text-primary"
        >
          {streak}
        </motion.p>
        <p className="text-sm text-muted-foreground font-semibold">
          {streak === 1 ? 'dia de sequência' : 'dias de sequência'}
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="font-bold text-foreground capitalize">{monthLabel}</h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          disabled={isAfter(addMonths(currentMonth, 1), today)}
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-muted-foreground py-1">
            {d}
          </div>
        ))}

        {/* Empty cells before month start */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Um quadradinho para cada dia do mês. */}
        {/* Day cells */}
        {daysInMonth.map((day) => {
          // Para cada dia: busca os dados, calcula a nota e marca se é futuro/hoje.
          const dateStr = format(day, 'yyyy-MM-dd');
          const tracking = trackingMap.get(dateStr);
          const score = tracking ? getDayScore(tracking) : 0;
          const isFuture = isAfter(day, today);
          const isToday = isSameDay(day, today);

          // Quadradinho do dia: cor pela nota, destaque se for hoje, dias futuros esmaecidos.
          return (
            <motion.div
              key={dateStr}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: day.getDate() * 0.01 }}
              className={`
                aspect-square rounded-xl flex items-center justify-center text-sm font-bold
                transition-all duration-200
                ${isFuture ? 'text-muted-foreground/30' : getScoreColor(score)}
                ${!isFuture && score > 0 ? getScoreTextColor(score) : ''}
                ${isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}
              `}
            >
              {day.getDate()}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted/60" />
          <span className="text-[10px] text-muted-foreground">0%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(262_83%_58%/0.15)]" />
          <span className="text-[10px] text-muted-foreground">30%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(262_83%_58%/0.35)]" />
          <span className="text-[10px] text-muted-foreground">60%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(262_83%_58%/0.6)]" />
          <span className="text-[10px] text-muted-foreground">80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-[10px] text-muted-foreground">100%</span>
        </div>
      </div>
    </div>
  );
}
