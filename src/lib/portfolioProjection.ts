// ============================================================================
// portfolioProjection.ts  —  PROJEÇÃO DA CARTEIRA COM JUROS COMPOSTOS
// ----------------------------------------------------------------------------
// Projeta, mês a mês, para onde a carteira de investimentos caminha aplicando
// juros compostos EM CADA investimento com a sua própria taxa (vinda da meta
// em % de cada um; quem não tem meta em % usa uma taxa padrão ajustável).
//
// As moedas estrangeiras não rendem juros: entram num grupo à parte, planas,
// pelo valor em R$ de hoje. Assim a tela mostra três linhas — o que rende, as
// moedas e o total — e separa o quanto é aporte (do bolso) do quanto é juro.
// ============================================================================
import { annualToMonthlyRate, projectCompound } from '@/lib/projection';
import type { Investment } from '@/hooks/useInvestments';

// Um mês da projeção da carteira inteira.
export interface PortfolioPoint {
  month: number;    // 0 = hoje, 1 = daqui a um mês...
  aportado: number; // soma do que foi/será colocado do bolso (sem juros)
  rende: number;    // valor dos investimentos que rendem (com juros compostos)
  moedas: number;   // valor das moedas estrangeiras (plano, sem render)
  total: number;    // rende + moedas (patrimônio projetado da carteira)
  juros: number;    // rende - aportado (lucro de juros acumulado)
}

// Uma moeda estrangeira é qualquer investimento com moeda diferente de BRL.
function isForeignCurrency(inv: Investment): boolean {
  return !!inv.currency && inv.currency !== 'BRL';
}

// Taxa mensal (fração) de um investimento: usa a meta em % quando houver
// (ao mês ou ao ano); senão cai no padrão anual informado.
function monthlyRateFor(inv: Investment, defaultAnnualRate: number): number {
  const t = Number(inv.target_value) || 0;
  if (inv.target_mode === 'pct_monthly' && t > 0) return t / 100;
  if (inv.target_mode === 'pct_yearly' && t > 0) return annualToMonthlyRate(t / 100);
  return annualToMonthlyRate(defaultAnnualRate);
}

// Aporte mensal de um investimento (em R$). Só conta quando há aporte recorrente
// definido; aporte anual vira o equivalente mensal (÷ 12).
function monthlyContributionFor(inv: Investment): number {
  if (!inv.is_recurring_contribution || !inv.recurring_amount) return 0;
  const amount = Number(inv.recurring_amount) || 0;
  const type = inv.recurrence_type || 'months';
  if (type === 'years' || type === 'yearly') return amount / 12;
  return amount;
}

// Projeta a carteira inteira por `months` meses. Considera apenas investimentos
// REAIS (as simulações não entram no patrimônio). Retorna a série mês a mês.
export function projectPortfolio(
  investments: Investment[],
  opts: { months: number; defaultAnnualRate: number },
): PortfolioPoint[] {
  const { months, defaultAnnualRate } = opts;
  const reais = investments.filter(i => !i.is_simulated);

  // Para cada investimento, monta a sua própria série de juros compostos.
  // Moeda estrangeira = taxa 0 e sem aporte: fica plana no valor de hoje.
  const rendeSeries: { total: number[]; contributed: number[] }[] = [];
  const moedaSeries: number[][] = [];

  for (const inv of reais) {
    const principal = (Number(inv.current_value) || 0) + (Number(inv.operating_capital) || 0);
    if (isForeignCurrency(inv)) {
      // Plana: mesmo valor em todos os meses.
      moedaSeries.push(Array.from({ length: months + 1 }, () => principal));
      continue;
    }
    const series = projectCompound({
      principal,
      monthlyContribution: monthlyContributionFor(inv),
      monthlyRate: monthlyRateFor(inv, defaultAnnualRate),
      months,
    });
    rendeSeries.push({
      total: series.map(p => p.total),
      contributed: series.map(p => p.contributed),
    });
  }

  // Soma, mês a mês, todos os investimentos de cada grupo.
  const points: PortfolioPoint[] = [];
  for (let m = 0; m <= months; m++) {
    const rende = rendeSeries.reduce((s, inv) => s + inv.total[m], 0);
    const aportado = rendeSeries.reduce((s, inv) => s + inv.contributed[m], 0);
    const moedas = moedaSeries.reduce((s, arr) => s + arr[m], 0);
    points.push({
      month: m,
      aportado,
      rende,
      moedas,
      total: rende + moedas,
      juros: rende - aportado,
    });
  }
  return points;
}
