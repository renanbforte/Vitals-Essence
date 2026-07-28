// ============================================================================
// useTasks.ts  —  GERENCIADOR DE TAREFAS DO USUARIO
// ----------------------------------------------------------------------------
// Busca, cria, atualiza e apaga as tarefas do usuario no Supabase. Alem disso,
// calcula a PRIORIDADE (cor) e o GRUPO (agora/hoje/semana/depois) de cada
// tarefa e monta um resumo do dia usado no card do Hub (tela inicial).
// ============================================================================

// Ferramentas do React (estados, efeitos, memorizacao de calculos), conexao
// com o banco Supabase, dados do usuario logado e utilitarios de data/hora.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, isThisWeek, addMinutes, differenceInMinutes } from 'date-fns';

// Molde (formato) de uma Tarefa: descreve todos os campos que uma tarefa tem
// no banco de dados (titulo, datas, horarios, status, energia exigida, etc).
export interface Task {
  id: string;
  user_id: string;
  title: string;
  type: 'recorrente' | 'pontual';
  life_area: string;
  sub_area: string | null;
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  recurrence: string | null;
  recurrence_days: number[] | null;
  flexibility: 'fixa' | 'flexivel';
  estimated_duration: number | null;
  energy_required: 'baixa' | 'media' | 'alta';
  status: 'a_fazer' | 'em_andamento' | 'feita' | 'adiada';
  can_skip: boolean;
  notes: string | null;
  location: string | null;
  link: string | null;
  postpone_count: number;
  completed_at: string | null;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
}

// As quatro cores possiveis de prioridade e os quatro grupos de tempo.
export type TaskPriority = 'green' | 'yellow' | 'orange' | 'red';
export type TaskGroup = 'agora' | 'hoje' | 'semana' | 'depois';

// Calcula a COR de prioridade de uma tarefa (verde=tranquilo ... vermelho=urgente).
// Usa a data/horario da tarefa comparados com o momento atual para decidir a cor.
export function calculatePriority(task: Task): TaskPriority {
  if (task.status === 'feita') return 'green';
  
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  
  // If task has a specific time today
  if (task.start_date === today && task.start_time) {
    const [h, m] = task.start_time.split(':').map(Number);
    const taskTime = new Date(now);
    taskTime.setHours(h, m, 0, 0);
    const diff = differenceInMinutes(taskTime, now);
    
    if (diff < -30) return 'red'; // Past due by 30+ min
    if (diff < 0) return 'orange'; // Just past due
    if (diff < 60) return 'orange'; // Within next hour
    if (diff < 180) return 'yellow'; // Within 3 hours
    return 'green';
  }
  
  // If task date is past
  if (task.start_date && task.start_date < today) return 'red';
  
  // If task is today but no time
  if (task.start_date === today) return 'yellow';
  
  // If postponed multiple times
  if (task.postpone_count >= 3) return 'orange';
  if (task.postpone_count >= 1) return 'yellow';
  
  return 'green';
}

// Decide em qual GRUPO de tempo a tarefa aparece na tela:
// agora (proxima 1h), hoje, esta semana ou depois.
export function getTaskGroup(task: Task): TaskGroup {
  if (task.status === 'feita') return 'hoje';
  
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  
  if (task.start_date === today && task.start_time) {
    const [h, m] = task.start_time.split(':').map(Number);
    const taskTime = new Date(now);
    taskTime.setHours(h, m, 0, 0);
    const diff = differenceInMinutes(taskTime, now);
    if (diff <= 60 && diff >= -60) return 'agora';
  }
  
  if (!task.start_date || task.start_date === today || task.start_date < today) return 'hoje';
  
  if (task.start_date) {
    const taskDate = new Date(task.start_date + 'T00:00:00');
    if (isThisWeek(taskDate, { weekStartsOn: 1 })) return 'semana';
  }
  
  return 'depois';
}

// Peso de cada cor para ordenar: vermelho (0) vem primeiro, verde (3) por ultimo.
const priorityWeight: Record<TaskPriority, number> = { red: 0, orange: 1, yellow: 2, green: 3 };

// Hook principal: entrega a lista de tarefas e todas as acoes (criar, atualizar,
// concluir, adiar, apagar) para as telas que precisam mexer com tarefas.
export function useTasks() {
  const { user } = useAuth();
  // Lista de tarefas em memoria e indicador de "carregando".
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca no Supabase as tarefas do usuario que ainda NAO foram feitas,
  // ordenadas por data e horario de inicio.
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'feita')
      .order('start_date', { ascending: true, nullsFirst: false })
      .order('start_time', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setTasks(data as unknown as Task[]);
    }
    setLoading(false);
  }, [user]);

  // Ao abrir a tela (ou trocar de usuario), busca as tarefas automaticamente.
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Reorganiza as tarefas em grupos (agora/hoje/semana/depois) e ordena cada
  // grupo por prioridade. So recalcula quando a lista de tarefas muda.
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskGroup, Task[]> = { agora: [], hoje: [], semana: [], depois: [] };
    
    tasks.forEach(task => {
      const group = getTaskGroup(task);
      groups[group].push(task);
    });

    // Sort each group by priority
    Object.keys(groups).forEach(key => {
      groups[key as TaskGroup].sort((a, b) => {
        const pa = priorityWeight[calculatePriority(a)];
        const pb = priorityWeight[calculatePriority(b)];
        if (pa !== pb) return pa - pb;
        // Flexible tasks sink
        if (a.flexibility !== b.flexibility) return a.flexibility === 'flexivel' ? 1 : -1;
        return 0;
      });
    });

    return groups;
  }, [tasks]);

  // Cria uma nova tarefa no banco (ja associada ao usuario logado) e a adiciona
  // na lista em memoria para aparecer na tela na hora.
  const addTask = async (taskData: Partial<Task>) => {
    if (!user) return { error: new Error('No user') };
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...taskData, user_id: user.id } as any)
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => [...prev, data as unknown as Task]);
    }
    return { error, data: data as unknown as Task | null };
  };

  // Atualiza campos de uma tarefa. Se ela foi marcada como "feita", some da
  // lista (que so mostra pendentes); caso contrario, apenas atualiza na tela.
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates as any)
      .eq('id', id);

    if (!error) {
      if (updates.status === 'feita') {
        setTasks(prev => prev.filter(t => t.id !== id));
      } else {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      }
    }
    return { error };
  };

  // Conclui uma tarefa: marca como "feita" e guarda a data/hora da conclusao.
  const completeTask = async (id: string) => {
    return updateTask(id, { status: 'feita', completed_at: new Date().toISOString() });
  };

  // Adia a tarefa para amanha e soma +1 no contador de adiamentos (quanto mais
  // adiada, mais a prioridade sobe, para nao ser esquecida).
  const postponeTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const tomorrow = format(addMinutes(new Date(), 24 * 60), 'yyyy-MM-dd');
    return updateTask(id, {
      status: 'adiada',
      start_date: tomorrow,
      postpone_count: (task.postpone_count || 0) + 1,
    });
  };

  // Apaga a tarefa do banco de forma permanente e a remove da lista na tela.
  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  // Stats for the Hub card
  // Resumo do dia para o card do Hub: quantas tarefas ha para agora/hoje,
  // quantas sao criticas (vermelhas/laranjas) e as 3 principais.
  const todayStats = useMemo(() => {
    const todayTasks = [...groupedTasks.agora, ...groupedTasks.hoje];
    const total = todayTasks.length;
    const critical = todayTasks.filter(t => {
      const p = calculatePriority(t);
      return p === 'red' || p === 'orange';
    }).length;
    const topTasks = todayTasks.slice(0, 3);
    return { total, critical, topTasks };
  }, [groupedTasks]);

  // Entrega para as telas tudo que elas precisam: dados e acoes de tarefas.
  return {
    tasks,
    loading,
    groupedTasks,
    todayStats,
    addTask,
    updateTask,
    completeTask,
    postponeTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
