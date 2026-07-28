// ============================================================================
// useUserMedications.ts  —  MEDICAMENTOS DO USUARIO
// ----------------------------------------------------------------------------
// Gerencia a lista de remedios do usuario: buscar, adicionar, editar e excluir.
// Cada remedio guarda nome, composicao, dosagem, horarios de uso e observacoes.
// Usado no modulo de saude do app para lembrar/organizar a medicacao.
// ============================================================================

// Ferramentas do React para estado/acoes e conexao com o Supabase e o login
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato completo de um remedio ja salvo no banco
export interface Medication {
  id: string;
  user_id: string;
  name: string;
  composition: string | null;
  dosage: string | null;
  schedule_times: string[];
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Formato dos dados enviados ao criar/editar um remedio (so nome e obrigatorio)
export interface MedicationInput {
  name: string;
  composition?: string;
  dosage?: string;
  schedule_times?: string[];
  notes?: string;
  active?: boolean;
}

// Hook que entrega a lista de remedios e as acoes para gerencia-los
export function useUserMedications() {
  const { user } = useAuth();
  // Lista de remedios exibida na tela e se ainda esta carregando
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no banco todos os remedios do usuario (mais recentes primeiro)
  const fetchMedications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_medications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMedications(data as Medication[]);
    }
    setLoading(false);
  }, [user]);

  // Adiciona um novo remedio; campos opcionais nao preenchidos ficam vazios/nulos
  // e "active" comeca como verdadeiro (remedio em uso) se nao for informado.
  const addMedication = useCallback(async (input: MedicationInput) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('user_medications')
      .insert({
        user_id: user.id,
        name: input.name,
        composition: input.composition || null,
        dosage: input.dosage || null,
        schedule_times: input.schedule_times || [],
        notes: input.notes || null,
        active: input.active ?? true,
      })
      .select()
      .single();

    // Deu certo: ja coloca o novo remedio no topo da lista sem precisar recarregar tudo
    if (!error && data) {
      setMedications(prev => [data as Medication, ...prev]);
    }

    return { error };
  }, [user]);

  // Edita um remedio existente; registra tambem a data/hora da ultima alteracao.
  // O filtro por user_id garante que so mexe nos proprios remedios do usuario.
  const updateMedication = useCallback(async (id: string, input: Partial<MedicationInput>) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('user_medications')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    // Deu certo: troca na lista o remedio antigo pela versao atualizada
    if (!error && data) {
      setMedications(prev => prev.map(m => m.id === id ? data as Medication : m));
    }

    return { error };
  }, [user]);

  // Exclui um remedio (so os do proprio usuario) e o remove da lista na tela
  const deleteMedication = useCallback(async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('user_medications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setMedications(prev => prev.filter(m => m.id !== id));
    }

    return { error };
  }, [user]);

  // Entrega para a tela: a lista, o estado de carregamento e as acoes de buscar/adicionar/editar/excluir
  return {
    medications,
    loading,
    fetchMedications,
    addMedication,
    updateMedication,
    deleteMedication,
  };
}
