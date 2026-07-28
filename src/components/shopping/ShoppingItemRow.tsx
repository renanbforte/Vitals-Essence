import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Trash2 } from 'lucide-react';
import type { SessionItem, ShoppingProduct, PriceHistory } from '@/hooks/useShoppingData';

interface ShoppingItemRowProps {
  item: SessionItem;
  product: ShoppingProduct | undefined;
  bestPrice?: { bestEver?: PriceHistory; bestAtPlace?: PriceHistory; lastAtPlace?: PriceHistory };
  placeName?: string;
  isFinalized: boolean;
  onUpdate: (updates: { id: string } & Partial<SessionItem>) => void;
  onRemove: (id: string) => void;
  onToggleCart: (id: string, inCart: boolean) => void;
}

function useDebouncedSave(onUpdate: (updates: { id: string } & Partial<SessionItem>) => void, itemId: string, delay = 600) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const save = useCallback((field: string, value: any) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdate({ id: itemId, [field]: value });
    }, delay);
  }, [onUpdate, itemId, delay]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return save;
}

export function ShoppingItemRow({ item, product, bestPrice: bp, placeName, isFinalized, onUpdate, onRemove, onToggleCart }: ShoppingItemRowProps) {
  const [brand, setBrand] = useState(item.brand || '');
  const [price, setPrice] = useState(item.price?.toString() || '');
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '1');

  const debouncedSave = useDebouncedSave(onUpdate, item.id);

  // Sync from server when item changes externally
  useEffect(() => { setBrand(item.brand || ''); }, [item.brand]);
  useEffect(() => { setPrice(item.price?.toString() || ''); }, [item.price]);
  useEffect(() => { setQuantity(item.quantity?.toString() || '1'); }, [item.quantity]);

  const subtotal = (parseFloat(quantity) || 0) * (parseFloat(price) || 0);

  return (
    <Card className={`transition-all ${item.in_cart ? 'bg-primary/5 border-primary/20' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {!isFinalized && (
            <Checkbox
              checked={item.in_cart}
              onCheckedChange={checked => onToggleCart(item.id, !!checked)}
              className="mt-1"
            />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${item.in_cart ? 'line-through text-muted-foreground' : ''}`}>
                {product?.name_caps || 'Produto'}
              </span>
              {item.in_cart && <Check className="w-4 h-4 text-primary" />}
            </div>

            {bp && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {bp.bestEver && (
                  <p>Menor já pago: R$ {bp.bestEver.unit_price.toFixed(2)}
                    {bp.bestEver.place_id && placeName && (
                      <span className="text-primary"> ({placeName})</span>
                    )}
                  </p>
                )}
                {bp.lastAtPlace && (
                  <p>Nesse lugar: R$ {bp.lastAtPlace.unit_price.toFixed(2)}
                    <span className="text-muted-foreground/60"> ({new Date(bp.lastAtPlace.purchase_date).toLocaleDateString('pt-BR')})</span>
                  </p>
                )}
              </div>
            )}

            {!isFinalized && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Input
                  type="text"
                  placeholder="Marca"
                  value={brand}
                  onChange={e => {
                    setBrand(e.target.value);
                    debouncedSave('brand', e.target.value);
                  }}
                  className="h-7 text-xs w-20 flex-shrink-0"
                />
                <Select
                  value={item.price_type}
                  onValueChange={v => onUpdate({ id: item.id, price_type: v })}
                >
                  <SelectTrigger className="h-7 text-xs w-16 flex-shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNITARIO">UN</SelectItem>
                    <SelectItem value="POR_KG">KG</SelectItem>
                    <SelectItem value="POR_L">L</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setPrice(val);
                      debouncedSave('price', parseFloat(val.replace(',', '.')) || 0);
                    }}
                    className="h-7 text-xs w-16"
                  />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">Qtd:</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={quantity}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setQuantity(val);
                      debouncedSave('quantity', parseInt(val) || 0);
                    }}
                    className="h-7 text-xs w-14"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="font-bold text-sm">R$ {subtotal.toFixed(2)}</p>
            {!isFinalized && (
              <Button variant="ghost" size="icon" className="h-6 w-6 mt-1" onClick={() => onRemove(item.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
