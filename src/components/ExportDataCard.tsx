import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Download, CalendarDays, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';


interface DateRange {
  from: Date;
  to: Date;
}

export function ExportDataCard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para exportar');
      return;
    }

    setExporting(true);

    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      // Fetch tracking data
      const { data: trackingData, error: trackingError } = await supabase
        .from('daily_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (trackingError) throw trackingError;

      // Fetch weight data
      const { data: weightData, error: weightError } = await supabase
        .from('weight_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (weightError) throw weightError;

      // Create a map for quick lookup
      const trackingMap = new Map<string, typeof trackingData[number]>();
      (trackingData || []).forEach((t) => {
        trackingMap.set(t.date, t);
      });

      const weightMap = new Map<string, number>();
      (weightData || []).forEach((w: { date: string; weight_kg: number }) => {
        weightMap.set(w.date, w.weight_kg);
      });

      // Generate all days in the range
      const allDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

      // Create CSV content
      const headers = [
        'Data',
        'Hidratação (L)',
        'Café da Manhã',
        'Lanche Manhã',
        'Almoço',
        'Lanche Tarde',
        'Jantar',
        'Ceia',
        'Total Refeições',
        'Treino Realizado',
        'Tipo de Treino',
        'Observações Treino',
        'Peso (kg)',
      ];

      const rows = allDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const tracking = trackingMap.get(dateStr);
        const weight = weightMap.get(dateStr);

        const mealsCompleted = tracking ? [
          tracking.breakfast_completed,
          tracking.morning_snack_completed,
          tracking.lunch_completed,
          tracking.afternoon_snack_completed,
          tracking.dinner_completed,
          tracking.night_snack_completed,
        ].filter(Boolean).length : 0;

        return [
          format(day, 'dd/MM/yyyy', { locale: ptBR }),
          tracking ? (tracking.water_ml / 1000).toFixed(1) : '0',
          tracking?.breakfast_completed ? 'Sim' : 'Não',
          tracking?.morning_snack_completed ? 'Sim' : 'Não',
          tracking?.lunch_completed ? 'Sim' : 'Não',
          tracking?.afternoon_snack_completed ? 'Sim' : 'Não',
          tracking?.dinner_completed ? 'Sim' : 'Não',
          tracking?.night_snack_completed ? 'Sim' : 'Não',
          `${mealsCompleted}/6`,
          tracking?.workout_completed ? 'Sim' : 'Não',
          tracking?.workout_type || '-',
          tracking?.workout_notes || '-',
          weight ? weight.toString() : '-',
        ];
      });

      // Convert to CSV
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
      ].join('\n');

      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progresso_${format(dateRange.from, 'dd-MM-yyyy')}_a_${format(dateRange.to, 'dd-MM-yyyy')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Planilha exportada com sucesso!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          Exportar Dados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Exporte seus registros de hidratação, refeições, treinos e peso em formato de planilha.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* From Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Data inicial</label>
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => {
                    if (date) {
                      setDateRange(prev => ({ ...prev, from: date }));
                      setFromOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date() || date > dateRange.to}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Data final</label>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => {
                    if (date) {
                      setDateRange(prev => ({ ...prev, to: date }));
                      setToOpen(false);
                    }
                  }}
                  disabled={(date) => date > new Date() || date < dateRange.from}
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quick period buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
          >
            Última semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
          >
            Último mês
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
          >
            Últimos 3 meses
          </Button>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={exporting}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {exporting ? 'Exportando...' : 'Exportar Planilha (.csv)'}
        </Button>
      </CardContent>
    </Card>
  );
}
