import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { CostCenter } from '@/hooks/useFinancialFlow';

const EMOJI_SUGGESTIONS = ['🏠', '🍽️', '❤️', '📚', '🎮', '🚗', '📈', '📦', '💼', '🎯', '🛒', '💊', '🎬', '✈️', '👕', '🐾', '💡', '🏋️', '🎵', '🍺'];

interface CostCenterManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenters: CostCenter[];
  onUpdate: (id: string, updates: { name?: string; icon?: string }) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string, icon?: string) => void;
}

export function CostCenterManager({ open, onOpenChange, costCenters, onUpdate, onDelete, onAdd }: CostCenterManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');

  const startEdit = (cc: CostCenter) => {
    setEditingId(cc.id);
    setEditName(cc.name);
    setEditIcon(cc.icon || '');
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    onUpdate(editingId, { name: editName.trim(), icon: editIcon || undefined });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newIcon);
    setNewName('');
    setNewIcon('📦');
    setShowAdd(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Centros de Custo</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {costCenters.map(cc => (
            <div key={cc.id} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
              {editingId === cc.id ? (
                <>
                  {/* Emoji picker row */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {EMOJI_SUGGESTIONS.map(e => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setEditIcon(e)}
                          className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                            editIcon === e ? 'bg-primary/20 ring-2 ring-primary/40 scale-110' : 'hover:bg-muted'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="rounded-lg h-9 text-sm"
                      autoFocus
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-emerald-600" onClick={saveEdit}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-lg">{cc.icon || '📦'}</span>
                  <span className="flex-1 text-sm font-medium">{cc.name}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => startEdit(cc)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => onDelete(cc.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {/* Add new */}
          {showAdd ? (
            <div className="p-3 rounded-xl border border-dashed border-border space-y-2">
              <div className="flex flex-wrap gap-1">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewIcon(e)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                      newIcon === e ? 'bg-primary/20 ring-2 ring-primary/40 scale-110' : 'hover:bg-muted'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do centro de custo"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="rounded-lg h-9 text-sm flex-1"
                  autoFocus
                />
                <Button size="sm" className="rounded-lg shrink-0" disabled={!newName.trim()} onClick={handleAdd}>
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg shrink-0" onClick={() => setShowAdd(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAdd(true)}>
              + Novo centro de custo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
