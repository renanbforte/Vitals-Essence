import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ShoppingCart, Store, Package, List, Trash2, Copy, MapPin, Loader2, Tag, Pencil, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useShoppingPlaces, useShoppingProducts, useShoppingTemplates,
  useTemplateItems, useShoppingSessions, SEGMENTS,
} from '@/hooks/useShoppingData';
import { ShoppingSessionView } from '@/components/shopping/ShoppingSessionView';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function Shopping() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // New place dialog
  const [newPlaceOpen, setNewPlaceOpen] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceAddress, setNewPlaceAddress] = useState('');
  const [newPlaceType, setNewPlaceType] = useState('mercado');

  // Edit place
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editPlaceName, setEditPlaceName] = useState('');
  const [editPlaceAddress, setEditPlaceAddress] = useState('');
  const [editPlaceType, setEditPlaceType] = useState('mercado');

  // New product dialog
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSegment, setNewProductSegment] = useState('MERCEARIA');

  // New template dialog
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // New session dialog
  const getDefaultSessionTitle = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `COMPRA | ${day} - ${month} - ${year}`;
  };
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionPlace, setNewSessionPlace] = useState('');
  const [newSessionTemplate, setNewSessionTemplate] = useState('');

  // Inline new place from session dialog
  const [inlinePlaceName, setInlinePlaceName] = useState('');
  const [showInlinePlaceInput, setShowInlinePlaceInput] = useState(false);

  const { places, create: createPlace, update: updatePlace } = useShoppingPlaces();
  const { products, isLoading: productsLoading, create: createProduct, seedDefaults } = useShoppingProducts();
  const { templates, create: createTemplate, remove: removeTemplate } = useShoppingTemplates();
  const { sessions, create: createSession, remove: removeSession } = useShoppingSessions();

  // Auto-seed default products + template for new users
  useEffect(() => {
    if (!productsLoading && products.length === 0 && user && !seedDefaults.isPending && !seedDefaults.isSuccess) {
      seedDefaults.mutate();
    }
  }, [productsLoading, products.length, user]);

  // Template items for selected template
  const { items: templateItems, addItem: addTemplateItem, removeItem: removeTemplateItem } = useTemplateItems(selectedTemplate || undefined);

  // Add product to template dialog
  const [addToTemplateOpen, setAddToTemplateOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If viewing a session
  const currentSession = sessions.find(s => s.id === selectedSession);
  if (currentSession) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Lista de Compras" showBack gradientClass="gradient-shopping" />
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <ShoppingSessionView session={currentSession} onBack={() => setSelectedSession(null)} />
        </div>
      </div>
    );
  }

  const handleCreatePlace = async () => {
    if (!newPlaceName.trim()) return;
    await createPlace.mutateAsync({ name: newPlaceName.trim(), place_type: newPlaceType, address: newPlaceAddress.trim() || undefined });
    setNewPlaceName('');
    setNewPlaceAddress('');
    setNewPlaceOpen(false);
  };

  const handleCreateProduct = async () => {
    if (!newProductName.trim()) return;
    const normalized = newProductName.trim().toUpperCase();
    const exists = products.some(p => p.name_caps === normalized);
    if (exists) {
      toast({ title: 'Produto já existe', description: `"${normalized}" já está cadastrado.`, variant: 'destructive' });
      return;
    }
    await createProduct.mutateAsync({ name_caps: normalized, segment: newProductSegment });
    setNewProductName('');
    setNewProductOpen(false);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;
    await createTemplate.mutateAsync(newTemplateName.trim());
    setNewTemplateName('');
    setNewTemplateOpen(false);
  };

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;
    const result = await createSession.mutateAsync({
      title: newSessionTitle.trim(),
      place_id: newSessionPlace || undefined,
      templateId: newSessionTemplate || undefined,
    });
    setNewSessionTitle('');
    setNewSessionPlace('');
    setNewSessionTemplate('');
    setNewSessionOpen(false);
    setSelectedSession(result.id);
  };

  // Group products by segment
  const productsBySegment = SEGMENTS.reduce((acc, seg) => {
    acc[seg] = products.filter(p => p.segment === seg);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Lista de Compras" showBack gradientClass="gradient-shopping" />

      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="sessions" className="text-xs gap-1">
              <ShoppingCart className="w-3 h-3" /> Compras
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1">
              <List className="w-3 h-3" /> Templates
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-1">
              <Package className="w-3 h-3" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="places" className="text-xs gap-1">
              <Store className="w-3 h-3" /> Lugares
            </TabsTrigger>
          </TabsList>

          {/* ========== SESSIONS ========== */}
          <TabsContent value="sessions" className="space-y-4">
            <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2" onClick={() => { setNewSessionTitle(getDefaultSessionTitle()); setShowInlinePlaceInput(false); setInlinePlaceName(''); }}>
                  <Plus className="w-4 h-4" /> Nova Compra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova Sessão de Compra</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="COMPRA | DD - MM - YYYY"
                    value={newSessionTitle}
                    onChange={e => setNewSessionTitle(e.target.value.toUpperCase())}
                  />
                  <div className="space-y-2">
                    <Select value={newSessionPlace} onValueChange={setNewSessionPlace}>
                      <SelectTrigger><SelectValue placeholder="Lugar (opcional)" /></SelectTrigger>
                      <SelectContent>
                        {places.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {!showInlinePlaceInput ? (
                      <Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground" onClick={() => setShowInlinePlaceInput(true)}>
                        <Plus className="w-3 h-3" /> Adicionar novo lugar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do lugar"
                          value={inlinePlaceName}
                          onChange={e => setInlinePlaceName(e.target.value)}
                          className="text-sm"
                        />
                        <Button size="sm" disabled={!inlinePlaceName.trim()} onClick={async () => {
                          const result = await createPlace.mutateAsync({ name: inlinePlaceName.trim(), place_type: 'mercado' });
                          setNewSessionPlace(result.id);
                          setInlinePlaceName('');
                          setShowInlinePlaceInput(false);
                        }}>Salvar</Button>
                      </div>
                    )}
                  </div>
                  <Select value={newSessionTemplate} onValueChange={setNewSessionTemplate}>
                    <SelectTrigger><SelectValue placeholder="Baseado em template (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateSession} disabled={!newSessionTitle.trim()}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {sessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhuma compra ainda. Crie uma nova!</p>
            ) : (
              sessions.map(s => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSession(s.id)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{s.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={s.status === 'FINALIZADA' ? 'default' : 'secondary'} className="text-xs">
                            {s.status === 'FINALIZADA' ? 'Finalizada' : 'Em andamento'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); removeSession.mutate(s.id); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ========== TEMPLATES ========== */}
          <TabsContent value="templates" className="space-y-4">
            {products.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda. Carregue a lista padrão para começar.</p>
                  <Button onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-1">
                    <Copy className="w-4 h-4" /> Carregar lista padrão
                  </Button>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-2">
              <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1">
                    <Plus className="w-4 h-4" /> Novo Template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Template</DialogTitle></DialogHeader>
                  <Input
                    placeholder="Ex: LISTA BASE – MERCADO"
                    value={newTemplateName}
                    onChange={e => setNewTemplateName(e.target.value)}
                  />
                  <DialogFooter>
                    <Button onClick={handleCreateTemplate} disabled={!newTemplateName.trim()}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {templates.map(t => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{t.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => setSelectedTemplate(selectedTemplate === t.id ? null : t.id)}
                      >
                        {selectedTemplate === t.id ? 'Fechar' : 'Editar'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTemplate.mutate(t.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {selectedTemplate === t.id && (
                  <CardContent className="pt-0 space-y-2">
                    <Dialog open={addToTemplateOpen} onOpenChange={setAddToTemplateOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 w-full">
                          <Plus className="w-3 h-3" /> Adicionar Produto
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Adicionar ao Template</DialogTitle></DialogHeader>
                        {SEGMENTS.map(seg => {
                          const prods = products.filter(p => p.segment === seg && !templateItems.some(ti => ti.product_id === p.id));
                          if (prods.length === 0) return null;
                          return (
                            <div key={seg}>
                              <p className="text-xs font-semibold text-muted-foreground pt-2 pb-1">{seg}</p>
                              {prods.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    addTemplateItem.mutate({ template_id: t.id, product_id: p.id, order_index: templateItems.length });
                                    setAddToTemplateOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-md"
                                >
                                  {p.name_caps}
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </DialogContent>
                    </Dialog>

                    {templateItems.map(ti => {
                      const product = products.find(p => p.id === ti.product_id);
                      return (
                        <div key={ti.id} className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded-md">
                          <span className="text-sm">{product?.name_caps || '—'}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTemplateItem.mutate(ti.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                    {templateItems.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto no template</p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
            {templates.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum template. Crie um para agilizar suas compras!</p>
            )}
          </TabsContent>

          {/* ========== PRODUCTS ========== */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex gap-2">
              <Dialog open={newProductOpen} onOpenChange={setNewProductOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 flex-1">
                    <Plus className="w-4 h-4" /> Novo Produto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nome do produto"
                      value={newProductName}
                      onChange={e => setNewProductName(e.target.value.toUpperCase())}
                    />
                    <Select value={newProductSegment} onValueChange={setNewProductSegment}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateProduct} disabled={!newProductName.trim()}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {products.length === 0 && (
                <Button onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-1">
                  <Copy className="w-4 h-4" /> Carregar padrão
                </Button>
              )}
            </div>

            {SEGMENTS.map(seg => {
              const prods = productsBySegment[seg];
              if (!prods || prods.length === 0) return null;
              return (
                <div key={seg}>
                  <Badge variant="outline" className="mb-2 text-xs">
                    <Tag className="w-3 h-3 mr-1" />{seg} ({prods.length})
                  </Badge>
                  <div className="space-y-1">
                    {prods.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-card rounded-lg border border-border/50">
                        <span className="text-sm font-medium">{p.name_caps}</span>
                        <span className="text-xs text-muted-foreground">{p.default_unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum produto cadastrado. Clique em "Carregar padrão" para começar.
              </p>
            )}
          </TabsContent>

          {/* ========== PLACES ========== */}
          <TabsContent value="places" className="space-y-4">
            <Dialog open={newPlaceOpen} onOpenChange={setNewPlaceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="w-4 h-4" /> Novo Lugar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Lugar</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Input
                    placeholder="Ex: CARREFOUR TATUAPÉ"
                    value={newPlaceName}
                    onChange={e => setNewPlaceName(e.target.value.toUpperCase())}
                  />
                  <Input
                    placeholder="Endereço (opcional)"
                    value={newPlaceAddress}
                    onChange={e => setNewPlaceAddress(e.target.value)}
                  />
                  <Select value={newPlaceType} onValueChange={setNewPlaceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mercado">Mercado</SelectItem>
                      <SelectItem value="atacado">Atacado</SelectItem>
                      <SelectItem value="hortifruti">Hortifruti</SelectItem>
                      <SelectItem value="farmacia">Farmácia</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreatePlace} disabled={!newPlaceName.trim()}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {places.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum lugar cadastrado.</p>
            ) : (
              places.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    {editingPlaceId === p.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editPlaceName}
                          onChange={e => setEditPlaceName(e.target.value.toUpperCase())}
                          placeholder="Nome"
                        />
                        <Input
                          value={editPlaceAddress}
                          onChange={e => setEditPlaceAddress(e.target.value)}
                          placeholder="Endereço (opcional)"
                        />
                        <Select value={editPlaceType} onValueChange={setEditPlaceType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mercado">Mercado</SelectItem>
                            <SelectItem value="atacado">Atacado</SelectItem>
                            <SelectItem value="hortifruti">Hortifruti</SelectItem>
                            <SelectItem value="farmacia">Farmácia</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1" onClick={async () => {
                            await updatePlace.mutateAsync({ id: p.id, name: editPlaceName.trim(), address: editPlaceAddress.trim() || undefined, place_type: editPlaceType });
                            setEditingPlaceId(null);
                          }} disabled={!editPlaceName.trim()}>
                            <Check className="w-3 h-3" /> Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingPlaceId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{p.name}</p>
                            {p.address && <p className="text-xs text-muted-foreground">{p.address}</p>}
                            <p className="text-xs text-muted-foreground capitalize">{p.place_type}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setEditingPlaceId(p.id);
                          setEditPlaceName(p.name);
                          setEditPlaceAddress(p.address || '');
                          setEditPlaceType(p.place_type || 'mercado');
                        }}>
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
