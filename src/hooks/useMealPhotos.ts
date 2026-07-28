import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface MealPhoto {
  id: string;
  user_id: string;
  meal_key: string;
  date: string;
  photo_url: string;
  created_at: string;
}

export function useMealPhotos(selectedDate: Date) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<MealPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

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

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadPhoto = async (mealKey: string, file: File) => {
    if (!user) return { error: new Error('Not authenticated') };

    setUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${dateString}/${mealKey}-${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(fileName, file);

    if (uploadError) {
      setUploading(false);
      return { error: uploadError };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('meal-photos')
      .getPublicUrl(fileName);

    // Check if there's already a photo for this meal on this date
    const existingPhoto = photos.find(p => p.meal_key === mealKey);
    
    if (existingPhoto) {
      // Delete old photo from storage
      const oldPath = existingPhoto.photo_url.split('/meal-photos/')[1];
      if (oldPath) {
        await supabase.storage.from('meal-photos').remove([oldPath]);
      }
      
      // Update database record
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
      // Insert new record
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

  const deletePhoto = async (mealKey: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const photo = photos.find(p => p.meal_key === mealKey);
    if (!photo) return { error: new Error('Photo not found') };

    // Delete from storage
    const path = photo.photo_url.split('/meal-photos/')[1];
    if (path) {
      await supabase.storage.from('meal-photos').remove([path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('meal_photos')
      .delete()
      .eq('id', photo.id);

    if (!error) {
      await fetchPhotos();
    }
    return { error };
  };

  const getPhotoForMeal = (mealKey: string) => {
    return photos.find(p => p.meal_key === mealKey);
  };

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
