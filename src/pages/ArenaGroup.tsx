// ============================================================================
// ArenaGroup  —  DETALHES DE UM GRUPO DA ARENA
// ----------------------------------------------------------------------------
// Tela da rota "/arena/:groupId". Mostra um grupo de competição por dentro:
// o check-in diário no topo e cinco abas — Feed, Ranking, Calendário, Stats e
// Config. Os dados atualizam em tempo real quando outros membros interagem.
// ============================================================================

import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Trophy, Calendar, BarChart3, Settings, MessagesSquare } from 'lucide-react';
import { Header } from '@/components/Header';
import { useArenaGroupDetail } from '@/hooks/useArena';
import { ArenaFeed } from '@/components/arena/ArenaFeed';
import { ArenaRanking } from '@/components/arena/ArenaRanking';
import { ArenaCalendar } from '@/components/arena/ArenaCalendar';
import { ArenaStats } from '@/components/arena/ArenaStats';
import { ArenaSettings } from '@/components/arena/ArenaSettings';
import { ArenaChat } from '@/components/arena/ArenaChat';
import { ArenaCheckIn } from '@/components/arena/ArenaCheckIn';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function ArenaGroup() {
  // Pega o ID do grupo que está na URL (ex.: /arena/123)
  const { groupId } = useParams<{ groupId: string }>();
  // Gerenciador de cache de dados: usado para atualizar as listas em tempo real
  const queryClient = useQueryClient();
  // Aba atualmente selecionada (começa no "feed")
  const [tab, setTab] = useState('feed');

  // Busca todos os dados do grupo e as ações disponíveis (postar, pontuar, etc.)
  const {
    group,
    members,
    scores,
    feedPosts,
    isCreator,
    submitDailyScore,
    addFeedPost,
    toggleReaction,
    addComment,
    deleteComment,
    inviteMember,
    fetchMemberPhotosForDate,
  } = useArenaGroupDetail(groupId);

  // Assinaturas em tempo real: escuta mudanças no banco (posts, pontuações e
  // membros) deste grupo e recarrega automaticamente as listas na tela. Ao
  // sair da tela, a conexão é encerrada (return).
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`arena-${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_feed_posts', filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['arena-feed', groupId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_feed_comments' }, () => {
        queryClient.invalidateQueries({ queryKey: ['arena-feed', groupId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_daily_scores', filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['arena-scores', groupId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arena_members', filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['arena-members', groupId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  // Enquanto o grupo ainda não carregou, mostra "esqueletos" cinza no lugar
  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Arena" showBack gradientClass="gradient-health" />
        <main className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho com o nome do grupo e botão de voltar */}
      <Header title={group.name} showBack gradientClass="gradient-health" />

      <main className="container mx-auto px-4 py-6 space-y-5 max-w-3xl">
        {/* Cartão de check-in do dia: registra a pontuação/atividade diária */}
        <ArenaCheckIn
          group={group}
          groupId={groupId!}
          onSubmit={(data) => submitDailyScore.mutateAsync(data)}
          onPost={(data) => addFeedPost.mutateAsync(data)}
        />

        {/* Abas de navegação dentro do grupo */}
        <Tabs value={tab} onValueChange={setTab}>
          {/* Barra com os 5 botões de aba (Feed, Ranking, Calendário, Stats, Config) */}
          <TabsList className="grid w-full grid-cols-6 h-12 rounded-2xl bg-card border border-border p-1">
            <TabsTrigger value="feed" className="gap-1 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="ranking" className="gap-1 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ranking</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessagesSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-1 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 rounded-xl text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Feed: mural de publicações do grupo, com reações */}
          <TabsContent value="feed" className="mt-4">
            <ArenaFeed
              posts={feedPosts}
              group={group}
              onPost={(data) => addFeedPost.mutateAsync(data)}
              onReact={(postId, emoji) => toggleReaction.mutateAsync({ postId, emoji })}
              onComment={(postId, text) => addComment.mutateAsync({ postId, text })}
              onDeleteComment={(commentId) => deleteComment.mutateAsync(commentId)}
            />
          </TabsContent>

          {/* Aba Ranking: classificação dos membros por pontuação */}
          <TabsContent value="ranking" className="mt-4">
            <ArenaRanking group={group} members={members} scores={scores} />
          </TabsContent>

          {/* Aba Chat: conversa em grupo em tempo real */}
          <TabsContent value="chat" className="mt-4">
            <ArenaChat groupId={groupId!} />
          </TabsContent>

          {/* Aba Calendário: histórico diário; ao tocar um dia, mostra as fotos */}
          <TabsContent value="calendar" className="mt-4">
            <ArenaCalendar
              group={group}
              members={members}
              scores={scores}
              onFetchDayPhotos={fetchMemberPhotosForDate}
            />
          </TabsContent>

          {/* Aba Stats: gráficos e estatísticas de desempenho do grupo */}
          <TabsContent value="stats" className="mt-4">
            <ArenaStats group={group} scores={scores} />
          </TabsContent>

          {/* Aba Config: ajustes do grupo e convite de membros (só o criador) */}
          <TabsContent value="settings" className="mt-4">
            <ArenaSettings
              group={group}
              members={members}
              isCreator={isCreator}
              onInvite={(userId) => inviteMember.mutateAsync(userId)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
