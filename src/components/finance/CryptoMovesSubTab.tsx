// ============================================================================
// SUB-ABA "MOVIMENTAÇÕES DIÁRIAS CRIPTO" (operações de compra/venda do dia)
// Lista cada operação de cripto com o lucro ou prejuízo (P&L) do dia. Cada
// cartão pode ser expandido para mostrar os detalhes das posições LONG (aposta
// que sobe) e SHORT (aposta que cai). Os dados chegam via N8N; aqui o dono só
// visualiza, expande os detalhes e pode excluir uma movimentação.
// ============================================================================
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCryptoDailyMoves, type CryptoDailyMove } from '@/hooks/useCryptoDailyMoves';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

// Animação de entrada dos cartões (surgem subindo suavemente)
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

// Formata um número como dinheiro em Dólar (ex.: $ 1,234.56)
function formatUsd(v: number) { return `$ ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

// Cartão de uma única movimentação diária (recebe os dados e a função de excluir)
function MoveCard({ move, onDelete }: { move: CryptoDailyMove; onDelete: (id: string) => void }) {
  // Controla se os detalhes (LONG/SHORT) estão abertos ou fechados
  const [expanded, setExpanded] = useState(false);
  // Lucro/prejuízo total do dia; usado para colorir de verde (ganho) ou vermelho (perda)
  const totalPnl = Number(move.total_pnl_coin_usdt || 0);

  return (
    <Card className={`overflow-hidden ${totalPnl >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${totalPnl >= 0 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-500'}`}>
              {totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              {/* Nome da moeda + corretora, e abaixo a data/hora/metodologia */}
              <p className="font-semibold text-sm">{move.coin} <span className="text-muted-foreground text-xs font-normal">• {move.exchange}</span></p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(move.date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                {move.time && ` • ${move.time}`}
                {move.methodology && ` • ${move.methodology}`}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <p className={`text-sm font-bold tabular-nums ${totalPnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatUsd(totalPnl)}
              </p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                Val: {formatUsd(Number(move.total_value_coin_usdt || 0))}
              </p>
            </div>
            {/* Seta que abre/fecha os detalhes da movimentação */}
            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bloco de detalhes: só aparece quando o cartão está expandido */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Coluna LONG: posição que ganha quando o preço sobe */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-600">📈 LONG</p>
                <div className="text-xs space-y-0.5">
                  <p><span className="text-muted-foreground">Qty:</span> {move.long_qty ?? '—'}</p>
                  <p><span className="text-muted-foreground">Entrada:</span> {move.long_entry_price ? formatUsd(Number(move.long_entry_price)) : '—'}</p>
                  <p><span className="text-muted-foreground">Atual:</span> {move.long_current_price ? formatUsd(Number(move.long_current_price)) : '—'}</p>
                  <p><span className="text-muted-foreground">P&L:</span> {move.long_pnl_usd != null ? formatUsd(Number(move.long_pnl_usd)) : '—'} ({move.long_pnl_pct ?? 0}%)</p>
                  <p><span className="text-muted-foreground">Alav.:</span> {move.long_leverage ?? '—'}x</p>
                  <p><span className="text-muted-foreground">Status:</span> {move.long_status ?? '—'}</p>
                </div>
              </div>
              {/* SHORT */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-red-500">📉 SHORT</p>
                <div className="text-xs space-y-0.5">
                  <p><span className="text-muted-foreground">Qty:</span> {move.short_qty ?? '—'}</p>
                  <p><span className="text-muted-foreground">Entrada:</span> {move.short_entry_price ? formatUsd(Number(move.short_entry_price)) : '—'}</p>
                  <p><span className="text-muted-foreground">Atual:</span> {move.short_current_price ? formatUsd(Number(move.short_current_price)) : '—'}</p>
                  <p><span className="text-muted-foreground">P&L:</span> {move.short_pnl_usd != null ? formatUsd(Number(move.short_pnl_usd)) : '—'} ({move.short_pnl_pct ?? 0}%)</p>
                  <p><span className="text-muted-foreground">Alav.:</span> {move.short_leverage ?? '—'}x</p>
                  <p><span className="text-muted-foreground">Status:</span> {move.short_status ?? '—'}</p>
                </div>
              </div>
            </div>
            {move.usd_brl_rate && (
              <p className="text-xs text-muted-foreground border-t pt-2">USD/BRL: {Number(move.usd_brl_rate).toFixed(2)}</p>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="text-xs h-8 gap-1 text-destructive" onClick={() => onDelete(move.id)}>
                <Trash2 className="w-3 h-3" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CryptoMovesSubTab() {
  const { moves, loading, deleteMove } = useCryptoDailyMoves();

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>;

  if (moves.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center">
        <TrendingUp className="w-12 h-12 mx-auto text-emerald-500/40 mb-4" />
        <h3 className="font-bold text-lg mb-2">Sem movimentações</h3>
        <p className="text-sm text-muted-foreground">Os dados serão registrados automaticamente via N8N.</p>
      </CardContent></Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {moves.map(m => (
        <motion.div key={m.id} variants={fadeUp} initial="hidden" animate="show">
          <MoveCard move={m} onDelete={deleteMove} />
        </motion.div>
      ))}
    </motion.div>
  );
}
