// ============================================================================
// Finance  —  TELA DO MÓDULO FINANCEIRO (rota /financeiro)
// ----------------------------------------------------------------------------
// Centro financeiro do usuário. Mostra saldo real, reserva de emergência e
// resumo do mês; e organiza tudo em 3 abas: "Visão Geral" (apresentação dos
// recursos), "Fluxo" (entradas/saídas do mês) e "Investir" (patrimônio).
// ============================================================================

// Importações do React (ferramentas para guardar estados e reagir a mudanças)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpDown, TrendingUp, Plus, Settings2, LineChart } from 'lucide-react';
import { InvestTab } from '@/components/finance/InvestTab';
import { PerformanceTab } from '@/components/finance/PerformanceTab';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
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
import { FinanceHero } from '@/components/finance/FinanceHero';
import { BankConnectCard } from '@/components/finance/BankConnectCard';
import { ReserveCard } from '@/components/finance/ReserveCard';
import { computeRealBalance } from '@/lib/finance';
import { TransactionList } from '@/components/finance/TransactionList';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { CostCenterManager } from '@/components/finance/CostCenterManager';
import { supabase } from '@/integrations/supabase/client';
import { endOfMonth, format } from 'date-fns';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';

// Configurações de animação: "stagger" faz os itens de uma lista aparecerem
// em sequência (um logo depois do outro), criando um efeito em cascata.
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

// "fadeUp": cada item surge subindo suavemente (de baixo para cima) enquanto aparece.
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

// Componente principal da tela Financeiro.
export default function Finance() {
  // --- ESTADOS (memória da tela: valores que mudam com a interação) ---
  const [activeTab, setActiveTab] = useState('flow');            // aba ativa (começa em "Fluxo")
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // mês selecionado para ver os lançamentos
  const [formOpen, setFormOpen] = useState(false);               // se o formulário de lançamento está aberto
  const [formType, setFormType] = useState<'income' | 'expense'>('expense'); // tipo do lançamento: entrada ou saída
  const [costCenterManagerOpen, setCostCenterManagerOpen] = useState(false);  // se o gerenciador de centros de custo está aberto
  const [editingTransaction, setEditingTransaction] = useState<import('@/hooks/useFinancialFlow').FinancialTransaction | null>(null); // lançamento em edição (ou nenhum)
  const [addBankSignal, setAddBankSignal] = useState(0); // incrementa para pedir ao card de contas que abra "adicionar banco"
  const [invRefresh, setInvRefresh] = useState(0); // incrementa para a aba Investir recarregar a carteira após um aporte pago

  // --- DADOS (vindos do Supabase, através dos "hooks") ---
  const { user } = useAuth(); // usuário logado
  // Fluxo financeiro do mês: lista de lançamentos, centros de custo, bancos salvos e as funções para criar/editar/apagar.
  const { transactions, costCenters, savedBanks, loading, addTransaction, updateTransaction, deleteTransaction, togglePaid, togglePlanned, addCostCenter, updateCostCenter, deleteCostCenter, uploadAttachment, searchAllTransactions, refetch: refetchTransactions } = useFinancialFlow(selectedMonth);
  const { totalInvested, investments, refetch: refetchInvestments } = useInvestments(); // patrimônio + carteira p/ sincronizar aportes pagos
  const { bankBalances, upsertBankBalance } = useBankBalances(); // saldos por banco
  const { manualReserve, autoReserve, totalReserve, reservaCenterIds, updateManualReserve } = useFinancialReserve(transactions, costCenters); // reserva de emergência

  // Descobre quais centros de custo são "Investimentos" para separá-los do fluxo comum
  const investmentCostCenterIds = useMemo(
    () => costCenters.filter(cc => cc.name === 'Investimentos').map(cc => cc.id),
    [costCenters]
  );
  // Lançamentos do "Fluxo": TODOS (inclui as saídas de investimento, que agora
  // também aparecem no fluxo — não só na aba Investir).
  const flowTransactions = transactions;
  // Lançamentos de investimento (também aparecem na aba "Investir") — só os reais.
  const investTransactions = useMemo(
    () => transactions.filter(t => !t.is_planned && t.cost_center_id && investmentCostCenterIds.includes(t.cost_center_id)),
    [transactions, investmentCostCenterIds]
  );

  // Visão do Fluxo: Real (só reais), Planejado (só hipóteses) ou Todas.
  const [flowView, setFlowView] = useState<'todas' | 'real' | 'planejado'>('todas');
  const flowReal = useMemo(() => flowTransactions.filter(t => !t.is_planned), [flowTransactions]);
  const flowPlanned = useMemo(() => flowTransactions.filter(t => t.is_planned), [flowTransactions]);
  const displayedFlow = flowView === 'real' ? flowReal : flowView === 'planejado' ? flowPlanned : flowTransactions;

  // Soma entradas/saídas/saldo de um conjunto de lançamentos.
  const summarize = (list: typeof transactions) => {
    const income = list.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  };
  // Resumo exibido no Fluxo (segue a visão escolhida) e resumo só do real (para o hero/investir).
  const flowSummary = useMemo(() => summarize(displayedFlow), [displayedFlow]);
  const realSummary = useMemo(() => summarize(flowReal), [flowReal]);

  // Busca TODOS os lançamentos já pagos até o fim do mês escolhido, para calcular o saldo real acumulado
  const [allPaidTransactions, setAllPaidTransactions] = useState<FinancialTransaction[]>([]);
  const fetchAllPaid = useCallback(async () => {
    if (!user) return;
    // Última data do mês selecionado (para pegar tudo que foi pago até lá)
    const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
    // Consulta ao banco: lançamentos pagos deste usuário, com data até o fim do mês
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

  // Ao abrir a tela ou trocar de mês, refaz a busca dos lançamentos pagos
  useEffect(() => {
    fetchAllPaid();
  }, [fetchAllPaid]);

  // Sempre que os lançamentos do mês mudarem, atualiza também o saldo real
  useEffect(() => {
    if (!loading) fetchAllPaid();
  }, [transactions, loading]);

  // Saldo real total (bancos + pagos/recebidos, fora a reserva) para o hero de topo
  const realBalance = useMemo(
    () => computeRealBalance(allPaidTransactions, bankBalances, reservaCenterIds),
    [allPaidTransactions, bankBalances, reservaCenterIds]
  );

  // Cria um novo lançamento e, se o usuário anexou arquivos (comprovantes), envia cada um
  const handleAddTransaction = async (input: import('@/hooks/useFinancialFlow').TransactionInput, files?: File[]) => {
    const txnId = await addTransaction(input);
    if (txnId && files && files.length > 0) {
      for (const file of files) {
        await uploadAttachment(txnId, file);
      }
    }
  };

  // Abre o formulário para criar um novo lançamento (entrada ou saída)
  const openForm = (type: 'income' | 'expense') => {
    setEditingTransaction(null);
    setFormType(type);
    setFormOpen(true);
  };

  // Abre o formulário já preenchido para editar um lançamento existente
  const handleEdit = (t: import('@/hooks/useFinancialFlow').FinancialTransaction) => {
    setEditingTransaction(t);
    setFormType(t.type);
    setFormOpen(true);
  };

  // Marca/desmarca um lançamento como pago E, se ele for um aporte RECORRENTE de
  // um investimento, reflete isso na carteira: o aporte pago vira principal (soma
  // no Capital operacional); desmarcar reverte. Assim o Fluxo e "Meus investimentos"
  // ficam sincronizados — o dinheiro que de fato saiu entra no investimento.
  // O aporte INICIAL (entry_tx_id) não entra aqui: ele já foi somado ao Capital
  // operacional na criação do investimento, então pagá-lo é só confirmar o caixa.
  // Simulações não entram no patrimônio, então são ignoradas.
  const handleTogglePaid = useCallback(async (id: string, currentPaid: boolean) => {
    await togglePaid(id, currentPaid);
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.type !== 'expense' || !user) return;
    // Série recorrente: pai = ele mesmo; filho = o seu parent_transaction_id.
    const rtx = tx.parent_transaction_id || tx.id;
    const inv = investments.find(i => i.recurring_tx_id === rtx);
    if (!inv || inv.is_simulated) return;
    // Pagando → soma o aporte ao principal; desmarcando (já estava pago) → subtrai.
    const delta = (currentPaid ? -1 : 1) * (Number(tx.amount) || 0);
    const next = Math.max(0, (Number(inv.operating_capital) || 0) + delta);
    const { error } = await supabase
      .from('investments')
      .update({ operating_capital: next })
      .eq('id', inv.id)
      .eq('user_id', user.id);
    if (!error) {
      refetchInvestments();      // atualiza o patrimônio no hero (instância desta tela)
      setInvRefresh(x => x + 1); // pede à aba Investir que recarregue a carteira
    }
  }, [togglePaid, transactions, investments, user, refetchInvestments]);

  // Agenda um aporte mensal recorrente no fluxo, na categoria "Investimentos".
  // O "prazo" define a série: months=N → parcelado (N aportes); sem months →
  // contínuo (sem fim, materializado sob demanda), parando na data endDate quando
  // houver (ex.: vencimento do ativo). planned=true marca como planejado.
  const scheduleAporte = useCallback(async (
    name: string,
    amount: number,
    startDate: string,
    planned = false,
    term?: { months?: number | null; endDate?: string | null },
  ) => {
    const investCC = costCenters.find(cc => cc.name === 'Investimentos');
    const months = term?.months ?? null;
    const isFixed = months != null && months > 0;
    return await addTransaction({
      type: 'expense',
      description: `Aporte - ${name}`,
      amount,
      date: startDate,
      cost_center_id: investCC?.id ?? null,
      is_recurring: true,
      recurrence_type: 'months',
      recurrence_interval: 1,
      recurrence_mode: isFixed ? 'installments' : 'continuous',
      installments: isFixed ? months : undefined,
      recurrence_end_date: !isFixed ? (term?.endDate ?? undefined) : undefined,
      is_planned: planned,
    });
  }, [costCenters, addTransaction]);

  // Registra no fluxo a saída do aporte inicial de um investimento. Fica como
  // pendente (visível na lista do Fluxo); o usuário marca como pago quando o
  // dinheiro de fato sair. planned=true (simulação) marca como planejado.
  const recordInvestmentEntry = useCallback(async (name: string, amount: number, date: string, planned = false) => {
    const investCC = costCenters.find(cc => cc.name === 'Investimentos');
    const txId = await addTransaction({
      type: 'expense',
      description: `Investimento - ${name}`,
      amount,
      date,
      cost_center_id: investCC?.id ?? null,
      is_planned: planned,
    });
    return txId;
  }, [costCenters, addTransaction]);

  // Apaga toda a série de aportes recorrentes (o pai e os filhos) de um
  // investimento no Fluxo. Usado ao reconfigurar o aporte na edição.
  const deleteAporteSeries = useCallback(async (recurringTxId: string) => {
    if (!user) return;
    await supabase.from('financial_transactions').delete().eq('parent_transaction_id', recurringTxId).eq('user_id', user.id);
    await supabase.from('financial_transactions').delete().eq('id', recurringTxId).eq('user_id', user.id);
    refetchTransactions();
  }, [user, refetchTransactions]);

  // Converte os lançamentos planejados de uma simulação em reais (ao torná-la real):
  // a saída inicial e a série de aportes deixam de ser planejadas (ficam no Fluxo real).
  const convertInvestmentTxToReal = useCallback(async (entryTxId: string | null, recurringTxId: string | null) => {
    if (!user) return;
    if (entryTxId) {
      await supabase.from('financial_transactions').update({ is_planned: false }).eq('id', entryTxId).eq('user_id', user.id);
    }
    if (recurringTxId) {
      await supabase.from('financial_transactions').update({ is_planned: false }).eq('id', recurringTxId).eq('user_id', user.id);
      await supabase.from('financial_transactions').update({ is_planned: false }).eq('parent_transaction_id', recurringTxId).eq('user_id', user.id);
    }
    refetchTransactions();
  }, [user, refetchTransactions]);

  // --- APARÊNCIA DA TELA (o que o usuário vê) ---
  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho da tela, com título "Financeiro" e botão de voltar */}
      <Header title="Financeiro" showBack gradientClass="gradient-finance" />

      <main className="container mx-auto px-4 py-6 space-y-5 max-w-3xl">
        {/* Hero: saldo real em destaque + chips de mês, patrimônio e reserva */}
        <FinanceHero
          realBalance={realBalance}
          monthBalance={realSummary.balance}
          patrimony={totalInvested}
          reserve={totalReserve}
        />

        {/* Conectar banco (Open Finance) — ponto de entrada da conexão automática */}
        <BankConnectCard onAddManual={() => setAddBankSignal(s => s + 1)} />

        {/* Minhas contas: saldos por banco (editar/adicionar); o total fica no hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <RealBalanceCard
            transactions={allPaidTransactions}
            bankBalances={bankBalances}
            savedBanks={savedBanks}
            onUpsertBalance={upsertBankBalance}
            excludeCostCenterIds={reservaCenterIds}
            compact
            requestAddBank={addBankSignal}
          />
        </motion.div>

        {/* Cartão de Reserva: reserva de emergência (parte manual + parte automática) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ReserveCard
            manualReserve={manualReserve}
            autoReserve={autoReserve}
            totalReserve={totalReserve}
            onUpdateManual={updateManualReserve}
            bankBalances={bankBalances}
            savedBanks={savedBanks}
            // Ao guardar dinheiro na reserva: cria uma "saída" (PIX) e marca como paga
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
            // Ao retirar da reserva: cria uma "entrada" (PIX) e marca como paga
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

        {/* Sistema de ABAS: alterna entre "Fluxo" e "Investir" (Metas foi unificada em Investir) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Barra com os dois botões de aba */}
          <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-card border border-border p-1.5 shadow-sm">
            <TabsTrigger
              value="flow"
              className="gap-1.5 rounded-xl font-bold text-sm data-[state=active]:gradient-finance data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <ArrowUpDown className="w-4 h-4 shrink-0" />
              <span className="truncate">Fluxo</span>
            </TabsTrigger>
            <TabsTrigger
              value="invest"
              className="gap-1.5 rounded-xl font-bold text-sm data-[state=active]:gradient-finance data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="truncate">Investir</span>
            </TabsTrigger>
            <TabsTrigger
              value="desempenho"
              className="gap-1.5 rounded-xl font-bold text-sm data-[state=active]:gradient-finance data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <LineChart className="w-4 h-4 shrink-0" />
              <span className="truncate">Desempenho</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">

            {/* CONTEÚDO DA ABA "FLUXO": entradas e saídas do mês selecionado */}
            <TabsContent value="flow" className="mt-6" key="flow">
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
                {/* Seletor de mês (setas para navegar entre meses) */}
                <motion.div variants={fadeUp}>
                  <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
                </motion.div>

                {/* Filtro: Real / Planejado / Todas */}
                <motion.div variants={fadeUp} className="grid grid-cols-3 gap-1.5">
                  {([
                    { v: 'todas', label: 'Todas' },
                    { v: 'real', label: '💰 Real' },
                    { v: 'planejado', label: '🔮 Planejado' },
                  ] as { v: typeof flowView; label: string }[]).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setFlowView(opt.v)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        flowView === opt.v
                          ? (opt.v === 'planejado' ? 'bg-amber-500 text-white border-amber-500' : 'gradient-finance text-white border-transparent')
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>

                {/* Resumo do mês: total de entradas, saídas e saldo (segue o filtro) */}
                <motion.div variants={fadeUp}>
                  <FlowSummary income={flowSummary.income} expense={flowSummary.expense} balance={flowSummary.balance} />
                </motion.div>

                {/* Botões de ação: registrar Entrada (verde) ou Saída (vermelho) */}
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

                {/* Link para abrir o gerenciador de centros de custo (categorias de gasto) */}
                <motion.div variants={fadeUp}>
                  <button
                    onClick={() => setCostCenterManagerOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Gerenciar centros de custo
                  </button>
                </motion.div>

                {/* Lista de lançamentos do mês (enquanto carrega, mostra "esqueletos" cinzas) */}
                <motion.div variants={fadeUp}>
                  {loading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 rounded-2xl" />
                      <Skeleton className="h-20 rounded-2xl" />
                    </div>
                  ) : (
                    <TransactionList transactions={displayedFlow} onDelete={deleteTransaction} onEdit={handleEdit} onTogglePaid={handleTogglePaid} onTogglePlanned={togglePlanned} onSearchAll={searchAllTransactions} allCostCenters={costCenters} />
                  )}
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* CONTEÚDO DA ABA "INVESTIR": investimentos, metas e simulador (unificados) */}
            <TabsContent value="invest" className="mt-6" key="invest">
              <InvestTab monthlyIncome={realSummary.income} monthlyExpenses={realSummary.expense} investTransactions={investTransactions} refreshSignal={invRefresh} onDeleteTransaction={deleteTransaction} onEditTransaction={handleEdit} onTogglePaid={handleTogglePaid} onScheduleAporte={scheduleAporte} onRecordInvestmentEntry={recordInvestmentEntry} onConvertInvestmentTxToReal={convertInvestmentTxToReal} onDeleteAporteSeries={deleteAporteSeries} />
            </TabsContent>

            {/* CONTEÚDO DA ABA "DESEMPENHO": tabela e gráfico mês a mês (Real/Planejado) */}
            <TabsContent value="desempenho" className="mt-6" key="desempenho">
              <PerformanceTab />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>

      {/* Formulário (janela) para criar ou editar um lançamento */}
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

      {/* Janela para gerenciar centros de custo (criar, renomear e apagar categorias) */}
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
