import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Target, RefreshCw } from 'lucide-react';
import type { Investment, InvestmentInput } from '@/hooks/useInvestments';

interface EditInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment;
  onSubmit: (id: string, updates: Partial<InvestmentInput>) => Promise<void>;
  investmentTypes: string[];
  objectives: string[];
}

const TARGET_MODES = [
  { value: 'total', label: 'Valor total', description: 'Meta de patrimônio acumulado', unit: 'R$' },
  { value: 'fixed_monthly', label: 'Valor fixo / mês', description: 'Quanto aportar por mês', unit: 'R$/mês' },
  { value: 'fixed_yearly', label: 'Valor fixo / ano', description: 'Quanto aportar por ano', unit: 'R$/ano' },
  { value: 'pct_monthly', label: '% ao mês', description: 'Rendimento mensal esperado', unit: '%' },
  { value: 'pct_yearly', label: '% ao ano', description: 'Rendimento anual esperado', unit: '%' },
];

export function EditInvestmentDialog({ open, onOpenChange, investment, onSubmit, investmentTypes, objectives }: EditInvestmentDialogProps) {
  const [name, setName] = useState('');
  const [investmentType, setInvestmentType] = useState('');
  const [objective, setObjective] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [operatingCapital, setOperatingCapital] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetMode, setTargetMode] = useState('total');
  const [trackingMode, setTrackingMode] = useState('cumulative');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurrenceType, setRecurrenceType] = useState('months');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && investment) {
      setName(investment.name);
      setInvestmentType(investment.investment_type || '');
      setObjective(investment.objective || '');
      setCurrentValue(String(investment.current_value || 0));
      setOperatingCapital(String(investment.operating_capital || 0));
      setTargetValue(String(investment.target_value || 0));
      setTargetMode(investment.target_mode || 'total');
      setTrackingMode(investment.tracking_mode || 'cumulative');
      setIsRecurring(investment.is_recurring_contribution || false);
      setRecurringAmount(investment.recurring_amount ? String(investment.recurring_amount) : '');
      setRecurrenceType(investment.recurrence_type || 'months');
    }
  }, [open, investment]);

  const selectedMode = TARGET_MODES.find(m => m.value === targetMode)!;

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(investment.id, {
      name: name.trim(),
      investment_type: investmentType || null,
      objective: objective || null,
      current_value: currentValue ? parseFloat(currentValue) : 0,
      operating_capital: operatingCapital ? parseFloat(operatingCapital) : 0,
      target_value: targetValue ? parseFloat(targetValue) : 0,
      target_mode: targetMode,
      tracking_mode: trackingMode,
      is_recurring_contribution: isRecurring,
      recurring_amount: recurringAmount ? parseFloat(recurringAmount) : null,
      recurrence_type: isRecurring ? recurrenceType : null,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Investimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-3">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tesouro Selic 2029" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={investmentType} onValueChange={setInvestmentType}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {investmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Objetivo</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {objectives.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[hsl(var(--finance))]/5 border border-[hsl(var(--finance))]/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--finance))]">
              <Wallet className="w-4 h-4" />
              Valores atuais
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Capital operacional (usado para operar)</Label>
              <Input type="number" min="0" step="0.01" value={operatingCapital} onChange={e => setOperatingCapital(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Lucro/rendimento acumulado</Label>
              <Input type="number" min="0" step="0.01" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="0,00" />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
              <Target className="w-4 h-4" />
              Qual é a minha meta?
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Tipo de meta</Label>
              <RadioGroup value={targetMode} onValueChange={setTargetMode} className="grid grid-cols-2 gap-2">
                {TARGET_MODES.map(m => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-xs ${
                      targetMode === m.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 font-medium'
                        : 'border-border hover:border-amber-500/40'
                    }`}
                  >
                    <RadioGroupItem value={m.value} className="sr-only" />
                    <span>{m.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{selectedMode.description}</Label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  min="0"
                  step={selectedMode.unit === '%' ? '0.01' : '1'}
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  placeholder="0"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  {selectedMode.unit}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label>Como atualizar o valor?</Label>
            <Select value={trackingMode} onValueChange={setTrackingMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cumulative">Somar aportes ao valor atual</SelectItem>
                <SelectItem value="real">Substituir pelo valor atualizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                <Label className="mb-0">Aporte recorrente?</Label>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={recurringAmount} onChange={e => setRecurringAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label>Frequência</Label>
                  <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">Mensal</SelectItem>
                      <SelectItem value="weeks">Semanal</SelectItem>
                      <SelectItem value="years">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={!name.trim() || submitting} className="w-full gradient-finance text-white">
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
