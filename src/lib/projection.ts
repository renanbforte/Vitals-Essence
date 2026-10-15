// ============================================================================
// projection.ts  —  MATEMÁTICA DE JUROS COMPOSTOS (projeções e simulador)
// ----------------------------------------------------------------------------
// Funções puras (sem banco, sem tela) usadas pela aba Metas do Financeiro:
// converter taxa anual em mensal, projetar o patrimônio mês a mês com aportes
// e descobrir em quantos meses uma meta é atingida. Por serem puras, são
// fáceis de testar e de reutilizar em qualquer componente.
// ============================================================================

// Um ponto da projeção: como o patrimônio está ao fim de um determinado mês.
export interface ProjectionPoint {
  month: number;       // número do mês (0 = hoje, 1 = daqui a um mês...)
  total: number;       // patrimônio total projetado ao fim desse mês
  contributed: number; // quanto desse total é dinheiro colocado (inicial + aportes)
  interest: number;    // quanto desse total é juro acumulado (total - contribuído)
}

// Converte uma taxa anual em taxa mensal equivalente (juros compostos).
// Ex.: 12% a.a. (0.12) vira ~0.9489% a.m. — e NÃO 1% a.m., porque o juro
// rende sobre o juro: (1 + anual)^(1/12) - 1.
export function annualToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

// Converte uma taxa mensal em anual equivalente (operação inversa da de cima).
export function monthlyToAnnualRate(monthlyRate: number): number {
  return Math.pow(1 + monthlyRate, 12) - 1;
}

// Projeta o patrimônio mês a mês: começa com um valor inicial (principal),
// rende a taxa mensal e recebe um aporte ao fim de cada mês.
// Fórmula fechada equivalente: VF = P(1+i)^n + A·((1+i)^n − 1)/i — aqui
// calculamos iterativamente para montar a série completa do gráfico/tabela.
export function projectCompound(params: {
  principal: number;          // valor que já está investido hoje
  monthlyContribution: number; // aporte colocado todo mês
  monthlyRate: number;         // taxa de rendimento ao mês (fração, ex.: 0.0095)
  months: number;              // horizonte da projeção, em meses
}): ProjectionPoint[] {
  const { principal, monthlyContribution, monthlyRate, months } = params;
  const points: ProjectionPoint[] = [];

  let total = principal;          // patrimônio acumulado até o momento
  let contributed = principal;    // soma de tudo que foi colocado do próprio bolso

  // Mês 0 = o ponto de partida (hoje), antes de qualquer rendimento.
  points.push({ month: 0, total, contributed, interest: 0 });

  for (let m = 1; m <= months; m++) {
    total = total * (1 + monthlyRate) + monthlyContribution; // rende e recebe o aporte
    contributed += monthlyContribution;
    points.push({
      month: m,
      total,
      contributed,
      interest: total - contributed,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// TRIBUTAÇÃO — Imposto de Renda no resgate (realidade brasileira)
// ---------------------------------------------------------------------------

// Tipos de investimento com regra de IR diferente:
// - 'renda_fixa': Tesouro, CDB, fundos DI — IR regressivo sobre o rendimento.
// - 'isento': LCI, LCA, poupança, debêntures incentivadas — sem IR.
// - 'acoes_fii': ações e FIIs — 15% sobre o ganho (simplificado).
// - 'custom': alíquota fixa definida pelo usuário, aplicada sobre o rendimento.
export type TaxType = 'renda_fixa' | 'isento' | 'acoes_fii' | 'custom';

// Tabela regressiva do IR da renda fixa: a alíquota cai conforme o dinheiro
// fica mais tempo aplicado (prazo em dias desde o aporte até o resgate).
export function rendaFixaIRRate(days: number): number {
  if (days <= 180) return 0.225;  // até 6 meses
  if (days <= 360) return 0.20;   // 6 a 12 meses
  if (days <= 720) return 0.175;  // 1 a 2 anos
  return 0.15;                     // acima de 2 anos
}

// Resultado de um resgate: valor bruto, o que foi aportado, o rendimento bruto,
// o IR estimado e o valor líquido que de fato fica no bolso.
export interface Redemption {
  gross: number;         // patrimônio bruto no resgate
  contributed: number;   // total aportado (valor inicial + aportes)
  grossInterest: number; // rendimento bruto (gross - contributed)
  tax: number;           // IR estimado no resgate
  net: number;           // valor líquido (gross - tax)
  effectiveRate: number; // alíquota efetiva de IR sobre o rendimento (0..1)
}

// Calcula o resgate no mês N com o IR correto. Para renda fixa, aplica a tabela
// regressiva APORTE POR APORTE: cada aporte tem um prazo diferente até o resgate,
// então o IR é calculado sobre o rendimento de cada um com a alíquota do seu prazo
// (o jeito real; aplicar uma alíquota única ao total seria aproximado).
export function computeRedemption(params: {
  principal: number;
  monthlyContribution: number;
  monthlyRate: number;
  months: number;
  taxType: TaxType;
  customRate?: number; // alíquota fixa (0..1) quando taxType === 'custom'
}): Redemption {
  const { principal, monthlyContribution, monthlyRate, months, taxType, customRate = 0 } = params;
  const series = projectCompound({ principal, monthlyContribution, monthlyRate, months });
  const final = series[series.length - 1];
  const gross = final.total;
  const contributed = final.contributed;
  const grossInterest = gross - contributed;

  let tax = 0;
  if (taxType === 'isento') {
    tax = 0;
  } else if (taxType === 'custom') {
    // Alíquota fixa do usuário sobre o rendimento.
    tax = Math.max(0, grossInterest) * customRate;
  } else if (taxType === 'acoes_fii') {
    // Simplificação: 15% sobre o ganho total (ações; FII fica próximo disso).
    tax = Math.max(0, grossInterest) * 0.15;
  } else {
    // Renda fixa: IR regressivo por aporte.
    // O valor inicial ficou aplicado o período inteiro (months).
    if (principal > 0) {
      const gain = principal * Math.pow(1 + monthlyRate, months) - principal;
      if (gain > 0) tax += gain * rendaFixaIRRate(months * 30);
    }
    // Cada aporte do mês m rende por (months - m) meses até o resgate.
    for (let m = 1; m <= months; m++) {
      const term = months - m;
      const gain = monthlyContribution * Math.pow(1 + monthlyRate, term) - monthlyContribution;
      if (gain > 0) tax += gain * rendaFixaIRRate(term * 30);
    }
  }

  const net = gross - tax;
  const effectiveRate = grossInterest > 0 ? tax / grossInterest : 0;
  return { gross, contributed, grossInterest, tax, net, effectiveRate };
}

// Um ponto da projeção já com o líquido (quanto ficaria no bolso se resgatasse
// naquele mês, descontado o IR) e o IR daquele resgate.
export interface ProjectionTaxPoint {
  month: number;
  gross: number;         // patrimônio bruto acumulado
  contributed: number;   // total aportado até o mês
  net: number;           // líquido após IR, se resgatasse neste mês
  tax: number;           // IR devido se resgatasse neste mês
  effectiveRate: number; // alíquota efetiva de IR neste mês (0..1)
}

// Projeta mês a mês já considerando o IR no resgate de cada mês. Serve para o
// gráfico mostrar a curva bruta e a líquida, e para a tabela exibir o IR de
// cada mês — que muda conforme o prazo (regressivo na renda fixa).
export function projectWithTax(params: {
  principal: number;
  monthlyContribution: number;
  monthlyRate: number;
  months: number;
  taxType: TaxType;
  customRate?: number;
}): ProjectionTaxPoint[] {
  const { principal, monthlyContribution, monthlyRate, months, taxType, customRate = 0 } = params;
  const points: ProjectionTaxPoint[] = [];
  for (let m = 0; m <= months; m++) {
    const r = computeRedemption({ principal, monthlyContribution, monthlyRate, months: m, taxType, customRate });
    points.push({ month: m, gross: r.gross, contributed: r.contributed, net: r.net, tax: r.tax, effectiveRate: r.effectiveRate });
  }
  return points;
}

// Descobre em quantos meses a meta (target) é atingida mantendo o ritmo atual.
// Retorna null quando a meta é inatingível nesse ritmo (sem aporte e sem
// rendimento, ou patrimônio que não cresce o suficiente em 100 anos).
export function monthsToReachTarget(params: {
  principal: number;
  monthlyContribution: number;
  monthlyRate: number;
  target: number;
}): number | null {
  const { principal, monthlyContribution, monthlyRate, target } = params;
  if (target <= principal) return 0; // já chegou
  if (monthlyContribution <= 0 && monthlyRate <= 0) return null; // nunca chega

  // Limite de 1200 meses (100 anos): acima disso tratamos como inatingível.
  let total = principal;
  for (let m = 1; m <= 1200; m++) {
    total = total * (1 + monthlyRate) + monthlyContribution;
    if (total >= target) return m;
  }
  return null;
}

// Soma uma quantidade de meses a uma data e devolve o resultado (para mostrar
// "você chega em mai/2028" a partir de "faltam 19 meses").
export function addMonthsToToday(months: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}
