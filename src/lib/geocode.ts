// ============================================================================
// geocode  —  ENDEREÇO -> COORDENADAS (para o mapa de restaurantes)
// ----------------------------------------------------------------------------
// Converte um endereço em latitude/longitude usando o Nominatim (serviço
// gratuito do OpenStreetMap, o mesmo mapa que o app já usa). Também tenta
// extrair as coordenadas direto de um link do Google Maps, quando ele já
// traz a posição — assim evitamos uma busca à toa.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

export interface GeoPoint {
  lat: number;
  lng: number;
}

// Tenta achar as coordenadas dentro de um link do Google Maps colado pelo usuário.
// Cobre os formatos mais comuns:
//   .../@-23.561,-46.656,17z/...        (centro do mapa)
//   ?q=-23.561,-46.656  /  &query=...   (ponto de busca)
//   !3d-23.561!4d-46.656                (marcador do lugar)
// Links curtos (maps.app.goo.gl) não trazem as coordenadas: nesse caso
// retornamos null e caímos na busca pelo endereço.
export function coordsFromMapsUrl(url: string | null | undefined): GeoPoint | null {
  if (!url) return null;
  try {
    const u = decodeURIComponent(url);

    // Marcador do lugar: !3d<lat>!4d<lng>
    const bang = u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (bang) return { lat: parseFloat(bang[1]), lng: parseFloat(bang[2]) };

    // Centro do mapa: @<lat>,<lng>
    const at = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };

    // Ponto de busca: q=<lat>,<lng> ou query=<lat>,<lng>
    const q = u.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };

    return null;
  } catch {
    return null;
  }
}

// É um link curto do Maps (compartilhado pelo celular)? Esses não trazem as
// coordenadas e, por causa de CORS, só o servidor consegue expandi-los.
function isShortMapsLink(url: string): boolean {
  return /maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs/i.test(url);
}

// Busca as coordenadas de um endereço escrito, direto do navegador (Nominatim do
// OpenStreetMap). A busca é feita do mais específico ao mais geral: endereço
// inteiro -> sem o número -> tirando a rua, depois o bairro -> até achar algo.
// Rodar no navegador é de propósito: o Nominatim bloqueia servidores de
// datacenter, mas aceita o IP do aparelho do usuário (inclusive no app Android).
export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const base = address.trim();
  if (!base) return null;

  const segments = base.split(',').map((s) => s.trim()).filter(Boolean);
  const candidates: string[] = [];
  const push = (s: string) => { const v = s.trim(); if (v.length >= 3 && !candidates.includes(v)) candidates.push(v); };
  push(base);
  push(base.replace(/\b\d+\b/g, '').replace(/\s*,\s*,/g, ',').trim()); // sem números soltos
  for (let i = 1; i < segments.length; i++) push(segments.slice(i).join(', '));

  for (const q of candidates) {
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pt-BR&q=' +
        encodeURIComponent(q);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

// Expande um link curto do Maps no servidor (segue o redirecionamento) e devolve
// as coordenadas, quando houver.
async function expandShortLink(mapsUrl: string): Promise<GeoPoint | null> {
  try {
    const { data, error } = await supabase.functions.invoke('resolve-maps-link', {
      body: { mapsUrl, address: null },
    });
    if (error) return null;
    return (data as { point?: GeoPoint | null })?.point ?? null;
  } catch {
    return null;
  }
}

// Resolve a melhor posição possível, na ordem mais barata e confiável:
//   1) link completo do Maps com coordenadas embutidas -> na hora, sem rede;
//   2) link curto do Maps -> servidor expande o redirecionamento;
//   3) endereço escrito -> geocodificação no navegador, com tentativas progressivas.
export async function resolveLocation(
  address: string | null | undefined,
  mapsUrl: string | null | undefined,
): Promise<GeoPoint | null> {
  const url = mapsUrl?.trim();
  const addr = address?.trim();

  if (url) {
    const fromUrl = coordsFromMapsUrl(url);
    if (fromUrl) return fromUrl;
    if (isShortMapsLink(url)) {
      const expanded = await expandShortLink(url);
      if (expanded) return expanded;
    }
  }

  if (addr) {
    const geo = await geocodeAddress(addr);
    if (geo) return geo;
  }

  return null;
}
