import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface WeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  created_at: string;
}

export function useWeightHistory() {
  const { user } = useAuth();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeights = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching weights:', error);
    } else {
      setWeights((data || []) as WeightEntry[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWeights();
  }, [fetchWeights]);

  const addWeight = async (weightKg: number, date?: Date) => {
    if (!user) return { error: new Error('Not authenticated') };

    const dateString = format(date || new Date(), 'yyyy-MM-dd');

    // Check if entry exists for this date
    const { data: existing } = await supabase
      .from('weight_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .single();

    if (existing) {
      // Update existing entry
      const { error } = await supabase
        .from('weight_history')
        .update({ weight_kg: weightKg })
        .eq('id', existing.id);

      if (!error) {
        await fetchWeights();
      }
      return { error };
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('weight_history')
        .insert({
          user_id: user.id,
          date: dateString,
          weight_kg: weightKg,
        });

      if (!error) {
        await fetchWeights();
      }
      return { error };
    }
  };

  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;

  return {
    weights,
    loading,
    addWeight,
    latestWeight,
    refetch: fetchWeights,
  };
}
