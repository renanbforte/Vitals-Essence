// ============================================================================
// useProgressPhotos.ts  —  FOTOS DE PROGRESSO (EVOLUÇÃO FÍSICA)
// ----------------------------------------------------------------------------
// Gerencia as fotos de acompanhamento do corpo do usuário: envia (upload) a
// imagem para o armazenamento do Supabase e guarda o link no banco. Permite ter
// uma foto por dia, além de trocar ou apagar fotos já existentes.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Formato de uma foto de progresso: a qual usuário e data pertence e o link (URL) da imagem.
export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  photo_url: string;
  created_at: string;
}

// Hook das fotos de progresso. Se receber uma data (selectedDate), mostra só a
// foto daquele dia; sem data, lista todas as fotos do usuário.
export function useProgressPhotos(selectedDate?: Date) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]); // fotos carregadas
  const [loading, setLoading] = useState(true);   // carregando a lista?
  const [uploading, setUploading] = useState(false); // enviando uma foto agora?

  // Converte a data selecionada para texto "ano-mês-dia" (ou null se não houver).
  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  // Busca as fotos do usuário no banco, da mais recente para a mais antiga.
  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Se uma data foi informada, filtra para trazer apenas a foto daquele dia.
    if (dateString) {
      query = query.eq('date', dateString);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching progress photos:', error);
    } else {
      setPhotos((data || []) as ProgressPhoto[]);
    }
    setLoading(false);
  }, [user, dateString]);

  // Recarrega as fotos sempre que a função de busca mudar (ex.: troca de data/usuário).
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Envia uma nova foto. Se já existir foto para aquele dia, substitui a antiga.
  const uploadPhoto = async (file: File, date?: Date) => {
    if (!user) return { error: new Error('Not authenticated') };

    setUploading(true);

    // Define a data da foto e monta um nome de arquivo único por usuário/dia/instante.
    const uploadDateString = date ? format(date, 'yyyy-MM-dd') : dateString || format(new Date(), 'yyyy-MM-dd');
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uploadDateString}/progress-${Date.now()}.${fileExt}`;

    // Envia o arquivo de imagem para o armazenamento (bucket) "progress-photos".
    const { error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      return { error: uploadError };
    }

    // Pega o link público da imagem recém-enviada.
    const { data: urlData } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(fileName);

    // Verifica se já existe uma foto para essa data (só se permite uma por dia).
    const existingPhoto = photos.find(p => p.date === uploadDateString);

    if (existingPhoto) {
      // Já havia foto: apaga a imagem antiga do armazenamento para não acumular lixo.
      const oldPath = existingPhoto.photo_url.split('/progress-photos/')[1];
      if (oldPath) {
        await supabase.storage.from('progress-photos').remove([oldPath]);
      }

      // Atualiza o registro no banco apontando para o novo link.
      const { error: dbError } = await supabase
        .from('progress_photos')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', existingPhoto.id);

      if (!dbError) {
        await fetchPhotos();
      }
      setUploading(false);
      return { error: dbError };
    } else {
      // Não havia foto nesse dia: cria um novo registro no banco.
      const { error: dbError } = await supabase
        .from('progress_photos')
        .insert({
          user_id: user.id,
          date: uploadDateString,
          photo_url: urlData.publicUrl,
        });

      if (!dbError) {
        await fetchPhotos();
      }
      setUploading(false);
      return { error: dbError };
    }
  };

  // Apaga uma foto: remove tanto a imagem do armazenamento quanto o registro do banco.
  const deletePhoto = async (photoId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const photo = photos.find(p => p.id === photoId);
    if (!photo) return { error: new Error('Photo not found') };

    // Remove o arquivo de imagem do armazenamento.
    const path = photo.photo_url.split('/progress-photos/')[1];
    if (path) {
      await supabase.storage.from('progress-photos').remove([path]);
    }

    // Remove o registro correspondente do banco.
    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photo.id);

    if (!error) {
      await fetchPhotos();
    }
    return { error };
  };

  // Atalho para encontrar, entre as fotos carregadas, a de uma data específica.
  const getPhotoForDate = (date: string) => {
    return photos.find(p => p.date === date);
  };

  // Entrega para a tela as fotos, os estados de carregamento e as ações.
  return {
    photos,
    loading,
    uploading,
    uploadPhoto,
    deletePhoto,
    getPhotoForDate,
    refetch: fetchPhotos,
  };
}
