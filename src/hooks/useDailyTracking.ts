import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface DailyTracking {
  id?: string;
  user_id: string;
  date: string;
  water_ml: number;
  breakfast_completed: boolean;
  morning_snack_completed: boolean;
  lunch_completed: boolean;
  afternoon_snack_completed: boolean;
  dinner_completed: boolean;
  night_snack_completed: boolean;
  workout_completed: boolean;
  workout_type: string | null;
  workout_notes: string | null;
  medication_morning_completed: boolean;
  medication_afternoon_completed: boolean;
  hydration_schedule_completed: string[];
}

const defaultTracking = (userId: string, date: string): DailyTracking => ({
  user_id: userId,
  date,
  water_ml: 0,
  breakfast_completed: false,
  morning_snack_completed: false,
  lunch_completed: false,
  afternoon_snack_completed: false,
  dinner_completed: false,
  night_snack_completed: false,
  workout_completed: false,
  workout_type: null,
  workout_notes: null,
  medication_morning_completed: false,
  medication_afternoon_completed: false,
  hydration_schedule_completed: [],
});

export function useDailyTracking(selectedDate: Date) {
  const { user } = useAuth();
  const [tracking, setTracking] = useState<DailyTracking | null>(null);
  const [loading, setLoading] = useState(true);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const fetchTracking = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tracking:', error);
    }

    // Parse the hydration_schedule_completed from JSON
    const parsedData = data ? {
      ...data,
      hydration_schedule_completed: Array.isArray(data.hydration_schedule_completed) 
        ? data.hydration_schedule_completed 
        : []
    } : null;

    setTracking(parsedData as DailyTracking || defaultTracking(user.id, dateString));
    setLoading(false);
  }, [user, dateString]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  const updateTracking = async (updates: Partial<DailyTracking>) => {
    if (!user) return;

    const newTracking = { ...tracking, ...updates } as DailyTracking;
    setTracking(newTracking);

    if (tracking?.id) {
      await supabase
        .from('daily_tracking')
        .update(updates)
        .eq('id', tracking.id);
    } else {
      const { data } = await supabase
        .from('daily_tracking')
        .insert({ ...newTracking, user_id: user.id })
        .select()
        .single();
      
      if (data) {
        const parsedData = {
          ...data,
          hydration_schedule_completed: Array.isArray(data.hydration_schedule_completed) 
            ? data.hydration_schedule_completed 
            : []
        };
        setTracking(parsedData as DailyTracking);
      }
    }
  };

  const addWater = async (amount: number) => {
    const newAmount = Math.min((tracking?.water_ml || 0) + amount, 5000);
    await updateTracking({ water_ml: newAmount });
  };

  const setWater = async (amount: number) => {
    const newAmount = Math.max(0, Math.min(amount, 5000));
    await updateTracking({ water_ml: newAmount });
  };

  const toggleHydrationScheduleEntry = async (entryId: string, amountMl: number) => {
    const currentCompleted = tracking?.hydration_schedule_completed || [];
    const isCompleted = currentCompleted.includes(entryId);
    
    let newCompleted: string[];
    let waterAdjustment: number;
    
    if (isCompleted) {
      // Uncheck - remove from list and subtract water
      newCompleted = currentCompleted.filter(id => id !== entryId);
      waterAdjustment = Math.max(0, (tracking?.water_ml || 0) - amountMl);
    } else {
      // Check - add to list and add water
      newCompleted = [...currentCompleted, entryId];
      waterAdjustment = Math.min((tracking?.water_ml || 0) + amountMl, 5000);
    }
    
    await updateTracking({ 
      hydration_schedule_completed: newCompleted,
      water_ml: waterAdjustment
    });
  };

  const toggleMeal = async (meal: keyof DailyTracking) => {
    if (meal === 'id' || meal === 'user_id' || meal === 'date' || meal === 'water_ml' || 
        meal === 'workout_completed' || meal === 'workout_type' || meal === 'workout_notes' ||
        meal === 'medication_morning_completed' || meal === 'medication_afternoon_completed' ||
        meal === 'hydration_schedule_completed') return;
    await updateTracking({ [meal]: !tracking?.[meal] });
  };

  const updateWorkout = async (completed: boolean, workoutType: string, notes?: string) => {
    await updateTracking({ 
      workout_completed: completed, 
      workout_type: workoutType,
      workout_notes: notes || null 
    });
  };

  const toggleMedication = async (medication: 'medication_morning_completed' | 'medication_afternoon_completed') => {
    await updateTracking({ [medication]: !tracking?.[medication] });
  };

  return {
    tracking,
    loading,
    addWater,
    setWater,
    toggleHydrationScheduleEntry,
    toggleMeal,
    updateWorkout,
    toggleMedication,
    refetch: fetchTracking,
  };
}
