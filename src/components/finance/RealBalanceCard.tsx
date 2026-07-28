import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';
import type { BankBalance } from '@/hooks/useBankBalances';

interface RealBalanceCardProps {
  transactions: FinancialTransaction[];
  bankBalances: BankBalance[];
  savedBanks: string[];
  onUpsertBalance: (bankName: string, initialBalance: number) => Promise<void>;
  excludeCostCenterIds?: string[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function RealBalanceCard({ transactions, bankBalances, savedBanks, onUpsertBalance, excludeCostCenterIds = [] }: RealBalanceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [saving, setSaving] = useState(false);

  // Only paid transactions count, excluding reserve category
  const paidTransactions = useMemo(() => 
    transactions.filter(t => t.paid && (!t.cost_center_id || !excludeCostCenterIds.includes(t.cost_center_id))),
    [transactions, excludeCostCenterIds]
  );

  // All known banks = union of savedBanks + bankBalances banks
  const allBanks = useMemo(() => {
    const set = new Set<string>();
    savedBanks.forEach(b => set.add(b));
    bankBalances.forEach(b => set.add(b.bank_name));
    return Array.from(set).sort();
  }, [savedBanks, bankBalances]);

  // Calculate real balance per bank
  const bankData = useMemo(() => {
    const result: { bank: string; initial: number; paidIncome: number; paidExpense: number; real: number }[] = [];

    for (const bank of allBanks) {
      const initial = bankBalances.find(b => b.bank_name === bank)?.initial_balance || 0;
      const bankPaidTxns = paidTransactions.filter(t => t.card_bank === bank);
      const paidIncome = bankPaidTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const paidExpense = bankPaidTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      result.push({ bank, initial, paidIncome, paidExpense, real: initial + paidIncome - paidExpense });
    }

    // Transactions without bank
    const noBankTxns = paidTransactions.filter(t => !t.card_bank);
    if (noBankTxns.length > 0) {
      const noBankInitial = bankBalances.find(b => b.bank_name === '__sem_banco__')?.initial_balance || 0;
      const paidIncome = noBankTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const paidExpense = noBankTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      result.push({ bank: '__sem_banco__', initial: noBankInitial, paidIncome, paidExpense, real: noBankInitial + paidIncome - paidExpense });
    }

    return result;
  }, [allBanks, bankBalances, paidTransactions]);

  const totalReal = useMemo(() => bankData.reduce((s, b) => s + b.real, 0), [bankData]);

  const openEditDialog = (bank: string) => {
    setEditingBank(bank);
    const current = bankBalances.find(b => b.bank_name === bank);
    setEditingValue(current ? String(current.initial_balance) : '0');
    setNewBankName('');
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingBank('');
    setEditingValue('0');
    setNewBankName('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const bankName = editingBank || newBankName.trim();
    if (bankName) {
      await onUpsertBalance(bankName, Number(editingValue) || 0);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const displayBankName = (bank: string) => bank === '__sem_banco__' ? 'Sem banco' : bank;

  return (
    <>
      <Card
        className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20 cursor-pointer transition-all"
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[hsl(var(--finance))]" />
              <p className="text-xs text-muted-foreground font-medium">Saldo Real</p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
          <p className={`text-2xl font-bold tabular-nums mt-1 ${totalReal >= 0 ? 'text-[hsl(var(--finance))]' : 'text-destructive'}`}>
            {formatCurrency(totalReal)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Baseado em pagos/recebidos + saldo inicial
          </p>

          {expanded && (
            <div className="mt-4 space-y-2">
              {bankData.map(b => (
                <div
                  key={b.bank}
                  className="flex items-center justify-between p-2.5 bg-background/60 rounded-xl cursor-pointer hover:bg-background/80 transition-colors"
                  onClick={(e) => { e.stopPropagation(); openEditDialog(b.bank); }}
                >
                  <div>
                    <p className="text-sm font-medium">{displayBankName(b.bank)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Inicial: {formatCurrency(b.initial)}
                    </p>
                  </div>
                  <p className={`text-sm font-bold tabular-nums ${b.real >= 0 ? 'text-[hsl(var(--finance))]' : 'text-destructive'}`}>
                    {formatCurrency(b.real)}
                  </p>
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); openAddDialog(); }}
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar banco
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingBank ? `Saldo inicial — ${displayBankName(editingBank)}` : 'Novo banco'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingBank && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome do banco</label>
                <Input
                  value={newBankName}
                  onChange={e => setNewBankName(e.target.value)}
                  placeholder="Ex: Nubank"
                  className="rounded-xl"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor inicial (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || (!editingBank && !newBankName.trim())}
              className="w-full rounded-xl gradient-finance text-white gap-2"
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
