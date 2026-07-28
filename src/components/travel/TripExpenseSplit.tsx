import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users, ArrowRight, UserPlus, Phone, Mail, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTripItems } from '@/hooks/useTripItems';
import { useFriendships } from '@/hooks/useFriendships';
import type { TripExpense, TripSplitParticipant, TripExpenseSplitEntry, TripFlight, TripAccommodation, TripTransport, TripEvent, TripMeal } from '@/types/trips';


interface Props {
  tripId: string;
  expenses: TripExpense[];
  flights?: TripFlight[];
  accommodations?: TripAccommodation[];
  transport?: TripTransport[];
  events?: TripEvent[];
  meals?: TripMeal[];
  currency: string;
  onUpdateExpense: (id: string, data: Record<string, any>) => void;
}

interface MemberInfo {
  id: string;
  type: 'member' | 'external';
  userId?: string;
  externalId?: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function TripExpenseSplit({ tripId, expenses, flights = [], accommodations = [], transport = [], events = [], meals = [], currency, onUpdateExpense }: Props) {
  const { user } = useAuth();
  const { friends } = useFriendships();
  const splitParticipants = useTripItems<TripSplitParticipant>('trip_split_participants', tripId);
  const splitEntries = useTripItems<TripExpenseSplitEntry>('trip_expense_splits', tripId);

  const [tripMembers, setTripMembers] = useState<{ user_id: string; name: string }[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [personForm, setPersonForm] = useState({ name: '', phone: '', email: '' });
  const [showExpenseSplit, setShowExpenseSplit] = useState<string | null>(null);
  const [editingShares, setEditingShares] = useState<Record<string, number>>({});
  const [paidBy, setPaidBy] = useState<string>('');

  // Fetch trip members with names
  useEffect(() => {
    const fetchMembers = async () => {
      const { data: members } = await supabase
        .from('trip_members')
        .select('user_id')
        .eq('trip_id', tripId)
        .eq('status', 'accepted');

      const { data: trip } = await supabase
        .from('trips')
        .select('user_id')
        .eq('id', tripId)
        .single();

      const userIds = new Set<string>();
      if (trip) userIds.add(trip.user_id);
      members?.forEach(m => userIds.add(m.user_id));

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', Array.from(userIds));
        setTripMembers(profiles || []);
      }
    };
    fetchMembers();
  }, [tripId]);

  // All participants (members + external)
  const allParticipants = useMemo((): MemberInfo[] => {
    const members: MemberInfo[] = tripMembers.map(m => ({
      id: `member_${m.user_id}`,
      type: 'member',
      userId: m.user_id,
      name: m.name,
    }));
    const external: MemberInfo[] = splitParticipants.items.map(p => ({
      id: `external_${p.id}`,
      type: 'external',
      externalId: p.id,
      name: p.name,
      phone: p.phone || undefined,
      email: p.email || undefined,
    }));
    return [...members, ...external];
  }, [tripMembers, splitParticipants.items]);

  // Friends not yet in participants
  const availableFriends = useMemo(() => {
    const existingUserIds = new Set(tripMembers.map(m => m.user_id));
    const existingExtNames = new Set(splitParticipants.items.map(p => p.name.toLowerCase()));
    return friends
      .filter(f => {
        const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
        const friendName = f.friend_profile?.name || '';
        return !existingUserIds.has(friendUserId) && !existingExtNames.has(friendName.toLowerCase());
      })
      .map(f => ({
        userId: f.user_id === user?.id ? f.friend_id : f.user_id,
        name: f.friend_profile?.name || 'Amigo',
      }));
  }, [friends, tripMembers, splitParticipants.items, user?.id]);

  const handleAddFriend = (friendName: string) => {
    splitParticipants.create.mutate({
      name: friendName,
      phone: null,
      email: null,
    });
  };

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency });

  const getItemCost = (item: any): number => {
    const cost = Number(item.cost || item.amount) || 0;
    const mode = item.cost_mode || 'total';
    const qty = Number(item.quantity) || 1;
    return mode === 'unit' ? cost * qty : cost;
  };

  const getExpenseTotal = (e: TripExpense) => {
    const amount = Number(e.amount) || 0;
    const mode = (e as any).cost_mode || 'total';
    const qty = Number((e as any).quantity) || 1;
    return mode === 'unit' ? amount * qty : amount;
  };

  // Unified list of all splittable items (expenses + category items with cost)
  const allSplittableItems = useMemo(() => {
    const items: { id: string; label: string; area: string; total: number; split_enabled?: boolean; isExpense: boolean }[] = [];
    // Manual expenses
    expenses.forEach(e => {
      items.push({ id: e.id, label: e.item, area: 'Despesa', total: getExpenseTotal(e), split_enabled: e.split_enabled || false, isExpense: true });
    });
    // Flights
    flights.forEach(f => {
      const cost = getItemCost(f);
      if (cost > 0) items.push({ id: f.id, label: `${f.airline || ''} ${f.flight_code || ''}`.trim() || 'Voo', area: 'Voo', total: cost, split_enabled: (f as any).split_enabled || false, isExpense: false });
    });
    // Accommodations
    accommodations.forEach(a => {
      const cost = getItemCost(a);
      if (cost > 0) items.push({ id: a.id, label: a.name, area: 'Hospedagem', total: cost, split_enabled: (a as any).split_enabled || false, isExpense: false });
    });
    // Transport
    transport.forEach(t => {
      const cost = getItemCost(t);
      if (cost > 0) items.push({ id: t.id, label: `${t.transport_type} ${t.pickup_location || ''}`.trim(), area: 'Transporte', total: cost, split_enabled: (t as any).split_enabled || false, isExpense: false });
    });
    // Events
    events.forEach(e => {
      const cost = getItemCost(e);
      if (cost > 0) items.push({ id: e.id, label: e.title, area: 'Programação', total: cost, split_enabled: (e as any).split_enabled || false, isExpense: false });
    });
    // Meals
    meals.forEach(m => {
      const cost = getItemCost(m);
      if (cost > 0) items.push({ id: m.id, label: m.title, area: 'Alimentação', total: cost, split_enabled: (m as any).split_enabled || false, isExpense: false });
    });
    return items;
  }, [expenses, flights, accommodations, transport, events, meals]);

  // Calculate balances
  const balances = useMemo(() => {
    const bal: Record<string, { name: string; paid: number; owes: number }> = {};
    allParticipants.forEach(p => {
      bal[p.id] = { name: p.name, paid: 0, owes: 0 };
    });

    // Go through split entries
    splitEntries.items.forEach(entry => {
      const key = entry.participant_type === 'member'
        ? `member_${entry.participant_user_id}`
        : `external_${entry.participant_external_id}`;
      if (bal[key]) {
        bal[key].paid += Number(entry.paid_amount) || 0;
        bal[key].owes += Number(entry.share_amount) || 0;
      }
    });

    return bal;
  }, [allParticipants, splitEntries.items]);

  // Settlement calculation
  const settlements = useMemo(() => {
    const netBalances: { id: string; name: string; balance: number }[] = [];
    Object.entries(balances).forEach(([id, b]) => {
      const net = b.paid - b.owes;
      if (Math.abs(net) > 0.01) {
        netBalances.push({ id, name: b.name, balance: net });
      }
    });

    const debtors = netBalances.filter(b => b.balance < 0).map(b => ({ ...b, balance: -b.balance }));
    const creditors = netBalances.filter(b => b.balance > 0);

    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const transfers: { from: string; to: string; amount: number }[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(debtors[di].balance, creditors[ci].balance);
      if (amount > 0.01) {
        transfers.push({ from: debtors[di].name, to: creditors[ci].name, amount });
      }
      debtors[di].balance -= amount;
      creditors[ci].balance -= amount;
      if (debtors[di].balance < 0.01) di++;
      if (creditors[ci].balance < 0.01) ci++;
    }
    return transfers;
  }, [balances]);

  const handleAddPerson = () => {
    if (!personForm.name.trim()) return;
    splitParticipants.create.mutate({
      name: personForm.name.trim(),
      phone: personForm.phone || null,
      email: personForm.email || null,
    });
    setPersonForm({ name: '', phone: '', email: '' });
    setShowAddPerson(false);
  };

  const handleDeletePerson = (id: string) => {
    if (confirm('Remover esta pessoa do rateio?')) {
      splitParticipants.remove.mutate(id);
    }
  };

  const openItemSplit = (item: { id: string; total: number }) => {
    setShowExpenseSplit(item.id);
    const existing = splitEntries.items.filter(e => e.expense_id === item.id);
    const shares: Record<string, number> = {};
    let foundPaidBy = '';

    if (existing.length > 0) {
      existing.forEach(e => {
        const key = e.participant_type === 'member'
          ? `member_${e.participant_user_id}`
          : `external_${e.participant_external_id}`;
        shares[key] = Number(e.share_amount) || 0;
        if ((Number(e.paid_amount) || 0) > 0) foundPaidBy = key;
      });
    } else {
      const perPerson = allParticipants.length > 0 ? item.total / allParticipants.length : 0;
      allParticipants.forEach(p => { shares[p.id] = Math.round(perPerson * 100) / 100; });
      const me = allParticipants.find(p => p.userId === user?.id);
      if (me) foundPaidBy = me.id;
    }

    setEditingShares(shares);
    setPaidBy(foundPaidBy);
  };

  const saveSplit = async (itemId: string) => {
    const item = allSplittableItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = splitEntries.items.filter(e => e.expense_id === itemId);
    for (const e of existing) {
      await splitEntries.remove.mutateAsync(e.id);
    }

    const total = item.total;
    for (const [key, shareAmount] of Object.entries(editingShares)) {
      const participant = allParticipants.find(p => p.id === key);
      if (!participant) continue;

      await splitEntries.create.mutateAsync({
        expense_id: itemId,
        participant_type: participant.type,
        participant_user_id: participant.userId || null,
        participant_external_id: participant.externalId || null,
        share_amount: shareAmount,
        paid_amount: key === paidBy ? total : 0,
      });
    }

    if (item.isExpense) {
      onUpdateExpense(itemId, { split_enabled: true });
    }
    setShowExpenseSplit(null);
  };

  const currentSplitItem = showExpenseSplit ? allSplittableItems.find(i => i.id === showExpenseSplit) : null;
  const splitExpenseTotal = currentSplitItem?.total || 0;
  const totalShares = Object.values(editingShares).reduce((s, v) => s + v, 0);

  const distributeEqual = () => {
    const perPerson = allParticipants.length > 0 ? splitExpenseTotal / allParticipants.length : 0;
    const shares: Record<string, number> = {};
    allParticipants.forEach(p => { shares[p.id] = Math.round(perPerson * 100) / 100; });
    setEditingShares(shares);
  };

  

  return (
    <div className="space-y-4">
      {/* Participants */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4" />Participantes do Rateio</h3>
            <Button size="sm" onClick={() => setShowAddPerson(true)} className="gap-1 h-8 bg-sky-500 hover:bg-sky-600">
              <UserPlus className="w-3.5 h-3.5" />Pessoa
            </Button>
          </div>

          {allParticipants.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum participante. Membros da viagem e pessoas externas aparecerão aqui.</p>
          ) : (
            <div className="space-y-2">
              {allParticipants.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{p.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {p.type === 'member' ? 'Membro' : 'Externo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>}
                      {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>}
                    </div>
                  </div>
                  {p.type === 'external' && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeletePerson(p.externalId!)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense split assignment */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Despesas para Ratear</h4>
          {allSplittableItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Adicione despesas ou itens com custo primeiro.</p>
          ) : (
            <div className="space-y-2">
              {allSplittableItems.map(item => {
                const hasSplitEntries = splitEntries.items.some(e => e.expense_id === item.id);
                const isSplit = item.split_enabled || hasSplitEntries;
                return (
                  <div key={item.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{item.label}</p>
                        {!item.isExpense && <Badge variant="outline" className="text-[10px]">{item.area}</Badge>}
                      </div>
                      <p className="text-xs font-semibold">{fmt(item.total)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSplit && <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Rateado</Badge>}
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openItemSplit(item)}
                        disabled={allParticipants.length === 0}>
                        {isSplit ? 'Editar' : 'Ratear'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {allParticipants.length === 0 && allSplittableItems.length > 0 && (
            <p className="text-[10px] text-amber-600">Adicione participantes para habilitar o rateio.</p>
          )}
        </CardContent>
      </Card>

      {/* Balances & Settlement - always show when there are participants */}
      {allParticipants.length > 0 && (
        <>
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo por Pessoa</h4>
              <div className="space-y-2">
                {Object.entries(balances).map(([id, b]) => {
                  const net = b.paid - b.owes;
                  return (
                    <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm bg-muted/30 rounded-lg p-3 gap-1">
                      <span className="font-medium">{b.name}</span>
                      <div className="sm:text-right flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-xs text-muted-foreground">Pagou: {fmt(b.paid)} · Deve: {fmt(b.owes)}</p>
                        <p className={`text-xs font-bold ${net > 0.01 ? 'text-green-600' : net < -0.01 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {net > 0.01 ? `Recebe ${fmt(net)}` : net < -0.01 ? `Deve ${fmt(-net)}` : 'Zerado'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {allParticipants.length > 1 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acerto de Contas</h4>
                {settlements.length > 0 ? (
                  <div className="space-y-2">
                    {settlements.map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg p-3">
                        <span className="font-medium text-red-600">{t.from}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-green-600">{t.to}</span>
                        <span className="ml-auto font-bold">{fmt(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhuma pendência. Todos os saldos estão zerados.</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add person dialog */}
      <Dialog open={showAddPerson} onOpenChange={setShowAddPerson}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Pessoa ao Rateio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Friends list */}
            {availableFriends.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amigos Conectados</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {availableFriends.map(f => (
                    <div key={f.userId} className="flex items-center justify-between bg-muted/40 rounded-lg p-2.5">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{f.name}</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { handleAddFriend(f.name); setShowAddPerson(false); }}>
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableFriends.length > 0 && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou pessoa externa</span></div>
              </div>
            )}

            {/* External person form */}
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={personForm.name} onChange={e => setPersonForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" /></div>
              <div><Label>Telefone</Label><Input value={personForm.phone} onChange={e => setPersonForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 11 99999-9999" /></div>
              <div><Label>Email</Label><Input type="email" value={personForm.email} onChange={e => setPersonForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPerson(false)}>Cancelar</Button>
            <Button onClick={handleAddPerson} disabled={!personForm.name.trim()} className="bg-sky-500 hover:bg-sky-600">Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense split dialog */}
      <Dialog open={!!showExpenseSplit} onOpenChange={(v) => !v && setShowExpenseSplit(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Ratear: {currentSplitItem?.label}</DialogTitle></DialogHeader>
          {currentSplitItem && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Valor total</p>
                <p className="text-lg font-bold">{fmt(splitExpenseTotal)}</p>
              </div>

              {/* Who paid */}
              <div>
                <Label className="text-xs font-semibold">Quem pagou?</Label>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {allParticipants.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shares */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Divisão</Label>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={distributeEqual}>Dividir igual</Button>
                </div>
                {allParticipants.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1 min-w-0 truncate">{p.name}</span>
                    <Input
                      type="number"
                      className="w-28 h-8 text-sm"
                      value={editingShares[p.id] ?? 0}
                      onChange={e => setEditingShares(s => ({ ...s, [p.id]: Number(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
                <div className={`text-xs font-medium text-right ${Math.abs(totalShares - splitExpenseTotal) > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
                  Soma: {fmt(totalShares)} / {fmt(splitExpenseTotal)}
                  {Math.abs(totalShares - splitExpenseTotal) > 0.01 && ' ⚠️ Diferença!'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseSplit(null)}>Cancelar</Button>
            <Button onClick={() => showExpenseSplit && saveSplit(showExpenseSplit)} disabled={!paidBy} className="bg-sky-500 hover:bg-sky-600">Salvar Rateio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
