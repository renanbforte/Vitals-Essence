// ============================================================================
// EditInvestmentDialog (Janela de Editar Investimento)
// Janela (modal) que permite alterar os dados de um investimento ja existente:
// nome, tipo, objetivo, valores atuais, meta e configuracao de aporte recorrente.
// Ao salvar, envia as mudancas para quem chamou o componente.
// ============================================================================
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, Target, RefreshCw, Landmark, ShieldCheck } from 'lucide-react';
import { INDEXERS, type Indexer, type MarketRates } from '@/lib/fixedIncome';
import { FixedIncomeRates } from './FixedIncomeRates';
import type { TaxType } from '@/lib/projection';
import type { Investment, InvestmentInput } from '@/hooks/useInvestments';

// Tipos de IR oferecidos (rótulos amigáveis).
const IR_TYPES: { value: TaxType; label: string }[] = [
  { value: 'renda_fixa', label: 'Renda fixa (IR regressivo 22,5%→15%)' },
  { value: 'isento', label: 'Isento (LCI, LCA, poupança, debênture incentivada)' },
  { value: 'acoes_fii', label: 'Ações / FII (15%)' },
];

interface EditInvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment;
  onSubmit: (id: string, updates: Partial<InvestmentInput>) => Promise<void>;
  investmentTypes: string[];
  objectives: string[];
  // Taxas de mercado (CDI/IPCA) para o preview do rendimento calculado.
  marketRates?: MarketRates;
}

// Tipos de meta que o usuario pode escolher para o investimento. Cada opcao tem
// um rotulo, uma descricao explicativa e a unidade exibida (R$, %, R$/mes, etc.).
const TARGET_MODES = [
  { value: 'total', label: 'Valor total', description: 'Meta de patrimônio acumulado', unit: 'R$' },
  { value: 'fixed_monthly', label: 'Valor fixo / mês', description: 'Quanto aportar por mês', unit: 'R$/mês' },
  { value: 'fixed_yearly', label: 'Valor fixo / ano', description: 'Quanto aportar por ano', unit: 'R$/ano' },
  { value: 'pct_monthly', label: '% ao mês', description: 'Rendimento mensal esperado', unit: '%' },
  { value: 'pct_yearly', label: '% ao ano', description: 'Rendimento anual esperado', unit: '%' },
];

export function EditInvestmentDialog({ open, onOpenChange, investment, onSubmit, investmentTypes, objectives, marketRates }: EditInvestmentDialogProps) {
  // Cada estado abaixo guarda o valor atual de um campo do formulario:
  const [name, setName] = useState(''); // Nome do investimento
  const [investmentType, setInvestmentType] = useState(''); // Tipo (ex: renda fixa)
  const [objective, setObjective] = useState(''); // Objetivo/finalidade
  const [currentValue, setCurrentValue] = useState(''); // Lucro/rendimento acumulado
  const [operatingCapital, setOperatingCapital] = useState(''); // Capital usado para operar
  const [targetValue, setTargetValue] = useState(''); // Valor da meta
  const [targetMode, setTargetMode] = useState('total'); // Tipo de meta selecionado
  const [trackingMode, setTrackingMode] = useState('cumulative'); // Como o valor e atualizado
  const [isRecurring, setIsRecurring] = useState(false); // Se ha aporte recorrente
  const [recurringAmount, setRecurringAmount] = useState(''); // Valor do aporte recorrente
  const [recurrenceType, setRecurrenceType] = useState('months'); // Frequencia do aporte
  const [recurringTermMode, setRecurringTermMode] = useState<'open' | 'fixed'>('open'); // prazo do aporte
  const [recurringMonths, setRecurringMonths] = useState('12');
  const [submitting, setSubmitting] = useState(false); // Se esta salvando no momento
  // Renda fixa detalhada.
  const [isFixedIncome, setIsFixedIncome] = useState(false);
  const [institution, setInstitution] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const [indexer, setIndexer] = useState<Indexer>('cdi_percent');
  const [indexerValue, setIndexerValue] = useState('100');
  const [liquidity, setLiquidity] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [fgc, setFgc] = useState(false);
  const [irType, setIrType] = useState<TaxType>('renda_fixa');

  // Quando a janela abre, preenche todos os campos com os dados atuais do
  // investimento recebido (para o usuario editar a partir do que ja existe).
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
      setRecurringTermMode(investment.recurring_months != null ? 'fixed' : 'open');
      setRecurringMonths(investment.recurring_months != null ? String(investment.recurring_months) : '12');
      // Renda fixa: liga o modo se já há indexador definido.
      setIsFixedIncome(!!investment.indexer && investment.indexer !== 'none');
      setInstitution(investment.institution || '');
      setAssetClass(investment.asset_class || '');
      setIndexer(((investment.indexer && investment.indexer !== 'none') ? investment.indexer : 'cdi_percent') as Indexer);
      setIndexerValue(String(investment.indexer_value || 100));
      setLiquidity(investment.liquidity || '');
      setMaturityDate(investment.maturity_date || '');
      setFgc(investment.fgc || false);
      setIrType((investment.ir_type || 'renda_fixa') as TaxType);
    }
  }, [open, investment]);

  // Encontra os detalhes (descricao e unidade) do tipo de meta escolhido.
  const selectedMode = TARGET_MODES.find(m => m.value === targetMode)!;

  // Salva as alteracoes: valida o nome, converte textos em numeros e envia
  // as mudancas para quem chamou; ao terminar, fecha a janela.
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
      recurring_months: isRecurring && recurringTermMode === 'fixed' ? (parseInt(recurringMonths) || null) : null,
      // Renda fixa detalhada (desliga para 'none' quando o modo está off).
      institution: isFixedIncome ? (institution.trim() || null) : null,
      asset_class: isFixedIncome ? (assetClass.trim() || null) : null,
      indexer: isFixedIncome ? indexer : 'none',
      indexer_value: isFixedIncome ? (parseFloat(indexerValue) || 0) : 0,
      liquidity: isFixedIncome ? (liquidity.trim() || null) : null,
      maturity_date: isFixedIncome && maturityDate ? maturityDate : null,
      fgc: isFixedIncome ? fgc : false,
      ir_type: isFixedIncome ? irType : 'renda_fixa',
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

          {/* Renda fixa detalhada */}
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                <Landmark className="w-4 h-4" />
                Renda fixa detalhada
              </div>
              <Switch checked={isFixedIncome} onCheckedChange={setIsFixedIncome} />
            </div>
            {isFixedIncome && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Instituição / Banco</Label>
                    <Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Ex: Itaú Unibanco" />
                  </div>
                  <div>
                    <Label className="text-xs">Classe de ativo</Label>
                    <Input value={assetClass} onChange={e => setAssetClass(e.target.value)} placeholder="Ex: Renda Fixa Pós-Fixada" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Indexador</Label>
                    <Select value={indexer} onValueChange={v => setIndexer(v as Indexer)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INDEXERS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{INDEXERS.find(i => i.value === indexer)?.unit || 'valor'}</Label>
                    <Input
                      type="number" step="0.01" value={indexerValue}
                      onChange={e => setIndexerValue(e.target.value)}
                      disabled={!INDEXERS.find(i => i.value === indexer)?.needsValue}
                      placeholder="Ex: 100"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Tributação (IR)</Label>
                  <Select value={irType} onValueChange={v => setIrType(v as TaxType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {IR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Liquidez / Resgate</Label>
                    <Input value={liquidity} onChange={e => setLiquidity(e.target.value)} placeholder="Ex: Diária" />
                  </div>
                  <div>
                    <Label className="text-xs">Vencimento</Label>
                    <Input type="date" value={maturityDate} onChange={e => setMaturityDate(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-500/10 p-2.5">
                  <span className="text-xs font-medium flex items-center gap-1.5 text-amber-700">
                    <ShieldCheck className="w-4 h-4" /> Garantia FGC (até R$ 250 mil)
                  </span>
                  <Switch checked={fgc} onCheckedChange={setFgc} />
                </div>
                {marketRates && (
                  <FixedIncomeRates
                    indexer={indexer}
                    indexerValue={parseFloat(indexerValue) || 0}
                    irType={irType}
                    rates={marketRates}
                    maturityDate={maturityDate || null}
                  />
                )}
              </>
            )}
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
            {isRecurring && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Por quanto tempo vou aportar?</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecurringTermMode('open')}
                    className={`rounded-lg border p-2 text-xs font-semibold transition-all ${recurringTermMode === 'open' ? 'border-[hsl(var(--finance))] bg-[hsl(var(--finance))]/10 text-[hsl(var(--finance))]' : 'border-border text-muted-foreground'}`}
                  >
                    Até o vencimento / sem prazo
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringTermMode('fixed')}
                    className={`rounded-lg border p-2 text-xs font-semibold transition-all ${recurringTermMode === 'fixed' ? 'border-[hsl(var(--finance))] bg-[hsl(var(--finance))]/10 text-[hsl(var(--finance))]' : 'border-border text-muted-foreground'}`}
                  >
                    Por um nº de meses
                  </button>
                </div>
                {recurringTermMode === 'fixed' && (
                  <div className="relative">
                    <Input type="number" min="1" step="1" value={recurringMonths} onChange={e => setRecurringMonths(e.target.value)} placeholder="Ex: 12" className="pr-14" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">meses</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Alterar aqui recria os aportes no Fluxo para bater com o novo prazo/valor.
                </p>
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
