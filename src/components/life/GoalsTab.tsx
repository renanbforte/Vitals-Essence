import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Pencil, Target, Calendar, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useLifeGoals, type LifeGoal, type GoalStatus, type GoalCategory, type GoalPriority, type GoalInput,
} from '@/hooks/useLifeGoals';

const CATEGORIES: Record<GoalCategory, string> = {
  viagem: 'Viagem',
  carreira: 'Carreira',
  saude: 'Saúde',
  financeiro: 'Financeiro',
  pessoal: 'Pessoal',
  outro: 'Outro',
};

const CATEGORY_COLOR: Record<GoalCategory, string> = {
  viagem: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  carreira: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  saude: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  financeiro: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  pessoal: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  outro: 'bg-muted/60 text-muted-foreground',
};

const STATUS_LABEL: Record<GoalStatus, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

const STATUS_COLOR: Record<GoalStatus, string> = {
  nao_iniciada: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
  em_andamento: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  concluida: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
};

const PRIORITY_LABEL: Record<NonNullable<GoalPriority>, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const PRIORITY_COLOR: Record<NonNullable<GoalPriority>, string> = {
  baixa: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  media: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  alta: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

const EMPTY_FORM: GoalInput = {
  title: '',
  description: '',
  category: 'pessoal',
  deadline: null,
  status: 'nao_iniciada',
  priority: null,
};

function formatDeadline(d: string) {
  const date = parseISO(d);
  const days = differenceInDays(date, new Date());
  const label = format(date, "dd 'de' MMM yyyy", { locale: ptBR });
  if (days < 0) return { label, hint: `Atrasada ${Math.abs(days)}d`, tone: 'text-rose-500' };
  if (days === 0) return { label, hint: 'Hoje', tone: 'text-orange-500' };
  if (days <= 7) return { label, hint: `Em ${days}d`, tone: 'text-amber-500' };
  return { label, hint: `Em ${days}d`, tone: 'text-muted-foreground' };
}

export default function GoalsTab() {
  const { goals, loading, addGoal, updateGoal, deleteGoal, toggleComplete } = useLifeGoals();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LifeGoal | null>(null);
  const [form, setForm] = useState<GoalInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [viewing, setViewing] = useState<LifeGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LifeGoal | null>(null);

  const [filterStatus, setFilterStatus] = useState<'todas' | GoalStatus>('todas');
  const [filterCategory, setFilterCategory] = useState<'todas' | GoalCategory>('todas');
  const [sortMode, setSortMode] = useState<'deadline' | 'created'>('deadline');

  const filtered = useMemo(() => {
    let list = [...goals];
    if (filterStatus !== 'todas') list = list.filter(g => g.status === filterStatus);
    if (filterCategory !== 'todas') list = list.filter(g => g.category === filterCategory);
    if (sortMode === 'deadline') {
      list.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      });
    } else {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return list;
  }, [goals, filterStatus, filterCategory, sortMode]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (g: LifeGoal) => {
    setEditing(g);
    setForm({
      title: g.title,
      description: g.description ?? '',
      category: g.category,
      deadline: g.deadline,
      status: g.status,
      priority: g.priority,
    });
    setViewing(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Dê um título para sua meta');
      return;
    }
    setSaving(true);
    const payload: GoalInput = {
      ...form,
      title: form.title.trim(),
      description: form.description?.trim() || null,
      deadline: form.deadline || null,
      priority: form.priority || null,
    };
    if (editing) {
      await updateGoal(editing.id, payload);
      toast.success('Meta atualizada');
    } else {
      await addGoal(payload);
      toast.success('Meta criada');
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteGoal(deleteTarget.id);
    toast.success('Meta excluída');
    setDeleteTarget(null);
    setViewing(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-bold">Minhas metas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {goals.length === 0
                ? 'Comece a sonhar ✨'
                : `${goals.filter(g => g.status !== 'concluida').length} em aberto · ${goals.filter(g => g.status === 'concluida').length} concluída${goals.filter(g => g.status === 'concluida').length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Button
            size="sm"
            onClick={openNew}
            className="gap-1.5 h-8 text-xs rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </Button>
        </div>

        {/* Filters */}
        {goals.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
              <SelectTrigger className="rounded-xl h-8 text-xs w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos status</SelectItem>
                {(Object.entries(STATUS_LABEL) as [GoalStatus, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as any)}>
              <SelectTrigger className="rounded-xl h-8 text-xs w-auto min-w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {(Object.entries(CATEGORIES) as [GoalCategory, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortMode(s => s === 'deadline' ? 'created' : 'deadline')}
              className="h-8 text-xs rounded-xl gap-1.5"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortMode === 'deadline' ? 'Por prazo' : 'Mais recentes'}
            </Button>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8 text-orange-500/60" />
            </div>
            <p className="text-sm font-medium">Nenhuma meta por enquanto</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">O que você quer conquistar?</p>
            <Button
              onClick={openNew}
              className="gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              <Plus className="w-4 h-4" /> Adicionar meta
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma meta com esses filtros</p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map(goal => {
                const dl = goal.deadline ? formatDeadline(goal.deadline) : null;
                const done = goal.status === 'concluida';
                return (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className={`p-3 rounded-xl border group transition-colors ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border/30'}`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleComplete(goal)}
                        aria-label={done ? 'Reabrir meta' : 'Marcar como concluída'}
                        className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-orange-500/50 hover:bg-orange-500/10'
                        }`}
                      >
                        {done && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <button
                        onClick={() => setViewing(goal)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className={`text-sm font-medium truncate ${done ? 'line-through text-muted-foreground' : ''}`}>
                          {goal.title}
                        </p>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${CATEGORY_COLOR[goal.category]}`}>
                            {CATEGORIES[goal.category]}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${STATUS_COLOR[goal.status]}`}>
                            {STATUS_LABEL[goal.status]}
                          </span>
                          {goal.priority && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${PRIORITY_COLOR[goal.priority]}`}>
                              {PRIORITY_LABEL[goal.priority]}
                            </span>
                          )}
                          {dl ? (
                            <span className={`inline-flex items-center gap-1 text-[10px] ${dl.tone}`}>
                              <Calendar className="w-2.5 h-2.5" />
                              {dl.label} · {dl.hint}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/70">Sem prazo definido</span>
                          )}
                        </div>
                      </button>
                      <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(goal)}
                          aria-label="Editar meta"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-lg text-destructive/50 hover:text-destructive"
                          onClick={() => setDeleteTarget(goal)}
                          aria-label="Excluir meta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar meta' : 'Nova meta'}</DialogTitle>
            <DialogDescription className="text-xs">
              {editing ? 'Atualize os detalhes da sua meta.' : 'Descreva o que você quer conquistar.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Viajar para o Japão"
                className="rounded-xl mt-1"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Textarea
                value={form.description ?? ''}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Detalhes, motivação, próximos passos..."
                rows={3}
                className="rounded-xl mt-1 resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as GoalCategory }))}>
                  <SelectTrigger className="rounded-xl h-9 mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORIES) as [GoalCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as GoalStatus }))}>
                  <SelectTrigger className="rounded-xl h-9 mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(STATUS_LABEL) as [GoalStatus, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Prazo</label>
                <Input
                  type="date"
                  value={form.deadline ?? ''}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value || null }))}
                  className="rounded-xl h-9 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
                <Select
                  value={form.priority ?? 'nenhuma'}
                  onValueChange={v => setForm(p => ({ ...p, priority: v === 'nenhuma' ? null : (v as GoalPriority) }))}
                >
                  <SelectTrigger className="rounded-xl h-9 mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Sem prioridade</SelectItem>
                    {(Object.entries(PRIORITY_LABEL) as [NonNullable<GoalPriority>, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar meta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{viewing.title}</DialogTitle>
                <DialogDescription className="text-xs">
                  Criada em {format(parseISO(viewing.created_at), "dd 'de' MMM yyyy", { locale: ptBR })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${CATEGORY_COLOR[viewing.category]}`}>
                    {CATEGORIES[viewing.category]}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_COLOR[viewing.status]}`}>
                    {STATUS_LABEL[viewing.status]}
                  </span>
                  {viewing.priority && (
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${PRIORITY_COLOR[viewing.priority]}`}>
                      Prioridade {PRIORITY_LABEL[viewing.priority]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {viewing.deadline ? (() => {
                    const dl = formatDeadline(viewing.deadline);
                    return <span className={dl.tone}>{dl.label} · {dl.hint}</span>;
                  })() : (
                    <span className="text-muted-foreground">Sem prazo definido</span>
                  )}
                </div>

                {viewing.description && (
                  <div className="rounded-xl bg-muted/30 border border-border/30 p-3 text-sm whitespace-pre-wrap">
                    {viewing.description}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="ghost" onClick={() => setDeleteTarget(viewing)} className="rounded-xl text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
                </Button>
                <Button onClick={() => openEdit(viewing)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white border-0">
                  <Pencil className="w-4 h-4 mr-1.5" /> Editar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta meta?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && <>"{deleteTarget.title}" será removida permanentemente. Essa ação não pode ser desfeita.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
