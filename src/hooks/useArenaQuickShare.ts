// ============================================================================
// useArenaQuickShare  —  COMPARTILHAR UM TREINO NA ARENA
// ----------------------------------------------------------------------------
// Liga o rastreador de GPS à Arena: pega um treino recém-finalizado e, num
// grupo de desafio ativo, cria um post no feed com o resumo (distância, tempo,
// ritmo) e pontua o treino do dia — preservando os pilares de hidratação e
// nutrição que já estavam registrados.
// ============================================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ActiveArenaGroup {
  id: string;
  name: string;
  avatar_url: string | null;
}

export function useArenaQuickShare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Grupos de desafio ativos do usuário (onde ele participa e que não terminaram).
  const { data: activeGroups = [] } = useQuery({
    queryKey: ['arena-active-groups', user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from('arena_members')
        .select('group_id')
        .eq('user_id', user!.id)
        .eq('status', 'accepted');
      const ids = (memberships || []).map(m => m.group_id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from('arena_groups')
        .select('id, name, avatar_url, status')
        .in('id', ids)
        .neq('status', 'ended');
      return (data || []).map(g => ({ id: g.id, name: g.name, avatar_url: g.avatar_url })) as ActiveArenaGroup[];
    },
    enabled: !!user?.id,
  });

  // Posta o treino no feed de um grupo e pontua o pilar "treino" do dia.
  const shareWorkout = useMutation({
    mutationFn: async (params: {
      groupId: string;
      content: string;       // resumo do treino (texto do post)
      workoutScore: number;  // pontuação do treino (0..100)
      date: string;          // yyyy-MM-dd
      photoUrl?: string | null;
    }) => {
      const { groupId, content, workoutScore, date, photoUrl } = params;

      // 1) Post no feed
      const { error: postErr } = await supabase.from('arena_feed_posts').insert({
        group_id: groupId,
        user_id: user!.id,
        post_type: 'workout',
        content,
        photo_url: photoUrl ?? null,
        workout_score: workoutScore,
        total_score: workoutScore,
      } as never);
      if (postErr) throw postErr;

      // 2) Pontuar o dia preservando hidratação/nutrição já registradas
      const { data: existing } = await supabase
        .from('arena_daily_scores')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', user!.id)
        .eq('date', date)
        .maybeSingle();

      const hydration = existing?.hydration_score ?? 0;
      const nutrition = existing?.nutrition_score ?? 0;
      const workout = Math.max(existing?.workout_score ?? 0, workoutScore);
      const total = Math.round((hydration + nutrition + workout) / 3);

      const { error: scoreErr } = await supabase
        .from('arena_daily_scores')
        .upsert({
          group_id: groupId,
          user_id: user!.id,
          date,
          hydration_score: hydration,
          nutrition_score: nutrition,
          workout_score: workout,
          total_score: total,
          current_streak: existing?.current_streak ?? 1,
        } as never, { onConflict: 'group_id,user_id,date' });
      if (scoreErr) throw scoreErr;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['arena-feed', vars.groupId] });
      queryClient.invalidateQueries({ queryKey: ['arena-scores', vars.groupId] });
      toast.success('Treino compartilhado na Arena!');
    },
    onError: () => toast.error('Não foi possível compartilhar na Arena'),
  });

  return { activeGroups, shareWorkout };
}
