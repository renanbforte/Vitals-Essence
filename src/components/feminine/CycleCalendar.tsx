import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flower2, Droplets, Sun, Moon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  subMonths, addMonths, isSameDay, isAfter, isWithinInterval, addDays, subDays, differenceInDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MenstrualCycle, MenstrualDailyLog, MenstrualSettings, PredictionResult } from '@/hooks/useMenstrualCycle';

interface Props {
  cycles: MenstrualCycle[];
  dailyLogs: MenstrualDailyLog[];
  prediction: PredictionResult | null;
  settings: MenstrualSettings | null;
}

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const flowColors: Record<string, string> = {
  spotting: 'bg-[hsl(340_50%_85%)]',
  light: 'bg-[hsl(340_55%_78%)]',
  medium: 'bg-[hsl(345_60%_65%)]',
  heavy: 'bg-[hsl(350_65%_52%)]',
  very_heavy: 'bg-[hsl(345_60%_38%)]',
  none: '',
};

const flowTextColors: Record<string, string> = {
  spotting: 'text-foreground',
  light: 'text-foreground',
  medium: 'text-white',
  heavy: 'text-white',
  very_heavy: 'text-white',
  none: '',
};

type CyclePhase = 'menstrual' | 'folicular' | 'ovulacao' | 'lutea' | null;

const PHASE_INFO = {
  menstrual: {
    label: 'Fase Menstrual',
    icon: Droplets,
    color: 'hsl(340, 65%, 55%)',
    bgClass: 'bg-[hsl(340_65%_55%/0.1)] border-[hsl(340_65%_55%/0.3)]',
    textClass: 'text-[hsl(340_65%_45%)]',
    dotClass: 'bg-[hsl(340_65%_55%)]',
    dicas: [
      '🛁 Prefira banhos mornos para aliviar cólicas',
      '🌡️ Bolsa de água quente na barriga ajuda muito',
      '🍵 Chá de gengibre ou camomila reduz desconforto',
      '🚶‍♀️ Caminhadas leves ajudam a liberar endorfinas',
      '💤 Respeite seu corpo e descanse mais se precisar',
    ],
    desc: 'Seu corpo está se renovando. Seja gentil consigo mesma.',
  },
  folicular: {
    label: 'Fase Folicular',
    icon: Sparkles,
    color: 'hsl(200, 70%, 50%)',
    bgClass: 'bg-[hsl(200_70%_50%/0.1)] border-[hsl(200_70%_50%/0.3)]',
    textClass: 'text-[hsl(200_70%_40%)]',
    dotClass: 'bg-[hsl(200_70%_50%)]',
    dicas: [
      '⚡ Sua energia está aumentando — ótima fase para novos projetos',
      '🏋️‍♀️ Aproveite para treinos mais intensos',
      '🧠 Foco e criatividade estão em alta',
      '🥗 Aposte em alimentos frescos e nutritivos',
      '🌱 Ideal para iniciar novos hábitos',
    ],
    desc: 'Energia crescente. Seu corpo está se preparando.',
  },
  ovulacao: {
    label: 'Ovulação',
    icon: Sun,
    color: 'hsl(35, 85%, 55%)',
    bgClass: 'bg-[hsl(35_85%_55%/0.1)] border-[hsl(35_85%_55%/0.3)]',
    textClass: 'text-[hsl(35_85%_40%)]',
    dotClass: 'bg-[hsl(35_85%_55%)]',
    dicas: [
      '✨ Pico de energia e autoconfiança — você está radiante!',
      '💬 Ótima fase para conversas importantes e negociações',
      '🏃‍♀️ Desempenho físico no auge',
      '❤️ Libido naturalmente aumentada',
      '🌟 Momento de máxima fertilidade',
    ],
    desc: 'Você está no seu pico! Aproveite essa energia.',
  },
  lutea: {
    label: 'Fase Lútea',
    icon: Moon,
    color: 'hsl(270, 55%, 55%)',
    bgClass: 'bg-[hsl(270_55%_55%/0.1)] border-[hsl(270_55%_55%/0.3)]',
    textClass: 'text-[hsl(270_55%_45%)]',
    dotClass: 'bg-[hsl(270_55%_55%)]',
    dicas: [
      '🍫 Vontade de doce? Opte por chocolate amargo',
      '🧘‍♀️ Meditação e yoga ajudam com tensão pré-menstrual',
      '💤 Priorize o sono — ele é mais importante agora',
      '📓 Ótima fase para reflexão e planejamento',
      '🌿 Reduz cafeína e sal para diminuir inchaço',
    ],
    desc: 'Momento de desacelerar e se preparar para o próximo ciclo.',
  },
};

function getCurrentPhase(
  today: Date,
  cycles: MenstrualCycle[],
  settings: MenstrualSettings | null,
  prediction: PredictionResult | null
): { phase: CyclePhase; dayInCycle: number; totalDays: number } {
  const cycleLength = settings?.average_cycle_length || 28;
  const periodLength = settings?.average_period_length || 5;

  // Find active or most recent cycle
  const lastCycle = cycles[0];
  if (!lastCycle) return { phase: null, dayInCycle: 0, totalDays: cycleLength };

  const cycleStart = new Date(lastCycle.start_date);
  const dayInCycle = differenceInDays(today, cycleStart) + 1;

  if (dayInCycle < 1) return { phase: null, dayInCycle: 0, totalDays: cycleLength };

  const ovulationDay = cycleLength - 14;

  let phase: CyclePhase = null;
  if (dayInCycle <= periodLength) {
    phase = 'menstrual';
  } else if (dayInCycle <= ovulationDay - 1) {
    phase = 'folicular';
  } else if (dayInCycle <= ovulationDay + 1) {
    phase = 'ovulacao';
  } else {
    phase = 'lutea';
  }

  return { phase, dayInCycle: Math.min(dayInCycle, cycleLength), totalDays: cycleLength };
}

export function CycleCalendar({ cycles, dailyLogs, prediction, settings }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expandedPhaseCard, setExpandedPhaseCard] = useState(false);

  const logMap = useMemo(() => {
    const m = new Map<string, MenstrualDailyLog>();
    dailyLogs.forEach(l => m.set(l.date, l));
    return m;
  }, [dailyLogs]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const today = new Date();
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: ptBR });

  const cycleLength = settings?.average_cycle_length || 28;
  const periodLength = settings?.average_period_length || 5;
  const ovulationDay = cycleLength - 14;

  const lastCycleStart = cycles[0] ? new Date(cycles[0].start_date) : null;

  const getDayPhase = (day: Date): CyclePhase => {
    if (!lastCycleStart) return null;
    const d = differenceInDays(day, lastCycleStart) + 1;
    if (d < 1) return null;
    const normalizedD = ((d - 1) % cycleLength) + 1;
    if (normalizedD <= periodLength) return 'menstrual';
    if (normalizedD <= ovulationDay - 1) return 'folicular';
    if (normalizedD <= ovulationDay + 1) return 'ovulacao';
    return 'lutea';
  };

  const isPeriodDay = (day: Date): boolean => {
    return cycles.some(c => {
      const start = new Date(c.start_date);
      const end = c.end_date
        ? new Date(c.end_date)
        : addDays(start, (settings?.average_period_length || 5) - 1);
      return isWithinInterval(day, { start, end });
    });
  };

  const isPredictedDay = (day: Date): boolean => {
    if (!prediction) return false;
    const marginStart = subDays(prediction.nextPeriodStart, prediction.marginDays);
    const marginEnd = addDays(prediction.nextPeriodEnd, prediction.marginDays);
    return isWithinInterval(day, { start: marginStart, end: marginEnd });
  };

  const isPredictedCenter = (day: Date): boolean => {
    if (!prediction) return false;
    return isWithinInterval(day, { start: prediction.nextPeriodStart, end: prediction.nextPeriodEnd });
  };

  const isOvulationWindow = (day: Date): boolean => {
    if (!lastCycleStart) return false;
    const d = differenceInDays(day, lastCycleStart) + 1;
    const normalized = ((d - 1) % cycleLength) + 1;
    return normalized >= ovulationDay - 1 && normalized <= ovulationDay + 1;
  };

  const isFertileWindow = (day: Date): boolean => {
    if (!lastCycleStart) return false;
    const d = differenceInDays(day, lastCycleStart) + 1;
    const normalized = ((d - 1) % cycleLength) + 1;
    return normalized >= ovulationDay - 4 && normalized <= ovulationDay + 1;
  };

  const currentPhaseInfo = useMemo(() => {
    return getCurrentPhase(today, cycles, settings, prediction);
  }, [cycles, settings, prediction]);

  const phaseData = currentPhaseInfo.phase ? PHASE_INFO[currentPhaseInfo.phase] : null;
  const randomDica = useMemo(() => {
    if (!phaseData) return null;
    return phaseData.dicas[Math.floor(Math.random() * phaseData.dicas.length)];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhaseInfo.phase]);

  return (
    <div className="space-y-4">
      {/* Current Phase Card */}
      {phaseData && currentPhaseInfo.phase && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-4 border backdrop-blur-xl ${phaseData.bgClass} cursor-pointer`}
          onClick={() => setExpandedPhaseCard(!expandedPhaseCard)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${phaseData.bgClass}`} style={{ background: `${phaseData.color}22` }}>
                <phaseData.icon className="w-5 h-5" style={{ color: phaseData.color }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Fase atual</p>
                <p className={`font-bold text-sm ${phaseData.textClass}`}>{phaseData.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black ${phaseData.textClass}`}>Dia {currentPhaseInfo.dayInCycle}</p>
              <p className="text-[10px] text-muted-foreground">de {currentPhaseInfo.totalDays}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 bg-background/40 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentPhaseInfo.dayInCycle / currentPhaseInfo.totalDays) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: phaseData.color }}
            />
          </div>

          <AnimatePresence>
            {expandedPhaseCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className={`text-xs font-medium mb-2 ${phaseData.textClass}`}>{phaseData.desc}</p>
                  <div className="space-y-1.5">
                    {phaseData.dicas.map((dica, i) => (
                      <p key={i} className="text-xs text-muted-foreground">{dica}</p>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!expandedPhaseCard && randomDica && (
            <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{randomDica}</p>
          )}
        </motion.div>
      )}

      {/* Calendar card */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-border/40 space-y-4">
        {/* Prediction summary */}
        {prediction && (
          <div className="text-center text-sm text-muted-foreground bg-[hsl(340_50%_90%/0.2)] rounded-xl p-3 border border-[hsl(340_50%_70%/0.15)]">
            <span className="font-semibold text-foreground">Próxima menstruação:</span>{' '}
            entre{' '}
            <span className="font-bold text-[hsl(340_60%_50%)]">
              {format(subDays(prediction.nextPeriodStart, prediction.marginDays), 'dd/MM')}
            </span>
            {' '}e{' '}
            <span className="font-bold text-[hsl(340_60%_50%)]">
              {format(addDays(prediction.nextPeriodStart, prediction.marginDays), 'dd/MM')}
            </span>
            {prediction.confidence > 0 && (
              <span className="text-[10px] text-muted-foreground/70 block mt-0.5">
                Confiança: {Math.round(prediction.confidence * 100)}%
              </span>
            )}
          </div>
        )}

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h3 className="font-bold text-foreground capitalize">{monthLabel}</h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            disabled={isAfter(addMonths(currentMonth, 1), addMonths(today, 2))}
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-muted-foreground py-1">{d}</div>
          ))}

          {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const log = logMap.get(dateStr);
            const period = isPeriodDay(day);
            const predicted = isPredictedDay(day);
            const predictedCenter = isPredictedCenter(day);
            const isFuture = isAfter(day, today);
            const isToday = isSameDay(day, today);
            const ovulation = isOvulationWindow(day) && !period && isFuture;
            const fertile = isFertileWindow(day) && !period && !ovulation && isFuture;
            const phase = !period && !isFuture ? getDayPhase(day) : null;

            let bgClass = '';
            let textClass = '';
            let ringClass = '';
            let dotColor = '';

            if (log?.flow_intensity && log.flow_intensity !== 'none') {
              bgClass = flowColors[log.flow_intensity] || '';
              textClass = flowTextColors[log.flow_intensity] || '';
            } else if (period) {
              bgClass = 'bg-[hsl(340_55%_78%)]';
              textClass = 'text-foreground';
            } else if (predictedCenter && isFuture) {
              bgClass = 'bg-[hsl(340_50%_70%/0.35)]';
              textClass = 'text-foreground';
            } else if (predicted && isFuture) {
              bgClass = 'bg-[hsl(340_50%_70%/0.15)]';
              textClass = 'text-foreground';
            } else if (ovulation) {
              bgClass = 'bg-[hsl(35_85%_55%/0.25)]';
              textClass = 'text-foreground';
              ringClass = 'ring-1 ring-[hsl(35_85%_55%/0.5)]';
            } else if (fertile) {
              bgClass = 'bg-[hsl(120_50%_55%/0.15)]';
              textClass = 'text-foreground';
            } else if (phase === 'folicular') {
              dotColor = 'bg-[hsl(200_70%_50%)]';
            } else if (phase === 'lutea') {
              dotColor = 'bg-[hsl(270_55%_55%)]';
            }

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: day.getDate() * 0.005 }}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold relative
                  transition-all duration-200
                  ${isFuture && !predicted && !fertile && !ovulation ? 'text-muted-foreground/40' : ''}
                  ${bgClass} ${textClass} ${ringClass}
                  ${isToday ? 'ring-2 ring-[hsl(340_60%_55%)] ring-offset-1 ring-offset-card' : ''}
                `}
              >
                {day.getDate()}
                {dotColor && (
                  <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dotColor}`} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[hsl(340_55%_78%)]" />
            <span className="text-[10px] text-muted-foreground">Menstruação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[hsl(340_50%_70%/0.35)] border border-dashed border-[hsl(340_50%_50%/0.4)]" />
            <span className="text-[10px] text-muted-foreground">Previsão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[hsl(35_85%_55%/0.35)] ring-1 ring-[hsl(35_85%_55%/0.5)]" />
            <span className="text-[10px] text-muted-foreground">Ovulação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[hsl(120_50%_55%/0.25)]" />
            <span className="text-[10px] text-muted-foreground">Janela fértil</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(200_70%_50%)]" />
            </div>
            <span className="text-[10px] text-muted-foreground">Folicular</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(270_55%_55%)]" />
            </div>
            <span className="text-[10px] text-muted-foreground">Lútea</span>
          </div>
        </div>

        {/* Phase mini guide */}
        {cycles.length > 0 && lastCycleStart && (
          <div className="border-t border-border/30 pt-3">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">Fases do ciclo</p>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(PHASE_INFO) as CyclePhase[]).filter(Boolean).map(p => {
                const info = PHASE_INFO[p!];
                const Icon = info.icon;
                const isCurrent = currentPhaseInfo.phase === p;
                return (
                  <div
                    key={p}
                    className={`rounded-xl p-2 text-center transition-all ${
                      isCurrent ? `${info.bgClass} border` : 'bg-muted/30'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: info.color }} />
                    <p className="text-[9px] font-medium text-muted-foreground leading-tight">{info.label.replace('Fase ', '')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
