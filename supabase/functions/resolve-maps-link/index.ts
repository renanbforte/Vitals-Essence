// ============================================================================
// resolve-maps-link  —  ENDEREÇO / LINK DO MAPS -> COORDENADAS
// ----------------------------------------------------------------------------
// Recebe um endereço e/ou um link do Google Maps e devolve { lat, lng }.
// Roda no servidor (Deno) porque:
//   1) consegue expandir links curtos do Maps (maps.app.goo.gl / goo.gl),
//      seguindo o redirecionamento — o que o navegador não faz por causa de CORS;
//   2) pode geocodificar no Nominatim com um User-Agent próprio e tentar o
//      endereço aos poucos (tira o número, depois a rua) até achar algo.
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GeoPoint { lat: number; lng: number }

// Procura coordenadas dentro de um texto (URL ou HTML de uma página do Maps).
function coordsFromText(text: string): GeoPoint | null {
  if (!text) return null;
  // Marcador do lugar: !3d<lat>!4d<lng>
  const bang = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bang) return { lat: parseFloat(bang[1]), lng: parseFloat(bang[2]) };
  // Centro do mapa: @<lat>,<lng>
  const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };
  // Busca: q=<lat>,<lng> / query=<lat>,<lng> / ll=<lat>,<lng>
  const q = text.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };
  return null;
}

// Expande o link do Maps seguindo os redirecionamentos e procura as coordenadas
// na URL final e no conteúdo da página.
async function fromMapsUrl(url: string): Promise<GeoPoint | null> {
  // Se já vier com coordenadas no próprio link, nem precisa buscar.
  const direct = coordsFromText(decodeURIComponent(url));
  if (direct) return direct;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VitalisEssence/1.0)" },
    });
    // A URL final (depois dos redirecionamentos) costuma ter as coordenadas.
    const fromFinalUrl = coordsFromText(decodeURIComponent(res.url || ""));
    if (fromFinalUrl) return fromFinalUrl;
    // Senão, procura no HTML da página.
    const body = await res.text();
    return coordsFromText(body);
  } catch {
    return null;
  }
}

// Geocodifica um endereço no Nominatim, tentando do mais específico ao mais geral:
// endereço inteiro -> sem o número -> tirando a rua, depois o bairro.
async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const base = address.trim();
  if (!base) return null;

  const segments = base.split(",").map((s) => s.trim()).filter(Boolean);
  const candidates = new Set<string>();
  candidates.add(base);
  // Sem números soltos (ex.: o número da casa).
  candidates.add(base.replace(/\b\d+\b/g, "").replace(/\s*,\s*,/g, ",").trim());
  // Vai tirando o primeiro pedaço (rua, depois número, depois bairro...).
  for (let i = 1; i < segments.length; i++) {
    candidates.add(segments.slice(i).join(", "));
  }

  for (const q of candidates) {
    if (!q || q.length < 3) continue;
    try {
      const url =
        "https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pt-BR&q=" +
        encodeURIComponent(q);
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "VitalisEssence/1.0 (restaurant map; contact projetos@allnnect.com.br)",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { address, mapsUrl } = await req.json();

    let point: GeoPoint | null = null;
    if (mapsUrl && String(mapsUrl).trim()) {
      point = await fromMapsUrl(String(mapsUrl).trim());
    }
    if (!point && address && String(address).trim()) {
      point = await geocodeAddress(String(address));
    }

    return new Response(JSON.stringify({ point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ point: null, error: String(e) }), {
      status: 200, // não quebra o cadastro: o lugar é salvo sem posição
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
