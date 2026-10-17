// ============================================================================
// CoupleDateDialog — Criar / editar um encontro do casal
// ----------------------------------------------------------------------------
// Janela com tudo de uma ideia de encontro: título, categoria, onde, como fazer,
// a lista do que levar (com check), o cronograma de execução (horário + etapa),
// custo estimado, data planejada e notas. Serve tanto para criar quanto para
// abrir e editar um encontro já salvo.
// ============================================================================
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Clock, Backpack, Plus, Trash2, Check, Heart, Sparkles, CalendarDays, Wallet, Fuel, Car, CircleParking } from 'lucide-react';
import { DATE_CATEGORIES } from './coupleDateCategories';
import { totalDateCost, type CoupleDate, type CoupleDateInput, type DateItem, type DateScheduleStep, type DateCost } from '@/hooks/useCoupleDates';

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

interface CoupleDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CoupleDateInput) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<CoupleDateInput>) => Promise<void>;
  editDate?: CoupleDate | null;
}

// Gera um id curto para itens da lista e etapas do cronograma.
const uid = () => Math.random().toString(36).slice(2, 10);

// --- Rascunho automático (sobrevive a recarregamentos do app) --------------
// Enquanto o formulário está aberto, tudo que foi digitado fica salvo no
// armazenamento local. Se o app recarregar ao voltar de outro aplicativo
// (comportamento do Android), nada é perdido — o rascunho é restaurado.
const DRAFT_KEY = 'coupleDateDraft';
const DRAFT_OPEN_KEY = 'coupleDateDraftOpen';

// Limpa o rascunho salvo (ao salvar com sucesso ou ao fechar de propósito).
export function clearCoupleDateDraft() {
  try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem(DRAFT_OPEN_KEY); } catch { /* ignore */ }
}

// Há um rascunho de encontro NOVO (não salvo) aguardando? Usado para reabrir o
// formulário sozinho quando o app recarrega ao voltar de outro app.
export function hasPendingNewCoupleDateDraft(): boolean {
  try { return localStorage.getItem(DRAFT_OPEN_KEY) === 'new'; } catch { return false; }
}

export function CoupleDateDialog({ open, onOpenChange, onSubmit, onUpdate, editDate }: CoupleDateDialogProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('romantico');
  const [location, setLocation] = useState('');
  const [howTo, setHowTo] = useState('');
  const [notes, setNotes] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [distance, setDistance] = useState('');
  const [items, setItems] = useState<DateItem[]>([]);
  const [schedule, setSchedule] = useState<DateScheduleStep[]>([]);
  const [costs, setCosts] = useState<DateCost[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  // Evita que o primeiro "salvar rascunho" (logo após restaurar) sobrescreva o
  // que acabou de ser carregado.
  const skipNextPersistRef = useRef(false);

  // Ao abrir: carrega os campos do encontro em edição (ou vazio para um novo) e,
  // por cima, restaura qualquer rascunho não salvo do mesmo contexto.
  useEffect(() => {
    if (!open) return;
    const base = editDate
      ? {
          title: editDate.title, category: editDate.category, location: editDate.location || '',
          howTo: editDate.how_to || '', notes: editDate.notes || '',
          distance: editDate.distance_km != null ? String(editDate.distance_km) : '',
          plannedDate: editDate.planned_date || '',
          items: editDate.items || [], schedule: editDate.schedule || [], costs: editDate.costs || [], newItem: '',
        }
      : {
          title: '', category: 'romantico', location: '', howTo: '', notes: '',
          distance: '', plannedDate: '', items: [] as DateItem[], schedule: [] as DateScheduleStep[], costs: [] as DateCost[], newItem: '',
        };

    // Rascunho salvo do mesmo contexto (mesmo encontro, ou "novo").
    let draft: Record<string, unknown> | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if ((d.id ?? null) === (editDate?.id ?? null)) draft = d;
      }
    } catch { /* ignore */ }

    const s = { ...base, ...(draft || {}) } as typeof base;
    setTitle(s.title); setCategory(s.category); setLocation(s.location); setHowTo(s.howTo);
    setNotes(s.notes); setDistance(s.distance); setPlannedDate(s.plannedDate);
    setItems(s.items || []); setSchedule(s.schedule || []); setCosts(s.costs || []); setNewItem(s.newItem || '');
    skipNextPersistRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editDate]);

  // Enquanto aberto, salva o rascunho a cada alteração (não perde nada se o app
  // recarregar ao voltar de outro aplicativo).
  useEffect(() => {
    if (!open) return;
    if (skipNextPersistRef.current) { skipNextPersistRef.current = false; return; }
    try {
      const draft = { id: editDate?.id ?? null, title, category, location, howTo, notes, plannedDate, distance, items, schedule, costs, newItem };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      localStorage.setItem(DRAFT_OPEN_KEY, editDate?.id ?? 'new');
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, title, category, location, howTo, notes, plannedDate, distance, items, schedule, costs, newItem]);

  const reset = () => {
    setTitle(''); setCategory('romantico'); setLocation(''); setHowTo('');
    setNotes(''); setDistance(''); setPlannedDate(''); setItems([]); setSchedule([]); setCosts([]); setNewItem('');
  };

  // --- Lista "o que levar" ---
  const addItem = () => {
    const t = newItem.trim();
    if (!t) return;
    setItems(prev => [...prev, { id: uid(), text: t, packed: false }]);
    setNewItem('');
  };
  const toggleItem = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, packed: !i.packed } : i));
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  // --- Cronograma ---
  const addStep = () => setSchedule(prev => [...prev, { id: uid(), time: '', activity: '' }]);
  const updateStep = (id: string, field: 'time' | 'activity', value: string) =>
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeStep = (id: string) => setSchedule(prev => prev.filter(s => s.id !== id));

  // --- Custos (locais e caminho) ---
  const addCost = (kind: 'place' | 'travel', label = '') =>
    setCosts(prev => [...prev, { id: uid(), kind, label, amount: 0 }]);
  const updateCost = (id: string, field: 'label' | 'amount', value: string) =>
    setCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : c));
  const removeCost = (id: string) => setCosts(prev => prev.filter(c => c.id !== id));
  const placeCosts = costs.filter(c => c.kind === 'place');
  const travelCosts = costs.filter(c => c.kind === 'travel');
  const total = totalDateCost(costs);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const input: CoupleDateInput = {
      title: title.trim(),
      category,
      location: location || null,
      how_to: howTo || null,
      notes: notes || null,
      costs: costs.filter(c => c.label.trim() || c.amount > 0),
      cost_estimate: total || null,
      distance_km: distance ? parseFloat(distance) : null,
      planned_date: plannedDate || null,
      items,
      // Mantém só etapas com alguma informação, ordenadas por horário.
      schedule: schedule.filter(s => s.time || s.activity).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
      // Se marcou uma data, já vira "planejado".
      status: editDate?.status ?? (plannedDate ? 'planned' : 'idea'),
    };
    if (editDate && onUpdate) await onUpdate(editDate.id, input);
    else await onSubmit(input);
    clearCoupleDateDraft();
    reset();
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            {editDate ? 'Editar encontro' : 'Nova ideia de encontro'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-4">
          <div className="space-y-4 pb-2">
            <div>
              <Label>Título *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Piquenique ao pôr do sol" />
            </div>

            {/* Categoria (chips com emoji) */}
            <div>
              <Label className="mb-1.5 block">Categoria</Label>
              <div className="flex flex-wrap gap-1.5">
                {DATE_CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${category === c.value ? 'border-pink-500 bg-pink-500/10 text-pink-600' : 'border-border text-muted-foreground'}`}
                  >
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1 text-xs"><MapPin className="w-3.5 h-3.5" /> Onde (geral)</Label>
                <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bairro / cidade" />
              </div>
              <div>
                <Label className="flex items-center gap-1 text-xs"><Car className="w-3.5 h-3.5" /> Distância (km)</Label>
                <Input type="number" inputMode="decimal" value={distance} onChange={e => setDistance(e.target.value)} placeholder="Ex: 12" />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-1 text-xs"><CalendarDays className="w-3.5 h-3.5" /> Data planejada (opcional)</Label>
              <Input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
            </div>

            <div>
              <Label className="flex items-center gap-1 text-xs"><Sparkles className="w-3.5 h-3.5" /> Como fazer / a ideia</Label>
              <Textarea value={howTo} onChange={e => setHowTo(e.target.value)} rows={2} placeholder="Descreva a ideia, o clima, o plano..." className="resize-none" />
            </div>

            {/* O que levar (checklist) */}
            <div className="rounded-xl border border-border p-3 space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-bold"><Backpack className="w-4 h-4 text-pink-500" /> O que levar</Label>
              {items.map(i => (
                <div key={i.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleItem(i.id)} className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${i.packed ? 'bg-pink-500 border-pink-500 text-white' : 'border-border'}`}>
                    {i.packed && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`flex-1 text-sm ${i.packed ? 'line-through text-muted-foreground' : ''}`}>{i.text}</span>
                  <button type="button" onClick={() => removeItem(i.id)} className="text-muted-foreground/40 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }} placeholder="Adicionar item..." className="h-8 text-sm" />
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-pink-500" onClick={addItem}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Cronograma de execução */}
            <div className="rounded-xl border border-border p-3 space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-bold"><Clock className="w-4 h-4 text-pink-500" /> Cronograma</Label>
              {schedule.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <Input type="time" value={s.time} onChange={e => updateStep(s.id, 'time', e.target.value)} className="h-8 w-24 text-sm shrink-0" />
                  <Input value={s.activity} onChange={e => updateStep(s.id, 'activity', e.target.value)} placeholder="O que fazer" className="h-8 text-sm" />
                  <button type="button" onClick={() => removeStep(s.id)} className="text-muted-foreground/40 hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <Button type="button" size="sm" variant="ghost" className="w-full text-xs gap-1 text-pink-500" onClick={addStep}>
                <Plus className="w-3.5 h-3.5" /> Adicionar etapa
              </Button>
            </div>

            {/* Custos: locais (cada um com valor) e custos do caminho */}
            <div className="rounded-xl border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-sm font-bold"><Wallet className="w-4 h-4 text-pink-500" /> Custos</Label>
                <span className="text-sm font-extrabold text-pink-600 tabular-nums">{formatBRL(total)}</span>
              </div>

              {/* Locais */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Locais</p>
                {placeCosts.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Input value={c.label} onChange={e => updateCost(c.id, 'label', e.target.value)} placeholder="Nome do local" className="h-8 text-sm flex-1" />
                    <Input type="number" inputMode="decimal" value={c.amount || ''} onChange={e => updateCost(c.id, 'amount', e.target.value)} placeholder="R$" className="h-8 w-24 text-sm text-right" />
                    <button type="button" onClick={() => removeCost(c.id)} className="text-muted-foreground/40 hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" className="w-full text-xs gap-1 text-pink-500 h-7" onClick={() => addCost('place')}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar local
                </Button>
              </div>

              {/* Custos do caminho */}
              <div className="space-y-1.5 pt-1 border-t border-border/50">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Car className="w-3 h-3" /> Caminho</p>
                {travelCosts.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Input value={c.label} onChange={e => updateCost(c.id, 'label', e.target.value)} placeholder="Ex: Gasolina" className="h-8 text-sm flex-1" />
                    <Input type="number" inputMode="decimal" value={c.amount || ''} onChange={e => updateCost(c.id, 'amount', e.target.value)} placeholder="R$" className="h-8 w-24 text-sm text-right" />
                    <button type="button" onClick={() => removeCost(c.id)} className="text-muted-foreground/40 hover:text-destructive shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {/* Atalhos para os custos mais comuns */}
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => addCost('travel', 'Gasolina')} className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-muted/70 flex items-center gap-1"><Fuel className="w-3 h-3" /> Gasolina</button>
                  <button type="button" onClick={() => addCost('travel', 'Pedágio')} className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-muted/70 flex items-center gap-1"><Car className="w-3 h-3" /> Pedágio</button>
                  <button type="button" onClick={() => addCost('travel', 'Estacionamento')} className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-muted/70 flex items-center gap-1"><CircleParking className="w-3 h-3" /> Estacionamento</button>
                  <button type="button" onClick={() => addCost('travel')} className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-muted/70 flex items-center gap-1"><Plus className="w-3 h-3" /> Outro</button>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observações, links, lembretes..." className="resize-none" />
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 pt-2 border-t border-border">
          <Button onClick={handleSubmit} disabled={!title.trim() || saving} className="w-full rounded-xl h-11 bg-pink-500 hover:bg-pink-600 text-white font-bold">
            {saving ? 'Salvando...' : editDate ? 'Salvar alterações' : 'Adicionar à lista 💕'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
