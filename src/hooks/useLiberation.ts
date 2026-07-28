import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export function useLiberation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const createChallenge = useMutation({
    mutationFn: async (input: { title: string; intention_level: string; icon: string; vice_strategy_id?: string; triggers: { type: string; value: string }[] }) => {
      const { data, error } = await supabase
        .from('liberation_challenges')
        .insert({ user_id: user!.id, title: input.title, intention_level: input.intention_level, icon: input.icon })
        .select()
        .single();
      if (error) throw error;

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liberation-challenges'] }),
  });

  const updateChallenge = useMutation({
    mutationFn: async (input: { id: string; title?: string; intention_level?: string; icon?: string; status?: string }) => {
      const { id, ...updates } = input;
      const { error } = await supabase.from('liberation_challenges').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liberation-challenges'] }),
  });

  const deleteChallenge = useMutation({
    mutationFn: async (id: string) => {
      // Delete related data first
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
