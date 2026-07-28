// ============================================================================
// useCryptoDailyMoves.ts  —  MOVIMENTOS DIÁRIOS DE CRIPTOMOEDAS
// ----------------------------------------------------------------------------
// Hook que busca no Supabase os registros diários de operações em cripto do
// usuário (posições short/long, preços, lucro/prejuízo). Usado nas telas de
// acompanhamento de investimentos. Também permite excluir um registro.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato de um "movimento diário" de cripto como vem salvo no banco: guarda os
// dados da operação vendida (short) e comprada (long), preços e resultados.
export interface CryptoDailyMove {
  id: string;
  date: string;
  time: string | null;
  coin: string;
  short_qty: number | null;
  short_entry_price: number | null;
  short_current_price: number | null;
  short_pnl_usd: number | null;
  short_pnl_pct: number | null;
  short_leverage: number | null;
  short_initial_margin: number | null;
  short_maintenance_margin: number | null;
  short_status: string | null;
  long_qty: number | null;
  long_entry_price: number | null;
  long_current_price: number | null;
  long_pnl_usd: number | null;
  long_pnl_pct: number | null;
  long_leverage: number | null;
  long_initial_margin: number | null;
  long_maintenance_margin: number | null;
  long_status: string | null;
  total_pnl_coin_usdt: number | null;
  total_value_coin_usdt: number | null;
  usd_brl_rate: number | null;
  methodology: string | null;
  exchange: string;
  created_at: string;
}

// Hook principal: entrega a lista de movimentos e a ação de excluir.
export function useCryptoDailyMoves() {
  const { user } = useAuth();
  // Estados locais: lista de movimentos e indicador de "carregando".
  const [moves, setMoves] = useState<CryptoDailyMove[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco os movimentos do usuário, mais recentes primeiro,
  // limitado a 200 registros. Só roda se houver usuário logado.
  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crypto_daily_moves')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(200);
    if (!error) setMoves((data || []) as CryptoDailyMove[]);
    setLoading(false);
  }, [user]);

  // Carrega os dados assim que o hook é montado (e quando fetch mudar).
  useEffect(() => { fetch(); }, [fetch]);

  // Exclui um movimento pelo id (garantindo que pertence ao usuário) e recarrega.
  const deleteMove = async (id: string) => {
    if (!user) return;
    await supabase.from('crypto_daily_moves').delete().eq('id', id).eq('user_id', user.id);
    fetch();
  };

  // Expõe para as telas: os dados, o "carregando", excluir e recarregar.
  return { moves, loading, deleteMove, refetch: fetch };
}
