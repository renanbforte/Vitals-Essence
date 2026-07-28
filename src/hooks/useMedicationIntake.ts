// ============================================================================
// useMedicationIntake  —  CONTROLE DE "TOMEI MEU REMÉDIO"
// ----------------------------------------------------------------------------
// Hook que controla, para o dia selecionado, quais doses de remédio o usuário
// já marcou como tomadas. Cada dose é um remédio em um horário; o hook permite
// marcar/desmarcar e saber se determinada dose já foi tomada.
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Registro de uma dose: qual remédio, em qual horário, em qual dia e se foi tomada.
export interface MedicationIntake {
  id: string;
  user_id: string;
  medication_id: string;
  schedule_time: string;
  intake_date: string;
  completed: boolean;
  completed_at: string | null;
}

// Recebe a data selecionada e devolve o controle de doses daquele dia.
export function useMedicationIntake(selectedDate: Date) {
  const { user } = useAuth();
  const [intakeLogs, setIntakeLogs] = useState<MedicationIntake[]>([]); // doses registradas no dia
  const [loading, setLoading] = useState(true);

  // Data escolhida no formato do banco (AAAA-MM-DD).
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Busca no banco os registros de doses deste usuário para o dia selecionado.
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

  // Recarrega os registros sempre que a data (ou o usuário) muda.
  useEffect(() => {
    fetchIntakeLogs();
  }, [fetchIntakeLogs]);

  // Marca ou desmarca uma dose (remédio + horário). É o coração do hook:
  // se ainda não existe registro, cria como "tomada"; se já existe, inverte o estado.
  const toggleIntake = useCallback(async (medicationId: string, scheduleTime: string) => {
    if (!user) return { error: new Error('User not authenticated') };

    // Procura se já existe registro para esse remédio nesse horário.
    const existingEntry = intakeLogs.find(
      log => log.medication_id === medicationId && log.schedule_time === scheduleTime
    );

    if (existingEntry) {
      // Já existe: inverte entre tomada/não tomada e guarda a hora se foi tomada.
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
      // Não existe ainda: cria o registro já marcado como tomado agora.
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

  // Responde à tela: essa dose específica já foi tomada? (usado para marcar o "check").
  const isCompleted = useCallback((medicationId: string, scheduleTime: string): boolean => {
    const entry = intakeLogs.find(
      log => log.medication_id === medicationId && log.schedule_time === scheduleTime
    );
    return entry?.completed ?? false;
  }, [intakeLogs]);

  // Entrega os dados e as funções para a tela usar.
  return {
    intakeLogs,
    loading,
    toggleIntake,
    isCompleted,
    refetch: fetchIntakeLogs,
  };
}
