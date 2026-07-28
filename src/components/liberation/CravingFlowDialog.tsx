import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wind, Clock, Shield, Repeat, PenLine, Hand } from 'lucide-react';
import type { Challenge } from '@/hooks/useLiberation';
import { getViceStrategy, type ViceStrategy } from '@/lib/viceStrategies';

const defaultEmotions = ['Ansiedade', 'Tédio', 'Estresse', 'Tristeza', 'Cansaço', 'Hábito automático', 'Outro'];
const defaultSubstitutions = [
  { label: 'Respirar fundo', icon: '🫁' },
  { label: 'Beber água', icon: '💧' },
  { label: 'Caminhar 5 min', icon: '🚶' },
  { label: 'Ouvir música', icon: '🎵' },
  { label: 'Tarefa leve', icon: '📝' },
  { label: 'Mandar mensagem', icon: '💬' },
  { label: 'Esperar 10 min', icon: '⏳' },
];

type Step = 'welcome' | 'breathe' | 'trigger' | 'anchor' | 'choice' | 'resist' | 'substitute' | 'register' | 'cede' | 'closing';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenges: (Challenge & { vice_strategy_id?: string })[];
  onRecord: (data: { challenge_id: string; trigger_emotions: string[]; intensity: string; outcome: string; substitution_used?: string }) => void;
}

export default function CravingFlowDialog({ open, onOpenChange, challenges, onRecord }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<string>('medium');
  const [breathCount, setBreathCount] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [lastOutcome, setLastOutcome] = useState('resisted');

  // Get current strategy based on selected challenge
  const currentChallenge = challenges.find(c => c.id === selectedChallenge);
  const strategy: ViceStrategy | undefined = currentChallenge
    ? getViceStrategy((currentChallenge as any).vice_strategy_id ?? '')
    : undefined;

  const substitutions = strategy?.substitutions ?? defaultSubstitutions;
  const anchorMessage = strategy?.anchorMessage ?? 'Essa vontade costuma durar alguns minutos.';
  const avgMinutes = strategy?.avgCravingMinutes ?? 10;

  useEffect(() => {
    if (open) {
      setStep('welcome');
      setSelectedChallenge(challenges[0]?.id ?? '');
      setSelectedEmotions([]);
      setIntensity('medium');
      setBreathCount(0);
      setBreathing(false);
      setTimerSeconds(0);
      setTimerActive(false);
    }
  }, [open, challenges]);

  // Breathing timer
  useEffect(() => {
    if (!breathing) return;
    const interval = setInterval(() => {
      setBreathCount(c => {
        if (c >= 5) { setBreathing(false); return c; }
        return c + 1;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [breathing]);

  // Resist timer
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const toggleEmotion = (e: string) => setSelectedEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const finish = (outcome: string, sub?: string) => {
    if (selectedChallenge) {
      onRecord({ challenge_id: selectedChallenge, trigger_emotions: selectedEmotions, intensity, outcome, substitution_used: sub });
    }
    setLastOutcome(outcome);
    setStep('closing');
  };

  const closingMessages: Record<string, string> = {
    resisted: 'Você atravessou um momento difícil.',
    substituted: 'Você escolheu algo diferente. Isso é força.',
    registered: 'Obrigado por observar. Cada registro importa.',
    ceded: 'Tudo bem. Isso não apaga seu progresso.',
  };

  const tealBg = 'hsl(170, 60%, 42%)';
  const slideAnim = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -15 }, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-3xl bg-gradient-to-b from-[hsl(170,25%,96%)] to-[hsl(170,15%,99%)]">
        <div className="min-h-[400px] flex flex-col justify-between p-6">
          <AnimatePresence mode="wait">
            {/* WELCOME */}
            {step === 'welcome' && (
              <motion.div key="welcome" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${tealBg}20` }}>
                  <Wind className="w-8 h-8" style={{ color: tealBg }} />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Tudo bem. A vontade passa.</h2>
                <p className="text-muted-foreground text-sm">Vamos atravessar isso juntos.</p>
                {challenges.length > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {challenges.filter(c => c.status === 'active').map(c => (
                      <button key={c.id} onClick={() => setSelectedChallenge(c.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedChallenge === c.id ? 'text-white shadow-md' : 'bg-muted text-muted-foreground'}`}
                        style={selectedChallenge === c.id ? { background: tealBg } : {}}>
                        {c.icon} {c.title}
                      </button>
                    ))}
                  </div>
                )}
                <Button onClick={() => setStep('breathe')} className="mt-4 rounded-2xl px-8 h-12 text-base font-semibold" style={{ background: tealBg }}>
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* BREATHE */}
            {step === 'breathe' && (
              <motion.div key="breathe" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <h2 className="text-lg font-bold text-foreground">Vamos ganhar 30 segundos.</h2>
                {!breathing && breathCount === 0 ? (
                  <div className="flex flex-col gap-3 mt-4">
                    <Button onClick={() => setBreathing(true)} variant="outline" className="rounded-2xl h-12 gap-2" style={{ borderColor: tealBg, color: tealBg }}>
                      <Wind className="w-5 h-5" /> Respirar comigo
                    </Button>
                    <Button variant="ghost" onClick={() => setStep('trigger')} className="text-muted-foreground rounded-2xl">
                      Pular essa parte →
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{ scale: breathing ? [1, 1.6, 1.6, 1] : 1, opacity: breathing ? [0.6, 1, 1, 0.6] : 1 }}
                      transition={{ duration: 6, repeat: breathing ? Infinity : 0, ease: 'easeInOut' }}
                      className="w-28 h-28 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${tealBg}30, ${tealBg}10)` }}>
                      <span className="text-sm font-medium" style={{ color: tealBg }}>
                        {breathing ? 'Respire...' : 'Pronto'}
                      </span>
                    </motion.div>
                    <p className="text-xs text-muted-foreground">{breathCount}/5 ciclos</p>
                    {!breathing && breathCount >= 5 && (
                      <Button onClick={() => setStep('trigger')} className="rounded-2xl px-6" style={{ background: tealBg }}>
                        Continuar
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* TRIGGER */}
            {step === 'trigger' && (
              <motion.div key="trigger" {...slideAnim} className="flex-1 flex flex-col gap-4">
                <h2 className="text-lg font-bold text-foreground">O que está puxando essa vontade agora?</h2>
                <div className="flex flex-wrap gap-2">
                  {defaultEmotions.map(e => (
                    <button key={e} onClick={() => toggleEmotion(e)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${selectedEmotions.includes(e) ? 'text-white shadow-md' : 'bg-muted text-muted-foreground'}`}
                      style={selectedEmotions.includes(e) ? { background: tealBg } : {}}>
                      {e}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Intensidade</p>
                  <div className="flex gap-2">
                    {[{ v: 'light', l: 'Leve' }, { v: 'medium', l: 'Média' }, { v: 'strong', l: 'Forte' }].map(i => (
                      <button key={i.v} onClick={() => setIntensity(i.v)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${intensity === i.v ? 'text-white shadow-md' : 'bg-muted text-muted-foreground'}`}
                        style={intensity === i.v ? { background: tealBg } : {}}>
                        {i.l}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setStep('anchor')} className="mt-auto rounded-2xl" style={{ background: tealBg }}>
                  Continuar
                </Button>
              </motion.div>
            )}

            {/* ANCHOR — personalized per vice */}
            {step === 'anchor' && (
              <motion.div key="anchor" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <Clock className="w-10 h-10" style={{ color: tealBg }} />
                <h2 className="text-lg font-bold text-foreground">{anchorMessage}</h2>
                <p className="text-muted-foreground text-sm">
                  Duração média: ~{avgMinutes} min. Você não precisa decidir nada agora.
                </p>
                <Button onClick={() => setStep('choice')} className="mt-4 rounded-2xl px-6" style={{ background: tealBg }}>
                  Ver opções
                </Button>
              </motion.div>
            )}

            {/* CHOICE */}
            {step === 'choice' && (
              <motion.div key="choice" {...slideAnim} className="flex-1 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-foreground text-center mb-2">O que você quer fazer agora?</h2>
                {[
                  { step: 'resist' as Step, icon: <Shield className="w-5 h-5" />, title: 'Atravessar sem ceder', sub: 'Vou deixar passar' },
                  { step: 'substitute' as Step, icon: <Repeat className="w-5 h-5" />, title: 'Trocar por outra coisa', sub: 'Me dá uma alternativa' },
                  { step: 'register' as Step, icon: <PenLine className="w-5 h-5" />, title: 'Registrar e seguir', sub: 'Quero só registrar' },
                  { step: 'cede' as Step, icon: <Hand className="w-5 h-5" />, title: 'Ceder conscientemente', sub: 'Vou ceder agora' },
                ].map(opt => (
                  <button key={opt.step} onClick={() => setStep(opt.step)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card hover:bg-muted/50 transition-all text-left border border-border/30">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tealBg}15`, color: tealBg }}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{opt.title}</p>
                      <p className="text-xs text-muted-foreground">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* RESIST */}
            {step === 'resist' && (
              <motion.div key="resist" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4"
                onAnimationComplete={() => setTimerActive(true)}>
                <h2 className="text-lg font-bold text-foreground">Ótimo. Vamos esperar juntos.</h2>
                <motion.div animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 4, repeat: Infinity }}
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: `${tealBg}15`, color: tealBg }}>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </motion.div>
                <p className="text-sm text-muted-foreground">Você pode sair do app. Eu fico aqui.</p>
                <Button onClick={() => finish('resisted')} className="mt-4 rounded-2xl px-6" style={{ background: tealBg }}>
                  A vontade diminuiu ✓
                </Button>
              </motion.div>
            )}

            {/* SUBSTITUTE — personalized per vice */}
            {step === 'substitute' && (
              <motion.div key="substitute" {...slideAnim} className="flex-1 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-foreground">
                  {strategy ? `Para ${strategy.label}, tente:` : 'O que pode ocupar esse espaço?'}
                </h2>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {substitutions.map(s => (
                    <button key={s.label} onClick={() => finish('substituted', s.label)}
                      className="flex items-center gap-2 p-3 rounded-2xl bg-card hover:bg-muted/50 transition-all border border-border/30 text-left">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* REGISTER */}
            {step === 'register' && (
              <motion.div key="register" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4"
                onAnimationComplete={() => finish('registered')}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${tealBg}20` }}>
                  <PenLine className="w-7 h-7" style={{ color: tealBg }} />
                </div>
                <h2 className="text-lg font-bold text-foreground">Registrado. Obrigado por observar.</h2>
              </motion.div>
            )}

            {/* CEDE */}
            {step === 'cede' && (
              <motion.div key="cede" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <h2 className="text-lg font-bold text-foreground">Tudo bem. Isso não apaga seu progresso.</h2>
                <p className="text-muted-foreground text-sm">Recaída vira aprendizado, não reset.</p>
                <Button onClick={() => finish('ceded')} className="mt-4 rounded-2xl px-6" style={{ background: tealBg }}>
                  Registrar e seguir
                </Button>
              </motion.div>
            )}

            {/* CLOSING */}
            {step === 'closing' && (
              <motion.div key="closing" {...slideAnim} className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: `${tealBg}20` }}>
                  🌱
                </motion.div>
                <h2 className="text-lg font-bold text-foreground">{closingMessages[lastOutcome]}</h2>
                <p className="text-muted-foreground text-sm italic">"Um passo consciente vale muito."</p>
                <Button onClick={() => onOpenChange(false)} className="mt-4 rounded-2xl px-6" style={{ background: tealBg }}>
                  Fechar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
