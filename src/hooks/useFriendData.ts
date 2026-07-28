// ============================================================================
// useFriendData.ts  —  DADOS DIÁRIOS DE UM AMIGO
// ----------------------------------------------------------------------------
// Busca no Supabase o progresso de um amigo em um dia específico: seu registro
// diário, as fotos das refeições e a foto de evolução. Usado nas telas sociais
// para o usuário acompanhar como o amigo se saiu naquele dia.
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { DailyTracking } from './useDailyTracking';
import type { MealPhoto } from './useMealPhotos';
import type { ProgressPhoto } from './useProgressPhotos';

// Pacote de dados de um amigo em um dia: registro diário + fotos de refeição + foto de evolução.
export interface FriendDailyData {
  tracking: DailyTracking | null;
  mealPhotos: MealPhoto[];
  progressPhoto: ProgressPhoto | null;
}

export function useFriendData() {
  const [loading, setLoading] = useState(false);

  // Busca todos os dados do amigo para a data informada (chamado quando a tela precisa deles).
  const fetchFriendData = useCallback(async (friendUserId: string, date: Date): Promise<FriendDailyData> => {
    setLoading(true);
    const dateString = format(date, 'yyyy-MM-dd');

    // Registro diário do amigo (água, refeições, treino etc.) naquele dia.
    const { data: trackingData } = await supabase
      .from('daily_tracking')
      .select('*')
      .eq('user_id', friendUserId)
      .eq('date', dateString)
      .maybeSingle();

    // Fotos das refeições que o amigo registrou nesse dia.
    const { data: mealPhotosData } = await supabase
      .from('meal_photos')
      .select('*')
      .eq('user_id', friendUserId)
      .eq('date', dateString);

    // Foto de evolução física do amigo nesse dia (se houver).
    const { data: progressPhotoData } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', friendUserId)
      .eq('date', dateString)
      .maybeSingle();

    setLoading(false);

    // Monta o retorno. Garante que a agenda de hidratação seja sempre uma lista (evita erro se vier vazia/inválida).
    return {
      tracking: trackingData ? {
        ...trackingData,
        hydration_schedule_completed: Array.isArray(trackingData.hydration_schedule_completed)
          ? trackingData.hydration_schedule_completed
          : []
      } as DailyTracking : null,
      mealPhotos: (mealPhotosData || []) as MealPhoto[],
      progressPhoto: progressPhotoData as ProgressPhoto | null,
    };
  }, []);

  return {
    loading,
    fetchFriendData,
  };
}
