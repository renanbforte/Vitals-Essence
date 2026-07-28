// ============================================================================
// useLifeGoals.ts  —  METAS/OBJETIVOS DE VIDA
// ----------------------------------------------------------------------------
// Hook que gerencia as metas de vida do usuario (viagens, carreira, saude etc.):
// listar, criar, editar, excluir e alternar entre "em andamento" e "concluida".
// Le e grava tudo na tabela life_goals do Supabase.
// ============================================================================

// Ferramentas do React, o cliente do banco Supabase e quem esta logado.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Estados possiveis de uma meta, niveis de prioridade e categorias disponiveis.
export type GoalStatus = 'nao_iniciada' | 'em_andamento' | 'concluida';
export type GoalPriority = 'baixa' | 'media' | 'alta' | null;
export type GoalCategory = 'viagem' | 'carreira' | 'saude' | 'financeiro' | 'pessoal' | 'outro';

// Formato completo de uma meta como salva no banco.
export interface LifeGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  deadline: string | null; // YYYY-MM-DD
  status: GoalStatus;
  priority: GoalPriority;
  created_at: string;
  updated_at: string;
}

// Formato dos dados que o formulario envia ao criar/editar uma meta.
export interface GoalInput {
  title: string;
  description?: string | null;
  category: GoalCategory;
  deadline?: string | null;
  status: GoalStatus;
  priority?: GoalPriority;
}

// Hook principal: entrega as metas e as acoes (criar, editar, excluir) para as telas.
export function useLifeGoals() {
  const { user } = useAuth();
  // Estados: a lista de metas e o indicador de "carregando".
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco todas as metas do usuario, da mais nova para a mais antiga.
  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('life_goals' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setGoals(data as unknown as LifeGoal[]);
    setLoading(false);
  }, [user]);

  // Ao abrir a tela (ou trocar de usuario), carrega as metas.
  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // Cria uma nova meta no banco e a insere no topo da lista exibida.
  const addGoal = useCallback(async (input: GoalInput) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('life_goals' as any)
      .insert({ ...input, user_id: user.id } as any)
      .select()
      .single();
    if (!error && data) {
      setGoals(prev => [data as unknown as LifeGoal, ...prev]);
      return data as unknown as LifeGoal;
    }
    return null;
  }, [user]);

  // Atualiza campos de uma meta existente e reflete a mudanca na lista da tela.
  const updateGoal = useCallback(async (id: string, updates: Partial<GoalInput>) => {
    const { data, error } = await supabase
      .from('life_goals' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setGoals(prev => prev.map(g => g.id === id ? (data as unknown as LifeGoal) : g));
    }
  }, []);

  // Exclui uma meta do banco e a remove da lista da tela.
  const deleteGoal = useCallback(async (id: string) => {
    await supabase.from('life_goals' as any).delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  // Alterna a meta entre concluida e em andamento (usado ao marcar/desmarcar como feita).
  const toggleComplete = useCallback(async (goal: LifeGoal) => {
    const newStatus: GoalStatus = goal.status === 'concluida' ? 'em_andamento' : 'concluida';
    await updateGoal(goal.id, { status: newStatus });
  }, [updateGoal]);

  // Entrega para as telas a lista de metas, o estado de carregamento e as acoes.
  return { goals, loading, addGoal, updateGoal, deleteGoal, toggleComplete, refetch: fetchGoals };
}
