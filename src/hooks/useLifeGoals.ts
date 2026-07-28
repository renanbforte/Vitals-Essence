import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GoalStatus = 'nao_iniciada' | 'em_andamento' | 'concluida';
export type GoalPriority = 'baixa' | 'media' | 'alta' | null;
export type GoalCategory = 'viagem' | 'carreira' | 'saude' | 'financeiro' | 'pessoal' | 'outro';

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

export interface GoalInput {
  title: string;
  description?: string | null;
  category: GoalCategory;
  deadline?: string | null;
  status: GoalStatus;
  priority?: GoalPriority;
}

export function useLifeGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

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

  const deleteGoal = useCallback(async (id: string) => {
    await supabase.from('life_goals' as any).delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const toggleComplete = useCallback(async (goal: LifeGoal) => {
    const newStatus: GoalStatus = goal.status === 'concluida' ? 'em_andamento' : 'concluida';
    await updateGoal(goal.id, { status: newStatus });
  }, [updateGoal]);

  return { goals, loading, addGoal, updateGoal, deleteGoal, toggleComplete, refetch: fetchGoals };
}
