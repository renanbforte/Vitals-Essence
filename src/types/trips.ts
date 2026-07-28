export interface Trip {
  id: string;
  user_id: string;
  name: string;
  main_destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  budget: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: string;
  status: string;
  invited_by: string;
  created_at: string;
}

export interface TripDestination {
  id: string;
  trip_id: string;
  user_id: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  contact: string | null;
  email: string | null;
  link: string | null;
  order_index: number;
  created_at: string;
}

export interface TripFlight {
  id: string;
  trip_id: string;
  user_id: string;
  airline: string | null;
  flight_code: string | null;
  origin: string | null;
  destination: string | null;
  departure_date: string | null;
  arrival_date: string | null;
  terminal: string | null;
  gate: string | null;
  baggage: string | null;
  booking_code: string | null;
  contact: string | null;
  email: string | null;
  direction: string;
  cost: number;
  currency: string;
  link: string | null;
  status: string;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TripAccommodation {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  address: string | null;
  map_link: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  policy: string | null;
  booking_code: string | null;
  contact: string | null;
  email: string | null;
  cost: number;
  currency: string;
  link: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TripTransport {
  id: string;
  trip_id: string;
  user_id: string;
  transport_type: string;
  start_date: string | null;
  end_date: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  booking_code: string | null;
  contact: string | null;
  email: string | null;
  cost: number;
  currency: string;
  link: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TripEvent {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  event_date: string | null;
  location: string | null;
  location_link: string | null;
  booking_code: string | null;
  cost: number;
  currency: string;
  contact: string | null;
  email: string | null;
  priority: string;
  link: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TripDocument {
  id: string;
  trip_id: string;
  user_id: string;
  doc_type: string;
  title: string;
  required_for: string | null;
  status: string;
  expiry_date: string | null;
  contact: string | null;
  email: string | null;
  file_url: string | null;
  link: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  user_id: string;
  item: string;
  category: string;
  amount: number;
  currency: string;
  paid: boolean;
  expense_date: string | null;
  link: string | null;
  file_url: string | null;
  related_type: string | null;
  related_id: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  split_enabled?: boolean;
  paid_by_user_id?: string | null;
  paid_by_external_id?: string | null;
  cost_mode?: string;
  quantity?: number;
}

export interface TripMeal {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  description: string | null;
  meal_date: string | null;
  cost: number;
  cost_mode: string;
  quantity: number;
  currency: string;
  contact: string | null;
  email: string | null;
  link: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface TripSplitParticipant {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface TripExpenseSplitEntry {
  id: string;
  expense_id: string;
  trip_id: string;
  participant_type: string;
  participant_user_id: string | null;
  participant_external_id: string | null;
  share_amount: number;
  paid_amount: number;
  created_at: string;
  updated_at: string;
}

export const TRIP_STATUSES = [
  { value: 'planning', label: 'Planejando', color: 'hsl(45, 93%, 47%)' },
  { value: 'confirmed', label: 'Confirmada', color: 'hsl(152, 68%, 42%)' },
  { value: 'ongoing', label: 'Em andamento', color: 'hsl(210, 80%, 50%)' },
  { value: 'completed', label: 'Concluída', color: 'hsl(240, 10%, 46%)' },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: 'flight', label: 'Voo' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'transport', label: 'Transporte' },
  { value: 'food', label: 'Alimentação' },
  { value: 'food_grocery', label: 'Alimentação/Mercado' },
  { value: 'tour', label: 'Passeios' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'documents', label: 'Documentos' },
  { value: 'shopping', label: 'Compras' },
  { value: 'other', label: 'Outros' },
] as const;

export const DOC_TYPES = [
  { value: 'passport', label: 'Passaporte' },
  { value: 'visa', label: 'Visto' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'vaccine', label: 'Vacinas' },
  { value: 'cnh', label: 'CNH' },
  { value: 'rg', label: 'RG' },
  { value: 'authorization', label: 'Autorização' },
  { value: 'other', label: 'Outros' },
] as const;

export const TRANSPORT_TYPES = [
  { value: 'car', label: 'Carro' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'train', label: 'Trem' },
  { value: 'bus', label: 'Ônibus' },
  { value: 'metro', label: 'Metrô' },
  { value: 'uber', label: 'Uber/Taxi' },
  { value: 'boat', label: 'Barco' },
  { value: 'other', label: 'Outros' },
] as const;

export const FLIGHT_STATUSES = [
  { value: 'planned', label: 'Planejado' },
  { value: 'purchased', label: 'Comprado' },
  { value: 'checked_in', label: 'Check-in feito' },
] as const;

export const PRIORITIES = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
] as const;
