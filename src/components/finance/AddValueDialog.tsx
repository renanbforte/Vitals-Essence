import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investmentName: string;
  trackingMode: string;
  onSubmit: (amount: number) => Promise<void>;
}

export function AddValueDialog({ open, onOpenChange, investmentName, trackingMode, onSubmit }: AddValueDialogProps) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
