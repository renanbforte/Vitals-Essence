import { ArenaDailyScore, ArenaGroup, ArenaMember } from '@/hooks/useArena';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Crown, Medal, Trophy, Flame, TrendingUp, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ArenaRankingProps {
  group: ArenaGroup;
  members: ArenaMember[];
  scores: ArenaDailyScore[];
}

interface RankedMember {
  member: ArenaMember;
  totalScore: number;
  streak: number;
  hydration: number;
  nutrition: number;
  workout: number;
  days: number;
}

function computeRankings(members: ArenaMember[], scores: ArenaDailyScore[]): RankedMember[] {
  return members.map(m => {
    const memberScores = scores.filter(s => s.user_id === m.user_id);
    const totalScore = memberScores.reduce((sum, s) => sum + (s.total_score || 0), 0);
    const latestStreak = memberScores.length > 0 ? Math.max(...memberScores.map(s => s.current_streak || 0)) : 0;
    const avgHydration = memberScores.length > 0 ? Math.round(memberScores.reduce((s, sc) => s + (sc.hydration_score || 0), 0) / memberScores.length) : 0;
    const avgNutrition = memberScores.length > 0 ? Math.round(memberScores.reduce((s, sc) => s + (sc.nutrition_score || 0), 0) / memberScores.length) : 0;
    const avgWorkout = memberScores.length > 0 ? Math.round(memberScores.reduce((s, sc) => s + (sc.workout_score || 0), 0) / memberScores.length) : 0;

    return {
      member: m,
      totalScore,
      streak: latestStreak,
      hydration: avgHydration,
      nutrition: avgNutrition,
      workout: avgWorkout,
      days: memberScores.length,
    };
  });
}

function RankingList({ ranked, sortKey, group }: { ranked: RankedMember[]; sortKey: string; group: ArenaGroup }) {
  const sorted = [...ranked].sort((a, b) => {
    if (sortKey === 'streak') return b.streak - a.streak;
    if (sortKey === 'balance') return (b.hydration + b.nutrition + b.workout) - (a.hydration + a.nutrition + a.workout);
    return b.totalScore - a.totalScore;
  });

  const podiumIcons = [
    { icon: Crown, color: 'text-yellow-500' },
    { icon: Medal, color: 'text-slate-400' },
    { icon: Trophy, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-2">
      {sorted.map((r, i) => {
        const PodiumIcon = i < 3 ? podiumIcons[i].icon : null;
        const podiumColor = i < 3 ? podiumIcons[i].color : '';

        return (
          <motion.div
            key={r.member.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`p-3 rounded-xl border-border flex items-center gap-3 ${i < 3 ? 'bg-primary/5' : ''}`}>
              <div className="w-7 text-center">
                {PodiumIcon ? (
                  <PodiumIcon className={`w-5 h-5 mx-auto ${podiumColor}`} />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <Avatar className="w-8 h-8">
                <AvatarImage src={r.member.profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {(r.member.profile?.name || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{r.member.profile?.name || 'Usuário'}</p>
                {group.transparency_level === 'full' && (
                  <p className="text-[10px] text-muted-foreground">{r.days} dias</p>
                )}
              </div>
              <div className="text-right">
                {sortKey === 'streak' ? (
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-extrabold text-sm">{r.streak}</span>
                  </div>
                ) : group.transparency_level !== 'discreet' ? (
                  <span className="font-extrabold text-lg text-primary">{sortKey === 'balance' ? Math.round((r.hydration + r.nutrition + r.workout) / 3) : r.totalScore}</span>
                ) : (
                  <span className="font-extrabold text-lg text-primary">#{i + 1}</span>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}

      {sorted.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum participante ainda</p>
      )}
    </div>
  );
}

export function ArenaRanking({ group, members, scores }: ArenaRankingProps) {
  const ranked = computeRankings(members, scores);

  const tabs = [];
  if (group.ranking_total_score) tabs.push({ key: 'total', label: 'Total', icon: Trophy });
  if (group.ranking_evolution) tabs.push({ key: 'evolution', label: 'Evolução', icon: TrendingUp });
  if (group.ranking_streak) tabs.push({ key: 'streak', label: 'Streak', icon: Flame });
  if (group.ranking_balance) tabs.push({ key: 'balance', label: 'Equilíbrio', icon: Scale });

  if (tabs.length === 0) tabs.push({ key: 'total', label: 'Total', icon: Trophy });

  return (
    <Tabs defaultValue={tabs[0].key}>
      {tabs.length > 1 && (
        <TabsList className={`grid w-full grid-cols-${tabs.length} h-10 rounded-xl bg-card border border-border p-1`}>
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1 rounded-lg text-xs font-bold">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      )}
      {tabs.map(t => (
        <TabsContent key={t.key} value={t.key} className="mt-3">
          <RankingList ranked={ranked} sortKey={t.key} group={group} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
