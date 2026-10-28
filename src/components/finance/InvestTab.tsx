// ============================================================================
// InvestTab (Aba Investimentos)
// Aba principal de investimentos, dividida em tres sub-abas: Carteira, Trade e
// Cripto. Na Carteira mostra o patrimonio investido, a capacidade de investir,
// os aportes do mes e a lista de investimentos cadastrados (com opcao de criar).
// ============================================================================
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, ArrowUpRight, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInvestments } from '@/hooks/useInvestments';
import { useMarketRates } from '@/hooks/useMarketRates';
import { InvestmentCard } from './InvestmentCard';
import { InvestmentForm } from './InvestmentForm';
import { InvestmentCapacity } from './InvestmentCapacity';
import { MarketRatesCard } from './MarketRatesCard';
import { MetasTab } from './MetasTab';
import { FlowSummary } from './FlowSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';

// Animacao: cada item surge de baixo para cima com leve efeito de mola.
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

// Animacao: faz os filhos aparecerem em sequencia (um apos o outro).
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
  // Agenda um aporte mensal recorrente no fluxo; planned=true marca como planejado.
  onScheduleAporte?: (name: string, amount: number, startDate: string, planned?: boolean) => Promise<string | null>;
  // Registra a saída do aporte inicial no fluxo; planned=true marca como planejado.
  onRecordInvestmentEntry?: (name: string, amount: number, date: string, planned?: boolean) => Promise<string | null>;
  // Converte os lançamentos planejados de uma simulação em reais (ao torná-la real).
  onConvertInvestmentTxToReal?: (entryTxId: string | null, recurringTxId: string | null) => Promise<void>;
}

// Formata um numero como valor em real brasileiro (ex: "R$ 1.234,56").
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InvestTab({ monthlyIncome, monthlyExpenses, investTransactions = [], onDeleteTransaction, onEditTransaction, onTogglePaid, onScheduleAporte, onRecordInvestmentEntry, onConvertInvestmentTxToReal }: InvestTabProps) {
  // Busca no banco a lista de investimentos, o total investido e as funcoes
  // para adicionar, atualizar, excluir e aportar valor, alem das listas de
  // tipos e objetivos disponiveis.
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
  const marketApi = useMarketRates();

  const [formOpen, setFormOpen] = useState(false);
  const [showPaidInvest, setShowPaidInvest] = useState(false);

  // Separa os investimentos reais (entram no patrimônio) das simulações (planejamento).
  const realInvestments = useMemo(() => investments.filter(i => !i.is_simulated), [investments]);
  const simulatedInvestments = useMemo(() => investments.filter(i => i.is_simulated), [investments]);

  // Cria um investimento e registra a saída no Fluxo. Real = lançamentos reais
  // (saída paga); Simulação = lançamentos PLANEJADOS (aparecem no Fluxo como plano).
  const handleCreateInvestment = async (input: Parameters<typeof addInvestment>[0]) => {
    const today = new Date().toISOString().split('T')[0];
    const planned = !!input.is_simulated; // simulação → lançamentos planejados
    const dateRef = input.start_date || today;
    let recurringTxId: string | null = null;
    let entryTxId: string | null = null;
    // Saída do capital investido — aparece no Fluxo (real: pago; simulado: planejado).
    const entryAmount = Number(input.operating_capital || 0);
    if (entryAmount > 0 && onRecordInvestmentEntry) {
      entryTxId = await onRecordInvestmentEntry(input.name, entryAmount, dateRef, planned);
    }
    if (input.is_recurring_contribution && input.recurring_amount && onScheduleAporte) {
      recurringTxId = await onScheduleAporte(input.name, Number(input.recurring_amount), dateRef, planned);
    }
    await addInvestment({ ...input, recurring_tx_id: recurringTxId, entry_tx_id: entryTxId });
  };

  // Promove uma simulação a real: se ela já tinha lançamentos planejados no Fluxo,
  // converte-os em reais; senão (dados antigos), cria os reais agora.
  const handleMakeReal = async (inv: typeof investments[number], startDate: string) => {
    if ((inv.entry_tx_id || inv.recurring_tx_id) && onConvertInvestmentTxToReal) {
      await onConvertInvestmentTxToReal(inv.entry_tx_id, inv.recurring_tx_id);
      await updateInvestment(inv.id, { is_simulated: false, start_date: startDate });
      return;
    }
    let recurringTxId: string | null = null;
    let entryTxId: string | null = null;
    const entryAmount = Number(inv.operating_capital || 0);
    if (entryAmount > 0 && onRecordInvestmentEntry) {
      entryTxId = await onRecordInvestmentEntry(inv.name, entryAmount, startDate, false);
    }
    if (inv.is_recurring_contribution && inv.recurring_amount && onScheduleAporte) {
      recurringTxId = await onScheduleAporte(inv.name, Number(inv.recurring_amount), startDate, false);
    }
    await updateInvestment(inv.id, {
      is_simulated: false,
      start_date: startDate,
      recurring_tx_id: recurringTxId,
      entry_tx_id: entryTxId,
    });
  };

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
      {/* Carteira de investimentos (as abas Trade e Cripto foram removidas) */}
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

            {/* Taxas de mercado (CDI/IPCA) — base dos cálculos de renda fixa */}
            <motion.div variants={fadeUp}>
              <MarketRatesCard api={marketApi} />
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

            {/* Meus investimentos (reais) */}
            <motion.div variants={fadeUp} className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Meus Investimentos</h3>
              <Button
                size="sm"
                onClick={() => setFormOpen(true)}
                className="rounded-xl gap-1.5 gradient-finance text-white font-bold h-8"
              >
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            </motion.div>

            {realInvestments.length === 0 ? (
              <motion.div variants={fadeUp}>
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-[hsl(var(--finance))]/40 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Nenhum investimento real</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Cadastre um investimento real ou torne uma simulação real para começar a acompanhar seu patrimônio.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              realInvestments.map((inv, idx) => (
                <motion.div key={inv.id} variants={fadeUp}>
                  <InvestmentCard
                    investment={inv}
                    index={idx}
                    onAddValue={addValue}
                    onDelete={deleteInvestment}
                    onUpdate={updateInvestment}
                    onMakeReal={handleMakeReal}
                    investmentTypes={INVESTMENT_TYPES}
                    objectives={OBJECTIVES}
                    marketRates={marketApi.rates}
                  />
                </motion.div>
              ))
            )}

            {/* Simulações (planejamento) — separadas dos reais */}
            {simulatedInvestments.length > 0 && (
              <>
                <motion.div variants={fadeUp} className="pt-2">
                  <h3 className="text-xs font-bold text-violet-600 uppercase tracking-wider px-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Simulações
                  </h3>
                  <p className="text-[10px] text-muted-foreground px-1">Planejamento — não contam no patrimônio até você torná-las reais.</p>
                </motion.div>
                {simulatedInvestments.map((inv, idx) => (
                  <motion.div key={inv.id} variants={fadeUp}>
                    <InvestmentCard
                      investment={inv}
                      index={idx}
                      onAddValue={addValue}
                      onDelete={deleteInvestment}
                      onUpdate={updateInvestment}
                      onMakeReal={handleMakeReal}
                      investmentTypes={INVESTMENT_TYPES}
                      objectives={OBJECTIVES}
                      marketRates={marketApi.rates}
                    />
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>

      {/* Metas e simulador de projeção — unificados aqui dentro de Investir */}
      <MetasTab totalInvested={totalInvested} />

      <InvestmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateInvestment}
        investmentTypes={INVESTMENT_TYPES}
        objectives={OBJECTIVES}
        marketRates={marketApi.rates}
      />
    </div>
  );
}
