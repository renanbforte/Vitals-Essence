// ============================================================================
// useCryptoDeposits.ts  —  DEPÓSITOS EM CRIPTOMOEDAS
// ----------------------------------------------------------------------------
// Hook que busca no Supabase os depósitos (aportes) feitos pelo usuário em
// cripto e soma os totais aplicados em reais, dólar e IA. Alimenta as telas de
// investimento e permite excluir um depósito.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato de um depósito/aporte como vem salvo no banco.
export interface CryptoDeposit {
  id: string;
  date: string;
  added_brl: number;
  added_usd: number;
  added_ia: number;
  exchange: string;
  created_at: string;
}

// Hook principal: entrega os depósitos, os totais somados e a ação de excluir.
export function useCryptoDeposits() {
  const { user } = useAuth();
  // Estados locais: lista de depósitos e indicador de "carregando".
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco os depósitos do usuário, mais recentes primeiro,
  // limitado a 200 registros. Só roda se houver usuário logado.
  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(200);
    if (!error) setDeposits((data || []) as CryptoDeposit[]);
    setLoading(false);
  }, [user]);

  // Carrega os dados assim que o hook é montado (e quando fetch mudar).
  useEffect(() => { fetch(); }, [fetch]);

  // Exclui um depósito pelo id (garantindo que é do usuário) e recarrega.
  const deleteDeposit = async (id: string) => {
    if (!user) return;
    await supabase.from('crypto_deposits').delete().eq('id', id).eq('user_id', user.id);
    fetch();
  };

  // Totais aportados, recalculados só quando a lista muda: soma em reais,
  // em dólar e em "IA" (a partir de todos os depósitos carregados).
  const totalBrl = useMemo(() => deposits.reduce((s, d) => s + Number(d.added_brl), 0), [deposits]);
  const totalUsd = useMemo(() => deposits.reduce((s, d) => s + Number(d.added_usd), 0), [deposits]);
  const totalIa = useMemo(() => deposits.reduce((s, d) => s + Number(d.added_ia), 0), [deposits]);

  // Expõe para as telas: dados, "carregando", excluir, os totais e recarregar.
  return { deposits, loading, deleteDeposit, totalBrl, totalUsd, totalIa, refetch: fetch };
}
