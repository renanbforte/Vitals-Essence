// ============================================================================
// useInvestmentContributions.ts  —  APORTES REAIS DO FLUXO, POR INVESTIMENTO
// ----------------------------------------------------------------------------
// Lê os aportes de fato agendados no Fluxo e monta, para cada investimento,
// quanto será aportado em cada mês futuro do horizonte. Assim a projeção reflete
// a realidade: se o usuário apaga aportes a partir de uma data no Fluxo, a
// projeção cai junto.
//
// O vínculo é feito pelo NOME ("Aporte - {nome}"), não pela cadeia pai/filho de
// transações: apagar a 1ª parcela no Fluxo pode quebrar essa cadeia (o banco
// zera o parent_transaction_id das demais), mas o nome continua batendo. Assim a
// projeção não some quando a série perde a "pai".
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

  // Investimentos reais (as simulações não entram no patrimônio real).
  const real = investments.filter(i => !i.is_simulated);
  const key = real.map(i => i.id + ':' + i.name).join('|');

  useEffect(() => {
    if (!user || real.length === 0) { setMap({}); return; }
    let cancelled = false;
    (async () => {
      const monthStart = startOfMonth(new Date());
      // Aportes AINDA NÃO pagos a partir deste mês (o pago já virou principal —
      // Capital operacional — então projetá-lo de novo o contaria duas vezes).
      const { data } = await supabase
        .from('financial_transactions')
        .select('amount, date, description')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .eq('paid', false)
        .like('description', 'Aporte - %')
        .gte('date', format(monthStart, 'yyyy-MM-dd'));
      if (cancelled) return;

      // "Aporte - {nome}" → id do investimento.
      const invByLabel = new Map(real.map(i => [`Aporte - ${i.name}`, i.id]));
      const result: ContributionMap = {};
      for (const i of real) result[i.id] = new Array(months + 1).fill(0);

      for (const t of data || []) {
        const invId = invByLabel.get(t.description as string);
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
