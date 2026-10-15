// ============================================================================
// StartCycleDialog — Pequena janela do módulo Feminino que pergunta em que dia
// a menstruação começou. A usuária escolhe a data em um calendário (não deixa
// escolher datas futuras) e confirma; a data escolhida é enviada para o app
// registrar o início do ciclo.
// ============================================================================

import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';

// Informações que este componente recebe:
// open = se a janela está aberta; onOpenChange = abrir/fechar a janela;
// onConfirm = função que registra a data escolhida.
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => Promise<void>;
}

export function StartCycleDialog({ open, onOpenChange, onConfirm }: Props) {
  // Data selecionada no calendário (começa no dia de hoje).
  const [date, setDate] = useState<Date>(new Date());
  // Indica que está gravando, para desabilitar o botão enquanto isso.
  const [saving, setSaving] = useState(false);

  // Ao confirmar: marca como salvando, envia a data (formato ano-mês-dia)
  // e desmarca o "salvando" ao terminar.
  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(format(date, 'yyyy-MM-dd'));
    setSaving(false);
  };

  // Parte visual: título, pergunta, o calendário e o botão de confirmar.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar início</DialogTitle>
          <DialogDescription>
            Quando sua menstruação começou?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            locale={ptBR}
            disabled={(d) => d > new Date()}
            className="rounded-xl border"
          />
        </div>

        <Button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold"
        >
          {saving ? 'Salvando...' : `Confirmar — ${format(date, "dd/MM/yyyy")}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
