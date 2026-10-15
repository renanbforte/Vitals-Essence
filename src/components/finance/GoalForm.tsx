// ============================================================================
// GoalForm (Formulário de Meta Financeira)
// ----------------------------------------------------------------------------
// Janela (dialog) para criar ou editar uma meta financeira: nome, valor-alvo,
// prazo desejado (opcional), aporte mensal planejado, taxa esperada ao ano e a
// opção de acompanhar o patrimônio investido total em vez de um valor manual.
// ============================================================================
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { FinancialGoal, GoalInput } from '@/hooks/useFinancialGoals';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: GoalInput) => Promise<void>;
  // Quando preenchido, o formulário abre em modo edição com os campos da meta.
  editGoal?: FinancialGoal | null;
  onUpdate?: (id: string, updates: Partial<GoalInput>) => Promise<void>;
}

export function GoalForm({ open, onOpenChange, onSubmit, editGoal, onUpdate }: GoalFormProps) {
  // --- ESTADOS (campos do formulário) ---
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [annualRate, setAnnualRate] = useState('');
  const [linkedToPortfolio, setLinkedToPortfolio] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Ao abrir em modo edição, preenche os campos com os valores da meta.
  useEffect(() => {
    if (open && editGoal) {
      setTitle(editGoal.title);
      setTargetAmount(String(editGoal.target_amount));
      setCurrentAmount(String(editGoal.current_amount));
      setDeadline(editGoal.deadline || '');
      setMonthlyContribution(editGoal.monthly_contribution ? String(editGoal.monthly_contribution) : '');
      setAnnualRate(editGoal.annual_rate ? String(editGoal.annual_rate * 100) : '');
      setLinkedToPortfolio(editGoal.linked_to_portfolio);
    } else if (open) {
      reset();
    }
  }, [open, editGoal]);

  const reset = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setMonthlyContribution('');
    setAnnualRate('');
    setLinkedToPortfolio(false);
  };

  // Monta o objeto da meta e salva (criação ou edição).
  const handleSubmit = async () => {
    if (!title.trim() || !targetAmount) return;
    setSubmitting(true);
    const input: GoalInput = {
      title: title.trim(),
      target_amount: parseFloat(targetAmount) || 0,
      current_amount: currentAmount ? parseFloat(currentAmount) : 0,
      deadline: deadline || null,
      monthly_contribution: monthlyContribution ? parseFloat(monthlyContribution) : 0,
      // A taxa é digitada em % (ex.: 10) e salva como fração (0.10).
      annual_rate: annualRate ? (parseFloat(annualRate) || 0) / 100 : 0,
      linked_to_portfolio: linkedToPortfolio,
    };
    if (editGoal && onUpdate) {
      await onUpdate(editGoal.id, input);
    } else {
      await onSubmit(input);
    }
    reset();
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reserva de emergência" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor da meta (R$) *</Label>
              <Input type="number" inputMode="decimal" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="20000" />
            </div>
            <div>
              <Label>Prazo desejado</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>

          {/* Progresso: acompanhar o patrimônio total ou informar um valor manual */}
          <div className="rounded-xl border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Acompanhar patrimônio</Label>
                <p className="text-[10px] text-muted-foreground">O progresso usa o total investido na carteira</p>
              </div>
              <Switch checked={linkedToPortfolio} onCheckedChange={setLinkedToPortfolio} />
            </div>
            {!linkedToPortfolio && (
              <div>
                <Label>Quanto já tenho para essa meta (R$)</Label>
                <Input type="number" inputMode="decimal" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0" />
              </div>
            )}
          </div>

          {/* Parâmetros da projeção: aporte planejado e taxa esperada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Aporte mensal (R$)</Label>
              <Input type="number" inputMode="decimal" value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)} placeholder="500" />
            </div>
            <div>
              <Label>Rendimento (% a.a.)</Label>
              <Input type="number" inputMode="decimal" value={annualRate} onChange={e => setAnnualRate(e.target.value)} placeholder="10" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Com aporte e rendimento preenchidos, a meta mostra a data estimada de conclusão por juros compostos.
          </p>

          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !targetAmount || submitting}
            className="w-full rounded-xl h-11 gradient-finance text-white font-bold"
          >
            {submitting ? 'Salvando...' : editGoal ? 'Salvar alterações' : 'Criar meta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
