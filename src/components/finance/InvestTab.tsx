import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, BarChart3, Bitcoin, ArrowUpRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvestments } from '@/hooks/useInvestments';
import { InvestmentCard } from './InvestmentCard';
import { InvestmentForm } from './InvestmentForm';
import { InvestmentCapacity } from './InvestmentCapacity';
import { TradeTab } from './TradeTab';
import { CryptoTab } from './CryptoTab';
import { FlowSummary } from './FlowSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

interface InvestTabProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  investTransactions?: FinancialTransaction[];
  onDeleteTransaction?: (id: string, deleteRelated?: boolean) => void;
  onEditTransaction?: (t: FinancialTransaction) => void;
  onTogglePaid?: (id: string, currentPaid: boolean) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InvestTab({ monthlyIncome, monthlyExpenses, investTransactions = [], onDeleteTransaction, onEditTransaction, onTogglePaid }: InvestTabProps) {
  const {
    investments,
    loading,
    totalInvested,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addValue,
    INVESTMENT_TYPES,
    OBJECTIVES,
  } = useInvestments();

  const [formOpen, setFormOpen] = useState(false);
  const [subTab, setSubTab] = useState('portfolio');
  const [showPaidInvest, setShowPaidInvest] = useState(false);

  const investSummary = useMemo(() => {
    const income = investTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = investTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [investTransactions]);

  const unpaidInvest = useMemo(() => investTransactions.filter(t => !t.paid), [investTransactions]);
  const paidInvest = useMemo(() => investTransactions.filter(t => t.paid), [investTransactions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const renderInvestTransactionRow = (t: FinancialTransaction, dimmed = false) => (
    <div
      key={t.id}
      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-all ${dimmed ? 'opacity-70' : ''}`}
      onClick={() => onEditTransaction?.(t)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePaid?.(t.id, t.paid);
        }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all border-2 ${
          t.paid
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600'
            : 'bg-[hsl(var(--finance))]/10 border-[hsl(var(--finance))]/20 text-[hsl(var(--finance))]'
        }`}
      >
        {t.paid ? <Check className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
      </button>
      <div className={`flex-1 min-w-0 ${dimmed ? 'opacity-50' : ''}`}>
        <p className={`text-sm font-semibold truncate ${t.paid ? 'line-through' : ''}`}>{t.description}</p>
        <p className="text-[10px] text-muted-foreground">
          {format(parseISO(t.date), "dd 'de' MMMM", { locale: ptBR })}
        </p>
        {t.paid && (
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">✓ Pago</p>
        )}
      </div>
      <p className="text-sm font-bold tabular-nums shrink-0 text-[hsl(var(--finance))]">
        {formatCurrency(Number(t.amount))}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="portfolio" className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            Carteira
          </TabsTrigger>
          <TabsTrigger value="trade" className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="w-3.5 h-3.5" />
            Trade
          </TabsTrigger>
          <TabsTrigger value="crypto" className="gap-1.5 rounded-lg text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bitcoin className="w-3.5 h-3.5" />
            Cripto
          </TabsTrigger>
        </TabsList>

      {/* Portfolio sub-tab */}
        <TabsContent value="portfolio" className="mt-4">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {/* Patrimônio total — somente investimentos */}
            <motion.div variants={fadeUp}>
              <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
                <CardContent className="p-5 text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Patrimônio Investido</p>
                  <p className="text-3xl font-bold text-[hsl(var(--finance))] tabular-nums">
                    {formatCurrency(totalInvested)}
                  </p>
                  {investments.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {investments.length} {investments.length === 1 ? 'investimento' : 'investimentos'} ativos
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Capacidade de investimento */}
            <motion.div variants={fadeUp}>
              <InvestmentCapacity
                monthlyIncome={monthlyIncome}
                monthlyExpenses={monthlyExpenses}
                totalInvested={totalInvested}
              />
            </motion.div>

            {/* Fluxo de aportes — transações com centro de custo "Investimentos" */}
            {investTransactions.length > 0 && (
              <motion.div variants={fadeUp} className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Aportes do Mês</h3>
                <FlowSummary income={investSummary.income} expense={investSummary.expense} balance={investSummary.balance} />
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {unpaidInvest.map(t => renderInvestTransactionRow(t))}
                  </CardContent>
                </Card>
                {paidInvest.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowPaidInvest(!showPaidInvest)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
                    >
                      {showPaidInvest ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {showPaidInvest ? 'Ocultar' : 'Mostrar'} {paidInvest.length} {paidInvest.length === 1 ? 'aporte concluído' : 'aportes concluídos'}
                    </button>
                    {showPaidInvest && (
                      <Card className="opacity-60">
                        <CardContent className="p-0 divide-y divide-border">
                          {paidInvest.map(t => renderInvestTransactionRow(t, true))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* Divisão por investimento */}
            <motion.div variants={fadeUp}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-2">Meus Investimentos</h3>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button
                onClick={() => setFormOpen(true)}
                variant="outline"
                className="w-full rounded-xl h-11 gap-2 border-[hsl(var(--finance))]/30 text-[hsl(var(--finance))] hover:bg-[hsl(var(--finance))]/10"
              >
                <Plus className="w-4 h-4" />
                Novo Investimento
              </Button>
            </motion.div>

            {investments.length === 0 ? (
              <motion.div variants={fadeUp}>
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-[hsl(var(--finance))]/40 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Nenhum investimento</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Crie seu primeiro investimento para começar a acompanhar seu patrimônio.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              investments.map((inv, idx) => (
                <motion.div key={inv.id} variants={fadeUp}>
                  <InvestmentCard
                    investment={inv}
                    index={idx}
                    onAddValue={addValue}
                    onDelete={deleteInvestment}
                    onUpdate={updateInvestment}
                    investmentTypes={INVESTMENT_TYPES}
                    objectives={OBJECTIVES}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
        </TabsContent>

        {/* Trade sub-tab */}
        <TabsContent value="trade" className="mt-4">
          <TradeTab />
        </TabsContent>

        {/* Crypto sub-tab */}
        <TabsContent value="crypto" className="mt-4">
          <CryptoTab />
        </TabsContent>
      </Tabs>

      <InvestmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addInvestment}
        investmentTypes={INVESTMENT_TYPES}
        objectives={OBJECTIVES}
      />
    </div>
  );
}
