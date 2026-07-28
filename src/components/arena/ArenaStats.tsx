import { ArenaDailyScore, ArenaGroup } from '@/hooks/useArena';
import { Card } from '@/components/ui/card';
import { Droplets, Utensils, Dumbbell, Flame, Trophy, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ArenaStatsProps {
  group: ArenaGroup;
  scores: ArenaDailyScore[];
}

export function ArenaStats({ group, scores }: ArenaStatsProps) {
  const { user } = useAuth();
  const myScores = scores.filter(s => s.user_id === user?.id);

  const totalDays = myScores.length;
  const totalPoints = myScores.reduce((s, sc) => s + (sc.total_score || 0), 0);
  const maxStreak = myScores.length > 0 ? Math.max(...myScores.map(s => s.current_streak || 0)) : 0;
  const avgHydration = totalDays > 0 ? Math.round(myScores.reduce((s, sc) => s + (sc.hydration_score || 0), 0) / totalDays) : 0;
  const avgNutrition = totalDays > 0 ? Math.round(myScores.reduce((s, sc) => s + (sc.nutrition_score || 0), 0) / totalDays) : 0;
  const avgWorkout = totalDays > 0 ? Math.round(myScores.reduce((s, sc) => s + (sc.workout_score || 0), 0) / totalDays) : 0;
  const avgTotal = totalDays > 0 ? Math.round(totalPoints / totalDays) : 0;

  const stats = [
    { icon: Trophy, label: 'Pontos totais', value: totalPoints, color: 'text-primary' },
    { icon: BarChart3, label: 'Média diária', value: avgTotal, color: 'text-primary' },
    { icon: Flame, label: 'Maior streak', value: maxStreak, color: 'text-orange-500' },
    { icon: Flame, label: 'Dias registrados', value: totalDays, color: 'text-muted-foreground' },
  ];

  const pillarStats = [
    ...(group.pillar_hydration ? [{ icon: Droplets, label: 'Hidratação', value: avgHydration, color: 'text-blue-500', bg: 'bg-blue-500/10' }] : []),
    ...(group.pillar_nutrition ? [{ icon: Utensils, label: 'Alimentação', value: avgNutrition, color: 'text-green-500', bg: 'bg-green-500/10' }] : []),
    ...(group.pillar_workout ? [{ icon: Dumbbell, label: 'Ativação', value: avgWorkout, color: 'text-orange-500', bg: 'bg-orange-500/10' }] : []),
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-sm text-muted-foreground">Suas Estatísticas</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="p-4 rounded-2xl border-border text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">{s.label}</p>
          </Card>
        ))}
      </div>

      <h3 className="font-bold text-sm text-muted-foreground">Médias por Pilar</h3>
      <div className="space-y-2">
        {pillarStats.map(p => (
          <Card key={p.label} className="p-3 rounded-xl border-border flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>
              <p.icon className={`w-5 h-5 ${p.color}`} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{p.label}</p>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div className={`h-2 rounded-full transition-all`} style={{ width: `${p.value}%`, background: `hsl(var(--primary))` }} />
              </div>
            </div>
            <span className="font-extrabold text-sm">{p.value}%</span>
          </Card>
        ))}
      </div>

      {totalDays === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Registre seu primeiro dia para ver suas estatísticas!
        </p>
      )}
    </div>
  );
}
