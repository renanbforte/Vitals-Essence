import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InvestmentInsertRow = Database['public']['Tables']['investments']['Insert'];

export interface Investment {
  id: string;
  name: string;
  investment_type: string | null;
  objective: string | null;
  current_value: number;
  target_value: number;
  target_mode: string;
  operating_capital: number;
  priority: number;
  tracking_mode: string;
  is_recurring_contribution: boolean;
  recurring_amount: number | null;
  recurrence_type: string | null;
  notes: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentInput {
  name: string;
  investment_type?: string | null;
  objective?: string | null;
  target_value?: number;
  target_mode?: string;
  current_value?: number;
  operating_capital?: number;
  tracking_mode?: string;
  is_recurring_contribution?: boolean;
  recurring_amount?: number | null;
  recurrence_type?: string | null;
  notes?: string | null;
}

export interface InvestmentCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

const INVESTMENT_TYPES = [
  'Renda Fixa',
  'Ações',
  'FII',
  'Criptomoeda',
  'Tesouro Direto',
  'Poupança',
  'Previdência',
  'Outro',
];

const OBJECTIVES = [
  'Reserva de longo prazo',
  'Renda passiva',
  'Segurança',
  'Crescimento patrimonial',
  'Aposentadoria',
  'Imóvel',
  'Liberdade financeira',
  'Outro',
];

export function useInvestments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvestments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching investments:', error);
    } else {
      setInvestments((data || []) as Investment[]);
    }
    setLoading(false);
  }, [user]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('investment_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    if (data) setCategories(data);
  }, [user]);

  useEffect(() => {
    fetchInvestments();
    fetchCategories();
  }, [fetchInvestments, fetchCategories]);

  const addInvestment = async (input: InvestmentInput) => {
    if (!user) return;
    const maxPriority = investments.length > 0 ? Math.max(...investments.map(i => i.priority)) + 1 : 0;
    const row: InvestmentInsertRow = {
      user_id: user.id,
      name: input.name,
      investment_type: input.investment_type || null,
      objective: input.objective || null,
      target_value: input.target_value || 0,
      target_mode: input.target_mode || 'total',
      tracking_mode: input.tracking_mode || 'cumulative',
      is_recurring_contribution: input.is_recurring_contribution || false,
      recurring_amount: input.recurring_amount || null,
      recurrence_type: input.recurrence_type || null,
      notes: input.notes || null,
      priority: maxPriority,
      current_value: input.current_value || 0,
      operating_capital: input.operating_capital || 0,
    };
    const { error } = await supabase.from('investments').insert(row);
    if (error) {
      toast({ title: 'Erro ao criar investimento', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Investimento criado' });
      fetchInvestments();
    }
  };

  const updateInvestment = async (id: string, updates: Partial<InvestmentInput>) => {
    if (!user) return;
    const { error } = await supabase
      .from('investments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      fetchInvestments();
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;
    // Delete history first
    await supabase.from('investment_history').delete().eq('investment_id', id).eq('user_id', user.id);
    const { error } = await supabase.from('investments').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Investimento excluído' });
      fetchInvestments();
    }
  };

  const addValue = async (id: string, amount: number) => {
    if (!user) return;
    const inv = investments.find(i => i.id === id);
    if (!inv) return;

    const newValue = inv.tracking_mode === 'cumulative'
      ? Number(inv.current_value) + amount
      : amount; // 'real' mode = replace

    const { error: updateError } = await supabase
      .from('investments')
      .update({ current_value: newValue })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      toast({ title: 'Erro ao adicionar valor', description: updateError.message, variant: 'destructive' });
      return;
    }

    // Log history
    await supabase.from('investment_history').insert({
      user_id: user.id,
      investment_id: id,
      value: amount,
      type: inv.tracking_mode === 'cumulative' ? 'contribution' : 'snapshot',
    });

    toast({ title: `R$ ${amount.toFixed(2)} adicionado` });
    fetchInvestments();
  };

  const reorderInvestments = async (reordered: Investment[]) => {
    if (!user) return;
    setInvestments(reordered);
    // Update priorities in DB
    const updates = reordered.map((inv, idx) =>
      supabase.from('investments').update({ priority: idx }).eq('id', inv.id).eq('user_id', user.id)
    );
    await Promise.all(updates);
  };

  const totalInvested = useMemo(
    () => investments.reduce((sum, i) => sum + Number(i.current_value) + Number(i.operating_capital), 0),
    [investments]
  );

  const totalTarget = useMemo(
    () => investments.reduce((sum, i) => sum + Number(i.target_value), 0),
    [investments]
  );

  return {
    investments,
    categories,
    loading,
    totalInvested,
    totalTarget,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addValue,
    reorderInvestments,
    refetch: fetchInvestments,
    INVESTMENT_TYPES,
    OBJECTIVES,
  };
}
