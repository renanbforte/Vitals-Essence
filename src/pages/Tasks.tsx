import { useState, useMemo } from 'react';
import diarySunImg from '@/assets/diary-sun.png';
import diaryCloudImg from '@/assets/diary-cloud.png';
import diaryGratitudeImg from '@/assets/diary-gratitude.png';
import diaryHeartImg from '@/assets/diary-heart.png';
import diaryMoonImg from '@/assets/diary-moon.png';
import tabListaImg from '@/assets/tab-lista.png';
import tabMetasImg from '@/assets/tab-metas.png';
import GoalsTab from '@/components/life/GoalsTab';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, Trash2, X, Users, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLifePersonal, type EmotionalState, type BrainDump } from '@/hooks/useLifePersonal';
import { useLifeChecklist, type Recurrence } from '@/hooks/useLifeChecklist';
import { useFriendships } from '@/hooks/useFriendships';
import { format, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Section images
import vidaCasaImg from '@/assets/vida-casa.png';
import vidaRelImg from '@/assets/vida-relacionamentos.png';
import vidaExpImg from '@/assets/vida-experiencias.png';
import vidaDescompImg from '@/assets/vida-descompressao.png';
import vidaDiarioImg from '@/assets/vida-diario.png';
import vidaRadarImg from '@/assets/vida-radar.png';



// Tab images
import tabHojeImg from '@/assets/tab-hoje.png';
import tabPessoasImg from '@/assets/tab-pessoas.png';
import tabVidaImg from '@/assets/tab-vida.png';


// Emotion images
import emotionOtimoImg from '@/assets/emotion-otimo.png';
import emotionBemImg from '@/assets/emotion-bem.png';
import emotionNeutroImg from '@/assets/emotion-neutro.png';
import emotionCansadoImg from '@/assets/emotion-cansado.png';
import emotionSobreImg from '@/assets/emotion-sobrecarregado.png';

// Checkin images
import checkinFalouImg from '@/assets/checkin-falou.png';
import checkinCasaImg from '@/assets/checkin-casa.png';
import checkinMomentoImg from '@/assets/checkin-momento.png';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 240, damping: 22 } },
};
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };

// ── Frosted Image Section Card ──────────────────────────────
function SectionImageCard({ img, title, children, className = '' }: {
  img: string; title: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-3xl overflow-hidden shadow-xl ${className}`}>
      <div className="relative h-36">
        <img src={img} alt={title} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/40 px-4 py-2.5">
          <h2 className="text-white font-bold text-base">{title}</h2>
        </div>
      </div>
      <div className="bg-card/80 backdrop-blur-xl p-4">
        {children}
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg ${className}`}>
      {children}
    </div>
  );
}

// ── 1. Emotional Thermometer ──────────────────────────────────
const EMOTIONS: { value: EmotionalState; label: string; img: string; ring: string }[] = [
  { value: 'ótimo', label: 'Ótimo', img: emotionOtimoImg, ring: 'ring-amber-400' },
  { value: 'bem', label: 'Bem', img: emotionBemImg, ring: 'ring-sky-400' },
  { value: 'neutro', label: 'Neutro', img: emotionNeutroImg, ring: 'ring-slate-400' },
  { value: 'cansado', label: 'Cansado', img: emotionCansadoImg, ring: 'ring-orange-400' },
  { value: 'sobrecarregado', label: 'Sobre...', img: emotionSobreImg, ring: 'ring-red-400' },
];

const CHECKIN_ITEMS: {
  field: 'talked_to_someone' | 'home_organized' | 'had_me_time';
  question: string;
  img: string;
  yesLabel: string;
  noLabel: string;
  yesColor: string;
  noColor: string;
}[] = [
  {
    field: 'talked_to_someone',
    question: 'Você falou com alguém de verdade hoje?',
    img: checkinFalouImg,
    yesLabel: 'Falei',
    noLabel: 'Não ainda',
    yesColor: 'bg-sky-500/90',
    noColor: 'bg-slate-500/70',
  },
  {
    field: 'home_organized',
    question: 'Sua casa está do jeito que você gosta?',
    img: checkinCasaImg,
    yesLabel: 'Tá boa',
    noLabel: 'Precisa de atenção',
    yesColor: 'bg-amber-500/90',
    noColor: 'bg-slate-500/70',
  },
  {
    field: 'had_me_time',
    question: 'Você teve um momento só para você?',
    img: checkinMomentoImg,
    yesLabel: 'Tive sim',
    noLabel: 'Não tive',
    yesColor: 'bg-violet-500/90',
    noColor: 'bg-slate-500/70',
  },
];

function CheckinPanel() {
  const { checkin, saveCheckin } = useLifePersonal();

  const handleEmotion = async (value: EmotionalState) => {
    await saveCheckin({ emotional_state: value });
    if (value === 'sobrecarregado') toast('Modo simplificado ativado', { description: 'Foque no essencial hoje.' });
  };

  const answer = async (field: 'talked_to_someone' | 'home_organized' | 'had_me_time', value: boolean) => {
    await saveCheckin({ [field]: value });
  };

  if (checkin?.overloaded_mode || checkin?.emotional_state === 'sobrecarregado') {
    return (
      <GlassCard className="border-red-400/20 bg-red-500/5">
        <p className="text-sm font-bold text-red-400 mb-3">Modo Simplificado</p>
        <p className="text-xs text-muted-foreground mb-3">Você está sobrecarregado. Foque só no essencial.</p>
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl bg-muted/40 text-sm">3 prioridades pessoais para hoje</div>
          <div className="p-2.5 rounded-xl bg-muted/40 text-sm">1 pessoa para falar</div>
          <div className="p-2.5 rounded-xl bg-muted/40 text-sm">1 coisa só para você</div>
        </div>
        <Button size="sm" variant="ghost" className="mt-3 w-full text-xs" onClick={() => saveCheckin({ emotional_state: 'bem', overloaded_mode: false })}>
          Estou melhor agora
        </Button>
      </GlassCard>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Emotional thermometer */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Como você está?</p>
          <div className="grid grid-cols-5 gap-2">
            {EMOTIONS.map(e => {
              const active = checkin?.emotional_state === e.value;
              return (
                <button
                  key={e.value}
                  onClick={() => handleEmotion(e.value)}
                  className={`relative rounded-2xl overflow-hidden transition-all ${active ? `ring-2 ${e.ring} scale-105 shadow-lg` : 'opacity-70 hover:opacity-100'}`}
                >
                  <img src={e.img} alt={e.label} className="w-full aspect-square object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/50 py-1">
                    <span className="text-[9px] font-bold text-white block text-center leading-tight">{e.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Perception questions — answer cards, not checklist */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Percepção do dia</p>
          <div className="space-y-3">
            {CHECKIN_ITEMS.map(q => {
              const answered = checkin?.[q.field];
              const isNull = answered === null || answered === undefined;
              return (
                <div key={q.field} className="rounded-2xl overflow-hidden">
                  {/* Image header */}
                  <div className="relative h-20">
                    <img src={q.img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20 flex items-center px-4">
                      <p className="text-sm font-semibold text-white leading-snug">{q.question}</p>
                    </div>
                  </div>
                  {/* Answer buttons */}
                  <div className="grid grid-cols-2 gap-0">
                    <button
                      onClick={() => answer(q.field, true)}
                      className={`py-2.5 text-xs font-bold transition-all ${
                        !isNull && answered === true
                          ? `${q.yesColor} text-white shadow-sm`
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {q.yesLabel}
                    </button>
                    <button
                      onClick={() => answer(q.field, false)}
                      className={`py-2.5 text-xs font-bold transition-all border-l border-border/20 ${
                        !isNull && answered === false
                          ? `${q.noColor} text-white shadow-sm`
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {q.noLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ── 2. House Routines ────────────────────────────────────────
const ROUTINE_CATEGORIES: Record<string, string> = {
  limpeza: 'Limpeza', roupas: 'Roupas', manutencao: 'Manutenção',
  pagamentos: 'Pagamentos', outro: 'Outro',
};
const ROUTINE_FREQ: Record<string, string> = {
  diaria: 'Diária', semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal',
};

function HouseTab() {
  const { routines, addRoutine, markRoutineDone, deleteRoutine } = useLifePersonal();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'limpeza', frequency: 'semanal', shared_with: '' });

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await addRoutine({ ...form, last_done_at: null, shared_with: form.shared_with || null });
    setForm({ title: '', category: 'limpeza', frequency: 'semanal', shared_with: '' });
    setAdding(false);
  };

  const daysSince = (date: string | null) => {
    if (!date) return null;
    return differenceInDays(new Date(), new Date(date));
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <SectionImageCard img={vidaCasaImg} title="Rotinas da Casa">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Organização leve, sem pressão</p>
            <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5 h-8 text-xs rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>

          {adding && (
            <div className="mb-3 p-3 bg-muted/30 rounded-xl border border-border/40 space-y-2">
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Lavar roupa..." className="rounded-xl h-9 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROUTINE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.frequency} onValueChange={v => setForm(p => ({ ...p, frequency: v }))}>
                  <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROUTINE_FREQ).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input value={form.shared_with} onChange={e => setForm(p => ({ ...p, shared_with: e.target.value }))} placeholder="Dividir com (opcional)..." className="rounded-xl h-8 text-sm" />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} className="flex-1 h-8 text-xs rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0">Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="h-8 text-xs rounded-xl">Cancelar</Button>
              </div>
            </div>
          )}

          {routines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma rotina criada ainda</p>
          ) : (
            <div className="space-y-2">
              {routines.map(r => {
                const days = daysSince(r.last_done_at);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <button onClick={() => markRoutineDone(r.id)} className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 hover:bg-orange-500/20 transition-colors">
                      <Check className="w-4 h-4 text-orange-500" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{ROUTINE_FREQ[r.frequency]}</span>
                        {r.shared_with && <span className="text-[10px] text-muted-foreground">• com {r.shared_with}</span>}
                        {days !== null && <span className={`text-[10px] ${days > 7 ? 'text-orange-400' : 'text-muted-foreground'}`}>• há {days}d</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-destructive/40 hover:text-destructive" onClick={() => deleteRoutine(r.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionImageCard>
      </motion.div>
    </motion.div>
  );
}

// ── Helpers ─────────────────────────────────────────────────
interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD
  relation: string;
  notes: string;
}

function getDaysUntilBirthday(mmdd: string): number {
  const today = new Date();
  const [month, day] = mmdd.split('-').map(Number);
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  const diff = Math.ceil((next.getTime() - today.setHours(0,0,0,0)) / 86400000);
  return diff;
}

const IMPORTANCE_LEVELS = [
  { value: 5, label: '★★★ Núcleo', desc: 'Pessoa central da minha vida', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  { value: 4, label: '★★ Pilar', desc: 'Presença constante e importante', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  { value: 3, label: '★ Próximo', desc: 'Pessoa importante, conexão regular', color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
  { value: 2, label: 'Presença', desc: 'Faz parte da minha vida', color: 'text-sky-400', bg: 'bg-sky-500/15 border-sky-500/30' },
  { value: 1, label: 'Círculo', desc: 'Conhecidos relevantes', color: 'text-muted-foreground', bg: 'bg-muted/40 border-border/30' },
];

function getImportanceConfig(importance: number) {
  return IMPORTANCE_LEVELS.find(l => l.value === importance) || IMPORTANCE_LEVELS[2];
}

// ── Pantheon Visual ──────────────────────────────────────────
function PantheonView({ relationships, markQualityTime }: {
  relationships: { id: string; name: string; relation: string | null; importance?: number; last_quality_time: string | null }[];
  markQualityTime: (id: string) => void;
}) {
  const tiers = useMemo(() => ({
    nucleo:   relationships.filter(r => (r.importance ?? 3) === 5),
    pilar:    relationships.filter(r => (r.importance ?? 3) === 4),
    proximo:  relationships.filter(r => (r.importance ?? 3) === 3),
    presenca: relationships.filter(r => (r.importance ?? 3) <= 2),
  }), [relationships]);

  const PersonBubble = ({ r, size = 'md' }: { r: typeof relationships[0]; size?: 'lg' | 'md' | 'sm' }) => {
    const imp = r.importance ?? 3;
    const _cfg = getImportanceConfig(imp);
    const daysSince = r.last_quality_time ? differenceInDays(new Date(), new Date(r.last_quality_time)) : null;
    const sizes = { lg: 'w-16 h-16 text-lg', md: 'w-12 h-12 text-sm', sm: 'w-9 h-9 text-xs' };

    return (
      <button
        onClick={() => markQualityTime(r.id)}
        className="flex flex-col items-center gap-1 group"
        title={`${r.name} — toque para registrar momento`}
      >
        <div className={`${sizes[size]} rounded-full border-2 flex items-center justify-center font-bold transition-all group-hover:scale-110 ${
          imp >= 5 ? 'border-amber-400 bg-amber-500/20 text-amber-300' :
          imp === 4 ? 'border-rose-400 bg-rose-500/20 text-rose-300' :
          imp === 3 ? 'border-violet-400 bg-violet-500/20 text-violet-300' :
          'border-border bg-muted/60 text-muted-foreground'
        }`}>
          {r.name.charAt(0).toUpperCase()}
        </div>
        <span className="text-[9px] font-semibold text-center leading-tight max-w-[52px] truncate opacity-80">{r.name.split(' ')[0]}</span>
        {daysSince !== null && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${daysSince > 14 ? 'bg-rose-500/20 text-rose-400' : 'bg-muted/60 text-muted-foreground'}`}>
            {daysSince}d
          </span>
        )}
      </button>
    );
  };

  if (relationships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="text-4xl opacity-30">🏛️</div>
        <p className="text-sm text-muted-foreground text-center">Seu Pantheon está vazio.<br/>Adicione pessoas e defina a importância.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Temple SVG frame */}
      <svg viewBox="0 0 320 40" className="w-full" fill="none">
        {/* Pediment / triangle */}
        <polygon points="160,4 40,36 280,36" fill="hsl(var(--muted)/0.4)" stroke="hsl(var(--border))" strokeWidth="1" />
        <line x1="40" y1="36" x2="280" y2="36" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Star in pediment */}
        <text x="160" y="28" textAnchor="middle" fontSize="14" fill="hsl(38 92% 60%)">★</text>
      </svg>

      {/* Tier: Núcleo */}
      {tiers.nucleo.length > 0 && (
        <div className="flex justify-center gap-4 mb-3 relative">
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-px bg-amber-500/20" />
          {tiers.nucleo.map(r => <PersonBubble key={r.id} r={r} size="lg" />)}
        </div>
      )}

      {/* Columns visual between tiers */}
      <svg viewBox="0 0 320 20" className="w-full" fill="none">
        {[60, 120, 160, 200, 260].map(x => (
          <rect key={x} x={x - 5} y={0} width={10} height={20} rx={2}
            fill="hsl(var(--muted)/0.5)" stroke="hsl(var(--border))" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Tier: Pilares */}
      {tiers.pilar.length > 0 && (
        <div className="flex justify-center gap-3 flex-wrap mb-3 py-1">
          {tiers.pilar.map(r => <PersonBubble key={r.id} r={r} size="md" />)}
        </div>
      )}

      {/* Base line */}
      <svg viewBox="0 0 320 12" className="w-full" fill="none">
        <rect x="20" y="2" width="280" height="8" rx="4" fill="hsl(var(--muted)/0.5)" stroke="hsl(var(--border))" strokeWidth="0.5" />
      </svg>

      {/* Tier: Próximos */}
      {tiers.proximo.length > 0 && (
        <div className="flex justify-center gap-2 flex-wrap mb-2 py-2">
          {tiers.proximo.map(r => <PersonBubble key={r.id} r={r} size="sm" />)}
        </div>
      )}

      {/* Base plinth */}
      <svg viewBox="0 0 320 10" className="w-full" fill="none">
        <rect x="10" y="2" width="300" height="6" rx="3" fill="hsl(var(--muted)/0.6)" stroke="hsl(var(--border))" strokeWidth="0.5" />
      </svg>

      {/* Tier: Presença */}
      {tiers.presenca.length > 0 && (
        <div className="flex justify-center gap-2 flex-wrap pt-2">
          {tiers.presenca.map(r => <PersonBubble key={r.id} r={r} size="sm" />)}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-4 flex-wrap">
        {(['Núcleo', 'Pilar', 'Próximo', 'Presença'] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-rose-400' : i === 2 ? 'bg-violet-400' : 'bg-sky-400'}`} />
            <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agenda View ──────────────────────────────────────────────
function AgendaView({ relationships, birthdays }: {
  relationships: { id: string; name: string; last_quality_time: string | null; importance?: number }[];
  birthdays: Birthday[];
}) {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Upcoming birthdays (next 90 days)
  const upcomingBirthdays = useMemo(() => {
    return birthdays
      .map(b => ({ ...b, daysUntil: getDaysUntilBirthday(b.date) }))
      .filter(b => b.daysUntil <= 90)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [birthdays]);

  // People who need attention (no quality time in a while, based on importance)
  const needAttention = useMemo(() => {
    return relationships
      .filter(r => {
        const imp = r.importance ?? 3;
        const days = r.last_quality_time ? differenceInDays(new Date(), new Date(r.last_quality_time)) : 999;
        const threshold = imp >= 5 ? 7 : imp === 4 ? 14 : imp === 3 ? 30 : 60;
        return days >= threshold;
      })
      .sort((a, b) => (b.importance ?? 3) - (a.importance ?? 3));
  }, [relationships]);

  // Mini calendar for current month
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart); // 0=Sun

  // Get birthday dates for this month
  const birthdayDays = birthdays.map(b => {
    const [m, d] = b.date.split('-');
    return { day: parseInt(d), month: parseInt(m), name: b.name };
  }).filter(b => b.month === now.getMonth() + 1);

  return (
    <div className="space-y-4">
      {/* Mini Calendar */}
      <GlassCard>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">
          {format(now, 'MMMM yyyy', { locale: ptBR })}
        </p>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['D','S','T','Q','Q','S','S'].map((d, i) => (
            <div key={i} className="text-[9px] text-muted-foreground text-center font-bold py-0.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array(startWeekday).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {days.map(day => {
            const dayNum = day.getDate();
            const isToday = format(day, 'yyyy-MM-dd') === today;
            const bday = birthdayDays.find(b => b.day === dayNum);
            return (
              <div key={dayNum} title={bday ? `🎂 ${bday.name}` : undefined}
                className={`relative h-7 flex items-center justify-center rounded-lg text-[10px] font-medium transition-colors ${
                  isToday ? 'bg-rose-500 text-white font-bold' :
                  bday ? 'bg-pink-500/20 text-pink-400 font-semibold' :
                  'text-foreground/70 hover:bg-muted/60'
                }`}
              >
                {dayNum}
                {bday && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-400" />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[9px] text-muted-foreground">Hoje</span>
          <div className="w-2 h-2 rounded-full bg-pink-400 ml-2" /><span className="text-[9px] text-muted-foreground">Aniversário</span>
        </div>
      </GlassCard>

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <GlassCard>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">🎂 Próximos aniversários</p>
          <div className="space-y-2">
            {upcomingBirthdays.map(b => {
              const [m, d] = b.date.split('-');
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    b.daysUntil === 0 ? 'bg-pink-500 text-white' :
                    b.daysUntil <= 7 ? 'bg-pink-500/20 text-pink-400' : 'bg-muted/60 text-muted-foreground'
                  }`}>{b.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d}/{m} • {b.relation}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    b.daysUntil === 0 ? 'bg-pink-500 text-white' :
                    b.daysUntil <= 7 ? 'bg-pink-500/15 text-pink-400' : 'bg-muted text-muted-foreground'
                  }`}>{b.daysUntil === 0 ? 'Hoje!' : `${b.daysUntil}d`}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Need attention */}
      {needAttention.length > 0 && (
        <GlassCard>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">💛 Pedem sua atenção</p>
          <div className="space-y-2">
            {needAttention.slice(0, 5).map(r => {
              const days = r.last_quality_time ? differenceInDays(new Date(), new Date(r.last_quality_time)) : null;
              const cfg = getImportanceConfig(r.importance ?? 3);
              return (
                <div key={r.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${cfg.bg}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${cfg.color} border-current`}>
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className={`text-[10px] ${cfg.color}`}>{cfg.label}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {days !== null ? `há ${days}d` : 'nunca registrado'}
                  </span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── Lista Unificada ──────────────────────────────────────────
function ListaView({ relationships, birthdays, addRelationship, updateRelationship, markQualityTime, deleteRelationship, setBirthdays }: {
  relationships: { id: string; name: string; relation: string | null; likes: string | null; last_quality_time: string | null; notes: string | null; importance?: number }[];
  birthdays: Birthday[];
  addRelationship: (data: Omit<{ id: string; name: string; relation: string | null; likes: string | null; important_dates: { label: string; date: string }[]; last_quality_time: string | null; notes: string | null }, 'id'> & { importance?: number }) => Promise<void>;
  updateRelationship: (id: string, data: Record<string, unknown>) => Promise<void>;
  markQualityTime: (id: string) => void;
  deleteRelationship: (id: string) => void;
  setBirthdays: (b: Birthday[]) => void;
}) {
  const [addingPerson, setAddingPerson] = useState(false);
  const [importingFriend, setImportingFriend] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', relation: 'família', likes: '', notes: '', importance: 3 });
  const [personForm, setPersonForm] = useState({ name: '', relation: 'família', likes: '', notes: '', importance: 3, birthday: '' });
  const { friends } = useFriendships();

  // Filter out friends already in relationships
  const availableFriends = friends.filter(f => {
    const friendName = f.friend_profile?.name || f.requester_profile?.name || '';
    return friendName && !relationships.some(r => r.name.toLowerCase() === friendName.toLowerCase());
  });

  const handleImportFriend = async (friendName: string) => {
    await addRelationship({ name: friendName, relation: 'amigo', likes: '', notes: '', importance: 3, important_dates: [], last_quality_time: null });
    setImportingFriend(false);
  };

  const handleAddPerson = async () => {
    if (!personForm.name.trim()) return;
    const importantDates: { label: string; date: string }[] = [];
    if (personForm.birthday) {
      const mmdd = personForm.birthday.slice(5);
      const newB: Birthday = { id: crypto.randomUUID(), name: personForm.name, date: mmdd, relation: personForm.relation, notes: '' };
      const updated = [...birthdays, newB];
      setBirthdays(updated);
      localStorage.setItem('life_birthdays', JSON.stringify(updated));
      importantDates.push({ label: 'Aniversário', date: personForm.birthday });
    }
    await addRelationship({ ...personForm, important_dates: importantDates, last_quality_time: null });
    setPersonForm({ name: '', relation: 'família', likes: '', notes: '', importance: 3, birthday: '' });
    setAddingPerson(false);
  };



  const sortedRels = [...relationships].sort((a, b) => (b.importance ?? 3) - (a.importance ?? 3));

  return (
    <div className="space-y-4">
      {/* Pessoas */}
      <SectionImageCard img={vidaRelImg} title="Pessoas">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">Sua rede de afeto</p>
          <div className="flex gap-1.5">
            {availableFriends.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setImportingFriend(true)} className="gap-1.5 h-8 text-xs rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                <Users className="w-3.5 h-3.5" /> Amigos
              </Button>
            )}
            <Button size="sm" onClick={() => setAddingPerson(true)} className="gap-1.5 h-8 text-xs rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0">
              <Plus className="w-3.5 h-3.5" /> Pessoa
            </Button>
          </div>
        </div>

        {/* Import friend dialog */}
        {importingFriend && (
          <div className="mb-3 p-3 bg-muted/30 rounded-xl border border-border/40 space-y-2">
            <p className="text-xs font-semibold text-foreground">Importar amigo conectado</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {availableFriends.map(f => {
                const name = f.friend_profile?.name || f.requester_profile?.name || '?';
                return (
                  <button
                    key={f.id}
                    onClick={() => handleImportFriend(name)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-card hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{name}</span>
                  </button>
                );
              })}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setImportingFriend(false)} className="w-full h-8 text-xs rounded-xl">Cancelar</Button>
          </div>
        )}

        {addingPerson && (
          <div className="mb-3 p-3 bg-muted/30 rounded-xl border border-border/40 space-y-2">
            <Input value={personForm.name} onChange={e => setPersonForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome..." className="rounded-xl h-9 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={personForm.relation} onValueChange={v => setPersonForm(p => ({ ...p, relation: v }))}>
                <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{['família', 'amigo', 'parceiro', 'colega', 'outro'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={String(personForm.importance)} onValueChange={v => setPersonForm(p => ({ ...p, importance: Number(v) }))}>
                <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder="Importância" /></SelectTrigger>
                <SelectContent>
                  {IMPORTANCE_LEVELS.map(l => <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">🎂 Aniversário (opcional)</label>
              <Input type="date" value={personForm.birthday} onChange={e => setPersonForm(p => ({ ...p, birthday: e.target.value }))} className="rounded-xl h-8 text-xs mt-0.5" />
            </div>
            <Input value={personForm.likes} onChange={e => setPersonForm(p => ({ ...p, likes: e.target.value }))} placeholder="O que ela gosta... (opcional)" className="rounded-xl h-8 text-sm" />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddPerson} className="flex-1 h-8 text-xs rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0">Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingPerson(false)} className="h-8 text-xs rounded-xl">Cancelar</Button>
            </div>
          </div>
        )}

        {sortedRels.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Adicione as pessoas importantes da sua vida</p>
        ) : (
          <div className="space-y-2">
            {sortedRels.map(r => {
              const cfg = getImportanceConfig(r.importance ?? 3);
              const days = r.last_quality_time ? differenceInDays(new Date(), new Date(r.last_quality_time)) : null;
              const isEditing = editingId === r.id;

              if (isEditing) {
                return (
                  <div key={r.id} className="p-3 rounded-xl bg-muted/40 border border-rose-500/30 space-y-2">
                    <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome..." className="rounded-xl h-9 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={editForm.relation} onValueChange={v => setEditForm(p => ({ ...p, relation: v }))}>
                        <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{['família', 'amigo', 'parceiro', 'colega', 'outro'].map(rel => <SelectItem key={rel} value={rel}>{rel}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={String(editForm.importance)} onValueChange={v => setEditForm(p => ({ ...p, importance: Number(v) }))}>
                        <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue placeholder="Importância" /></SelectTrigger>
                        <SelectContent>
                          {IMPORTANCE_LEVELS.map(l => <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={editForm.likes} onChange={e => setEditForm(p => ({ ...p, likes: e.target.value }))} placeholder="O que ela gosta... (opcional)" className="rounded-xl h-8 text-sm" />
                    <Input value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notas... (opcional)" className="rounded-xl h-8 text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        await updateRelationship(r.id, { name: editForm.name, relation: editForm.relation, importance: editForm.importance, likes: editForm.likes, notes: editForm.notes });
                        setEditingId(null);
                      }} className="flex-1 h-8 text-xs rounded-xl bg-rose-500 hover:bg-rose-600 text-white border-0">Salvar</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 text-xs rounded-xl">Cancelar</Button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={r.id} className="p-3 rounded-xl bg-muted/40 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold ${cfg.color} border-current`}>
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{r.relation}</span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        {days !== null && <span className="text-[10px] text-muted-foreground">• {days}d atrás</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-[52px]">
                    <button onClick={() => markQualityTime(r.id)} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-semibold hover:bg-rose-500/20 transition-colors">
                      Próximo Momento ❤️
                    </button>
                    <div className="flex-1" />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => {
                      setEditingId(r.id);
                      setEditForm({ name: r.name, relation: r.relation || 'família', likes: r.likes || '', notes: r.notes || '', importance: r.importance ?? 3 });
                    }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-destructive/40 hover:text-destructive" onClick={() => deleteRelationship(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionImageCard>
    </div>
  );
}

// ── 3. Pessoas Tab (unified) ─────────────────────────────────
function PessoasTab() {
  const { relationships, addRelationship, updateRelationship, markQualityTime, deleteRelationship } = useLifePersonal();
  const [birthdays, setBirthdays] = useState<Birthday[]>(() => {
    try { return JSON.parse(localStorage.getItem('life_birthdays') || '[]'); } catch { return []; }
  });
  const [view, setView] = useState<'pantheon' | 'agenda' | 'lista'>('pantheon');

  const views = [
    { key: 'pantheon' as const, icon: '🏛️', label: 'Pantheon' },
    { key: 'agenda' as const, icon: '📅', label: 'Agenda' },
    { key: 'lista' as const, icon: '👥', label: 'Lista' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* View switcher */}
      <motion.div variants={fadeUp}>
        <div className="flex gap-2 p-1 rounded-2xl bg-muted/40 border border-border/30">
          {views.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                view === v.key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === 'pantheon' && (
          <motion.div key="pantheon" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}>
            <GlassCard>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Seu Pantheon Pessoal</p>
              <PantheonView relationships={relationships as any[]} markQualityTime={markQualityTime} />
              <p className="text-[10px] text-muted-foreground text-center mt-4">Toque em uma pessoa para registrar um momento juntos ❤️</p>
            </GlassCard>
          </motion.div>
        )}
        {view === 'agenda' && (
          <motion.div key="agenda" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}>
            <AgendaView relationships={relationships as any[]} birthdays={birthdays} />
          </motion.div>
        )}
        {view === 'lista' && (
          <motion.div key="lista" variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}>
            <ListaView
              relationships={relationships as any[]}
              birthdays={birthdays}
              addRelationship={addRelationship as any}
              updateRelationship={updateRelationship as any}
              markQualityTime={markQualityTime}
              deleteRelationship={deleteRelationship}
              setBirthdays={setBirthdays}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// ── 4. Experiences ──────────────────────────────────────────
function ExperiencesTab() {
  const { experiences, addExperience, deleteExperience } = useLifePersonal();
  const [dialog, setDialog] = useState<'quero_viver' | 'memoria' | null>(null);
  const [form, setForm] = useState({ title: '', description: '', experience_date: '' });

  const handleAdd = async () => {
    if (!form.title.trim() || !dialog) return;
    await addExperience({ ...form, type: dialog, photo_url: null, experience_date: form.experience_date || null });
    setForm({ title: '', description: '', experience_date: '' });
    setDialog(null);
  };

  const bucketList = experiences.filter(e => e.type === 'quero_viver');
  const memories = experiences.filter(e => e.type === 'memoria');

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <SectionImageCard img={vidaExpImg} title="Tempo de Vida">
          <div className="flex gap-2 mb-4">
            <Button size="sm" onClick={() => setDialog('quero_viver')} className="flex-1 h-8 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0">
              + Quero viver
            </Button>
            <Button size="sm" onClick={() => setDialog('memoria')} className="flex-1 h-8 text-xs rounded-xl bg-violet-500 hover:bg-violet-600 text-white border-0">
              + Memória
            </Button>
          </div>

          {bucketList.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lista do que quero viver</p>
              <div className="space-y-1.5">
                {bucketList.map(e => (
                  <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                    <span className="text-base">⭐</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      {e.description && <p className="text-xs text-muted-foreground truncate">{e.description}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded text-destructive/40 hover:text-destructive" onClick={() => deleteExperience(e.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {memories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Memórias</p>
              <div className="space-y-1.5">
                {memories.map(e => (
                  <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-500/8 border border-violet-500/15">
                    <span className="text-base">📸</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      {e.experience_date && <p className="text-xs text-muted-foreground">{format(new Date(e.experience_date), 'dd/MM/yyyy')}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded text-destructive/40 hover:text-destructive" onClick={() => deleteExperience(e.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {experiences.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Comece a construir sua lista de vida</p>}
        </SectionImageCard>
      </motion.div>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{dialog === 'quero_viver' ? '⭐ O que quero viver' : '📸 Registrar memória'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Título..." className="rounded-xl" />
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descrição..." className="rounded-xl resize-none" rows={2} />
            {dialog === 'memoria' && (
              <div>
                <label className="text-xs text-muted-foreground">Data</label>
                <Input type="date" value={form.experience_date} onChange={e => setForm(p => ({ ...p, experience_date: e.target.value }))} className="rounded-xl mt-1" />
              </div>
            )}
          </div>
          <Button onClick={handleAdd} className={`w-full rounded-xl ${dialog === 'quero_viver' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-500 hover:bg-violet-600'} text-white border-0`}>Salvar</Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ── 5. Brain Dump ────────────────────────────────────────────
const RESOLUTION_CONFIG: Record<BrainDump['resolution'], { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'text-muted-foreground bg-muted/40' },
  resolver: { label: 'Resolver', color: 'text-orange-500 bg-orange-500/10' },
  deixar_ir: { label: 'Deixar ir', color: 'text-blue-500 bg-blue-500/10' },
  nao_importa: { label: 'Não importa', color: 'text-green-500 bg-green-500/10' },
};

function DecompressTab() {
  const { brainDumps, addBrainDump, resolveDump, deleteDump } = useLifePersonal();
  const [text, setText] = useState('');

  const handleAdd = async () => {
    if (!text.trim()) return;
    await addBrainDump(text.trim());
    setText('');
  };

  const pending = brainDumps.filter(d => d.resolution === 'pendente');
  const resolved = brainDumps.filter(d => d.resolution !== 'pendente');

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <SectionImageCard img={vidaDescompImg} title="Espaço de Descompressão">
          <p className="text-xs text-muted-foreground mb-3">Jogue tudo da sua cabeça aqui. Sem julgamentos.</p>
          <div className="flex gap-2 mb-4">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="O que está na sua cabeça agora?"
              className="rounded-xl resize-none text-sm flex-1"
              rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAdd(); }}
            />
            <Button onClick={handleAdd} className="self-end h-9 rounded-xl bg-sky-500 hover:bg-sky-600 text-white border-0 px-3">
              Jogar fora
            </Button>
          </div>

          {pending.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Na cabeça agora</p>
              <AnimatePresence>
                {pending.map(d => (
                  <motion.div key={d.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60 }}
                    className="p-3 rounded-xl bg-muted/40 border border-border/30">
                    <p className="text-sm mb-2">{d.content}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => resolveDump(d.id, 'resolver')} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 transition-colors">
                        Resolver
                      </button>
                      <button onClick={() => resolveDump(d.id, 'deixar_ir')} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 transition-colors">
                        Deixar ir
                      </button>
                      <button onClick={() => resolveDump(d.id, 'nao_importa')} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-green-500/15 text-green-500 hover:bg-green-500/25 transition-colors">
                        Não importa
                      </button>
                      <button onClick={() => deleteDump(d.id)} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        Apagar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Resolvidos</p>
              <div className="space-y-1.5">
                {resolved.map(d => (
                  <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${RESOLUTION_CONFIG[d.resolution].color}`}>
                      {RESOLUTION_CONFIG[d.resolution].label}
                    </span>
                    <p className="text-xs text-muted-foreground line-through truncate flex-1">{d.content}</p>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0 rounded" onClick={() => deleteDump(d.id)}>
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionImageCard>
      </motion.div>
    </motion.div>
  );
}

// ── 6. Balance Radar ─────────────────────────────────────────
const BALANCE_AREAS = [
  { key: 'casa', label: 'Casa', color: '#f97316' },
  { key: 'familia', label: 'Família', color: '#f43f5e' },
  { key: 'amigos', label: 'Amigos', color: '#8b5cf6' },
  { key: 'lazer', label: 'Lazer', color: '#06b6d4' },
  { key: 'autocuidado', label: 'Autocuidado', color: '#10b981' },
  { key: 'tempo_sozinho', label: 'Eu mesmo', color: '#f59e0b' },
];

function RadarTab() {
  const { balanceLogs, logBalance, weeklyRitual, saveWeeklyRitual } = useLifePersonal();
  const [ritualForm, setRitualForm] = useState({
    want_to_live: weeklyRitual?.want_to_live || '',
    more_present_with: weeklyRitual?.more_present_with || '',
    avoid_repeating: weeklyRitual?.avoid_repeating || '',
  });

  const maxCount = Math.max(...balanceLogs.map(l => l.count), 1);
  const cx = 110; const cy = 110; const r = 80;

  const points = BALANCE_AREAS.map((area, i) => {
    const angle = (i / BALANCE_AREAS.length) * 2 * Math.PI - Math.PI / 2;
    const log = balanceLogs.find(l => l.area === area.key);
    const val = Math.min((log?.count || 0) / maxCount, 1);
    return { x: cx + r * Math.cos(angle) * val, y: cy + r * Math.sin(angle) * val, ...area, count: log?.count || 0, angle };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridPoints = BALANCE_AREAS.map((_, i) => {
    const angle = (i / BALANCE_AREAS.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <SectionImageCard img={vidaRadarImg} title="Radar de Equilíbrio">
          <p className="text-xs text-muted-foreground mb-4">Baseado nos últimos 30 dias. Toque para registrar.</p>
          <div className="flex justify-center mb-4">
            <svg width="220" height="220" viewBox="0 0 220 220">
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map(scale => (
                <polygon key={scale}
                  points={gridPoints.map(p => `${cx + (p.x - cx) * scale},${cy + (p.y - cy) * scale}`).join(' ')}
                  fill="none" stroke="hsl(var(--border))" strokeWidth="0.8" opacity="0.4" />
              ))}
              {gridPoints.map((p, i) => (
                <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.8" opacity="0.3" />
              ))}
              {/* Filled area */}
              <polygon points={polygonPoints} fill="hsl(38 92% 50%)" fillOpacity="0.2" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
              {/* Dots */}
              {points.map(p => (
                <circle key={p.key} cx={p.x} cy={p.y} r="4" fill={p.color} stroke="white" strokeWidth="1.5" />
              ))}
              {/* Labels */}
              {BALANCE_AREAS.map((area, i) => {
                const angle = (i / BALANCE_AREAS.length) * 2 * Math.PI - Math.PI / 2;
                const lx = cx + (r + 18) * Math.cos(angle);
                const ly = cy + (r + 18) * Math.sin(angle);
                return (
                  <text key={area.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    fontSize="9" fill="hsl(var(--muted-foreground))" fontWeight="600">
                    {area.label}
                  </text>
                );
              })}
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BALANCE_AREAS.map(area => {
              const log = balanceLogs.find(l => l.area === area.key);
              return (
                <button key={area.key} onClick={() => logBalance(area.key)}
                  className="p-2 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors text-center">
                  <p className="text-xs font-semibold">{area.label}</p>
                  <p className="text-[10px] text-muted-foreground">{log?.count || 0}x</p>
                </button>
              );
            })}
          </div>
        </SectionImageCard>
      </motion.div>

      {/* Weekly Ritual */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ritual Semanal</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">O que quero viver essa semana?</label>
              <Textarea value={ritualForm.want_to_live} onChange={e => setRitualForm(p => ({ ...p, want_to_live: e.target.value }))}
                placeholder="Uma experiência, um momento..." className="rounded-xl resize-none mt-1 text-sm" rows={2} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Com quem quero estar mais presente?</label>
              <Input value={ritualForm.more_present_with} onChange={e => setRitualForm(p => ({ ...p, more_present_with: e.target.value }))}
                placeholder="Nome ou grupo..." className="rounded-xl mt-1 text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">O que quero evitar repetir?</label>
              <Input value={ritualForm.avoid_repeating} onChange={e => setRitualForm(p => ({ ...p, avoid_repeating: e.target.value }))}
                placeholder="Um padrão, um hábito..." className="rounded-xl mt-1 text-sm h-9" />
            </div>
            <Button onClick={() => saveWeeklyRitual(ritualForm)} className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white border-0">
              Salvar ritual da semana
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ── 7. Light Diary ───────────────────────────────────────────
const DIARY_FIELDS = [
  {
    key: 'best_moment' as const,
    img: diarySunImg,
    label: 'Melhor momento do dia',
    placeholder: 'O que te fez sorrir hoje?',
    multiline: true,
    gradient: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/20',
    accent: 'text-amber-500',
    labelGlass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  },
  {
    key: 'bothered_by' as const,
    img: diaryCloudImg,
    label: 'Algo que te incomodou',
    placeholder: 'Pode falar sem julgamento...',
    multiline: true,
    gradient: 'from-slate-500/10 to-slate-400/5',
    border: 'border-slate-500/20',
    accent: 'text-slate-400',
    labelGlass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  },
  {
    key: 'gratitude' as const,
    img: diaryGratitudeImg,
    label: 'Uma gratidão pequena',
    placeholder: 'Não precisa ser grande...',
    multiline: false,
    gradient: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-500/20',
    accent: 'text-emerald-500',
    labelGlass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'kind_to_self' as const,
    img: diaryHeartImg,
    label: 'Você foi gentil consigo hoje?',
    placeholder: 'De que forma você se cuidou?',
    multiline: false,
    gradient: 'from-yellow-500/10 to-amber-400/5',
    border: 'border-yellow-500/20',
    accent: 'text-yellow-500',
    labelGlass: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
  },
  {
    key: 'carry_forward' as const,
    img: diaryMoonImg,
    label: 'O que você quer levar para amanhã?',
    placeholder: 'Uma intenção, um sentimento...',
    multiline: false,
    gradient: 'from-violet-500/10 to-purple-500/5',
    border: 'border-violet-500/20',
    accent: 'text-violet-400',
    labelGlass: 'bg-violet-500/20 text-violet-700 dark:text-violet-300',
  },
];

// ── 6. Checklist Tab ─────────────────────────────────────────
const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Uma vez',
  daily: 'Todo dia',
  weekly: 'Toda semana',
  monthly: 'Todo mês',
  yearly: 'Todo ano',
};

const RECURRENCE_BADGE: Record<string, string> = {
  none: 'bg-muted/60 text-muted-foreground',
  daily: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  weekly: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  monthly: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  yearly: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

function ChecklistTab() {
  const { pendingItems, doneItems, toggleComplete, addItem, deleteItem, loading } = useLifeChecklist();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const item = await addItem(title, recurrence);
    if (item) {
      setTitle('');
      setRecurrence('none');
      setAdding(false);
    }
    setSubmitting(false);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold">Afazeres do dia</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pendingItems.length === 0
                  ? 'Tudo em dia ✨'
                  : `${pendingItems.length} pendente${pendingItems.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setAdding(v => !v)}
              className="gap-1.5 h-8 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>

          {/* Add form */}
          <AnimatePresence>
            {adding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3 bg-muted/30 rounded-xl border border-border/40 space-y-2">
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Tomar vitamina, Regar as plantas..."
                    className="rounded-xl h-9 text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    autoFocus
                  />
                  <Select value={recurrence} onValueChange={v => setRecurrence(v as Recurrence)}>
                    <SelectTrigger className="rounded-xl h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {recurrence !== 'none' && (
                    <p className="text-[10px] text-muted-foreground px-1">
                      {recurrence === 'daily' && '↻ Aparece automaticamente todo dia'}
                      {recurrence === 'weekly' && '↻ Aparece toda semana no mesmo dia'}
                      {recurrence === 'monthly' && '↻ Aparece todo mês na mesma data'}
                      {recurrence === 'yearly' && '↻ Aparece todo ano na mesma data'}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAdd}
                      disabled={!title.trim() || submitting}
                      className="flex-1 h-8 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-0"
                    >
                      {submitting ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="h-8 text-xs rounded-xl">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending items */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : pendingItems.length === 0 && doneItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-amber-500/50" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum afazer por hoje</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Adicione algo para fazer ↑</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 group"
                >
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className="w-6 h-6 rounded-lg border-2 border-amber-500/50 flex items-center justify-center shrink-0 hover:bg-amber-500/10 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.recurrence !== 'none' && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5 ${RECURRENCE_BADGE[item.recurrence]}`}>
                        ↻ {RECURRENCE_LABELS[item.recurrence]}
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-lg text-destructive/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Done items today */}
          {doneItems.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Concluídos hoje ({doneItems.length})
              </p>
              <div className="space-y-1.5">
                {doneItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/20 group"
                  >
                    <button
                      onClick={() => toggleComplete(item.id)}
                      className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center shrink-0"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </button>
                    <p className="text-sm text-muted-foreground line-through flex-1 truncate">{item.title}</p>
                    {item.recurrence !== 'none' && (
                      <span className="text-[10px] text-muted-foreground/50">↻</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

function DiaryTab() {
  const { diary, saveDiary } = useLifePersonal();
  const [form, setForm] = useState({
    best_moment: diary?.best_moment || '',
    bothered_by: diary?.bothered_by || '',
    gratitude: diary?.gratitude || '',
    kind_to_self: diary?.kind_to_self || '',
    carry_forward: diary?.carry_forward || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveDiary(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <SectionImageCard img={vidaDiarioImg} title="Diário Leve">
          <p className="text-xs text-muted-foreground mb-5">30 segundos. Sem pressão. ✨</p>
          <div className="space-y-3">
            {DIARY_FIELDS.map(field => (
              <motion.div
                key={field.key}
                variants={fadeUp}
                className={`rounded-2xl border bg-gradient-to-br ${field.gradient} ${field.border} overflow-hidden`}
              >
                {/* Header with 3D image + frosted label */}
                <div className="flex items-center gap-3 px-3.5 pt-3 pb-2.5">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md">
                    <img src={field.img} alt={field.label} className="w-full h-full object-cover" />
                  </div>
                  <label className={`text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm ${field.labelGlass}`}>
                    {field.label}
                  </label>
                </div>
                <div className="px-3.5 pb-3.5">
                  {field.multiline ? (
                    <Textarea
                      value={form[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="rounded-xl resize-none text-sm bg-background/50 border-border/30 placeholder:text-muted-foreground/50 min-h-[72px]"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={form[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="rounded-xl h-9 text-sm bg-background/50 border-border/30 placeholder:text-muted-foreground/50"
                    />
                  )}
                </div>
              </motion.div>
            ))}
            <Button
              onClick={handleSave}
              className={`w-full rounded-xl border-0 font-semibold transition-all ${saved ? 'bg-emerald-500 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
            >
              {saved ? '✓ Guardado no diário' : 'Guardar no diário'}
            </Button>
          </div>
        </SectionImageCard>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Tasks() {
  const navigate = useNavigate();
  const { loading } = useLifePersonal();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-rose-500/4 blur-[100px]" />
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="gradient-tasks">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/[0.06] rounded-full blur-2xl" />
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/[0.04] rounded-full blur-3xl" />
          </div>
          <div className="relative container mx-auto px-4 pt-6 pb-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Vida Pessoal</h1>
                <p className="text-white/60 text-xs mt-0.5">O lugar onde você respira</p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-5 bg-background rounded-t-3xl -mt-5 relative z-10" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pb-10 max-w-lg">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-card/50 border border-border/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="equilibrio" className="w-full">
            {/* Section nav — horizontal scroll with all 7 tabs */}
            <div className="mb-6 -mx-4 px-4 overflow-x-auto scrollbar-none">
              <TabsList className="flex w-max gap-3 h-auto p-0 bg-transparent shadow-none rounded-none">
                {[
                  { value: 'equilibrio', img: tabHojeImg, title: 'Hoje', sub: 'Check-in' },
                  { value: 'lista', img: tabListaImg, title: 'Lista', sub: 'Afazeres' },
                  { value: 'metas', img: tabMetasImg, title: 'Metas', sub: 'Objetivos' },
                  { value: 'diario', img: vidaDiarioImg, title: 'Diário', sub: 'Reflexão' },
                  { value: 'pessoas', img: tabPessoasImg, title: 'Pessoas', sub: 'Relações' },
                  { value: 'casa', img: vidaCasaImg, title: 'Casa', sub: 'Rotinas' },
                  { value: 'vida', img: tabVidaImg, title: 'Vida', sub: 'Experiências' },
                  { value: 'descomprimir', img: vidaDescompImg, title: 'Mente', sub: 'Descomprimir' },
                  { value: 'radar', img: vidaRadarImg, title: 'Radar', sub: 'Equilíbrio' },
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="p-0 rounded-2xl overflow-hidden shrink-0 w-[88px] border-2 border-transparent
                      data-[state=active]:border-primary/60 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20
                      data-[state=inactive]:opacity-70 data-[state=inactive]:scale-95
                      transition-all duration-200 bg-transparent"
                  >
                    <div className="relative w-full flex flex-col">
                      <img src={tab.img} alt={tab.title} className="w-full h-16 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-4">
                        <span className="text-[11px] font-extrabold text-white block leading-none">{tab.title}</span>
                        <span className="text-[8px] text-white/60 block mt-0.5 leading-none">{tab.sub}</span>
                      </div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="equilibrio"><CheckinPanel /></TabsContent>
            <TabsContent value="lista"><ChecklistTab /></TabsContent>
            <TabsContent value="metas"><GoalsTab /></TabsContent>
            <TabsContent value="casa"><HouseTab /></TabsContent>
            <TabsContent value="pessoas"><PessoasTab /></TabsContent>
            <TabsContent value="vida"><ExperiencesTab /></TabsContent>
            <TabsContent value="descomprimir"><DecompressTab /></TabsContent>
            <TabsContent value="radar"><RadarTab /></TabsContent>
            <TabsContent value="diario"><DiaryTab /></TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
