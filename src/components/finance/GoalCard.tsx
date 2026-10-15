// ============================================================================
// GoalCard (Cartão de Meta Financeira)
// ----------------------------------------------------------------------------
// Mostra uma meta: nome, barra de progresso (quanto já foi alcançado), quanto
// falta e — quando há aporte e taxa definidos — a data estimada de conclusão
// calculada por juros compostos ("no seu ritmo, você chega em mai/28").
// Também avisa se a estimativa passa do prazo desejado da meta.
// ============================================================================
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Pencil, Trash2, CalendarClock, Wallet } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { annualToMonthlyRate, monthsToReachTarget, addMonthsToToday } from '@/lib/projection';
import type { FinancialGoal } from '@/hooks/useFinancialGoals';

// Formata um número como moeda brasileira (ex.: 1500 vira "R$ 1.500,00").
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface GoalCardProps {
  goal: FinancialGoal;
  // Patrimônio investido total — usado quando a meta acompanha a carteira.
  portfolioTotal: number;
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (id: string) => void;
  onToggleCompleted: (id: string, completed: boolean) => void;
}

export function GoalCard({ goal, portfolioTotal, onEdit, onDelete, onToggleCompleted }: GoalCardProps) {
  // Valor atual da meta: o patrimônio da carteira (se vinculada) ou o valor manual.
  const current = goal.linked_to_portfolio ? portfolioTotal : Number(goal.current_amount);
  const target = Number(goal.target_amount);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const remaining = Math.max(0, target - current);

  // Estimativa de conclusão por juros compostos, no ritmo configurado na meta.
  const eta = useMemo(() => {
    if (goal.completed || remaining <= 0) return null;
    const months = monthsToReachTarget({
      principal: current,
      monthlyContribution: Number(goal.monthly_contribution),
      monthlyRate: annualToMonthlyRate(Number(goal.annual_rate)),
      target,
    });
    if (months === null) return null;
    return { months, date: addMonthsToToday(months) };
  }, [goal, current, target, remaining]);

  // Se há prazo desejado E estimativa, verifica se a estimativa estoura o prazo.
  const lateForDeadline = useMemo(() => {
    if (!eta || !goal.deadline) return false;
    return isBefore(parseISO(goal.deadline), eta.date);
  }, [eta, goal.deadline]);

  return (
    <Card className={`border-[hsl(var(--finance))]/20 ${goal.completed ? 'opacity-70' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Linha de cima: concluir, nome e ações */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleCompleted(goal.id, goal.completed)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all border-2 ${
              goal.completed
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600'
                : 'bg-[hsl(var(--finance))]/10 border-[hsl(var(--finance))]/20 text-[hsl(var(--finance))]'
            }`}
            aria-label={goal.completed ? 'Reabrir meta' : 'Concluir meta'}
          >
            <Check className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${goal.completed ? 'line-through' : ''}`}>{goal.title}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              {goal.linked_to_portfolio && <Wallet className="w-3 h-3" />}
              {goal.linked_to_portfolio ? 'Acompanha o patrimônio' : 'Valor próprio da meta'}
              {goal.deadline && ` · até ${format(parseISO(goal.deadline), 'MMM/yy', { locale: ptBR })}`}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => onEdit(goal)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => onDelete(goal.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Progresso: barra, valores e quanto falta */}
        <div className="space-y-1.5">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold tabular-nums text-[hsl(var(--finance))]">
              {formatCurrency(current)} <span className="text-muted-foreground font-normal">de {formatCurrency(target)}</span>
            </span>
            <span className="text-muted-foreground tabular-nums">{progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Estimativa de conclusão por juros compostos (quando dá para calcular) */}
        {!goal.completed && remaining > 0 && (
          <div className={`rounded-xl px-3 py-2 text-[11px] flex items-center gap-2 ${
            lateForDeadline ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-[hsl(var(--finance-light))] text-[hsl(var(--finance))]'
          }`}>
            <CalendarClock className="w-3.5 h-3.5 shrink-0" />
            {eta ? (
              <span>
                Faltam {formatCurrency(remaining)} — no seu ritmo, você chega em{' '}
                <strong>{format(eta.date, 'MMM/yyyy', { locale: ptBR })}</strong>
                {' '}({eta.months} {eta.months === 1 ? 'mês' : 'meses'})
                {lateForDeadline && ' — depois do prazo desejado'}
              </span>
            ) : (
              <span>
                Faltam {formatCurrency(remaining)}. Defina um aporte mensal (e a taxa esperada) para estimar a data de conclusão.
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
