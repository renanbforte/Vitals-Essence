// ============================================================================
// ShareWorkoutDialog — Compartilhar um treino na Arena
// ----------------------------------------------------------------------------
// Aparece ao finalizar uma corrida/pedal: lista os grupos de desafio ativos e,
// no grupo escolhido, publica o treino no feed e pontua o dia. É o elo entre o
// rastreador de GPS e a competição em grupo da Arena.
// ============================================================================
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Check, Swords } from 'lucide-react';
import { useArenaQuickShare } from '@/hooks/useArenaQuickShare';
import { formatDuration, formatPace } from '@/lib/workout';

interface ShareWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutType: string;        // 'running' | 'cycling'
  distanceKm: number;
  durationSeconds: number;
  date: string;               // yyyy-MM-dd
}

export function ShareWorkoutDialog({ open, onOpenChange, workoutType, distanceKm, durationSeconds, date }: ShareWorkoutDialogProps) {
  const { activeGroups, shareWorkout } = useArenaQuickShare();
  const [selected, setSelected] = useState<string[]>([]);

  const emoji = workoutType === 'cycling' ? '🚴' : '🏃';
  const label = workoutType === 'cycling' ? 'Pedal' : 'Corrida';
  // Resumo que vira o texto do post no feed.
  const summary = `${emoji} ${label} · ${distanceKm.toFixed(2)} km · ${formatDuration(durationSeconds)} · ${formatPace(distanceKm, durationSeconds)}/km`;

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleShare = async () => {
    for (const groupId of selected) {
      await shareWorkout.mutateAsync({ groupId, content: summary, workoutScore: 100, date });
    }
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            Compartilhar na Arena
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Prévia do post */}
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-sm font-semibold">
            {summary}
          </div>

          {activeGroups.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Você não está em nenhum desafio ativo.</p>
              <p className="text-xs">Entre ou crie um grupo na Arena para competir.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Escolha em quais desafios publicar:</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {activeGroups.map(g => {
                  const isOn = selected.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggle(g.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isOn ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'}`}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={g.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{g.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-left text-sm font-semibold truncate">{g.name}</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isOn ? 'bg-primary text-white' : 'border border-border'}`}>
                        {isOn && <Check className="w-3 h-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={handleShare}
                disabled={selected.length === 0 || shareWorkout.isPending}
                className="w-full rounded-xl h-11 gradient-health text-white font-bold border-0"
              >
                {shareWorkout.isPending ? 'Publicando…' : `Publicar em ${selected.length || ''} ${selected.length === 1 ? 'desafio' : 'desafios'}`}
              </Button>
            </>
          )}

          <button onClick={() => onOpenChange(false)} className="w-full text-xs text-muted-foreground hover:text-foreground">
            Agora não
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
