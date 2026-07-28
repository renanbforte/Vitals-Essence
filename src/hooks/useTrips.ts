// ============================================================================
// useTrips.ts  —  VIAGENS DO USUARIO (PROPRIAS E COMPARTILHADAS)
// ----------------------------------------------------------------------------
// Lista todas as viagens do usuario (as que ele criou e as que amigos
// compartilharam com ele), calcula quanto ja foi gasto em cada uma somando
// varias categorias de custo, e permite criar, editar e excluir viagens.
// E a base do modulo de planejamento de viagens do app.
// ============================================================================

// Ferramentas para buscar/gravar dados no servidor (React Query) e conexao com o Supabase (banco de dados)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Descobre quem e o usuario logado e exibe mensagens rapidas na tela (toasts)
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Hook principal que entrega a lista de viagens do usuario e as acoes sobre elas
export function useTrips() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Busca as viagens do usuario e ja calcula o total gasto de cada uma
  const tripsQuery = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // 1) Viagens que o proprio usuario criou (mais recentes primeiro)
      const { data: owned, error: e1 } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (e1) throw e1;

      // 2) Viagens compartilhadas: descobre em quais viagens o usuario entrou como membro aceito
      const { data: memberships } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Com esses IDs de participacao, busca os dados completos dessas viagens compartilhadas
      let shared: any[] = [];
      if (memberships && memberships.length > 0) {
        const ids = memberships.map(m => m.trip_id);
        const { data } = await supabase
          .from('trips')
          .select('*')
          .in('id', ids);
        shared = data || [];
      }

      // Junta proprias + compartilhadas numa lista so, evitando repetir a mesma viagem
      const allTrips = [...(owned || [])];
      for (const s of shared) {
        if (!allTrips.find(t => t.id === s.id)) allTrips.push(s);
      }

      // 3) Agora calcula quanto ja foi gasto em cada viagem
      const tripIds = allTrips.map(t => t.id);
      if (tripIds.length === 0) return allTrips;

      // Regra de calculo de um gasto: se o custo e "por unidade", multiplica pela quantidade;
      // senao usa o valor cheio. (Funcao auxiliar; a soma final usa a mesma logica abaixo.)
      const getTotal = (e: any) => {
        const amount = Number(e.amount || e.cost) || 0;
        return e.cost_mode === 'unit' ? amount * (Number(e.quantity) || 1) : amount;
      };

      // Todas as categorias de gasto de uma viagem que devem entrar na conta
      const tableConfigs = [
        { table: 'trip_expenses' as const, cols: 'trip_id, amount, cost_mode, quantity' },
        { table: 'trip_flights' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_accommodations' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_transport' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_events' as const, cols: 'trip_id, cost, cost_mode, quantity' },
        { table: 'trip_meals' as const, cols: 'trip_id, cost, cost_mode, quantity' },
      ];
      // Consulta todas as categorias ao mesmo tempo (em paralelo) para ir mais rapido
      const results = await Promise.all(
        tableConfigs.map(({ table, cols }) => supabase.from(table).select(cols).in('trip_id', tripIds))
      );

      // Soma os gastos por viagem: costMap guarda o total acumulado de cada viagem (por ID)
      const costMap: Record<string, number> = {};
      for (const { data } of results) {
        if (!data) continue;
        for (const row of data as any[]) {
          const val = Number(row.amount || row.cost) || 0;
          const total = row.cost_mode === 'unit' ? val * (Number(row.quantity) || 1) : val;
          costMap[row.trip_id] = (costMap[row.trip_id] || 0) + total;
        }
      }

      // Devolve cada viagem com o campo extra total_spent (total gasto) preenchido
      return allTrips.map(t => ({ ...t, total_spent: costMap[t.id] || 0 }));
    },
    enabled: !!user,
  });

  // Cria uma nova viagem no banco, vinculada ao usuario logado
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
    // Deu certo: recarrega a lista de viagens e avisa "Viagem criada!"
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast({ title: 'Viagem criada!' });
    },
    onError: () => toast({ title: 'Erro ao criar viagem', variant: 'destructive' }),
  });

  // Atualiza os dados de uma viagem existente (nome, datas, orcamento etc.)
  const updateTrip = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from('trips').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  // Exclui uma viagem do banco
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

  // Entrega para a tela: a lista de viagens, o estado de carregamento e as acoes de criar/editar/excluir/recarregar
  return { trips: tripsQuery.data || [], isLoading: tripsQuery.isLoading, createTrip, updateTrip, deleteTrip, refetch: tripsQuery.refetch };
}
