import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { DailyTracking } from './useDailyTracking';
import type { MealPhoto } from './useMealPhotos';
import type { ProgressPhoto } from './useProgressPhotos';

export interface FriendDailyData {
  tracking: DailyTracking | null;
  mealPhotos: MealPhoto[];
  progressPhoto: ProgressPhoto | null;
}

export function useFriendData() {
  const [loading, setLoading] = useState(false);

  const fetchFriendData = useCallback(async (friendUserId: string, date: Date): Promise<FriendDailyData> => {
    setLoading(true);
    const dateString = format(date, 'yyyy-MM-dd');

    // Fetch friend's daily tracking
    const { data: trackingData } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', friendUserId)
      .eq('date', dateString)
      .maybeSingle();

    // Fetch friend's meal photos
    const { data: mealPhotosData } = await supabase
      .from('meal_photos')
      .select('*')
      .eq('user_id', friendUserId)
      .eq('date', dateString);

    // Fetch friend's progress photo
    const { data: progressPhotoData } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', friendUserId)
      .eq('date', dateString)
      .maybeSingle();

    setLoading(false);

    return {
      tracking: trackingData ? {
        ...trackingData,
        hydration_schedule_completed: Array.isArray(trackingData.hydration_schedule_completed) 
          ? trackingData.hydration_schedule_completed 
          : []
      } as DailyTracking : null,
      mealPhotos: (mealPhotosData || []) as MealPhoto[],
      progressPhoto: progressPhotoData as ProgressPhoto | null,
    };
  }, []);

  return {
    loading,
    fetchFriendData,
  };
}
