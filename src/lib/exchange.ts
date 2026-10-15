// ============================================================================
// exchange.ts  —  COTAÇÃO DE MOEDAS ESTRANGEIRAS
// ----------------------------------------------------------------------------
// Busca a cotação do dia de uma moeda em relação ao real, para o investimento
// em moeda estrangeira. Usa a AwesomeAPI (pública e gratuita). Em caso de falha
// (sem internet, API fora), devolve null — a tela deixa o usuário digitar a
// cotação manualmente.
// ============================================================================

// Moedas estrangeiras oferecidas, com símbolo para exibição.
export const FOREIGN_CURRENCIES = [
  { code: 'USD', label: 'Dólar americano', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'Libra esterlina', symbol: '£' },
  { code: 'CHF', label: 'Franco suíço', symbol: 'CHF' },
  { code: 'JPY', label: 'Iene japonês', symbol: '¥' },
  { code: 'CAD', label: 'Dólar canadense', symbol: 'C$' },
  { code: 'AUD', label: 'Dólar australiano', symbol: 'A$' },
  { code: 'ARS', label: 'Peso argentino', symbol: 'AR$' },
] as const;

export type ForeignCurrencyCode = typeof FOREIGN_CURRENCIES[number]['code'];

// Símbolo de uma moeda (ou o próprio código, se não listada).
export function currencySymbol(code: string): string {
  return FOREIGN_CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

// Busca quantos reais vale 1 unidade da moeda informada (ex.: USD -> ~5,10).
// Retorna null se não conseguir (a tela então pede a cotação manual).
export async function fetchExchangeRate(code: string): Promise<number | null> {
  if (code === 'BRL') return 1;
  try {
    const res = await fetch(`https://economia.awesomeapi.com.br/last/${code}-BRL`);
    if (!res.ok) return null;
    const data = await res.json();
    const bid = data?.[`${code}BRL`]?.bid;
    const rate = bid ? parseFloat(bid) : NaN;
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
