// ============================================================================
// fixedIncome.ts  —  RENDA FIXA: INDEXADOR → TAXA BRUTA → TAXA LÍQUIDA (IR)
// ----------------------------------------------------------------------------
// Converte o indexador de um investimento ("100% do CDI", "IPCA + 6%", "pré
// 12% a.a."...) na taxa bruta real, usando as taxas de mercado (CDI/IPCA). E
// calcula a taxa líquida (já descontado o IR) para vários prazos — porque na
// renda fixa o IR é regressivo (22,5% até 15%), então o "a.m. líquido" depende
// de quanto tempo o dinheiro fica aplicado.
// ============================================================================
import { annualToMonthlyRate, rendaFixaIRRate, type TaxType } from '@/lib/projection';

// Tipos de indexador suportados.
export type Indexer = 'cdi_percent' | 'cdi_plus' | 'ipca_plus' | 'prefixado' | 'selic' | 'poupanca' | 'none';

// Rótulos amigáveis dos indexadores (para formulário e exibição).
export const INDEXERS: { value: Indexer; label: string; needsValue: boolean; unit: string }[] = [
  { value: 'cdi_percent', label: '% do CDI', needsValue: true, unit: '% do CDI' },
  { value: 'cdi_plus', label: 'CDI + taxa', needsValue: true, unit: '% a.a.' },
  { value: 'ipca_plus', label: 'IPCA + taxa', needsValue: true, unit: '% a.a.' },
  { value: 'prefixado', label: 'Prefixado', needsValue: true, unit: '% a.a.' },
  { value: 'selic', label: 'Selic', needsValue: false, unit: '' },
  { value: 'poupanca', label: 'Poupança', needsValue: false, unit: '' },
  { value: 'none', label: 'Outro / taxa fixa', needsValue: true, unit: '% a.a.' },
];

// Taxas de mercado usadas no cálculo (todas em % ao ano).
export interface MarketRates {
  cdi: number;   // CDI % a.a.
  ipca: number;  // IPCA (12 meses) % a.a.
}

// Selic ≈ CDI + 0,1 p.p. (aproximação suficiente para a poupança).
function selicFrom(cdi: number): number {
  return cdi + 0.1;
}

// Rendimento da poupança (regra oficial simplificada, TR ≈ 0):
// - Selic > 8,5% a.a.: 6,17% a.a.
// - Selic ≤ 8,5% a.a.: 70% da Selic.
function poupancaAnnual(cdi: number): number {
  const selic = selicFrom(cdi);
  return selic > 8.5 ? 6.17 : 0.7 * selic;
}

// Taxa BRUTA em % ao ano a partir do indexador e das taxas de mercado.
export function grossAnnualRate(indexer: Indexer, value: number, rates: MarketRates): number {
  const v = Number(value) || 0;
  const cdi = Number(rates.cdi) || 0;
  const ipca = Number(rates.ipca) || 0;
  switch (indexer) {
    case 'cdi_percent': return cdi * (v / 100);
    // CDI/IPCA + spread: composição real (1+base)·(1+spread) − 1.
    case 'cdi_plus': return ((1 + cdi / 100) * (1 + v / 100) - 1) * 100;
    case 'ipca_plus': return ((1 + ipca / 100) * (1 + v / 100) - 1) * 100;
    case 'prefixado': return v;
    case 'selic': return selicFrom(cdi);
    case 'poupanca': return poupancaAnnual(cdi);
    case 'none':
    default: return v;
  }
}

// Alíquota de IR sobre o rendimento, conforme o tipo e o prazo (em meses).
// Renda fixa = tabela regressiva; isento (LCI/LCA/poupança) = 0; ações/FII = 15%.
export function irRateFor(taxType: TaxType, months: number, customRate = 0): number {
  if (taxType === 'isento') return 0;
  if (taxType === 'acoes_fii') return 0.15;
  if (taxType === 'custom') return Math.max(0, Math.min(1, customRate));
  return rendaFixaIRRate(months * 30); // renda_fixa (dias ≈ meses × 30)
}

// Quebra de rendimento num prazo: bruto a.a., IR aplicado e líquido (a.a. e a.m.).
export interface RateBreakdown {
  months: number;
  label: string;
  grossAnnual: number;  // % a.a. bruto
  grossMonthly: number; // % a.m. bruto
  irRate: number;       // alíquota de IR sobre o rendimento (0..1)
  netAnnual: number;    // % a.a. líquido (depois do IR do prazo)
  netMonthly: number;   // % a.m. líquido
}

// Prazos padrão exibidos (meses) e seus rótulos — cobrem as faixas do IR.
export const DEFAULT_HORIZONS: { months: number; label: string }[] = [
  { months: 6, label: '6 meses' },   // 22,5%
  { months: 12, label: '1 ano' },    // 20,0%
  { months: 24, label: '2 anos' },   // 17,5%
  { months: 36, label: '+2 anos' },  // 15,0% (faixa final)
];

// Líquido num prazo: aplica o IR da faixa sobre o rendimento acumulado e volta
// à taxa equivalente a.a./a.m. (o IR "come" parte do juro, então a taxa cai).
export function netAtHorizon(grossAnnual: number, taxType: TaxType, months: number, customRate = 0): RateBreakdown {
  const ga = grossAnnual / 100;
  const grossFactor = Math.pow(1 + ga, months / 12); // fator bruto no prazo
  const gain = grossFactor - 1;                        // rendimento bruto (fração)
  const ir = irRateFor(taxType, months, customRate);
  const netFactor = 1 + gain * (1 - ir);              // fator já com IR descontado
  const netAnnual = Math.pow(netFactor, 12 / months) - 1;
  const netMonthly = Math.pow(netFactor, 1 / months) - 1;
  const label = DEFAULT_HORIZONS.find(h => h.months === months)?.label ?? `${months} meses`;
  return {
    months,
    label,
    grossAnnual,
    grossMonthly: annualToMonthlyRate(ga) * 100,
    irRate: ir,
    netAnnual: netAnnual * 100,
    netMonthly: netMonthly * 100,
  };
}

// Tabela de líquido em vários prazos (6m, 1a, 2a, +2a por padrão).
export function rateTable(
  indexer: Indexer,
  value: number,
  taxType: TaxType,
  rates: MarketRates,
  horizons = DEFAULT_HORIZONS,
  customRate = 0,
): { grossAnnual: number; rows: RateBreakdown[] } {
  const grossAnnual = grossAnnualRate(indexer, value, rates);
  const rows = horizons.map(h => netAtHorizon(grossAnnual, taxType, h.months, customRate));
  return { grossAnnual, rows };
}

// Meses entre hoje e uma data de vencimento (mínimo 1), para destacar a faixa de
// IR aplicável no vencimento do ativo.
export function monthsUntil(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const end = new Date(dateISO + 'T00:00:00').getTime();
  const now = Date.now();
  if (!Number.isFinite(end) || end <= now) return null;
  return Math.max(1, Math.round((end - now) / (1000 * 60 * 60 * 24 * 30)));
}
