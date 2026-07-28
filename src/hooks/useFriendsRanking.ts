// ============================================================================
// useFriendsRanking.ts  —  RANKING DE AMIGOS (COMPETIÇÃO DE HÁBITOS)
// ----------------------------------------------------------------------------
// Monta um ranking do usuário e seus amigos para um dia: puxa hidratação,
// refeições, treino e evolução de peso, converte tudo em notas de 0 a 100,
// calcula uma nota geral ponderada e ordena para mostrar quem está na frente.
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import type { FriendWithProfile } from './useFriendships';

// Formato de uma linha do ranking: identidade da pessoa, notas por hábito e dados brutos para exibir.
export interface RankingEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
  // Scores (0-100)
  hydrationScore: number;
  mealsScore: number;
  workoutScore: number;
  weightProgressScore: number;
  // Overall score
  overallScore: number;
  // Raw data for display
  waterMl: number;
  waterGoal: number;
  mealsCompleted: number;
  mealsTotal: number;
  workoutCompleted: boolean;
  weightChange: number | null; // positive = lost weight (good), negative = gained
  rank: number;
}

export function useFriendsRanking() {
  const { user, profile } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]); // ranking pronto para a tela
  const [loading, setLoading] = useState(false);

  // Recebe a lista de amigos e a data, e monta o ranking do dia.
  const fetchRanking = useCallback(async (friends: FriendWithProfile[], date: Date) => {
    if (!user || !profile) return;

    setLoading(true);
    const dateString = format(date, 'yyyy-MM-dd');

    // Junta os IDs de todos que entram no ranking: o próprio usuário mais os amigos.
    const allUserIds = [
      user.id,
      ...friends.map(f => f.friend_profile?.user_id).filter(Boolean) as string[]
    ];

    // Registro diário (água, refeições, treino) de todos, no dia escolhido.
    const { data: trackingData } = await supabase
      .from('daily_tracking')
      .select('*')
      .in('user_id', allUserIds)
      .eq('date', dateString);

    // Perfis (nome e foto) para exibir no ranking.
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', allUserIds);

    // Agenda de hidratação de cada um, usada para calcular a meta diária de água.
    const { data: hydrationSchedules } = await supabase
      .from('user_hydration_schedule')
      .select('user_id, amount_ml')
      .in('user_id', allUserIds);

    // Histórico de peso (do mais recente ao mais antigo) para medir a variação recente.
    const { data: weightHistory } = await supabase
      .from('weight_history')
      .select('user_id, weight_kg, date')
      .in('user_id', allUserIds)
      .order('date', { ascending: false });

    // Soma a meta de água de cada usuário (a agenda pode ter vários horários que se somam).
    const waterGoals: Record<string, number> = {};
    (hydrationSchedules || []).forEach(schedule => {
      if (!waterGoals[schedule.user_id]) {
        waterGoals[schedule.user_id] = 0;
      }
      waterGoals[schedule.user_id] += schedule.amount_ml;
    });

    // Calcula a variação de peso de cada usuário comparando os 2 pesos mais recentes.
    const weightChanges: Record<string, number | null> = {};
    const userWeights: Record<string, { weight_kg: number; date: string }[]> = {};
    // Guarda no máximo os 2 registros mais recentes de cada um.
    (weightHistory || []).forEach(entry => {
      if (!userWeights[entry.user_id]) {
        userWeights[entry.user_id] = [];
      }
      if (userWeights[entry.user_id].length < 2) {
        userWeights[entry.user_id].push(entry);
      }
    });

    Object.entries(userWeights).forEach(([userId, entries]) => {
      if (entries.length >= 2) {
        // Peso mais recente menos o anterior (valor negativo = emagreceu = bom).
        const change = Number(entries[0].weight_kg) - Number(entries[1].weight_kg);
        weightChanges[userId] = -change; // Inverte o sinal: positivo passa a significar "emagreceu" (bom).
      } else {
        weightChanges[userId] = null;
      }
    });

    // Monta a linha do ranking de cada pessoa, calculando as notas.
    const entries: RankingEntry[] = allUserIds.map(userId => {
      // Reúne os dados dessa pessoa a partir do que foi buscado acima.
      const tracking = (trackingData || []).find(t => t.user_id === userId);
      const profileData = (profilesData || []).find(p => p.user_id === userId);
      // Para o próprio usuário usa os dados do perfil logado; para amigos, o perfil do amigo.
      const friendProfile = userId === user.id
        ? { name: profile.name, user_id: user.id, avatar_url: profile.avatar_url }
        : friends.find(f => f.friend_profile?.user_id === userId)?.friend_profile;

      const waterMl = tracking?.water_ml || 0;         // água consumida no dia
      const waterGoal = waterGoals[userId] || 2000;    // meta de água (2000ml se não houver agenda)

      // Conta quantas das 6 refeições do dia a pessoa marcou como feitas.
      const mealsCompleted = [
        tracking?.breakfast_completed,
        tracking?.morning_snack_completed,
        tracking?.lunch_completed,
        tracking?.afternoon_snack_completed,
        tracking?.dinner_completed,
        tracking?.night_snack_completed,
      ].filter(Boolean).length;
      const mealsTotal = 6;

      const workoutCompleted = tracking?.workout_completed || false;
      const weightChange = weightChanges[userId];

      // Converte cada hábito em uma nota de 0 a 100.
      const hydrationScore = Math.min(100, Math.round((waterMl / waterGoal) * 100)); // % da meta de água (máx 100)
      const mealsScore = Math.round((mealsCompleted / mealsTotal) * 100);            // % das refeições feitas
      const workoutScore = workoutCompleted ? 100 : 0;                               // treinou = 100, senão 0

      // Nota do peso: emagreceu tende a 100, manteve = 50, engordou tende a 0.
      let weightProgressScore = 50; // valor neutro quando não dá para comparar
      if (weightChange !== null) {
        if (weightChange > 0) {
          weightProgressScore = Math.min(100, 50 + weightChange * 10);
        } else if (weightChange < 0) {
          weightProgressScore = Math.max(0, 50 + weightChange * 10);
        }
      }

      // Nota geral = média ponderada dos hábitos (refeições pesam mais; peso pesa menos).
      const overallScore = Math.round(
        hydrationScore * 0.25 +
        mealsScore * 0.30 +
        workoutScore * 0.25 +
        weightProgressScore * 0.20
      );

      return {
        userId,
        name: friendProfile?.name || profileData?.name || 'Usuário',
        avatarUrl: profileData?.avatar_url || null,
        isCurrentUser: userId === user.id,
        hydrationScore,
        mealsScore,
        workoutScore,
        weightProgressScore,
        overallScore,
        waterMl,
        waterGoal,
        mealsCompleted,
        mealsTotal,
        workoutCompleted,
        weightChange,
        rank: 0,
      };
    });

    // Ordena da maior para a menor nota geral e define a posição (1º, 2º, ...) de cada um.
    entries.sort((a, b) => b.overallScore - a.overallScore);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setRanking(entries);
    setLoading(false);
  }, [user, profile]);

  // Entrega o ranking pronto, o estado de carregamento e a função para recalcular.
  return {
    ranking,
    loading,
    fetchRanking,
  };
}
