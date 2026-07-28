import { motion } from 'framer-motion';
import { Settings2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCryptoStrategies, type CryptoStrategy } from '@/hooks/useCryptoStrategies';
import { useState } from 'react';

function StrategyCard({ s, onDelete }: { s: CryptoStrategy; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden border-blue-500/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{s.coin} <span className="text-muted-foreground text-xs font-normal">• {s.strategy_name}</span></p>
              <p className="text-xs text-muted-foreground">
                {s.position_type ?? 'N/A'} • Alav. {s.leverage ?? '—'}x • {s.exchange}
              </p>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <p><span className="text-muted-foreground">Código:</span> {s.access_code ?? '—'}</p>
              <p><span className="text-muted-foreground">TP Setting:</span> {s.take_profit_setting ?? '—'}</p>
              <p><span className="text-muted-foreground">Long 1st:</span> {s.long_1st_order_size ?? '—'}</p>
              <p><span className="text-muted-foreground">Short 1st:</span> {s.short_1st_order_size ?? '—'}</p>
              <p><span className="text-muted-foreground">Long Layers:</span> {s.long_order_layers ?? '—'}</p>
              <p><span className="text-muted-foreground">Short Layers:</span> {s.short_order_layers ?? '—'}</p>
              <p><span className="text-muted-foreground">Long TP:</span> {s.long_tp_ratio ?? '—'}</p>
              <p><span className="text-muted-foreground">Short TP:</span> {s.short_tp_ratio ?? '—'}</p>
              <p><span className="text-muted-foreground">Stop Loss:</span> {s.stop_loss_per_coin ?? '—'}</p>
              <p><span className="text-muted-foreground">Long Double:</span> {s.long_double_1st_order ? 'Sim' : 'Não'}</p>
              <p><span className="text-muted-foreground">Short Double:</span> {s.short_double_1st_order ? 'Sim' : 'Não'}</p>
            </div>
            {s.long_next_order_ratios && s.long_next_order_ratios.length > 0 && (
              <p><span className="text-muted-foreground">Long Ratios:</span> {s.long_next_order_ratios.join(', ')}</p>
            )}
            {s.short_next_order_ratios && s.short_next_order_ratios.length > 0 && (
              <p><span className="text-muted-foreground">Short Ratios:</span> {s.short_next_order_ratios.join(', ')}</p>
            )}
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="text-xs h-8 gap-1 text-destructive" onClick={() => onDelete(s.id)}>
                <Trash2 className="w-3 h-3" /> Excluir
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CryptoStrategiesSubTab() {
  const { strategies, loading, deleteStrategy } = useCryptoStrategies();

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>;

  if (strategies.length === 0) {
    return (
      <Card><CardContent className="p-8 text-center">
        <Settings2 className="w-12 h-12 mx-auto text-blue-500/40 mb-4" />
        <h3 className="font-bold text-lg mb-2">Sem metodologias</h3>
        <p className="text-sm text-muted-foreground">Os dados serão registrados automaticamente via N8N.</p>
      </CardContent></Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
      {strategies.map(s => (
        <StrategyCard key={s.id} s={s} onDelete={deleteStrategy} />
      ))}
    </motion.div>
  );
}
