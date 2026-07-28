import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { MenstrualSettings } from '@/hooks/useMenstrualCycle';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: MenstrualSettings | null;
  onSave: (updates: Partial<MenstrualSettings>) => Promise<void>;
}

export function CycleSettings({ open, onOpenChange, settings, onSave }: Props) {
  const [cycleLength, setCycleLength] = useState(settings?.average_cycle_length || 28);
  const [periodLength, setPeriodLength] = useState(settings?.average_period_length || 5);
  const [contraceptive, setContraceptive] = useState(settings?.contraceptive_type || 'none');

  useEffect(() => {
    if (settings) {
      setCycleLength(settings.average_cycle_length);
      setPeriodLength(settings.average_period_length);
      setContraceptive(settings.contraceptive_type || 'none');
    }
  }, [settings]);

  const handleSave = async () => {
    await onSave({
      average_cycle_length: cycleLength,
      average_period_length: periodLength,
      contraceptive_type: contraceptive === 'none' ? null : contraceptive,
    });
    toast.success('Configurações salvas 🌸');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurações do Ciclo</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label>Duração média do ciclo (dias)</Label>
            <Input
              type="number"
              min={18}
              max={45}
              value={cycleLength}
              onChange={(e) => setCycleLength(Number(e.target.value))}
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">O intervalo entre o 1º dia de uma menstruação e o 1º dia da próxima.</p>
          </div>

          <div className="space-y-2">
            <Label>Duração média do período (dias)</Label>
            <Input
              type="number"
              min={2}
              max={10}
              value={periodLength}
              onChange={(e) => setPeriodLength(Number(e.target.value))}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Contraceptivo</Label>
            <Select value={contraceptive} onValueChange={setContraceptive}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="pill">Pílula</SelectItem>
                <SelectItem value="iud_hormonal">DIU hormonal</SelectItem>
                <SelectItem value="iud_copper">DIU de cobre</SelectItem>
                <SelectItem value="implant">Implante</SelectItem>
                <SelectItem value="injection">Injeção</SelectItem>
                <SelectItem value="ring">Anel vaginal</SelectItem>
                <SelectItem value="patch">Adesivo</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSave}
            className="w-full rounded-2xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
