// ============================================================================
// ShoppingItemRow — Linha de um item dentro de uma lista de compras.
// Mostra o nome do produto, os menores precos ja pagos e campos editaveis
// (marca, tipo de preco, preco e quantidade), calculando o subtotal na hora.
// Tem uma caixinha para marcar o item como "ja esta no carrinho".
// ============================================================================
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

// Hook auxiliar: adia o salvamento no servidor enquanto a pessoa digita.
// So salva depois de parar de digitar por "delay" milissegundos (padrao 600ms),
// evitando uma gravacao a cada tecla pressionada.
function useDebouncedSave(onUpdate: (updates: { id: string } & Partial<SessionItem>) => void, itemId: string, delay = 600) {
  // Guarda o "cronometro" atual para poder cancela-lo se a pessoa continuar digitando.
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Reinicia a contagem a cada mudanca; quando o tempo acaba, envia a atualizacao.
  const save = useCallback((field: string, value: any) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdate({ id: itemId, [field]: value });
    }, delay);
  }, [onUpdate, itemId, delay]);

  // Ao remover a linha da tela, cancela qualquer salvamento que estava agendado.
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return save;
}

export function ShoppingItemRow({ item, product, bestPrice: bp, placeName, isFinalized, onUpdate, onRemove, onToggleCart }: ShoppingItemRowProps) {
  // Valores digitados nos campos (guardados localmente enquanto a pessoa edita).
  const [brand, setBrand] = useState(item.brand || '');
  const [price, setPrice] = useState(item.price?.toString() || '');
  const [quantity, setQuantity] = useState(item.quantity?.toString() || '1');

  // Prepara a funcao que salva as alteracoes com atraso (debounce).
  const debouncedSave = useDebouncedSave(onUpdate, item.id);

  // Se o item mudar por fora (ex.: outra pessoa editou), atualiza os campos na tela.
  // Sync from server when item changes externally
  useEffect(() => { setBrand(item.brand || ''); }, [item.brand]);
  useEffect(() => { setPrice(item.price?.toString() || ''); }, [item.price]);
  useEffect(() => { setQuantity(item.quantity?.toString() || '1'); }, [item.quantity]);

  // Calcula o subtotal desta linha: quantidade multiplicada pelo preco.
  const subtotal = (parseFloat(quantity) || 0) * (parseFloat(price) || 0);

  return (
    <Card className={`transition-all ${item.in_cart ? 'bg-primary/5 border-primary/20' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Caixinha para marcar o item como "ja peguei no carrinho" (some quando a compra ja foi finalizada) */}
          {!isFinalized && (
            <Checkbox
              checked={item.in_cart}
              onCheckedChange={checked => onToggleCart(item.id, !!checked)}
              className="mt-1"
            />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Nome do produto; fica riscado quando ja esta no carrinho */}
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm ${item.in_cart ? 'line-through text-muted-foreground' : ''}`}>
                {product?.name_caps || 'Produto'}
              </span>
              {item.in_cart && <Check className="w-4 h-4 text-primary" />}
            </div>

            {/* Historico de precos: mostra o menor preco ja pago e o ultimo preco visto neste lugar */}
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

            {/* Campos de edicao (marca, tipo, preco e quantidade); so aparecem enquanto a compra nao foi finalizada */}
            {!isFinalized && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {/* Campo de marca: salva automaticamente pouco depois de parar de digitar */}
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
                {/* Tipo de preco: por unidade (UN), por quilo (KG) ou por litro (L) */}
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
                {/* Campo de preco: aceita apenas numeros, ponto e virgula */}
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
                {/* Campo de quantidade: aceita apenas numeros inteiros */}
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

          {/* Lado direito: subtotal desta linha e o botao de lixeira para remover o item */}
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
