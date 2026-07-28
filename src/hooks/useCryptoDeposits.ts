import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CryptoDeposit {
  id: string;
  date: string;
  added_brl: number;
  added_usd: number;
  added_ia: number;
  exchange: string;
  created_at: string;
}

export function useCryptoDeposits() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<CryptoDeposit[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetch(); }, [fetch]);

  const deleteDeposit = async (id: string) => {
    if (!user) return;
    await supabase.from('crypto_deposits').delete().eq('id', id).eq('user_id', user.id);
    fetch();
  };

  const totalBrl = useMemo(() => deposits.reduce((s, d) => s + Number(d.added_brl), 0), [deposits]);
  const totalUsd = useMemo(() => deposits.reduce((s, d) => s + Number(d.added_usd), 0), [deposits]);
  const totalIa = useMemo(() => deposits.reduce((s, d) => s + Number(d.added_ia), 0), [deposits]);

  return { deposits, loading, deleteDeposit, totalBrl, totalUsd, totalIa, refetch: fetch };
}
