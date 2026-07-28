// ============================================================================
// COMPONENTE: FriendsRanking (Ranking de Amigos)
// Mostra um placar comparando o desempenho do dia entre o usuário e seus amigos.
// Tem uma aba "Geral" (pontuação total) e abas por categoria (Água, Refeições,
// Treino e Peso). Destaca o pódio (1º, 2º e 3º) com ícones e cores especiais.
// ============================================================================
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Droplets, Utensils, Dumbbell, Scale, Crown, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFriendsRanking, RankingEntry } from '@/hooks/useFriendsRanking';
import type { FriendWithProfile } from '@/hooks/useFriendships';

interface FriendsRankingProps {
  friends: FriendWithProfile[];
  selectedDate: Date;
}

// Devolve o ícone da posição no ranking: coroa (1º), medalha (2º), troféu (3º)
// ou o número da colocação para os demais. O "size" controla o tamanho do ícone.
const getRankIcon = (rank: number, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };
  
  switch (rank) {
    case 1:
      return <Crown className={`${sizes[size]} text-yellow-500 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]`} fill="currentColor" />;
    case 2:
      return <Medal className={`${sizes[size]} text-gray-400`} />;
    case 3:
      return <Award className={`${sizes[size]} text-amber-600`} />;
    default:
      return <span className={`${sizes[size]} flex items-center justify-center text-muted-foreground font-bold text-sm`}>{rank}º</span>;
  }
};

// Escolhe as cores de fundo (degradê) e a borda do cartão conforme a colocação
// e se aquele cartão é do próprio usuário (que recebe um destaque extra).
const getRankGradient = (rank: number, isCurrentUser: boolean) => {
  if (rank === 1) {
    return isCurrentUser 
      ? 'bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 border-yellow-300 shadow-lg shadow-yellow-200/50' 
      : 'bg-gradient-to-r from-yellow-50 via-amber-50/50 to-yellow-50 border-yellow-200';
  }
  if (rank === 2) {
    return isCurrentUser
      ? 'bg-gradient-to-r from-slate-100 via-gray-50 to-slate-100 border-gray-300 shadow-lg shadow-gray-200/50'
      : 'bg-gradient-to-r from-slate-50 via-gray-50/50 to-slate-50 border-gray-200';
  }
  if (rank === 3) {
    return isCurrentUser
      ? 'bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 border-amber-400 shadow-lg shadow-amber-200/50'
      : 'bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border-amber-200';
  }
  return isCurrentUser 
    ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/10' 
    : 'bg-card border-border/50';
};

// Define a cor da pontuação: verde (bom, >=80), âmbar (médio, >=50) ou vermelho (baixo)
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
};

// Sub-componente que mostra a variação de peso: seta para baixo em verde quando
// emagreceu, seta para cima em vermelho quando ganhou peso, ou traço quando não mudou.
const WeightTrend = ({ change }: { change: number | null }) => {
  if (change === null) {
    return (
      <span className="text-muted-foreground text-xs font-medium">—</span>
    );
  }
  if (change > 0) {
    return (
      <div className="flex items-center gap-0.5 text-green-600">
        <TrendingDown className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">-{Math.abs(change).toFixed(1)}kg</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center gap-0.5 text-red-500">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">+{Math.abs(change).toFixed(1)}kg</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5 text-muted-foreground">
      <Minus className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">0kg</span>
    </div>
  );
};

// Sub-componente reutilizável: uma "etiqueta" arredondada com ícone e valor
// (ex.: gota d'água + porcentagem de hidratação), com cores configuráveis.
const StatBadge = ({
  icon: Icon,
  value, 
  colorClass,
  bgClass 
}: { 
  icon: React.ElementType; 
  value: string; 
  colorClass: string;
  bgClass: string;
}) => (
  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${bgClass}`}>
    <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
    <span className={`text-xs font-semibold ${colorClass}`}>{value}</span>
  </div>
);

// Sub-componente do cartão da aba "Geral": mostra a colocação, avatar, nome,
// pontuação total e as estatísticas do dia (água, refeições, treino e peso).
const RankingCard = ({ entry, index }: { entry: RankingEntry; index: number }) => {
  // Monta as iniciais do nome (até 2 letras) para exibir quando não há foto
  const initials = entry.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        type: 'spring',
        stiffness: 400,
        damping: 25
      }}
      className={`relative rounded-2xl border-2 p-4 transition-all duration-300 hover:scale-[1.01] ${getRankGradient(entry.rank, entry.isCurrentUser)}`}
    >
      {/* Rank badge positioned top-right for podium */}
      {entry.rank <= 3 && (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.08 + 0.2, type: 'spring', stiffness: 500 }}
          className="absolute -top-2 -right-2 z-10"
        >
          <div className={`p-1.5 rounded-full shadow-lg ${
            entry.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-amber-400' :
            entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-slate-400' :
            'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}>
            {getRankIcon(entry.rank, 'sm')}
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        {/* Rank indicator on left */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.08 + 0.1, type: 'spring' }}
          className="flex items-center justify-center w-8"
        >
          {getRankIcon(entry.rank)}
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.08 + 0.15, type: 'spring' }}
        >
          <Avatar className={`w-12 h-12 ring-2 ${
            entry.isCurrentUser 
              ? 'ring-primary ring-offset-2 ring-offset-background' 
              : 'ring-white/80'
          } shadow-md`}>
            <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
            <AvatarFallback className={`font-semibold text-white ${
              entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
              entry.rank === 2 ? 'bg-gradient-to-br from-gray-400 to-slate-500' :
              entry.rank === 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
              entry.isCurrentUser ? 'bg-gradient-to-br from-primary to-primary/70' :
              'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Name & Score */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{entry.name}</p>
            {entry.isCurrentUser && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                Você
              </Badge>
            )}
          </div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 + 0.3 }}
            className="flex items-baseline gap-1 mt-0.5"
          >
            <span className={`text-2xl font-bold ${getScoreColor(entry.overallScore)}`}>
              {entry.overallScore}
            </span>
            <span className="text-xs text-muted-foreground">pontos</span>
          </motion.div>
        </div>

        {/* Stats on right - desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <StatBadge icon={Droplets} value={`${entry.hydrationScore}%`} colorClass="text-blue-600" bgClass="bg-blue-100" />
          <StatBadge icon={Utensils} value={`${entry.mealsCompleted}/${entry.mealsTotal}`} colorClass="text-green-600" bgClass="bg-green-100" />
          <StatBadge icon={Dumbbell} value={entry.workoutCompleted ? '✓' : '✗'} colorClass={entry.workoutCompleted ? "text-orange-600" : "text-gray-400"} bgClass={entry.workoutCompleted ? "bg-orange-100" : "bg-gray-100"} />
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100">
            <Scale className="w-3.5 h-3.5 text-purple-600" />
            <WeightTrend change={entry.weightChange} />
          </div>
        </div>
      </div>

      {/* Mobile Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 + 0.25 }}
        className="sm:hidden mt-3 flex items-center justify-center gap-2 flex-wrap"
      >
        <StatBadge icon={Droplets} value={`${entry.hydrationScore}%`} colorClass="text-blue-600" bgClass="bg-blue-100" />
        <StatBadge icon={Utensils} value={`${entry.mealsCompleted}/${entry.mealsTotal}`} colorClass="text-green-600" bgClass="bg-green-100" />
        <StatBadge icon={Dumbbell} value={entry.workoutCompleted ? '✓' : '✗'} colorClass={entry.workoutCompleted ? "text-orange-600" : "text-gray-400"} bgClass={entry.workoutCompleted ? "bg-orange-100" : "bg-gray-100"} />
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100">
          <Scale className="w-3.5 h-3.5 text-purple-600" />
          <WeightTrend change={entry.weightChange} />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Sub-componente das abas por categoria (Água, Refeições, Treino, Peso).
// Recebe a função "getValue" que diz como calcular a nota e o texto a exibir de
// cada participante naquela categoria, e monta uma lista ordenada por desempenho.
const CategoryRanking = ({
  entries,
  icon: Icon,
  color,
  bgColor,
  getValue
}: {
  entries: RankingEntry[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  getValue: (entry: RankingEntry) => { score: number; display: string };
}) => {
  // Ordena os participantes do maior para o menor desempenho nesta categoria
  const sorted = [...entries].sort((a, b) => getValue(b).score - getValue(a).score);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sorted.map((entry, index) => {
          const { score, display } = getValue(entry);
          const initials = entry.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
          
          return (
            <motion.div
              key={entry.userId}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                entry.isCurrentUser 
                  ? 'bg-primary/5 border-primary/20 shadow-sm' 
                  : 'bg-card border-border/30 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-center w-6">
                {index < 3 ? getRankIcon(index + 1, 'sm') : (
                  <span className="text-sm font-bold text-muted-foreground">{index + 1}º</span>
                )}
              </div>
              
              <Avatar className="w-9 h-9 ring-1 ring-border">
                <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
                <AvatarFallback className={`text-xs font-semibold text-white ${
                  entry.isCurrentUser ? 'bg-primary' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{entry.name}</span>
                  {entry.isCurrentUser && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Você</Badge>
                  )}
                </div>
                <div className="mt-1.5">
                  <Progress 
                    value={score} 
                    className="h-1.5"
                    style={{ 
                      '--progress-background': color 
                    } as React.CSSProperties}
                  />
                </div>
              </div>
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bgColor}`}>
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="font-bold text-sm" style={{ color }}>{display}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Componente principal. Recebe a lista de amigos e a data selecionada,
// e monta o placar do dia a partir desses dados.
export function FriendsRanking({ friends, selectedDate }: FriendsRankingProps) {
  // Hook de dados: calcula/traz o ranking e informa se ainda está carregando
  const { ranking, loading, fetchRanking } = useFriendsRanking();

  // Sempre que os amigos ou a data mudarem, recalcula o ranking do dia
  useEffect(() => {
    if (friends.length > 0) {
      fetchRanking(friends, selectedDate);
    }
  }, [friends, selectedDate, fetchRanking]);

  // Sem amigos, não mostra nada
  if (friends.length === 0) {
    return null;
  }

  // Enquanto carrega, exibe "esqueletos" animados no lugar dos cartões
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-b border-yellow-100">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Ranking do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-b border-yellow-100/50">
        <CardTitle className="flex items-center gap-2">
          <motion.div
            animate={{ 
              rotate: [0, -8, 8, -8, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 4
            }}
          >
            <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" fill="currentColor" />
          </motion.div>
          <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent font-bold">
            Ranking do Dia
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-6">
        {/* Abas: Geral (pontuação total) e as quatro categorias (Água, Refeições, Treino, Peso) */}
        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid grid-cols-5 w-full mb-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overall" className="text-xs px-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Trophy className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="hydration" className="text-xs px-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Droplets className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Água</span>
            </TabsTrigger>
            <TabsTrigger value="meals" className="text-xs px-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Utensils className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Refeições</span>
            </TabsTrigger>
            <TabsTrigger value="workout" className="text-xs px-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Dumbbell className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Treino</span>
            </TabsTrigger>
            <TabsTrigger value="weight" className="text-xs px-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Scale className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Peso</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall" className="space-y-3 mt-0">
            <AnimatePresence mode="popLayout">
              {ranking.map((entry, index) => (
                <RankingCard key={entry.userId} entry={entry} index={index} />
              ))}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="hydration" className="mt-0">
            <CategoryRanking
              entries={ranking}
              icon={Droplets}
              color="#2563eb"
              bgColor="bg-blue-100"
              getValue={(e) => ({ 
                score: e.hydrationScore, 
                display: `${e.waterMl}ml` 
              })}
            />
          </TabsContent>

          <TabsContent value="meals" className="mt-0">
            <CategoryRanking
              entries={ranking}
              icon={Utensils}
              color="#16a34a"
              bgColor="bg-green-100"
              getValue={(e) => ({ 
                score: e.mealsScore, 
                display: `${e.mealsCompleted}/${e.mealsTotal}` 
              })}
            />
          </TabsContent>

          <TabsContent value="workout" className="mt-0">
            <CategoryRanking
              entries={ranking}
              icon={Dumbbell}
              color="#ea580c"
              bgColor="bg-orange-100"
              getValue={(e) => ({ 
                score: e.workoutScore, 
                display: e.workoutCompleted ? 'Feito!' : 'Pendente' 
              })}
            />
          </TabsContent>

          <TabsContent value="weight" className="mt-0">
            <CategoryRanking
              entries={ranking}
              icon={Scale}
              color="#9333ea"
              bgColor="bg-purple-100"
              getValue={(e) => ({ 
                score: e.weightProgressScore,
                display: e.weightChange !== null 
                  ? `${e.weightChange >= 0 ? '-' : '+'}${Math.abs(e.weightChange).toFixed(1)}kg`
                  : 'N/A'
              })}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
