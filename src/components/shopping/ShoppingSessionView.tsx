import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, ShoppingCart, Check, Clock, DollarSign, Trash2, Store, Tag, Users, ArrowUpDown } from 'lucide-react';
import { useSessionItems, useShoppingProducts, useShoppingPlaces, useBestPrices, useShoppingSessions, type ShoppingSession, type ShoppingProduct, SEGMENTS } from '@/hooks/useShoppingData';
import { useFriendships } from '@/hooks/useFriendships';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingItemRow } from './ShoppingItemRow';

interface Props {
  session: ShoppingSession;
  onBack: () => void;
}

type SortMode = 'segment' | 'az';

export function ShoppingSessionView({ session, onBack }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, addItem, updateItem, removeItem } = useSessionItems(session.id);
  const { products, create: createProduct } = useShoppingProducts();
  const { places } = useShoppingPlaces();
  const { updateSession, finalize } = useShoppingSessions();
  const { friends } = useFriendships();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('segment');
  const [shareOpen, setShareOpen] = useState(false);
  const [newInlineProductName, setNewInlineProductName] = useState('');
  const [newInlineProductSegment, setNewInlineProductSegment] = useState('MERCEARIA');
  const [searchFilter, setSearchFilter] = useState('');

  const productIds = useMemo(() => items.map(i => i.product_id), [items]);
  const allProductIds = useMemo(() => products.map(p => p.id), [products]);
  const { data: bestPrices } = useBestPrices(allProductIds, session.place_id);

  const productsMap = useMemo(() => {
    const m: Record<string, ShoppingProduct> = {};
    products.forEach(p => { m[p.id] = p; });
    return m;
  }, [products]);

  const placesMap = useMemo(() => {
    const m: Record<string, string> = {};
    places.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [places]);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    if (sortMode === 'segment') {
      sorted.sort((a, b) => {
        const segA = productsMap[a.product_id]?.segment || '';
        const segB = productsMap[b.product_id]?.segment || '';
        const segOrder = SEGMENTS.indexOf(segA as any) - SEGMENTS.indexOf(segB as any);
        if (segOrder !== 0) return segOrder;
        return (productsMap[a.product_id]?.name_caps || '').localeCompare(productsMap[b.product_id]?.name_caps || '');
      });
    } else {
      sorted.sort((a, b) =>
        (productsMap[a.product_id]?.name_caps || '').localeCompare(productsMap[b.product_id]?.name_caps || '')
      );
    }
    return sorted;
  }, [items, sortMode, productsMap]);

  // Totals
  const totalInCart = useMemo(() =>
    items.filter(i => i.in_cart).reduce((s, i) => s + i.quantity * i.price, 0), [items]);
  const totalPending = useMemo(() =>
    items.filter(i => !i.in_cart).reduce((s, i) => s + i.quantity * i.price, 0), [items]);
  const totalGeneral = totalInCart + totalPending;

  const availableProducts = useMemo(() => products, [products]);

  const handleAddProduct = async (productId: string) => {
    const bp = bestPrices?.[productId];
    const lastPrice = bp?.lastAtPlace || bp?.bestEver;
    await addItem.mutateAsync({
      session_id: session.id,
      product_id: productId,
      brand: lastPrice?.brand || '',
      price_type: lastPrice?.price_type || 'UNITARIO',
      price: lastPrice?.unit_price || 0,
      quantity: 1,
    });
    setAddProductOpen(false);
  };

  const handleFinalize = async () => {
    try {
      await finalize.mutateAsync(session.id);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleShare = async (friendUserId: string) => {
    const current = session.shared_with || [];
    if (current.includes(friendUserId)) return;
    await updateSession.mutateAsync({
      id: session.id,
      shared_with: [...current, friendUserId],
    });
    toast({ title: 'Lista compartilhada!' });
  };

  const handleRemoveAccess = async (friendUserId: string) => {
    const current = session.shared_with || [];
    await updateSession.mutateAsync({
      id: session.id,
      shared_with: current.filter(id => id !== friendUserId),
    });
    toast({ title: 'Acesso removido' });
  };

  const isOwner = session.user_id === user?.id;

  const isFinalized = session.status === 'FINALIZADA';

  // Group by segment for display
  let currentSegment = '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">{session.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {session.place_id && placesMap[session.place_id] && (
              <span className="flex items-center gap-1"><Store className="w-3 h-3" />{placesMap[session.place_id]}</span>
            )}
            <Badge variant={isFinalized ? 'default' : 'secondary'} className="text-xs">
              {isFinalized ? 'Finalizada' : 'Em andamento'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Place selector + controls */}
      {!isFinalized && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={session.place_id || ''}
                  onValueChange={v => updateSession.mutate({ id: session.id, place_id: v || null })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione o lugar" /></SelectTrigger>
                  <SelectContent>
                    {places.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={() => setSortMode(s => s === 'segment' ? 'az' : 'segment')}>
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Plus className="w-4 h-4" /> Adicionar item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Produto</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Buscar ou criar produto..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value.toUpperCase())}
                    className="mb-2"
                  />
                  <div className="space-y-1 mt-1">
                    {SEGMENTS.map(seg => {
                      const prods = availableProducts.filter(p => p.segment === seg && (!searchFilter || p.name_caps.includes(searchFilter)));
                      if (prods.length === 0) return null;
                      return (
                        <div key={seg}>
                          <p className="text-xs font-semibold text-muted-foreground px-2 pt-2 pb-1">{seg}</p>
                          {prods.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAddProduct(p.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md flex items-center justify-between"
                            >
                              <span>{p.name_caps}</span>
                              {bestPrices?.[p.id]?.lastAtPlace ? (
                                <span className="text-xs text-primary font-medium">
                                  R$ {bestPrices[p.id].lastAtPlace!.unit_price.toFixed(2)}
                                </span>
                              ) : bestPrices?.[p.id]?.bestEver ? (
                                <span className="text-xs text-muted-foreground">
                                  R$ {bestPrices[p.id].bestEver!.unit_price.toFixed(2)}
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {availableProducts.filter(p => !searchFilter || p.name_caps.includes(searchFilter)).length === 0 && (
                      <div className="border-t pt-3 mt-2 space-y-2">
                        <p className="text-sm text-muted-foreground text-center">
                          {searchFilter ? `Nenhum produto encontrado para "${searchFilter}"` : 'Todos os produtos já estão na lista'}
                        </p>
                        <div className="space-y-2 px-2">
                          <Input
                            placeholder="Nome do novo produto"
                            value={newInlineProductName || searchFilter}
                            onChange={e => setNewInlineProductName(e.target.value.toUpperCase())}
                          />
                          <Select value={newInlineProductSegment} onValueChange={setNewInlineProductSegment}>
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="w-full gap-1" disabled={!(newInlineProductName || searchFilter).trim()} onClick={async () => {
                            const normalized = (newInlineProductName || searchFilter).trim().toUpperCase();
                            if (!normalized) return;
                            const exists = products.some(p => p.name_caps === normalized);
                            if (exists) {
                              toast({ title: 'Produto já existe', description: `"${normalized}" já está cadastrado.`, variant: 'destructive' });
                              return;
                            }
                            const created = await createProduct.mutateAsync({ name_caps: normalized, segment: newInlineProductSegment });
                            await handleAddProduct(created.id);
                            setNewInlineProductName('');
                            setSearchFilter('');
                          }}>
                            <Plus className="w-3 h-3" /> Criar e adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Users className="w-4 h-4" /> Compartilhar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Compartilhar Lista</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    {/* Current shared members */}
                    {(session.shared_with || []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Com acesso</p>
                        {(session.shared_with || []).map(sharedId => {
                          const friend = friends.find(f => {
                            const fid = f.user_id === user?.id ? f.friend_id : f.user_id;
                            return fid === sharedId;
                          });
                          const friendName = friend?.friend_profile?.name || 'Usuário';
                          return (
                            <div key={sharedId} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{friendName}</span>
                              </div>
                              {isOwner && (
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                                  onClick={() => handleRemoveAccess(sharedId)}>
                                  <Trash2 className="w-3 h-3" />
                                  Remover
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add new */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Adicionar</p>
                      {friends.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum amigo adicionado.</p>
                      ) : (
                        friends.filter(f => {
                          const friendId = f.user_id === user?.id ? f.friend_id : f.user_id;
                          return !(session.shared_with || []).includes(friendId);
                        }).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">Todos os amigos já têm acesso.</p>
                        ) : (
                          friends.filter(f => {
                            const friendId = f.user_id === user?.id ? f.friend_id : f.user_id;
                            return !(session.shared_with || []).includes(friendId);
                          }).map(f => {
                            const friendId = f.user_id === user?.id ? f.friend_id : f.user_id;
                            const friendName = f.friend_profile?.name || 'Amigo';
                            return (
                              <div key={f.id} className="flex items-center justify-between p-2 border rounded-lg">
                                <span className="text-sm font-medium">{friendName}</span>
                                <Button size="sm" variant="outline" onClick={() => handleShare(friendId)}>
                                  Compartilhar
                                </Button>
                              </div>
                            );
                          })
                        )
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className="space-y-1">
        {sortedItems.map(item => {
          const product = productsMap[item.product_id];
          const segment = product?.segment || '';
          let showSegmentHeader = false;
          if (sortMode === 'segment' && segment !== currentSegment) {
            currentSegment = segment;
            showSegmentHeader = true;
          }

          const bp = bestPrices?.[item.product_id];
          const bpPlaceName = bp?.bestEver?.place_id ? placesMap[bp.bestEver.place_id] : undefined;

          return (
            <div key={item.id}>
              {showSegmentHeader && (
                <div className="pt-3 pb-1 px-1">
                  <Badge variant="outline" className="text-xs font-semibold">
                    <Tag className="w-3 h-3 mr-1" />{segment}
                  </Badge>
                </div>
              )}
              <ShoppingItemRow
                item={item}
                product={product}
                bestPrice={bp}
                placeName={bpPlaceName}
                isFinalized={isFinalized}
                onUpdate={(updates) => updateItem.mutate(updates)}
                onRemove={(id) => removeItem.mutate(id)}
                onToggleCart={(id, inCart) => updateItem.mutate({ id, in_cart: inCart })}
              />
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum item na lista. Adicione produtos acima.</p>
        )}
      </div>

      {/* Totals footer */}
      <Card className="sticky bottom-4 shadow-xl border-primary/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <ShoppingCart className="w-3 h-3" /> No carrinho
              </div>
              <p className="font-bold text-primary">R$ {totalInCart.toFixed(2)}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" /> Estimado
              </div>
              <p className="font-bold text-muted-foreground">R$ {totalPending.toFixed(2)}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <DollarSign className="w-3 h-3" /> Total
              </div>
              <p className="font-bold text-foreground">R$ {totalGeneral.toFixed(2)}</p>
            </div>
          </div>
          {!isFinalized && (
            <Button className="w-full mt-3" onClick={handleFinalize} disabled={finalize.isPending}>
              <Check className="w-4 h-4 mr-2" /> Finalizar Compra
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
