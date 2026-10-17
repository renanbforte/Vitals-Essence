// ============================================================================
// RestaurantMap  —  MAPA DE RESTAURANTES (estilo Google Maps)
// ----------------------------------------------------------------------------
// Mostra num mapa (OpenStreetMap/Leaflet) todos os restaurantes cadastrados.
// Os que "quero ir" aparecem em rosa e os que "já fui" em verde. Dá para
// filtrar por situação e por tipo de cozinha, ver a lista embaixo e abrir o
// Instagram ou o Google Maps de cada um.
// ============================================================================
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Instagram, Map as MapIcon, Pencil, Trash2, Check, Target, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RestaurantDialog } from './RestaurantDialog';
import { RESTAURANT_CATEGORIES, restaurantCategoryOf } from './restaurantCategories';
import { useRestaurants, type Restaurant, type RestaurantInput } from '@/hooks/useRestaurants';

// Carregamento dinâmico do Leaflet (evita problemas de build/SSR), igual ao tracker de GPS.
let L: typeof import('leaflet') | null = null;

type StatusFilter = 'all' | 'want' | 'visited';

// Cor do marcador conforme a situação do restaurante.
const PIN_COLOR: Record<string, string> = {
  want: '#ec4899',    // rosa = quero ir
  visited: '#10b981', // verde = já fui
};

// Preço em reais (ou traço quando não informado).
function priceLabel(price: number | null): string {
  if (price == null) return '—';
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function RestaurantMap() {
  const { restaurants, loading, addRestaurant, updateRestaurant, toggleVisited, deleteRestaurant } = useRestaurants();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const markersLayerRef = useRef<import('leaflet').LayerGroup | null>(null);

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

  // Lista filtrada por situação e tipo de cozinha.
  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      return true;
    });
  }, [restaurants, statusFilter, categoryFilter]);

  // Só os que têm coordenadas entram no mapa.
  const located = useMemo(() => filtered.filter((r) => r.lat != null && r.lng != null), [filtered]);

  const wantCount = restaurants.filter((r) => r.status === 'want').length;
  const visitedCount = restaurants.filter((r) => r.status === 'visited').length;

  // Tipos de cozinha realmente usados (para o filtro não mostrar categorias vazias).
  const usedCategories = useMemo(() => {
    const set = new Set(restaurants.map((r) => r.category));
    return RESTAURANT_CATEGORIES.filter((c) => set.has(c.value));
  }, [restaurants]);

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
    if (!located.length) return;

    const points: [number, number][] = [];
    for (const r of located) {
      const cat = restaurantCategoryOf(r.category);
      const color = PIN_COLOR[r.status] || '#6d28d9';
      // Pino em formato de gota com o emoji do tipo de cozinha no meio.
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
      const marker = L.marker([r.lat as number, r.lng as number], { icon }).addTo(layer);
      const insta = r.instagram
        ? `<a href="https://instagram.com/${r.instagram.replace(/^@/, '')}" target="_blank" rel="noopener" style="color:#ec4899;text-decoration:none;">${r.instagram}</a>`
        : '';
      const maps = r.maps_url
        ? `<a href="${r.maps_url}" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:none;">Abrir no Maps</a>`
        : '';
      marker.bindPopup(
        `<div style="font-family:system-ui;min-width:150px;">
          <strong>${cat.emoji} ${r.name}</strong><br/>
          <span style="color:${color};font-weight:600;">${r.status === 'visited' ? 'Já fui' : 'Quero ir'}</span>
          &middot; ${priceLabel(r.price)}<br/>
          ${insta}${insta && maps ? ' &middot; ' : ''}${maps}
        </div>`,
      );
      points.push([r.lat as number, r.lng as number]);
    }

    // Enquadra todos os marcadores (ou centraliza se for só um).
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
    // O mapa pode ter sido criado escondido (dentro de uma aba): recalcula o tamanho.
    setTimeout(() => map.invalidateSize(), 100);
  }, [located]);

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (r: Restaurant) => { setEditing(r); setDialogOpen(true); };

  const handleSave = async (input: RestaurantInput, locationChanged: boolean) => {
    if (editing) {
      await updateRestaurant(editing.id, input, locationChanged);
    } else {
      await addRestaurant(input);
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

      {/* Filtro por tipo de cozinha (só aparece quando há mais de um tipo cadastrado) */}
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
                categoryFilter === c.value ? 'bg-foreground text-background border-foreground' : `bg-card border-border ${''}`
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
        {!located.length && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none bg-background/60">
            <MapPin className="w-10 h-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Nenhum restaurante no mapa ainda. Adicione um com endereço ou link do Google Maps.
            </p>
          </div>
        )}
      </div>

      {/* Lista dos restaurantes filtrados */}
      {loading ? (
        <div className="text-center text-muted-foreground py-10 text-sm">Carregando...</div>
      ) : !filtered.length ? (
        <div className="text-center py-10">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {restaurants.length ? 'Nenhum restaurante neste filtro.' : 'Comece adicionando o primeiro restaurante.'}
          </p>
          <Button onClick={openNew} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Adicionar restaurante
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r, i) => {
            const cat = restaurantCategoryOf(r.category);
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="border-border/60">
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      {/* Selo com a cor da situação */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: (PIN_COLOR[r.status] || '#6d28d9') + '22' }}
                      >
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-semibold truncate">{r.name}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              r.status === 'visited'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-pink-500/15 text-pink-600'
                            }`}
                          >
                            {r.status === 'visited' ? 'Já fui' : 'Quero ir'}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {r.price != null && (
                            <span className="font-medium text-foreground">{priceLabel(r.price)}</span>
                          )}
                          {r.address && (
                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                              <MapPin className="w-3 h-3 shrink-0" /> {r.address}
                            </span>
                          )}
                          {r.lat == null && (
                            <span className="text-amber-600">sem localização no mapa</span>
                          )}
                        </div>

                        {/* Ações rápidas */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          <Button
                            size="sm"
                            variant={r.status === 'visited' ? 'outline' : 'default'}
                            className="h-7 rounded-lg text-xs gap-1"
                            onClick={() => toggleVisited(r)}
                          >
                            {r.status === 'visited' ? <Target className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {r.status === 'visited' ? 'Quero ir' : 'Já fui'}
                          </Button>
                          {r.instagram && (
                            <a
                              href={`https://instagram.com/${r.instagram.replace(/^@/, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-pink-500">
                                <Instagram className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          {r.maps_url && (
                            <a href={r.maps_url} target="_blank" rel="noopener noreferrer">
                              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-blue-500">
                                <MapIcon className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          )}
                          <div className="flex-1" />
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(r)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-destructive"
                            onClick={() => {
                              if (confirm(`Remover "${r.name}"?`)) deleteRestaurant(r.id);
                            }}
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

      <RestaurantDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSave={handleSave} />
    </div>
  );
}
