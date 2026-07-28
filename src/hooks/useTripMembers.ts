// ============================================================================
// useTripMembers.ts  —  MEMBROS E CONVITES DE VIAGENS COMPARTILHADAS
// ----------------------------------------------------------------------------
// Cuida de quem participa de uma viagem: lista os membros, envia convites para
// amigos e permite aceitar ou recusar convites. Usado nas telas de viagem
// quando o usuario quer planejar em grupo (dividir a viagem com outras pessoas).
// ============================================================================

// Ferramentas para buscar/gravar dados no servidor (React Query) e conexao com o Supabase (banco de dados)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Descobre quem e o usuario logado e exibe mensagens rapidas na tela (toasts)
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Hook que gerencia os membros de UMA viagem especifica (identificada pelo tripId)
export function useTripMembers(tripId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // "Etiqueta" que identifica esta lista no cache, para saber quando recarregar
  const key = ['trip_members', tripId];

  // Busca no banco todos os membros ligados a esta viagem.
  // So roda quando ha um tripId valido E um usuario logado.
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

  // Envia um convite: cria um registro de membro para o amigo, ainda "pendente".
  // O papel padrao e "editor" (pode editar a viagem) ate a pessoa aceitar.
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
    // Deu certo: recarrega a lista de membros e avisa "Convite enviado!"
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ title: 'Convite enviado!' });
    },
    onError: () => toast({ title: 'Erro ao convidar', variant: 'destructive' }),
  });

  // Responde a um convite deste ponto de vista:
  // aceitar marca o membro como "accepted"; recusar apaga o registro.
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
    // Deu certo: atualiza os membros, as viagens e a lista de convites do usuario
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip_invitations'] });
    },
  });

  // Entrega para a tela: a lista de membros, se ainda esta carregando, e as acoes de convidar/responder
  return { members: query.data || [], isLoading: query.isLoading, invite, respond };
}

// Hook separado que lista os convites PENDENTES recebidos pelo usuario logado
// (usado, por exemplo, num sino de notificacoes ou numa aba de convites).
export function useTripInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca os convites ainda "pending" onde o usuario e o convidado,
  // ja trazendo junto os dados da viagem (trips) para mostrar nome/detalhes.
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

  // Aceitar ou recusar o convite: aceitar marca como "accepted"; recusar apaga o registro
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
    // Deu certo: recarrega a lista de convites e as viagens do usuario
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip_invitations'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });

  // Entrega para a tela: a lista de convites pendentes e a acao de responder
  return { invitations: query.data || [], respond };
}
