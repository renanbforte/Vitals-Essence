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
interface TxRow { date: string; type: string; amount: number; is_planned: boolean; cost_center_id: string | null }

// Mês de uma data no formato 'YYYY-MM'.
const monthKey = (d: Date | string) => format(typeof d === 'string' ? new Date(d + 'T00:00:00') : d, 'yyyy-MM');

export function useFinancialPerformance(backMonths: number, forwardMonths: number) {
  const { user } = useAuth();
  const [real, setReal] = useState<PerfRow[]>([]);
  const [planejado, setPlanejado] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(true);

  const build = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Lançamentos e categorias do usuário. As simulações entram como lançamentos
    // planejados (criados ao cadastrar a simulação), então não precisam de projeção
    // separada aqui.
    const [{ data: txns }, { data: ccs }] = await Promise.all([
      supabase.from('financial_transactions').select('date, type, amount, is_planned, cost_center_id').eq('user_id', user.id),
      supabase.from('cost_centers').select('id, name').eq('user_id', user.id),
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
    // excludePlanned = true -> só os reais; false -> tudo (reais + planejados).
    const buildSeries = (excludePlanned: boolean): PerfRow[] => {
      const rows = (txns || []) as TxRow[];
      const selected = excludePlanned ? rows.filter(t => !t.is_planned) : rows;

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

    setReal(buildSeries(true));       // Real: só lançamentos reais
    setPlanejado(buildSeries(false)); // Planejado: reais + planejados (inclui simulações)
    setLoading(false);
  }, [user, backMonths, forwardMonths]);

  useEffect(() => { build(); }, [build]);

  return { real, planejado, loading, refetch: build };
}
