import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useTripMembers(tripId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ['trip_members', tripId];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tripId && !!user,
  });

  const invite = useMutation({
    mutationFn: async (friendUserId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('trip_members').insert({
        trip_id: tripId,
        user_id: friendUserId,
        invited_by: user.id,
        role: 'editor',
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: 'Convite enviado!' });
    },
    onError: () => toast({ title: 'Erro ao convidar', variant: 'destructive' }),
  });

  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase.from('trip_members').update({ status: 'accepted' }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trip_members').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip_invitations'] });
    },
  });

  return { members: query.data || [], isLoading: query.isLoading, invite, respond };
}

export function useTripInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trip_invitations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('trip_members')
        .select('*, trips(*)')
        .eq('user_id', user.id)
        .eq('status', 'pending');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const respond = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase.from('trip_members').update({ status: 'accepted' }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('trip_members').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  return { invitations: query.data || [], respond };
}
