// ============================================================================
// TripSharingCard (Cartão de Participantes da Viagem)
// Mostra quem participa de uma viagem e permite ao dono convidar mais pessoas,
// seja escolhendo entre os amigos já cadastrados ou digitando o "código de amigo".
// Cada participante aparece com o status "Ativo" (aceitou) ou "Pendente" (convidado).
// ============================================================================
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, Check, X, Search } from 'lucide-react';
import { useTripMembers } from '@/hooks/useTripMembers';
import { useFriendships } from '@/hooks/useFriendships';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  tripId: string;
  isOwner: boolean;
}

export default function TripSharingCard({ tripId, isOwner }: Props) {
  // Usuário logado no momento.
  const { user } = useAuth();
  // Lista de participantes da viagem e a ação de convidar alguém.
  const { members, invite } = useTripMembers(tripId);
  // Lista de amigos do usuário.
  const { friends } = useFriendships();
  // Controla se a janela (modal) de convite está aberta.
  const [showInvite, setShowInvite] = useState(false);
  // Guarda o código de amigo digitado na busca.
  const [friendCode, setFriendCode] = useState('');
  // Guarda o amigo encontrado ao buscar por código (ou null se não achou).
  const [foundFriend, setFoundFriend] = useState<any>(null);
  // Indica se a busca por código está em andamento.
  const [searching, setSearching] = useState(false);
  // Aba ativa no modal: "friends" (meus amigos) ou "code" (por código).
  const [tab, setTab] = useState<'friends' | 'code'>('friends');

  // Busca no banco um perfil cujo código de amigo seja igual ao digitado.
  const searchFriend = async () => {
    if (!friendCode.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, name, friend_code')
      .eq('friend_code', friendCode.toUpperCase().trim())
      .single();
    setFoundFriend(data);
    setSearching(false);
  };

  // Envia o convite para o amigo encontrado pela busca por código.
  const handleInvite = () => {
    if (!foundFriend) return;
    invite.mutate(foundFriend.user_id, {
      onSuccess: () => { setShowInvite(false); setFriendCode(''); setFoundFriend(null); }
    });
  };

  // Envia o convite para um amigo escolhido na lista "Meus amigos".
  const handleInviteFriend = (friendUserId: string) => {
    invite.mutate(friendUserId, {
      onSuccess: () => { setShowInvite(false); }
    });
  };

  // Lista de IDs de quem já participa/foi convidado (para não convidar de novo).
  const memberUserIds = members.map((m: any) => m.user_id);

  // Filtra apenas os amigos que ainda não estão na viagem, disponíveis para convite.
  const availableFriends = friends.filter(f => {
    const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
    return !memberUserIds.includes(friendUserId);
  });

  // Guarda o nome de cada participante, indexado pelo ID do usuário.
  const [memberProfiles, setMemberProfiles] = useState<Record<string, string>>({});

  // Sempre que a lista de participantes muda, busca os nomes deles no banco.
  useEffect(() => {
    if (members.length === 0) return;
    const ids = members.map((m: any) => m.user_id);
    supabase.from('profiles').select('user_id, name').in('user_id', ids).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((p: any) => { map[p.user_id] = p.name; });
        setMemberProfiles(map);
      }
    });
  }, [members]);

  // Se o usuário não é o dono e não há participantes, não mostra nada.
  if (!isOwner && members.length === 0) return null;

  return (
    <>
      {/* Cartão que lista os participantes e (para o dono) o botão de convidar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4" />Participantes</h3>
            {isOwner && (
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => setShowInvite(true)}>
                <UserPlus className="w-3.5 h-3.5" />
                Convidar
              </Button>
            )}
          </div>
          {members.length === 0 ? (
            <p className="text-xs text-muted-foreground">Somente você. Convide amigos!</p>
          ) : (
            <div className="space-y-2">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                  <span className="text-sm">{memberProfiles[m.user_id] || 'Usuário'}</span>
                  <Badge variant={m.status === 'accepted' ? 'default' : 'outline'} className="text-[10px]">
                    {m.status === 'accepted' ? 'Ativo' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Convidar para a viagem</DialogTitle></DialogHeader>
          
          <div className="flex gap-1 bg-muted rounded-lg p-1 mb-2">
            <button
              onClick={() => setTab('friends')}
              className={`flex-1 text-xs py-1.5 px-3 rounded-md transition-colors ${tab === 'friends' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
            >
              Meus amigos
            </button>
            <button
              onClick={() => setTab('code')}
              className={`flex-1 text-xs py-1.5 px-3 rounded-md transition-colors ${tab === 'code' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
            >
              Por código
            </button>
          </div>

          {tab === 'friends' ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableFriends.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {friends.length === 0 ? 'Você ainda não tem amigos adicionados.' : 'Todos os seus amigos já foram convidados!'}
                </p>
              ) : (
                availableFriends.map(f => {
                  const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
                  const name = f.friend_profile?.name || f.requester_profile?.name || 'Amigo';
                  const displayName = f.user_id === user?.id ? f.friend_profile?.name : f.requester_profile?.name;
                  return (
                    <div key={f.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                      <span className="text-sm font-medium">{displayName || name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={invite.isPending}
                        onClick={() => handleInviteFriend(friendUserId)}
                      >
                        <UserPlus className="w-3 h-3" />
                        Convidar
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Código do amigo</Label>
                <div className="flex gap-2">
                  <Input value={friendCode} onChange={e => setFriendCode(e.target.value)} placeholder="Ex: A1B2C3D4" className="uppercase" />
                  <Button onClick={searchFriend} disabled={searching} variant="outline">Buscar</Button>
                </div>
              </div>
              {foundFriend && (
                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{foundFriend.name}</p>
                    <p className="text-xs text-muted-foreground">Código: {foundFriend.friend_code}</p>
                  </div>
                  <Button size="sm" onClick={handleInvite} disabled={invite.isPending} className="h-7 text-xs">
                    Convidar
                  </Button>
                </div>
              )}
              {foundFriend === null && friendCode && !searching && (
                <p className="text-xs text-destructive">Amigo não encontrado.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
