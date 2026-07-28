// ============================================================================
// Liberation  —  MÓDULO "LIBERTAÇÃO" (rota "/libertacao")
// ----------------------------------------------------------------------------
// Ajuda o usuário a reduzir ou largar vícios/hábitos. Ele cria "desafios"
// (ex.: cigarro, açúcar), registra cada momento de "vontade" e como reagiu,
// e acompanha estatísticas, uma linha do tempo dos últimos 14 dias e o
// histórico recente de episódios.
// ============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Wind, Shield, Repeat, PenLine, Hand, TrendingDown, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLiberation } from '@/hooks/useLiberation';
import CreateChallengeDialog from '@/components/liberation/CreateChallengeDialog';
import CravingFlowDialog from '@/components/liberation/CravingFlowDialog';
import { toast } from 'sonner';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getViceImage } from '@/lib/viceImages';
import { VICE_STRATEGIES } from '@/lib/viceStrategies';

// Cores-tema (verde-azulado) usadas nesta tela.
const teal = 'hsl(170, 60%, 42%)';
const tealLight = 'hsl(170, 40%, 95%)';

// Traduz o "nível de intenção" de cada desafio para um texto amigável.
const intentionLabels: Record<string, string> = {
  reduce: 'Reduzindo',
  pause: 'Pausando',
  quit: 'Largando',
  understanding: 'Entendendo',
};

// Para cada resultado de uma "vontade", define o ícone e o rótulo mostrados.
const outcomeIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  resisted: { icon: <Shield className="w-3.5 h-3.5" />, label: 'Resistiu' },
  substituted: { icon: <Repeat className="w-3.5 h-3.5" />, label: 'Trocou' },
  registered: { icon: <PenLine className="w-3.5 h-3.5" />, label: 'Registrou' },
  ceded: { icon: <Hand className="w-3.5 h-3.5" />, label: 'Cedeu' },
};

export default function Liberation() {
  const navigate = useNavigate();
  // Garante que o usuário está autenticado (contexto de login).
  useAuth();
  // Busca os dados do módulo e as funções para criar/editar/excluir/registrar.
  const { challenges, cravings, createChallenge, updateChallenge, deleteChallenge, recordCraving } = useLiberation();
  // Controla a abertura da janela "criar novo desafio".
  const [showCreate, setShowCreate] = useState(false);
  // Controla a abertura da janela "estou com vontade agora".
  const [showCraving, setShowCraving] = useState(false);
  // Guarda o desafio marcado para exclusão (mostra a confirmação).
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  // Guarda o desafio marcado para edição.
  const [editTarget, setEditTarget] = useState<string | null>(null);

  // Mantém apenas os desafios que ainda estão ativos (não arquivados).
  const activeChallenges = challenges.filter(c => c.status === 'active');

  // Calcula os números do resumo: quantas vontades foram evitadas, o total
  // e quantas cederam. Só recalcula quando a lista de vontades muda.
  const stats = useMemo(() => {
    const resisted = cravings.filter(c => c.outcome === 'resisted' || c.outcome === 'substituted').length;
    const total = cravings.length;
    const ceded = cravings.filter(c => c.outcome === 'ceded').length;
    return { resisted, total, ceded };
  }, [cravings]);

  // Monta a linha do tempo dos últimos 14 dias. Para cada dia, conta as vontades
  // e classifica: "clear" (sem registro), "good" (dia bom) ou "hard" (dia difícil,
  // quando cedeu em algum momento). Só recalcula quando as vontades mudam.
  const timeline = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayCravings = cravings.filter(c => isSameDay(new Date(c.created_at), d));
      const hasCede = dayCravings.some(c => c.outcome === 'ceded');
      days.push({ date: d, count: dayCravings.length, status: dayCravings.length === 0 ? 'clear' : hasCede ? 'hard' : 'good' });
    }
    return days;
  }, [cravings]);

  // Cria um novo desafio e mostra uma mensagem de sucesso.
  const handleCreateChallenge = (data: Parameters<typeof createChallenge.mutateAsync>[0]) => {
    createChallenge.mutate(data, { onSuccess: () => toast.success('Desafio criado! Você está no controle.') });
  };

  // Registra um momento de "vontade" com a reação escolhida pelo usuário.
  const handleRecordCraving = (data: Parameters<typeof recordCraving.mutateAsync>[0]) => {
    recordCraving.mutate(data);
  };

  // Exclui de vez o desafio marcado (após a confirmação) e limpa a seleção.
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteChallenge.mutate(deleteTarget, {
      onSuccess: () => { toast.success('Desafio removido.'); setDeleteTarget(null); },
    });
  };

  // Arquiva um desafio (tira da lista de ativos sem apagar o histórico).
  const handleArchive = (id: string) => {
    updateChallenge.mutate({ id, status: 'archived' }, {
      onSuccess: () => toast.success('Desafio arquivado.'),
    });
  };

  return (
    // Fundo suave em degradê que ocupa toda a altura da tela.
    <div className="min-h-[100dvh] bg-gradient-to-b from-[hsl(170,25%,96%)] via-background to-background relative overflow-hidden">
      {/* Formas coloridas desfocadas ao fundo (apenas enfeite visual) */}
      {/* Ambient shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.07]" style={{ background: teal }} />
        <div className="absolute bottom-20 -left-40 w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.05]" style={{ background: 'hsl(200, 70%, 50%)' }} />
      </div>

      {/* Cabeçalho: botão de voltar + título e subtítulo da tela */}
      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 pt-5 pb-3 flex items-center gap-3">
        {/* Botão de voltar para a tela inicial */}
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl w-9 h-9 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">Libertação</h1>
          <p className="text-xs text-muted-foreground">Retome o controle, no seu ritmo.</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pb-24 space-y-5">
        {/* Botão de destaque "Estou com vontade agora" — só aparece se houver
            algum desafio ativo. Abre a janela de apoio no momento da vontade. */}
        {/* CTA — Estou com vontade */}
        {activeChallenges.length > 0 && (
          <motion.button onClick={() => setShowCraving(true)} whileTap={{ scale: 0.97 }}
            className="w-full relative overflow-hidden rounded-3xl p-5 text-left"
            style={{ background: `linear-gradient(135deg, ${teal}, hsl(180, 55%, 38%))` }}>
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wind className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base">Estou com vontade agora</p>
                <p className="text-white/70 text-xs">Vamos atravessar juntos. Sem julgamento.</p>
              </div>
            </div>
          </motion.button>
        )}

        {/* Seção "Seus desafios": título, botão "Novo" e a lista de desafios */}
        {/* Active challenges */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Seus desafios</h2>
            {/* Botão para abrir a janela de criação de um novo desafio */}
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(true)} className="rounded-xl gap-1 text-xs" style={{ color: teal }}>
              <Plus className="w-4 h-4" /> Novo
            </Button>
          </div>

          {/* Se não há nenhum desafio ainda, mostra um convite para criar o primeiro */}
          {activeChallenges.length === 0 ? (
            <motion.button onClick={() => setShowCreate(true)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="w-full p-8 rounded-3xl border-2 border-dashed border-border/50 flex flex-col items-center gap-3 text-center hover:border-[hsl(170,60%,42%)]/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: tealLight }}>🌱</div>
              <p className="font-semibold text-foreground">Criar seu primeiro desafio</p>
              <p className="text-xs text-muted-foreground max-w-[240px]">Escolha algo que você quer reduzir ou largar. Sem pressa, sem pressão.</p>
            </motion.button>
          ) : (
            /* Caso contrário, lista cada desafio ativo como um cartão */
            <div className="space-y-2">
              {activeChallenges.map((ch, i) => {
                // Vontades registradas para este desafio e quantas foram evitadas.
                const chCravings = cravings.filter(c => c.challenge_id === ch.id);
                const avoided = chCravings.filter(c => c.outcome === 'resisted' || c.outcome === 'substituted').length;
                return (
                  <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Imagem ilustrativa do vício/hábito do desafio */}
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md bg-muted">
                        <img src={getViceImage(VICE_STRATEGIES.find(v => v.label === ch.title)?.id ?? null)} alt={ch.title} className="w-full h-full object-cover" />
                      </div>
                      {/* Nome do desafio + intenção e quantos momentos registrados */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{ch.title}</p>
                        <p className="text-xs text-muted-foreground">{intentionLabels[ch.intention_level]} · {chCravings.length} momento{chCravings.length !== 1 ? 's' : ''}</p>
                      </div>
                      {/* Contador de vontades evitadas (só aparece se houver alguma) */}
                      {avoided > 0 && (
                        <div className="text-right mr-1">
                          <p className="text-lg font-extrabold" style={{ color: teal }}>{avoided}</p>
                          <p className="text-[10px] text-muted-foreground">evitados</p>
                        </div>
                      )}
                      {/* Menu de três pontos: arquivar ou excluir o desafio */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-xl text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleArchive(ch.id)} className="gap-2 text-sm">
                            <Pencil className="w-3.5 h-3.5" /> Arquivar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(ch.id)} className="gap-2 text-sm text-destructive">
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo em 3 números: Evitados, Total e Conscientes (só se houver registros) */}
        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Evitados', value: stats.resisted, icon: <Shield className="w-4 h-4" /> },
              { label: 'Total', value: stats.total, icon: <TrendingDown className="w-4 h-4" /> },
              { label: 'Conscientes', value: stats.ceded, icon: <Hand className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">{s.icon}</div>
                <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Linha do tempo dos últimos 14 dias: uma bolinha por dia, colorida
            conforme foi um dia bom, difícil ou sem registro */}
        {/* Emotional timeline */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Linha do tempo</h2>
            <div className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/30">
              {/* Fileira de bolinhas, uma para cada dia */}
              <div className="flex gap-1.5 items-end justify-center">
                {timeline.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.03 }}
                      className="w-5 h-5 rounded-full transition-colors"
                      style={{
                        background: day.status === 'clear' ? 'hsl(var(--muted))' : day.status === 'good' ? teal : 'hsl(var(--muted-foreground) / 0.3)',
                        opacity: day.status === 'clear' ? 0.4 : day.count > 2 ? 1 : 0.7,
                        boxShadow: day.status === 'good' ? `0 0 8px ${teal}40` : 'none',
                      }} />
                    {(i === 0 || i === 13) && (
                      <span className="text-[9px] text-muted-foreground">{format(day.date, 'dd', { locale: ptBR })}</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Legenda explicando o que cada cor de bolinha significa */}
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: teal }} /> Bom dia</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Dia difícil</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted opacity-40" /> Sem registro</span>
              </div>
            </div>
          </div>
        )}

        {/* Últimos 5 momentos de vontade registrados, do mais recente para o mais antigo */}
        {/* Recent episodes */}
        {cravings.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Registros recentes</h2>
            <div className="space-y-2">
              {cravings.slice(0, 5).map((cr, i) => {
                // Ícone e rótulo conforme como o usuário reagiu à vontade.
                const oc = outcomeIcons[cr.outcome];
                return (
                  <motion.div key={cr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card/60 border border-border/20">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: cr.outcome === 'ceded' ? 'hsl(var(--muted))' : `${teal}15`, color: cr.outcome === 'ceded' ? 'hsl(var(--muted-foreground))' : teal }}>
                      {oc?.icon}
                    </div>
                    {/* Reação + emoções que dispararam a vontade e data/hora do registro */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{oc?.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {cr.trigger_emotions?.join(', ') || '—'} · {format(new Date(cr.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Frase de incentivo no rodapé da tela */}
        <div className="text-center pt-6 pb-4">
          <p className="text-xs text-muted-foreground italic">"Você está criando novos padrões."</p>
        </div>
      </div>

      {/* Janela para criar um novo desafio */}
      <CreateChallengeDialog open={showCreate} onOpenChange={setShowCreate} onSubmit={handleCreateChallenge} />
      {/* Janela de apoio no momento da vontade (registra como o usuário reagiu) */}
      <CravingFlowDialog open={showCraving} onOpenChange={setShowCraving} challenges={activeChallenges} onRecord={handleRecordCraving} />

      {/* Confirmação antes de excluir um desafio (ação sem volta) */}
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir desafio?</AlertDialogTitle>
            <AlertDialogDescription>Isso removerá o desafio e todo o histórico de momentos registrados. Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
