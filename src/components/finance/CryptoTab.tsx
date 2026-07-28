import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Bitcoin, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCryptoSnapshots, type CryptoSnapshot } from '@/hooks/useCryptoSnapshots';
import { CryptoSnapshotForm } from './CryptoSnapshotForm';
import { CryptoMovesSubTab } from './CryptoMovesSubTab';
import { CryptoStrategiesSubTab } from './CryptoStrategiesSubTab';
import { CryptoDepositsSubTab } from './CryptoDepositsSubTab';
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

function formatUsd(v: number) { return `$ ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function formatBrl(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }

function SnapshotCard({ snapshot, onDelete }: { snapshot: CryptoSnapshot; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const pnl = Number(snapshot.total_pnl_usd);
  const equityBrl = Number(snapshot.equity_usd) * Number(snapshot.usd_brl_rate);
  const pnlBrl = pnl * Number(snapshot.usd_brl_rate);

  return (
    <Card className={`overflow-hidden ${pnl >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Bitcoin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{snapshot.exchange} <span className="text-muted-foreground font-normal text-xs">({snapshot.account_type})</span></p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(snapshot.date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                {snapshot.time && ` • ${snapshot.time}`}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <p className="text-sm font-bold tabular-nums">{formatUsd(Number(snapshot.equity_usd))}</p>
              <p className={`text-xs font-medium tabular-nums ${pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                P&L: {pnl >= 0 ? '+' : ''}{formatUsd(pnl)}
              </p>
            </div>
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Saldo Carteira:</span> <span className="font-medium">{formatUsd(Number(snapshot.wallet_balance_usd))}</span></div>
              <div><span className="text-muted-foreground">Disponível:</span> <span className="font-medium">{formatUsd(Number(snapshot.available_balance_usd))}</span></div>
              <div><span className="text-muted-foreground">Margem em Uso:</span> <span className="font-medium">{formatUsd(Number(snapshot.margin_used_usd))}</span></div>
              <div><span className="text-muted-foreground">Posições:</span> <span className="font-medium">{snapshot.total_positions} ({formatUsd(Number(snapshot.positions_value_usd))})</span></div>
              {snapshot.margin_mode && <div><span className="text-muted-foreground">Margem:</span> <span className="font-medium">{snapshot.margin_mode}</span></div>}
              <div><span className="text-muted-foreground">P&L não realiz.:</span> <span className="font-medium">{formatUsd(Number(snapshot.unrealized_pnl_usd))}</span></div>
              <div><span className="text-muted-foreground">P&L total (%):</span> <span className="font-medium">{Number(snapshot.total_pnl_pct).toFixed(2)}%</span></div>
              <div><span className="text-muted-foreground">USD/BRL:</span> <span className="font-medium">{Number(snapshot.usd_brl_rate).toFixed(2)}</span></div>
            </div>
            <div className="border-t pt-2 grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Equity (BRL):</span> <span className="font-bold">{formatBrl(equityBrl)}</span></div>
              <div><span className="text-muted-foreground">P&L (BRL):</span> <span className={`font-bold ${pnlBrl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatBrl(pnlBrl)}</span></div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="text-xs h-8 gap-1 text-destructive" onClick={() => onDelete(snapshot.id)}>
                <Trash2 className="w-3 h-3" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContaSubTab() {
  const { snapshots, loading, latestByExchange, totalEquityUsd, totalPnlUsd, avgRate, addSnapshot, deleteSnapshot } = useCryptoSnapshots();
  const [formOpen, setFormOpen] = useState(false);

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-40 rounded-2xl" /></div>;
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {latestByExchange.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Equity Total</p>
                  <p className="text-lg font-bold tabular-nums">{formatUsd(totalEquityUsd)}</p>
                  <p className="text-[10px] text-muted-foreground">{formatBrl(totalEquityUsd * avgRate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">P&L Total</p>
                  <p className={`text-lg font-bold tabular-nums ${totalPnlUsd >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalPnlUsd >= 0 ? '+' : ''}{formatUsd(totalPnlUsd)}
                  </p>
                  <p className={`text-[10px] ${totalPnlUsd >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatBrl(totalPnlUsd * avgRate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">USD/BRL</p>
                  <p className="text-lg font-bold tabular-nums">{avgRate.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{latestByExchange.length} conta(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <Button
          onClick={() => setFormOpen(true)}
          variant="outline"
          className="w-full rounded-xl h-11 gap-2 border-[hsl(var(--finance))]/30 text-[hsl(var(--finance))] hover:bg-[hsl(var(--finance))]/10"
        >
          <Plus className="w-4 h-4" />
          Novo Snapshot
        </Button>
      </motion.div>

      {snapshots.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card>
            <CardContent className="p-8 text-center">
              <Bitcoin className="w-12 h-12 mx-auto text-amber-500/40 mb-4" />
              <h3 className="font-bold text-lg mb-2">Nenhum snapshot</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Registre o estado da sua carteira cripto para acompanhar evolução, risco e exposição.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        snapshots.map((s) => (
          <motion.div key={s.id} variants={fadeUp}>
            <SnapshotCard snapshot={s} onDelete={deleteSnapshot} />
          </motion.div>
        ))
      )}

      <CryptoSnapshotForm open={formOpen} onOpenChange={setFormOpen} onSubmit={(input) => { addSnapshot(input); setFormOpen(false); }} />
    </motion.div>
  );
}

export function CryptoTab() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="conta" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="conta" className="text-xs">Conta</TabsTrigger>
          <TabsTrigger value="moves" className="text-xs">Movimentação</TabsTrigger>
          <TabsTrigger value="strategies" className="text-xs">Metodologia</TabsTrigger>
          <TabsTrigger value="deposits" className="text-xs">Aportes</TabsTrigger>
        </TabsList>
        <TabsContent value="conta"><ContaSubTab /></TabsContent>
        <TabsContent value="moves"><CryptoMovesSubTab /></TabsContent>
        <TabsContent value="strategies"><CryptoStrategiesSubTab /></TabsContent>
        <TabsContent value="deposits"><CryptoDepositsSubTab /></TabsContent>
      </Tabs>
    </div>
  );
}
