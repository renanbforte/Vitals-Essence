// ============================================================================
// useLiberation.ts  —  DESAFIOS DE LIBERTACAO DE VICIOS
// ----------------------------------------------------------------------------
// Hook do modulo em que o usuario cria "desafios" para largar vicios e registra
// cada vontade (craving) que sentiu, com gatilhos, intensidade e resultado.
// Usa React Query para buscar/salvar no Supabase e recarregar a tela sozinho.
// ============================================================================

// React Query cuida de buscar dados (useQuery) e salvar mudancas (useMutation),
// recarregando a tela automaticamente. Supabase e o banco; useAuth diz quem esta logado.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato de um "desafio" (ex.: parar de fumar) como salvo no banco.
export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  intention_level: string;
  status: string;
  icon: string;
  vice_strategy_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Formato de um "craving" (uma vontade/impulso registrado) dentro de um desafio.
export interface Craving {
  id: string;
  challenge_id: string;
  user_id: string;
  trigger_emotions: string[];
  intensity: string;
  outcome: string;
  substitution_used: string | null;
  craving_duration_seconds: number | null;
  outcome_helpful: boolean | null;
  notes: string | null;
  created_at: string;
}

// Hook principal do modulo de libertacao: entrega os dados e as acoes para as telas.
export function useLiberation() {
  const { user } = useAuth();
  const queryClient = useQueryClient(); // usado para forcar recarga apos salvar

  // Busca todos os desafios do usuario, do mais novo para o mais antigo.
  const challengesQuery = useQuery({
    queryKey: ['liberation-challenges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liberation_challenges')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!user,
  });

  // Busca todos os registros de vontade (cravings) do usuario, do mais novo para o mais antigo.
  const cravingsQuery = useQuery({
    queryKey: ['liberation-cravings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('liberation_cravings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Craving[];
    },
    enabled: !!user,
  });

  // Cria um novo desafio e, se houver, seus gatilhos (situacoes que despertam o vicio).
  const createChallenge = useMutation({
    mutationFn: async (input: { title: string; intention_level: string; icon: string; vice_strategy_id?: string; triggers: { type: string; value: string }[] }) => {
      // Primeiro cria o desafio e recupera o registro gerado (para pegar o id).
      const { data, error } = await supabase
        .from('liberation_challenges')
        .insert({ user_id: user!.id, title: input.title, intention_level: input.intention_level, icon: input.icon })
        .select()
        .single();
      if (error) throw error;

      // Se o usuario informou gatilhos, salva todos vinculados a esse desafio.
      if (input.triggers.length > 0) {
        const triggerRows = input.triggers.map(t => ({
          challenge_id: data.id,
          user_id: user!.id,
          trigger_type: t.type,
          trigger_value: t.value,
        }));
        await supabase.from('liberation_triggers').insert(triggerRows);
      }
      return data;
    },
    // Ao terminar, recarrega a lista de desafios na tela.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liberation-challenges'] }),
  });

  // Atualiza campos de um desafio existente (titulo, nivel, icone ou status).
  const updateChallenge = useMutation({
    mutationFn: async (input: { id: string; title?: string; intention_level?: string; icon?: string; status?: string }) => {
      const { id, ...updates } = input;
      const { error } = await supabase.from('liberation_challenges').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liberation-challenges'] }),
  });

  // Exclui um desafio junto com tudo que depende dele.
  const deleteChallenge = useMutation({
    mutationFn: async (id: string) => {
      // Apaga antes os dados ligados (vontades, gatilhos e substituicoes) para nao deixar orfaos.
      await supabase.from('liberation_cravings').delete().eq('challenge_id', id);
      await supabase.from('liberation_triggers').delete().eq('challenge_id', id);
      await supabase.from('liberation_substitutions').delete().eq('challenge_id', id);
      const { error } = await supabase.from('liberation_challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liberation-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['liberation-cravings'] });
    },
  });

  // Registra uma vontade sentida: emocoes-gatilho, intensidade, o que fez e se ajudou.
  const recordCraving = useMutation({
    mutationFn: async (input: {
      challenge_id: string;
      trigger_emotions: string[];
      intensity: string;
      outcome: string;
      substitution_used?: string;
      outcome_helpful?: boolean;
    }) => {
      const { error } = await supabase.from('liberation_cravings').insert({
        ...input,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liberation-cravings'] }),
  });

  // Entrega para as telas as listas (ou vazias se ainda carregando) e as acoes.
  return {
    challenges: challengesQuery.data ?? [],
    cravings: cravingsQuery.data ?? [],
    isLoading: challengesQuery.isLoading,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    recordCraving,
  };
}
