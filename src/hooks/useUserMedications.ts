import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  composition: string | null;
  dosage: string | null;
  schedule_times: string[];
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationInput {
  name: string;
  composition?: string;
  dosage?: string;
  schedule_times?: string[];
  notes?: string;
  active?: boolean;
}

export function useUserMedications() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_medications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMedications(data as Medication[]);
    }
    setLoading(false);
  }, [user]);

  const addMedication = useCallback(async (input: MedicationInput) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('user_medications')
      .insert({
        user_id: user.id,
        name: input.name,
        composition: input.composition || null,
        dosage: input.dosage || null,
        schedule_times: input.schedule_times || [],
        notes: input.notes || null,
        active: input.active ?? true,
      })
      .select()
      .single();

    if (!error && data) {
      setMedications(prev => [data as Medication, ...prev]);
    }

    return { error };
  }, [user]);

  const updateMedication = useCallback(async (id: string, input: Partial<MedicationInput>) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('user_medications')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setMedications(prev => prev.map(m => m.id === id ? data as Medication : m));
    }

    return { error };
  }, [user]);

  const deleteMedication = useCallback(async (id: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { error } = await supabase
      .from('user_medications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setMedications(prev => prev.filter(m => m.id !== id));
    }

    return { error };
  }, [user]);

  return {
    medications,
    loading,
    fetchMedications,
    addMedication,
    updateMedication,
    deleteMedication,
  };
}
