import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<CryptoStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
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

  useEffect(() => { fetch(); }, [fetch]);

  const deleteStrategy = async (id: string) => {
    if (!user) return;
    await supabase.from('crypto_strategies').delete().eq('id', id).eq('user_id', user.id);
    fetch();
  };

  return { strategies, loading, deleteStrategy, refetch: fetch };
}
