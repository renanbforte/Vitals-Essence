// ============================================================================
// AddValueDialog — Janela do módulo Finanças para lançar um valor em um
// investimento. Dependendo do modo de acompanhamento, ela serve para
// "Adicionar Aporte" (somar um novo valor) ou "Atualizar Valor" (informar o
// saldo atual). A pessoa digita o valor em reais e confirma.
// ============================================================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Informações que este componente recebe:
// open = se a janela está aberta; onOpenChange = abrir/fechar a janela;
// investmentName = nome do investimento mostrado no topo;
// trackingMode = modo de acompanhamento ("cumulative" = aporte, senão = valor atual);
// onSubmit = função que grava o valor informado.
interface AddValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentName: string;
  trackingMode: string;
  onSubmit: (amount: number) => Promise<void>;
}

export function AddValueDialog({ open, onOpenChange, investmentName, trackingMode, onSubmit }: AddValueDialogProps) {
  // Texto do valor digitado no campo.
  const [amount, setAmount] = useState('');
  // Indica que está gravando, para desabilitar o botão enquanto isso.
  const [submitting, setSubmitting] = useState(false);

  // Ao confirmar: converte o texto em número; se for inválido ou zero/negativo,
  // não faz nada. Caso contrário, grava o valor, limpa o campo e fecha a janela.
  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setSubmitting(true);
    await onSubmit(val);
    setAmount('');
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {trackingMode === 'cumulative' ? 'Adicionar Aporte' : 'Atualizar Valor'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{investmentName}</p>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{trackingMode === 'cumulative' ? 'Valor do aporte (R$)' : 'Valor atual (R$)'}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              autoFocus
            />
          </div>
          <Button onClick={handleSubmit} disabled={!amount || submitting} className="w-full gradient-finance text-white">
            {submitting ? 'Salvando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
