// ============================================================================
// useWorkoutRoutes  —  ROTAS DE TREINO (GPS) DO DIA
// ----------------------------------------------------------------------------
// Este hook cuida dos percursos gravados por GPS (corrida, caminhada, etc.):
// busca as rotas de um dia, salva uma nova rota com distância, tempo e o caminho
// percorrido (lista de pontos no mapa) e permite apagar rotas. Dados no Supabase.
// ============================================================================

// Ferramentas do React, conexão com o banco, usuário logado e datas.
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Um ponto no mapa: latitude, longitude e o momento em que foi registrado.
export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

// Formato de uma rota de treino: tipo, distância, duração e o caminho no mapa.
export interface WorkoutRoute {
  id: string;
  user_id: string;
  date: string;
  workout_type: string;
  distance_km: number;
  duration_seconds: number;
  coordinates: Coordinate[];
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

// Hook principal: recebe o dia escolhido e cuida das rotas daquele dia.
export function useWorkoutRoutes(selectedDate: Date) {
  const { user } = useAuth();
  // Lista de rotas encontradas para o dia.
  const [routes, setRoutes] = useState<WorkoutRoute[]>([]);
  // Indica se está carregando as rotas.
  const [loading, setLoading] = useState(false);

  // Converte o dia escolhido para o formato ano-mês-dia usado no banco.
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Busca no banco as rotas do usuário para o dia, da mais recente para a mais antiga.
  const fetchRoutes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_routes')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Garante que o caminho (coordenadas) venha sempre como lista de pontos.
      setRoutes(data.map(r => ({
        ...r,
        coordinates: Array.isArray(r.coordinates) ? (r.coordinates as unknown as Coordinate[]) : [],
      })));
    }
    setLoading(false);
  }, [user, dateString]);

  // Salva uma nova rota gravada (tipo, distância, tempo, pontos e horários).
  const saveRoute = async (
    workoutType: string,
    distanceKm: number,
    durationSeconds: number,
    coordinates: Coordinate[],
    startedAt: Date,
    finishedAt: Date,
  ): Promise<{ error: Error | null; data: WorkoutRoute | null }> => {
    if (!user) return { error: new Error('Not authenticated'), data: null };

    // Grava a rota no banco e já pede o registro criado de volta.
    const { data, error } = await supabase
      .from('workout_routes')
      .insert({
        user_id: user.id,
        date: dateString,
        workout_type: workoutType,
        distance_km: distanceKm,
        duration_seconds: durationSeconds,
        coordinates: coordinates as unknown as never,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
      })
      .select()
      .single();

    if (error) return { error: new Error(error.message), data: null };

    // Ajusta o formato da rota salva e a coloca no topo da lista da tela.
    const route: WorkoutRoute = {
      ...data,
      coordinates: Array.isArray(data.coordinates) ? (data.coordinates as unknown as Coordinate[]) : [],
    };
    setRoutes(prev => [route, ...prev]);
    return { error: null, data: route };
  };

  // Apaga uma rota (pelo id) do banco e a remove da lista mostrada na tela.
  const deleteRoute = async (id: string) => {
    await supabase.from('workout_routes').delete().eq('id', id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  // Entrega para as telas as rotas e as ações disponíveis.
  return { routes, loading, fetchRoutes, saveRoute, deleteRoute };
}
