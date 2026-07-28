// ============================================================================
// useFriendships.ts  —  AMIZADES (ADICIONAR, ACEITAR E REMOVER AMIGOS)
// ----------------------------------------------------------------------------
// Hook que cuida da rede de amigos do usuário: busca as amizades no Supabase,
// separa amigos confirmados de convites pendentes e oferece ações para enviar,
// aceitar, recusar e remover amizades (usando o "código de amigo" de cada um).
// ============================================================================

// Ferramentas do React para estado e efeitos, o cliente do banco (Supabase) e o
// login atual (para saber quem é o usuário logado).
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Formato de uma amizade guardada no banco (quem convidou, quem recebeu e o
// status: pendente, aceita ou recusada).
export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Dados públicos de um amigo (nome e código de amigo) usados para exibir na tela.
export interface FriendProfile {
  id: string;
  user_id: string;
  name: string;
  friend_code: string | null;
}

// Uma amizade já combinada com os perfis das pessoas envolvidas (para mostrar
// nomes em vez de apenas IDs).
export interface FriendWithProfile extends Friendship {
  friend_profile?: FriendProfile;
  requester_profile?: FriendProfile;
}

export function useFriendships() {
  // Usuário logado e seu perfil (traz o código de amigo dele).
  const { user, profile } = useAuth();
  // Listas que a tela usa: amigos confirmados e convites pendentes a responder.
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  // Indica se ainda estamos carregando os dados do banco.
  const [loading, setLoading] = useState(true);

  // Busca no banco todas as amizades do usuário e monta as listas da tela.
  // useCallback evita recriar essa função a cada render.
  const fetchFriendships = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Busca todas as amizades em que o usuário aparece (como quem convidou OU
    // como quem foi convidado).
    // Fetch all friendships where user is involved
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friendships:', error);
      setLoading(false);
      return;
    }

    // Para cada amizade, descobre quem é "o outro lado" (o amigo, não o próprio
    // usuário) e junta esses IDs.
    // Get all friend user IDs
    const friendUserIds = (friendships || []).map(f =>
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    // Busca os perfis (nome, código) de todos esses amigos de uma vez só.
    // Fetch friend profiles
    let profiles: FriendProfile[] = [];
    if (friendUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, name, friend_code')
        .in('user_id', friendUserIds);
      profiles = (profilesData || []) as FriendProfile[];
    }

    // Combina cada amizade com o perfil do amigo e o perfil de quem enviou o
    // convite, para a tela poder exibir os nomes.
    // Map friendships with profiles
    const friendshipsWithProfiles = (friendships || []).map(f => {
      const friendUserId = f.user_id === user.id ? f.friend_id : f.user_id;
      const friendProfile = profiles.find(p => p.user_id === friendUserId);
      const requesterProfile = profiles.find(p => p.user_id === f.user_id);
      
      return {
        ...f,
        friend_profile: friendProfile,
        requester_profile: requesterProfile,
      } as FriendWithProfile;
    });

    // Separa: amigos já aceitos vão para uma lista; convites pendentes que
    // ESTE usuário precisa responder (ele é o destinatário) vão para outra.
    // Separate accepted friends from pending requests
    const accepted = friendshipsWithProfiles.filter(f => f.status === 'accepted');
    const pending = friendshipsWithProfiles.filter(
      f => f.status === 'pending' && f.friend_id === user.id
    );

    setFriends(accepted);
    setPendingRequests(pending);
    setLoading(false);
  }, [user]);

  // Assim que o hook é usado (e sempre que a busca muda), carrega as amizades.
  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  // Envia um convite de amizade a partir do "código de amigo" digitado.
  const sendFriendRequest = async (friendCode: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Procura o dono daquele código de amigo (em maiúsculas).
    // Find user by friend code
    const { data: friendProfile, error: findError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('friend_code', friendCode.toUpperCase())
      .maybeSingle();

    // Se o código não existe, avisa o usuário.
    if (findError || !friendProfile) {
      return { error: new Error('Código de amigo não encontrado') };
    }

    // Ninguém pode adicionar a si mesmo.
    if (friendProfile.user_id === user.id) {
      return { error: new Error('Você não pode adicionar a si mesmo') };
    }

    // Verifica se já existe uma amizade entre os dois (em qualquer direção),
    // para não criar convites duplicados.
    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.user_id}),and(user_id.eq.${friendProfile.user_id},friend_id.eq.${user.id})`)
      .maybeSingle();

    // Se já existe, informa se já são amigos ou se o convite já foi enviado.
    if (existing) {
      if (existing.status === 'accepted') {
        return { error: new Error('Vocês já são amigos') };
      }
      return { error: new Error('Solicitação já enviada') };
    }

    // Cria o convite de amizade com status "pendente".
    // Create friendship request
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendProfile.user_id,
        status: 'pending',
      });

    // Deu certo? Recarrega as listas para refletir o novo convite.
    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  // Aceita um convite recebido: muda o status da amizade para "aceita".
  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  // Recusa um convite recebido: marca a amizade como "recusada".
  const rejectRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  // Remove definitivamente uma amizade (apaga o registro do banco).
  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  // Entrega para a tela os dados e as ações disponíveis deste hook.
  return {
    friends,
    pendingRequests,
    loading,
    myFriendCode: profile?.friend_code,
    sendFriendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refetch: fetchFriendships,
  };
}
