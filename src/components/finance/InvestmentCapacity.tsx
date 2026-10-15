// ============================================================================
// CAPACIDADE DE INVESTIMENTO
// Mostra dois cartões lado a lado: o "Patrimônio" (total já investido) e o
// "Disponível p/ investir" (quanto sobra da renda depois de pagar as despesas
// do mês). Também exibe qual porcentagem da renda esse valor livre representa.
// ============================================================================

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp } from 'lucide-react';

// Dados que este componente recebe de fora:
// - monthlyIncome: renda do mês
// - monthlyExpenses: despesas do mês
// - totalInvested: total de dinheiro já investido (patrimônio)
interface InvestmentCapacityProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalInvested: number;
}

// Formata um número como dinheiro em Real brasileiro (ex: R$ 1.234,56)
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function InvestmentCapacity({ monthlyIncome, monthlyExpenses, totalInvested }: InvestmentCapacityProps) {
  // Calcula quanto sobra para investir (renda menos despesas), nunca deixando
  // ficar negativo. Só recalcula quando a renda ou as despesas mudam.
  const available = useMemo(() => Math.max(0, monthlyIncome - monthlyExpenses), [monthlyIncome, monthlyExpenses]);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Cartão 1: Patrimônio - total de dinheiro já investido */}
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
      {/* Cartão 2: Disponível p/ investir - quanto sobra da renda no mês */}
      <Card className="bg-[hsl(var(--finance-light))] border-[hsl(var(--finance))]/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-[hsl(var(--finance))]" />
            <p className="text-xs text-muted-foreground font-medium">Disponível p/ investir</p>
          </div>
          {/* Se houver renda, mostra o valor disponível; senão, um traço "—" */}
          <p className={`text-xl font-bold tabular-nums ${available > 0 ? 'text-[hsl(var(--finance))]' : 'text-muted-foreground'}`}>
            {monthlyIncome > 0 ? formatCurrency(available) : '—'}
          </p>
          {/* Só aparece se houver renda e sobra: mostra o % da renda que sobrou */}
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
