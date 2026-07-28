import { motion } from 'framer-motion';
import { DollarSign, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCryptoDeposits } from '@/hooks/useCryptoDeposits';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatBrl(v: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function formatUsd(v: number) { return `$ ${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export function CryptoDepositsSubTab() {
  const { deposits, loading, deleteDeposit, totalBrl, totalUsd, totalIa } = useCryptoDeposits();

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Summary */}
      {deposits.length > 0 && (
        <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Total BRL</p>
                <p className="text-base font-bold tabular-nums">{formatBrl(totalBrl)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Total USD</p>
                <p className="text-base font-bold tabular-nums">{formatUsd(totalUsd)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Total IA</p>
                <p className="text-base font-bold tabular-nums">{formatUsd(totalIa)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {deposits.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-green-500/40 mb-4" />
          <h3 className="font-bold text-lg mb-2">Sem aportes</h3>
          <p className="text-sm text-muted-foreground">Os dados serão registrados automaticamente via N8N.</p>
        </CardContent></Card>
      ) : (
        deposits.map(d => (
          <Card key={d.id} className="border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-500/15 text-green-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{format(new Date(d.date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}</p>
                    <p className="text-xs text-muted-foreground">{d.exchange}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="text-xs space-y-0.5">
                    {Number(d.added_brl) > 0 && <p className="font-medium tabular-nums">{formatBrl(Number(d.added_brl))}</p>}
                    {Number(d.added_usd) > 0 && <p className="font-medium tabular-nums">{formatUsd(Number(d.added_usd))}</p>}
                    {Number(d.added_ia) > 0 && <p className="font-medium tabular-nums text-purple-600">IA: {formatUsd(Number(d.added_ia))}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs h-8 text-destructive p-1" onClick={() => deleteDeposit(d.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </motion.div>
  );
}
