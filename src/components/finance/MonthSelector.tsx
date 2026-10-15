// ============================================================================
// SELETOR DE MÊS
// Barra de navegação que mostra o mês/ano selecionado (ex: "julho de 2026")
// com uma seta para voltar e outra para avançar de mês. Usada nas telas de
// finanças para escolher qual período o usuário está visualizando.
// ============================================================================

import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dados que este componente recebe de fora:
// - selectedMonth: o mês atualmente escolhido
// - onMonthChange: função avisada sempre que o usuário troca de mês
interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-2 shadow-sm">
      {/* Botão da esquerda: volta um mês (mês anterior) */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl"
        onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      {/* Nome do mês e ano no centro, escrito por extenso em português */}
      <p className="font-bold text-sm capitalize">
        {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      </p>
      {/* Botão da direita: avança um mês (próximo mês) */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl"
        onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
      >
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
