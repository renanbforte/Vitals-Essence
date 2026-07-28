// ============================================================================
// useMealPhotos  —  FOTOS DAS REFEIÇÕES DO DIA
// ----------------------------------------------------------------------------
// Hook que gerencia as fotos que o usuário tira de cada refeição (café, almoço,
// jantar...) em um dia. Envia a imagem para o armazenamento do Supabase, guarda
// o link no banco e permite trocar ou apagar a foto de cada refeição.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Representa a foto de uma refeição: qual refeição (meal_key), de que dia e o link da imagem.
export interface MealPhoto {
  id: string;
  user_id: string;
  meal_key: string;
  date: string;
  photo_url: string;
  created_at: string;
}

// Recebe a data escolhida na tela e devolve as fotos daquele dia + funções para gerenciá-las.
export function useMealPhotos(selectedDate: Date) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<MealPhoto[]>([]); // fotos do dia
  const [loading, setLoading] = useState(true);          // carregando a lista?
  const [uploading, setUploading] = useState(false);     // enviando uma foto agora?

  // Converte a data escolhida para o formato do banco (AAAA-MM-DD).
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Busca no banco todas as fotos deste usuário para o dia selecionado.
  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('meal_photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString);

    if (error) {
      console.error('Error fetching meal photos:', error);
    } else {
      setPhotos((data || []) as MealPhoto[]);
    }
    setLoading(false);
  }, [user, dateString]);

  // Sempre que a data (ou o usuário) muda, recarrega as fotos.
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Envia a foto de uma refeição. Se já existir foto para essa refeição no dia,
  // substitui a antiga; senão, cria um registro novo.
  const uploadPhoto = async (mealKey: string, file: File) => {
    if (!user) return { error: new Error('Not authenticated') };

    setUploading(true);

    // Monta um nome de arquivo único (pasta do usuário/data/refeição + horário).
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${dateString}/${mealKey}-${Date.now()}.${fileExt}`;

    // Envia o arquivo de imagem para o armazenamento (storage) do Supabase.
    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      return { error: uploadError };
    }

    // Pega o link público da imagem recém-enviada (para exibir na tela).
    const { data: urlData } = supabase.storage
      .from('meal-photos')
      .getPublicUrl(fileName);

    // Verifica se já havia uma foto para essa refeição neste dia.
    const existingPhoto = photos.find(p => p.meal_key === mealKey);

    if (existingPhoto) {
      // Já existia: apaga a imagem antiga do armazenamento para não acumular lixo.
      const oldPath = existingPhoto.photo_url.split('/meal-photos/')[1];
      if (oldPath) {
        await supabase.storage.from('meal-photos').remove([oldPath]);
      }

      // E atualiza o registro no banco para apontar para a nova imagem.
      const { error: dbError } = await supabase
        .from('meal_photos')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', existingPhoto.id);

      if (!dbError) {
        await fetchPhotos();
      }
      setUploading(false);
      return { error: dbError };
    } else {
      // Não existia: cria um registro novo no banco para essa refeição.
      const { error: dbError } = await supabase
        .from('meal_photos')
        .insert({
          user_id: user.id,
          meal_key: mealKey,
          date: dateString,
          photo_url: urlData.publicUrl,
        });

      if (!dbError) {
        await fetchPhotos();
      }
      setUploading(false);
      return { error: dbError };
    }
  };

  // Apaga a foto de uma refeição: remove tanto a imagem do armazenamento
  // quanto o registro no banco.
  const deletePhoto = async (mealKey: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const photo = photos.find(p => p.meal_key === mealKey);
    if (!photo) return { error: new Error('Photo not found') };

    // Remove o arquivo de imagem do armazenamento.
    const path = photo.photo_url.split('/meal-photos/')[1];
    if (path) {
      await supabase.storage.from('meal-photos').remove([path]);
    }

    // Remove o registro correspondente do banco.
    const { error } = await supabase
      .from('meal_photos')
      .delete()
      .eq('id', photo.id);

    if (!error) {
      await fetchPhotos();
    }
    return { error };
  };

  // Atalho para a tela encontrar a foto de uma refeição específica.
  const getPhotoForMeal = (mealKey: string) => {
    return photos.find(p => p.meal_key === mealKey);
  };

  // Entrega os dados e as funções para a tela usar.
  return {
    photos,
    loading,
    uploading,
    uploadPhoto,
    deletePhoto,
    getPhotoForMeal,
    refetch: fetchPhotos,
  };
}
