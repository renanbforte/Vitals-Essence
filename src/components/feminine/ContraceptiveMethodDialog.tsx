import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useContraceptive, METHOD_LABELS, METHOD_HAS_END_DATE, METHOD_NEEDS_DAILY } from '@/hooks/useContraceptive';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const METHOD_TYPES = Object.entries(METHOD_LABELS);

export function ContraceptiveMethodDialog({ open, onOpenChange, onSaved }: Props) {
  const { saveMethod } = useContraceptive();
  const [saving, setSaving] = useState(false);

  const [methodType, setMethodType] = useState('pill');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [pillTime, setPillTime] = useState('08:00');
  const [pillCycleDays, setPillCycleDays] = useState(21);
  const [pillBreakDays, setPillBreakDays] = useState(7);
  const [injectionInterval, setInjectionInterval] = useState(90);
  const [renewalReminderDays, setRenewalReminderDays] = useState(7);
  const [notes, setNotes] = useState('');

  const needsDaily = METHOD_NEEDS_DAILY.includes(methodType);
  const hasEndDate = METHOD_HAS_END_DATE.includes(methodType);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe o nome do método'); return; }
    setSaving(true);
    try {
      await saveMethod({
        method_type: methodType,
        name: name.trim(),
        start_date: startDate,
        end_date: hasEndDate && endDate ? endDate : null,
        renewal_reminder_days: renewalReminderDays,
        pill_time: needsDaily ? pillTime : null,
        pill_cycle_days: methodType === 'pill' ? pillCycleDays : 21,
        pill_break_days: methodType === 'pill' ? pillBreakDays : 7,
        injection_interval_days: methodType === 'injection' ? injectionInterval : null,
        active: true,
        notes: notes.trim() || null,
      });
      toast.success('Método salvo! 🌸');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar método anticoncepcional</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tipo de método</Label>
            <Select value={methodType} onValueChange={setMethodType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome / Marca</Label>
            <Input
              placeholder={methodType === 'pill' ? 'ex: Yasmin, Diane 35...' : 'ex: Kyleena, Mirena...'}
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Data de início</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-xl" />
          </div>

          {hasEndDate && (
            <div className="space-y-2">
              <Label>Data de validade / próxima renovação</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-xl" />
              <p className="text-[11px] text-muted-foreground">Quando este método precisa ser trocado ou renovado.</p>
            </div>
          )}

          {methodType === 'pill' && (
            <>
              <div className="space-y-2">
                <Label>Horário preferido para tomar</Label>
                <Input type="time" value={pillTime} onChange={e => setPillTime(e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Dias ativos</Label>
                  <Input
                    type="number" min={14} max={28}
                    value={pillCycleDays}
                    onChange={e => setPillCycleDays(Number(e.target.value))}
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Comprimidos da cartela</p>
                </div>
                <div className="space-y-2">
                  <Label>Dias de pausa</Label>
                  <Input
                    type="number" min={0} max={10}
                    value={pillBreakDays}
                    onChange={e => setPillBreakDays(Number(e.target.value))}
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Intervalo / placebo</p>
                </div>
              </div>
            </>
          )}

          {methodType === 'injection' && (
            <div className="space-y-2">
              <Label>Intervalo entre aplicações (dias)</Label>
              <Input
                type="number" min={30} max={180}
                value={injectionInterval}
                onChange={e => setInjectionInterval(Number(e.target.value))}
                className="rounded-xl"
              />
              <p className="text-[11px] text-muted-foreground">Ex: 30 (mensal), 60 (bimestral), 90 (trimestral)</p>
            </div>
          )}

          {(hasEndDate || methodType === 'injection') && (
            <div className="space-y-2">
              <Label>Avisar com quantos dias de antecedência?</Label>
              <Select value={String(renewalReminderDays)} onValueChange={v => setRenewalReminderDays(Number(v))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias antes</SelectItem>
                  <SelectItem value="5">5 dias antes</SelectItem>
                  <SelectItem value="7">7 dias antes</SelectItem>
                  <SelectItem value="14">14 dias antes</SelectItem>
                  <SelectItem value="30">30 dias antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Input
              placeholder="Ex: genérico, farmácia X..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold"
          >
            {saving ? 'Salvando...' : 'Salvar método'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
