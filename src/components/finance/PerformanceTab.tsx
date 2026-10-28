// ============================================================================
// PerformanceTab (Aba Desempenho)
// ----------------------------------------------------------------------------
// Mostra o desempenho financeiro mês a mês, em gráfico ou tabela. Permite:
//  • escolher a visão: Real, Planejado ou os dois juntos;
//  • escolher o período (6, 12 ou 24 meses, com passado e futuro);
//  • escolher a métrica do gráfico;
//  • ver os números do mês atual em cartões (investido, saldo livre, acumulados,
//    patrimônio total, entradas e saídas).
// As simulações de investimento entram na visão Planejado.
// ============================================================================
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, BarChart, Bar,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Table as TableIcon, TrendingUp, TrendingDown, PiggyBank, Wallet, Landmark, Layers } from 'lucide-react';
import { useFinancialPerformance, type PerfRow } from '@/hooks/useFinancialPerformance';
import { formatCurrency, formatCurrencyCompact } from '@/lib/finance';
import { Skeleton } from '@/components/ui/skeleton';
import { useInvestments } from '@/hooks/useInvestments';
import { InvestmentProjectionCard } from './InvestmentProjectionCard';

type Mode = 'real' | 'planejado' | 'ambos';
type Metric = 'total' | 'acumuladoConta' | 'acumuladoInvest' | 'fluxo' | 'investido' | 'saldoLivre';

// Períodos: quantos meses para trás e para frente (futuro = projeção).
// Você escolhe — a projeção é ilimitada (as recorrências são criadas sob demanda).
const PERIODS: Record<string, { back: number; forward: number; label: string }> = {
  '6': { back: 3, forward: 3, label: '6 meses' },
  '12': { back: 6, forward: 6, label: '1 ano' },
  '24': { back: 12, forward: 12, label: '2 anos' },
  '36': { back: 12, forward: 24, label: '3 anos' },
  '60': { back: 12, forward: 48, label: '5 anos' },
  '120': { back: 12, forward: 108, label: '10 anos' },
};

const METRICS: { value: Metric; label: string; kind: 'line' | 'bar' | 'flow' }[] = [
  { value: 'total', label: 'Patrimônio total', kind: 'line' },
  { value: 'acumuladoConta', label: 'Acumulado na conta', kind: 'line' },
  { value: 'acumuladoInvest', label: 'Acumulado investimentos', kind: 'line' },
  { value: 'fluxo', label: 'Entradas × Saídas', kind: 'flow' },
  { value: 'investido', label: 'Investido no mês', kind: 'bar' },
  { value: 'saldoLivre', label: 'Saldo livre do mês', kind: 'bar' },
];

const COLORS = {
  real: 'hsl(var(--finance-dark))',
  plan: 'hsl(var(--finance))',
  entradas: '#10b981',
  saidas: '#ef4444',
};

// Tooltip do gráfico em moeda.
const money = (v: number) => formatCurrency(v);

export function PerformanceTab() {
  const [mode, setMode] = useState<Mode>('ambos');
  const [period, setPeriod] = useState('12');
  const [metric, setMetric] = useState<Metric>('total');
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const { back, forward } = PERIODS[period];
  const { real, planejado, loading } = useFinancialPerformance(back, forward);
  const { investments } = useInvestments();

  const showReal = mode === 'real' || mode === 'ambos';
  const showPlan = mode === 'planejado' || mode === 'ambos';
  const metricDef = METRICS.find(m => m.value === metric)!;

  // Série ativa para os cartões e a tabela (no "ambos", usa o Planejado, que é o plano completo).
  const activeSeries = mode === 'real' ? real : planejado;
  // Linha do mês atual = o último mês que não é futuro.
  const currentRow = useMemo(() => {
    const past = activeSeries.filter(r => !r.isFuture);
    return past[past.length - 1] || activeSeries[activeSeries.length - 1] || null;
  }, [activeSeries]);

  // Dados combinados para o gráfico (mesmos meses nas duas séries).
  const chartData = useMemo(() => real.map((r, i) => ({
    label: r.label,
    real_total: r.total, plan_total: planejado[i]?.total ?? 0,
    real_acumuladoConta: r.acumuladoConta, plan_acumuladoConta: planejado[i]?.acumuladoConta ?? 0,
    real_acumuladoInvest: r.acumuladoInvest, plan_acumuladoInvest: planejado[i]?.acumuladoInvest ?? 0,
    real_investido: r.investido, plan_investido: planejado[i]?.investido ?? 0,
    real_saldoLivre: r.saldoLivre, plan_saldoLivre: planejado[i]?.saldoLivre ?? 0,
    entradas: (mode === 'real' ? r.entradas : planejado[i]?.entradas) ?? 0,
    saidas: (mode === 'real' ? r.saidas : planejado[i]?.saidas) ?? 0,
  })), [real, planejado, mode]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cartões do mês atual */}
      {currentRow && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">
            {currentRow.label} · {mode === 'real' ? 'Real' : 'Planejado'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <StatTile icon={PiggyBank} label="Investido no mês" value={currentRow.investido} tone="finance" />
            <StatTile icon={Wallet} label="Saldo livre do mês" value={currentRow.saldoLivre} tone={currentRow.saldoLivre >= 0 ? 'emerald' : 'red'} />
            <StatTile icon={TrendingUp} label="Entradas no mês" value={currentRow.entradas} tone="emerald" />
            <StatTile icon={TrendingDown} label="Saídas no mês" value={currentRow.saidas} tone="red" />
            <StatTile icon={Landmark} label="Acumulado na conta" value={currentRow.acumuladoConta} tone="sky" />
            <StatTile icon={BarChart3} label="Acumulado investimentos" value={currentRow.acumuladoInvest} tone="violet" />
            <StatTile icon={Layers} label="Patrimônio total" value={currentRow.total} tone="finance" span />
          </div>
        </div>
      )}

      {/* Controles */}
      <Card>
        <CardContent className="p-3 space-y-3">
          {/* Visão: Real / Planejado / Ambos */}
          <div className="grid grid-cols-3 gap-1.5">
            {(['real', 'planejado', 'ambos'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all capitalize ${
                  mode === m ? 'bg-[hsl(var(--finance))] text-white border-[hsl(var(--finance))]' : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {m === 'ambos' ? 'Ambos' : m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Período */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODS).map(([k, p]) => <SelectItem key={k} value={k}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Gráfico x Tabela */}
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => setView('chart')} className={`flex items-center justify-center gap-1 rounded-xl text-xs font-bold border ${view === 'chart' ? 'bg-foreground text-background border-foreground' : 'bg-card border-border text-muted-foreground'}`}>
                <BarChart3 className="w-3.5 h-3.5" /> Gráfico
              </button>
              <button onClick={() => setView('table')} className={`flex items-center justify-center gap-1 rounded-xl text-xs font-bold border ${view === 'table' ? 'bg-foreground text-background border-foreground' : 'bg-card border-border text-muted-foreground'}`}>
                <TableIcon className="w-3.5 h-3.5" /> Tabela
              </button>
            </div>
          </div>

          {/* Métrica (só no gráfico) */}
          {view === 'chart' && (
            <Select value={metric} onValueChange={v => setMetric(v as Metric)}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METRICS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Gráfico */}
      {view === 'chart' && (
        <Card>
          <CardContent className="p-3">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {metricDef.kind === 'flow' ? (
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyCompact} width={56} />
                    <Tooltip formatter={money} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="entradas" name="Entradas" fill={COLORS.entradas} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill={COLORS.saidas} radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : metricDef.kind === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyCompact} width={56} />
                    <Tooltip formatter={money} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {showReal && <Bar dataKey={`real_${metric}`} name="Real" fill={COLORS.real} radius={[4, 4, 0, 0]} />}
                    {showPlan && <Bar dataKey={`plan_${metric}`} name="Planejado" fill={COLORS.plan} radius={[4, 4, 0, 0]} fillOpacity={mode === 'ambos' ? 0.55 : 1} />}
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyCompact} width={56} />
                    <Tooltip formatter={money} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {showPlan && <Line type="monotone" dataKey={`plan_${metric}`} name="Planejado" stroke={COLORS.plan} strokeWidth={2} strokeDasharray={mode === 'ambos' ? '5 4' : undefined} dot={false} />}
                    {showReal && <Line type="monotone" dataKey={`real_${metric}`} name="Real" stroke={COLORS.real} strokeWidth={2.5} dot={false} />}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            {/* Legenda do período */}
            <p className="text-[10px] text-muted-foreground text-center mt-1">
              Meses à frente do atual são projeção. Planejado inclui lançamentos a pagar e simulações.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Projeção da carteira com juros compostos (horizonte = meses à frente do período) */}
      <InvestmentProjectionCard investments={investments} months={forward} />

      {/* Tabela */}
      {view === 'table' && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2.5 font-semibold sticky left-0 bg-card">Mês</th>
                  <th className="text-right p-2.5 font-semibold">Entradas</th>
                  <th className="text-right p-2.5 font-semibold">Saídas</th>
                  <th className="text-right p-2.5 font-semibold">Investido</th>
                  <th className="text-right p-2.5 font-semibold">Saldo livre</th>
                  <th className="text-right p-2.5 font-semibold">Acum. conta</th>
                  <th className="text-right p-2.5 font-semibold">Acum. invest.</th>
                  <th className="text-right p-2.5 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {activeSeries.map((r: PerfRow) => (
                  <tr key={r.key} className={`border-b border-border/50 ${r.isFuture ? 'bg-[hsl(var(--finance))]/5' : ''}`}>
                    <td className="p-2.5 font-semibold sticky left-0 bg-card whitespace-nowrap">
                      {r.label}
                      {r.isFuture && <span className="ml-1 text-[9px] text-[hsl(var(--finance))] font-bold uppercase">proj</span>}
                    </td>
                    <td className="p-2.5 text-right tabular-nums text-emerald-600">{r.entradas ? formatCurrencyCompact(r.entradas) : '—'}</td>
                    <td className="p-2.5 text-right tabular-nums text-red-500">{r.saidas ? formatCurrencyCompact(r.saidas) : '—'}</td>
                    <td className="p-2.5 text-right tabular-nums text-[hsl(var(--finance))]">{r.investido ? formatCurrencyCompact(r.investido) : '—'}</td>
                    <td className={`p-2.5 text-right tabular-nums ${r.saldoLivre >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrencyCompact(r.saldoLivre)}</td>
                    <td className="p-2.5 text-right tabular-nums text-sky-600">{formatCurrencyCompact(r.acumuladoConta)}</td>
                    <td className="p-2.5 text-right tabular-nums text-violet-600">{formatCurrencyCompact(r.acumuladoInvest)}</td>
                    <td className="p-2.5 text-right tabular-nums font-bold">{formatCurrencyCompact(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground p-2.5">Linhas marcadas "proj" são meses futuros (projeção).</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Cartão de um número do mês.
function StatTile({ icon: Icon, label, value, tone, span }: {
  icon: React.ElementType; label: string; value: number; tone: 'finance' | 'emerald' | 'red' | 'sky' | 'violet'; span?: boolean;
}) {
  const toneClass: Record<string, string> = {
    finance: 'text-[hsl(var(--finance))] bg-[hsl(var(--finance))]/10',
    emerald: 'text-emerald-600 bg-emerald-500/10',
    red: 'text-red-500 bg-red-500/10',
    sky: 'text-sky-600 bg-sky-500/10',
    violet: 'text-violet-600 bg-violet-500/10',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={span ? 'col-span-2' : ''}>
      <Card className="border-border/60">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${toneClass[tone]}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</span>
          </div>
          <p className={`text-base font-bold tabular-nums ${toneClass[tone].split(' ')[0]}`}>{formatCurrency(value)}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
