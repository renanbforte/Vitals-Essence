// ============================================================================
// Arena  —  LISTA DE GRUPOS DE COMPETIÇÃO (ARENA)
// ----------------------------------------------------------------------------
// Tela da rota "/arena". Mostra os grupos em que o usuário compete com amigos.
// Cada grupo aparece como um cartão clicável que leva aos detalhes. Também há
// um botão "Criar" para abrir o formulário e criar um novo grupo.
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useArenaGroups } from '@/hooks/useArena';
import { CreateGroupDialog } from '@/components/arena/CreateGroupDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Lock, Globe, Shield, ChevronRight, Swords, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

// Ícone usado conforme o tipo do grupo: privado (cadeado), público (globo), híbrido (escudo)
const typeIcons: Record<string, any> = { private: Lock, public: Globe, hybrid: Shield };

export default function Arena() {
  // Permite navegar para a página de detalhes de um grupo
  const navigate = useNavigate();
  // Busca os grupos do usuário, o estado de carregamento e a ação de criar grupo
  const { groups, isLoading, createGroup, joinByCode } = useArenaGroups();
  // Controla se o diálogo de criação de grupo está aberto
  const [showCreate, setShowCreate] = useState(false);
  // Diálogo de entrar por código e o código digitado
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // Cria o grupo no banco, fecha o diálogo e abre a tela do novo grupo criado
  const handleCreate = async (data: any) => {
    const result = await createGroup.mutateAsync(data);
    setShowCreate(false);
    if (result?.id) navigate(`/arena/${result.id}`);
  };

  // Entra num desafio pelo código e abre a tela do grupo.
  const handleJoin = async () => {
    const groupId = await joinByCode.mutateAsync(joinCode);
    setShowJoin(false);
    setJoinCode('');
    if (groupId) navigate(`/arena/${groupId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho da tela com título "Arena" e botão de voltar */}
      <Header title="Arena" showBack gradientClass="gradient-health" />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Linha do topo: título "Seus Grupos" + botão "Criar" */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Seus Grupos</h2>
            <p className="text-sm text-muted-foreground">Compita com amigos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowJoin(true)} className="gap-1.5 rounded-xl">
              <KeyRound className="w-4 h-4" /> Entrar
            </Button>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl">
              <Plus className="w-4 h-4" /> Criar
            </Button>
          </div>
        </div>

        {/* Três situações: carregando, sem grupos, ou a lista de grupos */}
        {isLoading ? (
          // Enquanto carrega: mostra um ícone girando (spinner)
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          // Estado vazio: nenhum grupo ainda, convida a criar o primeiro
          <Card className="p-8 rounded-2xl border-border text-center">
            <Swords className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-bold text-lg mb-1">Nenhum grupo ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie um grupo e convide amigos para competir!</p>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl">
              <Plus className="w-4 h-4" /> Criar primeiro grupo
            </Button>
          </Card>
        ) : (
          // Lista de grupos: um cartão para cada grupo do usuário
          <div className="space-y-3">
            {groups.map((g, i) => {
              // Escolhe o ícone conforme o tipo do grupo (privado/público/híbrido)
              const TypeIcon = typeIcons[g.group_type] || Lock;
              // Emoji que representa a intensidade da competição do grupo
              const intensityEmoji = g.intensity === 'hardcore' ? '🔥' : g.intensity === 'light' ? '🌿' : '⚖';
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Cartão do grupo: ao clicar, abre os detalhes do grupo */}
                  <Card
                    className="p-4 rounded-2xl border-border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/arena/${g.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Ícone de espadas dentro de um quadrado colorido */}
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Swords className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Nome do grupo e, abaixo, tipo + emoji de intensidade */}
                        <p className="font-bold text-sm truncate">{g.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <TypeIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {g.group_type === 'private' ? 'Privado' : g.group_type === 'public' ? 'Público' : 'Híbrido'}
                          </span>
                          <span className="text-[10px]">{intensityEmoji}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Diálogo (pop-up) do formulário para criar um novo grupo */}
      <CreateGroupDialog open={showCreate} onOpenChange={setShowCreate} onSubmit={handleCreate} />

      {/* Diálogo de entrar num desafio pelo código de convite */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" /> Entrar num desafio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Digite o código de convite que um amigo compartilhou.</p>
            <Input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter' && joinCode.trim()) handleJoin(); }}
              placeholder="Ex.: K3X9Q2"
              className="text-center text-lg font-extrabold tracking-widest uppercase"
              maxLength={10}
            />
            <Button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joinByCode.isPending}
              className="w-full rounded-xl h-11 gradient-health text-white font-bold border-0"
            >
              {joinByCode.isPending ? 'Entrando…' : 'Entrar no desafio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
