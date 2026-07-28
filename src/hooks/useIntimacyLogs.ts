// ============================================================================
// useIntimacyLogs.ts  —  DIÁRIO DE INTIMIDADE (REGISTROS E ESTATÍSTICAS)
// ----------------------------------------------------------------------------
// Hook que guarda os registros de vida íntima do usuário no Supabase. Lista os
// registros, permite adicionar e apagar, e calcula estatísticas simples (média
// de satisfação/prazer, total e quantos houve neste mês) para exibir na tela.
// ============================================================================

// React Query cuida de buscar/salvar dados com cache automático; Supabase é o
// banco; useAuth traz o usuário logado; toast mostra avisinhos de sucesso/erro.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Formato de um registro do diário (data, duração, avaliações, proteção etc.).
export interface IntimacyLog {
  id: string;
  user_id: string;
  log_date: string;
  log_time?: string;
  duration_minutes?: number;
  activity_type: string[];
  partner_label?: string;
  location?: string;
  desire_before?: number;
  satisfaction?: number;
  pleasure?: number;
  orgasm?: string;
  energy_level?: string;
  mood?: string;
  contraception_used?: string;
  protection_used: boolean;
  discomfort?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Formato usado ao CRIAR um registro: o próprio banco preenche id, usuário e
// datas de criação/atualização, então esses campos não são enviados.
export type IntimacyLogInsert = Omit<IntimacyLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export function useIntimacyLogs() {
  // Usuário logado e o "gerente de cache" do React Query.
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Busca todos os registros do usuário, do mais recente para o mais antigo.
  // Só roda quando há usuário logado (enabled).
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['intimacy_logs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intimacy_logs')
        .select('*')
        .order('log_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IntimacyLog[];
    },
  });

  // Adiciona um novo registro; ao salvar, atualiza a lista e avisa o usuário.
  const addLog = useMutation({
    mutationFn: async (payload: IntimacyLogInsert) => {
      const { error } = await supabase
        .from('intimacy_logs')
        .insert({ ...payload, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      // Marca a lista como "desatualizada" para o React Query buscar de novo.
      queryClient.invalidateQueries({ queryKey: ['intimacy_logs'] });
      toast.success('Registro salvo');
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  // Remove um registro pelo seu id; ao concluir, atualiza a lista e avisa.
  const deleteLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('intimacy_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intimacy_logs'] });
      toast.success('Registro removido');
    },
  });

  // Estatísticas simples calculadas a partir dos registros carregados.
  // Insights
  const totalLogs = logs.length;
  // Média de satisfação (arredondada a 1 casa); considera só registros que têm
  // esse campo preenchido.
  const avgSatisfaction = logs.length
    ? Math.round((logs.reduce((s, l) => s + (l.satisfaction ?? 0), 0) / logs.filter(l => l.satisfaction).length) * 10) / 10
    : 0;
  // Média de prazer (mesma lógica da satisfação).
  const avgPleasure = logs.length
    ? Math.round((logs.reduce((s, l) => s + (l.pleasure ?? 0), 0) / logs.filter(l => l.pleasure).length) * 10) / 10
    : 0;

  // Quantos registros aconteceram no mês/ano atual.
  const logsThisMonth = logs.filter(l => {
    const d = new Date(l.log_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // Entrega para a tela os registros, o estado de carregamento, as ações e as
  // estatísticas prontas.
  return {
    logs,
    isLoading,
    addLog: addLog.mutateAsync,
    deleteLog: deleteLog.mutateAsync,
    isAdding: addLog.isPending,
    insights: { totalLogs, avgSatisfaction, avgPleasure, logsThisMonth },
  };
}
