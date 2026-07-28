// ============================================================================
// CycleHistory (Histórico de Ciclos)
// Lista os ciclos menstruais já registrados pela usuária, mostrando data de
// início, duração do ciclo e do período, e destacando ciclos "atípicos" (muito
// diferentes da média). Permite excluir um ciclo da lista.
// ============================================================================
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { MenstrualCycle, MenstrualSettings } from '@/hooks/useMenstrualCycle';

interface Props {
  cycles: MenstrualCycle[];
  settings: MenstrualSettings | null;
  onDeleteCycle: (id: string) => Promise<void>;
}

// Componente principal. Recebe a lista de ciclos, as configurações e a função para excluir um ciclo.
export function CycleHistory({ cycles, settings, onDeleteCycle }: Props) {
  // Duração média do ciclo (padrão 28 dias), usada para comparar e detectar ciclos atípicos.
  const avgLength = settings?.average_cycle_length || 28;

  // Exclui um ciclo e mostra um aviso de confirmação na tela.
  const handleDelete = async (id: string) => {
    await onDeleteCycle(id);
    toast.success('Ciclo removido');
  };

  if (cycles.length === 0) {
    return (
      <div className="bg-card/70 backdrop-blur-xl rounded-2xl p-8 border border-border/40 text-center">
        <p className="text-muted-foreground text-sm">Nenhum ciclo registrado ainda.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Toque em "Menstruação começou" para iniciar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground px-1">
        Com mais registros, a previsão fica ainda melhor. 🌸
      </p>

      {cycles.map((cycle, i) => {
        // Calcula o quanto este ciclo se afastou da duração média (em dias).
        const deviation = cycle.cycle_length
          ? Math.abs(cycle.cycle_length - avgLength)
          : 0;

        return (
          <motion.div
            key={cycle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-card/70 backdrop-blur-xl rounded-2xl p-4 border transition-all ${
              cycle.is_atypical
                ? 'border-[hsl(30_70%_60%/0.4)]'
                : 'border-border/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-bold text-foreground text-sm">
                  {format(new Date(cycle.start_date), "dd 'de' MMMM yyyy", { locale: ptBR })}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {cycle.cycle_length && (
                    <span>{cycle.cycle_length} dias de ciclo</span>
                  )}
                  {cycle.end_date && (
                    <span>
                      {differenceInDays(new Date(cycle.end_date), new Date(cycle.start_date)) + 1} dias de período
                    </span>
                  )}
                  {!cycle.end_date && (
                    <span className="text-[hsl(340_60%_55%)] font-medium">Em andamento</span>
                  )}
                </div>
                {cycle.is_atypical && (
                  <div className="flex items-center gap-1 text-[11px] text-[hsl(30_70%_50%)]">
                    <AlertTriangle className="w-3 h-3" />
                    Ciclo atípico ({deviation > 0 ? `${deviation} dias de variação` : ''})
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(cycle.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
