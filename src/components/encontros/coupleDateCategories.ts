// Categorias de encontro do casal, com emoji e cor para os cartões.
export interface DateCategory {
  value: string;
  label: string;
  emoji: string;
  color: string; // classes de cor do selo
}

export const DATE_CATEGORIES: DateCategory[] = [
  { value: 'romantico', label: 'Romântico', emoji: '💕', color: 'bg-pink-500/15 text-pink-600' },
  { value: 'gastronomico', label: 'Gastronômico', emoji: '🍷', color: 'bg-rose-500/15 text-rose-600' },
  { value: 'aventura', label: 'Aventura', emoji: '🏔️', color: 'bg-emerald-500/15 text-emerald-600' },
  { value: 'ar_livre', label: 'Ao ar livre', emoji: '🌳', color: 'bg-lime-500/15 text-lime-700' },
  { value: 'cultural', label: 'Cultural', emoji: '🎭', color: 'bg-violet-500/15 text-violet-600' },
  { value: 'casa', label: 'Em casa', emoji: '🏠', color: 'bg-amber-500/15 text-amber-600' },
  { value: 'viagem', label: 'Viagem', emoji: '✈️', color: 'bg-sky-500/15 text-sky-600' },
  { value: 'surpresa', label: 'Surpresa', emoji: '🎁', color: 'bg-fuchsia-500/15 text-fuchsia-600' },
];

export function categoryOf(value: string): DateCategory {
  return DATE_CATEGORIES.find(c => c.value === value) || DATE_CATEGORIES[0];
}
