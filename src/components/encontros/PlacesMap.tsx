// ============================================================================
// PlacesMap  —  MAPA DE LUGARES (quero ir / já fui), estilo Google Maps
// ----------------------------------------------------------------------------
// Mostra num mapa (OpenStreetMap/Leaflet) os lugares cadastrados. Os que
// "quero ir" aparecem em rosa e os que "já fui" em verde. Dá para filtrar por
// situação e por categoria, ver a lista embaixo e abrir o Instagram ou o Maps.
// É genérico: serve para restaurantes (Encontros) e pontos de viagem (Viagens);
// as categorias e os rótulos vêm por props.
// ============================================================================
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Instagram, Map as MapIcon, Pencil, Trash2, Check, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceDialog, type PlaceCategoryOption } from './PlaceDialog';
import { usePlaces, type Place, type PlaceInput } from '@/hooks/usePlaces';

// Carregamento dinâmico do Leaflet (evita problemas de build/SSR), igual ao tracker de GPS.
let L: typeof import('leaflet') | null = null;

type StatusFilter = 'all' | 'want' | 'visited';

// Cor do marcador conforme a situação do lugar.
const PIN_COLOR: Record<string, string> = {
  want: '#ec4899',    // rosa = quero ir
  visited: '#10b981', // verde = já fui
};

// Categoria com cor do selo (as props trazem só value/label/emoji; a cor fica aqui).
interface Category extends PlaceCategoryOption { color?: string }

// Marcador extra no mapa, vindo de fora (ex.: as viagens planejadas). Não entra
// na lista de lugares — serve só para "ligar" outras coisas ao mapa.
export interface ExtraMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  emoji?: string;
  color?: string;
  subtitle?: string;
  actionLabel?: string;   // texto do botão no popup (ex.: "Abrir viagem")
  onAction?: () => void;  // o que fazer ao tocar no botão
}

interface Props {
  scope: string;              // 'restaurant' | 'travel'
  categories: Category[];
  defaultCategory: string;
  dialogTitle?: string;       // "restaurante" / "lugar"
  namePlaceholder?: string;   // "Sushi Yassu" / "Cristo Redentor"
  priceLabel?: string;        // "Preço médio (R$)" / "Custo estimado (R$)"
  emptyText?: string;         // texto do estado vazio na lista
  extraMarkers?: ExtraMarker[]; // marcadores de fora (ex.: viagens)
  extraLegend?: string;         // legenda curta explicando os marcadores extras
}

// Preço em reais (ou traço quando não informado).
function priceLabel(price: number | null): string {
  if (price == null) return '—';
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PlacesMap({
  scope, categories, defaultCategory,
  dialogTitle = 'lugar', namePlaceholder = 'Nome do lugar', priceLabel: priceFieldLabel = 'Preço médio (R$)',
  emptyText = 'Comece adicionando o primeiro lugar.',
  extraMarkers = [], extraLegend,
}: Props) {
  const { places, loading, addPlace, updatePlace, toggleVisited, deletePlace } = usePlaces(scope, defaultCategory);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const markersLayerRef = useRef<import('leaflet').LayerGroup | null>(null);

  // Acha a categoria pelo valor (com fallback na última, "Outro").
  const categoryOf = (value: string): Category =>
    categories.find((c) => c.value === value) || categories[categories.length - 1];

  // Garante o CSS do Leaflet carregado (uma vez só).
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Lista filtrada por situação e categoria.
  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [places, statusFilter, categoryFilter]);

  // Só os que têm coordenadas entram no mapa.
  const located = useMemo(() => filtered.filter((p) => p.lat != null && p.lng != null), [filtered]);

  const wantCount = places.filter((p) => p.status === 'want').length;
  const visitedCount = places.filter((p) => p.status === 'visited').length;

  // Categorias realmente usadas (para o filtro não mostrar categorias vazias).
  const usedCategories = useMemo(() => {
    const set = new Set(places.map((p) => p.category));
    return categories.filter((c) => set.has(c.value));
  }, [places, categories]);

  // Cria o mapa uma vez, quando o componente monta.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!L) L = await import('leaflet');
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false });
      map.setView([-14.235, -51.925], 4); // Brasil inteiro como ponto de partida
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Redesenha os marcadores sempre que a lista localizada muda.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer || !L) return;
    layer.clearLayers();

    const points: [number, number][] = [];
    for (const p of located) {
      const cat = categoryOf(p.category);
      const color = PIN_COLOR[p.status] || '#6d28d9';
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:32px;height:42px;">
          <div style="position:absolute;top:0;left:0;width:32px;height:32px;background:${color};border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>
          <div style="position:absolute;top:3px;left:0;width:32px;height:28px;display:flex;align-items:center;justify-content:center;font-size:15px;">${cat.emoji}</div>
        </div>`,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });
      const marker = L.marker([p.lat as number, p.lng as number], { icon }).addTo(layer);
      const insta = p.instagram
        ? `<a href="https://instagram.com/${p.instagram.replace(/^@/, '')}" target="_blank" rel="noopener" style="color:#ec4899;text-decoration:none;">${p.instagram}</a>`
        : '';
      const maps = p.maps_url
        ? `<a href="${p.maps_url}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:none;">Abrir no Maps</a>`
        : '';
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:150px;">
          <strong>${cat.emoji} ${p.name}</strong><br/>
          <span style="color:${color};font-weight:600;">${p.status === 'visited' ? 'Já fui' : 'Quero ir'}</span>
          &middot; ${priceLabel(p.price)}<br/>
          ${insta}${insta && maps ? ' &middot; ' : ''}${maps}
        </div>`,
      );
      points.push([p.lat as number, p.lng as number]);
    }

    // Marcadores extras (ex.: viagens planejadas) — visual diferente (círculo).
    for (const m of extraMarkers) {
      const color = m.color || '#0ea5e9';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:34px;height:34px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:16px;">${m.emoji || '✈️'}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(layer);
      const btn = m.onAction
        ? `<button data-extra="${m.id}" style="margin-top:6px;border:0;background:${color};color:#fff;font-weight:600;padding:5px 10px;border-radius:8px;cursor:pointer;">${m.actionLabel || 'Abrir'}</button>`
        : '';
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:150px;">
          <strong>${m.emoji || '✈️'} ${m.name}</strong>${m.subtitle ? `<br/><span style="color:#64748b;">${m.subtitle}</span>` : ''}
          ${btn ? `<br/>${btn}` : ''}
        </div>`,
      );
      if (m.onAction) {
        marker.on('popupopen', () => {
          const el = marker.getPopup()?.getElement()?.querySelector('[data-extra]');
          el?.addEventListener('click', () => m.onAction?.(), { once: true });
        });
      }
      points.push([m.lat, m.lng]);
    }

    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
    setTimeout(() => map.invalidateSize(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [located, extraMarkers]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: Place) => { setEditing(p); setDialogOpen(true); };

  const handleSave = async (input: PlaceInput, locationChanged: boolean) => {
    if (editing) {
      await updatePlace(editing.id, input, locationChanged);
    } else {
      await addPlace(input);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo + botão de adicionar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> {wantCount} quero ir
          </span>
          <span className="inline-flex items-center gap-1 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {visitedCount} já fui
          </span>
        </div>
        <Button size="sm" onClick={openNew} className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      {/* Filtro por situação */}
      <div className="flex gap-2">
        {([
          { v: 'all', label: 'Todos' },
          { v: 'want', label: '🎯 Quero ir' },
          { v: 'visited', label: '✅ Já fui' },
        ] as { v: StatusFilter; label: string }[]).map((opt) => (
          <button
            key={opt.v}
            onClick={() => setStatusFilter(opt.v)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
              statusFilter === opt.v
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filtro por categoria (só aparece quando há mais de uma categoria cadastrada) */}
      {usedCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              categoryFilter === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-card border-border text-muted-foreground'
            }`}
          >
            Tudo
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                categoryFilter === c.value ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* O mapa */}
      <div className="relative rounded-2xl overflow-hidden border border-border">
        <div ref={mapRef} className="w-full h-[55vh] min-h-[320px] bg-muted z-0" />
        {!located.length && !extraMarkers.length && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none bg-background/60">
            <MapPin className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Nenhum lugar no mapa ainda. Adicione um com endereço ou link do Google Maps.
            </p>
          </div>
        )}
      </div>

      {/* Legenda dos marcadores extras (ex.: viagens) */}
      {extraLegend && extraMarkers.length > 0 && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500 text-[9px]">✈️</span>
          {extraLegend}
        </p>
      )}

      {/* Lista dos lugares filtrados */}
      {loading ? (
        <div className="text-center text-muted-foreground py-10 text-sm">Carregando...</div>
      ) : !filtered.length ? (
        <div className="text-center py-10">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {places.length ? 'Nenhum lugar neste filtro.' : emptyText}
          </p>
          <Button onClick={openNew} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p, i) => {
            const cat = categoryOf(p.category);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border-border/60">
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: (PIN_COLOR[p.status] || '#6d28d9') + '22' }}
                      >
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold truncate">{p.name}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              p.status === 'visited' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-pink-500/15 text-pink-600'
                            }`}
                          >
                            {p.status === 'visited' ? 'Já fui' : 'Quero ir'}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color || 'bg-muted text-muted-foreground'}`}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {p.price != null && <span className="font-medium text-foreground">{priceLabel(p.price)}</span>}
                          {p.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 shrink-0" /> {p.address}
                            </span>
                          )}
                          {p.lat == null && <span className="text-amber-600">sem localização no mapa</span>}
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5">
                          <Button
                            size="sm"
                            variant={p.status === 'visited' ? 'outline' : 'default'}
                            className="h-7 rounded-lg text-xs gap-1"
                            onClick={() => toggleVisited(p)}
                          >
                            {p.status === 'visited' ? <Target className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {p.status === 'visited' ? 'Quero ir' : 'Já fui'}
                          </Button>
                          {p.instagram && (
                            <a href={`https://instagram.com/${p.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-pink-500">
                                <Instagram className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          {p.maps_url && (
                            <a href={p.maps_url} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-blue-500">
                                <MapIcon className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <div className="flex-1" />
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(p)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-destructive"
                            onClick={() => { if (confirm(`Remover "${p.name}"?`)) deletePlace(p.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <PlaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={handleSave}
        categories={categories}
        defaultCategory={defaultCategory}
        title={dialogTitle}
        namePlaceholder={namePlaceholder}
        priceLabel={priceFieldLabel}
      />
    </div>
  );
}
