// ============================================================================
// ShareCoupleDateDialog — COMPARTILHAR O ENCONTRO COMO IMAGEM
// ----------------------------------------------------------------------------
// Gera uma imagem romântica do encontro (título, ideia, cronograma, o que levar
// e, se quiser, os custos) e deixa compartilhar pelo menu do celular ou baixar.
// O usuário escolhe se inclui os custos — por padrão não inclui, para mandar
// só o cronograma bonito para a parceira(o).
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Share2, Download, Loader2, Heart } from 'lucide-react';
import { renderCoupleDateImage, shareOrDownloadImage, downloadImage } from '@/lib/coupleDateShare';
import type { CoupleDate } from '@/hooks/useCoupleDates';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: CoupleDate | null;
}

export function ShareCoupleDateDialog({ open, onOpenChange, date }: Props) {
  const { toast } = useToast();
  const [includeCosts, setIncludeCosts] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

  // (Re)gera a imagem quando abre, troca de encontro ou liga/desliga os custos.
  const generate = useCallback(async () => {
    if (!date) return;
    setGenerating(true);
    try {
      const { blob, dataUrl } = await renderCoupleDateImage(date, { includeCosts });
      setBlob(blob);
      setDataUrl(dataUrl);
    } catch (e) {
      toast({ title: 'Erro ao gerar a imagem', description: String(e), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [date, includeCosts, toast]);

  useEffect(() => {
    if (open) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, includeCosts, date?.id]);

  const handleShare = async () => {
    if (!blob || !date) return;
    setSharing(true);
    try {
      const safeName = date.title.replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'encontro';
      const res = await shareOrDownloadImage(blob, `${safeName}.png`, date.title, `Nosso encontro: ${date.title} 💕`);
      if (res === 'downloaded') toast({ title: 'Imagem baixada', description: 'Agora é só enviar para quem você quiser 💕' });
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!blob || !date) return;
    const safeName = date.title.replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'encontro';
    const res = await downloadImage(blob, `${safeName}.png`);
    if (res === 'downloaded') toast({ title: 'Imagem baixada 💕' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" /> Compartilhar encontro
          </DialogTitle>
          <DialogDescription>Mande o cronograma do date numa imagem bonita.</DialogDescription>
        </DialogHeader>

        {/* Toggle de custos */}
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-semibold">Incluir custos</p>
            <p className="text-[11px] text-muted-foreground">Desligado: mostra só o cronograma e os detalhes.</p>
          </div>
          <Switch checked={includeCosts} onCheckedChange={setIncludeCosts} />
        </div>

        {/* Prévia da imagem */}
        <div className="rounded-2xl overflow-hidden border border-border bg-muted min-h-[200px] flex items-center justify-center">
          {generating || !dataUrl ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Montando a imagem…</span>
            </div>
          ) : (
            <img src={dataUrl} alt="Prévia do encontro" className="w-full h-auto" />
          )}
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleShare} disabled={!blob || sharing} className="rounded-xl h-11 bg-pink-500 hover:bg-pink-600 text-white font-bold gap-2">
            {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Compartilhar
          </Button>
          <Button onClick={handleDownload} disabled={!blob} variant="outline" className="rounded-xl h-11 gap-2">
            <Download className="w-4 h-4" /> Baixar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
