import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import type { FriendWithProfile } from './useFriendships';

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
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRanking = useCallback(async (friends: FriendWithProfile[], date: Date) => {
    if (!user || !profile) return;

    setLoading(true);
    const dateString = format(date, 'yyyy-MM-dd');

    // Collect all user IDs (friends + current user)
    const allUserIds = [
      user.id,
      ...friends.map(f => f.friend_profile?.user_id).filter(Boolean) as string[]
    ];

    // Fetch daily tracking for all users
    const { data: trackingData } = await supabase
      .from('daily_tracking')
      .select('*')
      .in('user_id', allUserIds)
      .eq('date', dateString);

    // Fetch profiles to get avatar URLs
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .in('user_id', allUserIds);

    // Fetch hydration schedules to calculate water goals
    const { data: hydrationSchedules } = await supabase
      .from('user_hydration_schedule')
      .select('user_id, amount_ml')
      .in('user_id', allUserIds);

    // Fetch weight history (last 2 entries per user to calculate change)
    const { data: weightHistory } = await supabase
      .from('weight_history')
      .select('user_id, weight_kg, date')
      .in('user_id', allUserIds)
      .order('date', { ascending: false });

    // Calculate water goals per user
    const waterGoals: Record<string, number> = {};
    (hydrationSchedules || []).forEach(schedule => {
      if (!waterGoals[schedule.user_id]) {
        waterGoals[schedule.user_id] = 0;
      }
      waterGoals[schedule.user_id] += schedule.amount_ml;
    });

    // Calculate weight changes per user (compare last 2 entries)
    const weightChanges: Record<string, number | null> = {};
    const userWeights: Record<string, { weight_kg: number; date: string }[]> = {};
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
        // Latest minus previous (negative = lost weight = good)
        const change = Number(entries[0].weight_kg) - Number(entries[1].weight_kg);
        weightChanges[userId] = -change; // Invert so positive = good (lost weight)
      } else {
        weightChanges[userId] = null;
      }
    });

    // Build ranking entries
    const entries: RankingEntry[] = allUserIds.map(userId => {
      const tracking = (trackingData || []).find(t => t.user_id === userId);
      const profileData = (profilesData || []).find(p => p.user_id === userId);
      const friendProfile = userId === user.id 
        ? { name: profile.name, user_id: user.id, avatar_url: profile.avatar_url }
        : friends.find(f => f.friend_profile?.user_id === userId)?.friend_profile;

      const waterMl = tracking?.water_ml || 0;
      const waterGoal = waterGoals[userId] || 2000; // Default 2000ml
      
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

      // Calculate scores (0-100)
      const hydrationScore = Math.min(100, Math.round((waterMl / waterGoal) * 100));
      const mealsScore = Math.round((mealsCompleted / mealsTotal) * 100);
      const workoutScore = workoutCompleted ? 100 : 0;
      
      // Weight progress score: if lost weight = 100, maintained = 50, gained = 0
      let weightProgressScore = 50; // Default neutral
      if (weightChange !== null) {
        if (weightChange > 0) {
          weightProgressScore = Math.min(100, 50 + weightChange * 10);
        } else if (weightChange < 0) {
          weightProgressScore = Math.max(0, 50 + weightChange * 10);
        }
      }

      // Overall score (weighted average)
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

    // Sort by overall score and assign ranks
    entries.sort((a, b) => b.overallScore - a.overallScore);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setRanking(entries);
    setLoading(false);
  }, [user, profile]);

  return {
    ranking,
    loading,
    fetchRanking,
  };
}
