import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, DollarSign, Plane, Hotel, Car, CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { EXPENSE_CATEGORIES, type TripExpense, type TripFlight, type TripAccommodation, type TripTransport, type TripEvent, type TripMeal } from '@/types/trips';

interface ParticipantInfo {
  id: string;
  label: string;
  type: 'member' | 'external';
  userId?: string;
  externalId?: string;
}

interface Props {
  expenses: TripExpense[];
  flights?: TripFlight[];
  accommodations?: TripAccommodation[];
  transport?: TripTransport[];
  events?: TripEvent[];
  meals?: TripMeal[];
  budget: number;
  currency: string;
  participants?: ParticipantInfo[];
  onAddParticipant?: () => void;
  onCreate: (data: Record<string, any>) => void;
  onUpdate: (id: string, data: Record<string, any>) => void;
  onDelete: (id: string) => void;
  onUpdateItemPaid?: (table: string, id: string, paid: boolean) => void;
}

function getItemCost(item: any): number {
  const cost = Number(item.cost || item.amount) || 0;
  const mode = item.cost_mode || 'total';
  const qty = Number(item.quantity) || 1;
  return mode === 'unit' ? cost * qty : cost;
}

function getExpenseTotal(e: TripExpense): number {
  const amount = Number(e.amount) || 0;
  const mode = (e as any).cost_mode || 'total';
  const qty = Number((e as any).quantity) || 1;
  return mode === 'unit' ? amount * qty : amount;
}

export default function TripExpenseSummary({ expenses, flights = [], accommodations = [], transport = [], events = [], meals = [], budget, currency, participants = [], onAddParticipant, onCreate, onUpdate, onDelete, onUpdateItemPaid }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  // Item costs by area
  const itemCosts = useMemo(() => {
    const areas = [
      { key: 'flights', label: 'Voos', icon: Plane, items: flights, color: 'text-blue-500' },
      { key: 'accommodations', label: 'Hospedagens', icon: Hotel, items: accommodations, color: 'text-amber-500' },
      { key: 'transport', label: 'Transporte', icon: Car, items: transport, color: 'text-emerald-500' },
      { key: 'events', label: 'Programação', icon: CalendarDays, items: events, color: 'text-violet-500' },
      { key: 'meals', label: 'Alimentação/Mercado', icon: DollarSign, items: meals, color: 'text-rose-500' },
    ];
    return areas.map(a => ({ ...a, total: a.items.reduce((s, i) => s + getItemCost(i), 0) }));
  }, [flights, accommodations, transport, events, meals]);

  const totalItemCosts = useMemo(() => itemCosts.reduce((s, a) => s + a.total, 0), [itemCosts]);

  const totalByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + getExpenseTotal(e);
    });
    return map;
  }, [expenses]);

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + getExpenseTotal(e), 0), [expenses]);
  const totalSpent = totalExpenses + totalItemCosts;

  // Unified list: all items with costs + manual expenses
  const allCostItems = useMemo(() => {
    const items: { id: string; realId: string; table: string; label: string; area: string; areaIcon: any; areaColor: string; total: number; paidByName: string; paid: boolean; date?: string }[] = [];
    const findPaidBy = (item: any) => {
      if (item.paid_by_user_id) {
        const key = `member_${item.paid_by_user_id}`;
        return participants.find(p => p.id === key)?.label || '';
      }
      if (item.paid_by_external_id) {
        const key = `external_${item.paid_by_external_id}`;
        return participants.find(p => p.id === key)?.label || '';
      }
      return '';
    };
    flights.forEach(f => {
      if (getItemCost(f) > 0) items.push({ id: `flight_${f.id}`, realId: f.id, table: 'trip_flights', label: `${f.airline || ''} ${f.flight_code || ''}`.trim() || 'Voo', area: 'Voo', areaIcon: Plane, areaColor: 'text-blue-500', total: getItemCost(f), paidByName: findPaidBy(f), paid: !!(f as any).paid, date: f.departure_date });
    });
    accommodations.forEach(a => {
      if (getItemCost(a) > 0) items.push({ id: `acc_${a.id}`, realId: a.id, table: 'trip_accommodations', label: a.name, area: 'Hospedagem', areaIcon: Hotel, areaColor: 'text-amber-500', total: getItemCost(a), paidByName: findPaidBy(a), paid: !!(a as any).paid, date: a.checkin_date });
    });
    transport.forEach(t => {
      if (getItemCost(t) > 0) items.push({ id: `trans_${t.id}`, realId: t.id, table: 'trip_transport', label: `${t.transport_type} ${t.pickup_location || ''}`.trim(), area: 'Transporte', areaIcon: Car, areaColor: 'text-emerald-500', total: getItemCost(t), paidByName: findPaidBy(t), paid: !!(t as any).paid, date: t.start_date });
    });
    events.forEach(e => {
      if (getItemCost(e) > 0) items.push({ id: `event_${e.id}`, realId: e.id, table: 'trip_events', label: e.title, area: 'Programação', areaIcon: CalendarDays, areaColor: 'text-violet-500', total: getItemCost(e), paidByName: findPaidBy(e), paid: !!(e as any).paid, date: e.event_date });
    });
    meals.forEach(m => {
      if (getItemCost(m) > 0) items.push({ id: `meal_${m.id}`, realId: m.id, table: 'trip_meals', label: m.title, area: 'Alimentação', areaIcon: DollarSign, areaColor: 'text-rose-500', total: getItemCost(m), paidByName: findPaidBy(m), paid: !!(m as any).paid, date: m.meal_date });
    });
    return items;
  }, [flights, accommodations, transport, events, meals, participants]);

  // Paid/pending totals across ALL items + expenses
  const totalPaid = useMemo(() => {
    const expPaid = expenses.filter(e => e.paid).reduce((s, e) => s + getExpenseTotal(e), 0);
    const itemPaid = allCostItems.filter(i => i.paid).reduce((s, i) => s + i.total, 0);
    return expPaid + itemPaid;
  }, [expenses, allCostItems]);
  const totalPending = totalSpent - totalPaid;
  const budgetPercent = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency });

  const openNew = () => { setForm({ category: 'other', paid: false, cost_mode: 'total', quantity: 1, paid_by_key: '' }); setEditingId(null); setShowForm(true); };

  const getPaidByKey = (item: TripExpense) => {
    if (item.paid_by_user_id) return `member_${item.paid_by_user_id}`;
    if (item.paid_by_external_id) return `external_${item.paid_by_external_id}`;
    return '';
  };

  const getPaidByName = (item: TripExpense) => {
    const key = getPaidByKey(item);
    return participants.find(p => p.id === key)?.label || '';
  };

  const parsePaidByKey = (key: string) => {
    if (key.startsWith('member_')) return { paid_by_user_id: key.replace('member_', ''), paid_by_external_id: null };
    if (key.startsWith('external_')) return { paid_by_user_id: null, paid_by_external_id: key.replace('external_', '') };
    return { paid_by_user_id: null, paid_by_external_id: null };
  };
  const openEdit = (item: TripExpense) => {
    setForm({
      item: item.item, category: item.category, amount: item.amount, paid: item.paid,
      expense_date: item.expense_date || '', link: item.link || '', notes: item.notes || '',
      cost_mode: (item as any).cost_mode || 'total',
      quantity: (item as any).quantity || 1,
      paid_by_key: getPaidByKey(item),
    });
    setEditingId(item.id);
    setShowForm(true);
  };
  const handleSave = () => {
    const payload = { ...form };
    payload.cost_mode = payload.cost_mode || 'total';
    payload.quantity = payload.cost_mode === 'unit' ? (Number(payload.quantity) || 1) : 1;
    // Parse paid_by
    const paidBy = parsePaidByKey(payload.paid_by_key || '');
    payload.paid_by_user_id = paidBy.paid_by_user_id;
    payload.paid_by_external_id = paidBy.paid_by_external_id;
    delete payload.paid_by_key;
    if (editingId) onUpdate(editingId, payload);
    else onCreate(payload);
    setShowForm(false);
  };

  const costMode = form.cost_mode || 'total';

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" />Resumo Financeiro</h3>
            <Button size="sm" onClick={openNew} className="gap-1 h-8 bg-sky-500 hover:bg-sky-600"><Plus className="w-3.5 h-3.5" />Despesa</Button>
          </div>
          {budget > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Gasto: {fmt(totalSpent)}</span>
                <span>Orçamento: {fmt(budget)}</span>
              </div>
              <Progress value={budgetPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Restante: {fmt(budget - totalSpent)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Pago</p>
              <p className="font-bold text-green-600">{fmt(totalPaid)}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">A pagar</p>
              <p className="font-bold text-amber-600">{fmt(totalPending)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Costs from Items */}
      {totalItemCosts > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Custos dos Itens</h4>
            <div className="space-y-2">
              {itemCosts.filter(a => a.total > 0).map(area => {
                const Icon = area.icon;
                return (
                  <div key={area.key} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${area.color}`} />
                      {area.label}
                    </span>
                    <span className="font-medium">{fmt(area.total)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm font-semibold">
                <span>Subtotal itens</span>
                <span>{fmt(totalItemCosts)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* By category */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Por Categoria</h4>
          <div className="space-y-2">
            {EXPENSE_CATEGORIES.map(cat => {
              const val = totalByCategory[cat.value] || 0;
              if (val === 0) return null;
              return (
                <div key={cat.value} className="flex items-center justify-between text-sm">
                  <span>{cat.label}</span>
                  <span className="font-medium">{fmt(val)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* All expenses list */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Todas as Despesas</h4>
          {allCostItems.length === 0 && expenses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma despesa registrada.</p>
          ) : (
            <div className="space-y-2">
              {/* Items from categories */}
              {allCostItems.map(item => {
                const Icon = item.areaIcon;
                return (
                  <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={item.paid}
                        onCheckedChange={(checked) => onUpdateItemPaid?.(item.table, item.realId, !!checked)}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${item.areaColor} shrink-0`} />
                          <p className={`font-medium text-sm truncate ${item.paid ? 'line-through text-muted-foreground' : ''}`}>{item.label}</p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{item.area}</Badge>
                          {item.paid && <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Pago</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs font-semibold">{fmt(item.total)}</p>
                          {item.paidByName && (
                            <span className="text-[10px] text-muted-foreground">· Pago por {item.paidByName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Manual expenses */}
              {expenses.map(exp => {
                const cat = EXPENSE_CATEGORIES.find(c => c.value === exp.category);
                const total = getExpenseTotal(exp);
                const isUnit = (exp as any).cost_mode === 'unit';
                return (
                  <div key={exp.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={exp.paid || false}
                        onCheckedChange={(checked) => onUpdate(exp.id, { paid: !!checked })}
                        className="shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <p className={`font-medium text-sm ${exp.paid ? 'line-through text-muted-foreground' : ''}`}>{exp.item}</p>
                          <Badge variant="outline" className="text-[10px]">{cat?.label}</Badge>
                          {exp.paid && <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Pago</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs font-semibold">{fmt(total)}</p>
                          {isUnit && (
                            <span className="text-[10px] text-muted-foreground">
                              ({(exp as any).quantity}x {fmt(Number(exp.amount))})
                            </span>
                          )}
                          {getPaidByName(exp) && (
                            <span className="text-[10px] text-muted-foreground">· Pago por {getPaidByName(exp)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(exp)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Excluir?')) onDelete(exp.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Nova'} Despesa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Item *</Label><Input value={form.item || ''} onChange={e => setForm(f => ({ ...f, item: e.target.value }))} placeholder="Ex: Passagem aérea" /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category || 'other'} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Cost mode toggle */}
            <div className="space-y-2">
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cost_mode: 'total' }))}
                  className={`flex-1 text-xs py-1.5 px-3 rounded-md transition-colors ${costMode === 'total' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                >
                  Valor total
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cost_mode: 'unit', quantity: f.quantity || 1 }))}
                  className={`flex-1 text-xs py-1.5 px-3 rounded-md transition-colors ${costMode === 'unit' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                >
                  Valor unitário
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">{costMode === 'unit' ? 'Valor unitário' : 'Valor total'}</Label>
                  <Input type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
                </div>
                {costMode === 'unit' && (
                  <div className="w-24">
                    <Label className="text-xs">Qtd</Label>
                    <Input type="number" min={1} value={form.quantity || 1} onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))} />
                  </div>
                )}
              </div>
              {costMode === 'unit' && form.amount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Total: {((Number(form.amount) || 0) * (Number(form.quantity) || 1)).toLocaleString('pt-BR', { style: 'currency', currency })}
                </p>
              )}
            </div>

            <div><Label>Data</Label><Input type="date" value={form.expense_date || ''} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.paid || false} onCheckedChange={v => setForm(f => ({ ...f, paid: v }))} />
              <Label>Pago</Label>
            </div>
            <div><Label>Link</Label><Input value={form.link || ''} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} /></div>

            {/* Paid by */}
            {participants.length > 0 && (
              <div>
                <Label>Quem pagou?</Label>
                <Select value={form.paid_by_key || ''} onValueChange={v => setForm(f => ({ ...f, paid_by_key: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {participants.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {participants.length === 0 && onAddParticipant && (
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onAddParticipant}>
                + Adicionar participante para marcar quem pagou
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.item} className="bg-sky-500 hover:bg-sky-600">{editingId ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}