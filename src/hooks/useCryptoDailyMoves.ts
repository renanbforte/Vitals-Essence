import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export function useCryptoDailyMoves() {
  const { user } = useAuth();
  const [moves, setMoves] = useState<CryptoDailyMove[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetch(); }, [fetch]);

  const deleteMove = async (id: string) => {
    if (!user) return;
    await supabase.from('crypto_daily_moves').delete().eq('id', id).eq('user_id', user.id);
    fetch();
  };

  return { moves, loading, deleteMove, refetch: fetch };
}
