// Categorias dos lugares de viagem (quero ir / já fui), com emoji e cor do selo.
// Mesma estrutura das categorias de restaurante, para reusar o mapa.
export interface TravelCategory {
  value: string;
  label: string;
  emoji: string;
  color: string;
}

export const TRAVEL_CATEGORIES: TravelCategory[] = [
  { value: 'ponto_turistico', label: 'Ponto turístico', emoji: '📸', color: 'bg-sky-500/15 text-sky-600' },
  { value: 'praia', label: 'Praia', emoji: '🏖️', color: 'bg-cyan-500/15 text-cyan-600' },
  { value: 'natureza', label: 'Natureza / Trilha', emoji: '🏔️', color: 'bg-emerald-500/15 text-emerald-600' },
  { value: 'restaurante', label: 'Restaurante', emoji: '🍽️', color: 'bg-rose-500/15 text-rose-600' },
  { value: 'bar', label: 'Bar / Vida noturna', emoji: '🍹', color: 'bg-fuchsia-500/15 text-fuchsia-600' },
  { value: 'hospedagem', label: 'Hospedagem', emoji: '🏨', color: 'bg-indigo-500/15 text-indigo-600' },
  { value: 'museu', label: 'Museu / Cultura', emoji: '🏛️', color: 'bg-violet-500/15 text-violet-600' },
  { value: 'parque', label: 'Parque / Atração', emoji: '🎡', color: 'bg-amber-500/15 text-amber-600' },
  { value: 'compras', label: 'Compras', emoji: '🛍️', color: 'bg-pink-500/15 text-pink-600' },
  { value: 'mirante', label: 'Mirante / Paisagem', emoji: '🌄', color: 'bg-orange-500/15 text-orange-600' },
  { value: 'outro', label: 'Outro', emoji: '📍', color: 'bg-muted text-muted-foreground' },
];

export function travelCategoryOf(value: string): TravelCategory {
  return TRAVEL_CATEGORIES.find((c) => c.value === value) || TRAVEL_CATEGORIES[TRAVEL_CATEGORIES.length - 1];
}
