import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, Hotel, CalendarDays, Car } from 'lucide-react';
import { format } from 'date-fns';
import type { TripFlight, TripAccommodation, TripEvent, TripTransport } from '@/types/trips';

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

interface Props {
  flights: TripFlight[];
  accommodations: TripAccommodation[];
  events: TripEvent[];
  transport: TripTransport[];
}

interface TimelineItem {
  id: string;
  date: Date;
  type: 'flight' | 'accommodation' | 'event' | 'transport';
  title: string;
  subtitle?: string;
}

export default function TripTimeline({ flights, accommodations, events, transport }: Props) {
  const items = useMemo(() => {
    const all: TimelineItem[] = [];

    flights.forEach(f => {
      if (f.departure_date) all.push({ id: f.id, date: parseLocal(f.departure_date), type: 'flight', title: `${f.airline || ''} ${f.flight_code || ''}`.trim() || 'Voo', subtitle: `${f.origin || ''} → ${f.destination || ''}` });
    });
    accommodations.forEach(a => {
      if (a.checkin_date) all.push({ id: a.id + '-in', date: parseLocal(a.checkin_date), type: 'accommodation', title: `Check-in: ${a.name}`, subtitle: a.address || undefined });
      if (a.checkout_date) all.push({ id: a.id + '-out', date: parseLocal(a.checkout_date), type: 'accommodation', title: `Check-out: ${a.name}` });
    });
    events.forEach(e => {
      if (e.event_date) all.push({ id: e.id, date: parseLocal(e.event_date), type: 'event', title: e.title, subtitle: e.location || undefined });
    });
    transport.forEach(t => {
      if (t.start_date) all.push({ id: t.id, date: parseLocal(t.start_date), type: 'transport', title: t.transport_type, subtitle: `${t.pickup_location || ''} → ${t.dropoff_location || ''}` });
    });

    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [flights, accommodations, events, transport]);

  const icons = { flight: Plane, accommodation: Hotel, event: CalendarDays, transport: Car };
  const colors = { flight: 'text-blue-500', accommodation: 'text-amber-500', event: 'text-violet-500', transport: 'text-emerald-500' };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Adicione voos, hospedagens, eventos ou transportes com datas para ver a linha do tempo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4">Linha do Tempo</h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {items.map(item => {
              const Icon = icons[item.type];
              return (
                <div key={item.id} className="flex gap-3 relative">
                  <div className={`w-9 h-9 rounded-full bg-background border-2 border-border flex items-center justify-center z-10 shrink-0 ${colors[item.type]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="pt-1.5">
                    <p className="text-xs text-muted-foreground font-medium">{format(item.date, "dd/MM/yy HH:mm")}</p>
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
