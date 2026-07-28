import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ExamUpload {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  exam_date: string;
  exam_type: string | null;
  processed: boolean;
  created_at: string;
}

export function useExamResults() {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<ExamUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: false });

      if (error) throw error;

      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching exam data:', error);
      toast.error('Erro ao carregar dados dos exames');
    } finally {
      setLoading(false);
    }
  };

  const uploadExam = async (file: File, examDate: Date, examTypes: string[]) => {
    if (!user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('exams')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create upload record with exam types as JSON array
      const { data: uploadData, error: insertError } = await supabase
        .from('exam_uploads')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          exam_date: examDate.toISOString().split('T')[0],
          exam_type: JSON.stringify(examTypes),
          processed: true, // No processing needed
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUploads(prev => [uploadData, ...prev]);
      toast.success('Exame salvo com sucesso!');

      return uploadData;
    } catch (error) {
      console.error('Error uploading exam:', error);
      toast.error('Erro ao enviar exame');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateUpload = async (uploadId: string, data: { exam_date: string; exam_type: string; image_description: string | null }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('exam_uploads')
        .update({
          exam_date: data.exam_date,
          exam_type: data.exam_type,
          image_description: data.image_description,
        } as any)
        .eq('id', uploadId);

      if (error) throw error;

      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, ...data } as any : u));
      toast.success('Exame atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Error updating upload:', error);
      toast.error('Erro ao atualizar exame');
      return false;
    }
  };

  const deleteUpload = async (uploadId: string) => {
    if (!user) return;

    try {
      const upload = uploads.find(u => u.id === uploadId);
      if (!upload) return;

      await supabase.storage.from('exams').remove([upload.file_path]);

      const { error } = await supabase
        .from('exam_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      setUploads(prev => prev.filter(u => u.id !== uploadId));
      toast.success('Exame removido com sucesso');
    } catch (error) {
      console.error('Error deleting upload:', error);
      toast.error('Erro ao remover exame');
    }
  };

  return {
    uploads,
    loading,
    uploading,
    uploadExam,
    updateUpload,
    deleteUpload,
    refetch: fetchData,
  };
}
