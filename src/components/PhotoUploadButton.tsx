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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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

    const { error } = await onUpload(file);
    if (error) {
      toast.error('Erro ao enviar foto');
    } else {
      toast.success('Foto enviada com sucesso!');
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (variant === 'full') {
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
