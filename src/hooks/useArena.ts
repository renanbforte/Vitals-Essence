import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useArenaGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['arena-groups', user?.id],
    queryFn: async () => {
      // Get groups where user is creator
      const { data: ownGroups } = await supabase
        .from('arena_groups')
        .select('*')
        .eq('creator_id', user!.id)
        .order('created_at', { ascending: false });

      // Get groups where user is member
      const { data: memberships } = await supabase
        .from('arena_members')
        .select('group_id')
        .eq('user_id', user!.id)
        .eq('status', 'accepted');

      const memberGroupIds = (memberships || []).map(m => m.group_id);
      
      let memberGroups: any[] = [];
      if (memberGroupIds.length > 0) {
        const { data } = await supabase
          .from('arena_groups')
          .select('*')
          .in('id', memberGroupIds);
        memberGroups = data || [];
      }

      const allGroups = [...(ownGroups || []), ...memberGroups];
      const unique = allGroups.filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i);
      return unique as ArenaGroup[];
    },
    enabled: !!user?.id,
  });

  const createGroup = useMutation({
    mutationFn: async (group: Partial<ArenaGroup>) => {
      const { data, error } = await supabase
        .from('arena_groups')
        .insert({ ...group, creator_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;

      // Add creator as member
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

export interface ArenaMemberDayPhotos {
  user_id: string;
  name: string;
  avatar_url: string | null;
  progress_photos: string[];
  workout_photos: string[];
}

export function useArenaGroupDetail(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: members = [] } = useQuery({
    queryKey: ['arena-members', groupId],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from('arena_members')
        .select('*')
        .eq('group_id', groupId!)
        .eq('status', 'accepted');
      if (error) throw error;

      // Fetch profiles
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

      const userIds = [...new Set((posts || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const postIds = (posts || []).map(p => p.id);
      let reactions: any[] = [];
      if (postIds.length > 0) {
        const { data: r } = await supabase
          .from('arena_feed_reactions')
          .select('*')
          .in('post_id', postIds);
        reactions = r || [];
      }

      return (posts || []).map(p => ({
        ...p,
        profile: (profiles || []).find(pr => pr.user_id === p.user_id),
        reactions: reactions.filter(r => r.post_id === p.id),
      })) as ArenaFeedPost[];
    },
    enabled: !!groupId,
  });

  const submitDailyScore = useMutation({
    mutationFn: async (scoreData: { date: string; hydration_score: number; nutrition_score: number; workout_score: number; photo_url?: string }) => {
      const total = Math.round((scoreData.hydration_score + scoreData.nutrition_score + scoreData.workout_score) / 3);
      
      // Calculate streak
      const { data: prevScores } = await supabase
        .from('arena_daily_scores')
        .select('current_streak, date')
        .eq('group_id', groupId!)
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(1);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arena-scores', groupId] });
      queryClient.invalidateQueries({ queryKey: ['arena-feed', groupId] });
    },
  });

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

  const isCreator = group?.creator_id === user?.id;

  const fetchMemberPhotosForDate = async (date: string): Promise<ArenaMemberDayPhotos[]> => {
    if (!members.length) return [];
    const userIds = members.map(m => m.user_id);

    const [{ data: progressPhotos }, { data: workoutPhotos }, { data: profiles }] = await Promise.all([
      supabase.from('progress_photos').select('user_id, photo_url').in('user_id', userIds).eq('date', date),
      supabase.from('workout_photos').select('user_id, photo_url').in('user_id', userIds).eq('date', date),
      supabase.from('profiles').select('user_id, name, avatar_url').in('user_id', userIds),
    ]);

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

// Compute scores from daily_tracking data
export function useComputeArenaScores(_groupId: string | undefined) {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (date: string) => {
      // Fetch today's tracking
      const { data: tracking } = await supabase
        .from('daily_tracking')
        .select('*')
        .eq('user_id', user!.id)
        .eq('date', date)
        .maybeSingle();

      if (!tracking) return null;

      // Hydration score: based on water_ml vs 3000ml goal
      const hydrationScore = Math.min(100, Math.round(((tracking.water_ml || 0) / 3000) * 100));

      // Nutrition score: based on meals completed
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

      // Workout score: 100 if completed, 0 if not
      const workoutScore = tracking.workout_completed ? 100 : 0;

      return { hydration_score: hydrationScore, nutrition_score: nutritionScore, workout_score: workoutScore, date };
    },
  });
}
