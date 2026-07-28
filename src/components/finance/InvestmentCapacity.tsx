import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp } from 'lucide-react';

interface InvestmentCapacityProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalInvested: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InvestmentCapacity({ monthlyIncome, monthlyExpenses, totalInvested }: InvestmentCapacityProps) {
  const available = useMemo(() => Math.max(0, monthlyIncome - monthlyExpenses), [monthlyIncome, monthlyExpenses]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--finance))]" />
            <p className="text-xs text-muted-foreground font-medium">Patrimônio</p>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--finance))] tabular-nums">
            {formatCurrency(totalInvested)}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-[hsl(var(--finance))]" />
            <p className="text-xs text-muted-foreground font-medium">Disponível p/ investir</p>
          </div>
          <p className={`text-xl font-bold tabular-nums ${available > 0 ? 'text-[hsl(var(--finance))]' : 'text-muted-foreground'}`}>
            {monthlyIncome > 0 ? formatCurrency(available) : '—'}
          </p>
          {monthlyIncome > 0 && available > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {((available / monthlyIncome) * 100).toFixed(0)}% da renda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
