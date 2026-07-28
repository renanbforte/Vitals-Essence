import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface HydrationEntry {
  id: string;
  user_id: string;
  schedule_time: string;
  amount_ml: number;
  label: string;
  order_index: number;
}

const DEFAULT_SCHEDULE: Omit<HydrationEntry, 'id' | 'user_id'>[] = [
  { schedule_time: '07:00', amount_ml: 250, label: 'Ao acordar', order_index: 0 },
  { schedule_time: '09:00', amount_ml: 250, label: 'Manhã 1', order_index: 1 },
  { schedule_time: '11:00', amount_ml: 500, label: 'Manhã 2', order_index: 2 },
  { schedule_time: '13:00', amount_ml: 250, label: 'Almoço', order_index: 3 },
  { schedule_time: '15:00', amount_ml: 500, label: 'Tarde 1', order_index: 4 },
  { schedule_time: '17:00', amount_ml: 500, label: 'Tarde 2', order_index: 5 },
  { schedule_time: '19:00', amount_ml: 250, label: 'Noite 1', order_index: 6 },
  { schedule_time: '21:00', amount_ml: 500, label: 'Noite 2', order_index: 7 },
];

export function useHydrationSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<HydrationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_hydration_schedule')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching hydration schedule:', error);
    } else if (data && data.length > 0) {
      setSchedule(data as HydrationEntry[]);
    } else {
      // Create default schedule for new users
      await createDefaultSchedule();
    }
    
    setLoading(false);
  }, [user]);

  const createDefaultSchedule = async () => {
    if (!user) return;

    const entries = DEFAULT_SCHEDULE.map(entry => ({
      ...entry,
      user_id: user.id,
    }));

    const { data, error } = await supabase
      .from('user_hydration_schedule')
      .insert(entries)
      .select();

    if (error) {
      console.error('Error creating default schedule:', error);
    } else if (data) {
      setSchedule(data as HydrationEntry[]);
    }
  };

  const updateEntry = async (id: string, updates: Partial<HydrationEntry>) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_hydration_schedule')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating entry:', error);
    } else {
      setSchedule(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  };

  const addEntry = async (entry: Omit<HydrationEntry, 'id' | 'user_id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_hydration_schedule')
      .insert({ ...entry, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding entry:', error);
    } else if (data) {
      setSchedule(prev => [...prev, data as HydrationEntry].sort((a, b) => a.order_index - b.order_index));
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_hydration_schedule')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
    } else {
      setSchedule(prev => prev.filter(e => e.id !== id));
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const totalScheduledMl = schedule.reduce((sum, e) => sum + e.amount_ml, 0);

  return {
    schedule,
    loading,
    totalScheduledMl,
    updateEntry,
    addEntry,
    deleteEntry,
    refetch: fetchSchedule,
  };
}
