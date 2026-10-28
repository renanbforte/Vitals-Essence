// ============================================================================
// FixedIncomeRates — TAXAS DE UM ATIVO DE RENDA FIXA (bruto e líquido por prazo)
// ----------------------------------------------------------------------------
// Dado o indexador do ativo (ex.: 100% do CDI) e as taxas de mercado, mostra a
// taxa bruta a.a. e uma tabela de líquido (a.a. e a.m.) em vários prazos — já
// que o IR da renda fixa é regressivo. Destaca a faixa do vencimento, quando há.
// ============================================================================
import { rateTable, monthsUntil, INDEXERS, type Indexer, type MarketRates } from '@/lib/fixedIncome';
import type { TaxType } from '@/lib/projection';

interface Props {
  indexer: Indexer;
  indexerValue: number;
  irType: TaxType;
  rates: MarketRates;
  maturityDate?: string | null;
}

// Rótulo legível do indexador (ex.: "100% do CDI", "IPCA + 6% a.a.").
function indexerLabel(indexer: Indexer, value: number): string {
  switch (indexer) {
    case 'cdi_percent': return `${value}% do CDI`;
    case 'cdi_plus': return `CDI + ${value}% a.a.`;
    case 'ipca_plus': return `IPCA + ${value}% a.a.`;
    case 'prefixado': return `Prefixado ${value}% a.a.`;
    case 'selic': return 'Selic';
    case 'poupanca': return 'Poupança';
    default: return `${value}% a.a.`;
  }
}

const pct = (v: number) => `${v.toFixed(2).replace('.', ',')}%`;

export function FixedIncomeRates({ indexer, indexerValue, irType, rates, maturityDate }: Props) {
  const { grossAnnual, rows } = rateTable(indexer, indexerValue, irType, rates);
  const matMonths = monthsUntil(maturityDate ?? null);
  // Faixa cujo prazo mais se aproxima do vencimento (para destacar na tabela).
  const matRowMonths = matMonths != null
    ? rows.reduce((best, r) => Math.abs(r.months - matMonths) < Math.abs(best - matMonths) ? r.months : best, rows[0].months)
    : null;

  const isIsento = irType === 'isento';

  return (
    <div className="space-y-2">
      {/* Resumo: indexador → taxa bruta */}
      <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--finance))]/10 p-3">
        <div>
          <p className="text-[10px] text-muted-foreground leading-tight">Rende</p>
          <p className="text-sm font-bold text-[hsl(var(--finance))]">{indexerLabel(indexer, indexerValue)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground leading-tight">Bruto estimado</p>
          <p className="text-sm font-bold tabular-nums">{pct(grossAnnual)} a.a.</p>
        </div>
      </div>

      {/* Tabela: líquido por prazo (IR regressivo) */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground">
              <th className="text-left p-2 font-semibold">Prazo</th>
              <th className="text-right p-2 font-semibold">IR</th>
              <th className="text-right p-2 font-semibold">Líq. a.a.</th>
              <th className="text-right p-2 font-semibold">Líq. a.m.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const highlight = r.months === matRowMonths;
              return (
                <tr key={r.months} className={`border-t border-border/60 ${highlight ? 'bg-[hsl(var(--finance))]/10 font-semibold' : ''}`}>
                  <td className="p-2">
                    {r.label}
                    {highlight && <span className="ml-1 text-[9px] text-[hsl(var(--finance))] uppercase">vencim.</span>}
                  </td>
                  <td className="p-2 text-right tabular-nums text-muted-foreground">{isIsento ? 'isento' : pct(r.irRate * 100)}</td>
                  <td className="p-2 text-right tabular-nums text-[hsl(var(--finance))]">{pct(r.netAnnual)}</td>
                  <td className="p-2 text-right tabular-nums font-bold">{pct(r.netMonthly)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Líquido já com IR do prazo descontado sobre o rendimento. Estimativa pelas taxas de mercado atuais ({pct(rates.cdi)} CDI · {pct(rates.ipca)} IPCA).
      </p>
    </div>
  );
}
