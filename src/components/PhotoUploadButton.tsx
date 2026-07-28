// ============================================================================
// Botão de Upload de Foto (PhotoUploadButton)
// Componente reutilizável que permite tirar/escolher uma foto (ex.: foto da
// refeição), enviá-la, visualizá-la em um diálogo e, opcionalmente, removê-la.
// Valida se o arquivo é imagem e se tem no máximo 5MB antes de enviar.
// ============================================================================

import { useRef, useState } from 'react';
import { Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PhotoUploadButtonProps {
  onUpload: (file: File) => Promise<{ error: Error | null }>;
  existingPhotoUrl?: string;
  onDelete?: () => Promise<{ error: Error | null }>;
  uploading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full';
  className?: string;
}

export function PhotoUploadButton({
  onUpload,
  existingPhotoUrl,
  onDelete,
  uploading = false,
  size = 'sm',
  variant = 'icon',
  className = '',
}: PhotoUploadButtonProps) {
  // Referência ao campo <input type="file"> oculto, usado para abrir o seletor de arquivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Controla se o diálogo de visualização da foto está aberto ou fechado
  const [previewOpen, setPreviewOpen] = useState(false);

  // Executado quando o usuário escolhe um arquivo: valida e envia a foto
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    // Chama a função de envio recebida por props e mostra aviso de sucesso ou erro
    const { error } = await onUpload(file);
    if (error) {
      toast.error('Erro ao enviar foto');
    } else {
      toast.success('Foto enviada com sucesso!');
    }

    // Limpa o campo para permitir reenviar o mesmo arquivo depois
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a foto existente (quando a função onDelete é fornecida)
  const handleDelete = async () => {
    if (!onDelete) return;
    
    const { error } = await onDelete();
    if (error) {
      toast.error('Erro ao remover foto');
    } else {
      toast.success('Foto removida');
      setPreviewOpen(false);
    }
  };

  // Tamanhos possíveis do botão (pequeno, médio, grande)
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  // Tamanhos correspondentes dos ícones dentro do botão
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Modo "full": mostra a miniatura da foto (se houver) ou um botão de câmera maior
  if (variant === 'full') {
    // Estrutura visual do modo completo
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className={`flex items-center gap-2 ${className}`}>
          {/* Se já existe foto, mostra a miniatura clicável; senão, mostra o botão de câmera */}
          {existingPhotoUrl ? (
            <button
              onClick={() => setPreviewOpen(true)}
              className="relative group"
            >
              <img
                src={existingPhotoUrl}
                alt="Foto"
                className="w-12 h-12 rounded-lg object-cover border-2 border-white/30"
              />
              <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
            </button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-white/50 hover:text-white hover:bg-white/20"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Diálogo de visualização: exibe a foto ampliada e botões de trocar/remover */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Foto da Refeição</DialogTitle>
            </DialogHeader>
            {existingPhotoUrl && (
              <div className="space-y-4">
                <img
                  src={existingPhotoUrl}
                  alt="Foto"
                  className="w-full rounded-lg"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    Trocar Foto
                  </Button>
                  {onDelete && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Modo "icon" (padrão): versão compacta do botão de foto
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Miniatura clicável quando há foto, ou botão de câmera quando não há */}
      {existingPhotoUrl ? (
        <button
          onClick={() => setPreviewOpen(true)}
          className={`relative group rounded-lg overflow-hidden ${sizeClasses[size]} ${className}`}
        >
          <img
            src={existingPhotoUrl}
            alt="Foto"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageIcon className={`text-white ${iconSizes[size]}`} />
          </div>
        </button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`${sizeClasses[size]} ${className}`}
        >
          {uploading ? (
            <Loader2 className={`animate-spin ${iconSizes[size]}`} />
          ) : (
            <Camera className={iconSizes[size]} />
          )}
        </Button>
      )}

      {/* Diálogo de visualização: exibe a foto ampliada e botões de trocar/remover */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Foto</DialogTitle>
          </DialogHeader>
          {existingPhotoUrl && (
            <div className="space-y-4">
              <img
                src={existingPhotoUrl}
                alt="Foto"
                className="w-full rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Trocar Foto
                </Button>
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
