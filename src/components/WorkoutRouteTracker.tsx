import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Play, Square, Navigation, Trash2, Timer, Ruler, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Coordinate, WorkoutRoute } from '@/hooks/useWorkoutRoutes';

export interface ExtendedCoordinate extends Coordinate {
  accuracy?: number;
  altitude?: number | null;
  speed?: number | null;
}

const STORAGE_KEY = 'workout_gps_session';
const MAX_ACCURACY_METERS = 50;
const MIN_DISTANCE_METERS = 3;
const SAVE_INTERVAL = 5;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

interface WorkoutRouteTrackerProps {
  workoutType: 'running' | 'cycling';
  onSaveRoute: (
    workoutType: string,
    distanceKm: number,
    durationSeconds: number,
    coordinates: Coordinate[],
    startedAt: Date,
    finishedAt: Date,
  ) => Promise<{ error: Error | null; data: WorkoutRoute | null }>;
  savedRoutes: WorkoutRoute[];
  onDeleteRoute: (id: string) => void;
  onFetchRoutes: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPace(distanceKm: number, seconds: number): string {
  if (distanceKm < 0.01) return '--:--';
  const pace = seconds / 60 / distanceKm;
  const paceMin = Math.floor(pace);
  const paceSec = Math.round((pace - paceMin) * 60);
  return `${paceMin}:${String(paceSec).padStart(2, '0')}`;
}

function calculateDistance(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const R = 6371;
    const dLat = ((coords[i].lat - coords[i - 1].lat) * Math.PI) / 180;
    const dLon = ((coords[i].lng - coords[i - 1].lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((coords[i - 1].lat * Math.PI) / 180) *
        Math.cos((coords[i].lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

function RouteMap({ coordinates, id }: { coordinates: Coordinate[]; id: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || coordinates.length === 0) return;

    const initMap = async () => {
      if (!L) {
        L = await import('leaflet');
        // Fix default icon paths
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const latLngs = coordinates.map(c => [c.lat, c.lng] as [number, number]);

      // Route line
      L.polyline(latLngs, { color: '#6d28d9', weight: 4, opacity: 0.85 }).addTo(map);

      // Start marker
      const startIcon = L.divIcon({
        html: '<div style="background:#22c55e;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(latLngs[0], { icon: startIcon }).addTo(map).bindPopup('Início');

      // End marker
      const endIcon = L.divIcon({
        html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map).bindPopup('Fim');

      map.fitBounds(latLngs, { padding: [20, 20] });
    };

    initMap();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [coordinates, id]);

  // Add Leaflet CSS once
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  return <div ref={mapRef} style={{ height: 220, width: '100%', borderRadius: 12 }} />;
}

function LiveMap({ coordinates }: { coordinates: Coordinate[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const polylineRef = useRef<import('leaflet').Polyline | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      if (!L) {
        L = await import('leaflet');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false });
        mapInstanceRef.current = map;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);
        polylineRef.current = L.polyline([], { color: '#6d28d9', weight: 4, opacity: 0.85 }).addTo(map);
      }

      if (coordinates.length > 0) {
        const latLngs = coordinates.map(c => [c.lat, c.lng] as [number, number]);
        polylineRef.current?.setLatLngs(latLngs);

        const last = latLngs[latLngs.length - 1];
        if (!markerRef.current) {
          const pulseIcon = L!.divIcon({
            html: '<div style="background:#6d28d9;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(109,40,217,0.3)"></div>',
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          markerRef.current = L!.marker(last, { icon: pulseIcon }).addTo(mapInstanceRef.current!);
        } else {
          markerRef.current.setLatLng(last);
        }
        mapInstanceRef.current!.setView(last, 16);
      }
    };

    initMap();
  }, [coordinates]);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapRef} style={{ height: 240, width: '100%', borderRadius: 12 }} />;
}

export function WorkoutRouteTracker({ workoutType, onSaveRoute, savedRoutes, onDeleteRoute, onFetchRoutes }: WorkoutRouteTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [_isPaused, setIsPaused] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [pointsReceived, setPointsReceived] = useState(0);
  const [pointsAccepted, setPointsAccepted] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordsRef = useRef<Coordinate[]>([]);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastSaveRef = useRef(0);

  const label = workoutType === 'running' ? 'Corrida' : 'Pedal';
  const icon = workoutType === 'running' ? '🏃' : '🚴';

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopWatch = () => {
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
  };

  const releaseWakeLock = async () => {
    try { await wakeLockRef.current?.release(); } catch { /* ignore */ }
    wakeLockRef.current = null;
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current?.addEventListener('release', () => {
          // re-acquire on visibility change
        });
      }
    } catch { /* Wake Lock not available */ }
  };

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && isTracking && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isTracking]);

  const persistSession = useCallback((coords: Coordinate[], started: Date, elapsed: number) => {
    const now = Date.now();
    // Throttle localStorage writes to every SAVE_INTERVAL seconds
    if (now - lastSaveRef.current < SAVE_INTERVAL * 1000) return;
    lastSaveRef.current = now;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workoutType,
      startedAt: started.toISOString(),
      elapsedSeconds: elapsed,
      coordinates: coords,
    }));
  }, [workoutType]);

  const forcePersistSession = useCallback((coords: Coordinate[], started: Date, elapsed: number) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workoutType,
      startedAt: started.toISOString(),
      elapsedSeconds: elapsed,
      coordinates: coords,
    }));
  }, [workoutType]);

  const clearSession = () => localStorage.removeItem(STORAGE_KEY);

  const shouldAcceptPoint = (pos: GeolocationPosition, prevCoords: Coordinate[]): boolean => {
    // Reject points with poor accuracy
    if (pos.coords.accuracy > MAX_ACCURACY_METERS) return false;

    // Always accept first point
    if (prevCoords.length === 0) return true;

    // Check minimum distance from last accepted point
    const last = prevCoords[prevCoords.length - 1];
    const dist = haversineDistance(last.lat, last.lng, pos.coords.latitude, pos.coords.longitude);

    // Reject if too close (noise), but accept if accuracy is very good (<10m) even if close
    if (dist < MIN_DISTANCE_METERS && pos.coords.accuracy > 10) return false;

    // Reject impossible jumps (speed > 150 km/h for cycling, > 50 km/h for running)
    const maxSpeedMs = workoutType === 'cycling' ? 41.7 : 13.9;
    const timeDiff = (pos.timestamp - last.timestamp) / 1000;
    if (timeDiff > 0 && dist / timeDiff > maxSpeedMs) return false;

    return true;
  };

  const handlePosition = useCallback((pos: GeolocationPosition, startTime: Date, currentElapsed: number) => {
    setPointsReceived(p => p + 1);

    if (!shouldAcceptPoint(pos, coordsRef.current)) return;

    const coord: Coordinate = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      timestamp: pos.timestamp,
    };
    coordsRef.current = [...coordsRef.current, coord];
    setCoordinates([...coordsRef.current]);
    setDistance(calculateDistance(coordsRef.current));
    setPointsAccepted(p => p + 1);
    persistSession(coordsRef.current, startTime, currentElapsed);
  }, [persistSession, workoutType]);

  const startGpsWatch = useCallback((startTime: Date, elapsedRef: { value: number }) => {
    return navigator.geolocation.watchPosition(
      (pos) => handlePosition(pos, startTime, elapsedRef.value),
      (err) => {
        if (err.code === 1) {
          setPermissionDenied(true);
          toast.error('Permissão de localização negada. Ative o GPS nas configurações do dispositivo.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, // Always get fresh position, never use cached
        timeout: 15000,
      },
    );
  }, [handlePosition]);

  const resumeTracking = useCallback((startTime: Date, initialElapsed: number, initialCoords: Coordinate[]) => {
    setStartedAt(startTime);
    setElapsedSeconds(initialElapsed);
    setCoordinates(initialCoords);
    coordsRef.current = initialCoords;
    setDistance(calculateDistance(initialCoords));
    setIsTracking(true);
    setIsPaused(false);
    requestWakeLock();

    const elapsedRef = { value: initialElapsed };
    watchIdRef.current = startGpsWatch(startTime, elapsedRef);

    timerRef.current = setInterval(() => {
      elapsedRef.value += 1;
      setElapsedSeconds(elapsedRef.value);
    }, 1000);
  }, [startGpsWatch]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada neste dispositivo');
      return;
    }

    setPermissionDenied(false);
    const now = new Date();
    setStartedAt(now);
    setCoordinates([]);
    coordsRef.current = [];
    setElapsedSeconds(0);
    setDistance(0);
    setPointsReceived(0);
    setPointsAccepted(0);
    setIsTracking(true);
    setIsPaused(false);
    requestWakeLock();

    const elapsedRef = { value: 0 };
    watchIdRef.current = startGpsWatch(now, elapsedRef);

    timerRef.current = setInterval(() => {
      elapsedRef.value += 1;
      setElapsedSeconds(elapsedRef.value);
      persistSession(coordsRef.current, now, elapsedRef.value);
    }, 1000);
  }, [persistSession, startGpsWatch]);

  const stopTracking = useCallback(() => {
    stopTimer();
    stopWatch();
    releaseWakeLock();
    setIsTracking(false);
    setIsPaused(false);
    clearSession();
  }, []);

  const handleFinish = async () => {
    stopTracking();
    if (coordsRef.current.length < 2) {
      toast.error('Percurso muito curto para salvar');
      return;
    }
    setSaving(true);
    const { error } = await onSaveRoute(
      workoutType,
      distance,
      elapsedSeconds,
      coordsRef.current,
      startedAt!,
      new Date(),
    );
    setSaving(false);
    if (!error) {
      toast.success(`${label} salva! ${distance.toFixed(2)} km em ${formatDuration(elapsedSeconds)}`);
      onFetchRoutes();
      setCoordinates([]);
      setDistance(0);
      setElapsedSeconds(0);
    } else {
      toast.error('Erro ao salvar percurso');
    }
  };

  // On mount: restore session if there was an active tracking
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.workoutType === workoutType && navigator.geolocation) {
          const startTime = new Date(session.startedAt);
          const extraElapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
          resumeTracking(startTime, extraElapsed, session.coordinates || []);
          toast.info('Retomando rastreamento ativo...');
        }
      } catch { clearSession(); }
    }
    onFetchRoutes();
    return () => { stopTimer(); stopWatch(); releaseWakeLock(); };
  }, [workoutType]);

  const pace = formatPace(distance, elapsedSeconds);

  return (
    <div className="mt-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-bold text-foreground">Rastreamento de {label}</span>
        {!isTracking && savedRoutes.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="ml-auto text-xs text-primary font-semibold flex items-center gap-1"
          >
            Histórico ({savedRoutes.length})
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {permissionDenied && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          Ative a permissão de GPS nas configurações do dispositivo para rastrear o percurso.
        </div>
      )}

      {/* Active tracking UI */}
      {isTracking ? (
        <div className="space-y-3">
          {/* Live stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Timer className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold text-foreground font-mono">{formatDuration(elapsedSeconds)}</p>
              <p className="text-[10px] text-muted-foreground">Tempo</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Ruler className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold text-foreground">{distance.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground">km</p>
            </div>
            <div className="bg-primary/10 rounded-xl p-3 text-center">
              <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-extrabold text-foreground font-mono">{pace}</p>
              <p className="text-[10px] text-muted-foreground">min/km</p>
            </div>
          </div>

          {/* Live map */}
          <div className="rounded-xl overflow-hidden border border-border/30">
            {coordinates.length > 0 ? (
              <LiveMap coordinates={coordinates} />
            ) : (
              <div className="h-40 bg-muted/30 rounded-xl flex flex-col items-center justify-center gap-2">
                <Navigation className="w-6 h-6 text-primary animate-pulse" />
                <p className="text-xs text-muted-foreground">Aguardando sinal GPS…</p>
              </div>
            )}
          </div>

          <div className="text-center space-y-0.5">
            <p className="text-[11px] text-muted-foreground">{pointsAccepted} pontos registrados (de {pointsReceived} recebidos)</p>
            <p className="text-[10px] text-muted-foreground/60">Precisão mín: {MAX_ACCURACY_METERS}m · Dist mín: {MIN_DISTANCE_METERS}m</p>
          </div>

          <Button
            onClick={handleFinish}
            disabled={saving}
            className="w-full rounded-xl h-11 bg-destructive hover:bg-destructive/90 text-white font-bold"
          >
            <Square className="w-4 h-4 mr-2" />
            {saving ? 'Salvando…' : 'Finalizar e Salvar Percurso'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={startTracking}
          className="w-full rounded-xl h-10 gradient-workout text-white font-bold border-0 shadow-md"
        >
          <Play className="w-4 h-4 mr-2" />
          Iniciar Rastreamento GPS
        </Button>
      )}

      {/* Saved routes history */}
      <AnimatePresence>
        {showHistory && !isTracking && savedRoutes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3 overflow-hidden"
          >
            {savedRoutes.map((route) => (
              <SavedRouteCard key={route.id} route={route} label={label} onDelete={onDeleteRoute} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SavedRouteCard({ route, label, onDelete }: { route: WorkoutRoute; label: string; onDelete: (id: string) => void }) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">{route.date}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground/40 hover:text-destructive"
            onClick={() => onDelete(route.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-base font-extrabold text-foreground">{route.distance_km.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">km</p>
          </div>
          <div>
            <p className="text-base font-extrabold text-foreground font-mono">{formatDuration(route.duration_seconds)}</p>
            <p className="text-[10px] text-muted-foreground">tempo</p>
          </div>
          <div>
            <p className="text-base font-extrabold text-foreground font-mono">{formatPace(route.distance_km, route.duration_seconds)}</p>
            <p className="text-[10px] text-muted-foreground">min/km</p>
          </div>
        </div>

        {route.coordinates.length > 1 && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs text-primary font-semibold hover:underline w-full text-left"
          >
            {showMap ? 'Ocultar mapa' : 'Ver trajeto no mapa'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showMap && route.coordinates.length > 1 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden px-3 pb-3"
          >
            <RouteMap coordinates={route.coordinates} id={route.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
