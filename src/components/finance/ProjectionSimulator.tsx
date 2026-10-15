// ============================================================================
// ProjectionSimulator (Simulador de Projeção)
// ----------------------------------------------------------------------------
// Simulador de juros compostos da aba Metas, agora coerente com a realidade
// brasileira: além do rendimento, considera o IMPOSTO DE RENDA no resgate
// conforme o tipo de investimento (renda fixa com tabela regressiva, isentos,
// ações/FII). Mostra o valor bruto, o IR estimado e o LÍQUIDO que de fato fica
// no bolso — mês a mês, com o aporte ajustável na hora.
// ============================================================================
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Table2, ChevronDown, Sparkles, Receipt } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { annualToMonthlyRate, projectWithTax, computeRedemption, type TaxType } from '@/lib/projection';
import { formatCurrency, formatCurrencyCompact } from '@/lib/finance';

// Horizontes de projeção oferecidos (em meses).
const HORIZONS = [
  { months: 12, label: '1 ano' },
  { months: 24, label: '2 anos' },
  { months: 60, label: '5 anos' },
  { months: 120, label: '10 anos' },
  { months: 240, label: '20 anos' },
];

// Tipos de investimento e como o IR incide em cada um.
const TAX_TYPES: { value: TaxType; label: string; hint: string }[] = [
  { value: 'renda_fixa', label: 'Renda fixa', hint: 'Tesouro, CDB, fundos DI — IR de 22,5% a 15% sobre o rendimento, caindo conforme o tempo (tabela regressiva).' },
  { value: 'isento', label: 'Isento', hint: 'LCI, LCA, poupança e debêntures incentivadas — sem Imposto de Renda no resgate.' },
  { value: 'acoes_fii', label: 'Ações / FII', hint: 'Ações e fundos imobiliários — 15% sobre o ganho (simplificado).' },
  { value: 'custom', label: 'Personalizado', hint: 'Defina você mesmo a alíquota de IR aplicada sobre o rendimento.' },
];

interface ProjectionSimulatorProps {
  // Patrimônio investido hoje (vem da carteira); usado como valor inicial padrão.
  defaultPrincipal: number;
}

export function ProjectionSimulator({ defaultPrincipal }: ProjectionSimulatorProps) {
  // --- ESTADOS (controles do simulador) ---
  const [principalText, setPrincipalText] = useState('');
  const [annualRateText, setAnnualRateText] = useState('10'); // taxa esperada, em % ao ano
  const [monthlyContribution, setMonthlyContribution] = useState(500); // aporte mensal simulado
  const [horizon, setHorizon] = useState(60); // horizonte em meses (padrão: 5 anos)
  const [taxType, setTaxType] = useState<TaxType>('renda_fixa'); // tributação do investimento
  const [customRateText, setCustomRateText] = useState('15'); // alíquota de IR personalizada (%)
  const [tableOpen, setTableOpen] = useState(false); // tabela mês a mês aberta/fechada

  // --- CÁLCULO (refeito na hora a cada ajuste) ---
  const principal = principalText !== '' ? (parseFloat(principalText) || 0) : defaultPrincipal;
  const annualRate = (parseFloat(annualRateText) || 0) / 100;
  const monthlyRate = annualToMonthlyRate(annualRate);
  const customRate = (parseFloat(customRateText) || 0) / 100;

  // Série mês a mês com bruto, líquido e o IR de cada mês (ponto 0 = hoje).
  const series = useMemo(
    () => projectWithTax({ principal, monthlyContribution, monthlyRate, months: horizon, taxType, customRate }),
    [principal, monthlyContribution, monthlyRate, horizon, taxType, customRate]
  );
  // Números do resgate no fim do horizonte (bruto, IR, líquido).
  const result = useMemo(
    () => computeRedemption({ principal, monthlyContribution, monthlyRate, months: horizon, taxType, customRate }),
    [principal, monthlyContribution, monthlyRate, horizon, taxType, customRate]
  );
  const netInterest = result.net - result.contributed; // rendimento líquido (já sem IR)
  const taxHint = TAX_TYPES.find(t => t.value === taxType)!.hint;

  // Rótulo de data para cada mês da projeção (ex.: "out/27").
  const monthLabel = (m: number) => format(addMonths(new Date(), m), 'MMM/yy', { locale: ptBR });

  return (
    <Card className="border-[hsl(var(--finance))]/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-xl gradient-finance flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          Simulador de Projeção
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Juros compostos já descontando o Imposto de Renda no resgate. Ajuste o aporte e veja o que realmente fica no bolso.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Controles: valor inicial e taxa esperada */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Valor inicial</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={principalText}
              onChange={e => setPrincipalText(e.target.value)}
              placeholder={formatCurrency(defaultPrincipal)}
            />
            {principalText === '' && (
              <p className="text-[10px] text-muted-foreground mt-1">Usando seu patrimônio atual</p>
            )}
          </div>
          <div>
            <Label className="text-xs">Rendimento esperado (% a.a.)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={annualRateText}
              onChange={e => setAnnualRateText(e.target.value)}
              placeholder="10"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              ≈ {(monthlyRate * 100).toFixed(2).replace('.', ',')}% ao mês
            </p>
          </div>
        </div>

        {/* Tipo de investimento (define como o IR incide) */}
        <div>
          <Label className="text-xs flex items-center gap-1.5 mb-1.5">
            <Receipt className="w-3.5 h-3.5" /> Tipo de investimento
          </Label>
          <div className="flex gap-2 flex-wrap">
            {TAX_TYPES.map(t => (
              <Button
                key={t.value}
                size="sm"
                variant={taxType === t.value ? 'default' : 'outline'}
                className={`rounded-xl h-8 text-xs ${taxType === t.value ? 'gradient-finance text-white border-0' : ''}`}
                onClick={() => setTaxType(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{taxHint}</p>

          {/* Campo de alíquota editável — só no modo Personalizado */}
          {taxType === 'custom' && (
            <div className="mt-3">
              <Label className="text-xs">Alíquota de IR (%)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={customRateText}
                onChange={e => setCustomRateText(e.target.value)}
                placeholder="15"
                className="max-w-[140px]"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Aplicada sobre o rendimento, igual em qualquer prazo de resgate.
              </p>
            </div>
          )}
        </div>

        {/* O BOTÃO DE APORTE: campo + slider que recalculam a curva na hora */}
        <div className="rounded-2xl bg-[hsl(var(--finance-light))] border border-[hsl(var(--finance))]/20 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-bold">Aporte mensal</Label>
            <Input
              type="number"
              inputMode="decimal"
              className="w-32 h-9 text-right font-bold tabular-nums"
              value={monthlyContribution}
              onChange={e => setMonthlyContribution(Math.max(0, parseFloat(e.target.value) || 0))}
            />
          </div>
          <Slider
            value={[Math.min(monthlyContribution, 10000)]}
            onValueChange={([v]) => setMonthlyContribution(v)}
            max={10000}
            step={50}
          />
          <p className="text-[10px] text-muted-foreground">
            Simule: quanto você colocaria por mês? Arraste ou digite um valor.
          </p>
        </div>

        {/* Horizonte: por quantos meses projetar */}
        <div className="flex gap-2 flex-wrap">
          {HORIZONS.map(h => (
            <Button
              key={h.months}
              size="sm"
              variant={horizon === h.months ? 'default' : 'outline'}
              className={`rounded-xl h-8 text-xs ${horizon === h.months ? 'gradient-finance text-white border-0' : ''}`}
              onClick={() => setHorizon(h.months)}
            >
              {h.label}
            </Button>
          ))}
        </div>

        {/* Resultado em destaque: o LÍQUIDO (o que de fato fica após o IR) */}
        <div className="rounded-2xl gradient-finance p-4 text-white shadow-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Você terá, líquido de IR</p>
          <p className="text-3xl font-extrabold tabular-nums mt-0.5">{formatCurrency(result.net)}</p>
          <p className="text-xs text-white/85 mt-0.5">
            Rendimento líquido de {formatCurrency(netInterest)}
          </p>
        </div>

        {/* Detalhamento: bruto, IR e aportado */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-[10px] text-muted-foreground font-medium">Valor bruto</p>
            <p className="text-sm font-bold tabular-nums truncate">{formatCurrency(result.gross)}</p>
          </div>
          <div className="rounded-xl bg-red-500/10 p-3">
            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Receipt className="w-3 h-3" /> IR no resgate
            </p>
            <p className="text-sm font-bold tabular-nums text-red-500 truncate">
              −{formatCurrency(result.tax)}
            </p>
            <p className="text-[9px] text-muted-foreground">{(result.effectiveRate * 100).toFixed(1).replace('.', ',')}% do rendimento</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-[10px] text-muted-foreground font-medium">Total aportado</p>
            <p className="text-sm font-bold tabular-nums truncate">{formatCurrency(result.contributed)}</p>
          </div>
        </div>

        {/* Gráfico: área = bruto; linha cheia = líquido (após IR); tracejada = aportado */}
        <div className="h-52 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="projGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--finance))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--finance))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={m => (m === 0 ? 'hoje' : monthLabel(m))}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                formatter={(value: number, key: string) => [
                  formatCurrency(value),
                  key === 'gross' ? 'Bruto' : key === 'net' ? 'Líquido (após IR)' : 'Aportado',
                ]}
                labelFormatter={m => (Number(m) === 0 ? 'Hoje' : monthLabel(Number(m)))}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              {/* Bruto: área preenchida */}
              <Area type="monotone" dataKey="gross" stroke="hsl(var(--finance))" strokeWidth={1.5} strokeOpacity={0.5} fill="url(#projGross)" />
              {/* Líquido: linha cheia em destaque */}
              <Area type="monotone" dataKey="net" stroke="hsl(var(--finance-dark))" strokeWidth={2.5} fill="none" />
              {/* Aportado: linha tracejada */}
              <Area type="monotone" dataKey="contributed" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda do gráfico */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground -mt-2">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-[hsl(var(--finance-dark))]" /> Líquido</span>
          <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[hsl(var(--finance))]/30" /> Bruto</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded bg-muted-foreground/60" style={{ borderTop: '1px dashed' }} /> Aportado</span>
        </div>

        {/* Visão por mês: tabela com bruto, IR e líquido de cada mês (abre e fecha) */}
        <Collapsible open={tableOpen} onOpenChange={setTableOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full rounded-xl gap-2 text-xs h-9">
              <Table2 className="w-3.5 h-3.5" />
              Ver mês a mês
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${tableOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-64 mt-3 rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium p-2.5">Mês</th>
                    <th className="text-right font-medium p-2.5">Bruto</th>
                    <th className="text-right font-medium p-2.5">IR</th>
                    <th className="text-right font-medium p-2.5">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map(p => (
                    <tr key={p.month} className="border-t border-border/50">
                      <td className="p-2.5 font-medium">{p.month === 0 ? 'Hoje' : monthLabel(p.month)}</td>
                      <td className="p-2.5 text-right tabular-nums">{formatCurrency(p.gross)}</td>
                      <td className="p-2.5 text-right tabular-nums text-red-500">
                        {p.tax > 0 ? `−${formatCurrency(p.tax)}` : '—'}
                        {p.tax > 0 && (
                          <span className="block text-[9px] text-muted-foreground">
                            {(p.effectiveRate * 100).toFixed(1).replace('.', ',')}%
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right tabular-nums font-semibold text-[hsl(var(--finance))]">{formatCurrency(p.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Aviso: é uma estimativa */}
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Estimativa simplificada. O IR da renda fixa segue a tabela regressiva (22,5% a 15%);
          fundos têm come-cotas e ações/FII têm regras próprias não detalhadas aqui. Não considera
          inflação nem IOF (resgates em menos de 30 dias). Rendimento passado não garante futuro.
        </p>
      </CardContent>
    </Card>
  );
}
