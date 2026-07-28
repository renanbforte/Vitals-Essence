import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Users, Calendar, MapPin, DollarSign, PartyPopper, Utensils, Beer, Gift, Flame, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useGatheringEvents } from '@/hooks/useGatherings';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const EVENT_TYPES = [
  { value: 'churrasco', label: 'Churrasco', icon: Flame },
  { value: 'jantar', label: 'Jantar', icon: Utensils },
  { value: 'festa', label: 'Festa', icon: PartyPopper },
  { value: 'bar', label: 'Bar / Happy Hour', icon: Beer },
  { value: 'presente', label: 'Presente coletivo', icon: Gift },
  { value: 'outro', label: 'Outro', icon: MoreHorizontal },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-amber-500/20 text-amber-400',
  finalized: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Aberto',
  closed: 'Fechado',
  finalized: 'Finalizado',
};

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function Encontros() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: events, isLoading, createEvent, deleteEvent } = useGatheringEvents();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', event_type: 'churrasco', event_date: '', location: '', description: '' });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    try {
      const result = await createEvent.mutateAsync({
        title: form.title.toUpperCase(),
        event_type: form.event_type,
        event_date: form.event_date || null,
        location: form.location || null,
        description: form.description || null,
      } as any);
      setShowCreate(false);
      setForm({ title: '', event_type: 'churrasco', event_date: '', location: '', description: '' });
      navigate(`/encontros/${(result as any).id}`);
    } catch {
      toast({ title: 'Erro ao criar evento', variant: 'destructive' });
    }
  };

  const getTypeIcon = (type: string) => {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found ? found.icon : PartyPopper;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Encontros & Rateios</h1>
              <p className="text-xs text-muted-foreground">Organize sem stress financeiro</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-xl gap-1.5">
            <Plus className="w-4 h-4" />
            Novo
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">Carregando...</div>
        ) : !events?.length ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
            <PartyPopper className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">Nenhum encontro ainda</h3>
            <p className="text-sm text-muted-foreground mb-6">Crie seu primeiro evento e convide os amigos!</p>
            <Button onClick={() => setShowCreate(true)} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Criar Encontro
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {events.map((event, i) => {
              const Icon = getTypeIcon(event.event_type);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all border-border/50 hover:border-primary/30"
                    onClick={() => navigate(`/encontros/${event.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold truncate">{event.title}</h3>
                            {event.user_id !== user?.id && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                Compartilhado
                              </span>
                            )}
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] || ''}`}>
                              {STATUS_LABELS[event.status] || event.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {event.event_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(parseLocalDate(event.event_date), 'dd/MM/yy')}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.participant_count || 0}
                            </span>
                            {(event.total_spent || 0) > 0 && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <DollarSign className="w-3 h-3" />
                                {Number(event.total_spent).toLocaleString('pt-BR', { style: 'currency', currency: event.currency || 'BRL' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Encontro</DialogTitle>
            <DialogDescription>Crie um evento e convide seus amigos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do evento *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Churrasco de sábado" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <Label>Local</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Onde será?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || createEvent.isPending}>
              {createEvent.isPending ? 'Criando...' : 'Criar Encontro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
