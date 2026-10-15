// ============================================================================
// FlowSummary (Resumo de Fluxo)
// Mostra tres cartoes lado a lado com o resumo financeiro de um periodo:
// Entradas (receitas), Saidas (despesas) e Saldo (entradas menos saidas).
// O cartao de saldo fica verde quando positivo e vermelho quando negativo.
// ============================================================================
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { formatCurrency } from '@/lib/finance';

interface FlowSummaryProps {
  income: number;
  expense: number;
  balance: number;
}

// Um cartao do resumo: icone em badge circular, rotulo e valor.
function SummaryTile({ icon: Icon, label, value, tone }: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: 'income' | 'expense' | 'finance';
}) {
  // Classes de cor por tom (entrada = esmeralda, saida = vermelho, saldo = verde do modulo).
  const palette = {
    income: { card: 'bg-emerald-500/10 border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-600', text: 'text-emerald-600' },
    expense: { card: 'bg-red-500/10 border-red-500/20', badge: 'bg-red-500/15 text-red-500', text: 'text-red-500' },
    finance: { card: 'bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20', badge: 'bg-[hsl(var(--finance))]/15 text-[hsl(var(--finance))]', text: 'text-[hsl(var(--finance))]' },
  }[tone];

  return (
    <div className={`rounded-2xl border p-3 ${palette.card}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${palette.badge}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
      <p className={`text-[clamp(0.7rem,2.8vw,0.95rem)] font-extrabold tabular-nums truncate ${palette.text}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

// Componente que desenha os tres cartoes de resumo (Entradas, Saidas e Saldo).
export function FlowSummary({ income, expense, balance }: FlowSummaryProps) {
  const balancePositive = balance >= 0;
  return (
    <div className="grid grid-cols-3 gap-2">
      <SummaryTile icon={ArrowDownLeft} label="Entradas" value={income} tone="income" />
      <SummaryTile icon={ArrowUpRight} label="Saídas" value={expense} tone="expense" />
      <SummaryTile icon={Scale} label="Saldo" value={balance} tone={balancePositive ? 'finance' : 'expense'} />
    </div>
  );
}
