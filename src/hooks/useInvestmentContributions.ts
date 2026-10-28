// ============================================================================
// useInvestmentContributions.ts  —  APORTES REAIS DO FLUXO, POR INVESTIMENTO
// ----------------------------------------------------------------------------
// Lê os aportes de fato agendados no Fluxo (lançamentos ligados à série
// recorrente de cada investimento) e monta, para cada investimento, quanto será
// aportado em cada mês futuro do horizonte. Assim a projeção reflete a realidade:
// se o usuário apaga aportes a partir de uma data no Fluxo, a projeção cai junto.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, format } from 'date-fns';
import type { Investment } from '@/hooks/useInvestments';

// Mapa: id do investimento → vetor com o aporte de cada mês (índice 0..months).
export type ContributionMap = Record<string, number[]>;

export function useInvestmentContributions(investments: Investment[], months: number): ContributionMap {
  const { user } = useAuth();
  const [map, setMap] = useState<ContributionMap>({});

  // Só investimentos reais com série recorrente ligada têm aportes a ler.
  const linked = investments.filter(i => !i.is_simulated && i.recurring_tx_id);
  const recurringIds = linked.map(i => i.recurring_tx_id as string);
  const key = recurringIds.join(',');

  useEffect(() => {
    if (!user || recurringIds.length === 0) { setMap({}); return; }
    let cancelled = false;
    (async () => {
      const monthStart = startOfMonth(new Date());
      // Lançamentos da série (o pai ou os filhos) a partir deste mês, AINDA NÃO
      // pagos: o aporte já pago virou principal (Capital operacional), então
      // projetá-lo de novo como aporte futuro o contaria duas vezes.
      const { data } = await supabase
        .from('financial_transactions')
        .select('amount, date, id, parent_transaction_id')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .eq('paid', false)
        .or(`id.in.(${key}),parent_transaction_id.in.(${key})`)
        .gte('date', format(monthStart, 'yyyy-MM-dd'));
      if (cancelled) return;

      // id da série recorrente → id do investimento.
      const invByRecurring = new Map(linked.map(i => [i.recurring_tx_id as string, i.id]));
      const result: ContributionMap = {};
      for (const inv of linked) result[inv.id] = new Array(months + 1).fill(0);

      for (const t of data || []) {
        const rtx = (t.parent_transaction_id as string) || (t.id as string);
        const invId = invByRecurring.get(rtx);
        if (!invId) continue;
        const d = new Date((t.date as string) + 'T00:00:00');
        // Offset de meses a partir de hoje (o mês atual conta como mês 1).
        let m = (d.getFullYear() - monthStart.getFullYear()) * 12 + (d.getMonth() - monthStart.getMonth());
        if (m < 1) m = 1;
        if (m <= months) result[invId][m] += Number(t.amount) || 0;
      }
      setMap(result);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, key, months]);

  return map;
}
