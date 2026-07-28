// ============================================================================
// useFinancialReserve.ts  —  RESERVA FINANCEIRA (DINHEIRO GUARDADO)
// ----------------------------------------------------------------------------
// Calcula quanto o usuário tem de reserva somando um valor guardado manualmente
// com o que entrou/saiu na categoria "Reserva" dos lançamentos. Permite também
// atualizar o valor manual, salvo na tabela financial_safety do Supabase.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';
import type { CostCenter } from '@/hooks/useFinancialFlow';

// Recebe os lançamentos e as categorias já carregados pela tela de finanças.
export function useFinancialReserve(transactions: FinancialTransaction[], costCenters: CostCenter[]) {
  const { user } = useAuth();
  const [manualReserve, setManualReserve] = useState<number>(0); // valor guardado manualmente pelo usuário
  const [loading, setLoading] = useState(true);

  // Descobre o(s) ID(s) da categoria chamada "Reserva" deste usuário.
  const reservaCenterIds = useMemo(() => {
    return costCenters
      .filter(cc => cc.name.toLowerCase() === 'reserva')
      .map(cc => cc.id);
  }, [costCenters]);

  // Lançamentos da categoria "Reserva" que já foram efetivados (pagos).
  const reserveTransactions = useMemo(() => {
    if (reservaCenterIds.length === 0) return [];
    return transactions.filter(
      t => t.paid && t.cost_center_id && reservaCenterIds.includes(t.cost_center_id)
    );
  }, [transactions, reservaCenterIds]);

  // Reserva automática = o que entrou na categoria Reserva menos o que saiu dela.
  const autoReserve = useMemo(() => {
    return reserveTransactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return t.type === 'income' ? sum + amount : sum - amount;
    }, 0);
  }, [reserveTransactions]);

  // Reserva total mostrada ao usuário = valor manual + valor automático.
  const totalReserve = manualReserve + autoReserve;

  // Busca no banco (tabela financial_safety) o valor da reserva guardado manualmente.
  const fetchReserve = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('financial_safety')
      .select('reserve_amount')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setManualReserve(Number(data.reserve_amount) || 0);
    }
    setLoading(false);
  }, [user]);

  // Ao carregar o hook, busca o valor manual salvo.
  useEffect(() => {
    fetchReserve();
  }, [fetchReserve]);

  // Atualiza o valor manual da reserva: mostra na tela na hora e salva no banco.
  const updateManualReserve = useCallback(async (amount: number) => {
    if (!user) return;
    setManualReserve(amount);

    // upsert: cria o registro se não existir ou atualiza o existente (um por usuário).
    await supabase
      .from('financial_safety')
      .upsert(
        { user_id: user.id, reserve_amount: amount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }, [user]);

  // Entrega os valores calculados e a ação de atualizar a reserva manual.
  return {
    manualReserve,
    autoReserve,
    totalReserve,
    reservaCenterIds,
    loading,
    updateManualReserve,
  };
}
