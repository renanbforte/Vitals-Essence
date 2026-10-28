// ============================================================================
// CurrencyHoldingsCard — MINHAS MOEDAS (quanto tenho em cada moeda)
// ----------------------------------------------------------------------------
// Mostra, separadamente, quanto a pessoa tem em cada moeda estrangeira: a
// quantia na moeda (ex.: € 1.500) e o valor em R$ (pela cotação guardada).
// Traz um gráfico de barras comparando o valor em R$ por moeda e o total.
// Moedas não rendem juros — por isso ficam fora da projeção da carteira.
// ============================================================================
import { useMemo } from 'react';
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import { currencySymbol, FOREIGN_CURRENCIES } from '@/lib/exchange';
import { formatCurrency, formatCurrencyCompact } from '@/lib/finance';
import type { Investment } from '@/hooks/useInvestments';

interface Props {
  investments: Investment[];
}

// Cores por moeda (ciclo da paleta quando houver muitas).
const CURRENCY_COLORS = ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];

// Nome amigável da moeda (ex.: "Euro"); cai no código se não for listada.
function currencyLabel(code: string): string {
  return FOREIGN_CURRENCIES.find(c => c.code === code)?.label ?? code;
}

// Valor em R$ de um investimento em moeda = o capital em BRL guardado (fonte de
// verdade do app). O número na moeda (foreign_amount) é só exibição; não é
// multiplicado pela cotação aqui, para não tratar reais como se fossem a moeda.
function brlValueOf(inv: Investment): number {
  return (Number(inv.current_value) || 0) + (Number(inv.operating_capital) || 0);
}

export function CurrencyHoldingsCard({ investments }: Props) {
  // Agrupa os investimentos reais em moeda estrangeira por moeda.
  const groups = useMemo(() => {
    const map = new Map<string, { code: string; foreign: number; brl: number; count: number }>();
    for (const inv of investments) {
      if (inv.is_simulated) continue;
      if (!inv.currency || inv.currency === 'BRL') continue;
      const g = map.get(inv.currency) || { code: inv.currency, foreign: 0, brl: 0, count: 0 };
      g.foreign += Number(inv.foreign_amount) || 0;
      g.brl += brlValueOf(inv);
      g.count += 1;
      map.set(inv.currency, g);
    }
    // Maior valor em R$ primeiro.
    return Array.from(map.values()).sort((a, b) => b.brl - a.brl);
  }, [investments]);

  const totalBRL = useMemo(() => groups.reduce((s, g) => s + g.brl, 0), [groups]);

  // Sem moedas: não mostra o card.
  if (groups.length === 0) return null;

  const chartData = groups.map((g, i) => ({
    code: g.code,
    brl: g.brl,
    color: CURRENCY_COLORS[i % CURRENCY_COLORS.length],
  }));

  return (
    <Card>
      <CardContent className="p-3 space-y-3">
        {/* Cabeçalho + total */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-sky-600" />
            <div>
              <p className="text-sm font-bold leading-tight">Minhas moedas</p>
              <p className="text-[10px] text-muted-foreground">Quanto você tem em cada moeda (não rende juros)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground leading-tight">Total em moedas</p>
            <p className="text-base font-bold text-sky-600 tabular-nums">{formatCurrency(totalBRL)}</p>
          </div>
        </div>

        {/* Gráfico de barras: valor em R$ por moeda */}
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="code" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={formatCurrencyCompact} width={56} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
              <Bar dataKey="brl" name="Valor em R$" radius={[4, 4, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista: cada moeda com a quantia e o valor em R$ */}
        <div className="space-y-1.5">
          {groups.map((g, i) => {
            const rate = g.foreign > 0 ? g.brl / g.foreign : 0;
            return (
              <div key={g.code} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CURRENCY_COLORS[i % CURRENCY_COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">
                      {currencySymbol(g.code)} {g.foreign.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {currencyLabel(g.code)}{rate > 0 ? ` · R$ ${rate.toFixed(4).replace('.', ',')}` : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-bold text-sky-600 tabular-nums shrink-0">{formatCurrency(g.brl)}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
