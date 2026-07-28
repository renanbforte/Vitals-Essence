import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, ArrowLeft, Check, Search } from 'lucide-react';
import { VICE_STRATEGIES, getVicesByCategory } from '@/lib/viceStrategies';
import { getViceImage } from '@/lib/viceImages';

const intentionOptions = [
  { value: 'reduce', label: 'Quero reduzir', icon: '📉', desc: 'Diminuir a frequência ou intensidade' },
  { value: 'pause', label: 'Quero pausar', icon: '⏸️', desc: 'Dar um tempo e observar' },
  { value: 'quit', label: 'Quero largar', icon: '🚪', desc: 'Me libertar completamente' },
  { value: 'understanding', label: 'Ainda estou entendendo', icon: '🔍', desc: 'Quero me conhecer melhor' },
];

const triggerCategories = [
  { type: 'emotion', values: ['Ansiedade', 'Tédio', 'Estresse', 'Tristeza', 'Cansaço', 'Solidão'] },
  { type: 'situation', values: ['Hábito automático', 'Pressão social', 'Celebração', 'Fim do dia', 'Madrugada'] },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; intention_level: string; icon: string; vice_strategy_id?: string; triggers: { type: string; value: string }[] }) => void;
}

export default function CreateChallengeDialog({ open, onOpenChange, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🌱');
  const [viceStrategyId, setViceStrategyId] = useState<string | undefined>();
  const [intention, setIntention] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<{ type: string; value: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const reset = () => { setStep(0); setTitle(''); setIcon('🌱'); setIntention(''); setSelectedTriggers([]); setSearchQuery(''); setUseCustom(false); setViceStrategyId(undefined); };

  const toggleTrigger = (type: string, value: string) => {
    setSelectedTriggers(prev => {
      const exists = prev.find(t => t.type === type && t.value === value);
      if (exists) return prev.filter(t => !(t.type === type && t.value === value));
      return [...prev, { type, value }];
    });
  };

  const handleSubmit = () => {
    onSubmit({ title, intention_level: intention, icon, vice_strategy_id: viceStrategyId, triggers: selectedTriggers });
    reset();
    onOpenChange(false);
  };

  const handleSelectVice = (vice: typeof VICE_STRATEGIES[0]) => {
    setTitle(vice.label);
    setIcon(vice.icon);
    setViceStrategyId(vice.id);
    setUseCustom(false);
    setStep(1);
  };

  const handleCustom = () => {
    setUseCustom(true);
    setViceStrategyId(undefined);
    setTitle('');
    setIcon('🌱');
  };

  const canNext = step === 0 ? title.trim().length > 0 : step === 1 ? !!intention : true;

  const categories = getVicesByCategory();
  const filteredCategories = Object.entries(categories).reduce((acc, [cat, vices]) => {
    const filtered = searchQuery ? vices.filter(v => v.label.toLowerCase().includes(searchQuery.toLowerCase())) : vices;
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as Record<string, typeof VICE_STRATEGIES>);

  const teal = 'hsl(170, 60%, 42%)';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-gradient-to-b from-[hsl(170,30%,97%)] to-background border-none rounded-3xl max-h-[85vh]">
        {/* Progress */}
        <div className="flex gap-1.5 px-6 pt-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: teal }}
                animate={{ width: step >= i ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 min-h-[340px] flex flex-col overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 0: Choose vice */}
            {step === 0 && !useCustom && (
              <motion.div key="step0-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-4 pt-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">O que você quer reduzir ou largar?</h3>
                  <p className="text-sm text-muted-foreground mt-1">Escolha abaixo ou escreva o seu.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar..." className="pl-9 rounded-2xl h-10 bg-card border-border/50" />
                </div>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  {Object.entries(filteredCategories).map(([cat, vices]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {vices.map(v => (
                          <button key={v.id} onClick={() => handleSelectVice(v)}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-card hover:bg-muted/50 transition-all border border-border/30 text-left">
                            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-muted shadow-sm">
                              <img src={getViceImage(v.id)} alt={v.label} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs font-medium text-foreground truncate">{v.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleCustom}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 underline text-center">
                  Não encontrei. Quero escrever o meu.
                </button>
              </motion.div>
            )}

            {/* STEP 0 custom: free text */}
            {step === 0 && useCustom && (
              <motion.div key="step0-custom" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-5 pt-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Descreva com suas palavras</h3>
                  <p className="text-sm text-muted-foreground mt-1">Não precisa ser técnico.</p>
                </div>
                <Input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Beber durante a semana"
                  className="text-base rounded-2xl h-12 bg-card border-border/50" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Escolha um ícone</p>
                  <div className="flex gap-2 flex-wrap">
                    {['🌱', '🍃', '💧', '🔥', '🧘', '🌊', '⭐', '🦋', '🌸', '💎'].map(ic => (
                      <button key={ic} onClick={() => setIcon(ic)}
                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${icon === ic ? 'text-white scale-110 shadow-md' : 'bg-muted hover:bg-muted/80'}`}
                        style={icon === ic ? { background: teal } : {}}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setUseCustom(false); setSearchQuery(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline text-center">
                  ← Voltar para lista
                </button>
              </motion.div>
            )}

            {/* STEP 1: Intention */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-3 pt-4">
                <h3 className="text-lg font-bold text-foreground">Qual a sua intenção?</h3>
                <p className="text-sm text-muted-foreground">Isso muda toda a experiência.</p>
                <div className="flex flex-col gap-2 mt-2">
                  {intentionOptions.map(opt => (
                    <button key={opt.value} onClick={() => setIntention(opt.value)}
                      className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${intention === opt.value ? 'bg-[hsl(170,60%,42%)]/10 ring-2 ring-[hsl(170,60%,42%)]' : 'bg-card hover:bg-muted/50'}`}>
                      <span className="text-xl">{opt.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Triggers */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col gap-4 pt-4">
                <h3 className="text-lg font-bold text-foreground">O que costuma puxar essa vontade?</h3>
                <p className="text-sm text-muted-foreground">Selecione quantos quiser. Isso vira inteligência depois.</p>
                {triggerCategories.map(cat => (
                  <div key={cat.type}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.type === 'emotion' ? 'Emoções' : 'Situações'}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.values.map(v => {
                        const selected = selectedTriggers.some(t => t.type === cat.type && t.value === v);
                        return (
                          <button key={v} onClick={() => toggleTrigger(cat.type, v)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selected ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            style={selected ? { background: teal } : {}}>{v}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 mt-4 pt-3 border-t border-border/30">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
            <div className="flex-1" />
            {step === 0 && useCustom && (
              <Button size="sm" onClick={() => setStep(1)} disabled={!canNext}
                className="rounded-xl px-5" style={{ background: teal }}>
                Continuar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 1 && (
              <Button size="sm" onClick={() => setStep(2)} disabled={!canNext}
                className="rounded-xl px-5" style={{ background: teal }}>
                Continuar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button size="sm" onClick={handleSubmit}
                className="rounded-xl px-5" style={{ background: teal }}>
                <Check className="w-4 h-4 mr-1" /> Criar desafio
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
