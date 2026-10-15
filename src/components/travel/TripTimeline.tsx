// ============================================================================
// TripTimeline (Linha do Tempo da Viagem)
// Reúne voos, hospedagens, eventos e transportes de uma viagem, ordena tudo
// por data/hora e mostra em uma linha do tempo vertical com ícones coloridos.
// Se nada tiver data cadastrada, exibe uma mensagem convidando a adicionar itens.
// ============================================================================
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plane, Hotel, CalendarDays, Car } from 'lucide-react';
import { format } from 'date-fns';
import type { TripFlight, TripAccommodation, TripEvent, TripTransport } from '@/types/trips';

// Converte um texto de data (ex: "2026-07-28T14:30") em uma data no fuso local,
// sem sofrer com conversões de fuso horário que poderiam mudar o dia/hora.
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
  // Monta a lista única de itens da linha do tempo a partir das quatro fontes
  // (voos, hospedagens, eventos, transportes) e ordena por data. Só recalcula
  // quando algum desses dados muda, para não refazer o trabalho à toa.
  const items = useMemo(() => {
    const all: TimelineItem[] = [];

    // Cada voo vira um item na data de partida (ex: "GOL 1234", "São Paulo → Rio").
    flights.forEach(f => {
      if (f.departure_date) all.push({ id: f.id, date: parseLocal(f.departure_date), type: 'flight', title: `${f.airline || ''} ${f.flight_code || ''}`.trim() || 'Voo', subtitle: `${f.origin || ''} → ${f.destination || ''}` });
    });
    // Cada hospedagem gera dois itens: um no check-in e outro no check-out.
    accommodations.forEach(a => {
      if (a.checkin_date) all.push({ id: a.id + '-in', date: parseLocal(a.checkin_date), type: 'accommodation', title: `Check-in: ${a.name}`, subtitle: a.address || undefined });
      if (a.checkout_date) all.push({ id: a.id + '-out', date: parseLocal(a.checkout_date), type: 'accommodation', title: `Check-out: ${a.name}` });
    });
    // Cada evento/passeio vira um item na sua data.
    events.forEach(e => {
      if (e.event_date) all.push({ id: e.id, date: parseLocal(e.event_date), type: 'event', title: e.title, subtitle: e.location || undefined });
    });
    // Cada transporte (aluguel de carro, traslado, etc.) vira um item na data de início.
    transport.forEach(t => {
      if (t.start_date) all.push({ id: t.id, date: parseLocal(t.start_date), type: 'transport', title: t.transport_type, subtitle: `${t.pickup_location || ''} → ${t.dropoff_location || ''}` });
    });

    // Ordena todos os itens do mais antigo para o mais recente.
    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [flights, accommodations, events, transport]);

  // Define o ícone e a cor usados para cada tipo de item na linha do tempo.
  const icons = { flight: Plane, accommodation: Hotel, event: CalendarDays, transport: Car };
  const colors = { flight: 'text-blue-500', accommodation: 'text-amber-500', event: 'text-violet-500', transport: 'text-emerald-500' };

  // Se não há nenhum item com data, mostra um aviso pedindo para cadastrar itens.
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
          {/* Linha vertical que liga todos os pontos da linha do tempo */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-4">
            {/* Para cada item, desenha o círculo com ícone e as informações ao lado */}
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
