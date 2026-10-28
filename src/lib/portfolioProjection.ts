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
import { annualToMonthlyRate } from '@/lib/projection';
import { monthsUntil } from '@/lib/fixedIncome';
import type { Investment } from '@/hooks/useInvestments';

// Aporte por mês de um investimento (vetor índice 0..months). Pode vir dos
// aportes REAIS do Fluxo (preferido) ou de um fallback pelo valor recorrente.
export type ContributionArray = number[];

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

// Aporte mensal "cheio" de um investimento (em R$). Só conta quando há aporte
// recorrente definido; aporte anual vira o equivalente mensal (÷ 12).
function monthlyContributionFor(inv: Investment): number {
  if (!inv.is_recurring_contribution || !inv.recurring_amount) return 0;
  const amount = Number(inv.recurring_amount) || 0;
  const type = inv.recurrence_type || 'months';
  if (type === 'years' || type === 'yearly') return amount / 12;
  return amount;
}

// Vetor de aportes por mês. Preferimos os aportes REAIS do Fluxo (quando o
// hook os fornece); senão, um fallback pelo valor recorrente, limitado pelo
// prazo: recurring_months, ou até o vencimento do ativo, ou todo o horizonte.
function contributionArray(inv: Investment, months: number, fromFlow?: ContributionArray): ContributionArray {
  if (fromFlow) return fromFlow; // aportes reais do Fluxo (já refletem exclusões)
  const monthly = monthlyContributionFor(inv);
  const arr = new Array(months + 1).fill(0);
  if (monthly <= 0) return arr;
  // Até quantos meses aporta: prazo fixo, ou até o vencimento, ou o horizonte.
  const bound = inv.recurring_months ?? monthsUntil(inv.maturity_date) ?? months;
  for (let m = 1; m <= Math.min(months, bound); m++) arr[m] = monthly;
  return arr;
}

// Projeta uma série (um investimento) mês a mês, com juros compostos e um vetor
// de aportes por mês. Devolve o total e o quanto foi aportado (do bolso) a cada mês.
function projectSeries(principal: number, monthlyRate: number, contrib: ContributionArray, months: number) {
  const total: number[] = [principal];
  const contributed: number[] = [principal];
  let t = principal, c = principal;
  for (let m = 1; m <= months; m++) {
    const add = contrib[m] || 0;
    t = t * (1 + monthlyRate) + add;
    c += add;
    total.push(t);
    contributed.push(c);
  }
  return { total, contributed };
}

// Projeta a carteira inteira por `months` meses. Considera apenas investimentos
// REAIS (as simulações não entram no patrimônio). `contributions` traz, por id
// de investimento, os aportes reais do Fluxo — quando ausente, usa o fallback.
export function projectPortfolio(
  investments: Investment[],
  opts: { months: number; defaultAnnualRate: number; contributions?: Record<string, ContributionArray> },
): PortfolioPoint[] {
  const { months, defaultAnnualRate, contributions } = opts;
  const reais = investments.filter(i => !i.is_simulated);

  // Para cada investimento, monta a sua própria série de juros compostos.
  // Moeda estrangeira = taxa 0 (não rende), mas acumula com novas compras.
  const rendeSeries: { total: number[]; contributed: number[] }[] = [];
  const moedaSeries: number[][] = [];

  for (const inv of reais) {
    const brlHolding = (Number(inv.current_value) || 0) + (Number(inv.operating_capital) || 0);
    const contrib = contributionArray(inv, months, contributions?.[inv.id]);

    if (isForeignCurrency(inv)) {
      const series = projectSeries(brlHolding, 0, contrib, months);
      moedaSeries.push(series.total);
      continue;
    }

    const series = projectSeries(brlHolding, monthlyRateFor(inv, defaultAnnualRate), contrib, months);
    rendeSeries.push({ total: series.total, contributed: series.contributed });
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
