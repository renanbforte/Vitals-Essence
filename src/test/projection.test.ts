// ============================================================================
// projection.test.ts  —  TESTES DA MATEMÁTICA DE JUROS COMPOSTOS
// ----------------------------------------------------------------------------
// Garante que as funções puras de projeção calculam certo: conversão de taxa
// anual↔mensal, a série mês a mês (comparada com a fórmula fechada
// VF = P(1+i)^n + A·((1+i)^n − 1)/i) e o cálculo de "em quantos meses chego".
// ============================================================================
import { describe, it, expect } from 'vitest';
import {
  annualToMonthlyRate,
  monthlyToAnnualRate,
  projectCompound,
  monthsToReachTarget,
  rendaFixaIRRate,
  computeRedemption,
  projectWithTax,
} from '@/lib/projection';

describe('annualToMonthlyRate', () => {
  it('converte 12% a.a. em ~0,9489% a.m. (equivalência composta, não 1%)', () => {
    expect(annualToMonthlyRate(0.12)).toBeCloseTo(0.009489, 5);
  });

  it('taxa zero continua zero', () => {
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('é a inversa de monthlyToAnnualRate', () => {
    const annual = 0.1075; // 10,75% a.a.
    expect(monthlyToAnnualRate(annualToMonthlyRate(annual))).toBeCloseTo(annual, 10);
  });
});

describe('projectCompound', () => {
  it('bate com a fórmula fechada VF = P(1+i)^n + A·((1+i)^n − 1)/i', () => {
    const P = 10000;   // valor inicial
    const A = 500;     // aporte mensal
    const i = 0.01;    // 1% ao mês
    const n = 24;      // 2 anos

    const series = projectCompound({ principal: P, monthlyContribution: A, monthlyRate: i, months: n });
    const closedForm = P * Math.pow(1 + i, n) + A * ((Math.pow(1 + i, n) - 1) / i);

    expect(series[series.length - 1].total).toBeCloseTo(closedForm, 6);
  });

  it('gera n+1 pontos, começando no mês 0 com o valor inicial e sem juros', () => {
    const series = projectCompound({ principal: 1000, monthlyContribution: 100, monthlyRate: 0.01, months: 12 });
    expect(series).toHaveLength(13);
    expect(series[0]).toEqual({ month: 0, total: 1000, contributed: 1000, interest: 0 });
  });

  it('com taxa zero, o total é só o dinheiro colocado (sem juros)', () => {
    const series = projectCompound({ principal: 1000, monthlyContribution: 200, monthlyRate: 0, months: 10 });
    const last = series[series.length - 1];
    expect(last.total).toBeCloseTo(1000 + 200 * 10, 10);
    expect(last.interest).toBeCloseTo(0, 10);
  });

  it('separa corretamente o contribuído do juro em cada ponto', () => {
    const series = projectCompound({ principal: 5000, monthlyContribution: 300, monthlyRate: 0.008, months: 36 });
    for (const p of series) {
      expect(p.total).toBeCloseTo(p.contributed + p.interest, 8);
      expect(p.contributed).toBeCloseTo(5000 + 300 * p.month, 8);
    }
  });
});

describe('monthsToReachTarget', () => {
  it('retorna 0 quando a meta já foi atingida', () => {
    expect(monthsToReachTarget({ principal: 5000, monthlyContribution: 0, monthlyRate: 0, target: 5000 })).toBe(0);
    expect(monthsToReachTarget({ principal: 6000, monthlyContribution: 0, monthlyRate: 0, target: 5000 })).toBe(0);
  });

  it('retorna null quando nunca chega (sem aporte e sem rendimento)', () => {
    expect(monthsToReachTarget({ principal: 1000, monthlyContribution: 0, monthlyRate: 0, target: 2000 })).toBeNull();
  });

  it('sem juros: R$ 1.000 + R$ 100/mês chega a R$ 2.000 em 10 meses', () => {
    expect(monthsToReachTarget({ principal: 1000, monthlyContribution: 100, monthlyRate: 0, target: 2000 })).toBe(10);
  });

  it('com juros chega ANTES do que sem juros', () => {
    const semJuros = monthsToReachTarget({ principal: 10000, monthlyContribution: 500, monthlyRate: 0, target: 50000 })!;
    const comJuros = monthsToReachTarget({ principal: 10000, monthlyContribution: 500, monthlyRate: 0.01, target: 50000 })!;
    expect(comJuros).toBeLessThan(semJuros);
  });

  it('o mês devolvido é exatamente o primeiro em que a projeção cruza a meta', () => {
    const target = 20000;
    const params = { principal: 10000, monthlyContribution: 400, monthlyRate: 0.005 };
    const months = monthsToReachTarget({ ...params, target })!;
    const series = projectCompound({ ...params, months });
    expect(series[months].total).toBeGreaterThanOrEqual(target);   // nesse mês, chegou
    expect(series[months - 1].total).toBeLessThan(target);         // no anterior, ainda não
  });
});

describe('rendaFixaIRRate (tabela regressiva)', () => {
  it('aplica as faixas corretas por prazo em dias', () => {
    expect(rendaFixaIRRate(30)).toBe(0.225);   // até 180 dias
    expect(rendaFixaIRRate(180)).toBe(0.225);
    expect(rendaFixaIRRate(181)).toBe(0.20);   // 181-360
    expect(rendaFixaIRRate(360)).toBe(0.20);
    expect(rendaFixaIRRate(361)).toBe(0.175);  // 361-720
    expect(rendaFixaIRRate(720)).toBe(0.175);
    expect(rendaFixaIRRate(721)).toBe(0.15);   // acima de 2 anos
    expect(rendaFixaIRRate(3650)).toBe(0.15);
  });
});

describe('computeRedemption (IR no resgate)', () => {
  const base = { principal: 0, monthlyContribution: 4050, monthlyRate: annualToMonthlyRate(0.10) };

  it('isento: não cobra IR, líquido = bruto', () => {
    const r = computeRedemption({ ...base, months: 120, taxType: 'isento' });
    expect(r.tax).toBe(0);
    expect(r.net).toBeCloseTo(r.gross, 6);
  });

  it('ações/FII: 15% sobre o ganho', () => {
    const r = computeRedemption({ ...base, months: 120, taxType: 'acoes_fii' });
    expect(r.tax).toBeCloseTo(r.grossInterest * 0.15, 6);
  });

  it('valida o cenário da tela: R$ 4.050/mês, 10% a.a., 10 anos', () => {
    const r = computeRedemption({ ...base, months: 120, taxType: 'renda_fixa' });
    // Bruto e aportado batem com o que a tela mostrava
    expect(r.gross).toBeGreaterThan(805000);
    expect(r.gross).toBeLessThan(815000);
    expect(r.contributed).toBeCloseTo(486000, 0);
    // Em 10 anos a maior parte do rendimento cai na faixa de 15%, mas os aportes
    // recentes pagam mais — a alíquota efetiva fica entre 15% e 16%.
    expect(r.effectiveRate).toBeGreaterThan(0.15);
    expect(r.effectiveRate).toBeLessThan(0.16);
    // O líquido é menor que o bruto pelo valor do IR
    expect(r.net).toBeCloseTo(r.gross - r.tax, 6);
    expect(r.net).toBeLessThan(r.gross);
  });

  it('renda fixa: alíquota efetiva nunca passa de 22,5% nem fica abaixo de 15%', () => {
    for (const months of [3, 6, 12, 24, 60, 240]) {
      const r = computeRedemption({ ...base, months, taxType: 'renda_fixa' });
      if (r.grossInterest > 0) {
        expect(r.effectiveRate).toBeGreaterThanOrEqual(0.15 - 1e-9);
        expect(r.effectiveRate).toBeLessThanOrEqual(0.225 + 1e-9);
      }
    }
  });

  it('prazo curto é mais tributado que prazo longo (regressividade)', () => {
    const curto = computeRedemption({ ...base, months: 5, taxType: 'renda_fixa' });   // < 180 dias
    const longo = computeRedemption({ ...base, months: 120, taxType: 'renda_fixa' });
    expect(curto.effectiveRate).toBeGreaterThan(longo.effectiveRate);
  });
});

describe('projectWithTax', () => {
  it('gera a série com bruto e líquido; o líquido nunca passa o bruto', () => {
    const pts = projectWithTax({ principal: 1000, monthlyContribution: 500, monthlyRate: annualToMonthlyRate(0.10), months: 60, taxType: 'renda_fixa' });
    expect(pts).toHaveLength(61);
    expect(pts[0].net).toBeCloseTo(1000, 6);  // mês 0: só o principal, sem rendimento tributável
    for (const p of pts) {
      expect(p.net).toBeLessThanOrEqual(p.gross + 1e-6);
      expect(p.net).toBeGreaterThanOrEqual(p.contributed - p.contributed * 0.3); // líquido é razoável
    }
  });
});

describe('computeRedemption custom (alíquota editável)', () => {
  const base = { principal: 0, monthlyContribution: 500, monthlyRate: annualToMonthlyRate(0.10), months: 60 };

  it('aplica a alíquota fixa informada sobre o rendimento', () => {
    const r = computeRedemption({ ...base, taxType: 'custom', customRate: 0.175 });
    expect(r.tax).toBeCloseTo(r.grossInterest * 0.175, 6);
    expect(r.effectiveRate).toBeCloseTo(0.175, 6);
  });

  it('alíquota 0% personalizada equivale a isento', () => {
    const custom0 = computeRedemption({ ...base, taxType: 'custom', customRate: 0 });
    const isento = computeRedemption({ ...base, taxType: 'isento' });
    expect(custom0.net).toBeCloseTo(isento.net, 6);
  });
});
