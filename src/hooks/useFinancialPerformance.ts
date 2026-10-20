// ============================================================================
// useFinancialPerformance.ts  —  DESEMPENHO FINANCEIRO MÊS A MÊS
// ----------------------------------------------------------------------------
// Monta, para uma janela de meses (passado + futuro), os números de cada mês:
// entradas, saídas, investido, saldo livre, e os acumulados (conta, investimentos
// e total). Entrega duas séries:
//   • Real      — só o que já foi pago (paid = true) + investimentos reais.
//   • Planejado — todo o plano (pago + a pagar) + investimentos reais + simulações.
// Assim a tela pode mostrar Real, Planejado ou os dois juntos.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addMonths, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Uma linha (um mês) da tabela/gráfico de desempenho.
export interface PerfRow {
  key: string;            // 'YYYY-MM'
  label: string;          // 'out/26'
  isFuture: boolean;      // mês posterior ao atual (projeção)
  entradas: number;       // entradas do mês
  saidas: number;         // saídas do mês (inclui o que foi para investimento)
  investido: number;      // quanto foi para investimento no mês
  saldoLivre: number;     // entradas - saídas (sobra livre do mês)
  acumuladoConta: number; // acumulado na conta até o mês
  acumuladoInvest: number;// acumulado em investimentos até o mês
  total: number;          // acumuladoConta + acumuladoInvest (patrimônio)
}

// Formato cru de um lançamento vindo do banco (só os campos que usamos aqui).
interface TxRow { date: string; type: string; amount: number; paid: boolean; cost_center_id: string | null }
// Formato cru de um investimento (para projetar as simulações).
interface InvRow {
  is_simulated: boolean; is_recurring_contribution: boolean;
  recurring_amount: number | null; recurrence_type: string | null;
  operating_capital: number | null; current_value: number | null; start_date: string | null;
}

// Mês de uma data no formato 'YYYY-MM'.
const monthKey = (d: Date | string) => format(typeof d === 'string' ? new Date(d + 'T00:00:00') : d, 'yyyy-MM');

// Aporte mensal equivalente de uma simulação (converte semanal/anual para mensal).
function monthlyAporte(inv: InvRow): number {
  const amt = Number(inv.recurring_amount || 0);
  if (!amt) return 0;
  switch (inv.recurrence_type) {
    case 'weeks': return amt * 52 / 12;
    case 'years': return amt / 12;
    default: return amt; // months
  }
}

export function useFinancialPerformance(backMonths: number, forwardMonths: number) {
  const { user } = useAuth();
  const [real, setReal] = useState<PerfRow[]>([]);
  const [planejado, setPlanejado] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(true);

  const build = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Lançamentos, categorias e investimentos do usuário.
    const [{ data: txns }, { data: ccs }, { data: invs }] = await Promise.all([
      supabase.from('financial_transactions').select('date, type, amount, paid, cost_center_id').eq('user_id', user.id),
      supabase.from('cost_centers').select('id, name').eq('user_id', user.id),
      supabase.from('investments').select('is_simulated, is_recurring_contribution, recurring_amount, recurrence_type, operating_capital, current_value, start_date').eq('user_id', user.id),
    ]);

    const investCCIds = new Set((ccs || []).filter(c => c.name === 'Investimentos').map(c => c.id));
    const isInvest = (t: TxRow) => t.cost_center_id != null && investCCIds.has(t.cost_center_id);

    // Janela de meses: de (mês atual - back) até (mês atual + forward).
    const base = startOfMonth(new Date());
    const months: Date[] = [];
    for (let i = -backMonths; i <= forwardMonths; i++) months.push(addMonths(base, i));
    const windowStart = months[0];
    const currentKey = monthKey(base);

    // Monta uma série (Real ou Planejado) a partir dos lançamentos filtrados.
    const buildSeries = (onlyPaid: boolean, withSimulations: boolean): PerfRow[] => {
      const rows = (txns || []) as TxRow[];
      const selected = onlyPaid ? rows.filter(t => t.paid) : rows;

      // Saldo de abertura: tudo que é anterior à janela entra como ponto de partida.
      let openConta = 0;      // acumulado na conta antes da janela
      let openInvest = 0;     // acumulado em investimentos antes da janela
      const monthly: Record<string, { entradas: number; saidas: number; investido: number }> = {};
      for (const m of months) monthly[monthKey(m)] = { entradas: 0, saidas: 0, investido: 0 };

      for (const t of selected) {
        const amount = Number(t.amount) || 0;
        const before = new Date(t.date + 'T00:00:00') < windowStart;
        const signedConta = t.type === 'income' ? amount : -amount; // efeito na conta
        const investDelta = t.type === 'expense' && isInvest(t) ? amount : 0;
        if (before) {
          openConta += signedConta;
          openInvest += investDelta;
          continue;
        }
        const k = monthKey(t.date);
        if (!monthly[k]) continue; // fora da janela (futuro além do fim)
        if (t.type === 'income') monthly[k].entradas += amount;
        else monthly[k].saidas += amount;
        monthly[k].investido += investDelta;
      }

      // Simulações: projeta os aportes planejados a partir do mês atual (só no Planejado).
      if (withSimulations) {
        for (const inv of (invs || []) as InvRow[]) {
          if (!inv.is_simulated) continue;
          const monthlyAmt = monthlyAporte(inv);
          const lump = Number(inv.operating_capital || inv.current_value || 0);
          for (const m of months) {
            const k = monthKey(m);
            const isCurrentOrFuture = k >= currentKey;
            if (!isCurrentOrFuture) continue;
            if (monthlyAmt > 0) {
              monthly[k].investido += monthlyAmt;
              monthly[k].saidas += monthlyAmt;
            } else if (k === currentKey && lump > 0) {
              monthly[k].investido += lump;
              monthly[k].saidas += lump;
            }
          }
        }
      }

      // Acumula mês a mês em cima do saldo de abertura.
      let accConta = openConta;
      let accInvest = openInvest;
      return months.map(m => {
        const k = monthKey(m);
        const b = monthly[k];
        accConta += b.entradas - b.saidas;
        accInvest += b.investido;
        return {
          key: k,
          label: format(m, 'MMM/yy', { locale: ptBR }),
          isFuture: k > currentKey,
          entradas: b.entradas,
          saidas: b.saidas,
          investido: b.investido,
          saldoLivre: b.entradas - b.saidas,
          acumuladoConta: accConta,
          acumuladoInvest: accInvest,
          total: accConta + accInvest,
        };
      });
    };

    setReal(buildSeries(true, false));       // Real: só pago, sem simulações
    setPlanejado(buildSeries(false, true));  // Planejado: tudo + simulações
    setLoading(false);
  }, [user, backMonths, forwardMonths]);

  useEffect(() => { build(); }, [build]);

  return { real, planejado, loading, refetch: build };
}
