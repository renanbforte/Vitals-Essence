// ============================================================================
// ContraceptiveTracker (Rastreador de Anticoncepcional)
// Mostra os métodos anticoncepcionais cadastrados pela usuária (pílula, injeção
// etc.), avisa quando o método está perto de vencer, indica a fase da cartela e
// permite registrar a dose tomada no dia. Também abre um diálogo para adicionar
// um novo método.
// ============================================================================
import { useState } from 'react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Pill, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useContraceptive,
  METHOD_LABELS,
  METHOD_NEEDS_DAILY,
  type ContraceptiveStatus,
} from '@/hooks/useContraceptive';
import { ContraceptiveMethodDialog } from './ContraceptiveMethodDialog';
import { toast } from 'sonner';

// Rótulos e cores usados para mostrar a fase da cartela de pílula:
// "ativa" (tomando os comprimidos) ou "intervalo" (pausa entre cartelas).
const PHASE_LABEL = {
  active: { label: 'Fase ativa', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  break: { label: 'Intervalo / descanso', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
};

// Cartão de um único método anticoncepcional: mostra nome, avisos de validade,
// fase da cartela / próxima injeção e os botões para registrar a dose do dia.
function StatusCard({ status, onLog }: { status: ContraceptiveStatus; onLog: (id: string, taken: boolean) => void }) {
  // Dados já calculados do método (validade, fase da pílula, registro de hoje etc.).
  const { method, daysUntilRenewal, isExpiringSoon, nextInjectionDate, currentPillPhase, pillDayInCycle, todayLog } = status;
  // Controla se o cartão está expandido (mostrando o histórico dos últimos 7 dias).
  const [expanded, setExpanded] = useState(false);
  // Controla se o campo de horário para registrar a dose está visível.
  const [showTimeInput, setShowTimeInput] = useState(false);
  // Guarda o horário digitado pela usuária ao registrar a dose.
  const [timeValue, setTimeValue] = useState('');

  // Indica se este método exige acompanhamento diário (ex.: pílula tomada todo dia).
  const needsDaily = METHOD_NEEDS_DAILY.includes(method.method_type);

  return (
    <Card className={`border ${isExpiringSoon ? 'border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/10' : 'border-border/40 bg-card/70'} backdrop-blur-xl overflow-hidden`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{method.name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {METHOD_LABELS[method.method_type] || method.method_type}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Desde {format(parseISO(method.start_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expiring soon alert */}
        {isExpiringSoon && daysUntilRenewal !== null && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-100/60 dark:bg-amber-900/20 border border-amber-300/40 px-3 py-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {daysUntilRenewal <= 0
                ? '⚠️ Prazo vencido! Renove seu método.'
                : `Vence em ${daysUntilRenewal} dia${daysUntilRenewal !== 1 ? 's' : ''}. Lembre-se de renovar!`}
            </p>
          </div>
        )}

        {/* Pill phase */}
        {method.method_type === 'pill' && currentPillPhase && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${PHASE_LABEL[currentPillPhase].bg}`}>
            <Pill className={`w-4 h-4 flex-shrink-0 ${PHASE_LABEL[currentPillPhase].color}`} />
            <div>
              <p className={`text-xs font-medium ${PHASE_LABEL[currentPillPhase].color}`}>
                {PHASE_LABEL[currentPillPhase].label} — Dia {pillDayInCycle} do ciclo
              </p>
              {currentPillPhase === 'break' && (
                <p className="text-[11px] text-muted-foreground">Você está na pausa. Próxima cartela em breve.</p>
              )}
            </div>
          </div>
        )}

        {/* Next injection */}
        {method.method_type === 'injection' && nextInjectionDate && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/40 px-3 py-2">
            <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                Próxima injeção: {format(parseISO(nextInjectionDate), "dd 'de' MMM", { locale: ptBR })}
              </p>
              <p className="text-[11px] text-muted-foreground">
                em {differenceInDays(parseISO(nextInjectionDate), new Date())} dias
              </p>
            </div>
          </div>
        )}

        {/* End date info */}
        {method.end_date && !isExpiringSoon && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Válido até {format(parseISO(method.end_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
              {daysUntilRenewal !== null && ` · ${daysUntilRenewal} dias restantes`}
            </span>
          </div>
        )}

        {/* Daily check-in for pill */}
        {needsDaily && currentPillPhase !== 'break' && (
          <div className="pt-1">
            {todayLog?.taken ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40 px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Tomada hoje ✓</p>
                  {todayLog.taken_at && (
                    <p className="text-[11px] text-muted-foreground">às {todayLog.taken_at.slice(0, 5)}</p>
                  )}
                </div>
              </div>
            ) : todayLog?.skipped ? (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/40 px-3 py-2.5">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-red-600 dark:text-red-400">Não tomada hoje</p>
              </div>
            ) : (
              <div className="space-y-2">
                {showTimeInput ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-1 bg-muted/50 rounded-xl px-3 py-2 border border-border/40">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="time"
                        value={timeValue}
                        onChange={e => setTimeValue(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                        placeholder="Horário (opcional)"
                      />
                    </div>
                    <Button
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white text-xs px-3 h-9"
                      onClick={() => onLog(method.id, true)}
                    >
                      Confirmar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl h-9 text-xs border-[hsl(340_60%_55%/0.4)] text-[hsl(340_60%_45%)] hover:bg-[hsl(340_60%_55%/0.08)]"
                    onClick={() => setShowTimeInput(true)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Marcar como tomada hoje
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Injection check-in */}
        {method.method_type === 'injection' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-xl text-xs border-blue-300/40 text-blue-600 hover:bg-blue-50/50"
            onClick={() => onLog(method.id, true)}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Registrar aplicação de hoje
          </Button>
        )}

        {/* Expanded: last 7 days */}
        <AnimatePresence>
          {expanded && needsDaily && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-1 border-t border-border/30">
                <p className="text-[11px] text-muted-foreground mb-2 font-medium">Últimos 7 dias</p>
                <div className="flex gap-1.5">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = format(addDays(new Date(), -(6 - i)), 'yyyy-MM-dd');
                    const log = status.todayLog?.log_date === d
                      ? status.todayLog
                      : null;
                    const isToday = d === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <div key={d} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">{format(parseISO(d), 'EE', { locale: ptBR }).slice(0, 3)}</span>
                        <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs border ${
                          isToday ? 'border-primary/40' : 'border-border/30'
                        } ${log?.taken ? 'bg-emerald-100 dark:bg-emerald-950/40' : log?.skipped ? 'bg-red-100 dark:bg-red-950/30' : 'bg-muted/30'}`}>
                          {log?.taken ? '✓' : log?.skipped ? '✗' : '–'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Componente principal: lista todos os métodos ativos da usuária e o botão de adicionar.
export function ContraceptiveTracker() {
  // Busca no banco (Supabase) os métodos e seus status, além das funções para registrar/recarregar.
  const { statuses, loading, logToday, refetch } = useContraceptive();
  // Controla se o diálogo de adicionar um novo método está aberto.
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Registra a dose do dia para um método e mostra um aviso de confirmação na tela.
  const handleLog = async (methodId: string, taken: boolean) => {
    await logToday(methodId, { taken, taken_at: null });
    toast.success(taken ? 'Registrado! ✓' : 'Marcado como não tomada');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statuses.length === 0 ? (
        <Card className="border-dashed border-border/40 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[hsl(340_60%_55%/0.1)] flex items-center justify-center">
              <Pill className="w-5 h-5 text-[hsl(340_60%_55%)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Nenhum método cadastrado</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione seu anticoncepcional para acompanhar doses e validade</p>
            </div>
            <Button
              className="rounded-2xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white text-xs"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Adicionar método
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">
              {statuses.length} método{statuses.length !== 1 ? 's' : ''} ativo{statuses.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs rounded-xl text-[hsl(340_60%_55%)] hover:bg-[hsl(340_60%_55%/0.08)]"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-3">
            {statuses.map(status => (
              <StatusCard key={status.method.id} status={status} onLog={handleLog} />
            ))}
          </div>
        </>
      )}

      <ContraceptiveMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSaved={() => { setShowAddDialog(false); refetch(); }}
      />
    </div>
  );
}
