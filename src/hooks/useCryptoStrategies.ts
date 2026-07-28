// ============================================================================
// useCryptoStrategies  —  LISTA AS ESTRATÉGIAS DE CRIPTOMOEDAS DO USUÁRIO
// ----------------------------------------------------------------------------
// Hook que busca no Supabase as estratégias de trade de cripto salvas pelo
// usuário logado e permite apagá-las. Usado nas telas de cripto do app.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Molde (tipo) de uma estratégia de cripto: descreve todos os campos que
// vêm do banco de dados, como moeda, alavancagem, ordens e metas de lucro.
export interface CryptoStrategy {
  id: string;
  coin: string;
  strategy_name: string;
  access_code: string | null;
  created_date: string | null;
  position_type: string | null;
  long_1st_order_size: number | null;
  short_1st_order_size: number | null;
  leverage: number | null;
  long_order_layers: number | null;
  short_order_layers: number | null;
  take_profit_setting: string | null;
  long_tp_ratio: number | null;
  short_tp_ratio: number | null;
  long_trailing_tp_ratio: number | null;
  short_trailing_tp_ratio: number | null;
  long_next_order_ratios: number[] | null;
  short_next_order_ratios: number[] | null;
  long_next_order_trailing: string | null;
  short_next_order_trailing: string | null;
  stop_loss_per_coin: string | null;
  long_double_1st_order: boolean;
  short_double_1st_order: boolean;
  exchange: string;
  created_at: string;
}

export function useCryptoStrategies() {
  // Pega o usuário logado (guardado no estado global de login).
  const { user } = useAuth();
  // Lista de estratégias exibidas na tela.
  const [strategies, setStrategies] = useState<CryptoStrategy[]>([]);
  // Indica se ainda está carregando os dados (para mostrar "carregando...").
  const [loading, setLoading] = useState(true);

  // Busca no banco todas as estratégias deste usuário, das mais novas para as
  // mais antigas, limitando a 100 para não pesar. useCallback evita recriar a
  // função sem necessidade (só muda quando o usuário muda).
  const fetch = useCallback(async () => {
    if (!user) return; // Sem usuário logado, não há o que buscar.
    setLoading(true);
    const { data, error } = await supabase
      .from('crypto_strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error) setStrategies((data || []) as CryptoStrategy[]);
    setLoading(false);
  }, [user]);

  // Ao abrir a tela (ou trocar de usuário), busca os dados automaticamente.
  useEffect(() => { fetch(); }, [fetch]);

  // Apaga uma estratégia específica do usuário e recarrega a lista atualizada.
  const deleteStrategy = async (id: string) => {
    if (!user) return;
    await supabase.from('crypto_strategies').delete().eq('id', id).eq('user_id', user.id);
    fetch();
  };

  // Entrega para a tela: a lista, o status de carregamento, a função de apagar
  // e um "refetch" para recarregar manualmente quando precisar.
  return { strategies, loading, deleteStrategy, refetch: fetch };
}
