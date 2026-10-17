// ============================================================================
// CoupleDatesBoard — Bucket list de encontros do casal
// ----------------------------------------------------------------------------
// A lista de dates a dois, organizada em três etapas: Ideias (sonhos),
// Planejados (com data) e Já vivemos (riscados, com avaliação). Mostra o resumo
// no topo, os cartões de cada encontro e as ações de avançar de etapa, riscar
// da lista (marcar como vivido) e editar.
// ============================================================================
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Plus, MapPin, Backpack, Clock, Trash2, Pencil, Star, Lightbulb, CalendarCheck, Sparkles, Car, ArrowDownUp, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCoupleDates, totalDateCost, type CoupleDate } from '@/hooks/useCoupleDates';
import { categoryOf, DATE_CATEGORIES } from './coupleDateCategories';
import { CoupleDateDialog, clearCoupleDateDraft, hasPendingNewCoupleDateDraft } from './CoupleDateDialog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// Opções de ordenação da lista.
const SORTS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'cost_desc', label: 'Mais caro' },
  { value: 'cost_asc', label: 'Mais barato' },
  { value: 'dist_asc', label: 'Mais perto' },
  { value: 'dist_desc', label: 'Mais distante' },
  { value: 'rating', label: 'Melhor avaliados' },
];

export function CoupleDatesBoard() {
  const { dates, loading, addDate, updateDate, markAsDone, deleteDate } = useCoupleDates();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CoupleDate | null>(null);
  const [rating, setRating] = useState<{ date: CoupleDate; stars: number } | null>(null);
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  // Ocultar os custos de todos os encontros (lembra a escolha no aparelho).
  const [hideCosts, setHideCosts] = useState(() => {
    try { return localStorage.getItem('coupleDatesHideCosts') === '1'; } catch { return false; }
  });
  const toggleHideCosts = () => {
    setHideCosts(prev => {
      const next = !prev;
      try { localStorage.setItem('coupleDatesHideCosts', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  // Se o app recarregou com um rascunho de encontro novo não salvo (ex.: você
  // saiu para copiar um endereço em outro app), reabre o formulário com tudo
  // que havia digitado.
  useEffect(() => {
    if (hasPendingNewCoupleDateDraft()) { setEditing(null); setFormOpen(true); }
  }, []);

  // Aplica o filtro por categoria e a ordenação, depois agrupa pelas três etapas.
  const groups = useMemo(() => {
    let list = filterCat === 'all' ? dates : dates.filter(d => d.category === filterCat);
    const cost = (d: CoupleDate) => totalDateCost(d.costs);
    const dist = (d: CoupleDate) => d.distance_km ?? Infinity; // sem distância vai pro fim
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'cost_desc': return cost(b) - cost(a);
        case 'cost_asc': return cost(a) - cost(b);
        case 'dist_asc': return dist(a) - dist(b);
        case 'dist_desc': return (b.distance_km ?? -Infinity) - (a.distance_km ?? -Infinity);
        case 'rating': return (b.rating ?? 0) - (a.rating ?? 0);
        default: return 0; // 'recent' mantém a ordem (created_at desc do banco)
      }
    });
    return {
      idea: list.filter(d => d.status === 'idea'),
      planned: list.filter(d => d.status === 'planned'),
      done: list.filter(d => d.status === 'done'),
    };
  }, [dates, filterCat, sortBy]);

  const openEdit = (d: CoupleDate) => { setEditing(d); setFormOpen(true); };
  const openNew = () => { setEditing(null); setFormOpen(true); };

  if (loading) {
    return <div className="text-center text-muted-foreground py-16">Carregando...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Resumo no topo */}
      <Card className="p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5" />
          <h3 className="font-extrabold">Nossa lista de encontros</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/15 py-2">
            <p className="text-xl font-extrabold">{groups.idea.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/80">Ideias</p>
          </div>
          <div className="rounded-xl bg-white/15 py-2">
            <p className="text-xl font-extrabold">{groups.planned.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/80">Planejados</p>
          </div>
          <div className="rounded-xl bg-white/15 py-2">
            <p className="text-xl font-extrabold">{groups.done.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/80">Vividos</p>
          </div>
        </div>
      </Card>

      <Button onClick={openNew} className="w-full rounded-xl h-11 bg-pink-500 hover:bg-pink-600 text-white font-bold gap-2">
        <Plus className="w-4 h-4" /> Nova ideia de encontro
      </Button>

      {/* Filtro por categoria, ordenação e botão de ocultar custos */}
      {dates.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {DATE_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <span className="flex items-center gap-1.5"><ArrowDownUp className="w-3.5 h-3.5" /><SelectValue /></span>
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHideCosts}
            className="w-full h-9 rounded-xl text-xs gap-1.5 text-muted-foreground"
          >
            {hideCosts ? <><Eye className="w-3.5 h-3.5" /> Mostrar custos</> : <><EyeOff className="w-3.5 h-3.5" /> Ocultar custos</>}
          </Button>
        </div>
      )}

      {dates.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Heart className="w-12 h-12 mx-auto mb-3 text-pink-500/30" />
          <p className="text-sm font-semibold">Sua lista está vazia</p>
          <p className="text-xs">Adicione a primeira ideia de encontro a dois 💕</p>
        </div>
      )}

      {/* Grupos */}
      <Section title="Ideias" icon={Lightbulb} items={groups.idea} empty="Sonhe um encontro novo" hideCosts={hideCosts} onEdit={openEdit} onAdvance={(d) => updateDate(d.id, { status: 'planned' })} advanceLabel="Planejar" onDone={(d) => setRating({ date: d, stars: 0 })} onDelete={deleteDate} />
      <Section title="Planejados" icon={CalendarCheck} items={groups.planned} empty="Marque uma data para um encontro" hideCosts={hideCosts} onEdit={openEdit} onDone={(d) => setRating({ date: d, stars: 0 })} onDelete={deleteDate} />
      <Section title="Já vivemos" icon={Sparkles} items={groups.done} empty="Os encontros vividos aparecem aqui" hideCosts={hideCosts} onEdit={openEdit} onReopen={(d) => updateDate(d.id, { status: 'planned', done_date: null, rating: null })} onDelete={deleteDate} done />

      {/* Formulário de criar/editar */}
      <CoupleDateDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) { setEditing(null); clearCoupleDateDraft(); } }}
        onSubmit={addDate}
        onUpdate={updateDate}
        editDate={editing}
      />

      {/* Avaliação ao marcar como vivido */}
      <Dialog open={!!rating} onOpenChange={(o) => { if (!o) setRating(null); }}>
        <DialogContent className="max-w-xs rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" /> Como foi?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">"{rating?.date.title}"</p>
          <div className="flex justify-center gap-1 my-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(r => r ? { ...r, stars: n } : r)}>
                <Star className={`w-8 h-8 transition-all ${(rating?.stars || 0) >= n ? 'fill-pink-500 text-pink-500' : 'text-muted-foreground/30'}`} />
              </button>
            ))}
          </div>
          <Button
            onClick={async () => { if (rating) { await markAsDone(rating.date.id, rating.stars || undefined); setRating(null); } }}
            className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold"
          >
            Riscar da lista ❤️
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Uma seção (etapa) com seus cartões.
function Section({ title, icon: Icon, items, empty, hideCosts, onEdit, onAdvance, advanceLabel, onDone, onReopen, onDelete, done }: {
  title: string;
  icon: React.ElementType;
  items: CoupleDate[];
  empty: string;
  hideCosts?: boolean;
  onEdit: (d: CoupleDate) => void;
  onAdvance?: (d: CoupleDate) => void;
  advanceLabel?: string;
  onDone?: (d: CoupleDate) => void;
  onReopen?: (d: CoupleDate) => void;
  onDelete: (id: string) => void;
  done?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
        <Icon className="w-3.5 h-3.5 text-pink-500" /> {title} ({items.length})
      </h3>
      {items.map((d, i) => (
        <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <DateCard date={d} hideCosts={hideCosts} onEdit={onEdit} onAdvance={onAdvance} advanceLabel={advanceLabel} onDone={onDone} onReopen={onReopen} onDelete={onDelete} done={done} />
        </motion.div>
      ))}
    </div>
  );
}

// Cartão de um encontro.
function DateCard({ date, hideCosts, onEdit, onAdvance, advanceLabel, onDone, onReopen, onDelete, done }: {
  date: CoupleDate;
  hideCosts?: boolean;
  onEdit: (d: CoupleDate) => void;
  onAdvance?: (d: CoupleDate) => void;
  advanceLabel?: string;
  onDone?: (d: CoupleDate) => void;
  onReopen?: (d: CoupleDate) => void;
  onDelete: (id: string) => void;
  done?: boolean;
}) {
  const cat = categoryOf(date.category);
  const packed = date.items.filter(i => i.packed).length;
  const total = totalDateCost(date.costs);

  return (
    <Card className={`p-3.5 rounded-2xl border-border ${done ? 'bg-muted/30' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-lg shrink-0">{cat.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-bold text-sm truncate ${done ? 'line-through text-muted-foreground' : ''}`}>{date.title}</p>
            {done && date.rating ? (
              <span className="flex items-center gap-0.5 text-[10px] text-pink-500 shrink-0">
                {date.rating}<Star className="w-2.5 h-2.5 fill-pink-500" />
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
            {date.location && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{date.location}</span>}
            {total > 0 && !hideCosts && <span className="text-[10px] font-semibold text-pink-600">{formatCurrency(total)}</span>}
            {date.distance_km != null && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Car className="w-2.5 h-2.5" />{date.distance_km} km</span>}
            {date.planned_date && !done && <span className="text-[10px] text-pink-600 font-medium">{format(parseISO(date.planned_date), "dd 'de' MMM", { locale: ptBR })}</span>}
            {done && date.done_date && <span className="text-[10px] text-muted-foreground">vivido em {format(parseISO(date.done_date), "dd/MM/yy", { locale: ptBR })}</span>}
          </div>
          {/* Indicadores de preparo */}
          {(date.items.length > 0 || date.schedule.length > 0) && (
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
              {date.items.length > 0 && <span className="flex items-center gap-1"><Backpack className="w-3 h-3" />{packed}/{date.items.length}</span>}
              {date.schedule.length > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date.schedule.length} etapas</span>}
            </div>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 mt-3">
        {!done && onDone && (
          <Button size="sm" onClick={() => onDone(date)} className="flex-1 h-8 text-xs gap-1 bg-pink-500 hover:bg-pink-600 text-white">
            <Heart className="w-3.5 h-3.5" /> Vivemos!
          </Button>
        )}
        {onAdvance && advanceLabel && (
          <Button size="sm" variant="outline" onClick={() => onAdvance(date)} className="h-8 text-xs gap-1 border-pink-500/30 text-pink-600">
            <CalendarCheck className="w-3.5 h-3.5" /> {advanceLabel}
          </Button>
        )}
        {done && onReopen && (
          <Button size="sm" variant="outline" onClick={() => onReopen(date)} className="flex-1 h-8 text-xs gap-1 border-pink-500/30 text-pink-600">
            <RotateCcw className="w-3.5 h-3.5" /> Voltar p/ Planejados
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => onEdit(date)}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(date.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </Card>
  );
}
