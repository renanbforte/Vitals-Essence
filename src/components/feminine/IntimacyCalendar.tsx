import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IntimacyLog } from '@/hooks/useIntimacyLogs';

interface Props {
  logs: IntimacyLog[];
  onDayPress: (date: Date) => void;
}

export function IntimacyCalendar({ logs, onDayPress }: Props) {
  const [month, setMonth] = useState(new Date());

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const firstDow = (getDay(startOfMonth(month)) + 6) % 7; // Mon=0

  const logsOnDay = (day: Date) => logs.filter(l => isSameDay(new Date(l.log_date + 'T12:00'), day));

  return (
    <div className="rounded-2xl bg-card border border-border/30 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold capitalize text-foreground">
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(day => {
          const dayLogs = logsOnDay(day);
          const hasLogs = dayLogs.length > 0;
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayPress(day)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                hasLogs
                  ? 'bg-[hsl(340_60%_55%/0.15)] border border-[hsl(340_60%_55%/0.4)]'
                  : today
                  ? 'border border-border bg-muted/40'
                  : 'hover:bg-muted/40'
              }`}
            >
              <span className={`text-xs font-medium leading-none ${today ? 'text-primary font-bold' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>
              {hasLogs && (
                <Heart className="w-2.5 h-2.5 fill-[hsl(340_60%_55%)] text-[hsl(340_60%_55%)]" />
              )}
              {dayLogs.length > 1 && (
                <span className="text-[8px] text-[hsl(340_60%_55%)] font-semibold leading-none">{dayLogs.length}x</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add today button */}
      <Button
        onClick={() => onDayPress(new Date())}
        className="w-full mt-4 h-10 rounded-xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold text-sm"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Registrar hoje
      </Button>
    </div>
  );
}
