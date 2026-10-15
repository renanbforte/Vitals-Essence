// ============================================================================
// useFinancialGoals.ts  —  METAS FINANCEIRAS DO USUÁRIO
// ----------------------------------------------------------------------------
// Hook que busca e gerencia as metas financeiras no Supabase: criar, editar,
// concluir e excluir. Cada meta tem um valor-alvo e, opcionalmente, um prazo,
// um aporte mensal planejado e uma taxa esperada — usados pela aba Metas para
// projetar quando a meta será atingida (juros compostos).
// ============================================================================

// Ferramentas do React (estados, efeitos, memorização) e o cliente do banco Supabase.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Descobre quem está logado; e mostra avisos rápidos na tela (toasts).
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Atalho para o formato de "nova linha" da tabela de metas no banco.
type GoalInsertRow = Database['public']['Tables']['financial_goals']['Insert'];

// Formato completo de uma meta como ela existe no banco.
export interface FinancialGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;            // prazo desejado (opcional)
  completed: boolean;
  investment_id: string | null;       // meta ligada a UM investimento específico (opcional)
  linked_to_portfolio: boolean;       // true = progresso acompanha o patrimônio total
  monthly_contribution: number;       // aporte mensal planejado para essa meta
  annual_rate: number;                // taxa esperada ao ano, em fração (0.10 = 10%)
  created_at: string;
  updated_at: string;
}

// Formato dos dados que o formulário envia ao criar/editar (campos opcionais).
export interface GoalInput {
  title: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string | null;
  investment_id?: string | null;
  linked_to_portfolio?: boolean;
  monthly_contribution?: number;
  annual_rate?: number;
}

// Hook principal: entrega os dados e as ações de metas para as telas.
export function useFinancialGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Estados guardados em memória: a lista de metas e o "carregando".
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco todas as metas do usuário (ativas primeiro, mais novas no topo).
  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching financial goals:', error);
    } else {
      setGoals((data || []) as FinancialGoal[]);
    }
    setLoading(false);
  }, [user]);

  // Ao abrir a tela (ou trocar de usuário), carrega as metas.
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Cria uma nova meta no banco.
  const addGoal = async (input: GoalInput) => {
    if (!user) return;
    // Monta a linha a ser salva, preenchendo valores padrão quando o campo veio vazio.
    const row: GoalInsertRow = {
      user_id: user.id,
      title: input.title,
      target_amount: input.target_amount,
      current_amount: input.current_amount ?? 0,
      deadline: input.deadline || null,
      investment_id: input.investment_id || null,
      linked_to_portfolio: input.linked_to_portfolio ?? false,
      monthly_contribution: input.monthly_contribution ?? 0,
      annual_rate: input.annual_rate ?? 0,
    };
    const { error } = await supabase.from('financial_goals').insert(row);
    if (error) {
      toast({ title: 'Erro ao criar meta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Meta criada' });
      fetchGoals();
    }
  };

  // Atualiza campos de uma meta existente (edição pelo formulário).
  const updateGoal = async (id: string, updates: Partial<GoalInput>) => {
    if (!user) return;
    const { error } = await supabase
      .from('financial_goals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar meta', description: error.message, variant: 'destructive' });
    } else {
      fetchGoals();
    }
  };

  // Marca uma meta como concluída (ou reabre, se já estava concluída).
  const toggleCompleted = async (id: string, completed: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from('financial_goals')
      .update({ completed: !completed })
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) fetchGoals();
  };

  // Exclui uma meta.
  const deleteGoal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao excluir meta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Meta excluída' });
      fetchGoals();
    }
  };

  // Entrega para as telas os dados e todas as ações disponíveis.
  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    toggleCompleted,
    deleteGoal,
    refetch: fetchGoals,
  };
}
