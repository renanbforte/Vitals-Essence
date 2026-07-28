// ============================================================================
// useCryptoSnapshots.ts  —  FOTOGRAFIAS (SNAPSHOTS) DA CARTEIRA CRIPTO
// ----------------------------------------------------------------------------
// Hook que busca, cria e exclui no Supabase "snapshots": fotos do estado da
// carteira de cripto num momento (saldo, margem, lucro/prejuízo). Também calcula
// o saldo mais recente por corretora e totais consolidados para o patrimônio.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Formato de um snapshot como vem salvo no banco (fotografia da carteira).
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

// Formato dos dados que a tela envia para criar um snapshot (campos opcionais
// têm valor padrão no banco, por isso alguns aparecem com "?").
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

// Hook principal: entrega os snapshots, os totais e as ações de criar/excluir.
export function useCryptoSnapshots() {
  const { user } = useAuth();
  const { toast } = useToast(); // Para mostrar avisos de sucesso/erro na tela.
  // Estados locais: lista de snapshots e indicador de "carregando".
  const [snapshots, setSnapshots] = useState<CryptoSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco os snapshots do usuário, mais recentes primeiro,
  // limitado a 100 registros. Só roda se houver usuário logado.
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

  // Carrega os dados assim que o hook é montado (e quando fetchSnapshots mudar).
  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  // Cria um novo snapshot no banco; avisa sucesso ou erro e recarrega a lista.
  const addSnapshot = async (input: CryptoSnapshotInput) => {
    if (!user) return;
    const { error } = await supabase.from('crypto_snapshots').insert({
      user_id: user.id,
      ...input,
    });
    if (error) toast({ title: 'Erro ao criar snapshot', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Snapshot registrado' }); fetchSnapshots(); }
  };

  // Exclui um snapshot pelo id (garantindo que é do usuário); avisa e recarrega.
  const deleteSnapshot = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('crypto_snapshots').delete().eq('id', id).eq('user_id', user.id);
    if (error) toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Snapshot excluído' }); fetchSnapshots(); }
  };

  // Pega apenas o snapshot mais recente de cada combinação corretora + tipo de
  // conta. Como a lista já vem ordenada por data, o primeiro visto é o mais novo.
  const latestByExchange = useMemo(() => {
    const map = new Map<string, CryptoSnapshot>();
    for (const s of snapshots) {
      const key = `${s.exchange}-${s.account_type}`;
      if (!map.has(key)) map.set(key, s);
    }
    return Array.from(map.values());
  }, [snapshots]);

  // Totais consolidados a partir dos snapshots mais recentes: patrimônio total
  // em dólar e lucro/prejuízo total em dólar.
  const totalEquityUsd = useMemo(() => latestByExchange.reduce((s, c) => s + Number(c.equity_usd), 0), [latestByExchange]);
  const totalPnlUsd = useMemo(() => latestByExchange.reduce((s, c) => s + Number(c.total_pnl_usd), 0), [latestByExchange]);
  // Cotação média do dólar entre os snapshots recentes (usa 5 como padrão se
  // não houver nenhum), para converter os valores em reais.
  const avgRate = useMemo(() => {
    if (latestByExchange.length === 0) return 5;
    return latestByExchange.reduce((s, c) => s + Number(c.usd_brl_rate), 0) / latestByExchange.length;
  }, [latestByExchange]);

  // Expõe para as telas: dados, totais consolidados e ações de criar/excluir.
  return {
    snapshots, loading, latestByExchange, totalEquityUsd, totalPnlUsd, avgRate,
    addSnapshot, deleteSnapshot, refetch: fetchSnapshots,
  };
}
