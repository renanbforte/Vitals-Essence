// ============================================================================
// useMarketRates.ts  —  TAXAS DE MERCADO (CDI / IPCA) POR USUÁRIO
// ----------------------------------------------------------------------------
// Guarda as taxas de referência (CDI e IPCA, % a.a.) que o app usa para
// converter "100% do CDI" e "IPCA + x%" em taxa real. Busca online no Banco
// Central (Selic meta → CDI; IPCA 12 meses) e deixa ajustar manualmente — se a
// busca falhar (sem internet / CORS), os valores manuais continuam valendo.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MarketRates } from '@/lib/fixedIncome';

// Valores padrão enquanto o usuário não salva/busca nada.
const DEFAULTS: MarketRates = { cdi: 10.65, ipca: 4.5 };

// Busca uma série do Banco Central (último valor). Retorna número ou null.
async function fetchSgs(series: number): Promise<number | null> {
  try {
    const res = await fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados/ultimos/1?formato=json`);
    if (!res.ok) return null;
    const data = await res.json();
    const valor = data?.[0]?.valor;
    const n = valor != null ? parseFloat(String(valor).replace(',', '.')) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null; // sem internet ou bloqueio de CORS → cai no manual
  }
}

export function useMarketRates() {
  const { user } = useAuth();
  const [rates, setRates] = useState<MarketRates>(DEFAULTS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  // Carrega a linha do usuário (ou mantém os padrões se ainda não houver).
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_market_rates')
      .select('cdi_annual, ipca_annual, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setRates({ cdi: Number(data.cdi_annual), ipca: Number(data.ipca_annual) });
      setUpdatedAt(data.updated_at);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Salva (upsert) as taxas informadas.
  const save = useCallback(async (next: MarketRates) => {
    if (!user) return;
    setRates(next);
    const nowISO = new Date().toISOString();
    setUpdatedAt(nowISO);
    await supabase.from('user_market_rates').upsert({
      user_id: user.id,
      cdi_annual: next.cdi,
      ipca_annual: next.ipca,
      updated_at: nowISO,
    });
  }, [user]);

  // Tenta atualizar pelo Banco Central: Selic meta (432) → CDI ≈ Selic − 0,1;
  // IPCA acumulado 12 meses (13522). Salva o que conseguir; devolve se deu certo.
  const refreshOnline = useCallback(async (): Promise<boolean> => {
    setFetching(true);
    const [selic, ipca12] = await Promise.all([fetchSgs(432), fetchSgs(13522)]);
    setFetching(false);
    if (selic == null && ipca12 == null) return false;
    const next: MarketRates = {
      cdi: selic != null ? Math.max(0, selic - 0.1) : rates.cdi,
      ipca: ipca12 != null ? ipca12 : rates.ipca,
    };
    await save(next);
    return true;
  }, [rates, save]);

  return { rates, updatedAt, loading, fetching, save, refreshOnline };
}
