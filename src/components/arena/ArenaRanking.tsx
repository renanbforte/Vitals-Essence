// ============================================================================
// ArenaRanking (Ranking da Arena)
// Monta a tabela de classificação (ranking) de um grupo de desafio de bem-estar.
// Calcula a pontuação de cada participante e mostra abas como Total, Evolução,
// Streak e Equilíbrio, respeitando o nível de transparência escolhido pelo grupo.
// ============================================================================
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

// Para cada membro, soma e faz a média das pontuações diárias (hidratação,
// alimentação, treino, pontos totais, streak e dias registrados) e devolve
// uma lista pronta para ser ordenada no ranking.
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

// Lista visual do ranking: recebe os membros já calculados e desenha cada linha
// (posição, avatar, nome e pontuação), destacando o pódio (1º, 2º e 3º lugares).
function RankingList({ ranked, sortKey, group }: { ranked: RankedMember[]; sortKey: string; group: ArenaGroup }) {
  // Ordena os participantes conforme a aba escolhida (streak, equilíbrio ou pontos totais).
  const sorted = [...ranked].sort((a, b) => {
    if (sortKey === 'streak') return b.streak - a.streak;
    if (sortKey === 'balance') return (b.hydration + b.nutrition + b.workout) - (a.hydration + a.nutrition + a.workout);
    return b.totalScore - a.totalScore;
  });

  // Ícones e cores usados para marcar os três primeiros lugares (coroa, medalha e troféu).
  const podiumIcons = [
    { icon: Crown, color: 'text-yellow-500' },
    { icon: Medal, color: 'text-slate-400' },
    { icon: Trophy, color: 'text-amber-600' },
  ];

  // Desenha uma linha (cartão) para cada participante, em ordem de classificação.
  return (
    <div className="space-y-2">
      {sorted.map((r, i) => {
        // Define ícone/cor de pódio apenas para as três primeiras posições.
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
                {/* Valor mostrado à direita muda conforme a aba e o nível de transparência do grupo */}
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

      {/* Mensagem exibida quando o grupo ainda não tem participantes */}
      {sorted.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum participante ainda</p>
      )}
    </div>
  );
}

// Componente principal: calcula o ranking e monta as abas disponíveis conforme
// as opções ativadas no grupo (Total, Evolução, Streak e Equilíbrio).
export function ArenaRanking({ group, members, scores }: ArenaRankingProps) {
  // Calcula as pontuações de todos os membros uma única vez.
  const ranked = computeRankings(members, scores);

  // Pódio de encerramento: quando o desafio terminou, mostra o campeão (1º no total).
  const isEnded = group.status === 'ended';
  const podium = [...ranked].filter(r => r.days > 0).sort((a, b) => b.totalScore - a.totalScore).slice(0, 3);

  // Monta a lista de abas apenas com os tipos de ranking que o grupo habilitou.
  const tabs = [];
  if (group.ranking_total_score) tabs.push({ key: 'total', label: 'Total', icon: Trophy });
  if (group.ranking_evolution) tabs.push({ key: 'evolution', label: 'Evolução', icon: TrendingUp });
  if (group.ranking_streak) tabs.push({ key: 'streak', label: 'Streak', icon: Flame });
  if (group.ranking_balance) tabs.push({ key: 'balance', label: 'Equilíbrio', icon: Scale });

  // Garante ao menos a aba "Total" caso nenhum tipo de ranking esteja ativo.
  if (tabs.length === 0) tabs.push({ key: 'total', label: 'Total', icon: Trophy });

  return (
    <div className="space-y-4">
      {/* Pódio de encerramento do desafio */}
      {isEnded && podium.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-4 rounded-2xl gradient-health text-white text-center space-y-3 border-0">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-5 h-5" />
              <p className="text-sm font-extrabold uppercase tracking-wide">Desafio encerrado</p>
            </div>
            <div className="flex items-end justify-center gap-3">
              {/* 2º */}
              {podium[1] && <PodiumPlace rank={2} name={podium[1].member.profile?.name} avatar={podium[1].member.profile?.avatar_url} score={podium[1].totalScore} />}
              {/* 1º (maior) */}
              <PodiumPlace rank={1} name={podium[0].member.profile?.name} avatar={podium[0].member.profile?.avatar_url} score={podium[0].totalScore} />
              {/* 3º */}
              {podium[2] && <PodiumPlace rank={3} name={podium[2].member.profile?.name} avatar={podium[2].member.profile?.avatar_url} score={podium[2].totalScore} />}
            </div>
          </Card>
        </motion.div>
      )}

      <Tabs defaultValue={tabs[0].key}>
      {/* Só mostra a barra de abas quando existe mais de um tipo de ranking */}
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
      {/* Conteúdo de cada aba: a mesma lista de ranking, ordenada pelo tipo escolhido */}
      {tabs.map(t => (
        <TabsContent key={t.key} value={t.key} className="mt-3">
          <RankingList ranked={ranked} sortKey={t.key} group={group} />
        </TabsContent>
      ))}
      </Tabs>
    </div>
  );
}

// Um lugar do pódio de encerramento: avatar, medalha, nome e pontos. O 1º lugar
// vem maior e mais alto que o 2º e o 3º.
function PodiumPlace({ rank, name, avatar, score }: { rank: 1 | 2 | 3; name?: string | null; avatar?: string | null; score: number }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
  const size = rank === 1 ? 'w-16 h-16' : 'w-12 h-12';
  const lift = rank === 1 ? '' : 'mb-2';
  return (
    <div className={`flex flex-col items-center gap-1 ${lift}`}>
      <span className={rank === 1 ? 'text-2xl' : 'text-xl'}>{medal}</span>
      <Avatar className={`${size} border-2 border-white/60`}>
        <AvatarImage src={avatar || ''} />
        <AvatarFallback className="bg-white/20 text-white font-bold">{(name || '?')[0]}</AvatarFallback>
      </Avatar>
      <p className={`font-bold truncate max-w-[80px] ${rank === 1 ? 'text-sm' : 'text-xs'}`}>{name || 'Usuário'}</p>
      <p className="text-[10px] font-extrabold tabular-nums">{score} pts</p>
    </div>
  );
}
