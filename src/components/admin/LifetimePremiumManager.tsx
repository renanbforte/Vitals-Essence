// ============================================================================
// Gerenciador de "Premium Vitalício" (área do Administrador)
// Cartão exclusivo para admins que permite dar acesso premium para sempre a um
// usuário. O admin busca a pessoa pelo código de amigo, adiciona à lista e pode
// remover quem já está lá. Quem não for admin não vê nada deste componente.
// ============================================================================
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LifetimeUser {
  id: string;
  user_id: string;
  created_at: string;
  profile?: { name: string; friend_code: string | null };
}

export default function LifetimePremiumManager() {
  // Usuário logado atualmente (usado para checar se é admin e registrar quem adicionou)
  const { user } = useAuth();
  // Guarda se o usuário logado é administrador da plataforma
  const [isAdmin, setIsAdmin] = useState(false);
  // Indica que ainda estamos verificando se é admin (evita piscar a tela)
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  // Lista de usuários que já possuem premium vitalício
  const [lifetimeUsers, setLifetimeUsers] = useState<LifetimeUser[]>([]);
  // Indica que a lista de usuários vitalícios está carregando
  const [loadingList, setLoadingList] = useState(false);
  // Texto do campo de busca (o código de amigo digitado pelo admin)
  const [searchCode, setSearchCode] = useState('');
  // Usuário encontrado na busca (aparece para ser confirmado antes de adicionar)
  const [foundUser, setFoundUser] = useState<{ user_id: string; name: string; friend_code: string } | null>(null);
  // Indica que a busca por código está em andamento
  const [searching, setSearching] = useState(false);
  // Indica que a adição de um usuário à lista está em andamento
  const [adding, setAdding] = useState(false);

  // Ao carregar: verifica no banco se o usuário logado é admin da plataforma
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsAdmin(!!data);
      setCheckingAdmin(false);
    })();
  }, [user]);

  // Assim que confirmar que é admin, busca a lista de usuários vitalícios
  useEffect(() => {
    if (!isAdmin) return;
    fetchLifetimeUsers();
  }, [isAdmin]);

  // Busca no banco todos os usuários com premium vitalício e junta o nome/código de cada um
  const fetchLifetimeUsers = async () => {
    setLoadingList(true);
    const { data: ltData } = await supabase
      .from('lifetime_premium_users')
      .select('id, user_id, created_at')
      .order('created_at', { ascending: false });

    if (ltData && ltData.length > 0) {
      const ids = ltData.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, friend_code')
        .in('user_id', ids);

      const profileMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

      setLifetimeUsers(
        (ltData as any[]).map((r) => ({ ...r, profile: profileMap[r.user_id] }))
      );
    } else {
      setLifetimeUsers([]);
    }
    setLoadingList(false);
  };

  // Busca um usuário pelo código de amigo digitado; se achar, mostra para confirmar
  const handleSearch = async () => {
    if (!searchCode.trim()) return;
    setSearching(true);
    setFoundUser(null);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, name, friend_code')
      .eq('friend_code', searchCode.toUpperCase().trim())
      .maybeSingle();
    if (data) {
      setFoundUser(data as any);
    } else {
      toast.error('Usuário não encontrado com esse código');
    }
    setSearching(false);
  };

  // Adiciona o usuário encontrado à lista de premium vitalício (evita duplicados)
  const handleAdd = async () => {
    if (!foundUser || !user) return;
    // Check if already in list
    if (lifetimeUsers.some((u) => u.user_id === foundUser.user_id)) {
      toast.error('Este usuário já está na lista de premium vitalício');
      return;
    }
    setAdding(true);
    const { error } = await supabase
      .from('lifetime_premium_users')
      .insert({ user_id: foundUser.user_id, added_by: user.id });
    if (error) {
      toast.error('Erro ao adicionar usuário');
    } else {
      toast.success(`${foundUser.name} adicionado ao premium vitalício!`);
      setFoundUser(null);
      setSearchCode('');
      await fetchLifetimeUsers();
    }
    setAdding(false);
  };

  // Remove um usuário da lista de premium vitalício
  const handleRemove = async (id: string, name: string) => {
    const { error } = await supabase
      .from('lifetime_premium_users')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Erro ao remover usuário');
    } else {
      toast.success(`${name} removido do premium vitalício`);
      setLifetimeUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  // Enquanto verifica, ou se não for admin, não mostra nada na tela
  if (checkingAdmin) return null;
  if (!isAdmin) return null;

  // Tela do cartão: campo de busca, resultado encontrado e lista de vitalícios
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          Premium Vitalício
          <Badge variant="secondary" className="ml-auto text-xs">
            Admin
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Add */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Adicionar usuário pelo código</p>
          <div className="flex gap-2">
            <Input
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Código do usuário (ex: A1B2C3D4)"
              className="font-mono text-sm uppercase tracking-wider"
              maxLength={8}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button size="sm" variant="outline" onClick={handleSearch} disabled={searching || !searchCode.trim()}>
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {foundUser && (
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 border border-border">
              <div>
                <p className="font-semibold text-sm">{foundUser.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{foundUser.friend_code}</p>
              </div>
              <Button size="sm" onClick={handleAdd} disabled={adding} className="gap-1.5">
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Adicionar
              </Button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Usuários com acesso vitalício ({lifetimeUsers.length})
          </p>
          {loadingList ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : lifetimeUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum usuário na lista ainda</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {lifetimeUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between bg-background rounded-lg p-2.5 border border-border/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{u.profile?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.profile?.friend_code || '—'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive h-7 w-7 p-0 shrink-0"
                    onClick={() => handleRemove(u.id, u.profile?.name || 'Usuário')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
