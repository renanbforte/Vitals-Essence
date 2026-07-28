import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  date: string;
  photo_url: string;
  created_at: string;
}

export function useProgressPhotos(selectedDate?: Date) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

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

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadPhoto = async (file: File, date?: Date) => {
    if (!user) return { error: new Error('Not authenticated') };

    setUploading(true);
    
    const uploadDateString = date ? format(date, 'yyyy-MM-dd') : dateString || format(new Date(), 'yyyy-MM-dd');
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uploadDateString}/progress-${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('progress-photos')
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      return { error: uploadError };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(fileName);

    // Check if there's already a photo for this date
    const existingPhoto = photos.find(p => p.date === uploadDateString);
    
    if (existingPhoto) {
      // Delete old photo from storage
      const oldPath = existingPhoto.photo_url.split('/progress-photos/')[1];
      if (oldPath) {
        await supabase.storage.from('progress-photos').remove([oldPath]);
      }
      
      // Update database record
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
      // Insert new record
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

  const deletePhoto = async (photoId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const photo = photos.find(p => p.id === photoId);
    if (!photo) return { error: new Error('Photo not found') };

    // Delete from storage
    const path = photo.photo_url.split('/progress-photos/')[1];
    if (path) {
      await supabase.storage.from('progress-photos').remove([path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', photo.id);

    if (!error) {
      await fetchPhotos();
    }
    return { error };
  };

  const getPhotoForDate = (date: string) => {
    return photos.find(p => p.date === date);
  };

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
