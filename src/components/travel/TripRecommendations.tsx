import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, MapPin, Utensils, Shirt, ShieldAlert, Lightbulb,
  Star, Plus, Check, ChevronDown, ChevronUp, Phone, Eye
} from 'lucide-react';

interface Restaurant {
  name: string;
  type: string;
  address: string;
  tip: string;
  priceRange: string;
}

interface Place {
  name: string;
  category: string;
  address: string;
  description: string;
  mustSee: boolean;
}

interface TypicalFood {
  name: string;
  description: string;
}

interface Clothing {
  season: string;
  recommendations: string[];
  temperature: string;
  tips: string;
}

interface Safety {
  generalLevel: string;
  avoidAreas: string[];
  tips: string[];
  emergencyNumbers: { service: string; number: string }[];
}

interface Recommendations {
  restaurants: Restaurant[];
  places: Place[];
  typicalFood: TypicalFood[];
  clothing: Clothing;
  safety: Safety;
  generalTips: string[];
}

interface Props {
  tripId: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  onAddToTrip?: (type: string, item: any) => void;
}


const safetyColor = {
  seguro: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  moderado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  atenção: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function TripRecommendations({ tripId, destination, startDate, endDate, onAddToTrip }: Props) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['restaurants', 'places', 'clothing', 'safety']));

  const saveToDb = async (recs: Recommendations) => {
    await (supabase as any)
      .from('trip_recommendations')
      .upsert({ trip_id: tripId, destination, data: recs }, { onConflict: 'trip_id' });
  };

  const generate = async (force = false) => {
    if (!destination) return;
    setLoading(true);
    if (force) setRecommendations(null);
    try {
      const { data, error } = await supabase.functions.invoke('trip-recommendations', {
        body: { destination, startDate, endDate },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations);
      setExpandedSections(new Set(['restaurants', 'places', 'typicalFood', 'clothing', 'safety', 'generalTips']));
      await saveToDb(data.recommendations);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar recomendações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!destination || !tripId) return;
    // Try to load saved recommendations first
    const loadSaved = async () => {
      const { data } = await (supabase as any)
        .from('trip_recommendations')
        .select('data')
        .eq('trip_id', tripId)
        .maybeSingle();
      if (data?.data) {
        setRecommendations(data.data as Recommendations);
        setExpandedSections(new Set(['restaurants', 'places', 'typicalFood', 'clothing', 'safety', 'generalTips']));
      } else {
        generate();
      }
    };
    loadSaved();
  }, [tripId, destination]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const markAdded = (key: string) => {
    setAddedItems(prev => new Set([...prev, key]));
  };

  const handleAddRestaurant = (r: Restaurant, idx: number) => {
    onAddToTrip?.('meal', { title: r.name, description: `${r.type} · ${r.address}${r.tip ? ` · ${r.tip}` : ''}` });
    markAdded(`restaurant_${idx}`);
    toast.success(`"${r.name}" adicionado em Alimentação!`);
  };

  const handleAddPlace = (p: Place, idx: number) => {
    onAddToTrip?.('event', { title: p.name, location: p.address, notes: p.description });
    markAdded(`place_${idx}`);
    toast.success(`"${p.name}" adicionado na Programação!`);
  };

  if (!destination) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Adicione um destino à viagem para ver recomendações.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-violet-500 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">Gerando recomendações com IA...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Buscando o melhor de <strong>{destination}</strong>
            {startDate && ` para ${new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long' })}`}
          </p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <p className="text-xs text-muted-foreground font-medium">Recomendações com IA para <strong className="text-foreground">{destination.split(',')[0]}</strong></p>
        </div>
        <button
          onClick={() => generate(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Loader2 className="w-3 h-3" />
          Gerar novamente
        </button>
      </div>

      <AnimatePresence>
        {recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Restaurants */}
            <Section
              title="Restaurantes" icon={Utensils}
              color="rose" count={recommendations.restaurants.length}
              expanded={expandedSections.has('restaurants')}
              onToggle={() => toggleSection('restaurants')}
            >
              {recommendations.restaurants.map((r, i) => (
                <div key={i} className="border border-border rounded-xl p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm">{r.name}</p>
                        <span className="text-xs text-muted-foreground font-mono">{r.priceRange}</span>
                      </div>
                      <p className="text-xs text-violet-600 dark:text-violet-400">{r.type}</p>
                    </div>
                    {onAddToTrip && (
                      <Button
                        size="sm"
                        variant={addedItems.has(`restaurant_${i}`) ? 'secondary' : 'outline'}
                        className="shrink-0 h-7 px-2 text-xs"
                        onClick={() => handleAddRestaurant(r, i)}
                        disabled={addedItems.has(`restaurant_${i}`)}
                      >
                        {addedItems.has(`restaurant_${i}`) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span className="ml-1">{addedItems.has(`restaurant_${i}`) ? 'Adicionado' : 'Adicionar'}</span>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{r.address}</span>
                  </div>
                  {r.tip && (
                    <div className="flex items-start gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg px-2 py-1">
                      <Star className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{r.tip}</span>
                    </div>
                  )}
                </div>
              ))}
            </Section>

            {/* Places */}
            <Section
              title="O que conhecer" icon={Eye}
              color="sky" count={recommendations.places.length}
              expanded={expandedSections.has('places')}
              onToggle={() => toggleSection('places')}
            >
              {recommendations.places.map((p, i) => (
                <div key={i} className="border border-border rounded-xl p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm">{p.name}</p>
                        {p.mustSee && <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">Must See</Badge>}
                      </div>
                      <p className="text-xs text-sky-600 dark:text-sky-400">{p.category}</p>
                    </div>
                    {onAddToTrip && (
                      <Button
                        size="sm"
                        variant={addedItems.has(`place_${i}`) ? 'secondary' : 'outline'}
                        className="shrink-0 h-7 px-2 text-xs"
                        onClick={() => handleAddPlace(p, i)}
                        disabled={addedItems.has(`place_${i}`)}
                      >
                        {addedItems.has(`place_${i}`) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span className="ml-1">{addedItems.has(`place_${i}`) ? 'Adicionado' : 'Adicionar'}</span>
                      </Button>
                    )}
                  </div>
                  {p.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{p.address}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                </div>
              ))}
            </Section>

            {/* Typical Food */}
            <Section
              title="Alimentação Típica" icon={Utensils}
              color="orange" count={recommendations.typicalFood.length}
              expanded={expandedSections.has('typicalFood')}
              onToggle={() => toggleSection('typicalFood')}
            >
              <div className="space-y-2">
                {recommendations.typicalFood.map((f, i) => (
                  <div key={i} className="border border-border rounded-xl p-3">
                    <p className="font-semibold text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{f.description}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Clothing */}
            {recommendations.clothing && (
              <Section
                title="O que vestir" icon={Shirt}
                color="violet" count={recommendations.clothing.recommendations.length}
                expanded={expandedSections.has('clothing')}
                onToggle={() => toggleSection('clothing')}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">{recommendations.clothing.season}</Badge>
                    {recommendations.clothing.temperature && (
                      <Badge variant="outline" className="text-xs">🌡 {recommendations.clothing.temperature}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {recommendations.clothing.recommendations.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 text-xs">
                        <Shirt className="w-3 h-3 text-violet-500 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  {recommendations.clothing.tips && (
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl px-3 py-2 text-xs text-violet-700 dark:text-violet-400">
                      💡 {recommendations.clothing.tips}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Safety */}
            {recommendations.safety && (
              <Section
                title="Segurança" icon={ShieldAlert}
                color="red" count={recommendations.safety.tips.length}
                expanded={expandedSections.has('safety')}
                onToggle={() => toggleSection('safety')}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Nível geral:</span>
                    <Badge className={`text-xs border-0 ${safetyColor[recommendations.safety.generalLevel?.toLowerCase() as keyof typeof safetyColor] || safetyColor['moderado']}`}>
                      {recommendations.safety.generalLevel}
                    </Badge>
                  </div>
                  {recommendations.safety.avoidAreas?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1.5">⚠️ Áreas a evitar</p>
                      <div className="space-y-1">
                        {recommendations.safety.avoidAreas.map((area, i) => (
                          <div key={i} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg px-2.5 py-1.5">
                            {area}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.safety.tips?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1.5">✅ Dicas de segurança</p>
                      <div className="space-y-1.5">
                        {recommendations.safety.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-green-500 mt-0.5 shrink-0">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {recommendations.safety.emergencyNumbers?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1.5">📞 Números de emergência</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {recommendations.safety.emergencyNumbers.map((n, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
                            <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground leading-none">{n.service}</p>
                              <p className="text-xs font-semibold">{n.number}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* General Tips */}
            {recommendations.generalTips?.length > 0 && (
              <Section
                title="Dicas Gerais" icon={Lightbulb}
                color="amber" count={recommendations.generalTips.length}
                expanded={expandedSections.has('generalTips')}
                onToggle={() => toggleSection('generalTips')}
              >
                <div className="space-y-1.5">
                  {recommendations.generalTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl px-3 py-2">
                      <span className="text-amber-500 shrink-0">💡</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({
  title, icon: Icon, color, count, expanded, onToggle, children
}: {
  title: string;
  icon: any;
  color: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    rose: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30',
    sky: 'text-sky-500 bg-sky-100 dark:bg-sky-900/30',
    orange: 'text-orange-500 bg-orange-100 dark:bg-orange-900/30',
    violet: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30',
    red: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    amber: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{count}</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
