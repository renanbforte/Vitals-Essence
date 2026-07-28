import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useArenaGroups } from '@/hooks/useArena';
import { CreateGroupDialog } from '@/components/arena/CreateGroupDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Lock, Globe, Shield, ChevronRight, Swords, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const typeIcons: Record<string, any> = { private: Lock, public: Globe, hybrid: Shield };

export default function Arena() {
  const navigate = useNavigate();
  const { groups, isLoading, createGroup } = useArenaGroups();
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async (data: any) => {
    const result = await createGroup.mutateAsync(data);
    setShowCreate(false);
    if (result?.id) navigate(`/arena/${result.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Arena" showBack gradientClass="gradient-health" />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Seus Grupos</h2>
            <p className="text-sm text-muted-foreground">Compita com amigos</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl">
            <Plus className="w-4 h-4" /> Criar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <Card className="p-8 rounded-2xl border-border text-center">
            <Swords className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-bold text-lg mb-1">Nenhum grupo ainda</h3>
            <p className="text-sm text-muted-foreground mb-4">Crie um grupo e convide amigos para competir!</p>
            <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl">
              <Plus className="w-4 h-4" /> Criar primeiro grupo
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((g, i) => {
              const TypeIcon = typeIcons[g.group_type] || Lock;
              const intensityEmoji = g.intensity === 'hardcore' ? '🔥' : g.intensity === 'light' ? '🌿' : '⚖';
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="p-4 rounded-2xl border-border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/arena/${g.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Swords className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
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

      <CreateGroupDialog open={showCreate} onOpenChange={setShowCreate} onSubmit={handleCreate} />
    </div>
  );
}
