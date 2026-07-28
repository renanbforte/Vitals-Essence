import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDownLeft, ArrowUpRight, Repeat, Trash2, Check,
  ChevronDown, ChevronUp, Search, List, CalendarDays, X,
  SortAsc, SortDesc,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FinancialTransaction } from '@/hooks/useFinancialFlow';

interface TransactionListProps {
  transactions: FinancialTransaction[];
  onDelete: (id: string, deleteRelated?: boolean) => void;
  onEdit?: (transaction: FinancialTransaction) => void;
  onTogglePaid?: (id: string, currentPaid: boolean) => void;
  onSearchAll?: (query?: string, costCenterId?: string, dateFrom?: string, dateTo?: string) => Promise<FinancialTransaction[]>;
  allCostCenters?: { id: string; name: string; icon: string | null }[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function getRecurrenceLabel(t: FinancialTransaction): string {
  const interval = t.recurrence_interval || 1;
  const typeLabels: Record<string, [string, string]> = {
    days: ['dia', 'dias'],
    weeks: ['semana', 'semanas'],
    months: ['mês', 'meses'],
    years: ['ano', 'anos'],
    weekly: ['semana', 'semanas'],
    monthly: ['mês', 'meses'],
    yearly: ['ano', 'anos'],
  };
  const labels = typeLabels[t.recurrence_type || 'months'] || ['mês', 'meses'];
  if (interval === 1) return `A cada ${labels[0]}`;
  return `A cada ${interval} ${labels[1]}`;
}


type SortOrder = 'asc' | 'desc';
type ViewMode = 'date' | 'list';

export function TransactionList({ transactions, onDelete, onEdit, onTogglePaid, onSearchAll, allCostCenters }: TransactionListProps) {
  const [deleteTarget, setDeleteTarget] = useState<FinancialTransaction | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [globalResults, setGlobalResults] = useState<FinancialTransaction[] | null>(null);
  const [searching, setSearching] = useState(false);

  const hasActiveFilters = searchQuery.trim() !== '' || filterCostCenter !== 'all' || dateFrom !== '' || dateTo !== '';

  // Derive cost centers from allCostCenters prop or from transactions
  const costCenters = useMemo(() => {
    if (allCostCenters && allCostCenters.length > 0) return allCostCenters;
    const unique = new Map<string, { id: string; name: string; icon: string | null }>();
    transactions.forEach(t => {
      if (t.cost_center) {
        unique.set(t.cost_center.id, t.cost_center);
      }
    });
    return Array.from(unique.values());
  }, [transactions, allCostCenters]);

  // Trigger global search when filters change
  useEffect(() => {
    if (!hasActiveFilters) {
      setGlobalResults(null);
      return;
    }
    if (!onSearchAll) return;

    const timeout = setTimeout(async () => {
      setSearching(true);
      const results = await onSearchAll(
        searchQuery.trim() || undefined,
        filterCostCenter !== 'all' ? filterCostCenter : undefined,
        dateFrom || undefined,
        dateTo || undefined,
      );
      setGlobalResults(results);
      setSearching(false);
    }, 300); // debounce

    return () => clearTimeout(timeout);
  }, [searchQuery, filterCostCenter, dateFrom, dateTo, hasActiveFilters, onSearchAll]);

  // When filters active → use global results, otherwise use month transactions
  

  const filteredTransactions = useMemo(() => {
    // If using global results, they're already filtered server-side
    if (hasActiveFilters && globalResults !== null) return globalResults;

    // Fallback: local filter on month transactions (no filters active)
    return transactions;
  }, [transactions, globalResults, hasActiveFilters]);

  const handleDeleteClick = (t: FinancialTransaction) => {
    if (t.is_recurring || t.parent_transaction_id) {
      setDeleteTarget(t);
    } else {
      onDelete(t.id, false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCostCenter('all');
    setDateFrom('');
    setDateTo('');
  };


  if (transactions.length === 0 && !hasActiveFilters) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum lançamento neste mês.</p>
          <p className="text-muted-foreground text-xs mt-1">Toque em + para adicionar.</p>
        </CardContent>
      </Card>
    );
  }

  const renderTransactionRow = (t: FinancialTransaction, dimmed = false) => (
    <div
      key={t.id}
      className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-all ${
        t.paid && dimmed ? 'opacity-70' : ''
      }`}
      onClick={() => onEdit?.(t)}
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
            : t.type === 'income'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
              : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}
        title={t.paid
          ? (t.type === 'income' ? 'Marcar como não recebido' : 'Marcar como não pago')
          : (t.type === 'income' ? 'Marcar como recebido' : 'Marcar como pago')
        }
      >
        {t.paid ? (
          <Check className="w-4 h-4" />
        ) : t.type === 'income' ? (
          <ArrowDownLeft className="w-4 h-4" />
        ) : (
          <ArrowUpRight className="w-4 h-4" />
        )}
      </button>
      <div className={`flex-1 min-w-0 ${t.paid && dimmed ? 'opacity-50' : ''}`}>
        <p className={`text-sm font-semibold truncate ${t.paid ? 'line-through' : ''}`}>{t.description}</p>
        {viewMode === 'list' && (
          <p className="text-[10px] text-muted-foreground">
            {format(parseISO(t.date), "dd/MM/yyyy")}
          </p>
        )}
        {(t.is_recurring || t.parent_transaction_id) && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {t.installment_label && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                {t.installment_label}
              </span>
            )}
            {t.is_recurring && (
              <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded-full w-fit">
                <Repeat className="w-3 h-3" />
                {getRecurrenceLabel(t)}
              </span>
            )}
          </span>
        )}
        {t.cost_center && (
          <p className="text-[11px] text-muted-foreground">
            {t.cost_center.icon} {t.cost_center.name}
          </p>
        )}
        {t.payment_method && (
          <p className="text-[10px] text-muted-foreground">
            {t.payment_method === 'pix' ? '⚡ PIX' : t.payment_method === 'boleto' ? '📄 Boleto' : t.payment_method === 'dinheiro' ? '💵 Dinheiro' : t.payment_method === 'cartao' ? `💳 ${t.card_bank || 'Cartão'}` : t.payment_method}
          </p>
        )}
        {t.paid && (
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {t.type === 'income' ? '✓ Recebido' : '✓ Pago'}
          </p>
        )}
      </div>
      <p className={`text-sm font-bold tabular-nums shrink-0 ${
        t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
      }`}>
        {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); handleDeleteClick(t); }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderGroupedView = (txns: FinancialTransaction[], dimmed = false) => {
    const grouped = txns.reduce<Record<string, FinancialTransaction[]>>((acc, t) => {
      const key = t.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort((a, b) =>
      sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    );

    return sortedDates.map(dateStr => (
      <div key={dateStr}>
        <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
          {format(parseISO(dateStr), "dd 'de' MMMM", { locale: ptBR })}
        </p>
        <Card className={dimmed ? 'opacity-60' : ''}>
          <CardContent className="p-0 divide-y divide-border">
            {grouped[dateStr].map(t => renderTransactionRow(t, dimmed))}
          </CardContent>
        </Card>
      </div>
    ));
  };

  const renderFlatView = (txns: FinancialTransaction[], dimmed = false) => {
    const sorted = [...txns].sort((a, b) =>
      sortOrder === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );

    return (
      <Card className={dimmed ? 'opacity-60' : ''}>
        <CardContent className="p-0 divide-y divide-border">
          {sorted.map(t => renderTransactionRow(t, dimmed))}
        </CardContent>
      </Card>
    );
  };

  const unpaidTransactions = filteredTransactions.filter(t => !t.paid);
  const paidTransactions = filteredTransactions.filter(t => t.paid);

  const renderContent = (txns: FinancialTransaction[], dimmed = false) =>
    viewMode === 'date' ? renderGroupedView(txns, dimmed) : renderFlatView(txns, dimmed);

  return (
    <>
      {/* Controls bar */}
      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg shrink-0"
          onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}
          title={sortOrder === 'asc' ? 'Mais antigo primeiro' : 'Mais recente primeiro'}
        >
          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg shrink-0"
          onClick={() => setViewMode(v => v === 'date' ? 'list' : 'date')}
          title={viewMode === 'date' ? 'Visualização por data' : 'Visualização em lista'}
        >
          {viewMode === 'date' ? <CalendarDays className="w-4 h-4" /> : <List className="w-4 h-4" />}
        </Button>

        <Button
          variant={showFilters ? 'secondary' : 'ghost'}
          size="icon"
          className={`h-8 w-8 rounded-lg shrink-0 ${hasActiveFilters ? 'text-[hsl(var(--finance))]' : ''}`}
          onClick={() => setShowFilters(f => !f)}
          title="Filtros"
        >
          <Search className="w-4 h-4" />
        </Button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar
          </button>
        )}

        <div className="flex-1" />
        <p className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {filteredTransactions.length} lançamento{filteredTransactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex flex-col gap-2 mb-3 p-3 bg-card rounded-xl border border-border">
          <Input
            placeholder="Buscar por nome ou valor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-lg text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">De</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Até</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-lg text-sm"
              />
            </div>
          </div>
          {costCenters.length > 0 && (
            <Select value={filterCostCenter} onValueChange={setFilterCostCenter}>
              <SelectTrigger className="h-9 rounded-lg text-sm">
                <SelectValue placeholder="Centro de custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os centros</SelectItem>
                {costCenters.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.icon} {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {searching && (
        <p className="text-xs text-muted-foreground text-center py-2">Buscando...</p>
      )}

      {hasActiveFilters && !searching && globalResults !== null && (
        <p className="text-[10px] text-muted-foreground text-center mb-2">
          Mostrando resultados de todos os meses
        </p>
      )}

      {filteredTransactions.length === 0 && hasActiveFilters ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Nenhum lançamento encontrado.</p>
            <button onClick={clearFilters} className="text-xs text-[hsl(var(--finance))] mt-1 hover:underline">
              Limpar filtros
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {renderContent(unpaidTransactions)}

          {paidTransactions.length > 0 && (
            <>
              <button
                onClick={() => setShowPaid(!showPaid)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                {showPaid ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showPaid ? 'Ocultar' : 'Mostrar'} {paidTransactions.length} {paidTransactions.length === 1 ? 'lançamento concluído' : 'lançamentos concluídos'}
              </button>
              {showPaid && renderContent(paidTransactions, true)}
            </>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Este lançamento faz parte de uma recorrência. O que deseja excluir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="destructive"
              className="w-full rounded-xl"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id, true);
                setDeleteTarget(null);
              }}
            >
              Excluir todas as recorrências
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget.id, false);
                setDeleteTarget(null);
              }}
            >
              Excluir apenas este
            </Button>
            <AlertDialogCancel className="w-full rounded-xl mt-0">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
