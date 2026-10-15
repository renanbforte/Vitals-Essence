// ============================================================================
// useArenaChat  —  CHAT DO GRUPO DA ARENA
// ----------------------------------------------------------------------------
// Carrega as mensagens do chat de um grupo (com o perfil de quem enviou),
// permite enviar novas mensagens e escuta em tempo real para novas mensagens
// aparecerem na hora para todos os membros.
// ============================================================================
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ArenaChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profile?: { name: string; avatar_url: string | null };
}

export function useArenaChat(groupId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mensagens do grupo, mais antigas primeiro, com o perfil do autor.
  const { data: messages = [] } = useQuery({
    queryKey: ['arena-chat', groupId],
    queryFn: async () => {
      const { data: msgs, error } = await supabase
        .from('arena_chat_messages')
        .select('*')
        .eq('group_id', groupId!)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;

      const userIds = [...new Set((msgs || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      return (msgs || []).map(m => ({
        ...m,
        profile: (profiles || []).find(p => p.user_id === m.user_id),
      })) as ArenaChatMessage[];
    },
    enabled: !!groupId,
  });

  // Tempo real: nova mensagem recarrega o chat na hora.
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`arena-chat-${groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'arena_chat_messages', filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['arena-chat', groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  // Enviar uma mensagem no chat do grupo.
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('arena_chat_messages')
        .insert({ group_id: groupId!, user_id: user!.id, text } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['arena-chat', groupId] }),
  });

  return { messages, sendMessage, currentUserId: user?.id };
}
