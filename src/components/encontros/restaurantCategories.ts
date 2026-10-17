// Categorias (tipo de cozinha) dos restaurantes, com emoji e cor do selo.
export interface RestaurantCategory {
  value: string;
  label: string;
  emoji: string;
  color: string; // classes de cor do selo
}

export const RESTAURANT_CATEGORIES: RestaurantCategory[] = [
  { value: 'japones', label: 'Japonês', emoji: '🍣', color: 'bg-rose-500/15 text-rose-600' },
  { value: 'italiano', label: 'Italiano', emoji: '🍝', color: 'bg-red-500/15 text-red-600' },
  { value: 'brasileiro', label: 'Brasileiro', emoji: '🇧🇷', color: 'bg-emerald-500/15 text-emerald-600' },
  { value: 'hamburgueria', label: 'Hamburgueria', emoji: '🍔', color: 'bg-amber-500/15 text-amber-600' },
  { value: 'pizzaria', label: 'Pizzaria', emoji: '🍕', color: 'bg-orange-500/15 text-orange-600' },
  { value: 'arabe', label: 'Árabe', emoji: '🥙', color: 'bg-yellow-500/15 text-yellow-700' },
  { value: 'mexicano', label: 'Mexicano', emoji: '🌮', color: 'bg-lime-500/15 text-lime-700' },
  { value: 'chines', label: 'Chinês', emoji: '🥡', color: 'bg-red-600/15 text-red-700' },
  { value: 'cafe', label: 'Café / Padaria', emoji: '☕', color: 'bg-amber-600/15 text-amber-700' },
  { value: 'doceria', label: 'Doceria / Sobremesa', emoji: '🍰', color: 'bg-pink-500/15 text-pink-600' },
  { value: 'bar', label: 'Bar / Boteco', emoji: '🍺', color: 'bg-yellow-600/15 text-yellow-800' },
  { value: 'vegetariano', label: 'Vegetariano / Vegano', emoji: '🥗', color: 'bg-green-500/15 text-green-600' },
  { value: 'frutos_do_mar', label: 'Frutos do mar', emoji: '🦐', color: 'bg-sky-500/15 text-sky-600' },
  { value: 'outro', label: 'Outro', emoji: '🍽️', color: 'bg-muted text-muted-foreground' },
];

export function restaurantCategoryOf(value: string): RestaurantCategory {
  return RESTAURANT_CATEGORIES.find((c) => c.value === value) || RESTAURANT_CATEGORIES[RESTAURANT_CATEGORIES.length - 1];
}
