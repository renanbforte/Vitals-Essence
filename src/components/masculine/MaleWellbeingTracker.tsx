import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Brain, Moon, Heart, Dumbbell, Target,
  Wind, Save, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type EnergyLevel = 'baixa' | 'media' | 'alta';
type MoodType = 'motivado' | 'irritado' | 'ansioso' | 'deprimido' | 'focado' | 'calmo';
type LibidoLevel = 'baixa' | 'normal' | 'alta';
type SleepQuality = 'ruim' | 'ok' | 'boa' | 'otima';
type FocusLevel = 'baixo' | 'medio' | 'alto';
type StressLevel = 'baixo' | 'moderado' | 'alto' | 'intenso';

interface DayLog {
  date: string;
  energy: EnergyLevel | null;
  mood: MoodType | null;
  libido: LibidoLevel | null;
  sleep: SleepQuality | null;
  focus: FocusLevel | null;
  stress: StressLevel | null;
  physicalPerformance: number;
  notes: string;
}

const STORAGE_KEY = 'male_wellbeing_logs';

function loadLogs(): DayLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLogs(logs: DayLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// ── Segmented Control ────────────────────────────────────────
function SegmentedControl<T extends string>({
  value, onChange, options, accentClass = 'bg-foreground text-background',
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  accentClass?: string;
}) {
  return (
    <div className="flex bg-muted/40 rounded-xl p-0.5 border border-border/30">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2 text-xs font-medium rounded-[10px] transition-all ${
            value === opt.value
              ? `${accentClass} shadow-sm`
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Scale Rating 1–5 ─────────────────────────────────────────
function ScaleRating({
  value, onChange, low, high,
}: { value: number; onChange: (v: number) => void; low: string; high: string }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 h-8 rounded-lg border text-xs font-semibold transition-all ${
              value >= v
                ? 'bg-foreground text-background border-foreground shadow-sm'
                : 'border-border/40 text-muted-foreground hover:border-border/70'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[10px] text-muted-foreground">{low}</span>
        <span className="text-[10px] text-muted-foreground">{high}</span>
      </div>
    </div>
  );
}

// ── Tag Group ────────────────────────────────────────────────
function TagGroup<T extends string>({
  value, onChange, options,
}: { value: T | null; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-full text-xs border transition-all ${
            value === opt.value
              ? 'bg-foreground text-background border-foreground font-semibold'
              : 'border-border/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Section Row ──────────────────────────────────────────────
function SectionRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}

const TESTO_TIPS = [
  { phase: 'Recuperação', tip: 'Ideal para descanso ativo. Seu corpo se prepara para a semana.', color: 'hsl(220,50%,55%)' },
  { phase: 'Ascensão', tip: 'Energia começa a subir. Bom dia para planejar e iniciar projetos.', color: 'hsl(200,65%,50%)' },
  { phase: 'Construção', tip: 'Energia crescendo. Excelente para treinos de força e foco intenso.', color: 'hsl(155,50%,42%)' },
  { phase: 'Pico', tip: 'Pico de energia semanal. Aproveite para treinos máximos e desafios.', color: 'hsl(35,80%,50%)' },
  { phase: 'Estável', tip: 'Energia estável. Ótimo para criatividade e trabalho intelectual.', color: 'hsl(170,55%,42%)' },
  { phase: 'Declínio', tip: 'Energia começa a cair. Prefira treinos de resistência e atividades sociais.', color: 'hsl(280,45%,52%)' },
  { phase: 'Restauração', tip: 'O corpo pede recuperação. Alongamento, nutrição e sono são prioridade.', color: 'hsl(340,45%,52%)' },
];




export function MaleWellbeingTracker() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [logs, setLogs] = useState<DayLog[]>(loadLogs);

  const todayLog = logs.find(l => l.date === today) || {
    date: today, energy: null, mood: null, libido: null,
    sleep: null, focus: null, stress: null, physicalPerformance: 0, notes: '',
  };

  const [draft, setDraft] = useState<DayLog>(todayLog);
  const dayOfWeek = new Date().getDay();
  const phase = TESTO_TIPS[dayOfWeek];

  const update = <K extends keyof DayLog>(key: K, val: DayLog[K]) =>
    setDraft(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    const newLogs = [draft, ...logs.filter(l => l.date !== today)];
    setLogs(newLogs);
    saveLogs(newLogs);
    toast.success('Registro salvo');
  };

  const recentLogs = logs.slice(0, 7).reverse();
  const energyMap = { baixa: 1, media: 2, alta: 3 };

  return (
    <div className="space-y-4 pb-6">

      {/* Phase banner */}
      <div
        className="rounded-2xl p-4 border backdrop-blur-xl"
        style={{ background: `${phase.color}12`, borderColor: `${phase.color}30` }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
              Fase da semana
            </p>
            <p className="font-bold text-base text-foreground">{phase.phase}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground capitalize">
              {format(new Date(), 'EEEE', { locale: ptBR })}
            </p>
            <p className="text-[11px] text-muted-foreground">{format(new Date(), "dd 'de' MMM", { locale: ptBR })}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{phase.tip}</p>

        {recentLogs.length > 2 && (
          <div className="mt-3 pt-3 border-t border-border/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Energia · 7 dias</p>
            <div className="flex items-end gap-1 h-7">
              {recentLogs.map((l, i) => {
                const val = l.energy ? energyMap[l.energy] : 0;
                const h = val === 0 ? 3 : Math.round((val / 3) * 28);
                return (
                  <div key={i} className="flex-1 rounded-sm transition-all" style={{
                    height: `${h}px`,
                    background: val === 0 ? 'hsl(var(--muted-foreground)/0.2)'
                      : val === 1 ? 'hsl(0 65% 55%)' : val === 2 ? 'hsl(38 80% 52%)' : 'hsl(155 50% 44%)',
                  }} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Daily log card */}
      <div className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 divide-y divide-border/20">
        <div className="px-4 py-3.5 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Registro de hoje</span>
          <span className="ml-auto text-[11px] text-muted-foreground">{format(new Date(), "dd/MM", { locale: ptBR })}</span>
        </div>

        <div className="px-4 py-4 space-y-5">
          <SectionRow icon={Zap} label="Energia">
            <SegmentedControl
              value={draft.energy}
              onChange={v => update('energy', v)}
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'media', label: 'Média' },
                { value: 'alta', label: 'Alta' },
              ]}
            />
          </SectionRow>

          <SectionRow icon={Brain} label="Humor">
            <TagGroup
              value={draft.mood}
              onChange={v => update('mood', v)}
              options={[
                { value: 'motivado', label: 'Motivado' },
                { value: 'focado', label: 'Focado' },
                { value: 'calmo', label: 'Calmo' },
                { value: 'irritado', label: 'Irritado' },
                { value: 'ansioso', label: 'Ansioso' },
                { value: 'deprimido', label: 'Sem ânimo' },
              ]}
            />
          </SectionRow>

          <SectionRow icon={Moon} label="Qualidade do sono">
            <SegmentedControl
              value={draft.sleep}
              onChange={v => update('sleep', v)}
              options={[
                { value: 'ruim', label: 'Ruim' },
                { value: 'ok', label: 'Ok' },
                { value: 'boa', label: 'Boa' },
                { value: 'otima', label: 'Ótima' },
              ]}
            />
          </SectionRow>

          <SectionRow icon={Heart} label="Libido">
            <SegmentedControl
              value={draft.libido}
              onChange={v => update('libido', v)}
              options={[
                { value: 'baixa', label: 'Baixa' },
                { value: 'normal', label: 'Normal' },
                { value: 'alta', label: 'Alta' },
              ]}
            />
          </SectionRow>

          <div className="grid grid-cols-2 gap-4">
            <SectionRow icon={Target} label="Foco">
              <SegmentedControl
                value={draft.focus}
                onChange={v => update('focus', v)}
                options={[
                  { value: 'baixo', label: 'Baixo' },
                  { value: 'medio', label: 'Médio' },
                  { value: 'alto', label: 'Alto' },
                ]}
              />
            </SectionRow>
            <SectionRow icon={Wind} label="Estresse">
              <SegmentedControl
                value={draft.stress}
                onChange={v => update('stress', v)}
                options={[
                  { value: 'baixo', label: 'Baixo' },
                  { value: 'moderado', label: 'Mod.' },
                  { value: 'alto', label: 'Alto' },
                  { value: 'intenso', label: 'Int.' },
                ]}
              />
            </SectionRow>
          </div>

          <SectionRow icon={Dumbbell} label="Desempenho físico">
            <ScaleRating
              value={draft.physicalPerformance}
              onChange={v => update('physicalPerformance', v)}
              low="Muito baixo"
              high="Máximo"
            />
          </SectionRow>
        </div>

        <div className="px-4 py-3.5">
          <Button
            onClick={handleSave}
            className="w-full rounded-xl h-10 bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-2" />
            Salvar registro
          </Button>
        </div>
      </div>

    </div>
  );
}
