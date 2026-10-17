// ============================================================================
// PlaceDialog  —  FORMULÁRIO DE LUGAR (criar / editar)
// ----------------------------------------------------------------------------
// Janela para cadastrar um lugar no mapa: nome, categoria, se quero ir ou já
// fui, endereço, Instagram, link do Google Maps e preço/custo. Serve tanto para
// restaurantes (Encontros) quanto para pontos de viagem (Viagens) — o que muda
// são as categorias e alguns rótulos, recebidos por props.
// ============================================================================
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Place, PlaceInput, PlaceStatus } from '@/hooks/usePlaces';

// Formato mínimo de uma categoria (serve para restaurante e viagem).
export interface PlaceCategoryOption {
  value: string;
  label: string;
  emoji: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Place | null;
  onSave: (input: PlaceInput, locationChanged: boolean) => Promise<void>;
  categories: PlaceCategoryOption[];
  defaultCategory: string;
  // Rótulos ajustáveis conforme o contexto.
  title?: string;           // ex.: "restaurante" / "lugar"
  namePlaceholder?: string; // ex.: "Sushi Yassu" / "Cristo Redentor"
  priceLabel?: string;      // ex.: "Preço médio (R$)" / "Custo estimado (R$)"
}

export function PlaceDialog({
  open, onOpenChange, editing, onSave,
  categories, defaultCategory,
  title = 'lugar', namePlaceholder = 'Nome do lugar', priceLabel = 'Preço médio (R$)',
}: Props) {
  const empty = {
    name: '', category: defaultCategory, status: 'want' as PlaceStatus,
    address: '', instagram: '', maps_url: '', price: '',
  };
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

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
      setForm({ ...empty });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultCategory]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
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
          <DialogTitle>{editing ? `Editar ${title}` : `Novo ${title}`}</DialogTitle>
          <DialogDescription>Salve os lugares que quer conhecer e marque quando for.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={`Ex: ${namePlaceholder}`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Situação</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PlaceStatus })}>
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
              <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@perfil" />
            </div>
            <div>
              <Label>{priceLabel}</Label>
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
