// ============================================================================
// workout.test.ts  —  TESTES DAS MÉTRICAS DE TREINO
// ----------------------------------------------------------------------------
// Garante que distância, ritmo, splits por km, elevação e calorias são
// calculados corretamente a partir dos pontos do percurso.
// ============================================================================
import { describe, it, expect } from 'vitest';
import {
  haversineMeters,
  totalDistanceKm,
  formatDuration,
  formatPace,
  averageSpeedKmh,
  computeSplits,
  elevationGain,
  elevationSeries,
  estimateCalories,
  type TrackPoint,
} from '@/lib/workout';

// Metros por grau de latitude NA MESMA esfera que o haversine usa (R = 6.371.000 m),
// para que os trechos gerados meçam exatamente o esperado.
const METERS_PER_DEG = 6_371_000 * Math.PI / 180;

// Gera um percurso reto de `count` pontos ao longo da latitude, com `metersPerStep`
// metros entre pontos e `secPerStep` segundos entre eles.
function straightTrack(count: number, metersPerStep: number, secPerStep: number, startAlt?: number, altStep = 0): TrackPoint[] {
  const degPerStep = metersPerStep / METERS_PER_DEG;
  const pts: TrackPoint[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({
      lat: -23 + i * degPerStep,
      lng: -46,
      timestamp: i * secPerStep * 1000,
      alt: startAlt != null ? startAlt + i * altStep : undefined,
    });
  }
  return pts;
}

describe('haversineMeters / totalDistanceKm', () => {
  it('mede ~111m para 0,001° de latitude', () => {
    expect(haversineMeters(-23, -46, -23.001, -46)).toBeCloseTo(111.3, 0);
  });
  it('soma a distância total em km', () => {
    const track = straightTrack(11, 100, 30); // 10 trechos de 100m = 1km
    expect(totalDistanceKm(track)).toBeCloseTo(1.0, 2);
  });
  it('percurso com menos de 2 pontos tem distância zero', () => {
    expect(totalDistanceKm([])).toBe(0);
    expect(totalDistanceKm([{ lat: 0, lng: 0, timestamp: 0 }])).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formata mm:ss e h:mm:ss', () => {
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(0)).toBe('00:00');
  });
});

describe('formatPace', () => {
  it('5 min para 1 km = 5:00 min/km', () => {
    expect(formatPace(1, 300)).toBe('5:00');
  });
  it('nunca produz segundos :60 (vira o minuto seguinte)', () => {
    expect(formatPace(1, 360)).toBe('6:00');
    expect(formatPace(1, 359.9)).toBe('6:00');
  });
  it('distância ínfima retorna --:--', () => {
    expect(formatPace(0, 100)).toBe('--:--');
  });
});

describe('averageSpeedKmh', () => {
  it('10 km em 30 min = 20 km/h', () => {
    expect(averageSpeedKmh(10, 1800)).toBeCloseTo(20, 5);
  });
});

describe('computeSplits', () => {
  it('3 km a 100m/30s gera 3 splits de 1 km, cada um ~300s', () => {
    const track = straightTrack(31, 100, 30); // 30 trechos de 100m = 3km; 30s cada = 300s/km
    const splits = computeSplits(track);
    expect(splits).toHaveLength(3);
    for (const s of splits) {
      expect(s.km).toBeCloseTo(1, 6);
      expect(s.partial).toBe(false);
      expect(s.seconds).toBeCloseTo(300, 0);
    }
    expect(splits[2].index).toBe(3);
  });

  it('inclui o pedaço final parcial quando sobra mais de 50m', () => {
    const track = straightTrack(16, 100, 30); // 1,5 km
    const splits = computeSplits(track);
    expect(splits).toHaveLength(2);
    expect(splits[0].partial).toBe(false);
    expect(splits[1].partial).toBe(true);
    expect(splits[1].km).toBeCloseTo(0.5, 2);
  });

  it('percurso curto (< 50m sobrando) não cria split parcial', () => {
    const track = straightTrack(11, 100, 30); // exatamente 1 km
    const splits = computeSplits(track);
    expect(splits).toHaveLength(1);
    expect(splits[0].partial).toBe(false);
  });
});

describe('elevationGain / elevationSeries', () => {
  it('soma só as subidas, ignorando ruído < 1m', () => {
    const coords: TrackPoint[] = [
      { lat: 0, lng: 0, timestamp: 0, alt: 100 },
      { lat: 0.001, lng: 0, timestamp: 1000, alt: 110 }, // +10
      { lat: 0.002, lng: 0, timestamp: 2000, alt: 105 }, // -5 (ignora)
      { lat: 0.003, lng: 0, timestamp: 3000, alt: 105.5 }, // +0,5 (ruído, ignora)
      { lat: 0.004, lng: 0, timestamp: 4000, alt: 120 }, // +14,5
    ];
    expect(elevationGain(coords)).toBeCloseTo(24.5, 5);
  });

  it('sem altitude, ganho é zero e série vazia', () => {
    const track = straightTrack(5, 100, 30);
    expect(elevationGain(track)).toBe(0);
    expect(elevationSeries(track)).toEqual([]);
  });

  it('série de elevação acompanha distância e altitude', () => {
    const track = straightTrack(11, 100, 30, 100, 2); // sobe 2m por ponto
    const series = elevationSeries(track);
    expect(series).toHaveLength(11);
    expect(series[0]).toEqual({ dist: 0, alt: 100 });
    expect(series[10].alt).toBe(120);
    expect(series[10].dist).toBeCloseTo(1, 2);
  });
});

describe('estimateCalories', () => {
  it('corrida de 10 km em 1 h a 70 kg dá algumas centenas de kcal', () => {
    const cal = estimateCalories('running', 10, 3600, 70);
    expect(cal).toBeGreaterThan(400);
    expect(cal).toBeLessThan(900);
  });
  it('pedalar na mesma velocidade gasta menos que correr', () => {
    const run = estimateCalories('running', 10, 3600, 70);
    const bike = estimateCalories('cycling', 10, 3600, 70);
    expect(bike).toBeLessThan(run);
  });
  it('tempo zero não gera calorias', () => {
    expect(estimateCalories('running', 5, 0)).toBe(0);
  });
});
