// ============================================================================
// useExamResults  —  UPLOAD E GERENCIAMENTO DE EXAMES MÉDICOS
// ----------------------------------------------------------------------------
// Hook que cuida dos exames enviados pelo usuário: lista, envia o arquivo para
// o armazenamento do Supabase, edita e remove. Exibe avisos de sucesso/erro
// (toasts) na tela. Usado na área de exames do app.
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Molde (tipo) de um exame enviado: nome e caminho do arquivo, data, tipo,
// se já foi processado e quando foi criado.
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
  // Usuário logado (estado global de login).
  const { user } = useAuth();
  // Lista de exames enviados, mostrada na tela.
  const [uploads, setUploads] = useState<ExamUpload[]>([]);
  // Indica se está carregando a lista de exames.
  const [loading, setLoading] = useState(true);
  // Indica se um envio de arquivo está em andamento (para desabilitar botões).
  const [uploading, setUploading] = useState(false);

  // Ao entrar na tela (ou quando o usuário muda), carrega os exames.
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Busca no banco todos os exames do usuário, dos mais recentes aos mais antigos.
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

  // Envia um novo exame: primeiro sobe o arquivo para o armazenamento e depois
  // cria o registro no banco. Recebe o arquivo, a data e os tipos de exame.
  const uploadExam = async (file: File, examDate: Date, examTypes: string[]) => {
    if (!user) return null;

    setUploading(true);
    try {
      // Monta um nome de arquivo único (data/hora atual + extensão original)
      // e o guarda numa pasta com o id do usuário, para não misturar arquivos.
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      // Envia o arquivo em si para o armazenamento (bucket "exams") do Supabase.
      const { error: uploadError } = await supabase.storage
        .from('exams')
        .upload(filePath, file, { contentType: file.type || undefined, upsert: false });

      if (uploadError) {
        // Mostra a causa real (ex.: arquivo grande demais, sem conexão) em vez de genérico.
        toast.error(`Falha ao enviar o arquivo: ${uploadError.message}`);
        return null;
      }

      // Create upload record with exam types as JSON array
      // Cria o registro do exame no banco, guardando os tipos como texto JSON.
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

      if (insertError) {
        // Se o registro falhou, remove o arquivo já enviado para não ficar órfão.
        await supabase.storage.from('exams').remove([filePath]);
        toast.error(`Erro ao registrar o exame: ${insertError.message}`);
        return null;
      }

      // Coloca o novo exame no topo da lista e avisa o usuário do sucesso.
      setUploads(prev => [uploadData, ...prev]);
      toast.success('Exame salvo com sucesso!');

      return uploadData;
    } catch (error) {
      // Qualquer falha inesperada cai aqui: registra e avisa na tela com a causa.
      console.error('Error uploading exam:', error);
      const msg = error instanceof Error ? error.message : 'erro desconhecido';
      toast.error(`Erro ao enviar exame: ${msg}`);
      return null;
    } finally {
      // Aconteça o que acontecer, encerra o estado de "enviando".
      setUploading(false);
    }
  };

  // Atualiza os dados de um exame já existente (data, tipo e descrição).
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

      // Atualiza esse exame na lista da tela e avisa o sucesso.
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, ...data } as any : u));
      toast.success('Exame atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Error updating upload:', error);
      toast.error('Erro ao atualizar exame');
      return false;
    }
  };

  // Remove um exame por completo: apaga primeiro o arquivo do armazenamento
  // e depois o registro no banco, atualizando a lista da tela.
  const deleteUpload = async (uploadId: string) => {
    if (!user) return;

    try {
      // Encontra o exame na lista para saber qual arquivo remover.
      const upload = uploads.find(u => u.id === uploadId);
      if (!upload) return;

      // Apaga o arquivo do armazenamento (bucket "exams").
      await supabase.storage.from('exams').remove([upload.file_path]);

      // Apaga o registro do exame no banco.
      const { error } = await supabase
        .from('exam_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      // Remove o exame da lista da tela e avisa o sucesso.
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      toast.success('Exame removido com sucesso');
    } catch (error) {
      console.error('Error deleting upload:', error);
      toast.error('Erro ao remover exame');
    }
  };

  // Entrega para a tela: a lista de exames, os status de carregamento/envio e
  // todas as ações (enviar, atualizar, remover) e o recarregar manual.
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
