import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';
import type { DailyTracking } from './useDailyTracking';

export function useTrackingHistory(days: number = 14) {
  const { user } = useAuth();
  const [trackingHistory, setTrackingHistory] = useState<DailyTracking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const endDate = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching tracking history:', error);
    } else {
      setTrackingHistory((data || []) as DailyTracking[]);
    }
    
    setLoading(false);
  }, [user, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    trackingHistory,
    loading,
    refetch: fetchHistory,
  };
}
