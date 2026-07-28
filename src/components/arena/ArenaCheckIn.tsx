// ============================================================================
// Check-in Diário da Arena
// Cartão com um botão que registra o "check-in" do dia. Ao clicar, o app pega as
// pontuações do Diário de Saúde do usuário (hidratação, alimentação e ativação),
// considera apenas os pilares que o grupo ativou, salva o resultado e publica
// automaticamente um post no feed do grupo com a pontuação total do dia.
// ============================================================================
import { useState } from 'react';
import { ArenaGroup } from '@/hooks/useArena';
import { useComputeArenaScores } from '@/hooks/useArena';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplets, Utensils, Dumbbell, Zap, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ArenaCheckInProps {
  group: ArenaGroup;
  groupId: string;
  onSubmit: (data: { date: string; hydration_score: number; nutrition_score: number; workout_score: number }) => void;
  onPost: (data: { post_type: string; content?: string; hydration_score?: number; nutrition_score?: number; workout_score?: number; total_score?: number }) => void;
}

export function ArenaCheckIn({ group, groupId, onSubmit, onPost }: ArenaCheckInProps) {
  // Indica que o check-in está sendo processado (calculando/salvando)
  const [loading, setLoading] = useState(false);
  // Indica que o check-in do dia já foi feito (trava o botão)
  const [done, setDone] = useState(false);
  // Hook que calcula as pontuações da Arena a partir do Diário de Saúde
  const compute = useComputeArenaScores(groupId);

  // Faz o check-in: calcula as pontuações do dia, salva e posta no feed
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await compute.mutateAsync(today);
      if (!result) {
        toast.error('Nenhum dado registrado hoje no Diário');
        setLoading(false);
        return;
      }

      // Apply pillar filtering
      const scores = {
        date: today,
        hydration_score: group.pillar_hydration ? result.hydration_score : 0,
        nutrition_score: group.pillar_nutrition ? result.nutrition_score : 0,
        workout_score: group.pillar_workout ? result.workout_score : 0,
      };

      await onSubmit(scores);

      const total = Math.round(
        ((group.pillar_hydration ? scores.hydration_score : 0) +
          (group.pillar_nutrition ? scores.nutrition_score : 0) +
          (group.pillar_workout ? scores.workout_score : 0)) /
        [group.pillar_hydration, group.pillar_nutrition, group.pillar_workout].filter(Boolean).length
      );

      // Auto-post to feed
      await onPost({
        post_type: 'check_in',
        content: `Check-in do dia! 💪`,
        hydration_score: scores.hydration_score,
        nutrition_score: scores.nutrition_score,
        workout_score: scores.workout_score,
        total_score: total,
      });

      setDone(true);
      toast.success('Check-in registrado!');
    } catch {
      toast.error('Erro ao registrar check-in');
    }
    setLoading(false);
  };

  // Monta a lista de pilares ativos no grupo (hidratação, alimentação, ativação)
  // apenas com aqueles habilitados, para exibir os selos coloridos na tela
  const activePillars = [
    ...(group.pillar_hydration ? [{ icon: Droplets, label: 'Hidratação', color: 'text-blue-500', bg: 'bg-blue-500/10' }] : []),
    ...(group.pillar_nutrition ? [{ icon: Utensils, label: 'Alimentação', color: 'text-green-500', bg: 'bg-green-500/10' }] : []),
    ...(group.pillar_workout ? [{ icon: Dumbbell, label: 'Ativação', color: 'text-orange-500', bg: 'bg-orange-500/10' }] : []),
  ];

  // Tela: cabeçalho, selos dos pilares ativos e o botão de check-in
  return (
    <Card className="p-5 rounded-2xl border-border bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-sm">Check-in Diário</h3>
          <p className="text-xs text-muted-foreground">Dados do seu Diário de Saúde</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {activePillars.map(p => (
          <div key={p.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${p.bg}`}>
            <p.icon className={`w-3.5 h-3.5 ${p.color}`} />
            <span className="text-xs font-semibold">{p.label}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={handleCheckIn}
        disabled={loading || done}
        className="w-full rounded-xl gap-2"
        variant={done ? 'outline' : 'default'}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Calculando...</>
        ) : done ? (
          <><Check className="w-4 h-4" /> Check-in feito!</>
        ) : (
          <><Zap className="w-4 h-4" /> Fazer Check-in</>
        )}
      </Button>
    </Card>
  );
}
