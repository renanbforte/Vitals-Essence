import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDays, subDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const today = new Date();
  const isSelectedToday = isToday(selectedDate);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const goToPreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (nextDay <= today) onDateChange(nextDay);
  };
  const goToToday = () => onDateChange(today);
  const handleDateSelect = (date: Date | undefined) => {
    if (date && date <= today) { onDateChange(date); setCalendarOpen(false); }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-3 shadow-sm flex items-center justify-between gap-2">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer text-left min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(262,83%,58%)] to-[hsl(280,72%,40%)] flex items-center justify-center shrink-0 shadow-md">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {isSelectedToday ? 'Hoje' : 'Data'}
              </p>
              <p className="text-sm font-bold text-foreground capitalize truncate">
                {format(selectedDate, "EEE, d 'de' MMM", { locale: ptBR })}
              </p>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date > today}
            defaultMonth={selectedDate}
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
            captionLayout="dropdown-buttons"
            fromYear={2020}
            toYear={today.getFullYear()}
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-9 w-9 rounded-xl hover:bg-primary/10">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={goToNextDay} disabled={isSelectedToday} className="h-9 w-9 rounded-xl hover:bg-primary/10">
          <ChevronRight className="w-4 h-4" />
        </Button>
        {!isSelectedToday && (
          <Button variant="default" size="sm" onClick={goToToday} className="ml-1 rounded-xl text-xs gradient-hub text-white border-0 shadow-md">
            Hoje
          </Button>
        )}
      </div>
    </div>
  );
}
