import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Heart, TrendingUp, Smile, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IntimacyLog } from '@/hooks/useIntimacyLogs';

interface Props {
  logs: IntimacyLog[];
  insights: { totalLogs: number; avgSatisfaction: number; avgPleasure: number; logsThisMonth: number };
  onDelete: (id: string) => void;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/30 p-3.5 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center`} style={{ background: color + '22' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export function IntimacyInsights({ logs, insights, onDelete }: Props) {
  const recent = logs.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          label="Este mês"
          value={`${insights.logsThisMonth}x`}
          color="hsl(340 60% 55%)"
        />
        <StatCard
          icon={<Heart className="w-4 h-4" />}
          label="Total registrado"
          value={`${insights.totalLogs}x`}
          color="hsl(280 60% 55%)"
        />
        <StatCard
          icon={<Smile className="w-4 h-4" />}
          label="Satisfação média"
          value={insights.avgSatisfaction ? `${insights.avgSatisfaction}/10` : '—'}
          color="hsl(40 80% 50%)"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Prazer médio"
          value={insights.avgPleasure ? `${insights.avgPleasure}/10` : '—'}
          color="hsl(120 50% 45%)"
        />
      </div>

      {/* Recent logs */}
      {recent.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico recente</p>
          </div>
          <div className="divide-y divide-border/10">
            {recent.map(log => (
              <div key={log.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-foreground capitalize">
                      {format(new Date(log.log_date + 'T12:00'), "d 'de' MMM", { locale: ptBR })}
                    </span>
                    {log.duration_minutes && (
                      <span className="text-[10px] bg-muted rounded-md px-1.5 py-0.5 text-muted-foreground">{log.duration_minutes}min</span>
                    )}
                    {log.protection_used && (
                      <span className="text-[10px] bg-green-500/10 text-green-600 rounded-md px-1.5 py-0.5 font-medium">Protegido</span>
                    )}
                  </div>

                  {log.activity_type?.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{log.activity_type.join(', ')}</p>
                  )}

                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {log.satisfaction !== undefined && log.satisfaction !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        Satisfação <span className="text-foreground font-semibold">{log.satisfaction}/10</span>
                      </span>
                    )}
                    {log.pleasure !== undefined && log.pleasure !== null && (
                      <span className="text-[10px] text-muted-foreground">
                        Prazer <span className="text-foreground font-semibold">{log.pleasure}/10</span>
                      </span>
                    )}
                    {log.mood && (
                      <span className="text-[10px] text-muted-foreground">{log.mood}</span>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-[10px] text-muted-foreground mt-1 italic truncate">"{log.notes}"</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onDelete(log.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <div className="rounded-2xl bg-card border border-border/30 p-8 flex flex-col items-center gap-3 text-center">
          <Heart className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum registro ainda</p>
          <p className="text-xs text-muted-foreground/70">Use o calendário para registrar suas relações de forma privada e segura</p>
        </div>
      )}
    </div>
  );
}
