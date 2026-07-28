import { useState } from 'react';
import oppCurriculoImg from '@/assets/opp-curriculo.png';
import oppPropostaImg from '@/assets/opp-proposta.png';
import oppReuniaoImg from '@/assets/opp-reuniao.png';
import oppEntrevistaImg from '@/assets/opp-entrevista.png';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Briefcase, TrendingUp, Target, BookOpen, Star,
  Zap, Trophy, Plus, Check, Trash2, BarChart3,
  ChevronRight, Edit2, X, Play, Square, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfessional } from '@/hooks/useProfessional';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const CAREER_TRACKS: Record<string, string> = {
  corporativo: '🏢 Corporativo',
  empreendedorismo: '🚀 Empreendedorismo',
  freelance: '💻 Freelance',
  concurso: '📋 Concurso',
  transicao: '🔄 Transição de Carreira',
};

const SKILL_CATEGORIES: Record<string, string> = {
  comunicacao: '💬 Comunicação',
  lideranca: '👑 Liderança',
  tecnica: '⚙️ Técnica',
  vendas: '🎯 Vendas',
  organizacao: '📁 Organização',
  marketing: '📢 Marketing',
};

const LEARNING_TYPES = ['curso', 'livro', 'aula', 'certificacao', 'outros'];
const OPP_TYPES = ['curriculo', 'proposta', 'reuniao', 'entrevista'];
const STUDY_TYPES = ['aula', 'leitura', 'exercicio', 'revisao', 'simulado'];
const PLAN_TYPES = ['curso', 'concurso', 'habilidade', 'certificacao', 'idioma', 'livre'];
const MISSION_TYPES = ['estrategica', 'aprendizado', 'networking', 'organizacao'];

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg ${className}`}>
      {children}
    </div>
  );
}

// Amber-themed button class helper
const amberBtn = "bg-amber-500 hover:bg-amber-600 text-white border-0";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{children}</p>;
}

// ─── Timer Component ───────────────────────────────────────────────────────────
function FocusTimer({ onComplete }: { onComplete: (minutes: number) => void }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preset, setPreset] = useState(25);
  const intervalRef = useState<NodeJS.Timeout | null>(null);

  const start = () => {
    setRunning(true);
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s >= preset * 60 - 1) {
          clearInterval(interval);
          setRunning(false);
          onComplete(preset);
          toast.success(`⏱️ ${preset} minutos de foco concluídos!`);
          return 0;
        }
        return s + 1;
      });
    }, 1000);
    (intervalRef as any)[0] = interval;
  };

  const stop = () => {
    if ((intervalRef as any)[0]) clearInterval((intervalRef as any)[0]);
    setRunning(false);
    if (seconds > 30) {
      onComplete(Math.floor(seconds / 60));
    }
    setSeconds(0);
  };

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  const progress = seconds / (preset * 60);

  return (
    <GlassCard className="text-center">
      <SectionLabel>Modo Foco Profundo</SectionLabel>
      <div className="flex justify-center gap-2 mb-4">
        {[25, 50].map(p => (
          <button
            key={p}
            onClick={() => { if (!running) setPreset(p); }}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${preset === p ? 'bg-amber-500 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
          >
            {p} min
          </button>
        ))}
      </div>
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(38 92% 50%)" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
            strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold font-mono">{running || seconds > 0 ? `${mins}:${secs}` : `${preset}:00`}</span>
        </div>
      </div>
      {!running ? (
        <Button onClick={start} className={`gap-2 rounded-xl px-6 ${amberBtn}`}>
          <Play className="w-4 h-4" /> Iniciar Foco
        </Button>
      ) : (
        <Button variant="outline" onClick={stop} className="gap-2 rounded-xl px-6 border-destructive/40 text-destructive hover:bg-destructive/10">
          <Square className="w-4 h-4" /> Encerrar
        </Button>
      )}
    </GlassCard>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { profile, weekScore, weekFocusHours, incomeProgress, xpForNextLevel, xpProgress, weeklyMissions, completeMission, deleteMission, addMission } = useProfessional();
  const [newMission, setNewMission] = useState({ type: 'estrategica', title: '' });
  const [addingMission, setAddingMission] = useState(false);

  const missionEmojis: Record<string, string> = {
    estrategica: '🎯', aprendizado: '📚', networking: '🤝', organizacao: '📁'
  };

  const handleAddMission = async () => {
    if (!newMission.title.trim()) return;
    await addMission(newMission.type, newMission.title);
    setNewMission({ type: 'estrategica', title: '' });
    setAddingMission(false);
  };

  const levelLabels = ['Iniciante', 'Aprendiz', 'Profissional', 'Sênior', 'Expert', 'Mestre', 'Lendário'];
  const levelLabel = levelLabels[Math.min((profile?.level || 1) - 1, levelLabels.length - 1)];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Level & XP */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-foreground">Nível {profile?.level || 1}</span>
                <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full font-semibold">{levelLabel}</span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-2.5 mb-1">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(xpProgress, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{profile?.level_xp || 0} / {xpForNextLevel} XP para o próximo nível</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Weekly Stats */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <SectionLabel>Semana Atual</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-500">{weekScore}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Score Semanal</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-500">{weekFocusHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground mt-0.5">Horas de Foco</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Income Progress */}
      {profile && profile.target_income > 0 && (
        <motion.div variants={fadeUp}>
          <GlassCard>
            <SectionLabel>Meta de Renda</SectionLabel>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(profile.current_income)}</p>
                <p className="text-xs text-muted-foreground">Renda atual</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className="text-right">
                <p className="text-lg font-bold text-amber-500">{formatCurrency(profile.target_income)}</p>
                <p className="text-xs text-muted-foreground">Meta</p>
              </div>
            </div>
            <div className="w-full bg-muted/60 rounded-full h-3 mb-2">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(incomeProgress, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-right">{incomeProgress.toFixed(0)}% da meta atingida</p>
          </GlassCard>
        </motion.div>
      )}

      {/* Weekly Missions */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Missões da Semana</SectionLabel>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => setAddingMission(true)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {addingMission && (
            <div className="mb-3 space-y-2 p-3 bg-muted/30 rounded-xl border border-border/40">
              <Select value={newMission.type} onValueChange={v => setNewMission(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MISSION_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{missionEmojis[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newMission.title}
                onChange={e => setNewMission(p => ({ ...p, title: e.target.value }))}
                placeholder="Descreva a missão..."
                className="h-8 text-sm rounded-lg"
                onKeyDown={e => e.key === 'Enter' && handleAddMission()}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddMission} className={`flex-1 h-7 text-xs rounded-lg ${amberBtn}`}>Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingMission(false)} className="h-7 text-xs rounded-lg">Cancelar</Button>
              </div>
            </div>
          )}

          {weeklyMissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma missão esta semana</p>
          ) : (
            <div className="space-y-2">
              {weeklyMissions.map(m => (
                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${m.completed ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-muted/40'}`}>
                  <span className="text-base">{missionEmojis[m.mission_type]}</span>
                  <p className={`flex-1 text-sm ${m.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>{m.title}</p>
                  {!m.completed && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => completeMission(m.id)}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-destructive/60 hover:text-destructive" onClick={() => deleteMission(m.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ─── Score Tab ────────────────────────────────────────────────────────────────
function ScoreTab() {
  const { todayRecord, saveDailyRecord, weekRecords } = useProfessional();
  const [form, setForm] = useState({
    focus_hours: todayRecord?.focus_hours || 0,
    strategic_tasks_done: todayRecord?.strategic_tasks_done || 0,
    study_done: todayRecord?.study_done || false,
    important_deliveries: todayRecord?.important_deliveries || 0,
    relevant_meetings: todayRecord?.relevant_meetings || 0,
    notes: todayRecord?.notes || '',
  });
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleTimerComplete = (minutes: number) => {
    const addedHours = minutes / 60;
    setForm(p => ({ ...p, focus_hours: Math.round((p.focus_hours + addedHours) * 10) / 10 }));
    setFocusMinutes(m => m + minutes);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveDailyRecord(form);
    setSaving(false);
  };

  const preview = Math.round(
    Math.min(form.focus_hours * 10, 40) +
    Math.min(form.strategic_tasks_done * 8, 24) +
    (form.study_done ? 15 : 0) +
    Math.min(form.important_deliveries * 7, 14) +
    Math.min(form.relevant_meetings * 4, 8)
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <FocusTimer onComplete={handleTimerComplete} />

      <motion.div variants={fadeUp}>
        <GlassCard>
          <SectionLabel>Score de Hoje</SectionLabel>

          <div className="flex items-center justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(38 92% 50%)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(preview / 100, 1))}`}
                  strokeLinecap="round" className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-amber-500">{preview}</span>
                <span className="text-[10px] text-muted-foreground">pontos</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">⏱️ Horas de Foco</label>
                <span className="text-sm font-bold text-amber-500">{form.focus_hours}h</span>
              </div>
              <div style={{ '--primary': '38 92% 50%' } as React.CSSProperties}>
                <Slider
                  value={[form.focus_hours]}
                  onValueChange={([v]) => setForm(p => ({ ...p, focus_hours: v }))}
                  min={0} max={10} step={0.5}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">🎯 Tarefas Estratégicas</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(p => ({ ...p, strategic_tasks_done: Math.max(0, p.strategic_tasks_done - 1) }))} className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-sm">-</button>
                  <span className="font-bold w-4 text-center">{form.strategic_tasks_done}</span>
                  <button onClick={() => setForm(p => ({ ...p, strategic_tasks_done: p.strategic_tasks_done + 1 }))} className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-sm">+</button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">🚀 Entregas Importantes</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(p => ({ ...p, important_deliveries: Math.max(0, p.important_deliveries - 1) }))} className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-sm">-</button>
                  <span className="font-bold w-4 text-center">{form.important_deliveries}</span>
                  <button onClick={() => setForm(p => ({ ...p, important_deliveries: p.important_deliveries + 1 }))} className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-sm">+</button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">🤝 Reuniões Relevantes</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setForm(p => ({ ...p, relevant_meetings: Math.max(0, p.relevant_meetings - 1) }))} className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-sm">-</button>
                  <span className="font-bold w-4 text-center">{form.relevant_meetings}</span>
                  <button onClick={() => setForm(p => ({ ...p, relevant_meetings: p.relevant_meetings + 1 }))} className="w-6 h-6 rounded-lg bg-muted/60 flex items-center justify-center text-sm">+</button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setForm(p => ({ ...p, study_done: !p.study_done }))}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${form.study_done ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' : 'bg-muted/40 border-border/40'}`}
            >
              <span className="text-sm font-medium">📚 Estudei hoje</span>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${form.study_done ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/40'}`}>
                {form.study_done && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>

            <Textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Observações do dia (opcional)..."
              className="rounded-xl bg-muted/40 border-border/40 text-sm resize-none"
              rows={2}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className={`w-full mt-4 rounded-xl font-semibold ${amberBtn}`}>
            {saving ? 'Salvando...' : 'Salvar Score do Dia'}
          </Button>
        </GlassCard>
      </motion.div>

      {/* Week history */}
      {weekRecords.length > 0 && (
        <motion.div variants={fadeUp}>
          <GlassCard>
            <SectionLabel>Histórico da Semana</SectionLabel>
            <div className="space-y-2">
              {weekRecords.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(r.record_date + 'T12:00:00'), 'EEEE', { locale: ptBR })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{r.focus_hours}h foco</span>
                    <span className={`text-sm font-bold ${r.score >= 70 ? 'text-green-500' : r.score >= 40 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                      {r.score} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Studies Tab ──────────────────────────────────────────────────────────────
function StudiesTab() {
  const { studyPlans, studySessions, addStudyPlan, deleteStudyPlan, addStudySession, completeStudySession, deleteStudySession } = useProfessional();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planDialog, setPlanDialog] = useState(false);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [completeDialog, setCompleteDialog] = useState<string | null>(null);
  const [actualMinutes, setActualMinutes] = useState(30);
  const [sessionNotes, setSessionNotes] = useState('');
  const [planForm, setPlanForm] = useState({ title: '', plan_type: 'curso', deadline: '', weekly_hours_goal: 5 });
  const [sessionForm, setSessionForm] = useState({ planned_date: format(new Date(), 'yyyy-MM-dd'), topic: '', duration_minutes: 30, activity_type: 'aula' });

  const plan = studyPlans.find(p => p.id === selectedPlan);
  const planSessions = studySessions.filter(s => s.plan_id === selectedPlan);
  const todaySessions = planSessions.filter(s => s.planned_date === format(new Date(), 'yyyy-MM-dd'));
  const doneSessions = planSessions.filter(s => s.completed);

  const totalPlannedHours = planSessions.reduce((s, ss) => s + ss.duration_minutes / 60, 0);
  const progressPct = totalPlannedHours > 0 ? ((plan?.total_hours_done || 0) / totalPlannedHours) * 100 : 0;

  const handleCreatePlan = async () => {
    if (!planForm.title.trim()) return;
    const created = await addStudyPlan({ ...planForm, status: 'active', weekly_hours_goal: Number(planForm.weekly_hours_goal) });
    if (created) { setSelectedPlan(created.id); setPlanDialog(false); setPlanForm({ title: '', plan_type: 'curso', deadline: '', weekly_hours_goal: 5 }); }
  };

  const handleAddSession = async () => {
    if (!sessionForm.topic.trim() || !selectedPlan) return;
    await addStudySession({ ...sessionForm, plan_id: selectedPlan, duration_minutes: Number(sessionForm.duration_minutes), completed: false, actual_duration_minutes: null, notes: null });
    setSessionDialog(false);
    setSessionForm({ planned_date: format(new Date(), 'yyyy-MM-dd'), topic: '', duration_minutes: 30, activity_type: 'aula' });
  };

  const handleComplete = async () => {
    if (!completeDialog) return;
    await completeStudySession(completeDialog, actualMinutes, sessionNotes || undefined);
    setCompleteDialog(null);
    setActualMinutes(30);
    setSessionNotes('');
  };

  const activityEmoji: Record<string, string> = { aula: '🎥', leitura: '📖', exercicio: '✏️', revisao: '🔄', simulado: '📝' };

  if (!selectedPlan) {
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUp}>
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Meus Planos de Estudo</SectionLabel>
              <Button size="sm" onClick={() => setPlanDialog(true)} className={`gap-1.5 rounded-xl h-8 text-xs ${amberBtn}`}>
                <Plus className="w-3.5 h-3.5" /> Novo Plano
              </Button>
            </div>

            {studyPlans.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum plano de estudo ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Crie um plano para organizar seus estudos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studyPlans.map(p => {
                  const planSess = studySessions.filter(s => s.plan_id === p.id);
                  const done = planSess.filter(s => s.completed).length;
                  const total = planSess.length;
                  const pct = total > 0 ? (done / total) * 100 : 0;
                  return (
                    <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all text-left">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-muted/60 rounded-full h-1.5">
                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{done}/{total} sessões</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>

        <Dialog open={planDialog} onOpenChange={setPlanDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle>Novo Plano de Estudo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={planForm.title} onChange={e => setPlanForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Certificação PMP, Aprender Python..." className="rounded-xl" />
              <Select value={planForm.plan_type} onValueChange={v => setPlanForm(p => ({ ...p, plan_type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{PLAN_TYPES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <label className="text-xs text-muted-foreground">Meta semanal (horas)</label>
                <Input type="number" value={planForm.weekly_hours_goal} onChange={e => setPlanForm(p => ({ ...p, weekly_hours_goal: Number(e.target.value) }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Prazo (opcional)</label>
                <Input type="date" value={planForm.deadline} onChange={e => setPlanForm(p => ({ ...p, deadline: e.target.value }))} className="rounded-xl mt-1" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePlan} className={`w-full rounded-xl ${amberBtn}`}>Criar Plano</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Voltar aos planos
        </button>
        <GlassCard>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg">{plan?.title}</h3>
              <p className="text-xs text-muted-foreground">{plan?.plan_type} • Meta: {plan?.weekly_hours_goal}h/semana</p>
            </div>
            <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0 rounded-lg" onClick={() => { deleteStudyPlan(plan!.id); setSelectedPlan(null); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="w-full bg-muted/60 rounded-full h-2.5 mb-2">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(progressPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(plan?.total_hours_done || 0).toFixed(1)}h concluídas</span>
            <span>{totalPlannedHours.toFixed(1)}h planejadas</span>
          </div>
          {plan?.deadline && (
            <p className="text-xs text-muted-foreground mt-2">📅 Prazo: {format(new Date(plan.deadline + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
          )}
        </GlassCard>
      </motion.div>

      {/* Today's sessions */}
      {todaySessions.length > 0 && (
        <motion.div variants={fadeUp}>
          <GlassCard>
            <SectionLabel>Meta de Hoje</SectionLabel>
            <div className="space-y-2">
              {todaySessions.map(s => (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl ${s.completed ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-muted/40'}`}>
                  <span className="text-lg">{activityEmoji[s.activity_type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${s.completed ? 'line-through text-muted-foreground' : ''}`}>{s.topic}</p>
                    <p className="text-xs text-muted-foreground">{s.duration_minutes}min • {s.activity_type}</p>
                  </div>
                  {!s.completed && (
                    <Button size="sm" className={`rounded-lg h-8 text-xs gap-1 ${amberBtn}`} onClick={() => { setCompleteDialog(s.id); setActualMinutes(s.duration_minutes); }}>
                      <Play className="w-3 h-3" /> Iniciar
                    </Button>
                  )}
                  {s.completed && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* All sessions */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Todas as Sessões</SectionLabel>
            <Button size="sm" onClick={() => setSessionDialog(true)} className={`gap-1.5 rounded-xl h-8 text-xs ${amberBtn}`}>
              <Plus className="w-3.5 h-3.5" /> Sessão
            </Button>
          </div>

          {planSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma sessão planejada ainda</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {planSessions.sort((a, b) => a.planned_date.localeCompare(b.planned_date)).map(s => (
                <div key={s.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${s.completed ? 'bg-amber-500/5' : 'bg-muted/40'}`}>
                  <span className="text-base">{activityEmoji[s.activity_type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${s.completed ? 'line-through text-muted-foreground' : ''}`}>{s.topic}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(s.planned_date + 'T12:00:00'), 'dd/MM')} • {s.duration_minutes}min
                    </p>
                  </div>
                  {!s.completed && (
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => { setCompleteDialog(s.id); setActualMinutes(s.duration_minutes); }}>
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg text-destructive/60 hover:text-destructive" onClick={() => deleteStudySession(s.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Add Session Dialog */}
      <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Nova Sessão de Estudo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={sessionForm.topic} onChange={e => setSessionForm(p => ({ ...p, topic: e.target.value }))} placeholder="Tema ou assunto..." className="rounded-xl" />
            <div>
              <label className="text-xs text-muted-foreground">Data</label>
              <Input type="date" value={sessionForm.planned_date} onChange={e => setSessionForm(p => ({ ...p, planned_date: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Duração (min)</label>
                <Input type="number" value={sessionForm.duration_minutes} onChange={e => setSessionForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tipo</label>
                <Select value={sessionForm.activity_type} onValueChange={v => setSessionForm(p => ({ ...p, activity_type: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STUDY_TYPES.map(t => <SelectItem key={t} value={t}>{activityEmoji[t]} {t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddSession} className={`w-full rounded-xl ${amberBtn}`}>Adicionar Sessão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Session Dialog */}
      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Concluir Sessão</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Tempo real estudado (min)</label>
              <Input type="number" value={actualMinutes} onChange={e => setActualMinutes(Number(e.target.value))} className="rounded-xl mt-1" />
            </div>
            <Textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Observações (opcional)..." className="rounded-xl resize-none" rows={2} />
          </div>
          <DialogFooter>
            <Button onClick={handleComplete} className={`w-full rounded-xl ${amberBtn}`}>Marcar como Concluída ✓</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Growth Tab ───────────────────────────────────────────────────────────────
function GrowthTab() {
  const { profile, saveProfile, skills, addSkill, updateSkillRating, deleteSkill, learningLogs, addLearning, deleteLearning, incomeHistory, saveIncome } = useProfessional();
  const [profileDialog, setProfileDialog] = useState(!profile?.job_role);
  const [profileForm, setProfileForm] = useState({
    job_role: profile?.job_role || '',
    current_income: profile?.current_income || 0,
    target_income: profile?.target_income || 0,
    next_goal: profile?.next_goal || '',
    career_track: profile?.career_track || 'corporativo',
  });
  const [skillDialog, setSkillDialog] = useState(false);
  const [skillForm, setSkillForm] = useState({ skill_name: '', category: 'tecnica', rating: 3 });
  const [learningDialog, setLearningDialog] = useState(false);
  const [learningForm, setLearningForm] = useState({ type: 'curso', title: '', duration_minutes: 60, log_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [incomeDialog, setIncomeDialog] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ month: format(startOfMonth(new Date()), 'yyyy-MM-dd'), income: profile?.current_income || 0, notes: '' });

  const handleSaveProfile = async () => {
    await saveProfile({ ...profileForm, current_income: Number(profileForm.current_income), target_income: Number(profileForm.target_income) });
    setProfileDialog(false);
  };

  const handleAddSkill = async () => {
    if (!skillForm.skill_name.trim()) return;
    await addSkill(skillForm);
    setSkillDialog(false);
    setSkillForm({ skill_name: '', category: 'tecnica', rating: 3 });
  };

  const handleAddLearning = async () => {
    if (!learningForm.title.trim()) return;
    await addLearning({ ...learningForm, duration_minutes: Number(learningForm.duration_minutes) });
    setLearningDialog(false);
    setLearningForm({ type: 'curso', title: '', duration_minutes: 60, log_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  };

  const handleSaveIncome = async () => {
    await saveIncome(incomeForm.month, Number(incomeForm.income), incomeForm.notes);
    setIncomeDialog(false);
  };

  const learningTypeEmoji: Record<string, string> = { curso: '🎓', livro: '📚', aula: '🎥', certificacao: '🏆', outros: '💡' };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Career Profile */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Perfil de Carreira</SectionLabel>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" onClick={() => setProfileDialog(true)}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          {profile?.job_role ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cargo atual</p>
                  <p className="font-semibold text-sm">{profile.job_role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-xs text-muted-foreground">Renda atual</p>
                  <p className="font-bold text-sm">{formatCurrency(profile.current_income)}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-xs text-muted-foreground">Meta de renda</p>
                  <p className="font-bold text-sm text-amber-500">{formatCurrency(profile.target_income)}</p>
                </div>
              </div>
              {profile.next_goal && (
                <div className="p-3 bg-muted/40 rounded-xl">
                  <p className="text-xs text-muted-foreground">Próximo objetivo</p>
                  <p className="text-sm font-medium">{profile.next_goal}</p>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl">
                <span className="text-base">{CAREER_TRACKS[profile.career_track]?.split(' ')[0]}</span>
                <div>
                  <p className="text-xs text-muted-foreground">Trilha</p>
                  <p className="text-sm font-medium">{CAREER_TRACKS[profile.career_track]?.split(' ').slice(1).join(' ')}</p>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setProfileDialog(true)} className="w-full text-center p-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Configure seu perfil profissional
            </button>
          )}
        </GlassCard>
      </motion.div>

      {/* Income History */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Evolução de Renda</SectionLabel>
            <Button size="sm" onClick={() => setIncomeDialog(true)} className={`gap-1.5 rounded-xl h-8 text-xs ${amberBtn}`}>
              <Plus className="w-3.5 h-3.5" /> Registrar
            </Button>
          </div>
          {incomeHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de renda ainda</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {incomeHistory.slice(0, 6).map(h => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(h.month + 'T12:00:00'), 'MMM yyyy', { locale: ptBR })}
                  </span>
                  <span className="font-bold text-sm text-amber-500">{formatCurrency(h.income)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Skills Bank */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Banco de Competências</SectionLabel>
            <Button size="sm" onClick={() => setSkillDialog(true)} className={`gap-1.5 rounded-xl h-8 text-xs ${amberBtn}`}>
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </Button>
          </div>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Avalie suas competências</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(SKILL_CATEGORIES).map(([cat, label]) => {
                const catSkills = skills.filter(s => s.category === cat);
                if (catSkills.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
                    {catSkills.map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 mb-1.5">
                        <span className="flex-1 text-sm font-medium">{s.skill_name}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} onClick={() => updateSkillRating(s.id, n)}>
                              <Star className={`w-4 h-4 transition-colors ${n <= s.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                            </button>
                          ))}
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded text-destructive/50 hover:text-destructive" onClick={() => deleteSkill(s.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Learning Logs */}
      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Registro de Aprendizado</SectionLabel>
            <Button size="sm" onClick={() => setLearningDialog(true)} className={`gap-1.5 rounded-xl h-8 text-xs ${amberBtn}`}>
              <Plus className="w-3.5 h-3.5" /> Registrar
            </Button>
          </div>
          {learningLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aprendizado registrado</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {learningLogs.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <span className="text-lg shrink-0">{learningTypeEmoji[l.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(l.log_date + 'T12:00:00'), 'dd/MM/yyyy')}
                      {l.duration_minutes && ` • ${l.duration_minutes}min`}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 rounded shrink-0 text-destructive/50 hover:text-destructive" onClick={() => deleteLearning(l.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Perfil Profissional</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={profileForm.job_role} onChange={e => setProfileForm(p => ({ ...p, job_role: e.target.value }))} placeholder="Cargo atual (ex: Analista, CEO, Dev...)" className="rounded-xl" />
            <Select value={profileForm.career_track} onValueChange={v => setProfileForm(p => ({ ...p, career_track: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Trilha de carreira" /></SelectTrigger>
              <SelectContent>{Object.entries(CAREER_TRACKS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <label className="text-xs text-muted-foreground">Renda atual (R$)</label>
              <Input type="number" value={profileForm.current_income} onChange={e => setProfileForm(p => ({ ...p, current_income: Number(e.target.value) }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Meta de renda (R$)</label>
              <Input type="number" value={profileForm.target_income} onChange={e => setProfileForm(p => ({ ...p, target_income: Number(e.target.value) }))} className="rounded-xl mt-1" />
            </div>
            <Textarea value={profileForm.next_goal} onChange={e => setProfileForm(p => ({ ...p, next_goal: e.target.value }))} placeholder="Próximo objetivo profissional..." className="rounded-xl resize-none" rows={2} />
          </div>
          <DialogFooter><Button onClick={handleSaveProfile} className={`w-full rounded-xl ${amberBtn}`}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skillDialog} onOpenChange={setSkillDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Nova Competência</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={skillForm.skill_name} onChange={e => setSkillForm(p => ({ ...p, skill_name: e.target.value }))} placeholder="Nome da habilidade..." className="rounded-xl" />
            <Select value={skillForm.category} onValueChange={v => setSkillForm(p => ({ ...p, category: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(SKILL_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <div>
              <p className="text-sm mb-2">Avaliação: {skillForm.rating}/5</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setSkillForm(p => ({ ...p, rating: n }))}>
                    <Star className={`w-7 h-7 transition-colors ${n <= skillForm.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddSkill} className={`w-full rounded-xl ${amberBtn}`}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={learningDialog} onOpenChange={setLearningDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Registrar Aprendizado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={learningForm.type} onValueChange={v => setLearningForm(p => ({ ...p, type: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{LEARNING_TYPES.map(t => <SelectItem key={t} value={t}>{learningTypeEmoji[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={learningForm.title} onChange={e => setLearningForm(p => ({ ...p, title: e.target.value }))} placeholder="Nome do curso, livro, certificação..." className="rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Data</label>
                <Input type="date" value={learningForm.log_date} onChange={e => setLearningForm(p => ({ ...p, log_date: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração (min)</label>
                <Input type="number" value={learningForm.duration_minutes} onChange={e => setLearningForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} className="rounded-xl mt-1" />
              </div>
            </div>
            <Textarea value={learningForm.notes} onChange={e => setLearningForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observações..." className="rounded-xl resize-none" rows={2} />
          </div>
          <DialogFooter><Button onClick={handleAddLearning} className={`w-full rounded-xl ${amberBtn}`}>Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={incomeDialog} onOpenChange={setIncomeDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Registrar Renda Mensal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Mês de referência</label>
              <Input type="date" value={incomeForm.month} onChange={e => setIncomeForm(p => ({ ...p, month: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Renda (R$)</label>
              <Input type="number" value={incomeForm.income} onChange={e => setIncomeForm(p => ({ ...p, income: Number(e.target.value) }))} className="rounded-xl mt-1" />
            </div>
            <Textarea value={incomeForm.notes} onChange={e => setIncomeForm(p => ({ ...p, notes: e.target.value }))} placeholder="Observações..." className="rounded-xl resize-none" rows={2} />
          </div>
          <DialogFooter><Button onClick={handleSaveIncome} className={`w-full rounded-xl ${amberBtn}`}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Opportunities Tab ────────────────────────────────────────────────────────
function OpportunitiesTab() {
  const { opportunities, addOpportunity, updateOpportunityResult, deleteOpportunity } = useProfessional();
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState({ type: 'proposta', description: '', opportunity_date: format(new Date(), 'yyyy-MM-dd'), result: 'pendente' });

  const handleAdd = async () => {
    if (!form.description.trim()) return;
    await addOpportunity(form);
    setDialog(false);
    setForm({ type: 'proposta', description: '', opportunity_date: format(new Date(), 'yyyy-MM-dd'), result: 'pendente' });
  };

  
  const typeImage: Record<string, string> = {
    curriculo: oppCurriculoImg,
    proposta: oppPropostaImg,
    reuniao: oppReuniaoImg,
    entrevista: oppEntrevistaImg,
  };
  const typeLabel: Record<string, string> = {
    curriculo: 'Currículo', proposta: 'Proposta', reuniao: 'Reunião', entrevista: 'Entrevista'
  };
  const resultConfig: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'text-yellow-600 bg-yellow-500/10' },
    positivo: { label: 'Positivo', color: 'text-green-600 bg-green-500/10' },
    negativo: { label: 'Negativo', color: 'text-red-500 bg-red-500/10' },
  };

  const total = opportunities.length;
  const positive = opportunities.filter(o => o.result === 'positivo').length;
  const conversionRate = total > 0 ? ((positive / total) * 100).toFixed(0) : '0';

  const byType = OPP_TYPES.reduce((acc, t) => {
    acc[t] = opportunities.filter(o => o.type === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <GlassCard>
          <SectionLabel>Radar de Oportunidades</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-foreground">{total}</p>
              <p className="text-xs text-muted-foreground">Total de ações</p>
            </div>
            <div className="bg-muted/40 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-amber-500">{conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Taxa de conversão</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {OPP_TYPES.map(t => (
              <div key={t} className="relative rounded-2xl overflow-hidden h-28 shadow-md">
                <img
                  src={typeImage[t]}
                  alt={typeLabel[t]}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Frosted glass overlay at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-black/40 px-3 py-2 rounded-b-2xl">
                  <p className="text-xs font-bold text-white">{typeLabel[t]}</p>
                  <p className="text-xs text-white/80">{byType[t]} ações</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={fadeUp}>
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Registro de Ações</SectionLabel>
            <Button size="sm" onClick={() => setDialog(true)} className={`gap-1.5 rounded-xl h-8 text-xs ${amberBtn}`}>
              <Plus className="w-3.5 h-3.5" /> Registrar
            </Button>
          </div>

          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma ação registrada</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Registre currículos, propostas, entrevistas...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {opportunities.map(o => (
                <div key={o.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    <img src={typeImage[o.type]} alt={typeLabel[o.type]} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{o.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(o.opportunity_date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                  </div>
                  <Select value={o.result} onValueChange={v => updateOpportunityResult(o.id, v)}>
                    <SelectTrigger className={`h-7 text-xs rounded-lg border-0 px-2 w-auto ${resultConfig[o.result].color}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(resultConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg shrink-0 text-destructive/50 hover:text-destructive" onClick={() => deleteOpportunity(o.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Registrar Ação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{OPP_TYPES.map(t => <SelectItem key={t} value={t}>{typeLabel[t]}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva a ação realizada..." className="rounded-xl resize-none" rows={3} />
            <div>
              <label className="text-xs text-muted-foreground">Data</label>
              <Input type="date" value={form.opportunity_date} onChange={e => setForm(p => ({ ...p, opportunity_date: e.target.value }))} className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleAdd} className={`w-full rounded-xl ${amberBtn}`}>Registrar Ação</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Professional() {
  const navigate = useNavigate();
  const { profile, weekScore, loading } = useProfessional();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[120px]"
          style={{ background: 'hsl(38 92% 50%)' }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[100px]"
          style={{ background: 'hsl(25 90% 45%)' }} />
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div style={{ background: 'linear-gradient(135deg, hsl(38 92% 42%), hsl(22 90% 35%))' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/[0.06] rounded-full blur-2xl" />
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/[0.04] rounded-full blur-3xl" />
            <div className="absolute -bottom-10 right-20 w-60 h-60 bg-white/[0.03] rounded-full blur-2xl" />
          </div>
          <div className="relative container mx-auto px-4 pt-6 pb-10">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl backdrop-blur-sm"
                onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  Profissional
                </h1>
                <p className="text-white/50 text-xs mt-0.5 ml-[46px]">
                  {profile ? `Nível ${profile.level} • Score semanal: ${weekScore} pts` : 'Configure seu painel de evolução'}
                </p>
              </div>
              {profile && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-300" />
                  <span className="text-white text-xs font-semibold">{weekScore} pts</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-5 bg-background rounded-t-3xl -mt-5 relative z-10" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pb-10 max-w-lg">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-card/50 border border-border/30 animate-pulse" />)}
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 w-full rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 p-1 mb-5">
              <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Trophy className="w-3.5 h-3.5 mr-1" />Visão
              </TabsTrigger>
              <TabsTrigger value="score" className="rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Zap className="w-3.5 h-3.5 mr-1" />Score
              </TabsTrigger>
              <TabsTrigger value="studies" className="rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="w-3.5 h-3.5 mr-1" />Estudos
              </TabsTrigger>
              <TabsTrigger value="growth" className="rounded-xl text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />Carreira
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><OverviewTab /></TabsContent>
            <TabsContent value="score"><ScoreTab /></TabsContent>
            <TabsContent value="studies"><StudiesTab /></TabsContent>
            <TabsContent value="growth"><GrowthTab /></TabsContent>
          </Tabs>
        )}

        {/* Opportunities floating tab */}
        <div className="mt-4">
          <Tabs defaultValue="opp">
            <TabsList className="w-full rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 p-1">
              <TabsTrigger value="opp" className="w-full rounded-xl text-xs font-semibold data-[state=active]:bg-background">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />Radar de Oportunidades
              </TabsTrigger>
            </TabsList>
            <TabsContent value="opp" className="mt-4"><OpportunitiesTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
