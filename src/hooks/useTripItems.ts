// ============================================================================
// useTripItems.ts  —  ITENS DE UMA VIAGEM (HOOK GENERICO REUTILIZAVEL)
// ----------------------------------------------------------------------------
// Hook unico que serve para qualquer tipo de item de uma viagem (voos, hoteis,
// transporte, eventos, documentos, gastos, refeicoes...). Voce diz a tabela e o
// id da viagem, e ele busca, cria, atualiza e apaga os itens daquela categoria.
// ============================================================================

// React Query (cuida de buscar dados e manter em cache), conexao com o Supabase,
// usuario logado e o "toast" (notificacoes rapidas na tela).
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Lista fechada de tabelas de viagem que este hook aceita (evita erros de digitacao).
type TableName = 'trip_destinations' | 'trip_flights' | 'trip_accommodations' | 'trip_transport' | 'trip_events' | 'trip_documents' | 'trip_expenses' | 'trip_meals' | 'trip_split_participants' | 'trip_expense_splits';

// Recebe a tabela desejada e o id da viagem; devolve os itens e as acoes.
export function useTripItems<T>(table: TableName, tripId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Chave que identifica este conjunto de dados no cache do React Query.
  const key = [table, tripId];

  // Busca os itens daquela tabela para a viagem indicada, ordenados pela posicao
  // (order_index). So roda quando ha uma viagem e um usuario logado.
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

  // Cria um novo item, ja vinculado a viagem e ao usuario. Ao dar certo,
  // atualiza a lista automaticamente; se falhar, mostra um aviso de erro.
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

  // Atualiza um item existente (pelo id) e recarrega a lista ao concluir.
  const update = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  // Apaga um item (pelo id) e recarrega a lista ao concluir.
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  // Entrega os itens, o estado de carregamento e as acoes de criar/editar/apagar.
  return { items: query.data || [], isLoading: query.isLoading, create, update, remove, refetch: query.refetch };
}
