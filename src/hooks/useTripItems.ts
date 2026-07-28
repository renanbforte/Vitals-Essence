import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type TableName = 'trip_destinations' | 'trip_flights' | 'trip_accommodations' | 'trip_transport' | 'trip_events' | 'trip_documents' | 'trip_expenses' | 'trip_meals' | 'trip_split_participants' | 'trip_expense_splits';

export function useTripItems<T>(table: TableName, tripId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = [table, tripId];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return (data || []) as T[];
    },
    enabled: !!tripId && !!user,
  });

  const create = useMutation({
    mutationFn: async (item: Record<string, any>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from(table)
        .insert({ ...item, trip_id: tripId, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: () => toast({ title: 'Erro ao salvar', variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  return { items: query.data || [], isLoading: query.isLoading, create, update, remove, refetch: query.refetch };
}
