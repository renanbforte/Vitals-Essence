// ============================================================================
// RealBalanceCard — Cartão de "Saldo Real" por banco
// Mostra quanto o usuário realmente tem, somando o saldo inicial de cada banco
// com o que já foi efetivamente pago/recebido. Ao expandir, lista banco por banco
// e permite editar o saldo inicial ou adicionar um novo banco.
// ============================================================================
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, ChevronDown, ChevronUp, Plus, Check, Landmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/finance';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';
import type { BankBalance } from '@/hooks/useBankBalances';

interface RealBalanceCardProps {
  transactions: FinancialTransaction[];
  bankBalances: BankBalance[];
  savedBanks: string[];
  onUpsertBalance: (bankName: string, initialBalance: number) => Promise<void>;
  excludeCostCenterIds?: string[];
  // Modo compacto: esconde o total grande (o hero já o mostra) e lista os bancos
  // direto, como um painel de "Minhas contas".
  compact?: boolean;
  // Quando este número muda (incrementa), abre a janela de adicionar banco —
  // usado pelo card "Conectar banco" para iniciar o cadastro manual.
  requestAddBank?: number;
}

export function RealBalanceCard({ transactions, bankBalances, savedBanks, onUpsertBalance, excludeCostCenterIds = [], compact = false, requestAddBank = 0 }: RealBalanceCardProps) {
  // Estados de tela: se o cartão está expandido, se a janela de edição está aberta e os campos dela
  // No modo compacto a lista de bancos já começa aberta.
  const [expanded, setExpanded] = useState(compact);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState('');
  const [editingValue, setEditingValue] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [saving, setSaving] = useState(false);

  // Considera apenas transações já pagas/recebidas, ignorando as da categoria "Reserva"
  const paidTransactions = useMemo(() =>
    transactions.filter(t => t.paid && (!t.cost_center_id || !excludeCostCenterIds.includes(t.cost_center_id))),
    [transactions, excludeCostCenterIds]
  );

  // Junta todos os bancos conhecidos (os salvos + os que já têm saldo cadastrado), sem repetir
  const allBanks = useMemo(() => {
    const set = new Set<string>();
    savedBanks.forEach(b => set.add(b));
    bankBalances.forEach(b => set.add(b.bank_name));
    return Array.from(set).sort();
  }, [savedBanks, bankBalances]);

  // Calcula o saldo real de cada banco: saldo inicial + entradas pagas - saídas pagas
  const bankData = useMemo(() => {
    const result: { bank: string; initial: number; paidIncome: number; paidExpense: number; real: number }[] = [];

    // Para cada banco, soma o que entrou e o que saiu e chega ao saldo real
    for (const bank of allBanks) {
      const initial = bankBalances.find(b => b.bank_name === bank)?.initial_balance || 0;
      const bankPaidTxns = paidTransactions.filter(t => t.card_bank === bank);
      const paidIncome = bankPaidTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const paidExpense = bankPaidTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      result.push({ bank, initial, paidIncome, paidExpense, real: initial + paidIncome - paidExpense });
    }

    // Transações que não foram atribuídas a nenhum banco entram em um grupo "sem banco"
    const noBankTxns = paidTransactions.filter(t => !t.card_bank);
    if (noBankTxns.length > 0) {
      const noBankInitial = bankBalances.find(b => b.bank_name === '__sem_banco__')?.initial_balance || 0;
      const paidIncome = noBankTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const paidExpense = noBankTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      result.push({ bank: '__sem_banco__', initial: noBankInitial, paidIncome, paidExpense, real: noBankInitial + paidIncome - paidExpense });
    }

    return result;
  }, [allBanks, bankBalances, paidTransactions]);

  // Soma o saldo real de todos os bancos para exibir o total no topo do cartão
  const totalReal = useMemo(() => bankData.reduce((s, b) => s + b.real, 0), [bankData]);

  // Abre a janela para editar o saldo inicial de um banco já existente
  const openEditDialog = (bank: string) => {
    setEditingBank(bank);
    const current = bankBalances.find(b => b.bank_name === bank);
    setEditingValue(current ? String(current.initial_balance) : '0');
    setNewBankName('');
    setDialogOpen(true);
  };

  // Abre a janela para cadastrar um banco novo (campo de nome fica em branco)
  const openAddDialog = () => {
    setEditingBank('');
    setEditingValue('0');
    setNewBankName('');
    setDialogOpen(true);
  };

  // O card "Conectar banco" pode pedir para abrir o cadastro manual: cada vez que
  // requestAddBank incrementa (acima de 0), abrimos a janela de adicionar banco.
  useEffect(() => {
    if (requestAddBank > 0) openAddDialog();
  }, [requestAddBank]);

  // Salva o saldo inicial (do banco editado ou do novo banco) e fecha a janela
  const handleSave = async () => {
    setSaving(true);
    const bankName = editingBank || newBankName.trim();
    if (bankName) {
      await onUpsertBalance(bankName, Number(editingValue) || 0);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  // Converte o código interno "__sem_banco__" em um texto amigável na tela
  const displayBankName = (bank: string) => bank === '__sem_banco__' ? 'Sem banco' : bank;

  // Lista de bancos + botão de adicionar (compartilhada pelos dois modos)
  const bankList = (
    <div className={compact ? 'space-y-2' : 'mt-4 space-y-2'}>
      {bankData.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhuma conta cadastrada ainda.
        </p>
      )}
      {/* Uma linha para cada banco, com nome, saldo inicial e saldo real; clicar edita */}
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
  );

  // Tela do cartão (o resumo clicável) e a janela de edição de saldo
  return (
    <>
      {compact ? (
        // Modo compacto: painel "Minhas contas" (o saldo total fica no hero)
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-[hsl(var(--finance))]" />
              <p className="text-sm font-bold">Minhas contas</p>
            </div>
            {bankList}
          </CardContent>
        </Card>
      ) : (
        // Modo padrão: resumo clicável com o saldo total em destaque
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

            {/* Quando o cartão está expandido, mostra a lista de bancos e o botão de adicionar */}
            {expanded && bankList}
          </CardContent>
        </Card>
      )}

      {/* Janela (modal) de edição: define o saldo inicial de um banco existente ou novo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingBank ? `Saldo inicial — ${displayBankName(editingBank)}` : 'Novo banco'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Campo do nome só aparece quando é um banco novo (na edição o nome já é conhecido) */}
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
