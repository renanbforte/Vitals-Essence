import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, Shield, TrendingUp, Target, Compass, BarChart3, Plus, Settings2 } from 'lucide-react';
import { InvestTab } from '@/components/finance/InvestTab';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useFinancialFlow } from '@/hooks/useFinancialFlow';
import { useInvestments } from '@/hooks/useInvestments';
import { useBankBalances } from '@/hooks/useBankBalances';
import { useFinancialReserve } from '@/hooks/useFinancialReserve';
import { MonthSelector } from '@/components/finance/MonthSelector';
import { FlowSummary } from '@/components/finance/FlowSummary';
import { RealBalanceCard } from '@/components/finance/RealBalanceCard';
import { ReserveCard } from '@/components/finance/ReserveCard';
import { TransactionList } from '@/components/finance/TransactionList';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { CostCenterManager } from '@/components/finance/CostCenterManager';
import { supabase } from '@/integrations/supabase/client';
import { endOfMonth, format } from 'date-fns';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

function PlaceholderBlock({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="border-dashed border-2 border-[hsl(var(--finance))]/20 bg-[hsl(var(--finance-light))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 rounded-xl gradient-finance flex items-center justify-center shadow-md">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function Finance() {
  const [activeTab, setActiveTab] = useState('flow');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [costCenterManagerOpen, setCostCenterManagerOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<import('@/hooks/useFinancialFlow').FinancialTransaction | null>(null);

  const { user } = useAuth();
  const { transactions, costCenters, savedBanks, loading, addTransaction, updateTransaction, deleteTransaction, togglePaid, addCostCenter, updateCostCenter, deleteCostCenter, uploadAttachment, searchAllTransactions } = useFinancialFlow(selectedMonth);
  const { totalInvested } = useInvestments();
  const { bankBalances, upsertBankBalance } = useBankBalances();
  const { manualReserve, autoReserve, totalReserve, reservaCenterIds, updateManualReserve } = useFinancialReserve(transactions, costCenters);

  // Identify the "Investimentos" cost center to separate its transactions
  const investmentCostCenterIds = useMemo(
    () => costCenters.filter(cc => cc.name === 'Investimentos').map(cc => cc.id),
    [costCenters]
  );
  const flowTransactions = useMemo(
    () => transactions.filter(t => !t.cost_center_id || !investmentCostCenterIds.includes(t.cost_center_id)),
    [transactions, investmentCostCenterIds]
  );
  const investTransactions = useMemo(
    () => transactions.filter(t => t.cost_center_id && investmentCostCenterIds.includes(t.cost_center_id)),
    [transactions, investmentCostCenterIds]
  );
  const flowSummary = useMemo(() => {
    const income = flowTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = flowTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [flowTransactions]);

  // Fetch ALL paid transactions up to end of selected month for cumulative real balance
  const [allPaidTransactions, setAllPaidTransactions] = useState<FinancialTransaction[]>([]);
  const fetchAllPaid = useCallback(async () => {
    if (!user) return;
    const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('paid', true)
      .lte('date', monthEnd)
      .order('date', { ascending: false });
    if (data) {
      setAllPaidTransactions(data.map(t => ({ ...t, type: t.type as 'income' | 'expense' })));
    }
  }, [user, selectedMonth]);

  useEffect(() => {
    fetchAllPaid();
  }, [fetchAllPaid]);

  // Refetch all paid when transactions change
  useEffect(() => {
    if (!loading) fetchAllPaid();
  }, [transactions, loading]);

  const handleAddTransaction = async (input: import('@/hooks/useFinancialFlow').TransactionInput, files?: File[]) => {
    const txnId = await addTransaction(input);
    if (txnId && files && files.length > 0) {
      for (const file of files) {
        await uploadAttachment(txnId, file);
      }
    }
  };

  const openForm = (type: 'income' | 'expense') => {
    setEditingTransaction(null);
    setFormType(type);
    setFormOpen(true);
  };

  const handleEdit = (t: import('@/hooks/useFinancialFlow').FinancialTransaction) => {
    setEditingTransaction(t);
    setFormType(t.type);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Financeiro" showBack gradientClass="gradient-finance" />

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Real Balance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <RealBalanceCard
            transactions={allPaidTransactions}
            bankBalances={bankBalances}
            savedBanks={savedBanks}
            onUpsertBalance={upsertBankBalance}
            excludeCostCenterIds={reservaCenterIds}
          />
        </motion.div>

        {/* Reserve */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ReserveCard
            manualReserve={manualReserve}
            autoReserve={autoReserve}
            totalReserve={totalReserve}
            onUpdateManual={updateManualReserve}
            bankBalances={bankBalances}
            savedBanks={savedBanks}
            onCreateExpense={async (amount, bankName) => {
              const txId = await addTransaction({
                type: 'expense',
                description: 'Transferência para Reserva',
                amount,
                date: new Date().toISOString().split('T')[0],
                cost_center_id: null,
                payment_method: 'PIX',
                card_bank: bankName,
              });
              if (txId) {
                const { supabase } = await import('@/integrations/supabase/client');
                await supabase.from('financial_transactions').update({ paid: true }).eq('id', txId);
              }
            }}
            onCreateIncome={async (amount, bankName) => {
              const txId = await addTransaction({
                type: 'income',
                description: 'Retirada da Reserva',
                amount,
                date: new Date().toISOString().split('T')[0],
                cost_center_id: null,
                payment_method: 'PIX',
                card_bank: bankName,
              });
              if (txId) {
                const { supabase } = await import('@/integrations/supabase/client');
                await supabase.from('financial_transactions').update({ paid: true }).eq('id', txId);
              }
            }}
          />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Saldo do Mês</p>
              <p className={`text-xl font-bold tabular-nums truncate ${flowSummary.balance >= 0 ? 'text-[hsl(var(--finance))]' : 'text-destructive'}`}>
                {flowTransactions.length > 0 ? formatCurrency(flowSummary.balance) : '—'}
              </p>
              {flowTransactions.length === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">Nenhum lançamento</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Patrimônio</p>
              <p className={`text-xl font-bold tabular-nums truncate ${totalInvested > 0 ? 'text-[hsl(var(--finance))]' : 'text-muted-foreground'}`}>
                {totalInvested > 0 ? formatCurrency(totalInvested) : '—'}
              </p>
              {totalInvested === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">Nenhum investimento</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-card border border-border p-1.5 shadow-sm">
            <TabsTrigger
              value="overview"
              className="gap-2 rounded-xl font-bold text-sm data-[state=active]:gradient-finance data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="flow"
              className="gap-2 rounded-xl font-bold text-sm data-[state=active]:gradient-finance data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <ArrowUpDown className="w-4 h-4" />
              Fluxo
            </TabsTrigger>
            <TabsTrigger
              value="invest"
              className="gap-2 rounded-xl font-bold text-sm data-[state=active]:gradient-finance data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4" />
              Investir
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6" key="overview">
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp}>
                  <PlaceholderBlock
                    icon={ArrowUpDown}
                    title="Fluxo Financeiro"
                    description="Registre suas entradas e saídas com recorrência automática. Saiba exatamente para onde seu dinheiro vai."
                  />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <PlaceholderBlock icon={Shield} title="Segurança Financeira" description="Descubra por quantos meses você consegue viver sem renda." />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <PlaceholderBlock icon={TrendingUp} title="Investimentos" description="Acompanhe seu patrimônio investido por categoria." />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <PlaceholderBlock icon={BarChart3} title="Crescimento Patrimonial" description="Evolução do patrimônio ao longo do tempo." />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <PlaceholderBlock icon={Target} title="Metas de Investimento" description="Defina metas com prazo e valor alvo." />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <PlaceholderBlock icon={Compass} title="Liberdade Financeira" description="Quanto do seu futuro já está comprometido?" />
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Flow Tab */}
            <TabsContent value="flow" className="mt-6" key="flow">
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                <motion.div variants={fadeUp}>
                  <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                </motion.div>

                <motion.div variants={fadeUp}>
                  <FlowSummary income={flowSummary.income} expense={flowSummary.expense} balance={flowSummary.balance} />
                </motion.div>

                {/* Action buttons */}
                <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => openForm('income')}
                    variant="outline"
                    className="rounded-xl h-11 gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    Entrada
                  </Button>
                  <Button
                    onClick={() => openForm('expense')}
                    variant="outline"
                    className="rounded-xl h-11 gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    Saída
                  </Button>
                </motion.div>

                {/* Manage cost centers */}
                <motion.div variants={fadeUp}>
                  <button
                    onClick={() => setCostCenterManagerOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Gerenciar centros de custo
                  </button>
                </motion.div>

                <motion.div variants={fadeUp}>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 rounded-2xl" />
                      <Skeleton className="h-20 rounded-2xl" />
                    </div>
                  ) : (
                    <TransactionList transactions={flowTransactions} onDelete={deleteTransaction} onEdit={handleEdit} onTogglePaid={togglePaid} onSearchAll={searchAllTransactions} allCostCenters={costCenters} />
                  )}
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Invest Tab */}
            <TabsContent value="invest" className="mt-6" key="invest">
              <InvestTab monthlyIncome={flowSummary.income} monthlyExpenses={flowSummary.expense} investTransactions={investTransactions} onDeleteTransaction={deleteTransaction} onEditTransaction={handleEdit} onTogglePaid={togglePaid} />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      <TransactionForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingTransaction(null); }}
        costCenters={costCenters}
        onSubmit={handleAddTransaction}
        onAddCostCenter={addCostCenter}
        initialType={formType}
        editTransaction={editingTransaction}
        onUpdate={updateTransaction}
        savedBanks={savedBanks}
      />

      <CostCenterManager
        open={costCenterManagerOpen}
        onOpenChange={setCostCenterManagerOpen}
        costCenters={costCenters}
        onUpdate={updateCostCenter}
        onDelete={deleteCostCenter}
        onAdd={addCostCenter}
      />
    </div>
  );
}
