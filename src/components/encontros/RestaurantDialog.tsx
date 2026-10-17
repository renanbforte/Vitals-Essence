// ============================================================================
// RestaurantDialog  —  FORMULÁRIO DE RESTAURANTE (criar / editar)
// ----------------------------------------------------------------------------
// Janela para cadastrar um restaurante: nome, tipo de cozinha, se quero ir ou
// já fui, endereço, Instagram, link do Google Maps e preço médio. Ao salvar,
// o hook tenta posicionar o lugar no mapa a partir do endereço/link.
// ============================================================================
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RESTAURANT_CATEGORIES } from './restaurantCategories';
import type { Restaurant, RestaurantInput, RestaurantStatus } from '@/hooks/useRestaurants';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Quando vier preenchido, estamos editando um restaurante existente.
  editing?: Restaurant | null;
  onSave: (input: RestaurantInput, locationChanged: boolean) => Promise<void>;
}

const EMPTY = {
  name: '',
  category: 'japones',
  status: 'want' as RestaurantStatus,
  address: '',
  instagram: '',
  maps_url: '',
  price: '',
};

export function RestaurantDialog({ open, onOpenChange, editing, onSave }: Props) {
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  // Ao abrir, carrega os dados do restaurante em edição (ou limpa para um novo).
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        category: editing.category,
        status: editing.status,
        address: editing.address || '',
        instagram: editing.instagram || '',
        maps_url: editing.maps_url || '',
        price: editing.price != null ? String(editing.price) : '',
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    // Só recalcula a posição no mapa se o endereço ou o link mudaram (economiza busca).
    const locationChanged =
      !editing ||
      (editing.address || '') !== form.address.trim() ||
      (editing.maps_url || '') !== form.maps_url.trim();
    try {
      await onSave(
        {
          name: form.name.trim(),
          category: form.category,
          status: form.status,
          address: form.address.trim() || null,
          instagram: form.instagram.trim() || null,
          maps_url: form.maps_url.trim() || null,
          price: form.price ? Number(form.price) : null,
        },
        locationChanged,
      );
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar restaurante' : 'Novo restaurante'}</DialogTitle>
          <DialogDescription>Salve os lugares que quer conhecer e marque quando for.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Sushi Yassu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de cozinha</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESTAURANT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Situação</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as RestaurantStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="want">🎯 Quero ir</SelectItem>
                  <SelectItem value="visited">✅ Já fui</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Endereço</Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Rua, número, bairro, cidade — usado para posicionar no mapa"
              rows={2}
            />
          </div>

          <div>
            <Label>Link do Google Maps</Label>
            <Input
              value={form.maps_url}
              onChange={(e) => setForm({ ...form, maps_url: e.target.value })}
              placeholder="Cole o link do lugar no Maps"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Dica: colar o link do Maps posiciona no mapa na hora, mesmo sem endereço.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Instagram</Label>
              <Input
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@perfil"
              />
            </div>
            <div>
              <Label>Preço médio (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Ex: 120"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
