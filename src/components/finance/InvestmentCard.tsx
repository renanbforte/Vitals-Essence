import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, GripVertical, TrendingUp, Target, RefreshCw, Pencil } from 'lucide-react';
import { AddValueDialog } from './AddValueDialog';
import { EditInvestmentDialog } from './EditInvestmentDialog';
import type { Investment, InvestmentInput } from '@/hooks/useInvestments';

interface InvestmentCardProps {
  investment: Investment;
  index: number;
  onAddValue: (id: string, amount: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<InvestmentInput>) => Promise<void>;
  investmentTypes: string[];
  objectives: string[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InvestmentCard({ investment, index, onAddValue, onDelete, onUpdate, investmentTypes, objectives }: InvestmentCardProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPercentageTarget = investment.target_mode === 'pct_monthly' || investment.target_mode === 'pct_yearly';
  const isMonthlyOrYearlyFixed = investment.target_mode === 'fixed_monthly' || investment.target_mode === 'fixed_yearly';
  
  const operatingCap = Number(investment.operating_capital) || 0;
  const currentVal = Number(investment.current_value);
  
  // For % targets: achieved % = (current_value / operating_capital) * 100
  const achievedPct = isPercentageTarget && operatingCap > 0
    ? (currentVal / operatingCap) * 100
    : 0;
  const pctProgress = isPercentageTarget && investment.target_value > 0
    ? Math.min(100, (achievedPct / Number(investment.target_value)) * 100)
    : 0;

  const progress = investment.target_value > 0 && !isPercentageTarget
    ? Math.min(100, (currentVal / Number(investment.target_value)) * 100)
    : 0;

  const typeColors: Record<string, string> = {
    'Renda Fixa': 'bg-blue-500/15 text-blue-700',
    'Ações': 'bg-violet-500/15 text-violet-700',
    'FII': 'bg-amber-500/15 text-amber-700',
    'Criptomoeda': 'bg-orange-500/15 text-orange-700',
    'Tesouro Direto': 'bg-emerald-500/15 text-emerald-700',
    'Poupança': 'bg-sky-500/15 text-sky-700',
    'Previdência': 'bg-indigo-500/15 text-indigo-700',
  };

  return (
    <>
      <Card className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-muted-foreground/40 cursor-grab">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground/60 tabular-nums">#{index + 1}</span>
                    <h4 className="font-bold text-foreground truncate">{investment.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {investment.investment_type && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[investment.investment_type] || 'bg-muted text-muted-foreground'}`}>
                        {investment.investment_type}
                      </span>
                    )}
                    {investment.objective && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {investment.objective}
                      </span>
                    )}
                    {investment.is_recurring_contribution && investment.recurring_amount && (
                      <span className="text-[10px] text-[hsl(var(--finance))] flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        {formatCurrency(Number(investment.recurring_amount))}/mês
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Capital operacional */}
              {operatingCap > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                  <p className="text-xs text-muted-foreground">Capital operacional</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {formatCurrency(operatingCap)}
                  </p>
                </div>
              )}

              {/* Percentage target view */}
              {isPercentageTarget ? (
                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Rendimento acumulado</p>
                      <p className="text-xl font-bold text-[hsl(var(--finance))] tabular-nums">
                        {formatCurrency(currentVal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Meta {investment.target_mode === 'pct_monthly' ? '/ mês' : '/ ano'}</p>
                      <p className="text-sm font-semibold text-foreground tabular-nums">
                        {Number(investment.target_value).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  {operatingCap > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Alcançado</span>
                        <span className={`font-bold tabular-nums ${achievedPct >= Number(investment.target_value) ? 'text-emerald-600' : 'text-[hsl(var(--finance))]'}`}>
                          {achievedPct.toFixed(2)}% de {Number(investment.target_value).toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={pctProgress} className="h-2 bg-muted" />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Regular value view */}
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {isMonthlyOrYearlyFixed ? 'Progresso da meta' : 'Valor atual'}
                      </p>
                      <p className="text-xl font-bold text-[hsl(var(--finance))] tabular-nums">
                        {formatCurrency(currentVal)}
                      </p>
                    </div>
                    {investment.target_value > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Meta{isMonthlyOrYearlyFixed ? '/mês' : ''}</p>
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(Number(investment.target_value))}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {investment.target_value > 0 && (
                    <div className="space-y-1">
                      <Progress value={progress} className="h-2 bg-muted" />
                      <p className="text-[10px] text-muted-foreground text-right tabular-nums">{progress.toFixed(1)}%</p>
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs gap-1.5 border-[hsl(var(--finance))]/30 text-[hsl(var(--finance))] hover:bg-[hsl(var(--finance))]/10"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {investment.tracking_mode === 'cumulative' ? 'Adicionar Aporte' : 'Atualizar Valor'}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-[hsl(var(--finance))]" onClick={() => setEditOpen(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {confirmDelete ? (
                  <div className="flex gap-1">
                    <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => onDelete(investment.id)}>
                      Excluir
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setConfirmDelete(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddValueDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        investmentName={investment.name}
        trackingMode={investment.tracking_mode}
        onSubmit={(amount) => onAddValue(investment.id, amount)}
      />

      <EditInvestmentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        investment={investment}
        onSubmit={onUpdate}
        investmentTypes={investmentTypes}
        objectives={objectives}
      />
    </>
  );
}
