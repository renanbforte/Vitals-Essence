// ============================================================================
// CARTAO "PESO DO DIA"
// Registra e mostra o peso do usuario na data selecionada, com um velocimetro
// animado comparando o peso atual com a meta. Tambem calcula a diferenca para a
// meta e permite anexar/trocar/remover uma foto de progresso do dia.
// ============================================================================
import { useState, useEffect } from 'react';
import { Scale, Check, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { WeightEntry } from '@/hooks/useWeightHistory';
import type { ProgressPhoto } from '@/hooks/useProgressPhotos';
import { toast } from 'sonner';

interface DailyWeightCardProps {
  selectedDate: Date;
  weights: WeightEntry[];
  onAddWeight: (weight: number, date?: Date) => Promise<{ error: Error | null }>;
  targetWeight?: number;
  progressPhoto?: ProgressPhoto | null;
  onUploadProgressPhoto?: (file: File) => Promise<{ error: Error | null }>;
  onDeleteProgressPhoto?: (photoId: string) => Promise<{ error: Error | null }>;
  uploadingPhoto?: boolean;
}

// Velocimetro (gauge) animado que desenha o peso atual como um ponteiro e a meta
// como um marcador, dentro de uma faixa de peso minimo/maximo.
// Animated scale/gauge visual
function WeightGauge({ current, target, min = 40, max = 150 }: { current: number | null; target: number; min?: number; max?: number }) {
  // Calcula os angulos do ponteiro (peso atual) e do marcador (meta) na faixa min-max.
  const range = max - min;
  const currentAngle = current ? ((current - min) / range) * 180 - 90 : -90;
  const targetAngle = ((target - min) / range) * 180 - 90;

  // Desenha o arco do velocimetro, os segmentos coloridos, o marcador de meta,
  // o ponteiro e o valor do peso em numero.
  return (
    <div className="flex flex-col items-center py-2">
      <svg width="160" height="100" viewBox="0 0 160 100">
        {/* Gauge arc background */}
        <path
          d="M15 90 A65 65 0 0 1 145 90"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Colored segments */}
        <path d="M15 90 A65 65 0 0 1 50 30" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="12" strokeLinecap="round" />
        <path d="M50 30 A65 65 0 0 1 110 30" fill="none" stroke="rgba(234,179,8,0.4)" strokeWidth="12" />
        <path d="M110 30 A65 65 0 0 1 145 90" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="12" strokeLinecap="round" />
        
        {/* Target marker */}
        <motion.g
          initial={{ rotate: -90, originX: 80, originY: 90 }}
          animate={{ rotate: targetAngle }}
          style={{ transformOrigin: '80px 90px' }}
        >
          <line x1="80" y1="90" x2="80" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx="80" cy="32" r="4" fill="rgba(255,255,255,0.5)" />
        </motion.g>
        
        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: currentAngle }}
          transition={{ duration: 1.2, type: 'spring', stiffness: 60 }}
          style={{ transformOrigin: '80px 90px' }}
        >
          <polygon points="78,90 82,90 80,28" fill="white" opacity="0.9" />
          <circle cx="80" cy="90" r="6" fill="white" />
          <circle cx="80" cy="90" r="3" fill="rgba(139,92,246,0.8)" />
        </motion.g>

        {/* Min/Max labels */}
        <text x="12" y="98" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600">{min}</text>
        <text x="138" y="98" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600">{max}</text>
      </svg>
      
      {current ? (
        <motion.p 
          className="text-3xl font-extrabold text-white -mt-2"
          key={current}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {current}kg
        </motion.p>
      ) : (
        <p className="text-lg text-white/40 font-bold -mt-2">--</p>
      )}
      <p className="text-white/50 text-[11px]">meta: {target}kg</p>
    </div>
  );
}

export function DailyWeightCard({ 
  selectedDate, weights, onAddWeight, targetWeight = 80,
  progressPhoto, onUploadProgressPhoto, onDeleteProgressPhoto, uploadingPhoto = false,
}: DailyWeightCardProps) {
  // Valor digitado no campo de peso.
  const [newWeight, setNewWeight] = useState('');
  // Indica que o peso esta sendo salvo (desativa o botao enquanto isso).
  const [loading, setLoading] = useState(false);
  // Controla se a janela de visualizacao da foto de progresso esta aberta.
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  // Referencia para o campo de arquivo escondido, usado para abrir a camera/galeria.
  const fileInputRef = { current: null as HTMLInputElement | null };

  // Data selecionada em texto e o registro de peso correspondente (se existir).
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const todayWeight = weights.find(w => w.date === selectedDateString);

  // Ao trocar de data, preenche o campo com o peso ja registrado ou deixa vazio.
  useEffect(() => {
    if (todayWeight) setNewWeight(todayWeight.weight_kg.toString());
    else setNewWeight('');
  }, [selectedDateString, todayWeight]);

  // Valida e salva o peso digitado (deve ficar entre 30kg e 300kg).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 30 || weight > 300) { toast.error('Peso deve estar entre 30kg e 300kg'); return; }
    setLoading(true);
    const { error } = await onAddWeight(weight, selectedDate);
    setLoading(false);
    if (error) toast.error('Erro ao registrar peso');
    else toast.success(todayWeight ? 'Peso atualizado!' : 'Peso registrado!');
  };

  // Informacoes derivadas da data e do peso: se e hoje, se e futuro, o peso atual
  // e a diferenca em relacao a meta.
  const isToday = format(new Date(), 'yyyy-MM-dd') === selectedDateString;
  const isFuture = selectedDate > new Date();
  const currentWeight = todayWeight ? Number(todayWeight.weight_kg) : null;
  const diffToTarget = currentWeight ? currentWeight - targetWeight : null;

  // Trata a escolha de uma foto: valida tipo/tamanho (max 5MB) e faz o envio.
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadProgressPhoto) return;
    if (!file.type.startsWith('image/')) { toast.error('Por favor, selecione uma imagem'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 5MB'); return; }
    const { error } = await onUploadProgressPhoto(file);
    if (error) toast.error('Erro ao enviar foto');
    else toast.success('Foto enviada com sucesso!');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a foto de progresso do dia e fecha a janela de visualizacao.
  const handleDeletePhoto = async () => {
    if (!progressPhoto || !onDeleteProgressPhoto) return;
    const { error } = await onDeleteProgressPhoto(progressPhoto.id);
    if (error) toast.error('Erro ao remover foto');
    else { toast.success('Foto removida'); setPhotoPreviewOpen(false); }
  };

  // Monta o cartao: cabecalho com o velocimetro e a foto, o corpo com o formulario
  // de peso e os quadros de resumo, e a janela de visualizacao da foto.
  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      <input ref={(el) => { fileInputRef.current = el; }} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
      
      {/* Header with Gauge */}
      <div className="gradient-weight p-5 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Peso do Dia</h3>
              <p className="text-white/70 text-xs">{isToday ? 'Hoje' : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onUploadProgressPhoto && !isFuture && (
              progressPhoto ? (
                <button onClick={() => setPhotoPreviewOpen(true)} className="relative group">
                  <img src={progressPhoto.photo_url} alt="Progresso" className="w-10 h-10 rounded-xl object-cover border-2 border-white/30" />
                  <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="bg-white/20 hover:bg-white/30 text-white rounded-xl">
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </Button>
              )
            )}
            {todayWeight && (
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-bold text-white">Registrado</span>
              </div>
            )}
          </div>
        </div>
        
        <WeightGauge current={currentWeight} target={targetWeight} />
      </div>

      {/* Body */}
      <div className="bg-card p-4">
        {/* Bloqueia datas futuras; caso contrario, mostra o formulario e o resumo. */}
        {isFuture ? (
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm">Não é possível registrar em datas futuras</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Input type="number" step="0.1" min="30" max="300" placeholder="Ex: 85.5" value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/50 rounded-xl pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">kg</span>
              </div>
              <Button type="submit" disabled={loading} className="rounded-xl gradient-hub text-white border-0 shadow-md">
                {todayWeight ? 'Atualizar' : 'Registrar'}
              </Button>
            </form>

            {currentWeight && diffToTarget !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/30">
                  <motion.p className="text-2xl font-extrabold text-foreground" key={currentWeight} initial={{ scale: 1.1 }} animate={{ scale: 1 }}>
                    {currentWeight}kg
                  </motion.p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Peso Atual</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center border border-border/30">
                  <p className={`text-2xl font-extrabold ${diffToTarget <= 0 ? 'text-meals' : 'text-foreground'}`}>
                    {diffToTarget > 0 ? `+${diffToTarget.toFixed(1)}` : diffToTarget.toFixed(1)}kg
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Meta ({targetWeight}kg)</p>
                </div>
              </div>
            )}
            {!currentWeight && (
              <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/30">
                <Scale className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/30" />
                <p className="text-muted-foreground text-xs">Registre seu peso para acompanhar a evolução</p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={photoPreviewOpen} onOpenChange={setPhotoPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Foto de Progresso</DialogTitle></DialogHeader>
          {progressPhoto && (
            <div className="space-y-4">
              <img src={progressPhoto.photo_url} alt="Progresso" className="w-full rounded-xl" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}Trocar Foto
                </Button>
                {onDeleteProgressPhoto && <Button variant="destructive" onClick={handleDeletePhoto} className="rounded-xl">Remover</Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
