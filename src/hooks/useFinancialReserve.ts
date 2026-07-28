import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';
import type { CostCenter } from '@/hooks/useFinancialFlow';

export function useFinancialReserve(transactions: FinancialTransaction[], costCenters: CostCenter[]) {
  const { user } = useAuth();
  const [manualReserve, setManualReserve] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Find the "Reserva" cost center ID(s) for this user
  const reservaCenterIds = useMemo(() => {
    return costCenters
      .filter(cc => cc.name.toLowerCase() === 'reserva')
      .map(cc => cc.id);
  }, [costCenters]);

  // Transactions categorized as "Reserva" that are paid
  const reserveTransactions = useMemo(() => {
    if (reservaCenterIds.length === 0) return [];
    return transactions.filter(
      t => t.paid && t.cost_center_id && reservaCenterIds.includes(t.cost_center_id)
    );
  }, [transactions, reservaCenterIds]);

  // Auto reserve = income with Reserva category - expenses with Reserva category
  const autoReserve = useMemo(() => {
    return reserveTransactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      return t.type === 'income' ? sum + amount : sum - amount;
    }, 0);
  }, [reserveTransactions]);

  const totalReserve = manualReserve + autoReserve;

  // Fetch manual reserve from financial_safety
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

  useEffect(() => {
    fetchReserve();
  }, [fetchReserve]);

  const updateManualReserve = useCallback(async (amount: number) => {
    if (!user) return;
    setManualReserve(amount);

    await supabase
      .from('financial_safety')
      .upsert(
        { user_id: user.id, reserve_amount: amount, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }, [user]);

  return {
    manualReserve,
    autoReserve,
    totalReserve,
    reservaCenterIds,
    loading,
    updateManualReserve,
  };
}
