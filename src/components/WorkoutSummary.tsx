// ============================================================================
// WorkoutSummary — Resumo de um treino por GPS
// ----------------------------------------------------------------------------
// Mostra as métricas completas de um percurso: distância, tempo, ritmo médio,
// velocidade, ganho de elevação e calorias estimadas, mais os SPLITS por km
// (com barra de ritmo relativo) e um mini-gráfico de elevação. Usa as funções
// puras de lib/workout, então todo o cálculo é testado à parte.
// ============================================================================
import { useMemo } from 'react';
import { Timer, Ruler, Zap, Gauge, Mountain, Flame } from 'lucide-react';
import {
  totalDistanceKm, formatDuration, formatPace, averageSpeedKmh,
  computeSplits, elevationGain, elevationSeries, estimateCalories,
  type TrackPoint,
} from '@/lib/workout';

interface WorkoutSummaryProps {
  coordinates: TrackPoint[];
  durationSeconds: number;
  workoutType: string;
  weightKg?: number;   // peso do usuário, para estimar calorias (padrão 70 kg)
}

// Um bloco de métrica (ícone + valor + rótulo).
function Metric({ icon: Icon, value, unit, label }: { icon: React.ElementType; value: string; unit?: string; label: string }) {
  return (
    <div className="bg-[hsl(var(--health,262_83%_58%))]/5 rounded-xl p-3 text-center">
      <Icon className="w-4 h-4 text-[hsl(262_83%_58%)] mx-auto mb-1" />
      <p className="text-base font-extrabold text-foreground tabular-nums leading-none">
        {value}{unit && <span className="text-[11px] font-semibold text-muted-foreground ml-0.5">{unit}</span>}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export function WorkoutSummary({ coordinates, durationSeconds, workoutType, weightKg = 70 }: WorkoutSummaryProps) {
  // Todas as métricas, recalculadas quando os dados mudam.
  const m = useMemo(() => {
    const km = totalDistanceKm(coordinates);
    const splits = computeSplits(coordinates);
    const gain = elevationGain(coordinates);
    const elevation = elevationSeries(coordinates);
    return {
      km,
      splits,
      gain,
      elevation,
      speed: averageSpeedKmh(km, durationSeconds),
      calories: estimateCalories(workoutType, km, durationSeconds, weightKg),
      hasElevation: elevation.length > 1,
    };
  }, [coordinates, durationSeconds, workoutType, weightKg]);

  // Ritmo do split mais rápido (menor s/km), para escalar as barras.
  const fastestPaceSecPerKm = useMemo(() => {
    const paces = m.splits.filter(s => !s.partial).map(s => s.seconds / s.km);
    return paces.length ? Math.min(...paces) : 0;
  }, [m.splits]);

  return (
    <div className="space-y-4">
      {/* Grade de métricas principais */}
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={Ruler} value={m.km.toFixed(2)} unit="km" label="Distância" />
        <Metric icon={Timer} value={formatDuration(durationSeconds)} label="Tempo" />
        <Metric icon={Zap} value={formatPace(m.km, durationSeconds)} unit="/km" label="Ritmo méd." />
        <Metric icon={Gauge} value={m.speed.toFixed(1)} unit="km/h" label="Velocidade" />
        <Metric icon={Mountain} value={Math.round(m.gain).toString()} unit="m" label="Elevação" />
        <Metric icon={Flame} value={Math.round(m.calories).toString()} unit="kcal" label="Calorias" />
      </div>

      {/* Gráfico de elevação (só quando há altitude) */}
      {m.hasElevation && (
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Mountain className="w-3 h-3" /> Elevação
          </p>
          <ElevationChart data={m.elevation} />
        </div>
      )}

      {/* Splits por km (parciais de corrida estilo Strava) */}
      {m.splits.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Parciais por km</p>
          <div className="space-y-1">
            {m.splits.map(s => {
              const paceSec = s.seconds / s.km;
              // Barra proporcional: o split mais rápido ocupa ~100%.
              const widthPct = fastestPaceSecPerKm > 0 ? Math.max(20, (fastestPaceSecPerKm / paceSec) * 100) : 100;
              return (
                <div key={s.index} className="flex items-center gap-2 text-xs">
                  <span className="w-8 text-muted-foreground tabular-nums shrink-0">
                    {s.partial ? `${s.km.toFixed(2)}` : `${s.index}`}
                  </span>
                  <div className="flex-1 h-5 rounded-md bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-md bg-[hsl(262_83%_58%)]/70 flex items-center justify-end pr-2"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[10px] font-bold text-white tabular-nums">
                        {formatPace(s.km, s.seconds)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-muted-foreground/60 mt-1">Barra maior = ritmo mais rápido. "/km" em min.</p>
        </div>
      )}
    </div>
  );
}

// Mini-gráfico de elevação: área simples desenhada em SVG (distância × altitude).
function ElevationChart({ data }: { data: { dist: number; alt: number }[] }) {
  const W = 300, H = 60, pad = 2;
  const alts = data.map(d => d.alt);
  const minA = Math.min(...alts), maxA = Math.max(...alts);
  const rangeA = maxA - minA || 1;
  const maxD = data[data.length - 1].dist || 1;

  const pts = data.map(d => {
    const x = pad + (d.dist / maxD) * (W - pad * 2);
    const y = H - pad - ((d.alt - minA) / rangeA) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPath = `M ${pad},${H - pad} L ${pts.join(' L ')} L ${W - pad},${H - pad} Z`;
  const linePath = `M ${pts.join(' L ')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
      <path d={areaPath} fill="hsl(262 83% 58% / 0.15)" />
      <path d={linePath} fill="none" stroke="hsl(262 83% 58%)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
