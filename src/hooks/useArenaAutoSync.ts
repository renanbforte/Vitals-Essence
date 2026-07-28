// ============================================================================
// useArenaAutoSync  —  SINCRONIZA O PROGRESSO DIÁRIO COM A ARENA (AUTOMÁTICO)
// ----------------------------------------------------------------------------
// Hook que, sempre que o usuário mexe no acompanhamento do dia (treino, refeições,
// água), calcula a pontuação e envia sozinho para todos os grupos de desafio
// (Arena) dos quais ele participa. Roda em segundo plano, sem check-in manual.
// ============================================================================

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DailyTracking } from '@/hooks/useDailyTracking';

/**
 * Automatically syncs daily tracking data to Arena scores
 * whenever the user's tracking changes (workout completed, meals, water).
 * Runs silently in the background — no manual check-in required.
 */
export function useArenaAutoSync(tracking: DailyTracking | null, selectedDate: Date) {
  const { user } = useAuth();
  // Guarda uma "impressão digital" do último estado sincronizado, para não
  // reenviar dados iguais repetidas vezes (evita trabalho e escrita à toa).
  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    // Sem dados de acompanhamento ou sem usuário logado, não faz nada.
    if (!tracking || !user) return;

    // Só sincroniza quando a data escolhida na tela é HOJE (ignora dias passados).
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    if (sel.getTime() !== today.getTime()) return; // only sync today

    // Monta um resumo (fingerprint) do estado atual: água, refeições e treino.
    const meals = [
      tracking.breakfast_completed,
      tracking.morning_snack_completed,
      tracking.lunch_completed,
      tracking.afternoon_snack_completed,
      tracking.dinner_completed,
      tracking.night_snack_completed,
    ];
    const completedMeals = meals.filter(Boolean).length;
    const waterMl = tracking.water_ml || 0;
    const workoutDone = tracking.workout_completed || false;

    // Se o estado atual é igual ao último já sincronizado, encerra sem reenviar.
    const fingerprint = `${waterMl}-${completedMeals}-${workoutDone}`;
    if (fingerprint === lastSyncedRef.current) return;
    lastSyncedRef.current = fingerprint;

    // Calcula as três pontuações (0 a 100): hidratação (meta de 3000ml),
    // nutrição (6 refeições) e treino (100 se feito, 0 se não).
    const hydrationScore = Math.min(100, Math.round((waterMl / 3000) * 100));
    const nutritionScore = Math.round((completedMeals / 6) * 100);
    const workoutScore = workoutDone ? 100 : 0;
    const dateStr = sel.toISOString().split('T')[0];

    // Função que efetivamente envia as pontuações para os grupos da Arena.
    const syncToArena = async () => {
      // Busca os grupos em que o usuário entrou como membro (convite aceito).
      const { data: memberships } = await supabase
        .from('arena_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      // Busca também os grupos criados pelo próprio usuário.
      const { data: ownGroups } = await supabase
        .from('arena_groups')
        .select('id, pillar_hydration, pillar_nutrition, pillar_workout')
        .eq('creator_id', user.id);

      // Junta os IDs dos grupos (próprios + de membro) sem repetir nenhum.
      const memberGroupIds = (memberships || []).map(m => m.group_id);
      const allGroupIds = [
        ...(ownGroups || []).map(g => g.id),
        ...memberGroupIds,
      ].filter((id, i, arr) => arr.indexOf(id) === i);

      if (allGroupIds.length === 0) return;

      // Busca a configuração de cada grupo: quais "pilares" ele acompanha
      // (hidratação, nutrição, treino). Cada grupo pode cobrar pilares diferentes.
      const { data: groups } = await supabase
        .from('arena_groups')
        .select('id, pillar_hydration, pillar_nutrition, pillar_workout')
        .in('id', allGroupIds);

      if (!groups) return;

      // Para cada grupo, calcula a pontuação considerando só os pilares ativos.
      for (const group of groups) {
        const hScore = group.pillar_hydration ? hydrationScore : 0;
        const nScore = group.pillar_nutrition ? nutritionScore : 0;
        const wScore = group.pillar_workout ? workoutScore : 0;

        // A pontuação total é a média apenas dos pilares que o grupo exige.
        const activePillars = [group.pillar_hydration, group.pillar_nutrition, group.pillar_workout].filter(Boolean).length;
        const total = activePillars > 0 ? Math.round((hScore + nScore + wScore) / activePillars) : 0;

        // Pega a última pontuação registrada para calcular a sequência (streak).
        const { data: prevScores } = await supabase
          .from('arena_daily_scores')
          .select('current_streak, date')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1);

        // Regra da sequência: se o último registro foi ontem e houve pontuação,
        // soma +1; se já é do mesmo dia, mantém; caso contrário, recomeça em 1.
        let streak = 1;
        if (prevScores && prevScores.length > 0) {
          const prevDate = new Date(prevScores[0].date);
          const curDate = new Date(dateStr);
          const diffDays = Math.floor((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1 && total > 0) {
            streak = (prevScores[0].current_streak || 0) + 1;
          } else if (diffDays === 0) {
            streak = prevScores[0].current_streak || 1;
          }
        }

        // Grava (cria ou atualiza) a pontuação do dia daquele usuário no grupo.
        await supabase
          .from('arena_daily_scores')
          .upsert({
            group_id: group.id,
            user_id: user.id,
            date: dateStr,
            hydration_score: hScore,
            nutrition_score: nScore,
            workout_score: wScore,
            total_score: total,
            current_streak: streak,
          } as any, { onConflict: 'group_id,user_id,date' });
      }
    };

    // Dispara a sincronização; se der erro, apenas registra no console.
    syncToArena().catch(console.error);
    // O efeito roda novamente sempre que o acompanhamento, a data ou o usuário mudam.
  }, [tracking, selectedDate, user]);
}
