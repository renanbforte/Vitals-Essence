import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Save, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  category: string;
  item_name: string;
  quantity: number;
  packed: boolean;
}

interface Template {
  id: string;
  name: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'roupas', label: '👕 Roupas', icon: '👕' },
  { value: 'higiene', label: '🧴 Higiene/Banheiro', icon: '🧴' },
  { value: 'eletronicos', label: '📱 Eletrônicos', icon: '📱' },
  { value: 'documentos', label: '📄 Documentos', icon: '📄' },
  { value: 'saude', label: '💊 Saúde/Remédios', icon: '💊' },
  { value: 'acessorios', label: '🎒 Acessórios', icon: '🎒' },
  { value: 'alimentacao', label: '🍫 Alimentação', icon: '🍫' },
  { value: 'outros', label: '📦 Outros', icon: '📦' },
];

interface Props {
  tripId: string;
}

export default function TripChecklist({ tripId }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('roupas');
  const [newQty, setNewQty] = useState(1);
  const [showAdd, setShowAdd] = useState(false);

  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    supabase
      .from('trip_checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('category')
      .order('order_index')
      .then(({ data }) => {
        if (data) setItems(data as ChecklistItem[]);
      });
  }, [tripId]);

  // Load templates list
  const fetchTemplates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('trip_checklist_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTemplates(data as Template[]);
  };

  const addItem = async () => {
    if (!newItem.trim() || !user) return;
    const { data, error } = await supabase
      .from('trip_checklist_items')
      .insert({ trip_id: tripId, user_id: user.id, item_name: newItem.trim(), category: newCategory, quantity: newQty })
      .select()
      .single();
    if (error) { toast.error('Erro ao adicionar item'); return; }
    setItems(prev => [...prev, data as ChecklistItem]);
    setNewItem('');
    setNewQty(1);
  };

  const togglePacked = async (item: ChecklistItem) => {
    const packed = !item.packed;
    await supabase.from('trip_checklist_items').update({ packed }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, packed } : i));
  };

  const deleteItem = async (id: string) => {
    await supabase.from('trip_checklist_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Save current checklist as template
  const saveAsTemplate = async () => {
    if (!templateName.trim() || !user || items.length === 0) return;
    const { data: tmpl, error } = await supabase
      .from('trip_checklist_templates')
      .insert({ user_id: user.id, name: templateName.trim() })
      .select()
      .single();
    if (error || !tmpl) { toast.error('Erro ao salvar modelo'); return; }

    const templateItems = items.map((item, idx) => ({
      template_id: (tmpl as Template).id,
      category: item.category,
      item_name: item.item_name,
      quantity: item.quantity,
      order_index: idx,
    }));

    const { error: itemsError } = await supabase
      .from('trip_checklist_template_items')
      .insert(templateItems);

    if (itemsError) { toast.error('Erro ao salvar itens do modelo'); return; }

    toast.success('Modelo salvo com sucesso!');
    setShowSaveDialog(false);
    setTemplateName('');
  };

  // Load template into current trip
  const loadTemplate = async (templateId: string) => {
    if (!user) return;
    const { data: templateItems } = await supabase
      .from('trip_checklist_template_items')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index');

    if (!templateItems || templateItems.length === 0) {
      toast.error('Modelo vazio');
      return;
    }

    const existingNames = new Set(items.map(i => `${i.category}::${i.item_name.toLowerCase()}`));
    const newItems = (templateItems as any[]).filter(
      ti => !existingNames.has(`${ti.category}::${ti.item_name.toLowerCase()}`)
    );

    if (newItems.length === 0) {
      toast.info('Todos os itens já existem na checklist');
      setShowLoadDialog(false);
      return;
    }

    const toInsert = newItems.map(ti => ({
      trip_id: tripId,
      user_id: user.id,
      category: ti.category,
      item_name: ti.item_name,
      quantity: ti.quantity,
      order_index: ti.order_index,
    }));

    const { data: inserted, error } = await supabase
      .from('trip_checklist_items')
      .insert(toInsert)
      .select();

    if (error) { toast.error('Erro ao carregar modelo'); return; }

    setItems(prev => [...prev, ...(inserted as ChecklistItem[])]);
    toast.success(`${newItems.length} itens adicionados!`);
    setShowLoadDialog(false);
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from('trip_checklist_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Modelo excluído');
  };

  const packedCount = items.filter(i => i.packed).length;
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    items: items.filter(i => i.category === cat.value),
  })).filter(g => g.items.length > 0);

  return (
    <>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-violet-100 dark:bg-violet-900/30">
                <CheckSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Checklist de Bagagem</h3>
                <p className="text-xs text-muted-foreground">
                  {items.length === 0 ? '0 itens' : `${packedCount}/${items.length} prontos`}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${(packedCount / items.length) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Template actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => { fetchTemplates(); setShowLoadDialog(true); }}
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Usar modelo salvo
            </Button>
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowSaveDialog(true)}
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Salvar como modelo
              </Button>
            )}
          </div>

          {/* Add new item */}
          {!showAdd ? (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar item
            </Button>
          ) : (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do item..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  className="text-sm"
                  onKeyDown={e => e.key === 'Enter' && addItem()}
                />
                <Input
                  type="number"
                  min={1}
                  value={newQty}
                  onChange={e => setNewQty(Math.max(1, Number(e.target.value)))}
                  className="w-16 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addItem} className="bg-violet-500 hover:bg-violet-600 text-xs">Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs">✕</Button>
              </div>
            </div>
          )}

          {/* Grouped items */}
          {grouped.length === 0 && !showAdd && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum item na checklist.</p>
          )}
          {grouped.map(group => {
            const groupPacked = group.items.filter(i => i.packed).length;
            const allPacked = groupPacked === group.items.length;
            return (
              <div key={group.value} className="border border-border/50 rounded-lg overflow-hidden">
                <div className={`flex items-center justify-between px-3 py-2 ${allPacked ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-muted/30'}`}>
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <span>{group.icon}</span>
                    <span>{group.label.replace(group.icon + ' ', '')}</span>
                  </p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${allPacked ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {groupPacked}/{group.items.length}
                  </span>
                </div>
                <div className="divide-y divide-border/30">
                  {group.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2 group px-3 py-1.5">
                      <Checkbox
                        checked={item.packed}
                        onCheckedChange={() => togglePacked(item)}
                      />
                      <span className={`flex-1 text-sm ${item.packed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.item_name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-medium">×{item.quantity}</span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save template dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Salvar como modelo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Salve esta lista para reutilizar em outras viagens. ({items.length} itens)
          </p>
          <Input
            placeholder="Nome do modelo (ex: Praia, Internacional...)"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancelar</Button>
            <Button onClick={saveAsTemplate} disabled={!templateName.trim()} className="bg-violet-500 hover:bg-violet-600">
              <Save className="w-4 h-4 mr-1" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load template dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Modelos salvos</DialogTitle></DialogHeader>
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum modelo salvo ainda. Crie uma checklist e salve como modelo para reutilizar.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates.map(t => (
                <div key={t.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => loadTemplate(t.id)}>
                      Usar
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteTemplate(t.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
