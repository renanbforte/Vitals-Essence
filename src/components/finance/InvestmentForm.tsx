import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Target, RefreshCw, Globe, RotateCw } from 'lucide-react';
import { fetchExchangeRate, FOREIGN_CURRENCIES, currencySymbol } from '@/lib/exchange';
import { formatCurrency } from '@/lib/finance';
import type { InvestmentInput } from '@/hooks/useInvestments';

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: InvestmentInput) => Promise<void>;
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

export function InvestmentForm({ open, onOpenChange, onSubmit, investmentTypes, objectives }: InvestmentFormProps) {
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
  const [isSimulated, setIsSimulated] = useState(false); // true = simulação (planejamento)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // data de início (quando real)
  // Moeda estrangeira: se está ativo, qual moeda, o valor nela e a cotação do dia.
  const [isForeign, setIsForeign] = useState(false);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [foreignAmount, setForeignAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [fetchingRate, setFetchingRate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Busca a cotação do dia da moeda escolhida (preenche o campo, que fica editável).
  const loadRate = async (code: string) => {
    setFetchingRate(true);
    const rate = await fetchExchangeRate(code);
    if (rate) setExchangeRate(rate.toFixed(4));
    setFetchingRate(false);
  };

  // Ao ativar moeda estrangeira ou trocar de moeda, busca a cotação automaticamente.
  useEffect(() => {
    if (isForeign) loadRate(currencyCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForeign, currencyCode]);

  // Valor convertido em reais (valor na moeda × cotação), para mostrar e salvar.
  const convertedBRL = (parseFloat(foreignAmount) || 0) * (parseFloat(exchangeRate) || 0);

  const selectedMode = TARGET_MODES.find(m => m.value === targetMode)!;

  const reset = () => {
    setName('');
    setInvestmentType('');
    setObjective('');
    setCurrentValue('');
    setOperatingCapital('');
    setTargetValue('');
    setTargetMode('total');
    setTrackingMode('cumulative');
    setIsRecurring(false);
    setRecurringAmount('');
    setRecurrenceType('months');
    setIsSimulated(false);
    setStartDate(new Date().toISOString().split('T')[0]);
    setIsForeign(false);
    setCurrencyCode('USD');
    setForeignAmount('');
    setExchangeRate('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    // Em moeda estrangeira, o capital investido (em BRL) é o valor convertido.
    const operatingCapitalValue = isForeign
      ? convertedBRL
      : (operatingCapital ? parseFloat(operatingCapital) : 0);
    await onSubmit({
      name: name.trim(),
      investment_type: investmentType || null,
      objective: objective || null,
      current_value: currentValue ? parseFloat(currentValue) : 0,
      operating_capital: operatingCapitalValue,
      target_value: targetValue ? parseFloat(targetValue) : 0,
      target_mode: targetMode,
      tracking_mode: trackingMode,
      is_recurring_contribution: isRecurring,
      recurring_amount: recurringAmount ? parseFloat(recurringAmount) : null,
      recurrence_type: isRecurring ? recurrenceType : null,
      is_simulated: isSimulated,
      // Data de início só faz sentido para investimento real (não simulação).
      start_date: isSimulated ? null : startDate,
      // Moeda estrangeira: guarda moeda, valor na moeda e cotação usada.
      currency: isForeign ? currencyCode : 'BRL',
      foreign_amount: isForeign ? (parseFloat(foreignAmount) || 0) : null,
      exchange_rate: isForeign ? (parseFloat(exchangeRate) || 0) : null,
    });
    reset();
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Investimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Real x Simulação */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsSimulated(false)}
              className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                !isSimulated ? 'border-[hsl(var(--finance))] bg-[hsl(var(--finance))]/10 text-[hsl(var(--finance))]' : 'border-border text-muted-foreground'
              }`}
            >
              💰 Investimento real
            </button>
            <button
              type="button"
              onClick={() => setIsSimulated(true)}
              className={`rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                isSimulated ? 'border-violet-500 bg-violet-500/10 text-violet-600' : 'border-border text-muted-foreground'
              }`}
            >
              🔮 Simulação
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-3">
            {isSimulated
              ? 'Planejamento: não entra no patrimônio nem gera lançamentos. Você pode torná-lo real depois.'
              : 'Real: entra no seu patrimônio. Com aporte recorrente, agenda as saídas no seu fluxo.'}
          </p>

          {/* Basic info */}
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

          {/* Moeda estrangeira */}
          <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-600">
                <Globe className="w-4 h-4" />
                Compra em moeda estrangeira
              </div>
              <Switch checked={isForeign} onCheckedChange={setIsForeign} />
            </div>
            {isForeign && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Moeda</Label>
                    <Select value={currencyCode} onValueChange={setCurrencyCode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FOREIGN_CURRENCIES.map(c => (
                          <SelectItem key={c.code} value={c.code}>{c.symbol} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor em {currencySymbol(currencyCode)}</Label>
                    <Input type="number" min="0" step="0.01" value={foreignAmount} onChange={e => setForeignAmount(e.target.value)} placeholder="0,00" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs flex items-center justify-between">
                    <span>Cotação do dia (R$ por {currencySymbol(currencyCode)})</span>
                    <button type="button" onClick={() => loadRate(currencyCode)} className="text-sky-600 flex items-center gap-1 text-[10px] font-medium">
                      <RotateCw className={`w-3 h-3 ${fetchingRate ? 'animate-spin' : ''}`} /> atualizar
                    </button>
                  </Label>
                  <Input type="number" min="0" step="0.0001" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} placeholder={fetchingRate ? 'buscando...' : '0,0000'} />
                  <p className="text-[10px] text-muted-foreground mt-1">Buscada automaticamente — você pode ajustar.</p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-sky-500/10 p-2.5">
                  <span className="text-xs text-muted-foreground">Equivale a</span>
                  <span className="text-sm font-bold text-sky-700 tabular-nums">{formatCurrency(convertedBRL)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  A saída registrada no fluxo será em reais, pela cotação informada.
                </p>
              </>
            )}
          </div>

          {/* Current value section */}
          <div className="p-3 rounded-xl bg-[hsl(var(--finance))]/5 border border-[hsl(var(--finance))]/20 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--finance))]">
              <Wallet className="w-4 h-4" />
              Valores atuais
            </div>
            {/* Em moeda estrangeira o capital vem da conversão; não mostra o campo manual */}
            {!isForeign && (
              <div>
                <Label className="text-xs text-muted-foreground">Capital operacional (usado para operar)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={operatingCapital}
                  onChange={e => setOperatingCapital(e.target.value)}
                  placeholder="0,00"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Valor que você usa para operar. Não conta na meta.
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Lucro/rendimento acumulado</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={currentValue}
                onChange={e => setCurrentValue(e.target.value)}
                placeholder="0,00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Progresso atual em direção à sua meta.
              </p>
            </div>
          </div>

          {/* Target section - flexible */}
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

          {/* Tracking mode */}
          <div>
            <Label>Como atualizar o valor?</Label>
            <Select value={trackingMode} onValueChange={setTrackingMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cumulative">Somar aportes ao valor atual</SelectItem>
                <SelectItem value="real">Substituir pelo valor atualizado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {trackingMode === 'cumulative'
                ? 'Cada novo aporte será somado ao total.'
                : 'Você informará o valor real atualizado (ex: extrato do banco).'}
            </p>
          </div>

          {/* Recurring */}
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

            {/* Data de início: só quando é real e tem aporte recorrente (agenda as saídas) */}
            {isRecurring && !isSimulated && (
              <div>
                <Label>Data do primeiro aporte</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <p className="text-[10px] text-muted-foreground mt-1">
                  A partir desta data, cada aporte vira uma saída pendente no seu fluxo.
                </p>
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={!name.trim() || submitting} className="w-full gradient-finance text-white">
            {submitting ? 'Salvando...' : 'Criar Investimento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
