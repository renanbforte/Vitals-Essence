// ============================================================================
// useArena  —  GRUPOS DE DESAFIO EM GRUPO (A "ARENA" DO APP)
// ----------------------------------------------------------------------------
// Reúne os hooks da Arena: criar grupos de desafio, listar seus grupos, ver o
// detalhe de um grupo (membros, pontuações, feed, convites) e registrar a
// pontuação diária de cada membro. Tudo é lido e gravado no Supabase.
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Formato de um grupo da Arena: além de nome e datas, guarda as regras do
// desafio (quais pilares valem, se exige foto, como o ranking funciona, etc.).
export interface ArenaGroup {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  start_date: string;
  end_date: string | null;
  group_type: string;
  transparency_level: string;
  pillar_hydration: boolean;
  pillar_nutrition: boolean;
  pillar_workout: boolean;
  photo_required: boolean;
  deadline_hour: string | null;
  streak_breaks_on_fail: boolean;
  ranking_resets_weekly: boolean;
  intensity: string;
  ranking_total_score: boolean;
  ranking_evolution: boolean;
  ranking_streak: boolean;
  ranking_balance: boolean;
  calendar_show_photos: boolean;
  calendar_show_daily_score: boolean;
  calendar_members_only: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// Formato de um membro do grupo: quem é, seu papel (criador/membro) e situação
// (convite pendente ou aceito). "profile" traz nome e foto para exibir na tela.
export interface ArenaMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string | null;
  created_at: string;
  profile?: { name: string; avatar_url: string | null; user_id: string };
}

// Formato da pontuação diária de um membro em um grupo (por pilar e total),
// além da sequência atual (streak) e da foto do dia.
export interface ArenaDailyScore {
  id: string;
  group_id: string;
  user_id: string;
  date: string;
  hydration_score: number;
  nutrition_score: number;
  workout_score: number;
  total_score: number;
  current_streak: number;
  photo_url: string | null;
}

// Formato de um post no feed do grupo (comentário, foto ou registro de score),
// com o perfil de quem postou e as reações (emojis) que recebeu.
export interface ArenaFeedPost {
  id: string;
  group_id: string;
  user_id: string;
  post_type: string;
  content: string | null;
  photo_url: string | null;
  hydration_score: number | null;
  nutrition_score: number | null;
  workout_score: number | null;
  total_score: number | null;
  created_at: string;
  profile?: { name: string; avatar_url: string | null };
  reactions?: { emoji: string; user_id: string }[];
}

// Hook da lista de grupos: traz todos os grupos do usuário (que ele criou ou
// participa) e permite criar um grupo novo.
export function useArenaGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca e combina os grupos do usuário em duas partes (criados + participante).
  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['arena-groups', user?.id],
    queryFn: async () => {
      // Grupos em que o usuário é o criador.
      const { data: ownGroups } = await supabase
        .from('arena_groups')
        .select('*')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      // Grupos em que o usuário participa como membro (convite aceito).
      const { data: memberships } = await supabase
        .from('arena_members')
        .select('group_id')
        .eq('user_id', user!.id)
        .eq('status', 'accepted');

      // Com os IDs dos grupos de membro, busca os dados completos desses grupos.
      const memberGroupIds = (memberships || []).map(m => m.group_id);

      let memberGroups: any[] = [];
      if (memberGroupIds.length > 0) {
        const { data } = await supabase
          .from('arena_groups')
          .select('*')
          .in('id', memberGroupIds);
        memberGroups = data || [];
      }

      // Junta as duas listas e remove duplicados (grupo que o usuário criou E
      // participa apareceria duas vezes).
      const allGroups = [...(ownGroups || []), ...memberGroups];
      const unique = allGroups.filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i);
      return unique as ArenaGroup[];
    },
    enabled: !!user?.id,
  });

  // Cria um grupo novo e já adiciona o criador como primeiro membro (aceito).
  const createGroup = useMutation({
    mutationFn: async (group: Partial<ArenaGroup>) => {
      const { data, error } = await supabase
        .from('arena_groups')
        .insert({ ...group, creator_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;

      // Registra o criador como membro do próprio grupo.
      await supabase.from('arena_members').insert({
        group_id: data.id,
        user_id: user!.id,
        role: 'creator',
        status: 'accepted',
        joined_at: new Date().toISOString(),
      } as any);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arena-groups'] });
      toast.success('Grupo criado!');
    },
    onError: () => toast.error('Erro ao criar grupo'),
  });

  return { groups, isLoading, createGroup };
}

// Formato usado para mostrar as fotos (progresso e treino) de um membro num dia.
export interface ArenaMemberDayPhotos {
  user_id: string;
  name: string;
  avatar_url: string | null;
  progress_photos: string[];
  workout_photos: string[];
}

// Hook de detalhe de um grupo: carrega os dados do grupo, seus membros, as
// pontuações e o feed, e oferece as ações (registrar score, postar, reagir,
// convidar, editar o grupo, buscar fotos do dia).
export function useArenaGroupDetail(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca os dados do grupo em si (nome, regras, datas).
  const { data: group } = useQuery({
    queryKey: ['arena-group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arena_groups')
        .select('*')
        .eq('id', groupId!)
        .single();
      if (error) throw error;
      return data as ArenaGroup;
    },
    enabled: !!groupId,
  });

  // Busca os membros aceitos do grupo e junta o perfil (nome/foto) de cada um.
  const { data: members = [] } = useQuery({
    queryKey: ['arena-members', groupId],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from('arena_members')
        .select('*')
        .eq('group_id', groupId!)
        .eq('status', 'accepted');
      if (error) throw error;

      // Busca os perfis (nome e avatar) dos membros para exibir na tela.
      const userIds = (membersData || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      return (membersData || []).map(m => ({
        ...m,
        profile: (profiles || []).find(p => p.user_id === m.user_id),
      })) as ArenaMember[];
    },
    enabled: !!groupId,
  });

  // Busca as pontuações diárias do grupo (até 500 registros, mais recentes
  // primeiro) para montar rankings e o calendário.
  const { data: scores = [] } = useQuery({
    queryKey: ['arena-scores', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('arena_daily_scores')
        .select('*')
        .eq('group_id', groupId!)
        .order('date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as ArenaDailyScore[];
    },
    enabled: !!groupId,
  });

  // Busca os posts do feed do grupo e enriquece cada um com o perfil do autor
  // e as reações que recebeu.
  const { data: feedPosts = [] } = useQuery({
    queryKey: ['arena-feed', groupId],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('arena_feed_posts')
        .select('*')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;

      // Busca os perfis dos autores dos posts (sem repetir user_id).
      const userIds = [...new Set((posts || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      // Busca as reações de todos os posts carregados de uma vez só.
      const postIds = (posts || []).map(p => p.id);
      let reactions: any[] = [];
      if (postIds.length > 0) {
        const { data: r } = await supabase
          .from('arena_feed_reactions')
          .select('*')
          .in('post_id', postIds);
        reactions = r || [];
      }

      // Monta cada post final juntando o perfil do autor e suas reações.
      return (posts || []).map(p => ({
        ...p,
        profile: (profiles || []).find(pr => pr.user_id === p.user_id),
        reactions: reactions.filter(r => r.post_id === p.id),
      })) as ArenaFeedPost[];
    },
    enabled: !!groupId,
  });

  // Ação de registrar a pontuação do dia do usuário neste grupo (check-in manual).
  const submitDailyScore = useMutation({
    mutationFn: async (scoreData: { date: string; hydration_score: number; nutrition_score: number; workout_score: number; photo_url?: string }) => {
      // Pontuação total é a média dos três pilares.
      const total = Math.round((scoreData.hydration_score + scoreData.nutrition_score + scoreData.workout_score) / 3);

      // Pega a última pontuação para calcular a sequência (streak).
      const { data: prevScores } = await supabase
        .from('arena_daily_scores')
        .select('current_streak, date')
        .eq('group_id', groupId!)
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(1);

      // Mesma regra de sequência: dia seguinte com pontos soma +1; mesmo dia
      // mantém; caso contrário recomeça em 1.
      let streak = 1;
      if (prevScores && prevScores.length > 0) {
        const prevDate = new Date(prevScores[0].date);
        const curDate = new Date(scoreData.date);
        const diffDays = Math.floor((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1 && total > 0) {
          streak = (prevScores[0].current_streak || 0) + 1;
        } else if (diffDays === 0) {
          streak = prevScores[0].current_streak || 1;
        }
      }

      // Grava (cria ou atualiza) a pontuação do dia deste usuário no grupo.
      const { error } = await supabase
        .from('arena_daily_scores')
        .upsert({
          group_id: groupId!,
          user_id: user!.id,
          date: scoreData.date,
          hydration_score: scoreData.hydration_score,
          nutrition_score: scoreData.nutrition_score,
          workout_score: scoreData.workout_score,
          total_score: total,
          current_streak: streak,
          photo_url: scoreData.photo_url || null,
        } as any, { onConflict: 'group_id,user_id,date' });
      if (error) throw error;
    },
    // Após registrar, recarrega pontuações e feed do grupo.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arena-scores', groupId] });
      queryClient.invalidateQueries({ queryKey: ['arena-feed', groupId] });
    },
  });

  // Ação de criar um post no feed do grupo (texto, foto ou registro de score).
  const addFeedPost = useMutation({
    mutationFn: async (post: { post_type: string; content?: string; photo_url?: string; hydration_score?: number; nutrition_score?: number; workout_score?: number; total_score?: number }) => {
      const { error } = await supabase
        .from('arena_feed_posts')
        .insert({
          group_id: groupId!,
          user_id: user!.id,
          ...post,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['arena-feed', groupId] }),
  });

  // Ação de reagir a um post: se o usuário já reagiu com aquele emoji, remove a
  // reação (desfaz); se não, adiciona. Funciona como um "curtir/descurtir".
  const toggleReaction = useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      const { data: existing } = await supabase
        .from('arena_feed_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user!.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from('arena_feed_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('arena_feed_reactions').insert({
          post_id: postId,
          user_id: user!.id,
          emoji,
        } as any);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['arena-feed', groupId] }),
  });

  // Ação de convidar um amigo para o grupo: cria o membro com status "pendente"
  // até que ele aceite o convite.
  const inviteMember = useMutation({
    mutationFn: async (friendUserId: string) => {
      const { error } = await supabase
        .from('arena_members')
        .insert({
          group_id: groupId!,
          user_id: friendUserId,
          role: 'member',
          status: 'pending',
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arena-members', groupId] });
      toast.success('Convite enviado!');
    },
    onError: () => toast.error('Erro ao convidar'),
  });

  // Ação de editar as configurações do grupo (nome, regras, etc.).
  const updateGroup = useMutation({
    mutationFn: async (updates: Partial<ArenaGroup>) => {
      const { error } = await supabase
        .from('arena_groups')
        .update(updates as any)
        .eq('id', groupId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arena-group', groupId] });
      toast.success('Grupo atualizado!');
    },
  });

  // Indica se o usuário atual é o criador do grupo (habilita ações de admin).
  const isCreator = group?.creator_id === user?.id;

  // Busca as fotos (de progresso e de treino) de todos os membros em uma data,
  // para exibir no calendário do grupo. Retorna só membros que têm alguma foto.
  const fetchMemberPhotosForDate = async (date: string): Promise<ArenaMemberDayPhotos[]> => {
    if (!members.length) return [];
    const userIds = members.map(m => m.user_id);

    // Busca em paralelo: fotos de progresso, fotos de treino e perfis.
    const [{ data: progressPhotos }, { data: workoutPhotos }, { data: profiles }] = await Promise.all([
      supabase.from('progress_photos').select('user_id, photo_url').in('user_id', userIds).eq('date', date),
      supabase.from('workout_photos').select('user_id, photo_url').in('user_id', userIds).eq('date', date),
      supabase.from('profiles').select('user_id, name, avatar_url').in('user_id', userIds),
    ]);

    // Para cada membro, agrupa as fotos daquele dia junto com nome e avatar.
    return userIds.map(uid => {
      const profile = (profiles || []).find(p => p.user_id === uid);
      return {
        user_id: uid,
        name: profile?.name || 'Membro',
        avatar_url: profile?.avatar_url || null,
        progress_photos: (progressPhotos || []).filter(p => p.user_id === uid).map(p => p.photo_url),
        workout_photos: (workoutPhotos || []).filter(p => p.user_id === uid).map(p => p.photo_url),
      };
    }).filter(m => m.progress_photos.length > 0 || m.workout_photos.length > 0);
  };

  // Entrega para a tela os dados do grupo e todas as ações disponíveis.
  return {
    group,
    members,
    scores,
    feedPosts,
    isCreator,
    submitDailyScore,
    addFeedPost,
    toggleReaction,
    inviteMember,
    updateGroup,
    fetchMemberPhotosForDate,
  };
}

// Hook auxiliar que calcula as três pontuações da Arena a partir do
// acompanhamento diário do usuário (daily_tracking), sem gravar nada.
export function useComputeArenaScores(_groupId: string | undefined) {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (date: string) => {
      // Busca o acompanhamento do usuário na data informada.
      const { data: tracking } = await supabase
        .from('daily_tracking')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', date)
        .maybeSingle();

      if (!tracking) return null;

      // Hidratação: quanto da meta de 3000ml de água foi cumprida (0 a 100).
      const hydrationScore = Math.min(100, Math.round(((tracking.water_ml || 0) / 3000) * 100));

      // Nutrição: proporção das 6 refeições do dia que foram concluídas.
      const meals = [
        tracking.breakfast_completed,
        tracking.morning_snack_completed,
        tracking.lunch_completed,
        tracking.afternoon_snack_completed,
        tracking.dinner_completed,
        tracking.night_snack_completed,
      ];
      const completedMeals = meals.filter(Boolean).length;
      const nutritionScore = Math.round((completedMeals / 6) * 100);

      // Treino: 100 se o treino do dia foi concluído, 0 caso contrário.
      const workoutScore = tracking.workout_completed ? 100 : 0;

      // Devolve as três pontuações calculadas junto com a data.
      return { hydration_score: hydrationScore, nutrition_score: nutritionScore, workout_score: workoutScore, date };
    },
  });
}
