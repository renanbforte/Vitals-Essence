import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { FlowIntensity, MenstrualDailyLog } from '@/hooks/useMenstrualCycle';

interface Props {
  dailyLogs: MenstrualDailyLog[];
  onLog: (date: string, data: { flow_intensity?: FlowIntensity; symptoms?: string[]; mood?: string; notes?: string }) => Promise<void>;
}

const FLOW_OPTIONS: { value: FlowIntensity; label: string; color: string; icon: string }[] = [
  { value: 'none', label: 'Sem fluxo', color: 'bg-muted', icon: '○' },
  { value: 'spotting', label: 'Escape', color: 'bg-[hsl(340_50%_85%)]', icon: '·' },
  { value: 'light', label: 'Leve', color: 'bg-[hsl(340_55%_78%)]', icon: '🩸' },
  { value: 'medium', label: 'Médio', color: 'bg-[hsl(345_60%_65%)]', icon: '🩸🩸' },
  { value: 'heavy', label: 'Intenso', color: 'bg-[hsl(350_65%_52%)]', icon: '🩸🩸🩸' },
  { value: 'very_heavy', label: 'Muito intenso', color: 'bg-[hsl(345_60%_38%)]', icon: '🩸🩸🩸🩸' },
];

const SYMPTOMS = [
  '😣 Cólica', '🤕 Dor de cabeça', '😴 Cansaço', '💧 Inchaço',
  '🍫 Desejo de doce', '😤 Irritabilidade', '😢 Sensibilidade', '🤢 Náusea',
  '💢 Dor nas costas', '🌡️ Sensação de calor', '😰 Ansiedade', '🥴 Tontura',
];

const MOODS = [
  '😊 Bem', '😐 Normal', '😔 Triste', '😤 Irritada',
  '😴 Cansada', '🥰 Carinhosa', '😰 Ansiosa', '💪 Energizada',
];

export function FlowLogger({ dailyLogs, onLog }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const existingLog = dailyLogs.find(l => l.date === dateStr);

  const [flow, setFlow] = useState<FlowIntensity>(existingLog?.flow_intensity || 'none');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(existingLog?.symptoms || []);
  const [mood, setMood] = useState(existingLog?.mood || '');
  const [notes, setNotes] = useState(existingLog?.notes || '');
  const [saving, setSaving] = useState(false);

  // Sync when date changes
  const syncFromLog = (log: MenstrualDailyLog | undefined) => {
    setFlow(log?.flow_intensity || 'none');
    setSelectedSymptoms(log?.symptoms || []);
    setMood(log?.mood || '');
    setNotes(log?.notes || '');
  };

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
    const newStr = format(newDate, 'yyyy-MM-dd');
    syncFromLog(dailyLogs.find(l => l.date === newStr));
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onLog(dateStr, {
      flow_intensity: flow,
      symptoms: selectedSymptoms,
      mood: mood || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    toast.success('Registro salvo 🌸');
  };

  return (
    <div className="space-y-5">
      {/* Date picker */}
      <div className="flex items-center justify-between bg-card/70 backdrop-blur-xl rounded-2xl p-4 border border-border/40">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <p className="font-bold text-foreground capitalize">
            {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-xl hover:bg-muted">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Flow intensity */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-5 border border-border/40 space-y-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Droplets className="w-4 h-4 text-[hsl(340_60%_55%)]" />
          Fluxo
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FLOW_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFlow(opt.value)}
              className={`rounded-xl p-3 text-center border transition-all ${
                flow === opt.value
                  ? 'border-[hsl(340_60%_55%)] bg-[hsl(340_60%_55%/0.1)] shadow-md'
                  : 'border-border/40 hover:border-border/60'
              }`}
            >
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 ${opt.color}`} />
              <span className="text-[11px] font-medium text-foreground">{opt.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Symptoms */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-5 border border-border/40 space-y-3">
        <h3 className="font-bold text-foreground">Sintomas</h3>
        <div className="grid grid-cols-2 gap-2">
          {SYMPTOMS.map(s => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`text-xs px-3 py-2.5 rounded-xl border transition-all text-left ${
                selectedSymptoms.includes(s)
                  ? 'bg-[hsl(340_60%_55%/0.15)] border-[hsl(340_60%_55%/0.4)] text-foreground font-semibold'
                  : 'bg-muted/40 border-border/30 text-muted-foreground hover:border-border/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-5 border border-border/40 space-y-3">
        <h3 className="font-bold text-foreground">Como você se sente?</h3>
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? '' : m)}
              className={`text-xs px-3 py-2.5 rounded-xl border transition-all text-left ${
                mood === m
                  ? 'bg-[hsl(340_60%_55%/0.15)] border-[hsl(340_60%_55%/0.4)] text-foreground font-semibold'
                  : 'bg-muted/40 border-border/30 text-muted-foreground hover:border-border/60'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-5 border border-border/40 space-y-3">
        <h3 className="font-bold text-foreground">Observações</h3>
        <Textarea
          placeholder="Algo que queira registrar..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl border-border/40 bg-background/50 resize-none"
          rows={3}
        />
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl h-12 bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold shadow-lg"
      >
        {saving ? 'Salvando...' : existingLog ? 'Atualizar registro' : 'Salvar registro'}
      </Button>
    </div>
  );
}
