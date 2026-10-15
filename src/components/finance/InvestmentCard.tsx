// ============================================================================
// CARTÃO DE INVESTIMENTO
// Mostra um investimento individual da lista: nome, tipo, objetivo, valor atual,
// meta e barra de progresso. Traz botões para adicionar aporte/atualizar valor,
// editar ou excluir. Adapta a exibição conforme a meta seja em valor (R$) ou em
// porcentagem de rendimento (% ao mês/ano).
// ============================================================================

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, Target, RefreshCw, Pencil, Sparkles, CheckCircle2, Globe } from 'lucide-react';
import { AddValueDialog } from './AddValueDialog';
import { EditInvestmentDialog } from './EditInvestmentDialog';
import { currencySymbol } from '@/lib/exchange';
import type { Investment, InvestmentInput } from '@/hooks/useInvestments';

// Dados que este componente recebe de fora:
// - investment: o investimento a exibir
// - index: posição na lista (usado para mostrar #1, #2, ...)
// - onAddValue / onDelete / onUpdate: ações de adicionar valor, excluir e editar
// - investmentTypes / objectives: listas de opções para o formulário de edição
interface InvestmentCardProps {
  investment: Investment;
  index: number;
  onAddValue: (id: string, amount: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<InvestmentInput>) => Promise<void>;
  // Promove uma simulação a investimento real a partir da data informada.
  onMakeReal?: (inv: Investment, startDate: string) => Promise<void>;
  investmentTypes: string[];
  objectives: string[];
}

// Formata um número como dinheiro em Real brasileiro (ex: R$ 1.234,56)
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InvestmentCard({ investment, index, onAddValue, onDelete, onUpdate, onMakeReal, investmentTypes, objectives }: InvestmentCardProps) {
  // Controla se a janela de "adicionar valor/aporte" está aberta
  const [addOpen, setAddOpen] = useState(false);
  // Controla se a janela de "editar investimento" está aberta
  const [editOpen, setEditOpen] = useState(false);
  // Controla se está pedindo confirmação antes de excluir
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Janela de "tornar real" (pede a data de início) e a data escolhida
  const [makeRealOpen, setMakeRealOpen] = useState(false);
  const [makeRealDate, setMakeRealDate] = useState(new Date().toISOString().split('T')[0]);
  const [makingReal, setMakingReal] = useState(false);

  const isSimulated = investment.is_simulated;

  // A meta é definida em porcentagem de rendimento (% ao mês ou % ao ano)?
  const isPercentageTarget = investment.target_mode === 'pct_monthly' || investment.target_mode === 'pct_yearly';
  // A meta é um valor fixo a aportar por mês ou por ano?
  const isMonthlyOrYearlyFixed = investment.target_mode === 'fixed_monthly' || investment.target_mode === 'fixed_yearly';

  // Capital operacional: dinheiro usado para operar (base do cálculo de %)
  const operatingCap = Number(investment.operating_capital) || 0;
  // Valor atual: lucro/rendimento acumulado até agora
  const currentVal = Number(investment.current_value);

  // Para metas em %: rendimento alcançado = (valor atual / capital operacional) x 100
  const achievedPct = isPercentageTarget && operatingCap > 0
    ? (currentVal / operatingCap) * 100
    : 0;
  // Progresso em % rumo à meta de rendimento (limitado a no máximo 100%)
  const pctProgress = isPercentageTarget && investment.target_value > 0
    ? Math.min(100, (achievedPct / Number(investment.target_value)) * 100)
    : 0;

  // Progresso para metas em valor (R$): quanto do valor-alvo já foi atingido (máx. 100%)
  const progress = investment.target_value > 0 && !isPercentageTarget
    ? Math.min(100, (currentVal / Number(investment.target_value)) * 100)
    : 0;

  // Cor de fundo/texto do selo de cada tipo de investimento
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
      <Card className={`border shadow-sm hover:shadow-md transition-shadow ${isSimulated ? 'border-violet-500/30 border-dashed bg-violet-500/[0.03]' : 'border-border/50'}`}>
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
                    {isSimulated && (
                      <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-600 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> Simulação
                      </span>
                    )}
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
                    {investment.currency && investment.currency !== 'BRL' && investment.foreign_amount ? (
                      <span className="text-[10px] text-sky-600 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {currencySymbol(investment.currency)} {Number(investment.foreign_amount).toLocaleString('pt-BR')}
                        {investment.exchange_rate ? ` @ R$ ${Number(investment.exchange_rate).toFixed(4).replace('.', ',')}` : ''}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Capital operacional (só aparece se houver esse valor informado) */}
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

              {/* Botão de tornar real (só para simulações) */}
              {isSimulated && onMakeReal && (
                <Button
                  size="sm"
                  className="w-full h-9 text-xs gap-1.5 gradient-finance text-white font-bold"
                  onClick={() => setMakeRealOpen(true)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tornar real
                </Button>
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

      {/* Janela de "tornar real": pede a data de início e confirma */}
      <Dialog open={makeRealOpen} onOpenChange={setMakeRealOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--finance))]" />
              Tornar real
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              "{investment.name}" entra no seu patrimônio.
              {investment.is_recurring_contribution && investment.recurring_amount
                ? ` A partir da data escolhida, o aporte de ${formatCurrency(Number(investment.recurring_amount))}/mês vira uma saída pendente recorrente no seu fluxo.`
                : ' (Sem aporte recorrente definido — nada será agendado no fluxo.)'}
            </p>
            <div>
              <Label>Data de início</Label>
              <Input type="date" value={makeRealDate} onChange={e => setMakeRealDate(e.target.value)} />
            </div>
            <Button
              disabled={makingReal}
              onClick={async () => {
                setMakingReal(true);
                await onMakeReal?.(investment, makeRealDate);
                setMakingReal(false);
                setMakeRealOpen(false);
              }}
              className="w-full rounded-xl h-11 gradient-finance text-white font-bold gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {makingReal ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
