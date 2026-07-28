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
  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    if (!tracking || !user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    if (sel.getTime() !== today.getTime()) return; // only sync today

    // Build a fingerprint of the current state
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

    const fingerprint = `${waterMl}-${completedMeals}-${workoutDone}`;
    if (fingerprint === lastSyncedRef.current) return;
    lastSyncedRef.current = fingerprint;

    // Compute scores
    const hydrationScore = Math.min(100, Math.round((waterMl / 3000) * 100));
    const nutritionScore = Math.round((completedMeals / 6) * 100);
    const workoutScore = workoutDone ? 100 : 0;
    const dateStr = sel.toISOString().split('T')[0];

    const syncToArena = async () => {
      // Get all groups the user is in
      const { data: memberships } = await supabase
        .from('arena_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const { data: ownGroups } = await supabase
        .from('arena_groups')
        .select('id, pillar_hydration, pillar_nutrition, pillar_workout')
        .eq('creator_id', user.id);

      const memberGroupIds = (memberships || []).map(m => m.group_id);
      const allGroupIds = [
        ...(ownGroups || []).map(g => g.id),
        ...memberGroupIds,
      ].filter((id, i, arr) => arr.indexOf(id) === i);

      if (allGroupIds.length === 0) return;

      // Fetch group configs
      const { data: groups } = await supabase
        .from('arena_groups')
        .select('id, pillar_hydration, pillar_nutrition, pillar_workout')
        .in('id', allGroupIds);

      if (!groups) return;

      for (const group of groups) {
        const hScore = group.pillar_hydration ? hydrationScore : 0;
        const nScore = group.pillar_nutrition ? nutritionScore : 0;
        const wScore = group.pillar_workout ? workoutScore : 0;

        const activePillars = [group.pillar_hydration, group.pillar_nutrition, group.pillar_workout].filter(Boolean).length;
        const total = activePillars > 0 ? Math.round((hScore + nScore + wScore) / activePillars) : 0;

        // Get current streak
        const { data: prevScores } = await supabase
          .from('arena_daily_scores')
          .select('current_streak, date')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1);

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

    syncToArena().catch(console.error);
  }, [tracking, selectedDate, user]);
}
