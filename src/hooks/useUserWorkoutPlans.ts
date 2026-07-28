// ============================================================================
// useUserWorkoutPlans  —  PLANO DE TREINOS SEMANAL DO USUÁRIO
// ----------------------------------------------------------------------------
// Este hook busca, cria, edita e apaga os treinos que o usuário montou para a
// semana (guardados no Supabase). Se a pessoa ainda não montou nada, mostra um
// plano padrão pronto. Usado nas telas de treino do app.
// ============================================================================

// Ferramentas do React (estado, efeitos) e a conexão com o banco Supabase.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Descobre quem é o usuário logado no momento.
import { useAuth } from '@/contexts/AuthContext';

// Formato (molde) de um treino: descreve os campos que cada treino tem.
export interface UserWorkoutPlan {
  id?: string;
  user_id: string;
  day_of_week: number;
  workout_type: string;
  workout_name: string;
  description: string | null;
  duration: string | null;
  details: string[];
  weekly_frequency: number;
  order_index: number;
}

// Lista de treinos padrão (sugestão de semana), mostrada quando o usuário ainda
// não criou o próprio plano. Cada item traz dia da semana, tipo, nome, etc.
// Default workouts (used when user has no custom plan)
export const defaultWorkouts: Omit<UserWorkoutPlan, 'id' | 'user_id'>[] = [
  {
    day_of_week: 0,
    workout_type: 'rest',
    workout_name: 'Descanso Ativo',
    description: 'Recuperação e alongamento',
    duration: '20-30 min',
    details: [
      'Alongamento geral',
      'Caminhada leve opcional',
      'Mobilidade articular',
    ],
    weekly_frequency: 1,
    order_index: 0,
  },
  {
    day_of_week: 1,
    workout_type: 'swimming',
    workout_name: 'Natação',
    description: 'Cardiovascular de média intensidade',
    duration: '45-60 min',
    details: [
      'Aquecimento: 200m nado livre leve',
      'Principal: séries de crawl e costas',
      'Volta à calma: 100m nado leve'
    ],
    weekly_frequency: 2,
    order_index: 1,
  },
  {
    day_of_week: 2,
    workout_type: 'gym_upper',
    workout_name: 'Musculação - Superiores',
    description: 'Peito, costas, ombros, bíceps e tríceps',
    duration: '60-75 min',
    details: [
      'Supino reto: 4x10',
      'Remada curvada: 4x10',
      'Desenvolvimento: 3x12',
      'Rosca direta: 3x12',
      'Tríceps corda: 3x12',
    ],
    weekly_frequency: 2,
    order_index: 2,
  },
  {
    day_of_week: 4,
    workout_type: 'gym_lower',
    workout_name: 'Musculação - Inferiores',
    description: 'Pernas e glúteos',
    duration: '60-75 min',
    details: [
      'Agachamento livre: 4x10',
      'Leg press: 4x12',
      'Cadeira extensora: 3x12',
      'Cadeira flexora: 3x12',
      'Panturrilha: 4x15',
    ],
    weekly_frequency: 1,
    order_index: 3,
  },
  {
    day_of_week: 5,
    workout_type: 'volleyball',
    workout_name: 'Vôlei',
    description: 'Atividade de alta intensidade',
    duration: '60-90 min',
    details: [
      'Jogo recreativo/competitivo',
      'Trabalha explosão e agilidade',
    ],
    weekly_frequency: 1,
    order_index: 4,
  },
];

// Hook principal: entrega os dados e as ações de treino para as telas do app.
export function useUserWorkoutPlans() {
  const { user } = useAuth();
  // Guarda a lista de treinos que aparece na tela.
  const [workoutPlans, setWorkoutPlans] = useState<UserWorkoutPlan[]>([]);
  // Indica se ainda está carregando (para mostrar "aguarde" na tela).
  const [loading, setLoading] = useState(true);

  // Busca no banco os treinos do usuário logado, em ordem definida.
  const fetchWorkoutPlans = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index');

    if (error) {
      console.error('Error fetching workout plans:', error);
    }

    // Se o usuário não tem plano próprio, mostra os treinos padrão.
    // If user has no custom plans, use defaults
    if (!data || data.length === 0) {
      setWorkoutPlans(defaultWorkouts.map(w => ({ ...w, user_id: user.id })));
    } else {
      // Caso tenha, converte cada registro do banco para o formato da tela.
      const userPlans: UserWorkoutPlan[] = data.map(p => ({
        id: p.id,
        user_id: p.user_id,
        day_of_week: p.day_of_week,
        workout_type: p.workout_type,
        workout_name: p.workout_name,
        description: p.description,
        duration: p.duration,
        details: (p.details as unknown as string[]) || [],
        weekly_frequency: p.weekly_frequency ?? 1,
        order_index: p.order_index ?? 0,
      }));
      setWorkoutPlans(userPlans);
    }
    
    setLoading(false);
  }, [user]);

  // Assim que o hook é usado (ou o usuário muda), busca os treinos automaticamente.
  useEffect(() => {
    fetchWorkoutPlans();
  }, [fetchWorkoutPlans]);

  // Salva um treino: se já tem id, atualiza o existente; senão, cria um novo.
  const saveWorkoutPlan = async (workoutPlan: UserWorkoutPlan) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Monta o pacote de dados que será gravado no banco.
    const planData = {
      user_id: user.id,
      day_of_week: workoutPlan.day_of_week,
      workout_type: workoutPlan.workout_type,
      workout_name: workoutPlan.workout_name,
      description: workoutPlan.description,
      duration: workoutPlan.duration,
      details: JSON.parse(JSON.stringify(workoutPlan.details)),
      weekly_frequency: workoutPlan.weekly_frequency,
      order_index: workoutPlan.order_index,
    };

    if (workoutPlan.id) {
      // Já existe: atualiza o treino que tem esse id.
      const { error } = await supabase
        .from('user_workout_plans')
        .update(planData)
        .eq('id', workoutPlan.id);

      if (!error) await fetchWorkoutPlans();
      return { error };
    } else {
      // Novo: insere o treino no banco.
      const { error } = await supabase
        .from('user_workout_plans')
        .insert([planData]);

      if (!error) await fetchWorkoutPlans();
      return { error };
    }
  };

  // Apaga um treino específico (pelo id) e recarrega a lista.
  const deleteWorkoutPlan = async (workoutId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_workout_plans')
      .delete()
      .eq('id', workoutId);

    if (!error) await fetchWorkoutPlans();
    return { error };
  };

  // Adiciona um treino novo ao final da lista (calcula a próxima posição).
  const addWorkoutPlan = async (workoutPlan: Omit<UserWorkoutPlan, 'id' | 'user_id'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Descobre a maior posição atual para colocar o novo treino logo depois.
    const maxOrder = workoutPlans.reduce((max, p) => Math.max(max, p.order_index), -1);

    const planData = {
      user_id: user.id,
      ...workoutPlan,
      order_index: maxOrder + 1,
    };

    const { error } = await supabase
      .from('user_workout_plans')
      .insert([planData]);

    if (!error) await fetchWorkoutPlans();
    return { error };
  };

  // Filtra os treinos de um dia da semana (usado na visão diária).
  // Get all workouts for a specific day of week (for daily view)
  const getWorkoutsForDay = (dayOfWeek: number): UserWorkoutPlan[] => {
    return workoutPlans.filter(w => w.day_of_week === dayOfWeek);
  };

  // Soma quantas vezes por semana o usuário treina no total.
  // Get total weekly frequency
  const getTotalWeeklyWorkouts = (): number => {
    return workoutPlans.reduce((sum, w) => sum + (w.weekly_frequency || 1), 0);
  };

  // Entrega para as telas os dados e todas as ações disponíveis.
  return {
    workoutPlans,
    loading,
    saveWorkoutPlan,
    deleteWorkoutPlan,
    addWorkoutPlan,
    getWorkoutsForDay,
    getTotalWeeklyWorkouts,
    refetch: fetchWorkoutPlans,
  };
}
