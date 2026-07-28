// ============================================================================
// useTrackingHistory.ts  —  HISTORICO DE ACOMPANHAMENTO DIARIO
// ----------------------------------------------------------------------------
// Busca no Supabase os registros diarios de acompanhamento (habitos/humor/etc)
// dos ultimos N dias (padrao 14). Usado em graficos e resumos de evolucao.
// ============================================================================

// Ferramentas do React, conexao com o Supabase, usuario logado, utilitarios de
// data e o molde (formato) de um registro diario definido em useDailyTracking.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import type { DailyTracking } from './useDailyTracking';

// Hook que devolve o historico dos ultimos "days" dias (padrao: 14).
export function useTrackingHistory(days: number = 14) {
  const { user } = useAuth();
  // Lista de registros do periodo e indicador de "carregando".
  const [trackingHistory, setTrackingHistory] = useState<DailyTracking[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca os registros do usuario entre a data inicial (hoje menos N dias) e
  // hoje, em ordem crescente de data (do mais antigo para o mais recente).
  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    // Se deu erro, registra no console; senao, guarda os dados recebidos.
    if (error) {
      console.error('Error fetching tracking history:', error);
    } else {
      setTrackingHistory((data || []) as DailyTracking[]);
    }

    setLoading(false);
  }, [user, days]);

  // Ao abrir a tela (ou mudar usuario/quantidade de dias), busca o historico.
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Entrega o historico, o estado de carregamento e uma funcao para rebuscar.
  return {
    trackingHistory,
    loading,
    refetch: fetchHistory,
  };
}
