// ============================================================================
// useDailyTracking  —  ACOMPANHAMENTO DIÁRIO DE HÁBITOS SAUDÁVEIS
// ----------------------------------------------------------------------------
// Hook que guarda e atualiza os hábitos do dia: água bebida, refeições feitas,
// treino, medicação e horários de hidratação. Cada dia tem um registro no
// Supabase; se ainda não existir, o app usa valores padrão (tudo zerado).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Molde (tipo) do registro diário: todos os campos acompanhados no dia,
// como mililitros de água, refeições concluídas, treino e medicação.
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

// Cria um registro "em branco" (tudo zerado/desmarcado) para um dia que ainda
// não tem dados salvos no banco. Serve de ponto de partida na tela.
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

// Recebe a data selecionada e cuida do acompanhamento daquele dia.
export function useDailyTracking(selectedDate: Date) {
  // Usuário logado (estado global de login).
  const { user } = useAuth();
  // Registro do dia atual (ou null enquanto não carregou).
  const [tracking, setTracking] = useState<DailyTracking | null>(null);
  // Indica se está carregando os dados.
  const [loading, setLoading] = useState(true);

  // Data no formato "ano-mês-dia" usado no banco.
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Busca o registro do dia no banco. Se não existir, usa o padrão zerado.
  const fetchTracking = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .single();

    // O código PGRST116 significa "nenhum registro encontrado", o que é normal
    // para um dia novo; só registramos no console outros erros de verdade.
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tracking:', error);
    }

    // Parse the hydration_schedule_completed from JSON
    // Garante que a lista de horários de hidratação seja sempre um array
    // (evita erro caso venha em formato inesperado do banco).
    const parsedData = data ? {
      ...data,
      hydration_schedule_completed: Array.isArray(data.hydration_schedule_completed) 
        ? data.hydration_schedule_completed 
        : []
    } : null;

    // Usa os dados do banco ou, se o dia não tiver registro, o padrão zerado.
    setTracking(parsedData as DailyTracking || defaultTracking(user.id, dateString));
    setLoading(false);
  }, [user, dateString]);

  // Ao abrir a tela ou trocar a data/usuário, busca o registro do dia.
  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Função central que salva qualquer mudança no registro do dia. Primeiro
  // atualiza a tela na hora (para resposta imediata) e depois grava no banco:
  // se já existe registro, atualiza; se não, cria um novo.
  const updateTracking = async (updates: Partial<DailyTracking>) => {
    if (!user) return;

    // Junta o registro atual com as mudanças e mostra na tela imediatamente.
    const newTracking = { ...tracking, ...updates } as DailyTracking;
    setTracking(newTracking);

    if (tracking?.id) {
      // Já existe registro no banco: apenas atualiza os campos alterados.
      await supabase
        .from('daily_tracking')
        .update(updates)
        .eq('id', tracking.id);
    } else {
      // Ainda não existe: cria um novo registro para o dia.
      const { data } = await supabase
        .from('daily_tracking')
        .insert({ ...newTracking, user_id: user.id })
        .select()
        .single();
      
      // Guarda o registro recém-criado (com id), tratando a lista de hidratação.
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

  // Soma "amount" ml à água do dia, sem passar de 5000 ml (limite máximo).
  const addWater = async (amount: number) => {
    const newAmount = Math.min((tracking?.water_ml || 0) + amount, 5000);
    await updateTracking({ water_ml: newAmount });
  };

  // Define a água do dia num valor exato, mantendo entre 0 e 5000 ml.
  const setWater = async (amount: number) => {
    const newAmount = Math.max(0, Math.min(amount, 5000));
    await updateTracking({ water_ml: newAmount });
  };

  // Marca/desmarca um horário da agenda de hidratação. Ao marcar, soma a água
  // daquele horário; ao desmarcar, subtrai. Sempre respeitando os limites 0-5000.
  const toggleHydrationScheduleEntry = async (entryId: string, amountMl: number) => {
    const currentCompleted = tracking?.hydration_schedule_completed || [];
    const isCompleted = currentCompleted.includes(entryId);
    
    let newCompleted: string[];
    let waterAdjustment: number;
    
    if (isCompleted) {
      // Uncheck - remove from list and subtract water
      // Desmarcar: tira o horário da lista e subtrai a água correspondente.
      newCompleted = currentCompleted.filter(id => id !== entryId);
      waterAdjustment = Math.max(0, (tracking?.water_ml || 0) - amountMl);
    } else {
      // Check - add to list and add water
      // Marcar: adiciona o horário à lista e soma a água correspondente.
      newCompleted = [...currentCompleted, entryId];
      waterAdjustment = Math.min((tracking?.water_ml || 0) + amountMl, 5000);
    }
    
    await updateTracking({ 
      hydration_schedule_completed: newCompleted,
      water_ml: waterAdjustment
    });
  };

  // Marca/desmarca uma refeição (café, almoço, jantar, lanches...). O bloco de
  // "if" é uma proteção: garante que só campos de refeição sejam alternados,
  // ignorando campos que não são refeição (id, água, treino, medicação etc.).
  const toggleMeal = async (meal: keyof DailyTracking) => {
    if (meal === 'id' || meal === 'user_id' || meal === 'date' || meal === 'water_ml' ||
        meal === 'workout_completed' || meal === 'workout_type' || meal === 'workout_notes' ||
        meal === 'medication_morning_completed' || meal === 'medication_afternoon_completed' ||
        meal === 'hydration_schedule_completed') return;
    await updateTracking({ [meal]: !tracking?.[meal] });
  };

  // Registra o treino do dia: se foi feito, o tipo e observações opcionais.
  const updateWorkout = async (completed: boolean, workoutType: string, notes?: string) => {
    await updateTracking({
      workout_completed: completed,
      workout_type: workoutType,
      workout_notes: notes || null
    });
  };

  // Marca/desmarca a medicação da manhã ou da tarde.
  const toggleMedication = async (medication: 'medication_morning_completed' | 'medication_afternoon_completed') => {
    await updateTracking({ [medication]: !tracking?.[medication] });
  };

  // Entrega para a tela: o registro do dia, o status de carregamento e todas
  // as ações (água, hidratação, refeições, treino, medicação) e o recarregar.
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
