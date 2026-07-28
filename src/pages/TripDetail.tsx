import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/useTrips';
import { useTripItems } from '@/hooks/useTripItems';
import { TRIP_STATUSES, type TripDestination, type TripFlight, type TripAccommodation, type TripTransport, type TripEvent, type TripDocument, type TripExpense, type TripMeal, type TripSplitParticipant } from '@/types/trips';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/** Parse ISO/timestamp string preserving wall-clock time (no UTC→local shift) */
function parseLocal(dateStr: string): Date {
  const s = dateStr.substring(0, 16);
  const [datePart, timePart] = s.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (timePart) {
    const [h, min] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  }
  return new Date(y, m - 1, d);
}
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CalendarDays, DollarSign, Trash2, Edit2, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TripItemBlock from '@/components/travel/TripItemBlock';
import TripExpenseSummary from '@/components/travel/TripExpenseSummary';
import TripTimeline from '@/components/travel/TripTimeline';
import TripSharingCard from '@/components/travel/TripSharingCard';
import TripExpenseSplit from '@/components/travel/TripExpenseSplit';
import TripChecklist from '@/components/travel/TripChecklist';
import TripRecommendations from '@/components/travel/TripRecommendations';
import { toast } from 'sonner';

import imgDestinos from '@/assets/trip-destinos.png';
import imgVoos from '@/assets/trip-voos.png';
import imgHospedagem from '@/assets/trip-hospedagem.png';
import imgTransporte from '@/assets/trip-transporte.png';
import imgAgenda from '@/assets/trip-agenda.png';
import imgAlimentacao from '@/assets/trip-alimentacao.png';
import imgDocumentos from '@/assets/trip-documentos.png';
import heroViagens from '@/assets/hero-viagens.png';

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trips, updateTrip, deleteTrip } = useTrips();
  const trip = trips.find((t: any) => t.id === tripId);

  const destinations = useTripItems<TripDestination>('trip_destinations', tripId!);
  const flights = useTripItems<TripFlight>('trip_flights', tripId!);
  const accommodations = useTripItems<TripAccommodation>('trip_accommodations', tripId!);
  const transport = useTripItems<TripTransport>('trip_transport', tripId!);
  const events = useTripItems<TripEvent>('trip_events', tripId!);
  const documents = useTripItems<TripDocument>('trip_documents', tripId!);
  const expenses = useTripItems<TripExpense>('trip_expenses', tripId!);
  const meals = useTripItems<TripMeal>('trip_meals', tripId!);
  const splitParticipants = useTripItems<TripSplitParticipant>('trip_split_participants', tripId!);

  const [editTrip, setEditTrip] = useState(false);
  const [tripForm, setTripForm] = useState<any>({});
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Fetch trip member profiles
  const [tripMemberProfiles, setTripMemberProfiles] = useState<{ user_id: string; name: string }[]>([]);
  useEffect(() => {
    if (!tripId) return;
    const fetchProfiles = async () => {
      const { data: members } = await supabase.from('trip_members').select('user_id').eq('trip_id', tripId).eq('status', 'accepted');
      const { data: tripData } = await supabase.from('trips').select('user_id').eq('id', tripId).single();
      const uids = new Set<string>();
      if (tripData) uids.add(tripData.user_id);
      members?.forEach(m => uids.add(m.user_id));
      if (uids.size > 0) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', Array.from(uids));
        setTripMemberProfiles(profiles || []);
      }
    };
    fetchProfiles();
  }, [tripId]);

  // Resolve cover image URL (bucket is private, use signed URL)
  useEffect(() => {
    if (!trip?.cover_image) { setCoverUrl(null); return; }
    supabase.storage.from('trip-files').createSignedUrl(trip.cover_image, 3600).then(({ data }) => {
      setCoverUrl(data?.signedUrl || null);
    });
  }, [trip?.cover_image]);


  // Build unified participant list for paid_by selectors
  const paidByParticipants = useMemo(() => {
    const list: { id: string; label: string; type: 'member' | 'external'; userId?: string; externalId?: string }[] = [];
    tripMemberProfiles.forEach(m => {
      list.push({ id: `member_${m.user_id}`, label: m.name, type: 'member', userId: m.user_id });
    });
    splitParticipants.items.forEach(p => {
      list.push({ id: `external_${p.id}`, label: p.name, type: 'external', externalId: p.id });
    });
    return list;
  }, [tripMemberProfiles, splitParticipants.items]);

  const isOwner = trip?.user_id === user?.id;
  const status = TRIP_STATUSES.find(s => s.value === trip?.status) || TRIP_STATUSES[0];

  const getTotal = (e: any) => {
    const amount = Number(e.amount || e.cost) || 0;
    return e.cost_mode === 'unit' ? amount * (Number(e.quantity) || 1) : amount;
  };
  const totalSpent = useMemo(() => {
    const expTotal = expenses.items.reduce((s, e) => s + getTotal(e), 0);
    const itemTotal = [...flights.items, ...accommodations.items, ...transport.items, ...events.items, ...meals.items].reduce((s, i) => s + getTotal(i), 0);
    return expTotal + itemTotal;
  }, [expenses.items, flights.items, accommodations.items, transport.items, events.items, meals.items]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !trip) return;
    setCoverUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/cover-${trip.id}.${ext}`;
      const { error: upErr } = await supabase.storage.from('trip-files').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      await updateTrip.mutateAsync({ id: trip.id, cover_image: path });
      toast.success('Capa atualizada!');
    } catch {
      toast.error('Erro ao fazer upload da capa');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  if (!tripId) return null;
  if (!trip) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4">Carregando viagem...</p>
        <Button variant="outline" onClick={() => navigate('/viagens')}>Voltar</Button>
      </div>
    </div>
  );

  const openEditTrip = () => {
    setTripForm({
      name: trip.name, main_destination: trip.main_destination || '',
      start_date: trip.start_date || '', end_date: trip.end_date || '',
      budget: trip.budget || 0, currency: trip.currency || 'BRL', status: trip.status, notes: trip.notes || '',
    });
    setEditTrip(true);
  };

  const saveTrip = () => {
    updateTrip.mutate({ id: trip.id, ...tripForm });
    setEditTrip(false);
  };

  const handleDelete = () => {
    if (confirm('Excluir esta viagem e todos os itens?')) {
      deleteTrip.mutate(trip.id, { onSuccess: () => navigate('/viagens') });
    }
  };

  const bgImage = coverUrl || heroViagens;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero Header with cover */}
      <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
        <img src={bgImage} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        <div className="relative container mx-auto px-4 pt-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/viagens')} className="text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex gap-2">
              {/* Cover upload button */}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={coverUploading} />
                <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 pointer-events-none" asChild>
                  <span>
                    {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </span>
                </Button>
              </label>
              <Button size="sm" variant="ghost" onClick={openEditTrip} className="text-white/80 hover:text-white hover:bg-white/10">
                <Edit2 className="w-4 h-4" />
              </Button>
              {isOwner && (
                <Button size="sm" variant="ghost" onClick={handleDelete} className="text-white/80 hover:text-red-300 hover:bg-white/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white text-xl font-bold uppercase drop-shadow-lg">{trip.name}</h1>
              <Badge variant="outline" className="text-white border-white/40 text-[10px]">{status.label}</Badge>
            </div>
            {trip.main_destination && (
              <p className="text-white/80 text-sm flex items-center gap-1 drop-shadow"><MapPin className="w-3.5 h-3.5" />{trip.main_destination}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-white/70 text-xs">
              {trip.start_date && (
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />
                  {format(new Date(trip.start_date), "dd/MM/yy")}{trip.end_date && ` – ${format(new Date(trip.end_date), "dd/MM/yy")}`}
                </span>
              )}
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />
                Custo Total: {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: trip.currency || 'BRL' })}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-4">
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="items" className="text-xs">Itens</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="costs" className="text-xs">Custos</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs">Checklist</TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">✨ Dicas</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-3 mt-0">
            {/* Sharing */}
            <TripSharingCard tripId={tripId!} isOwner={isOwner} />

            {/* Destinations */}
            <TripItemBlock
              title="Destinos" sectionImage={imgDestinos} color="sky"
              tripId={tripId!} parentType="destination"
              items={destinations.items} onCreate={destinations.create.mutate}
              onUpdate={(id, data) => destinations.update.mutate({ id, ...data })}
              onDelete={destinations.remove.mutate}
              fields={[
                { key: 'location', label: 'Local', required: true },
                { key: 'start_date', label: 'De', type: 'date' },
                { key: 'end_date', label: 'Até', type: 'date' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'link', label: 'Link', type: 'url' },
                { key: 'notes', label: 'Observações', type: 'textarea' },
              ]}
              renderItem={(item: TripDestination) => (
                <div>
                  <p className="font-medium text-sm">{item.location}</p>
                  {item.start_date && <p className="text-xs text-muted-foreground">{format(new Date(item.start_date), "dd/MM")} {item.end_date && `– ${format(new Date(item.end_date), "dd/MM")}`}</p>}
                </div>
              )}
            />

            {/* Flights */}
            <TripItemBlock
              title="Voos" sectionImage={imgVoos} color="blue"
              tripId={tripId!} parentType="flight"
              items={flights.items} onCreate={flights.create.mutate}
              onUpdate={(id, data) => flights.update.mutate({ id, ...data })}
              onDelete={flights.remove.mutate}
              fields={[
                { key: 'direction', label: 'Trecho', type: 'select', options: [
                  { value: 'outbound', label: 'Ida' },
                  { value: 'return', label: 'Volta' },
                ]},
                { key: 'airline', label: 'Companhia' },
                { key: 'flight_code', label: 'Código (ex: LA1234)' },
                { key: 'origin', label: 'Origem (aeroporto/cidade)', type: 'location' },
                { key: 'destination', label: 'Destino (aeroporto/cidade)', type: 'location' },
                { key: 'departure_date', label: 'Saída', type: 'datetime-local' },
                { key: 'arrival_date', label: 'Chegada', type: 'datetime-local' },
                { key: 'terminal', label: 'Terminal' },
                { key: 'gate', label: 'Portão' },
                { key: 'baggage', label: 'Bagagem' },
                { key: 'booking_code', label: 'Localizador' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'cost', label: 'Custo', type: 'number' },
                { key: 'link', label: 'Link', type: 'url' },
                { key: 'status', label: 'Status', type: 'select', options: [
                  { value: 'planned', label: 'Planejado' },
                  { value: 'purchased', label: 'Comprado' },
                  { value: 'checked_in', label: 'Check-in feito' },
                ]},
                { key: 'notes', label: 'Observações', type: 'textarea' },
                { key: 'paid_by_key', label: 'Quem pagou?', type: 'paid_by' as any },
              ]}
              paidByOptions={paidByParticipants}
              renderItem={(item: TripFlight) => (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.direction === 'return' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'}`}>
                      {item.direction === 'return' ? 'Volta' : 'Ida'}
                    </span>
                    <p className="font-medium text-sm">{item.airline} {item.flight_code}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.origin} → {item.destination}</p>
                  {item.departure_date && <p className="text-xs text-muted-foreground">{format(parseLocal(item.departure_date), "dd/MM HH:mm")}{item.arrival_date && ` → ${format(parseLocal(item.arrival_date), "dd/MM HH:mm")}`}</p>}
                  {(item.cost ?? 0) > 0 && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{getTotal(item).toLocaleString('pt-BR', { style: 'currency', currency: item.currency || 'BRL' })}</p>}
                </div>
              )}
            />

            {/* Accommodations */}
            <TripItemBlock
              title="Hospedagens" sectionImage={imgHospedagem} color="amber"
              tripId={tripId!} parentType="accommodation"
              items={accommodations.items} onCreate={accommodations.create.mutate}
              onUpdate={(id, data) => accommodations.update.mutate({ id, ...data })}
              onDelete={accommodations.remove.mutate}
              fields={[
                { key: 'name', label: 'Nome *', required: true },
                { key: 'address', label: 'Endereço' },
                { key: 'map_link', label: 'Link mapa', type: 'url' },
                { key: 'checkin_date', label: 'Check-in', type: 'datetime-local' },
                { key: 'checkout_date', label: 'Check-out', type: 'datetime-local' },
                { key: 'policy', label: 'Política (cancelamento, café, etc.)', type: 'textarea' },
                { key: 'booking_code', label: 'Reserva/código' },
                { key: 'contact', label: 'Contato (telefone)' },
                { key: 'email', label: 'Email' },
                { key: 'cost', label: 'Custo', type: 'number' },
                { key: 'link', label: 'Link', type: 'url' },
                { key: 'notes', label: 'Observações', type: 'textarea' },
                { key: 'paid_by_key', label: 'Quem pagou?', type: 'paid_by' as any },
              ]}
              paidByOptions={paidByParticipants}
              renderItem={(item: TripAccommodation) => (
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.checkin_date && <p className="text-xs text-muted-foreground">Check-in: {format(parseLocal(item.checkin_date), "dd/MM HH:mm")}{item.checkout_date && ` · Check-out: ${format(parseLocal(item.checkout_date), "dd/MM HH:mm")}`}</p>}
                  {(item.contact || (item as any).email) && <p className="text-xs text-muted-foreground">{item.contact}{item.contact && (item as any).email && ' · '}{(item as any).email}</p>}
                  {(item.cost ?? 0) > 0 && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{getTotal(item).toLocaleString('pt-BR', { style: 'currency', currency: item.currency || 'BRL' })}</p>}
                </div>
              )}
            />

            {/* Transport */}
            <TripItemBlock
              title="Transporte Local" sectionImage={imgTransporte} color="emerald"
              tripId={tripId!} parentType="transport"
              items={transport.items} onCreate={transport.create.mutate}
              onUpdate={(id, data) => transport.update.mutate({ id, ...data })}
              onDelete={transport.remove.mutate}
              fields={[
                { key: 'transport_type', label: 'Tipo', type: 'select', options: [
                  { value: 'car', label: 'Carro' }, { value: 'transfer', label: 'Transfer' },
                  { value: 'train', label: 'Trem' }, { value: 'bus', label: 'Ônibus' },
                  { value: 'metro', label: 'Metrô' }, { value: 'uber', label: 'Uber/Taxi' },
                  { value: 'boat', label: 'Barco' }, { value: 'other', label: 'Outros' },
                ]},
                { key: 'start_date', label: 'Data/hora início', type: 'datetime-local' },
                { key: 'end_date', label: 'Data/hora fim', type: 'datetime-local' },
                { key: 'pickup_location', label: 'Local de partida', type: 'location' },
                { key: 'dropoff_location', label: 'Local de chegada', type: 'location' },
                { key: 'booking_code', label: 'Reserva' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'cost', label: 'Custo', type: 'number' },
                { key: 'link', label: 'Link', type: 'url' },
                { key: 'notes', label: 'Observações', type: 'textarea' },
                { key: 'paid_by_key', label: 'Quem pagou?', type: 'paid_by' as any },
              ]}
              paidByOptions={paidByParticipants}
              renderItem={(item: TripTransport) => (
                <div>
                  <p className="font-medium text-sm capitalize">{item.transport_type}</p>
                  <p className="text-xs text-muted-foreground">{item.pickup_location} {item.dropoff_location && `→ ${item.dropoff_location}`}</p>
                  {item.start_date && <p className="text-xs text-muted-foreground">{format(parseLocal(item.start_date), "dd/MM HH:mm")}{item.end_date && ` → ${format(parseLocal(item.end_date), "dd/MM HH:mm")}`}</p>}
                  {(item.cost ?? 0) > 0 && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{getTotal(item).toLocaleString('pt-BR', { style: 'currency', currency: item.currency || 'BRL' })}</p>}
                </div>
              )}
            />

            {/* Events / Agenda */}
            <TripItemBlock
              title="Programação / Agenda" sectionImage={imgAgenda} color="violet"
              tripId={tripId!} parentType="event"
              items={events.items} onCreate={events.create.mutate}
              onUpdate={(id, data) => events.update.mutate({ id, ...data })}
              onDelete={events.remove.mutate}
              fields={[
                { key: 'title', label: 'Título *', required: true },
                { key: 'event_date', label: 'Data/hora', type: 'datetime-local' },
                { key: 'location', label: 'Local' },
                { key: 'location_link', label: 'Link do local', type: 'url' },
                { key: 'booking_code', label: 'Ingressos/reserva' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'cost', label: 'Custo', type: 'number' },
                { key: 'priority', label: 'Prioridade', type: 'select', options: [
                  { value: 'high', label: 'Alta' }, { value: 'medium', label: 'Média' }, { value: 'low', label: 'Baixa' },
                ]},
                { key: 'notes', label: 'Observações', type: 'textarea' },
                { key: 'paid_by_key', label: 'Quem pagou?', type: 'paid_by' as any },
              ]}
              paidByOptions={paidByParticipants}
              renderItem={(item: TripEvent) => (
                <div className="flex items-center gap-2">
                  {item.priority === 'high' && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.event_date && <p className="text-xs text-muted-foreground">{format(parseLocal(item.event_date), "dd/MM HH:mm")}{item.location && ` · ${item.location}`}</p>}
                    {(item.cost ?? 0) > 0 && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{getTotal(item).toLocaleString('pt-BR', { style: 'currency', currency: item.currency || 'BRL' })}</p>}
                  </div>
                </div>
              )}
            />

            {/* Meals / Food */}
            <TripItemBlock
              title="Alimentação / Mercado" sectionImage={imgAlimentacao} color="rose"
              tripId={tripId!} parentType="meal"
              items={meals.items} onCreate={meals.create.mutate}
              onUpdate={(id, data) => meals.update.mutate({ id, ...data })}
              onDelete={meals.remove.mutate}
              fields={[
                { key: 'title', label: 'Descrição *', required: true },
                { key: 'description', label: 'Detalhes', type: 'textarea' },
                { key: 'meal_date', label: 'Data', type: 'date' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'cost', label: 'Custo', type: 'number' },
                { key: 'link', label: 'Link', type: 'url' },
                { key: 'notes', label: 'Observações', type: 'textarea' },
                { key: 'paid_by_key', label: 'Quem pagou?', type: 'paid_by' as any },
              ]}
              paidByOptions={paidByParticipants}
              renderItem={(item: TripMeal) => (
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                  {item.meal_date && <p className="text-xs text-muted-foreground">{format(new Date(item.meal_date), "dd/MM/yy")}</p>}
                  {(item.cost ?? 0) > 0 && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{getTotal(item).toLocaleString('pt-BR', { style: 'currency', currency: item.currency || 'BRL' })}</p>}
                </div>
              )}
            />

            {/* Documents */}
            <TripItemBlock
              title="Documentação" sectionImage={imgDocumentos} color="orange"
              tripId={tripId!} parentType="document"
              items={documents.items} onCreate={documents.create.mutate}
              onUpdate={(id, data) => documents.update.mutate({ id, ...data })}
              onDelete={documents.remove.mutate}
              fields={[
                { key: 'title', label: 'Título *', required: true },
                { key: 'doc_type', label: 'Tipo', type: 'select', options: [
                  { value: 'passport', label: 'Passaporte' }, { value: 'visa', label: 'Visto' },
                  { value: 'insurance', label: 'Seguro' }, { value: 'vaccine', label: 'Vacinas' },
                  { value: 'cnh', label: 'CNH' }, { value: 'rg', label: 'RG' },
                  { value: 'authorization', label: 'Autorização' }, { value: 'other', label: 'Outros' },
                ]},
                { key: 'required_for', label: 'Necessário para' },
                { key: 'status', label: 'Status', type: 'select', options: [
                  { value: 'pending', label: 'Pendente' }, { value: 'ok', label: 'OK' }, { value: 'expiring', label: 'Vencendo' },
                ]},
                { key: 'expiry_date', label: 'Validade', type: 'date' },
                { key: 'contact', label: 'Contato' },
                { key: 'email', label: 'Email' },
                { key: 'link', label: 'Link', type: 'url' },
                { key: 'file_url', label: 'Documento (PDF, Imagem)', type: 'file', accept: '.pdf,.jpg,.jpeg,.png,.webp' },
                { key: 'notes', label: 'Observações', type: 'textarea' },
              ]}
              renderItem={(item: TripDocument) => (
                <div className="flex items-center gap-2">
                  <Badge variant={item.status === 'ok' ? 'default' : item.status === 'expiring' ? 'destructive' : 'outline'} className="text-[10px]">
                    {item.status === 'ok' ? 'OK' : item.status === 'expiring' ? 'Vencendo' : 'Pendente'}
                  </Badge>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1">
                      {item.title}
                      {item.file_url && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">📎</span>}
                    </p>
                    {item.expiry_date && <p className="text-xs text-muted-foreground">Val: {format(new Date(item.expiry_date), "dd/MM/yy")}</p>}
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0">
            <TripTimeline
              flights={flights.items}
              accommodations={accommodations.items}
              events={events.items}
              transport={transport.items}
            />
          </TabsContent>

          <TabsContent value="checklist" className="mt-0">
            <TripChecklist tripId={tripId!} />
          </TabsContent>

          <TabsContent value="recommendations" className="mt-0">
            <TripRecommendations
              tripId={tripId!}
              destination={trip.main_destination || ''}
              startDate={trip.start_date}
              endDate={trip.end_date}
              onAddToTrip={(type, item) => {
                if (type === 'meal') meals.create.mutate(item);
                else if (type === 'event') events.create.mutate(item);
              }}
            />
          </TabsContent>

          <TabsContent value="costs" className="mt-0 space-y-4">
            <TripExpenseSummary
              expenses={expenses.items}
              flights={flights.items}
              accommodations={accommodations.items}
              transport={transport.items}
              events={events.items}
              meals={meals.items}
              budget={Number(trip.budget) || 0}
              currency={trip.currency || 'BRL'}
              participants={paidByParticipants}
              onCreate={expenses.create.mutate}
              onUpdate={(id, data) => expenses.update.mutate({ id, ...data })}
              onDelete={expenses.remove.mutate}
              onUpdateItemPaid={(table, id, paid) => {
                const updateMap: Record<string, any> = {
                  trip_flights: flights,
                  trip_accommodations: accommodations,
                  trip_transport: transport,
                  trip_events: events,
                  trip_meals: meals,
                };
                const hook = updateMap[table];
                if (hook) hook.update.mutate({ id, paid });
              }}
            />
            <TripExpenseSplit
              tripId={tripId!}
              expenses={expenses.items}
              flights={flights.items}
              accommodations={accommodations.items}
              transport={transport.items}
              events={events.items}
              meals={meals.items}
              currency={trip.currency || 'BRL'}
              onUpdateExpense={(id, data) => expenses.update.mutate({ id, ...data })}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit trip dialog */}
      <Dialog open={editTrip} onOpenChange={setEditTrip}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Viagem</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={tripForm.name || ''} onChange={e => setTripForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Destino</Label><Input value={tripForm.main_destination || ''} onChange={e => setTripForm((f: any) => ({ ...f, main_destination: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ida</Label><Input type="date" value={tripForm.start_date || ''} onChange={e => setTripForm((f: any) => ({ ...f, start_date: e.target.value }))} /></div>
              <div><Label>Volta</Label><Input type="date" value={tripForm.end_date || ''} onChange={e => setTripForm((f: any) => ({ ...f, end_date: e.target.value }))} /></div>
            </div>
            <div><Label>Orçamento</Label><Input type="number" value={tripForm.budget || ''} onChange={e => setTripForm((f: any) => ({ ...f, budget: Number(e.target.value) }))} /></div>
            <div>
              <Label>Status</Label>
              <Select value={tripForm.status} onValueChange={v => setTripForm((f: any) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIP_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notas</Label><Textarea value={tripForm.notes || ''} onChange={e => setTripForm((f: any) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTrip(false)}>Cancelar</Button>
            <Button onClick={saveTrip} className="bg-sky-500 hover:bg-sky-600">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
