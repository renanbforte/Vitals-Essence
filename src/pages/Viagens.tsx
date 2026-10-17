// ============================================================================
// Viagens  —  LISTA DE VIAGENS (rota /viagens)
// ----------------------------------------------------------------------------
// Tela inicial do módulo de viagens. Mostra os convites pendentes, a lista de
// viagens do usuário em cartões e um botão "Nova Viagem" que abre um formulário.
// Clicar em um cartão abre os detalhes daquela viagem (tela TripDetail).
// ============================================================================

// Ferramentas do React (estado e efeitos) e navegação entre telas.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Dados do usuário logado.
import { useAuth } from '@/contexts/AuthContext';
// Hooks que buscam/gravam as viagens e os convites no banco (Supabase).
import { useTrips } from '@/hooks/useTrips';
import { useTripInvitations } from '@/hooks/useTripMembers';
// Lista de status possíveis de uma viagem (planejada, em andamento, etc.).
import { TRIP_STATUSES } from '@/types/trips';
// Formatação de datas e acesso direto ao banco/armazenamento Supabase.
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/** Parse date string as local (avoids UTC off-by-one) */
// Converte um texto de data (ex.: "2026-07-28") em data local, evitando que o
// fuso horário faça a data "voltar" um dia por engano.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

import { motion } from 'framer-motion';
import { Plus, Plane, MapPin, Calendar, ArrowLeft, DollarSign, Bell, Check, X, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlacesMap } from '@/components/encontros/PlacesMap';
import { TRAVEL_CATEGORIES } from '@/components/encontros/travelCategories';

export default function Viagens() {
  const navigate = useNavigate();
  // Usuário logado e se a autenticação ainda está carregando.
  const { user, loading } = useAuth();
  // Lista de viagens do usuário, indicador de carregamento e ação de criar viagem.
  const { trips, isLoading, createTrip } = useTrips();
  // Convites de viagem recebidos e a ação de aceitar/recusar.
  const { invitations, respond } = useTripInvitations();
  // Controla se o formulário "Nova Viagem" está aberto.
  const [showNew, setShowNew] = useState(false);
  // Guarda o que o usuário digita no formulário de nova viagem.
  const [form, setForm] = useState({ name: '', main_destination: '', start_date: '', end_date: '', budget: '' });
  // Guarda os links temporários das imagens de capa de cada viagem (por id).
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({});

  // Ao carregar as viagens, gera um link temporário (válido por 1 hora) para a
  // imagem de capa de cada uma, já que o armazenamento é privado.
  useEffect(() => {
    if (!trips.length) return;
    const tripsWithCover = trips.filter((t: any) => t.cover_image);
    if (!tripsWithCover.length) return;
    Promise.all(
      tripsWithCover.map(async (t: any) => {
        const { data } = await supabase.storage.from('trip-files').createSignedUrl(t.cover_image, 3600);
        return { id: t.id, url: data?.signedUrl || null };
      })
    ).then(results => {
      const map: Record<string, string> = {};
      results.forEach(r => { if (r.url) map[r.id] = r.url; });
      setCoverUrls(map);
    });
  }, [trips]);

  // Enquanto valida o login não mostra nada; se não houver usuário, manda para o login.
  if (loading) return null;
  if (!user) { navigate('/auth'); return null; }

  // Cria uma nova viagem com os dados do formulário e, ao dar certo,
  // fecha o formulário e limpa os campos.
  const handleCreate = () => {
    createTrip.mutate({
      name: form.name,
      main_destination: form.main_destination || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
    }, {
      onSuccess: () => {
        setShowNew(false);
        setForm({ name: '', main_destination: '', start_date: '', end_date: '', budget: '' });
      }
    });
  };

  // Descobre o status (rótulo e cor) de uma viagem a partir do seu código.
  const getStatus = (s: string) => TRIP_STATUSES.find(st => st.value === s) || TRIP_STATUSES[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho azul com título "Viagens" e a contagem de viagens cadastradas */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 pt-6 pb-10">
          {/* Linha do topo: seta para voltar ao início + botão de nova viagem */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {/* Abre o formulário de cadastro de nova viagem */}
            <Button onClick={() => setShowNew(true)} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2">
              <Plus className="w-4 h-4" />
              Nova Viagem
            </Button>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-white text-2xl font-bold flex items-center gap-3">
              <Plane className="w-7 h-7" />
              Viagens
            </h1>
            <p className="text-white/70 text-sm mt-1">{trips.length} viagem(ns) cadastrada(s)</p>
          </motion.div>
        </div>
      </div>

      <Tabs defaultValue="viagens" className="container mx-auto px-4 py-6">
        {/* Abas: lista de Viagens e o Mapa de lugares (quero ir / já fui) */}
        <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl bg-card border border-border p-1 mb-4">
          <TabsTrigger value="viagens" className="gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-sky-500 data-[state=active]:text-white">
            <Plane className="w-4 h-4" /> Viagens
          </TabsTrigger>
          <TabsTrigger value="mapa" className="gap-1.5 rounded-lg text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            <MapIcon className="w-4 h-4" /> Mapa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viagens" className="space-y-4 mt-0">
        {/* Convites pendentes: só aparece se houver convites. Cada convite mostra
            a viagem e dois botões (verde = aceitar, vermelho = recusar) */}
        {invitations.length > 0 && (
          <Card className="border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm">
                <Bell className="w-4 h-4" />
                Convites pendentes
              </div>
              {invitations.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between bg-white dark:bg-card rounded-lg p-3 shadow-sm">
                  <div>
                    <p className="font-medium text-sm">{inv.trips?.name || 'Viagem'}</p>
                    <p className="text-xs text-muted-foreground">{inv.trips?.main_destination}</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Aceitar o convite */}
                    <Button size="sm" variant="ghost" className="text-green-600 h-8 w-8 p-0" onClick={() => respond.mutate({ id: inv.id, accept: true })}>
                      <Check className="w-4 h-4" />
                    </Button>
                    {/* Recusar o convite */}
                    <Button size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0" onClick={() => respond.mutate({ id: inv.id, accept: false })}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Área principal: 3 situações possíveis —
            1) carregando, 2) nenhuma viagem (estado vazio), 3) lista de cartões */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : trips.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Plane className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-1">Nenhuma viagem</h3>
              <p className="text-sm text-muted-foreground mb-4">Crie sua primeira viagem para começar a planejar!</p>
              <Button onClick={() => setShowNew(true)} className="gap-2 bg-sky-500 hover:bg-sky-600">
                <Plus className="w-4 h-4" />
                Nova Viagem
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Lista de cartões: um por viagem. Clicar abre os detalhes da viagem.
          <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {trips.map((trip: any) => {
              const status = getStatus(trip.status);
              const coverPublicUrl = coverUrls[trip.id] || null;
              return (
                <motion.div key={trip.id} whileTap={{ scale: 0.98 }}>
                  {/* Cartão clicável que leva para /viagens/{id} (tela de detalhes) */}
                  <div
                    className="cursor-pointer rounded-2xl overflow-hidden shadow hover:shadow-lg transition-shadow relative"
                    onClick={() => navigate(`/viagens/${trip.id}`)}
                    style={{ minHeight: 100 }}
                  >
                    {/* Fundo do cartão: usa a foto de capa se existir, senão um degradê azul */}
                    {coverPublicUrl ? (
                      <>
                        <img src={coverPublicUrl} alt={trip.name} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-600" />
                    )}
                    {/* Conteúdo do cartão: nome, destino, status e (embaixo) datas e valor */}
                    <div className="relative p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-base uppercase text-white drop-shadow">{trip.name}</h3>
                          {trip.main_destination && (
                            <p className="text-sm text-white/80 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {trip.main_destination}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" style={{ borderColor: status.color, color: status.color, background: 'rgba(0,0,0,0.4)' }} className="text-[10px] shrink-0 backdrop-blur-sm">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/70 mt-3">
                        {trip.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(parseLocalDate(trip.start_date), "dd/MM/yy")}
                            {trip.end_date && ` – ${format(parseLocalDate(trip.end_date), "dd/MM/yy")}`}
                          </span>
                        )}
                        {(trip.total_spent != null ? trip.total_spent > 0 : trip.budget > 0) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            {Number(trip.total_spent ?? trip.budget).toLocaleString('pt-BR', { style: 'currency', currency: trip.currency || 'BRL' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        </TabsContent>

        {/* Aba Mapa: lugares da viagem que quero conhecer / já fui, no mapa */}
        <TabsContent value="mapa" className="mt-0 max-w-2xl mx-auto">
          <PlacesMap
            scope="travel"
            categories={TRAVEL_CATEGORIES}
            defaultCategory="ponto_turistico"
            dialogTitle="lugar"
            namePlaceholder="Cristo Redentor"
            priceLabel="Custo estimado (R$)"
            emptyText="Comece marcando os lugares que quer conhecer nas suas viagens."
          />
        </TabsContent>
      </Tabs>

      {/* Janela (modal) do formulário de Nova Viagem: nome, destino, datas e orçamento */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Viagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da viagem *</Label>
              <Input placeholder="Ex: Chile 2026" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="uppercase" />
            </div>
            <div>
              <Label>Destino principal</Label>
              <LocationAutocomplete placeholder="Ex: Santiago, Chile" value={form.main_destination} onChange={v => setForm(f => ({ ...f, main_destination: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ida</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Volta</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Orçamento previsto (R$)</Label>
              <Input type="number" placeholder="0" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
            </div>
          </div>
          {/* Rodapé do formulário: cancelar ou criar. O botão "Criar" fica
              desativado se não houver nome ou enquanto a criação está em andamento. */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name || createTrip.isPending} className="bg-sky-500 hover:bg-sky-600">
              Criar Viagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
