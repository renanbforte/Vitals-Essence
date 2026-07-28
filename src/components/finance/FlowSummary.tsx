import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface FlowSummaryProps {
  income: number;
  expense: number;
  balance: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function FlowSummary({ income, expense, balance }: FlowSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="bg-emerald-500/10 border-emerald-500/20">
        <CardContent className="p-3 text-center">
          <ArrowDownLeft className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground font-medium">Entradas</p>
          <p className="text-[clamp(0.65rem,2.8vw,0.875rem)] font-bold text-emerald-600 tabular-nums truncate">{formatCurrency(income)}</p>
        </CardContent>
      </Card>
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-3 text-center">
          <ArrowUpRight className="w-4 h-4 text-red-500 mx-auto mb-1" />
          <p className="text-[10px] text-muted-foreground font-medium">Saídas</p>
          <p className="text-[clamp(0.65rem,2.8vw,0.875rem)] font-bold text-red-500 tabular-nums truncate">{formatCurrency(expense)}</p>
        </CardContent>
      </Card>
      <Card className={`${balance >= 0 ? 'bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20' : 'bg-red-500/10 border-red-500/20'}`}>
        <CardContent className="p-3 text-center">
          <Scale className={`w-4 h-4 mx-auto mb-1 ${balance >= 0 ? 'text-[hsl(var(--finance))]' : 'text-red-500'}`} />
          <p className="text-[10px] text-muted-foreground font-medium">Saldo</p>
          <p className={`text-[clamp(0.65rem,2.8vw,0.875rem)] font-bold tabular-nums truncate ${balance >= 0 ? 'text-[hsl(var(--finance))]' : 'text-red-500'}`}>
            {formatCurrency(balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
