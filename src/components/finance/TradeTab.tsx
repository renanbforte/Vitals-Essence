import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, ChevronDown, ChevronUp, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTradeSessions, type TradeSession, type PostTradeInput } from '@/hooks/useTradeSessions';
import { useBankBalances } from '@/hooks/useBankBalances';
import { PreTradeForm } from './PreTradeForm';
import { PostTradeForm } from './PostTradeForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function TradeSessionCard({ session, onComplete, onDelete, savedBanks }: {
  session: TradeSession;
  onComplete: (id: string, input: PostTradeInput) => void;
  onDelete: (id: string) => void;
  savedBanks: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [postFormOpen, setPostFormOpen] = useState(false);
  const isPre = session.status === 'pre';
  const result = Number(session.financial_result) || 0;

  return (
    <Card className={`overflow-hidden transition-all ${isPre ? 'border-amber-500/30' : result >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isPre ? 'bg-amber-500/15 text-amber-600' : result >= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
              {isPre ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <p className="font-semibold text-sm">
                {format(new Date(session.date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.market || 'Mercado não definido'} • {session.platform || 'Profit'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPre && (
              <span className={`text-sm font-bold tabular-nums ${result >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatCurrency(result)}
              </span>
            )}
            {isPre && (
              <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Pré-trade</span>
            )}
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            {/* Pre-trade info */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><span className="text-muted-foreground">Capital:</span> <span className="font-medium">{formatCurrency(Number(session.allocated_capital))}</span></div>
              <div><span className="text-muted-foreground">Risco dia:</span> <span className="font-medium">{formatCurrency(Number(session.max_daily_risk))}</span></div>
              <div><span className="text-muted-foreground">Risco/op:</span> <span className="font-medium">{formatCurrency(Number(session.risk_per_operation))}</span></div>
            </div>
            {session.expected_scenario && (
              <p className="text-xs"><span className="text-muted-foreground">Cenário:</span> {session.expected_scenario}</p>
            )}
            {session.emotional_state && (
              <p className="text-xs"><span className="text-muted-foreground">Estado:</span> {session.emotional_state}</p>
            )}

            {/* Post-trade info */}
            {!isPre && (
              <div className="space-y-2 border-t pt-2">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Operações:</span> <span className="font-medium">{session.num_operations ?? '—'}</span></div>
                  <div><span className="text-muted-foreground">Acerto:</span> <span className="font-medium">{session.win_rate != null ? `${session.win_rate}%` : '—'}</span></div>
                  <div><span className="text-muted-foreground">Resultado:</span> <span className="font-medium">{session.percentage_result != null ? `${session.percentage_result}%` : '—'}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Maior gain:</span> <span className="font-medium text-emerald-600">{session.biggest_gain != null ? formatCurrency(Number(session.biggest_gain)) : '—'}</span></div>
                  <div><span className="text-muted-foreground">Maior loss:</span> <span className="font-medium text-red-500">{session.biggest_loss != null ? formatCurrency(Number(session.biggest_loss)) : '—'}</span></div>
                </div>
                {session.respected_daily_risk != null && (
                  <div className="flex items-center gap-1 text-xs">
                    {session.respected_daily_risk ? (
                      <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> <span className="text-emerald-600">Risco respeitado</span></>
                    ) : (
                      <><AlertTriangle className="w-3 h-3 text-red-500" /> <span className="text-red-500">Risco excedido</span></>
                    )}
                  </div>
                )}
                {session.bank_name && <p className="text-xs"><span className="text-muted-foreground">Banco:</span> <span className="font-medium">{session.bank_name}</span></p>}
                {session.observations && <p className="text-xs text-muted-foreground italic">{session.observations}</p>}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              {isPre && (
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1 border-[hsl(var(--finance))]/30 text-[hsl(var(--finance))]" onClick={() => setPostFormOpen(true)}>
                  <CheckCircle2 className="w-3 h-3" /> Finalizar Dia
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-xs h-8 gap-1 text-destructive" onClick={() => onDelete(session.id)}>
                <Trash2 className="w-3 h-3" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <PostTradeForm
        open={postFormOpen}
        onOpenChange={setPostFormOpen}
        onSubmit={(input) => { onComplete(session.id, input); setPostFormOpen(false); }}
        savedBanks={savedBanks}
      />
    </Card>
  );
}

export function TradeTab() {
  const { sessions, loading, totalSessions, totalResult, avgWinRate, disciplineRate, createPreTrade, completePostTrade, deleteSession } = useTradeSessions();
  const { bankBalances } = useBankBalances();
  const savedBanks = bankBalances.map(b => b.bank_name);
  const [preFormOpen, setPreFormOpen] = useState(false);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Stats */}
      {totalSessions > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Sessões</p>
                  <p className="text-lg font-bold tabular-nums">{totalSessions}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Resultado</p>
                  <p className={`text-lg font-bold tabular-nums ${totalResult >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalResult >= 0 ? '+' : ''}{formatCurrency(totalResult)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Acerto</p>
                  <p className="text-lg font-bold tabular-nums">{avgWinRate.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Disciplina</p>
                  <p className="text-lg font-bold tabular-nums">{disciplineRate.toFixed(0)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Add button */}
      <motion.div variants={fadeUp}>
        <Button
          onClick={() => setPreFormOpen(true)}
          variant="outline"
          className="w-full rounded-xl h-11 gap-2 border-[hsl(var(--finance))]/30 text-[hsl(var(--finance))] hover:bg-[hsl(var(--finance))]/10"
        >
          <Plus className="w-4 h-4" />
          Nova Sessão de Trade
        </Button>
      </motion.div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-[hsl(var(--finance))]/40 mb-4" />
              <h3 className="font-bold text-lg mb-2">Nenhuma sessão</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Registre seu pré-trade antes de operar e finalize ao final do pregão.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        sessions.map((s) => (
          <motion.div key={s.id} variants={fadeUp}>
            <TradeSessionCard session={s} onComplete={completePostTrade} onDelete={deleteSession} savedBanks={savedBanks} />
          </motion.div>
        ))
      )}

      <PreTradeForm open={preFormOpen} onOpenChange={setPreFormOpen} onSubmit={(input) => { createPreTrade(input); setPreFormOpen(false); }} />
    </motion.div>
  );
}
