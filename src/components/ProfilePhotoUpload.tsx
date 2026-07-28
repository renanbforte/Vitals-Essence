// ============================================================================
// Upload de Foto de Perfil (ProfilePhotoUpload)
// Mostra o avatar do usuário (foto ou iniciais) e, quando editável, abre um
// diálogo para adicionar, trocar ou remover a foto de perfil. Envia e apaga os
// arquivos no armazenamento do Supabase e atualiza o endereço da foto no perfil.
// ============================================================================

import { useState, useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
  userId: string;
  userName: string;
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export function ProfilePhotoUpload({
  userId,
  userName,
  currentPhotoUrl,
  onPhotoUpdated,
  size = 'md',
  editable = true,
}: ProfilePhotoUploadProps) {
  // Indica se um envio/remoção está em andamento (mostra o ícone de carregando)
  const [uploading, setUploading] = useState(false);
  // Controla se o diálogo de edição da foto está aberto
  const [dialogOpen, setDialogOpen] = useState(false);
  // Referência ao campo de arquivo oculto, usado para abrir o seletor de imagens
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tamanhos possíveis do avatar (pequeno, médio, grande)
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  // Executado ao escolher um arquivo: valida, apaga a foto antiga, envia a nova e atualiza o perfil
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      // Delete old photo if exists
      if (currentPhotoUrl) {
        const oldPath = currentPhotoUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Envia a nova foto usando um nome único (pasta do usuário + horário atual)
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Avisa o componente pai da nova foto e fecha o diálogo
      onPhotoUpdated(publicUrl);
      toast.success('Foto atualizada!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove a foto de perfil: apaga o arquivo do armazenamento e limpa o endereço no perfil
  const handleDelete = async () => {
    if (!currentPhotoUrl) return;

    setUploading(true);
    try {
      const oldPath = currentPhotoUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      onPhotoUpdated(null);
      toast.success('Foto removida!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erro ao remover foto');
    } finally {
      setUploading(false);
    }
  };

  // Monta as iniciais do nome (até 2 letras) usadas quando não há foto
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Estrutura visual: o avatar clicável e o diálogo de edição da foto
  return (
    <>
      {/* Avatar do usuário; ao passar o mouse (se editável) aparece o ícone de câmera */}
      <div
        className={`relative ${editable ? 'cursor-pointer group' : ''}`}
        onClick={() => editable && setDialogOpen(true)}
      >
        <Avatar className={`${sizeClasses[size]} ring-2 ring-background shadow-lg`}>
          <AvatarImage src={currentPhotoUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {editable && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Diálogo de edição: prévia grande da foto e botões de adicionar/trocar/remover */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto de Perfil</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="w-32 h-32 ring-4 ring-primary/20">
              <AvatarImage src={currentPhotoUrl || undefined} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {currentPhotoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
              </Button>

              {currentPhotoUrl && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={uploading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
