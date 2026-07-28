import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CryptoSnapshot {
  id: string;
  date: string;
  time: string | null;
  exchange: string;
  account_type: string;
  margin_mode: string | null;
  total_positions: number;
  positions_value_usd: number;
  equity_usd: number;
  wallet_balance_usd: number;
  available_balance_usd: number;
  margin_used_usd: number;
  unrealized_pnl_usd: number;
  total_pnl_usd: number;
  total_pnl_pct: number;
  usd_brl_rate: number;
  include_in_patrimony: boolean;
  created_at: string;
}

export interface CryptoSnapshotInput {
  date: string;
  time?: string;
  exchange: string;
  account_type: string;
  margin_mode?: string;
  total_positions?: number;
  positions_value_usd?: number;
  equity_usd: number;
  wallet_balance_usd?: number;
  available_balance_usd?: number;
  margin_used_usd?: number;
  unrealized_pnl_usd?: number;
  total_pnl_usd?: number;
  total_pnl_pct?: number;
  usd_brl_rate: number;
  include_in_patrimony?: boolean;
}

export function useCryptoSnapshots() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [snapshots, setSnapshots] = useState<CryptoSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSnapshots = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('crypto_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(100);
    if (error) console.error(error);
    else setSnapshots((data || []) as CryptoSnapshot[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  const addSnapshot = async (input: CryptoSnapshotInput) => {
    if (!user) return;
    const { error } = await supabase.from('crypto_snapshots').insert({
      user_id: user.id,
      ...input,
    });
    if (error) toast({ title: 'Erro ao criar snapshot', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Snapshot registrado' }); fetchSnapshots(); }
  };

  const deleteSnapshot = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('crypto_snapshots').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Snapshot excluído' }); fetchSnapshots(); }
  };

  const latestByExchange = useMemo(() => {
    const map = new Map<string, CryptoSnapshot>();
    for (const s of snapshots) {
      const key = `${s.exchange}-${s.account_type}`;
      if (!map.has(key)) map.set(key, s);
    }
    return Array.from(map.values());
  }, [snapshots]);

  const totalEquityUsd = useMemo(() => latestByExchange.reduce((s, c) => s + Number(c.equity_usd), 0), [latestByExchange]);
  const totalPnlUsd = useMemo(() => latestByExchange.reduce((s, c) => s + Number(c.total_pnl_usd), 0), [latestByExchange]);
  const avgRate = useMemo(() => {
    if (latestByExchange.length === 0) return 5;
    return latestByExchange.reduce((s, c) => s + Number(c.usd_brl_rate), 0) / latestByExchange.length;
  }, [latestByExchange]);

  return {
    snapshots, loading, latestByExchange, totalEquityUsd, totalPnlUsd, avgRate,
    addSnapshot, deleteSnapshot, refetch: fetchSnapshots,
  };
}
