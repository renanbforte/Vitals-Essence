// ============================================================================
// InvestmentProjectionCard — PROJEÇÃO DA CARTEIRA QUE RENDE (JUROS COMPOSTOS)
// ----------------------------------------------------------------------------
// Projeta a carteira de investimentos que RENDE juros, mês a mês, com juros
// compostos usando a taxa da meta % de cada investimento (quem não tem usa um
// padrão ajustável aqui). Mostra o aportado (do bolso) separado do com juros
// (lucro) e o total. As moedas estrangeiras ficam no card próprio "Minhas moedas".
// ============================================================================
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LineChart, Line,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TrendingUp, Sparkles } from 'lucide-react';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { projectPortfolio } from '@/lib/portfolioProjection';
import { formatCurrency, formatCurrencyCompact } from '@/lib/finance';
import type { Investment } from '@/hooks/useInvestments';

interface Props {
  investments: Investment[];
  months: number; // horizonte da projeção (meses à frente), vindo do período escolhido
}

export function InvestmentProjectionCard({ investments, months }: Props) {
  // Taxa padrão (% ao ano) para os investimentos que não têm meta em %.
  const [defaultRatePct, setDefaultRatePct] = useState('10.5');

  // Só investimentos reais que RENDEM (exclui simulações e moedas estrangeiras).
  const rende = useMemo(
    () => investments.filter(i => !i.is_simulated && (!i.currency || i.currency === 'BRL')),
    [investments],
  );

  // Série projetada mês a mês (a projeção já separa o que rende das moedas).
  const series = useMemo(() => projectPortfolio(rende, {
    months,
    defaultAnnualRate: (Number(defaultRatePct.replace(',', '.')) || 0) / 100,
  }), [rende, months, defaultRatePct]);

  // Dados do gráfico: um ponto por mês, com rótulo de data.
  const chartData = useMemo(() => series.map(p => ({
    label: format(addMonths(new Date(), p.month), 'MMM/yy', { locale: ptBR }),
    aportado: p.aportado,
    rende: p.rende,
  })), [series]);

  const hoje = series[0];
  const fim = series[series.length - 1];

  // Sem investimentos que rendem: mensagem simpática.
  if (rende.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[hsl(var(--finance))]" />
            <p className="text-sm font-bold">Projeção da carteira · juros compostos</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Cadastre um investimento em renda (fora moeda estrangeira) para ver a projeção com juros compostos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[hsl(var(--finance))]" />
            <div>
              <p className="text-sm font-bold leading-tight">Projeção da carteira</p>
              <p className="text-[10px] text-muted-foreground">Juros compostos pela meta % de cada investimento</p>
            </div>
          </div>
          {/* Taxa padrão para quem não tem meta em % */}
          <div className="text-right">
            <label className="text-[9px] text-muted-foreground block leading-tight">Taxa p/ sem meta (% a.a.)</label>
            <Input
              type="number"
              step="0.1"
              value={defaultRatePct}
              onChange={e => setDefaultRatePct(e.target.value)}
              className="h-7 w-20 text-xs text-right rounded-lg tabular-nums"
            />
          </div>
        </div>

        {/* Números: hoje × fim do horizonte */}
        <div className="grid grid-cols-3 gap-2">
          <Mini label="Hoje" value={hoje.rende} tone="muted" />
          <Mini label={`Em ${months} meses`} value={fim.rende} tone="finance" icon={TrendingUp} />
          <Mini label="Lucro de juros" value={fim.juros} tone="emerald" />
        </div>

        {/* Gráfico: aportado × com juros */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyCompact} width={56} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="aportado" name="Aportado" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <Line type="monotone" dataKey="rende" name="Com juros" stroke="hsl(var(--finance))" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Projeção estimada a partir do valor de hoje. Moedas estrangeiras não rendem juros — veja-as em "Minhas moedas".
        </p>
      </CardContent>
    </Card>
  );
}

// Mini-cartão de um número.
function Mini({ label, value, tone, icon: Icon }: {
  label: string; value: number; tone: 'muted' | 'finance' | 'emerald'; icon?: React.ElementType;
}) {
  const toneClass: Record<string, string> = {
    muted: 'text-foreground',
    finance: 'text-[hsl(var(--finance))]',
    emerald: 'text-emerald-600',
  };
  return (
    <div className="rounded-xl bg-muted/40 p-2.5">
      <div className="flex items-center gap-1 mb-0.5">
        {Icon && <Icon className={`w-3 h-3 ${toneClass[tone]}`} />}
        <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      </div>
      <p className={`text-sm font-bold tabular-nums ${toneClass[tone]}`}>{formatCurrency(value)}</p>
    </div>
  );
}
