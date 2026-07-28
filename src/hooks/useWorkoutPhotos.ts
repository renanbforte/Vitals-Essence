// ============================================================================
// useWorkoutPhotos  —  FOTO DO TREINO DO DIA
// ----------------------------------------------------------------------------
// Este hook guarda uma foto de treino por dia: busca a foto do dia escolhido,
// permite enviar (upload), trocar ou apagar a imagem. Os arquivos ficam no
// armazenamento do Supabase e o endereço da foto é salvo no banco.
// ============================================================================

// Ferramentas do React, conexão com o banco/armazenamento, usuário e datas.
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Formato de uma foto de treino: a que dia pertence e o endereço da imagem.
export interface WorkoutPhoto {
  id: string;
  user_id: string;
  date: string;
  photo_url: string;
  created_at: string;
}

// Hook principal: recebe o dia escolhido e cuida da foto daquele dia.
export function useWorkoutPhotos(selectedDate: Date) {
  const { user } = useAuth();
  // A foto encontrada para o dia (ou nada, se não houver).
  const [photo, setPhoto] = useState<WorkoutPhoto | null>(null);
  // Indica se está carregando a foto.
  const [loading, setLoading] = useState(true);
  // Indica se está enviando uma nova foto (para mostrar "enviando...").
  const [uploading, setUploading] = useState(false);

  // Converte o dia escolhido para o formato ano-mês-dia usado no banco.
  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Busca no banco a foto de treino do usuário para o dia escolhido.
  const fetchPhoto = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateString)
      .maybeSingle();

    if (!error && data) {
      setPhoto(data as WorkoutPhoto);
    } else {
      setPhoto(null);
    }
    setLoading(false);
  }, [user, dateString]);

  // Quando o dia muda (ou o hook é usado), busca a foto daquele dia.
  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  // Envia uma nova foto: guarda o arquivo no armazenamento e o link no banco.
  const uploadPhoto = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated') };
    setUploading(true);

    // Monta um nome único de arquivo (usuário/dia/momento) para não sobrescrever.
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${dateString}/workout-${Date.now()}.${fileExt}`;

    // Sobe o arquivo da imagem para o armazenamento do Supabase.
    const { error: uploadError } = await supabase.storage
      .from('workout-photos')
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      return { error: uploadError };
    }

    // Gera o endereço público da imagem recém-enviada.
    const { data: urlData } = supabase.storage
      .from('workout-photos')
      .getPublicUrl(fileName);

    if (photo) {
      // Já havia foto nesse dia: apaga a antiga do armazenamento e atualiza o link.
      // Delete old from storage
      const oldPath = photo.photo_url.split('/workout-photos/')[1];
      if (oldPath) await supabase.storage.from('workout-photos').remove([oldPath]);

      const { error: dbError } = await supabase
        .from('workout_photos')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', photo.id);

      if (!dbError) await fetchPhoto();
      setUploading(false);
      return { error: dbError };
    } else {
      // Não havia foto nesse dia: cria um novo registro apontando para a imagem.
      const { error: dbError } = await supabase
        .from('workout_photos')
        .insert({
          user_id: user.id,
          date: dateString,
          photo_url: urlData.publicUrl,
        });

      if (!dbError) await fetchPhoto();
      setUploading(false);
      return { error: dbError };
    }
  };

  // Apaga a foto do dia: remove o arquivo do armazenamento e o registro do banco.
  const deletePhoto = async () => {
    if (!user || !photo) return { error: new Error('No photo') };

    // Remove o arquivo da imagem do armazenamento.
    const path = photo.photo_url.split('/workout-photos/')[1];
    if (path) await supabase.storage.from('workout-photos').remove([path]);

    // Remove o registro correspondente no banco.
    const { error } = await supabase
      .from('workout_photos')
      .delete()
      .eq('id', photo.id);

    if (!error) {
      setPhoto(null);
    }
    return { error };
  };

  // Entrega para as telas a foto, os estados de carregamento e as ações.
  return { photo, loading, uploading, uploadPhoto, deletePhoto };
}
