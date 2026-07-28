import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BankBalance {
  id: string;
  bank_name: string;
  initial_balance: number;
}

export function useBankBalances() {
  const { user } = useAuth();
  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBankBalances = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bank_balances')
      .select('id, bank_name, initial_balance')
      .eq('user_id', user.id)
      .order('bank_name');
    if (data) setBankBalances(data.map(d => ({ ...d, initial_balance: Number(d.initial_balance) })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBankBalances();
  }, [fetchBankBalances]);

  const upsertBankBalance = async (bankName: string, initialBalance: number) => {
    if (!user) return;
    const existing = bankBalances.find(b => b.bank_name === bankName);
    if (existing) {
      await supabase
        .from('bank_balances')
        .update({ initial_balance: initialBalance })
        .eq('id', existing.id)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('bank_balances')
        .insert({ user_id: user.id, bank_name: bankName, initial_balance: initialBalance });
    }
    fetchBankBalances();
  };

  return { bankBalances, loading, upsertBankBalance, refetch: fetchBankBalances };
}
