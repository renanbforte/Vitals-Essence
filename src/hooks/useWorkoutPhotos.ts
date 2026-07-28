import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface WorkoutPhoto {
  id: string;
  user_id: string;
  date: string;
  photo_url: string;
  created_at: string;
}

export function useWorkoutPhotos(selectedDate: Date) {
  const { user } = useAuth();
  const [photo, setPhoto] = useState<WorkoutPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

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

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  const uploadPhoto = async (file: File) => {
    if (!user) return { error: new Error('Not authenticated') };
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${dateString}/workout-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('workout-photos')
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      return { error: uploadError };
    }

    const { data: urlData } = supabase.storage
      .from('workout-photos')
      .getPublicUrl(fileName);

    if (photo) {
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

  const deletePhoto = async () => {
    if (!user || !photo) return { error: new Error('No photo') };

    const path = photo.photo_url.split('/workout-photos/')[1];
    if (path) await supabase.storage.from('workout-photos').remove([path]);

    const { error } = await supabase
      .from('workout_photos')
      .delete()
      .eq('id', photo.id);

    if (!error) {
      setPhoto(null);
    }
    return { error };
  };

  return { photo, loading, uploading, uploadPhoto, deletePhoto };
}
