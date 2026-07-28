import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  return (
    <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-2 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-xl"
        onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
      >
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <p className="font-bold text-sm capitalize">
        {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
      </p>
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
