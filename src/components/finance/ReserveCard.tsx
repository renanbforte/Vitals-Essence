import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PiggyBank, ChevronDown, ChevronUp, Check, Pencil, Plus, Minus } from 'lucide-react';
import type { BankBalance } from '@/hooks/useBankBalances';

interface ReserveCardProps {
  manualReserve: number;
  autoReserve: number;
  totalReserve: number;
  onUpdateManual: (amount: number) => Promise<void>;
  bankBalances?: BankBalance[];
  savedBanks?: string[];
  onCreateExpense?: (amount: number, bankName: string) => Promise<void>;
  onCreateIncome?: (amount: number, bankName: string) => Promise<void>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ReserveCard({ manualReserve, autoReserve, totalReserve, onUpdateManual, bankBalances = [], savedBanks = [], onCreateExpense, onCreateIncome }: ReserveCardProps) {
  // Merge all known banks from balances + transactions
  const allBanks = useMemo(() => {
    const set = new Set<string>();
    bankBalances.forEach(b => set.add(b.bank_name));
    savedBanks.forEach(b => set.add(b));
    return Array.from(set).filter(b => b !== '__sem_banco__').sort();
  }, [bankBalances, savedBanks]);
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'add' | 'remove'>('edit');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [deductFromBalance, setDeductFromBalance] = useState(true);
  const [returnToBalance, setReturnToBalance] = useState(true);
  const [selectedBank, setSelectedBank] = useState('');

  const openDialog = (mode: 'edit' | 'add' | 'remove') => {
    setDialogMode(mode);
    setEditValue(mode === 'edit' ? String(manualReserve) : '');
    setDeductFromBalance(mode === 'add');
    setReturnToBalance(mode === 'remove');
    setSelectedBank('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const val = Number(editValue) || 0;
    setSaving(true);

    if (dialogMode === 'add') {
      const newValue = manualReserve + val;
      await onUpdateManual(newValue);
      if (deductFromBalance && selectedBank && val > 0 && onCreateExpense) {
        await onCreateExpense(val, selectedBank);
      }
    } else if (dialogMode === 'remove') {
      const newValue = Math.max(0, manualReserve - val);
      await onUpdateManual(newValue);
      if (returnToBalance && selectedBank && val > 0 && onCreateIncome) {
        await onCreateIncome(val, selectedBank);
      }
    } else {
      // edit mode — set absolute value
      const diff = val - manualReserve;
      await onUpdateManual(val);
      if (deductFromBalance && selectedBank && diff > 0 && onCreateExpense) {
        await onCreateExpense(diff, selectedBank);
      }
    }

    setSaving(false);
    setDialogOpen(false);
  };

  const isIncreasing = dialogMode === 'add' || (dialogMode === 'edit' && (Number(editValue) || 0) > manualReserve);
  const diffAmount = dialogMode === 'add'
    ? (Number(editValue) || 0)
    : (Number(editValue) || 0) - manualReserve;

  return (
    <>
      <Card
        className="bg-amber-50 dark:bg-amber-950/30 border-amber-300/30 dark:border-amber-700/30 cursor-pointer transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-muted-foreground font-medium">Reserva</p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
          <p className="text-2xl font-bold tabular-nums mt-1 text-amber-600 dark:text-amber-400">
            {formatCurrency(totalReserve)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Separado do saldo real
          </p>

          {expanded && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-background/60 rounded-xl">
                <div>
                  <p className="text-sm font-medium">Reserva manual</p>
                  <p className="text-[10px] text-muted-foreground">Valor ajustado por você</p>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatCurrency(manualReserve)}
                  </p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDialog('add'); }}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDialog('remove'); }}>
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDialog('edit'); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {autoReserve !== 0 && (
                <div className="flex items-center justify-between p-2.5 bg-background/60 rounded-xl">
                  <div>
                    <p className="text-sm font-medium">Via transações</p>
                    <p className="text-[10px] text-muted-foreground">Entradas com categoria "Reserva"</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {formatCurrency(autoReserve)}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Adicionar à reserva' : dialogMode === 'remove' ? 'Retirar da reserva' : 'Ajustar reserva manual'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {dialogMode === 'edit' ? 'Valor total da reserva (R$)' : 'Valor (R$)'}
              </label>
              <Input
                type="number"
                step="0.01"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="rounded-xl"
                onFocus={e => { if (editValue === '0') e.target.value = ''; }}
              />
            </div>

            {isIncreasing && allBanks.length > 0 && onCreateExpense && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deduct-balance" className="text-sm font-medium">Sair do saldo real?</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {deductFromBalance
                        ? `R$ ${diffAmount.toFixed(2)} será retirado do saldo`
                        : 'Valor vem de fora (outro banco, dinheiro, etc.)'}
                    </p>
                  </div>
                  <Switch
                    id="deduct-balance"
                    checked={deductFromBalance}
                    onCheckedChange={(v) => { setDeductFromBalance(v); if (!v) setSelectedBank(''); }}
                  />
                </div>

                {deductFromBalance && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">De qual banco?</Label>
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {allBanks.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {dialogMode === 'remove' && allBanks.length > 0 && onCreateIncome && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="return-balance" className="text-sm font-medium">Devolver ao saldo real?</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {returnToBalance
                        ? `R$ ${(Number(editValue) || 0).toFixed(2)} será adicionado ao saldo`
                        : 'O dinheiro já foi usado fora do controle'}
                    </p>
                  </div>
                  <Switch
                    id="return-balance"
                    checked={returnToBalance}
                    onCheckedChange={(v) => { setReturnToBalance(v); if (!v) setSelectedBank(''); }}
                  />
                </div>

                {returnToBalance && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Para qual banco?</Label>
                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {allBanks.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={saving || (isIncreasing && deductFromBalance && allBanks.length > 0 && !selectedBank) || (dialogMode === 'remove' && returnToBalance && allBanks.length > 0 && !selectedBank)}
              className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              <Check className="w-4 h-4" />
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
