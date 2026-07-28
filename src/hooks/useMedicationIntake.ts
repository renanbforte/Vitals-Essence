import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface MedicationIntake {
  id: string;
  user_id: string;
  medication_id: string;
  schedule_time: string;
  intake_date: string;
  completed: boolean;
  completed_at: string | null;
}

export function useMedicationIntake(selectedDate: Date) {
  const { user } = useAuth();
  const [intakeLogs, setIntakeLogs] = useState<MedicationIntake[]>([]);
  const [loading, setLoading] = useState(true);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const fetchIntakeLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('medication_intake_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('intake_date', dateString);

    if (!error && data) {
      setIntakeLogs(data as MedicationIntake[]);
    }
    setLoading(false);
  }, [user, dateString]);

  useEffect(() => {
    fetchIntakeLogs();
  }, [fetchIntakeLogs]);

  const toggleIntake = useCallback(async (medicationId: string, scheduleTime: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    // Check if entry exists
    const existingEntry = intakeLogs.find(
      log => log.medication_id === medicationId && log.schedule_time === scheduleTime
    );

    if (existingEntry) {
      // Toggle the completed status
      const newCompleted = !existingEntry.completed;
      const { error } = await supabase
        .from('medication_intake_log')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEntry.id);

      if (!error) {
        setIntakeLogs(prev =>
          prev.map(log =>
            log.id === existingEntry.id
              ? { ...log, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
              : log
          )
        );
      }

      return { error };
    } else {
      // Create new entry as completed
      const { data, error } = await supabase
        .from('medication_intake_log')
        .insert({
          user_id: user.id,
          medication_id: medicationId,
          schedule_time: scheduleTime,
          intake_date: dateString,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        setIntakeLogs(prev => [...prev, data as MedicationIntake]);
      }

      return { error };
    }
  }, [user, dateString, intakeLogs]);

  const isCompleted = useCallback((medicationId: string, scheduleTime: string): boolean => {
    const entry = intakeLogs.find(
      log => log.medication_id === medicationId && log.schedule_time === scheduleTime
    );
    return entry?.completed ?? false;
  }, [intakeLogs]);

  return {
    intakeLogs,
    loading,
    toggleIntake,
    isCompleted,
    refetch: fetchIntakeLogs,
  };
}
