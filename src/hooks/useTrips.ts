import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useTrips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get owned trips
      const { data: owned, error: e1 } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (e1) throw e1;

      // Get shared trips (where I'm a member)
      const { data: memberships } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      let shared: any[] = [];
      if (memberships && memberships.length > 0) {
        const ids = memberships.map(m => m.trip_id);
        const { data } = await supabase
          .from('trips')
          .select('*')
          .in('id', ids);
        shared = data || [];
      }

      // Merge without duplicates
      const allTrips = [...(owned || [])];
      for (const s of shared) {
        if (!allTrips.find(t => t.id === s.id)) allTrips.push(s);
      }

      // Compute total_spent per trip
      const tripIds = allTrips.map(t => t.id);
      if (tripIds.length === 0) return allTrips;

      const getTotal = (e: any) => {
        const amount = Number(e.amount || e.cost) || 0;
        return e.cost_mode === 'unit' ? amount * (Number(e.quantity) || 1) : amount;
      };

      const tableConfigs = [
        { table: 'trip_expenses' as const, cols: 'trip_id, amount, cost_mode, quantity' },
        { table: 'trip_flights' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_accommodations' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_transport' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_events' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_meals' as const, cols: 'trip_id, cost, cost_mode, quantity' },
      ];
      const results = await Promise.all(
        tableConfigs.map(({ table, cols }) => supabase.from(table).select(cols).in('trip_id', tripIds))
      );

      const costMap: Record<string, number> = {};
      for (const { data } of results) {
        if (!data) continue;
        for (const row of data as any[]) {
          const val = Number(row.amount || row.cost) || 0;
          const total = row.cost_mode === 'unit' ? val * (Number(row.quantity) || 1) : val;
          costMap[row.trip_id] = (costMap[row.trip_id] || 0) + total;
        }
      }

      return allTrips.map(t => ({ ...t, total_spent: costMap[t.id] || 0 }));
    },
    enabled: !!user,
  });

  const createTrip = useMutation({
    mutationFn: async (data: { name: string; main_destination?: string; start_date?: string; end_date?: string; budget?: number; currency?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({ ...data, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem criada!' });
    },
    onError: () => toast({ title: 'Erro ao criar viagem', variant: 'destructive' }),
  });

  const updateTrip = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from('trips').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem excluída' });
    },
  });

  return { trips: tripsQuery.data || [], isLoading: tripsQuery.isLoading, createTrip, updateTrip, deleteTrip, refetch: tripsQuery.refetch };
}
