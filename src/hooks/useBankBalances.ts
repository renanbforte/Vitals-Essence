// ============================================================================
// useBankBalances  —  SALDOS INICIAIS DAS CONTAS BANCÁRIAS DO USUÁRIO
// ----------------------------------------------------------------------------
// Hook que busca e grava no Supabase os saldos iniciais que o usuário cadastra
// para cada banco. Usado no módulo financeiro do app para saber quanto cada
// conta tinha antes de começar a registrar movimentações.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato de um registro de saldo bancário: qual banco e o valor inicial dele.
export interface BankBalance {
  id: string;
  bank_name: string;
  initial_balance: number;
}

export function useBankBalances() {
  // Usuário logado (para saber de quem são os saldos).
  const { user } = useAuth();
  // Lista de saldos guardada na memória da tela.
  const [bankBalances, setBankBalances] = useState<BankBalance[]>([]);
  // Indica se ainda está carregando os dados do banco de dados.
  const [loading, setLoading] = useState(true);

  // Busca no Supabase todos os saldos bancários do usuário, ordenados pelo nome
  // do banco. O useCallback evita recriar essa função a cada renderização.
  const fetchBankBalances = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('bank_balances')
      .select('id, bank_name, initial_balance')
      .eq('user_id', user.id)
      .order('bank_name');
    // Converte o saldo para número (o banco pode devolver como texto) e guarda.
    if (data) setBankBalances(data.map(d => ({ ...d, initial_balance: Number(d.initial_balance) })));
    setLoading(false);
  }, [user]);

  // Ao abrir a tela (ou quando o usuário muda), carrega os saldos.
  useEffect(() => {
    fetchBankBalances();
  }, [fetchBankBalances]);

  // Cria ou atualiza o saldo de um banco: se o banco já existe, atualiza o valor;
  // se não existe, cria um novo registro. Ao final, recarrega a lista.
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

  // Entrega para a tela: a lista de saldos, o status de carregamento, a função
  // de salvar/atualizar e uma função para recarregar manualmente.
  return { bankBalances, loading, upsertBankBalance, refetch: fetchBankBalances };
}
