// ============================================================================
// Friends  —  TELA DE AMIGOS (rota /friends)
// ----------------------------------------------------------------------------
// Rede social do app. O usuário vê seu perfil e código de amigo, adiciona
// amigos (por nome ou código), aceita/recusa solicitações pendentes e pode
// espiar o progresso diário de cada amigo (água, refeições, treino e fotos).
// ============================================================================

// Ferramentas do React para guardar estados e uma referência que persiste
import { useState, useRef } from 'react';
import { Users, UserPlus, Copy, Check, X, Eye, Loader2, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DateSelector } from '@/components/DateSelector';
import { useFriendships, FriendWithProfile } from '@/hooks/useFriendships';
import { useFriendData, FriendDailyData } from '@/hooks/useFriendData';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import LifetimePremiumManager from '@/components/admin/LifetimePremiumManager';

// Animação: cada item surge subindo suavemente enquanto aparece.
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
};

// Animação: faz os itens de uma lista aparecerem em cascata (um após o outro).
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

// Componente principal da tela de Amigos.
export default function Friends() {
  const { user, profile, updateProfile } = useAuth(); // usuário logado e seu perfil
  const navigate = useNavigate();                     // para navegar entre telas
  // Dados e ações de amizade: lista de amigos, solicitações pendentes, meu código e funções (enviar/aceitar/recusar/remover)
  const { friends, pendingRequests, loading, myFriendCode, sendFriendRequest, acceptRequest, rejectRequest, removeFriend } = useFriendships();
  const { loading: friendDataLoading, fetchFriendData } = useFriendData(); // busca o progresso diário de um amigo

  // --- ESTADOS relacionados a adicionar amigo por CÓDIGO ---
  const [friendCode, setFriendCode] = useState('');   // código digitado
  const [sending, setSending] = useState(false);      // se está enviando a solicitação
  const [copied, setCopied] = useState(false);        // se o próprio código foi copiado (mostra o "check")

  // --- ESTADOS relacionados a buscar amigo por NOME ---
  const [nameSearch, setNameSearch] = useState('');   // texto da busca por nome
  const [searchResults, setSearchResults] = useState<{ user_id: string; name: string; friend_code: string | null; avatar_url: string | null }[]>([]); // resultados encontrados
  const [searching, setSearching] = useState(false);  // se a busca está em andamento
  const debounceRef = useRef<NodeJS.Timeout | null>(null); // "temporizador" que evita buscar a cada letra digitada

  // Busca perfis por nome enquanto o usuário digita (com atraso de 300ms para não pesar o servidor)
  const handleNameSearch = (value: string) => {
    setNameSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current); // cancela a busca anterior ainda não disparada
    if (value.trim().length < 2) { setSearchResults([]); return; } // só busca com 2+ caracteres
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      // Consulta perfis cujo nome contém o texto, ignorando o próprio usuário
      const { data } = await supabase
        .from('profiles')
        .select('user_id, name, friend_code, avatar_url')
        .ilike('name', `%${value.trim()}%`)
        .neq('user_id', user?.id || '')
        .limit(8);
      setSearchResults((data || []) as typeof searchResults);
      setSearching(false);
    }, 300);
  };

  // Envia solicitação de amizade para um resultado da busca por nome (usa o código dele)
  const handleAddByUserId = async (friendUserId: string) => {
    const result = searchResults.find(r => r.user_id === friendUserId);
    if (!result?.friend_code) { toast.error('Este usuário não possui código de amigo'); return; }
    setSending(true);
    const { error } = await sendFriendRequest(result.friend_code);
    setSending(false);
    if (error) { toast.error(error.message); }
    else { toast.success('Solicitação enviada!'); setNameSearch(''); setSearchResults([]); }
  };

  // --- ESTADOS da janela de "espiar o progresso" de um amigo ---
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null); // amigo aberto na janela
  const [selectedDate, setSelectedDate] = useState(new Date());  // dia escolhido para ver o progresso
  const [friendData, setFriendData] = useState<FriendDailyData | null>(null); // dados do amigo naquele dia
  const [viewDialogOpen, setViewDialogOpen] = useState(false);   // se a janela de progresso está aberta

  // Copia o próprio código de amigo para a área de transferência
  const handleCopyCode = async () => {
    if (!myFriendCode) return;
    await navigator.clipboard.writeText(myFriendCode);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000); // volta o ícone ao normal após 2 segundos
  };

  // Envia solicitação de amizade usando o código digitado manualmente
  const handleSendRequest = async () => {
    if (!friendCode.trim()) return;
    setSending(true);
    const { error } = await sendFriendRequest(friendCode.trim());
    setSending(false);
    if (error) { toast.error(error.message); }
    else { toast.success('Solicitação enviada!'); setFriendCode(''); }
  };

  // Aceita uma solicitação de amizade pendente
  const handleAccept = async (id: string) => {
    const { error } = await acceptRequest(id);
    if (error) { toast.error('Erro ao aceitar solicitação'); }
    else { toast.success('Amizade aceita!'); }
  };

  // Recusa uma solicitação pendente
  const handleReject = async (id: string) => { await rejectRequest(id); };

  // Remove um amigo já conectado
  const handleRemove = async (id: string) => {
    const { error } = await removeFriend(id);
    if (error) { toast.error('Erro ao remover amigo'); }
    else { toast.success('Amigo removido'); }
  };

  // Abre a janela de progresso e carrega os dados do amigo para a data atual
  const handleViewFriend = async (friend: FriendWithProfile) => {
    setSelectedFriend(friend);
    setViewDialogOpen(true);
    const friendUserId = friend.friend_profile?.user_id;
    if (friendUserId) {
      const data = await fetchFriendData(friendUserId, selectedDate);
      setFriendData(data);
    }
  };

  // Ao trocar o dia dentro da janela, recarrega o progresso do amigo para a nova data
  const handleDateChange = async (date: Date) => {
    setSelectedDate(date);
    if (selectedFriend?.friend_profile?.user_id) {
      const data = await fetchFriendData(selectedFriend.friend_profile.user_id, date);
      setFriendData(data);
    }
  };

  // Nomes das refeições em português (usados para exibir os rótulos)
  const mealLabels: Record<string, string> = {
    breakfast: 'Café da Manhã',
    morning_snack: 'Lanche da Manhã',
    lunch: 'Almoço',
    afternoon_snack: 'Lanche da Tarde',
    dinner: 'Jantar',
    night_snack: 'Ceia',
  };

  // Cor de fundo do topo (degradê azul, identidade visual da parte social)
  const heroGradient = 'linear-gradient(135deg, hsl(var(--hub-gradient-start)), hsl(var(--hub-gradient-end)))';

  // --- APARÊNCIA DA TELA (o que o usuário vê) ---
  return (
    <div className="min-h-screen bg-background relative">
      {/* Brilho suave de fundo (efeito decorativo, sem função) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-[120px]"
          style={{ background: 'hsl(var(--hub-gradient-start))' }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px]"
          style={{ background: 'hsl(var(--hub-gradient-end))' }} />
      </div>

      {/* Cabeçalho colorido (topo): botão voltar, título "Amigos" e contadores */}
      <div className="relative overflow-hidden">
        <div style={{ background: heroGradient }}>
          {/* Formas decorativas (bolhas translúcidas de fundo) */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/[0.06] rounded-full blur-2xl" />
            <div className="absolute top-10 left-10 w-40 h-40 bg-white/[0.04] rounded-full blur-3xl" />
            <div className="absolute -bottom-10 right-20 w-60 h-60 bg-white/[0.03] rounded-full blur-2xl" />
          </div>

          <div className="relative container mx-auto px-4 pt-6 pb-10">
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl backdrop-blur-sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {/* Título e contagem de amigos conectados */}
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Amigos
                </h1>
                <p className="text-white/50 text-xs mt-0.5 ml-[46px]">
                  {friends.length === 0
                    ? 'Conecte-se com seus amigos'
                    : `${friends.length} amigo${friends.length > 1 ? 's' : ''} conectado${friends.length > 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Selo de solicitações pendentes (só aparece se houver alguma) */}
              {pendingRequests.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
                  <span className="text-white text-xs font-semibold">{pendingRequests.length} pendente{pendingRequests.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Borda arredondada que faz a transição do topo colorido para o corpo da tela */}
        <div className="h-5 bg-background rounded-t-3xl -mt-5 relative z-10" />
      </div>

      {/* Corpo da tela: sequência de cartões (perfil, código, adicionar, pendentes, amigos) */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 container mx-auto px-4 pb-10 space-y-4 max-w-lg"
      >
        {/* Cartão do meu perfil: foto (clicável para trocar) e nome */}
        {user && profile && (
          <motion.div variants={fadeUp}>
            <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Meu Perfil</p>
              <div className="flex items-center gap-4">
                <ProfilePhotoUpload
                  userId={user.id}
                  userName={profile.name}
                  currentPhotoUrl={profile.avatar_url}
                  onPhotoUpdated={(url) => updateProfile({ avatar_url: url })}
                  size="lg"
                  editable={true}
                />
                <div className="flex-1">
                  <p className="font-bold text-lg text-foreground leading-tight">{profile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Clique na foto para alterar</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cartão do meu código de amigo: mostra o código e um botão para copiá-lo */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Meu Código de Amigo</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/60 rounded-xl px-4 py-3 font-mono text-lg tracking-[0.2em] font-bold text-foreground">
                {myFriendCode || '...'}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={handleCopyCode}
                disabled={!myFriendCode}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Compartilhe com seus amigos para se conectar
            </p>
          </div>
        </motion.div>

        {/* Cartão de adicionar amigo: por nome (busca) ou pelo código */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Adicionar Amigo
            </p>

            {/* Campo de busca por nome, com resultados aparecendo logo abaixo */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={nameSearch}
                  onChange={(e) => handleNameSearch(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="pl-9 bg-muted/40 border-border/40 rounded-xl"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {/* Lista suspensa com os resultados da busca por nome */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute z-50 w-full mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl max-h-60 overflow-y-auto"
                  >
                    {searchResults.map((result) => {
                      // Verifica se esse resultado já é amigo (para mostrar "Amigo" em vez do botão de adicionar)
                      const isAlreadyFriend = friends.some(f => f.friend_profile?.user_id === result.user_id);
                      return (
                        <div key={result.user_id} className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-semibold text-sm overflow-hidden">
                              {result.avatar_url
                                ? <img src={result.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                : result.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-sm">{result.name}</span>
                          </div>
                          {isAlreadyFriend
                            ? <Badge variant="secondary" className="text-xs">Amigo</Badge>
                            : <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleAddByUserId(result.user_id)} disabled={sending}>
                                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                              </Button>}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
                {/* Mensagem quando a busca não encontra ninguém */}
                {nameSearch.trim().length >= 2 && !searching && searchResults.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-50 w-full mt-1 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl p-3 text-center text-sm text-muted-foreground"
                  >
                    Nenhum resultado encontrado
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Separador "ou pelo código" entre as duas formas de adicionar */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border/50" />
              ou pelo código
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Campo para digitar o código do amigo e botão "Adicionar" */}
            <div className="flex gap-2">
              <Input
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                placeholder="Código do amigo"
                className="font-mono uppercase tracking-widest bg-muted/40 border-border/40 rounded-xl"
                maxLength={8}
              />
              <Button onClick={handleSendRequest} disabled={sending || !friendCode.trim()} className="rounded-xl px-5">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Cartão de solicitações pendentes: pessoas que querem ser seus amigos (aceitar/recusar) */}
        <AnimatePresence>
          {pendingRequests.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="show" exit={{ opacity: 0 }}>
              <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-yellow-500/20 p-4 shadow-lg">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  Solicitações Pendentes
                  <span className="bg-yellow-500/15 text-yellow-600 text-xs px-1.5 py-0.5 rounded-full font-bold">{pendingRequests.length}</span>
                </p>
                {/* Uma linha para cada solicitação: nome + botão aceitar (check) e recusar (X) */}
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                      <div>
                        <p className="font-semibold text-sm">{request.requester_profile?.name || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground">Quer ser seu amigo</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-lg h-8 w-8 p-0" onClick={() => handleAccept(request.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg h-8 w-8 p-0" onClick={() => handleReject(request.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cartão da lista de amigos: cada amigo com botões "Ver" (progresso) e remover */}
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl bg-card/70 backdrop-blur-xl border border-border/40 p-4 shadow-lg">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Meus Amigos
              {friends.length > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">{friends.length}</span>
              )}
            </p>

            {/* Enquanto carrega: "esqueletos"; se não houver amigos: mensagem vazia; senão: a lista */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <Users className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground/70">Nenhum amigo ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Adicione amigos pelo nome ou código</p>
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
                {friends.map((friend) => (
                  <motion.div
                    key={friend.id}
                    variants={fadeUp}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                        {friend.friend_profile?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{friend.friend_profile?.name || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground">Amigo</p>
                      </div>
                    </div>
                    {/* Botões por amigo: "Ver" abre o progresso; o X remove o amigo */}
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="rounded-lg h-8 gap-1.5 px-2.5" onClick={() => handleViewFriend(friend)}>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-xs">Ver</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemove(friend.id)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Ferramenta de administrador: gerencia acessos premium vitalícios (só aparece para admins) */}
        <motion.div variants={fadeUp}>
          <LifetimePremiumManager key={user?.id} />
        </motion.div>
      </motion.div>

      {/* Janela "Ver amigo": mostra o progresso diário do amigo escolhido */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                {selectedFriend?.friend_profile?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-bold">Progresso de {selectedFriend?.friend_profile?.name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seletor de data: escolhe o dia cujo progresso será exibido */}
            <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} />

            {/* Enquanto carrega mostra girando; sem dados mostra aviso; com dados mostra o progresso */}
            {friendDataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !friendData?.tracking ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum dado para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
            ) : (
              <>
                {/* Foto de progresso do dia (se o amigo enviou uma) */}
                {friendData.progressPhoto && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Foto do Dia</h4>
                    <img src={friendData.progressPhoto.photo_url} alt="Foto de progresso" className="w-full rounded-xl" />
                  </div>
                )}

                {/* Três indicadores rápidos do dia: água consumida, refeições feitas e treino */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{friendData.tracking.water_ml || 0}ml</p>
                    <p className="text-xs text-muted-foreground">Água</p>
                  </div>
                  {/* Conta quantas das 6 refeições foram concluídas (ex.: 4/6) */}
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {[
                        friendData.tracking.breakfast_completed,
                        friendData.tracking.morning_snack_completed,
                        friendData.tracking.lunch_completed,
                        friendData.tracking.afternoon_snack_completed,
                        friendData.tracking.dinner_completed,
                        friendData.tracking.night_snack_completed,
                      ].filter(Boolean).length}/6
                    </p>
                    <p className="text-xs text-muted-foreground">Refeições</p>
                  </div>
                  {/* Indica se o treino do dia foi feito (✓) ou não (✗) */}
                  <div className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-primary">
                      {friendData.tracking.workout_completed ? '✓' : '✗'}
                    </p>
                    <p className="text-xs text-muted-foreground">Treino</p>
                  </div>
                </div>

                {/* Galeria com as fotos das refeições enviadas pelo amigo */}
                {friendData.mealPhotos.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Fotos das Refeições</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {friendData.mealPhotos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img src={photo.photo_url} alt={mealLabels[photo.meal_key] || photo.meal_key} className="w-full aspect-square object-cover rounded-xl" />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                            {mealLabels[photo.meal_key] || photo.meal_key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lista das 6 refeições marcando quais o amigo concluiu (riscadas + check) */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Refeições</h4>
                  <div className="space-y-1.5">
                    {Object.entries(mealLabels).map(([key, label]) => {
                      const trackingKey = `${key}_completed` as keyof typeof friendData.tracking;
                      const isCompleted = friendData.tracking?.[trackingKey];
                      return (
                        <div key={key} className={`flex items-center justify-between p-2.5 rounded-xl ${isCompleted ? 'bg-primary/10' : 'bg-muted/40'}`}>
                          <span className={`text-sm ${isCompleted ? 'line-through opacity-60' : ''}`}>{label}</span>
                          {isCompleted && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
