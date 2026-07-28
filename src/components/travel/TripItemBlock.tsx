import { useState, useRef, ReactNode, useEffect } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, ChevronDown, ChevronUp, Copy, Upload, Loader2, FileDown, Paperclip, Image, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PaidByOption {
  id: string;
  label: string;
}

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'url' | 'textarea' | 'select' | 'location' | 'file' | 'paid_by';
  required?: boolean;
  options?: { value: string; label: string }[];
  accept?: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
}

interface Props {
  title: string;
  sectionImage: string;
  color: string;
  items: any[];
  fields: FieldDef[];
  tripId: string;
  parentType: string;
  paidByOptions?: PaidByOption[];
  onAddParticipant?: () => void;
  onCreate: (data: Record<string, any>) => void;
  onUpdate: (id: string, data: Record<string, any>) => void;
  onDelete: (id: string) => void;
  renderItem: (item: any) => ReactNode;
}

const _IGNORED_KEYS = ['id', 'trip_id', 'user_id', 'created_at', 'updated_at', 'order_index'];

const COST_KEYS = ['cost', 'amount'];

export default function TripItemBlock({ title, sectionImage, color, items, fields, tripId, parentType, paidByOptions = [], onAddParticipant, onCreate, onUpdate, onDelete, renderItem }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Attachments state
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [attachUploading, setAttachUploading] = useState(false);
  const [showAttachments, setShowAttachments] = useState<string | null>(null);

  const hasCostField = fields.some(f => COST_KEYS.includes(f.key));

  // Load attachments for all items
  useEffect(() => {
    if (!expanded || items.length === 0) return;
    const itemIds = items.map(i => i.id);
    supabase
      .from('trip_attachments')
      .select('*')
      .eq('trip_id', tripId)
      .eq('parent_type', parentType)
      .in('parent_id', itemIds)
      .then(({ data }) => {
        if (data) {
          const grouped: Record<string, Attachment[]> = {};
          data.forEach((a: any) => {
            if (!grouped[a.parent_id]) grouped[a.parent_id] = [];
            grouped[a.parent_id].push(a);
          });
          setAttachments(grouped);
        }
      });
  }, [expanded, items, tripId, parentType]);

  const uploadAttachment = async (file: File, itemId: string) => {
    if (!user) return;
    setAttachUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('trip-files').upload(path, file);
      if (uploadErr) throw uploadErr;
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      const { data, error } = await supabase
        .from('trip_attachments')
        .insert({ trip_id: tripId, parent_id: itemId, parent_type: parentType, file_name: file.name, file_url: path, file_type: fileType, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setAttachments(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), data as Attachment],
      }));
      toast.success('Anexo adicionado!');
    } catch {
      toast.error('Erro ao anexar arquivo');
    } finally {
      setAttachUploading(false);
    }
  };

  const deleteAttachment = async (attachId: string, parentId: string) => {
    const { error } = await supabase.from('trip_attachments').delete().eq('id', attachId);
    if (!error) {
      setAttachments(prev => ({
        ...prev,
        [parentId]: (prev[parentId] || []).filter(a => a.id !== attachId),
      }));
    }
  };

  const downloadFile = async (path: string, fileName?: string) => {
    try {
      const { data, error } = await supabase.storage.from('trip-files').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || path.split('/').pop() || 'file';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleFileUpload = async (file: File, fieldKey: string) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('trip-files').upload(path, file);
      if (error) throw error;
      setForm(f => ({ ...f, [fieldKey]: path }));
      toast.success('Arquivo enviado!');
    } catch {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setForm(hasCostField ? { cost_mode: 'total', quantity: 1 } : {});
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: any) => {
    const data: Record<string, any> = {};
    fields.forEach(f => {
      if (f.type === 'paid_by') {
        // Build paid_by_key from actual columns
        if (item.paid_by_user_id) data[f.key] = `member_${item.paid_by_user_id}`;
        else if (item.paid_by_external_id) data[f.key] = `external_${item.paid_by_external_id}`;
        else data[f.key] = '';
        return;
      }
      let val = item[f.key] ?? '';
      if (f.type === 'datetime-local' && val && typeof val === 'string') {
        val = val.substring(0, 16);
      }
      data[f.key] = val;
    });
    if (hasCostField) {
      data.cost_mode = item.cost_mode || 'total';
      data.quantity = item.quantity || 1;
    }
    setForm(data);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = { ...form };
    if (hasCostField) {
      payload.cost_mode = payload.cost_mode || 'total';
      payload.quantity = payload.cost_mode === 'unit' ? (Number(payload.quantity) || 1) : 1;
    } else {
      delete payload.cost_mode;
      delete payload.quantity;
    }
    // Parse paid_by_key into actual columns
    const paidByFields = fields.filter(f => f.type === 'paid_by');
    paidByFields.forEach(f => {
      const key = payload[f.key] || '';
      delete payload[f.key];
      if (key.startsWith('member_')) {
        payload.paid_by_user_id = key.replace('member_', '');
        payload.paid_by_external_id = null;
      } else if (key.startsWith('external_')) {
        payload.paid_by_user_id = null;
        payload.paid_by_external_id = key.replace('external_', '');
      } else {
        payload.paid_by_user_id = null;
        payload.paid_by_external_id = null;
      }
    });
    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onCreate(payload);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este item?')) onDelete(id);
  };

  const handleDuplicate = (item: any) => {
    const data: Record<string, any> = {};
    fields.forEach(f => { data[f.key] = item[f.key] ?? ''; });
    if (hasCostField) {
      data.cost_mode = item.cost_mode || 'total';
      data.quantity = item.quantity || 1;
    }
    onCreate(data);
  };

  const renderCostFields = (costKey: string) => {
    const costMode = form.cost_mode || 'total';
    return (
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
            <Input
              type="number"
              value={form[costKey] || ''}
              onChange={e => setForm(f => ({ ...f, [costKey]: Number(e.target.value) }))}
            />
          </div>
          {costMode === 'unit' && (
            <div className="w-24">
              <Label className="text-xs">Qtd</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity || 1}
                onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))}
              />
            </div>
          )}
        </div>
        {costMode === 'unit' && form[costKey] > 0 && (
          <p className="text-xs text-muted-foreground">
            Total: {((Number(form[costKey]) || 0) * (Number(form.quantity) || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        )}
      </div>
    );
  };

  const getAttachCount = (itemId: string) => (attachments[itemId] || []).length;

  return (
    <>
      <Card className="overflow-hidden">
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-left hover:bg-muted/30 transition-colors overflow-hidden rounded-t-xl">
          <div className="flex items-center gap-0 flex-1 min-w-0">
            {/* Section image with frosted overlay */}
            <div className="relative w-20 h-14 shrink-0 overflow-hidden">
              <img src={sectionImage} alt={title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
            </div>
            <div className="px-3 flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{items.length} item(ns)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-3">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openNew(); }}>
              <Plus className="w-4 h-4" />
            </Button>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>
        {expanded && (
          <CardContent className="pt-0 pb-4 px-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum item. Clique + para adicionar.</p>
            ) : items.map(item => (
              <div key={item.id} className="bg-muted/30 rounded-lg p-3 group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {renderItem(item)}
                    {(item.link || item.map_link || item.location_link) && (
                      <a
                        href={item.link || item.map_link || item.location_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mt-1 truncate"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.link || item.map_link || item.location_link}</span>
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {item.file_url && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadFile(item.file_url)} title="Baixar arquivo">
                        <FileDown className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon" variant="ghost" className="h-7 w-7 relative"
                      onClick={() => setShowAttachments(showAttachments === item.id ? null : item.id)}
                      title="Anexos"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      {getAttachCount(item.id) > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-sky-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                          {getAttachCount(item.id)}
                        </span>
                      )}
                    </Button>
                    {(item.link || item.map_link || item.location_link) && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                        <a href={item.link || item.map_link || item.location_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDuplicate(item)} title="Duplicar">
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Attachments panel */}
                {showAttachments === item.id && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Anexos</p>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                          multiple
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (files) {
                              for (const file of Array.from(files)) {
                                await uploadAttachment(file, item.id);
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                        <span className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400">
                          {attachUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Adicionar
                        </span>
                      </label>
                    </div>
                    {(attachments[item.id] || []).length === 0 && !attachUploading && (
                      <p className="text-[11px] text-muted-foreground">Nenhum anexo.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(attachments[item.id] || []).map(att => (
                        <div key={att.id} className="flex items-center gap-1.5 bg-background border rounded-md px-2 py-1 text-xs">
                          {att.file_type === 'image' ? <Image className="w-3 h-3 text-muted-foreground" /> : <FileDown className="w-3 h-3 text-muted-foreground" />}
                          <button
                            className="hover:underline truncate max-w-[120px]"
                            onClick={() => downloadFile(att.file_url, att.file_name)}
                          >
                            {att.file_name}
                          </button>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteAttachment(att.id, item.id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Adicionar'} {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map(field => {
              if (COST_KEYS.includes(field.key)) {
                return <div key={field.key}>{renderCostFields(field.key)}</div>;
              }

              return (
                <div key={field.key}>
                  <Label className="text-xs">{field.label}</Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      value={form[field.key] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="min-h-[60px]"
                    />
                  ) : field.type === 'select' ? (
                    <Select value={form[field.key] || ''} onValueChange={v => setForm(f => ({ ...f, [field.key]: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'location' ? (
                    <LocationAutocomplete
                      value={form[field.key] || ''}
                      onChange={v => setForm(f => ({ ...f, [field.key]: v }))}
                      placeholder="Buscar endereço..."
                    />
                   ) : field.type === 'paid_by' ? (
                    <div className="space-y-1">
                      {paidByOptions.length > 0 ? (
                        <Select value={form[field.key] || '__none__'} onValueChange={v => setForm(f => ({ ...f, [field.key]: v === '__none__' ? '' : v }))}>
                          <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Nenhum</SelectItem>
                            {paidByOptions.map(opt => (
                              <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : onAddParticipant ? (
                        <Button type="button" variant="outline" size="sm" className="text-xs w-full" onClick={onAddParticipant}>
                          + Adicionar participante
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhum participante cadastrado.</p>
                      )}
                    </div>
                  ) : field.type === 'file' ? (
                    <div className="space-y-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept={field.accept || '.pdf,.jpg,.jpeg,.png,.webp'}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleFileUpload(file, field.key);
                        }}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                      {uploading && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</p>}
                      {form[field.key] && !uploading && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Arquivo anexado
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      type={field.type || 'text'}
                      value={form[field.key] || ''}
                      onChange={e => setForm(f => ({ ...f, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600">
              {editingId ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
