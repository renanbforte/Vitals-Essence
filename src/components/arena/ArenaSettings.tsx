import { ArenaGroup, ArenaMember } from '@/hooks/useArena';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Lock, Globe, Shield, Eye, EyeOff, Minus, Droplets, Utensils, Dumbbell, UserPlus, Search, Crown } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ArenaSettingsProps {
  group: ArenaGroup;
  members: ArenaMember[];
  isCreator: boolean;
  onInvite: (userId: string) => void;
}

export function ArenaSettings({ group, members, isCreator, onInvite }: ArenaSettingsProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const memberIds = members.map(m => m.user_id);
      const { data } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .ilike('name', `%${value.trim()}%`)
        .not('user_id', 'in', `(${[user?.id, ...memberIds].join(',')})`)
        .limit(6);
      setSearchResults(data || []);
      setSearching(false);
    }, 300);
  };

  const typeLabels: Record<string, { icon: any; label: string }> = {
    private: { icon: Lock, label: 'Privado' },
    public: { icon: Globe, label: 'Público' },
    hybrid: { icon: Shield, label: 'Híbrido' },
  };

  const transparencyLabels: Record<string, { icon: any; label: string }> = {
    full: { icon: Eye, label: 'Transparente' },
    partial: { icon: Minus, label: 'Parcial' },
    discreet: { icon: EyeOff, label: 'Discreto' },
  };

  const intensityLabels: Record<string, string> = {
    light: '🌿 Leve',
    balanced: '⚖ Equilibrado',
    hardcore: '🔥 Hardcore',
  };

  const TypeIcon = typeLabels[group.group_type]?.icon || Lock;
  const TransIcon = transparencyLabels[group.transparency_level]?.icon || Eye;

  return (
    <div className="space-y-4">
      {/* Group info */}
      <Card className="p-4 rounded-2xl border-border space-y-3">
        <h3 className="font-bold text-sm">Configurações do Grupo</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <TypeIcon className="w-4 h-4 text-muted-foreground" />
            <span>{typeLabels[group.group_type]?.label}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <TransIcon className="w-4 h-4 text-muted-foreground" />
            <span>{transparencyLabels[group.transparency_level]?.label}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <span>{intensityLabels[group.intensity]}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {group.pillar_hydration && (
            <Badge variant="secondary" className="gap-1 text-xs"><Droplets className="w-3 h-3" /> Hidratação</Badge>
          )}
          {group.pillar_nutrition && (
            <Badge variant="secondary" className="gap-1 text-xs"><Utensils className="w-3 h-3" /> Alimentação</Badge>
          )}
          {group.pillar_workout && (
            <Badge variant="secondary" className="gap-1 text-xs"><Dumbbell className="w-3 h-3" /> Ativação</Badge>
          )}
        </div>
      </Card>

      {/* Members */}
      <Card className="p-4 rounded-2xl border-border space-y-3">
        <h3 className="font-bold text-sm">Membros ({members.length})</h3>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl">
              <Avatar className="w-8 h-8">
                <AvatarImage src={m.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {(m.profile?.name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 font-semibold text-sm">{m.profile?.name || 'Usuário'}</span>
              {m.role === 'creator' && <Crown className="w-4 h-4 text-yellow-500" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Invite */}
      {isCreator && (
        <Card className="p-4 rounded-2xl border-border space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" /> Convidar</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="pl-9"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1">
              {searchResults.map(p => (
                <div key={p.user_id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={p.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{(p.name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-semibold">{p.name}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => onInvite(p.user_id)}>
                    Convidar
                  </Button>
                </div>
              ))}
            </div>
          )}
          {searching && <p className="text-xs text-muted-foreground">Buscando...</p>}
        </Card>
      )}
    </div>
  );
}
