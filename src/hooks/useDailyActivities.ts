import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

export interface DailyActivity {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  date: string;
  repeat_daily: boolean;
  created_at: string;
}

export function useDailyActivities(selectedDate: Date) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const fetchActivities = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch activities for selected date
    const { data: todayActivities, error } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
      return;
    }

    // If no activities for today, check for repeating activities from yesterday
    if ((!todayActivities || todayActivities.length === 0)) {
      const yesterday = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
      
      const { data: repeatingActivities } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .eq('repeat_daily', true);

      // Create copies of repeating activities for today
      if (repeatingActivities && repeatingActivities.length > 0) {
        const newActivities = repeatingActivities.map(activity => ({
          user_id: user.id,
          title: activity.title,
          completed: false,
          date: dateString,
          repeat_daily: true,
        }));

        const { data: insertedActivities } = await supabase
          .from('daily_activities')
          .insert(newActivities)
          .select();

        setActivities((insertedActivities || []) as DailyActivity[]);
        setLoading(false);
        return;
      }
    }

    setActivities((todayActivities || []) as DailyActivity[]);
    setLoading(false);
  }, [user, dateString, selectedDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = async (title: string, repeatDaily: boolean = false) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('daily_activities')
      .insert({
        user_id: user.id,
        title,
        date: dateString,
        repeat_daily: repeatDaily,
        completed: false,
      })
      .select()
      .single();

    if (!error && data) {
      setActivities(prev => [...prev, data as DailyActivity]);
    }

    return { error };
  };

  const toggleActivity = async (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return;

    const { error } = await supabase
      .from('daily_activities')
      .update({ completed: !activity.completed })
      .eq('id', id);

    if (!error) {
      setActivities(prev =>
        prev.map(a => (a.id === id ? { ...a, completed: !a.completed } : a))
      );
    }
  };

  const deleteActivity = async (id: string, deleteAllRepeating: boolean = false) => {
    const activity = activities.find(a => a.id === id);
    if (!activity || !user) return;

    if (deleteAllRepeating && activity.repeat_daily) {
      // Delete all future occurrences with the same title and repeat_daily
      await supabase
        .from('daily_activities')
        .delete()
        .eq('user_id', user.id)
        .eq('title', activity.title)
        .eq('repeat_daily', true)
        .gte('date', dateString);
    } else {
      // Just delete this one
      await supabase
        .from('daily_activities')
        .delete()
        .eq('id', id);
    }

    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const updateRepeatDaily = async (id: string, repeatDaily: boolean) => {
    const { error } = await supabase
      .from('daily_activities')
      .update({ repeat_daily: repeatDaily })
      .eq('id', id);

    if (!error) {
      setActivities(prev =>
        prev.map(a => (a.id === id ? { ...a, repeat_daily: repeatDaily } : a))
      );
    }
  };

  return {
    activities,
    loading,
    addActivity,
    toggleActivity,
    deleteActivity,
    updateRepeatDaily,
    refetch: fetchActivities,
  };
}
