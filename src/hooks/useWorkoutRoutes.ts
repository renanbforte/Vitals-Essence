import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

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

export function useWorkoutRoutes(selectedDate: Date) {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<WorkoutRoute[]>([]);
  const [loading, setLoading] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

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
      setRoutes(data.map(r => ({
        ...r,
        coordinates: Array.isArray(r.coordinates) ? (r.coordinates as unknown as Coordinate[]) : [],
      })));
    }
    setLoading(false);
  }, [user, dateString]);

  const saveRoute = async (
    workoutType: string,
    distanceKm: number,
    durationSeconds: number,
    coordinates: Coordinate[],
    startedAt: Date,
    finishedAt: Date,
  ): Promise<{ error: Error | null; data: WorkoutRoute | null }> => {
    if (!user) return { error: new Error('Not authenticated'), data: null };

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

    const route: WorkoutRoute = {
      ...data,
      coordinates: Array.isArray(data.coordinates) ? (data.coordinates as unknown as Coordinate[]) : [],
    };
    setRoutes(prev => [route, ...prev]);
    return { error: null, data: route };
  };

  const deleteRoute = async (id: string) => {
    await supabase.from('workout_routes').delete().eq('id', id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  return { routes, loading, fetchRoutes, saveRoute, deleteRoute };
}
