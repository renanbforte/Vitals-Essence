// ============================================================================
// useWeightHistory  —  HISTÓRICO DE PESO DO USUÁRIO
// ----------------------------------------------------------------------------
// Este hook busca e registra o peso da pessoa ao longo do tempo (no Supabase).
// Guarda um valor por dia e, se já houver peso naquele dia, atualiza em vez de
// duplicar. Usado nos gráficos e cards de acompanhamento de peso.
// ============================================================================

// Ferramentas do React, conexão com o banco, usuário logado e formatação de datas.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Formato de um registro de peso: quando foi medido e quantos quilos.
export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

// Hook principal: entrega o histórico de peso e a ação de registrar peso.
export function useWeightHistory() {
  const { user } = useAuth();
  // Lista com todos os pesos registrados (em ordem de data).
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  // Indica se ainda está carregando os dados.
  const [loading, setLoading] = useState(true);

  // Busca no banco todo o histórico de peso do usuário, do mais antigo ao mais novo.
  const fetchWeights = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching weights:', error);
    } else {
      setWeights((data || []) as WeightEntry[]);
    }
    setLoading(false);
  }, [user]);

  // Ao usar o hook (ou trocar de usuário), carrega o histórico automaticamente.
  useEffect(() => {
    fetchWeights();
  }, [fetchWeights]);

  // Registra um peso para uma data (padrão: hoje). Evita duplicar no mesmo dia.
  const addWeight = async (weightKg: number, date?: Date) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Transforma a data no formato ano-mês-dia usado no banco.
    const dateString = format(date || new Date(), 'yyyy-MM-dd');

    // Verifica se já existe um registro de peso nesse dia.
    // Check if entry exists for this date
    const { data: existing } = await supabase
      .from('weight_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .single();

    if (existing) {
      // Já havia peso nesse dia: apenas atualiza o valor.
      // Update existing entry
      const { error } = await supabase
        .from('weight_history')
        .update({ weight_kg: weightKg })
        .eq('id', existing.id);

      if (!error) {
        await fetchWeights();
      }
      return { error };
    } else {
      // Ainda não havia peso nesse dia: cria um novo registro.
      // Insert new entry
      const { error } = await supabase
        .from('weight_history')
        .insert({
          user_id: user.id,
          date: dateString,
          weight_kg: weightKg,
        });

      if (!error) {
        await fetchWeights();
      }
      return { error };
    }
  };

  // Pega o peso mais recente (último da lista) para mostrar em destaque.
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;

  // Entrega para as telas os dados e as ações de peso.
  return {
    weights,
    loading,
    addWeight,
    latestWeight,
    refetch: fetchWeights,
  };
}
