// ============================================================================
// finance.ts  —  UTILITÁRIOS DO MÓDULO FINANCEIRO
// ----------------------------------------------------------------------------
// Funções compartilhadas pelas telas do Financeiro: formatação de moeda e o
// cálculo do "saldo real" (saldo inicial dos bancos + o que já foi pago/recebido),
// para que o hero de topo e o detalhamento por banco usem a MESMA conta.
// ============================================================================
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';
import type { BankBalance } from '@/hooks/useBankBalances';

// Formata um número como dinheiro em Real brasileiro (ex.: 1234.5 -> "R$ 1.234,50").
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Versão compacta para espaços pequenos (ex.: "R$ 12 mil", "R$ 1,2 mi").
export function formatCurrencyCompact(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
  }).format(value);
}

// Calcula o saldo real total: soma o saldo inicial de todos os bancos com o que
// já foi efetivamente pago/recebido, ignorando as categorias indicadas (ex.: a
// "Reserva", que é contada separadamente). É a mesma conta do detalhamento por
// banco, só que somada de uma vez.
export function computeRealBalance(
  transactions: FinancialTransaction[],
  bankBalances: BankBalance[],
  excludeCostCenterIds: string[] = []
): number {
  const paid = transactions.filter(
    t => t.paid && (!t.cost_center_id || !excludeCostCenterIds.includes(t.cost_center_id))
  );
  const initial = bankBalances.reduce((s, b) => s + Number(b.initial_balance), 0);
  const income = paid.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = paid.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  return initial + income - expense;
}
