// ============================================================================
// useDailyActivities  —  TAREFAS/ATIVIDADES DIÁRIAS DO USUÁRIO
// ----------------------------------------------------------------------------
// Hook que gerencia a lista de atividades de um dia escolhido: buscar, criar,
// marcar como feita e apagar. Também repete automaticamente para o dia atual
// as atividades marcadas como "diárias" (repeat_daily) do dia anterior.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays } from 'date-fns';

// Molde (tipo) de uma atividade diária: título, se foi concluída, a data,
// se deve se repetir todo dia e quando foi criada.
export interface DailyActivity {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  date: string;
  repeat_daily: boolean;
  created_at: string;
}

// Recebe a data selecionada na tela e cuida das atividades daquele dia.
export function useDailyActivities(selectedDate: Date) {
  // Usuário logado (estado global de login).
  const { user } = useAuth();
  // Lista de atividades do dia mostrada na tela.
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  // Indica se está carregando os dados.
  const [loading, setLoading] = useState(true);

  // Converte a data para o formato "ano-mês-dia" usado no banco.
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Busca as atividades do dia. Se o dia estiver vazio, copia as atividades
  // "diárias" do dia anterior para o dia atual (para o usuário não precisar
  // recriá-las manualmente todo dia).
  const fetchActivities = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Fetch activities for selected date
    // Busca as atividades já existentes para a data selecionada.
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
    // Se o dia ainda não tem nenhuma atividade, procura no dia anterior as que
    // estão marcadas para repetir diariamente.
    if ((!todayActivities || todayActivities.length === 0)) {
      const yesterday = format(subDays(selectedDate, 1), 'yyyy-MM-dd');

      const { data: repeatingActivities } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .eq('repeat_daily', true);

      // Create copies of repeating activities for today
      // Cria cópias dessas atividades repetíveis já com a data de hoje e
      // desmarcadas (completed: false), e salva no banco.
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

    // Caso normal: usa as atividades que já existiam para o dia.
    setActivities((todayActivities || []) as DailyActivity[]);
    setLoading(false);
  }, [user, dateString, selectedDate]);

  // Ao abrir a tela ou trocar a data/usuário, busca as atividades.
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Cria uma nova atividade para o dia. "repeatDaily" define se ela deve se
  // repetir todos os dias. Atualiza a lista na tela na hora, sem recarregar.
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

  // Marca/desmarca uma atividade como concluída (inverte o estado atual).
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

  // Apaga uma atividade. Se "deleteAllRepeating" for verdadeiro e a atividade
  // for diária, apaga também todas as futuras cópias dela (de hoje em diante).
  const deleteActivity = async (id: string, deleteAllRepeating: boolean = false) => {
    const activity = activities.find(a => a.id === id);
    if (!activity || !user) return;

    if (deleteAllRepeating && activity.repeat_daily) {
      // Delete all future occurrences with the same title and repeat_daily
      // Apaga todas as ocorrências futuras (mesmo título, diárias, data >= hoje).
      await supabase
        .from('daily_activities')
        .delete()
        .eq('user_id', user.id)
        .eq('title', activity.title)
        .eq('repeat_daily', true)
        .gte('date', dateString);
    } else {
      // Just delete this one
      // Apaga apenas esta atividade específica.
      await supabase
        .from('daily_activities')
        .delete()
        .eq('id', id);
    }

    // Remove a atividade da lista mostrada na tela.
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  // Liga/desliga a repetição diária de uma atividade já existente.
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

  // Entrega para a tela: a lista, o status de carregamento e todas as ações
  // (adicionar, marcar, apagar, alterar repetição) e o recarregar manual.
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
