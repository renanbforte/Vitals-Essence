// ============================================================================
// workout.ts  —  MÉTRICAS DE TREINO POR GPS
// ----------------------------------------------------------------------------
// Funções puras (sem GPS, sem tela) que transformam a lista de pontos do
// percurso nas métricas de uma atividade: distância, ritmo, splits por km,
// ganho de elevação, velocidade e estimativa de calorias. Por serem puras,
// são fáceis de testar e alimentam tanto a tela ao vivo quanto o resumo.
// ============================================================================

// Um ponto do percurso. `alt` (altitude em metros) é opcional — nem todo
// aparelho reporta, e quando falta a elevação simplesmente não é calculada.
export interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: number; // epoch em milissegundos
  alt?: number | null;
}

// Distância em metros entre dois pontos (fórmula de Haversine).
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distância total do percurso, em quilômetros.
export function totalDistanceKm(coords: TrackPoint[]): number {
  if (coords.length < 2) return 0;
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    m += haversineMeters(coords[i - 1].lat, coords[i - 1].lng, coords[i].lat, coords[i].lng);
  }
  return m / 1000;
}

// Tempo (h:mm:ss ou mm:ss) a partir de uma quantidade de segundos.
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// Ritmo (minutos por km) em texto mm:ss. `seconds` é o tempo para `km` km.
export function formatPace(km: number, seconds: number): string {
  if (km < 0.01 || seconds <= 0) return '--:--';
  const pace = seconds / 60 / km;
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  // 60s arredondado vira o minuto seguinte.
  if (sec === 60) return `${min + 1}:00`;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

// Velocidade média em km/h.
export function averageSpeedKmh(km: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return km / (seconds / 3600);
}

// Um split: um trecho de 1 km (ou o pedaço final, menor) com o tempo que levou.
export interface Split {
  index: number;    // 1, 2, 3...
  km: number;       // tamanho do trecho (1.0, ou menor no último parcial)
  seconds: number;  // tempo gasto no trecho
  partial: boolean; // true quando é o pedaço final com menos de 1 km
}

// Divide o percurso em trechos de 1 km e devolve o tempo de cada um, usando o
// timestamp dos pontos (interpola o instante exato em que cada km foi cruzado).
export function computeSplits(coords: TrackPoint[]): Split[] {
  if (coords.length < 2) return [];
  const splits: Split[] = [];
  let distAccum = 0;        // metros acumulados
  let lastSplitDist = 0;    // metros no último km fechado
  let lastSplitTime = coords[0].timestamp;

  for (let i = 1; i < coords.length; i++) {
    const segMeters = haversineMeters(coords[i - 1].lat, coords[i - 1].lng, coords[i].lat, coords[i].lng);
    const prevAccum = distAccum;
    distAccum += segMeters;

    // Pode cruzar mais de um km num segmento longo.
    while (distAccum >= lastSplitDist + 1000) {
      const targetDist = lastSplitDist + 1000;
      const frac = segMeters > 0 ? (targetDist - prevAccum) / segMeters : 0;
      const crossTime = coords[i - 1].timestamp + frac * (coords[i].timestamp - coords[i - 1].timestamp);
      splits.push({
        index: splits.length + 1,
        km: 1,
        seconds: (crossTime - lastSplitTime) / 1000,
        partial: false,
      });
      lastSplitTime = crossTime;
      lastSplitDist = targetDist;
    }
  }

  // Pedaço final (menos de 1 km), só se for relevante (> 50 m).
  const remainingMeters = distAccum - lastSplitDist;
  if (remainingMeters > 50) {
    const lastTime = coords[coords.length - 1].timestamp;
    splits.push({
      index: splits.length + 1,
      km: remainingMeters / 1000,
      seconds: (lastTime - lastSplitTime) / 1000,
      partial: true,
    });
  }
  return splits;
}

// Ganho de elevação acumulado (soma só das subidas), em metros. Ignora
// variações menores que 1 m, que normalmente são ruído do GPS.
export function elevationGain(coords: TrackPoint[]): number {
  let gain = 0;
  let lastAlt: number | null = null;
  for (const c of coords) {
    if (c.alt == null) continue;
    if (lastAlt !== null) {
      const diff = c.alt - lastAlt;
      if (diff > 1) gain += diff;
    }
    lastAlt = c.alt;
  }
  return gain;
}

// Série de elevação para o gráfico: distância acumulada (km) × altitude (m).
// Devolve vazio quando nenhum ponto tem altitude.
export function elevationSeries(coords: TrackPoint[]): { dist: number; alt: number }[] {
  if (!coords.some(c => c.alt != null)) return [];
  const series: { dist: number; alt: number }[] = [];
  let meters = 0;
  for (let i = 0; i < coords.length; i++) {
    if (i > 0) {
      meters += haversineMeters(coords[i - 1].lat, coords[i - 1].lng, coords[i].lat, coords[i].lng);
    }
    if (coords[i].alt != null) {
      series.push({ dist: meters / 1000, alt: coords[i].alt as number });
    }
  }
  return series;
}

// Estimativa de calorias gastas, por METs (depende do esforço/velocidade e do peso).
// Aproximação — serve para dar uma ordem de grandeza, não um número médico.
export function estimateCalories(
  workoutType: string,
  km: number,
  seconds: number,
  weightKg = 70,
): number {
  const hours = seconds / 3600;
  if (hours <= 0) return 0;
  const speed = km / hours; // km/h
  let met: number;
  if (workoutType === 'cycling') {
    met = speed < 16 ? 4 : speed < 20 ? 6 : speed < 25 ? 8 : speed < 30 ? 10 : 12;
  } else if (workoutType === 'walking') {
    met = speed < 4 ? 2.8 : speed < 5.5 ? 3.5 : 5;
  } else {
    // corrida
    met = speed < 8 ? 6 : speed < 9.7 ? 8.3 : speed < 11.3 ? 9.8 : speed < 12.9 ? 11 : speed < 14.5 ? 11.8 : 12.8;
  }
  return met * weightKg * hours;
}
