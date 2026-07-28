import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Users, ShoppingCart, Receipt, BarChart3, Clock,
  Trash2, UserPlus, ArrowRight, Check, XCircle, Pencil, UserCheck, ChevronDown, ChevronRight, Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useGatheringDetail, calculateSplit, type GatheringExpense } from '@/hooks/useGatherings';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendships } from '@/hooks/useFriendships';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const CATEGORIES = [
  'bebida', 'carne', 'mercado', 'restaurante', 'delivery', 'transporte', 'decoração', 'geral', 'outro',
];

interface LineItem {
  name: string;
  quantity: string;
  price: string;
  price_type: 'unit' | 'total';
}

const emptyLine = (): LineItem => ({ name: '', quantity: '1', price: '', price_type: 'unit' });

export default function EncontroDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { friends } = useFriendships();
  const {
    event, participants, expenses, timeline, adjustments, expenseSplitMap, isLoading,
    addParticipant, removeParticipant, addExpense, updateExpense, updateExpenseSplits, deleteExpense,
    addAdjustment, deleteAdjustment, invalidateAll,
  } = useGatheringDetail(eventId);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ from_id: '', to_ids: [] as string[], amount: '', description: '', mode: 'transfer' as 'transfer' | 'dilute' });
  
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<GatheringExpense | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pForm, setPForm] = useState({ name: '', phone: '', email: '' });
  const [eForm, setEForm] = useState({
    expense_type: 'product',
    category: 'geral',
    location: '',
    paid_by_participant_id: '',
    include_in_split: true,
    notes: '',
    splitParticipantIds: [] as string[],
    // receipt mode fields
    receipt_description: '',
    receipt_total: '',
    // product mode: dynamic line items
    lineItems: [emptyLine()] as LineItem[],
    // edit mode single item fields
    edit_description: '',
    edit_quantity: '1',
    edit_unit_price: '',
    edit_total_amount: '',
  });

  // Realtime
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`gathering-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gathering_expenses', filter: `event_id=eq.${eventId}` }, () => invalidateAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gathering_participants', filter: `event_id=eq.${eventId}` }, () => invalidateAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gathering_adjustments', filter: `event_id=eq.${eventId}` }, () => invalidateAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  if (isLoading || !event) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  const isCreator = event.user_id === user?.id;
  const split = calculateSplit(expenses, participants, event.split_mode, event.fixed_amount_per_person, expenseSplitMap, adjustments);

  const handleAddParticipant = async () => {
    if (!pForm.name.trim()) return;
    try {
      await addParticipant.mutateAsync({
        name: pForm.name,
        phone: pForm.phone || null,
        email: pForm.email || null,
        is_external: true,
        status: 'confirmed',
      } as any);
      setShowAddParticipant(false);
      setPForm({ name: '', phone: '', email: '' });
      toast({ title: 'Participante adicionado!' });
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const defaultEForm = {
    expense_type: 'product', category: 'geral', location: '', paid_by_participant_id: '',
    include_in_split: true, notes: '', splitParticipantIds: [] as string[],
    receipt_description: '', receipt_total: '',
    lineItems: [emptyLine()] as LineItem[],
    edit_description: '', edit_quantity: '1', edit_unit_price: '', edit_total_amount: '',
  };

  const openEditExpense = (exp: GatheringExpense) => {
    const splitIds = expenseSplitMap[exp.id] || [];
    setEditingExpense(exp);
    setEForm({
      ...defaultEForm,
      expense_type: exp.expense_type,
      category: exp.category || 'geral',
      location: exp.location || '',
      paid_by_participant_id: exp.paid_by_participant_id || '',
      include_in_split: exp.include_in_split,
      notes: exp.notes || '',
      splitParticipantIds: splitIds.length > 0 && splitIds.length < participants.length ? splitIds : [],
      receipt_description: exp.expense_type === 'receipt' ? exp.description : '',
      receipt_total: exp.expense_type === 'receipt' ? String(exp.total_amount) : '',
      edit_description: exp.description,
      edit_quantity: String(exp.quantity),
      edit_unit_price: String(exp.unit_price),
      edit_total_amount: String(exp.total_amount),
    });
    setShowAddExpense(true);
  };

  const closeExpenseDialog = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
    setEForm(defaultEForm);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...eForm.lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setEForm({ ...eForm, lineItems: updated });
  };

  const addLineItem = () => {
    setEForm({ ...eForm, lineItems: [...eForm.lineItems, emptyLine()] });
  };

  const removeLineItem = (index: number) => {
    if (eForm.lineItems.length <= 1) return;
    setEForm({ ...eForm, lineItems: eForm.lineItems.filter((_, i) => i !== index) });
  };

  const getLineTotal = (line: LineItem) => {
    const qty = Number(line.quantity) || 1;
    const price = Number(line.price) || 0;
    return line.price_type === 'total' ? price : qty * price;
  };

  const handleSaveExpense = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const isReceipt = eForm.expense_type === 'receipt';
    const splitIds = eForm.splitParticipantIds.length > 0 && eForm.splitParticipantIds.length < participants.length
      ? eForm.splitParticipantIds : null;

    try {
      if (editingExpense) {
        // Editing a single expense
        const desc = isReceipt ? eForm.receipt_description : eForm.edit_description;
        if (!desc.trim()) return;
        const qty = Number(eForm.edit_quantity) || 1;
        const unitPrice = Number(eForm.edit_unit_price) || 0;
        const totalAmount = isReceipt ? (Number(eForm.receipt_total) || 0) : qty * unitPrice;

        await updateExpense.mutateAsync({
          id: editingExpense.id,
          expense_type: eForm.expense_type,
          description: desc,
          category: eForm.category,
          quantity: qty,
          unit_price: isReceipt ? totalAmount : unitPrice,
          total_amount: totalAmount,
          location: eForm.location || null,
          paid_by_participant_id: eForm.paid_by_participant_id || null,
          include_in_split: eForm.include_in_split,
          notes: eForm.notes || null,
        } as any);
        await updateExpenseSplits.mutateAsync({
          expenseId: editingExpense.id,
          participantIds: splitIds,
        });
        toast({ title: 'Compra atualizada!' });
      } else if (isReceipt) {
        if (!eForm.receipt_description.trim()) return;
        const totalAmount = Number(eForm.receipt_total) || 0;
        await addExpense.mutateAsync({
          expense_type: 'receipt',
          description: eForm.receipt_description,
          category: eForm.category,
          quantity: 1,
          unit_price: totalAmount,
          total_amount: totalAmount,
          location: eForm.location || null,
          paid_by_participant_id: eForm.paid_by_participant_id || null,
          include_in_split: eForm.include_in_split,
          notes: eForm.notes || null,
          splitParticipantIds: splitIds || undefined,
        } as any);
        toast({ title: 'Compra adicionada!' });
      } else {
        // Product mode: create a group parent + individual children
        const validLines = eForm.lineItems.filter(l => (l.name || '').trim() && Number(l.price) > 0);
        if (validLines.length === 0) return;
        const groupTotal = validLines.reduce((s, l) => s + getLineTotal(l), 0);
        const groupDesc = eForm.receipt_description.trim() || validLines.map(l => l.name).join(', ');

        // Create parent group expense
        const { data: parentData, error: parentError } = await supabase
          .from('gathering_expenses')
          .insert({
            event_id: eventId,
            added_by_user_id: user!.id,
            expense_type: 'product',
            description: groupDesc,
            category: eForm.category,
            quantity: 1,
            unit_price: groupTotal,
            total_amount: groupTotal,
            location: eForm.location || null,
            paid_by_participant_id: eForm.paid_by_participant_id || null,
            include_in_split: eForm.include_in_split,
            notes: eForm.notes || null,
            is_group: true,
          } as any)
          .select()
          .single();
        if (parentError) throw parentError;

        // Handle splits for the parent
        if (splitIds && splitIds.length > 0) {
          const splits = splitIds.map(pid => ({ expense_id: parentData.id, participant_id: pid }));
          await supabase.from('gathering_expense_splits').insert(splits as any);
        }

        // Create children
        for (const line of validLines) {
          const qty = Number(line.quantity) || 1;
          const price = Number(line.price) || 0;
          const total = line.price_type === 'total' ? price : qty * price;
          await addExpense.mutateAsync({
            expense_type: 'product',
            description: line.name,
            category: eForm.category,
            quantity: qty,
            unit_price: line.price_type === 'total' ? (price / qty) : price,
            total_amount: total,
            location: eForm.location || null,
            paid_by_participant_id: eForm.paid_by_participant_id || null,
            include_in_split: eForm.include_in_split,
            notes: null,
            parent_expense_id: parentData.id,
            splitParticipantIds: splitIds || undefined,
          } as any);
        }
        toast({ title: `${validLines.length} item(ns) adicionado(s)!` });
      }
      closeExpenseDialog();
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/encontros')} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{event.title}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {event.event_date && <span>{format(new Date(event.event_date + 'T12:00:00'), 'dd/MM/yyyy')}</span>}
                {event.location && <span>📍 {event.location}</span>}
                <span className="font-semibold text-primary">
                  {split.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: event.currency || 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="expenses" className="text-xs gap-1"><ShoppingCart className="w-3.5 h-3.5" />Compras</TabsTrigger>
            <TabsTrigger value="participants" className="text-xs gap-1"><Users className="w-3.5 h-3.5" />Pessoas</TabsTrigger>
            <TabsTrigger value="split" className="text-xs gap-1"><BarChart3 className="w-3.5 h-3.5" />Rateio</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1"><Clock className="w-3.5 h-3.5" />Timeline</TabsTrigger>
          </TabsList>

          {/* COMPRAS */}
          <TabsContent value="expenses" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Compras & Despesas</h2>
              <Button size="sm" onClick={() => setShowAddExpense(true)} className="rounded-xl gap-1.5">
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </div>
            {expenses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma compra ainda</p>
              </div>
            ) : (
              (() => {
                // Group expenses: parents/groups at top level, children nested
                const childMap: Record<string, typeof expenses> = {};
                const topLevel: typeof expenses = [];
                for (const exp of expenses) {
                  if (exp.parent_expense_id) {
                    if (!childMap[exp.parent_expense_id]) childMap[exp.parent_expense_id] = [];
                    childMap[exp.parent_expense_id].push(exp);
                  } else {
                    topLevel.push(exp);
                  }
                }
                return topLevel.map((exp) => {
                  const children = childMap[exp.id] || [];
                  const isGroup = exp.is_group || children.length > 0;
                  const isExpanded = expandedGroups[exp.id] || false;
                  const payer = participants.find((p) => p.id === exp.paid_by_participant_id);
                  const splitIds = expenseSplitMap[exp.id];
                  const isCustomSplit = splitIds && splitIds.length > 0 && splitIds.length < participants.length;
                  const splitNames = isCustomSplit
                    ? splitIds.map(id => participants.find(p => p.id === id)?.name).filter(Boolean)
                    : null;

                  return (
                    <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                      <Card className="border-border/50">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {isGroup && (
                              <button
                                className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [exp.id]: !prev[exp.id] }))}
                              >
                                {isExpanded
                                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                }
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">{exp.description}</span>
                                {isGroup && (
                                  <Badge variant="secondary" className="text-[10px]">{children.length} {children.length === 1 ? 'item' : 'itens'}</Badge>
                                )}
                                {!exp.include_in_split && <Badge variant="outline" className="text-[10px]">Fora do rateio</Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span className="capitalize">{exp.category}</span>
                                {payer && <span>• Pago por {payer.name}</span>}
                                {exp.location && <span>• {exp.location}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-sm">
                                {Number(exp.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: event.currency || 'BRL' })}
                              </span>
                              {!isGroup && exp.expense_type === 'product' && Number(exp.quantity) > 1 && (
                                <p className="text-[10px] text-muted-foreground">{exp.quantity}x {Number(exp.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => openEditExpense(exp)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive/60 hover:text-destructive" onClick={() => deleteExpense.mutate(exp.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {isCustomSplit && (
                            <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <Users className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground">Dividido entre:</span>
                              {splitNames!.map((name, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5">{name}</Badge>
                              ))}
                            </div>
                          )}
                          {exp.notes && (
                            <p className="mt-1 text-[10px] text-muted-foreground italic">📝 {exp.notes}</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Children / items inside the group */}
                      {isGroup && isExpanded && children.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1 border-l-2 border-border/30 pl-3">
                          {children.map((child) => {
                            const childPayer = participants.find((p) => p.id === child.paid_by_participant_id);
                            const childSplitIds = expenseSplitMap[child.id];
                            const childCustomSplit = childSplitIds && childSplitIds.length > 0 && childSplitIds.length < participants.length;
                            const childSplitNames = childCustomSplit
                              ? childSplitIds.map(id => participants.find(p => p.id === id)?.name).filter(Boolean)
                              : null;
                            return (
                              <Card key={child.id} className="border-border/30 bg-muted/20">
                                <CardContent className="p-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm truncate">{child.description}</span>
                                      <div className="text-[10px] text-muted-foreground">
                                        {Number(child.quantity) > 1 && `${child.quantity}x `}
                                        {Number(child.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        {childPayer && ` • ${childPayer.name}`}
                                      </div>
                                    </div>
                                    <span className="text-sm font-semibold shrink-0">
                                      {Number(child.total_amount).toLocaleString('pt-BR', { style: 'currency', currency: event.currency || 'BRL' })}
                                    </span>
                                    <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => openEditExpense(child)}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => deleteExpense.mutate(child.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  {childCustomSplit && (
                                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                                      <Users className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                                      {childSplitNames!.map((name, i) => (
                                        <Badge key={i} variant="secondary" className="text-[9px] py-0 px-1">{name}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  );
                });
              })()
            )}
          </TabsContent>

          {/* PARTICIPANTES */}
          <TabsContent value="participants" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Participantes ({participants.length})</h2>
              <Button size="sm" onClick={() => setShowAddParticipant(true)} className="rounded-xl gap-1.5">
                <UserPlus className="w-4 h-4" /> Adicionar
              </Button>
            </div>
            {participants.map((p) => {
              const paid = expenses.filter((e) => e.paid_by_participant_id === p.id).reduce((s, e) => s + Number(e.total_amount), 0);
              return (
                <Card key={p.id} className="border-border/50">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{p.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {p.user_id && !p.is_external ? '📱 Membro do app' : 'Externo'}
                        {paid > 0 && ` • Pagou ${paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                      </div>
                    </div>
                    {isCreator && p.user_id !== user?.id && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60" onClick={() => removeParticipant.mutate(p.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* RATEIO */}
          <TabsContent value="split" className="space-y-4">
            {/* Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total gasto</span>
                  <span className="font-bold">{split.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: event.currency || 'BRL' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Média por pessoa</span>
                  <span className="font-bold">{split.fairShare.toLocaleString('pt-BR', { style: 'currency', currency: event.currency || 'BRL' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participantes</span>
                  <span className="font-bold">{participants.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Balances */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Balanço por pessoa</h3>
              {split.balances.map((b) => (
                <div key={b.participant.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {b.participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm">{b.participant.name}</span>
                      <div className="text-[10px] text-muted-foreground">
                        Pagou {b.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · Deve {b.owes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${b.balance > 0.01 ? 'text-emerald-500' : b.balance < -0.01 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {b.balance > 0.01 ? '+' : ''}{b.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Transfer button */}
            {participants.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 rounded-xl"
                onClick={() => {
                  setTransferForm({ from_id: '', to_ids: [], amount: '', description: '', mode: 'transfer' });
                  setShowTransfer(true);
                }}
              >
                <Repeat className="w-4 h-4" /> Transferir valor entre pessoas
              </Button>
            )}

            {/* Active adjustments */}
            {adjustments.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">🔄 Ajustes manuais</h3>
                <div className="space-y-1.5">
                  {adjustments.map((adj) => {
                    const fromP = participants.find(p => p.id === adj.from_participant_id);
                    const toP = participants.find(p => p.id === adj.to_participant_id);
                    return (
                      <Card key={adj.id} className="border-border/30">
                        <CardContent className="p-2.5 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs">
                              <span className="font-medium">{fromP?.name || '?'}</span>
                              <span className="text-muted-foreground"> → </span>
                              <span className="font-medium">{toP?.name || '?'}</span>
                              <span className="text-muted-foreground"> · </span>
                              <span className="font-semibold">{Number(adj.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </p>
                            {adj.description && <p className="text-[10px] text-muted-foreground">{adj.description}</p>}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive shrink-0" onClick={() => deleteAdjustment.mutate(adj.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Settlements */}
            {split.settlements.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">💸 Quem paga pra quem</h3>
                <div className="space-y-2">
                  {split.settlements.map((s, i) => (
                    <Card key={i} className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold">
                          {s.from.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-center">
                          <p className="text-xs text-muted-foreground">{s.from.name}</p>
                          <div className="flex items-center justify-center gap-1">
                            <ArrowRight className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">{s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <ArrowRight className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-xs text-muted-foreground">{s.to.name}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {s.to.name.charAt(0).toUpperCase()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {split.settlements.length === 0 && split.totalSpent > 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Check className="w-10 h-10 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Tudo certo! Ninguém deve nada.</p>
              </div>
            )}
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-3">
            <h2 className="font-semibold">Atividades</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhuma atividade registrada</p>
            ) : (
              timeline.map((entry) => (
                <div key={entry.id} className="flex gap-3 py-2 border-b border-border/20 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{entry.actor_name}</span>{' '}
                      <span className="text-muted-foreground">{entry.details || entry.action}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(entry.created_at), 'dd/MM HH:mm')}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Participant Dialog */}
      <Dialog open={showAddParticipant} onOpenChange={setShowAddParticipant}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Participante</DialogTitle>
            <DialogDescription>Convide um amigo do app ou adicione alguém externo</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="friends">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="friends" className="text-xs gap-1"><UserCheck className="w-3.5 h-3.5" />Amigos do app</TabsTrigger>
              <TabsTrigger value="external" className="text-xs gap-1"><UserPlus className="w-3.5 h-3.5" />Pessoa externa</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-2 mt-3">
              {(() => {
                const participantUserIds = participants.map(p => p.user_id).filter(Boolean);
                const availableFriends = friends.filter(f => {
                  const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
                  return !participantUserIds.includes(friendUserId);
                });
                if (availableFriends.length === 0) {
                  return (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum amigo disponível</p>
                      <p className="text-xs mt-1">Todos já estão no evento ou você ainda não tem amigos conectados.</p>
                    </div>
                  );
                }
                return availableFriends.map(f => {
                  const friendUserId = f.user_id === user?.id ? f.friend_id : f.user_id;
                  const friendName = f.friend_profile?.name || 'Amigo';
                  return (
                    <Card key={f.id} className="border-border/50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {friendName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{friendName}</span>
                          <p className="text-xs text-muted-foreground">Usuário do app</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl gap-1"
                          onClick={async () => {
                            try {
                              await addParticipant.mutateAsync({
                                name: friendName,
                                user_id: friendUserId,
                                is_external: false,
                                status: 'confirmed',
                              } as any);
                              toast({ title: `${friendName} adicionado(a)!` });
                            } catch { toast({ title: 'Erro', variant: 'destructive' }); }
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Convidar
                        </Button>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </TabsContent>

            <TabsContent value="external" className="space-y-3 mt-3">
              <div><Label>Nome *</Label><Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Nome" /></div>
              <div><Label>Telefone</Label><Input value={pForm.phone} onChange={(e) => setPForm({ ...pForm, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
              <div><Label>E-mail</Label><Input value={pForm.email} onChange={(e) => setPForm({ ...pForm, email: e.target.value })} placeholder="email@exemplo.com" /></div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddParticipant(false)}>Cancelar</Button>
                <Button onClick={handleAddParticipant} disabled={!pForm.name.trim()}>Adicionar</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={(open) => { if (!open) closeExpenseDialog(); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Editar Compra' : 'Adicionar Compra'}</DialogTitle>
            <DialogDescription>{editingExpense ? 'Atualize os dados da despesa' : 'Registre uma despesa do evento'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={eForm.expense_type} onValueChange={(v) => setEForm({ ...eForm, expense_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">🛒 Produto por produto</SelectItem>
                  <SelectItem value="receipt">🧾 Nota inteira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={eForm.category} onValueChange={(v) => setEForm({ ...eForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Receipt mode OR Edit mode: single description + value */}
            {(eForm.expense_type === 'receipt' || editingExpense) ? (
              <>
                <div>
                  <Label>Descrição *</Label>
                  <Input
                    value={editingExpense ? eForm.edit_description : eForm.receipt_description}
                    onChange={(e) => editingExpense
                      ? setEForm({ ...eForm, edit_description: e.target.value })
                      : setEForm({ ...eForm, receipt_description: e.target.value })
                    }
                    placeholder={eForm.expense_type === 'receipt' ? 'Ex: Compras do mercado' : 'Ex: Picanha 1kg'}
                  />
                </div>
                {eForm.expense_type === 'receipt' ? (
                  <div><Label>Valor total</Label><Input type="number" step="0.01" value={eForm.receipt_total} onChange={(e) => setEForm({ ...eForm, receipt_total: e.target.value })} placeholder="0,00" /></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Qtd</Label><Input type="number" min="1" value={eForm.edit_quantity} onChange={(e) => setEForm({ ...eForm, edit_quantity: e.target.value })} /></div>
                    <div><Label>Preço unitário</Label><Input type="number" step="0.01" value={eForm.edit_unit_price} onChange={(e) => setEForm({ ...eForm, edit_unit_price: e.target.value })} placeholder="0,00" /></div>
                  </div>
                )}
              </>
            ) : (
              /* Product mode (new): dynamic line items */
              <div className="space-y-2">
                <div>
                  <Label>Nome da compra / recibo</Label>
                  <Input
                    value={eForm.receipt_description}
                    onChange={(e) => setEForm({ ...eForm, receipt_description: e.target.value })}
                    placeholder="Ex: Mercado Extra, Aluguel carro, etc."
                    className="text-sm"
                  />
                </div>
                <Label>Itens</Label>
                {eForm.lineItems.map((line, idx) => (
                  <div key={idx} className="space-y-1.5 p-2.5 rounded-lg border border-border/50 bg-muted/20">
                    <Input
                      value={line.name}
                      onChange={(e) => updateLineItem(idx, 'name', e.target.value)}
                      placeholder="Nome do item"
                      className="text-sm"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px]">Qtd</Label>
                        <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Valor</Label>
                        <Input type="number" step="0.01" value={line.price} onChange={(e) => updateLineItem(idx, 'price', e.target.value)} placeholder="0,00" className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Tipo</Label>
                        <Select value={line.price_type} onValueChange={(v) => updateLineItem(idx, 'price_type', v)}>
                          <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unit">Unitário</SelectItem>
                            <SelectItem value="total">Total</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        Subtotal: {getLineTotal(line).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      {eForm.lineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive/60" onClick={() => removeLineItem(idx)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={addLineItem}>
                  <Plus className="w-3.5 h-3.5" /> Adicionar item
                </Button>
                <div className="text-right text-xs font-semibold text-primary">
                  Total: {eForm.lineItems.reduce((s, l) => s + getLineTotal(l), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            )}
            <div><Label>Local da compra</Label><Input value={eForm.location} onChange={(e) => setEForm({ ...eForm, location: e.target.value })} placeholder="Onde comprou?" /></div>
            <div>
              <Label>Quem pagou?</Label>
              <Select value={eForm.paid_by_participant_id} onValueChange={(v) => setEForm({ ...eForm, paid_by_participant_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Incluir no rateio?</Label>
              <Switch checked={eForm.include_in_split} onCheckedChange={(v) => setEForm({ ...eForm, include_in_split: v })} />
            </div>
            {eForm.include_in_split && participants.length > 1 && (
              <div>
                <Label className="mb-2 block">Dividir entre</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={eForm.splitParticipantIds.length === 0 ? 'default' : 'outline'}
                    className="text-xs h-7 rounded-full"
                    onClick={() => setEForm({ ...eForm, splitParticipantIds: [] })}
                  >
                    Todos
                  </Button>
                  {participants.map((p) => {
                    const isSelected = eForm.splitParticipantIds.length === 0 || eForm.splitParticipantIds.includes(p.id);
                    return (
                      <Button
                        key={p.id}
                        type="button"
                        size="sm"
                        variant={eForm.splitParticipantIds.length > 0 && isSelected ? 'default' : 'outline'}
                        className="text-xs h-7 rounded-full"
                        onClick={() => {
                          let next: string[];
                          if (eForm.splitParticipantIds.length === 0) {
                            // Switch from "all" to individual: select all except this one
                            next = participants.filter(pp => pp.id !== p.id).map(pp => pp.id);
                          } else if (isSelected) {
                            next = eForm.splitParticipantIds.filter(id => id !== p.id);
                          } else {
                            next = [...eForm.splitParticipantIds, p.id];
                          }
                          // If all are selected, reset to "all" mode
                          if (next.length >= participants.length) next = [];
                          // Must have at least 1
                          if (next.length === 0 && eForm.splitParticipantIds.length > 0 && eForm.splitParticipantIds.length <= 1) return;
                          setEForm({ ...eForm, splitParticipantIds: next });
                        }}
                      >
                        {p.name}
                      </Button>
                    );
                  })}
                </div>
                {eForm.splitParticipantIds.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Dividido entre {eForm.splitParticipantIds.length} de {participants.length} participantes
                  </p>
                )}
              </div>
            )}
            <div><Label>Observação</Label><Input value={eForm.notes} onChange={(e) => setEForm({ ...eForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeExpenseDialog}>Cancelar</Button>
            <Button
              onClick={handleSaveExpense}
              disabled={
                isSaving || (
                editingExpense
                  ? !(eForm.expense_type === 'receipt' ? (eForm.receipt_description || '').trim() : (eForm.edit_description || '').trim())
                  : eForm.expense_type === 'receipt'
                    ? !(eForm.receipt_description || '').trim()
                    : !eForm.lineItems.some(l => (l.name || '').trim() && Number(l.price) > 0)
                )
              }
            >
              {isSaving ? 'Salvando...' : editingExpense ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transferir valor</DialogTitle>
            <DialogDescription>Transfira parte da dívida de uma pessoa para outra(s)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Modo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={transferForm.mode === 'transfer' ? 'default' : 'outline'}
                  className="flex-1 text-xs"
                  onClick={() => setTransferForm({ ...transferForm, mode: 'transfer', to_ids: [] })}
                >
                  Transferir para 1 pessoa
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={transferForm.mode === 'dilute' ? 'default' : 'outline'}
                  className="flex-1 text-xs"
                  onClick={() => setTransferForm({ ...transferForm, mode: 'dilute', to_ids: [] })}
                >
                  Diluir entre vários
                </Button>
              </div>
            </div>
            <div>
              <Label>De quem tirar o valor</Label>
              <Select value={transferForm.from_id} onValueChange={(v) => setTransferForm({ ...transferForm, from_id: v, to_ids: transferForm.to_ids.filter(id => id !== v) })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{transferForm.mode === 'transfer' ? 'Para quem transferir' : 'Diluir entre'}</Label>
              {transferForm.mode === 'transfer' ? (
                <Select value={transferForm.to_ids[0] || ''} onValueChange={(v) => setTransferForm({ ...transferForm, to_ids: [v] })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {participants.filter(p => p.id !== transferForm.from_id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {participants.filter(p => p.id !== transferForm.from_id).map((p) => {
                    const selected = transferForm.to_ids.includes(p.id);
                    return (
                      <Button
                        key={p.id}
                        type="button"
                        size="sm"
                        variant={selected ? 'default' : 'outline'}
                        className="text-xs h-7 rounded-full"
                        onClick={() => {
                          const next = selected
                            ? transferForm.to_ids.filter(id => id !== p.id)
                            : [...transferForm.to_ids, p.id];
                          setTransferForm({ ...transferForm, to_ids: next });
                        }}
                      >
                        {p.name}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <Label>Valor total a transferir</Label>
              <Input
                type="number"
                step="0.01"
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                placeholder="0,00"
              />
              {transferForm.mode === 'dilute' && transferForm.to_ids.length > 1 && Number(transferForm.amount) > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {(Number(transferForm.amount) / transferForm.to_ids.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para cada pessoa
                </p>
              )}
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                value={transferForm.description}
                onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                placeholder="Ex: Fulano não dividiu o uber"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancelar</Button>
            <Button
              disabled={!transferForm.from_id || transferForm.to_ids.length === 0 || !Number(transferForm.amount)}
              onClick={async () => {
                const totalAmount = Number(transferForm.amount) || 0;
                if (totalAmount <= 0 || transferForm.to_ids.length === 0) return;
                try {
                  if (transferForm.mode === 'transfer') {
                    await addAdjustment.mutateAsync({
                      from_participant_id: transferForm.from_id,
                      to_participant_id: transferForm.to_ids[0],
                      amount: totalAmount,
                      description: transferForm.description || undefined,
                    });
                  } else {
                    // Dilute: split equally among selected people
                    const perPerson = totalAmount / transferForm.to_ids.length;
                    for (const toId of transferForm.to_ids) {
                      await addAdjustment.mutateAsync({
                        from_participant_id: transferForm.from_id,
                        to_participant_id: toId,
                        amount: Math.round(perPerson * 100) / 100,
                        description: transferForm.description || undefined,
                      });
                    }
                  }
                  toast({ title: 'Transferência registrada!' });
                  setShowTransfer(false);
                } catch {
                  toast({ title: 'Erro ao transferir', variant: 'destructive' });
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
