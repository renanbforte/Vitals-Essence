import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Sparkles, Clock, MapPin } from 'lucide-react';
import { useAstral } from '@/hooks/useAstral';

interface AstralOnboardingProps {
  onComplete: () => void;
}

const steps = [
  { id: 1, title: 'Qual é o seu nome, viajante?', subtitle: 'Como as estrelas devem te chamar' },
  { id: 2, title: 'Quando sua alma chegou a este plano?', subtitle: 'Data do seu nascimento' },
  { id: 3, title: 'Em que momento o universo celebrou?', subtitle: 'Hora exata do nascimento' },
  { id: 4, title: 'Onde seu mapa estelar foi ancorado?', subtitle: 'Cidade de nascimento' },
];

export default function AstralOnboarding({ onComplete }: AstralOnboardingProps) {
  const { saveProfile, isSaving } = useAstral();
  const [step, setStep] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_city: '',
  });

  const isStepValid = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.birth_date.length > 0;
    return true; // steps 2 and 3 are optional
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setShowReveal(true);
    try {
      await saveProfile({
        birth_date: form.birth_date,
        birth_time: form.birth_time || undefined,
        birth_city: form.birth_city || undefined,
      });
      setTimeout(() => onComplete(), 3000);
    } catch {
      setShowReveal(false);
    }
  };

  if (showReveal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col items-center justify-center text-center px-8"
      >
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-8"
        >
          ✨
        </motion.div>
        <h2 className="text-2xl font-bold text-amber-300 mb-3">
          Tecendo a tapeçaria do seu cosmos...
        </h2>
        <p className="text-white/60 text-sm">
          Os planetas estão se alinhando para revelar seu mapa natal único
        </p>
        <div className="mt-8 flex gap-2">
          {['♈','♉','♊','♋','♌','♍'].map((s, i) => (
            <motion.span
              key={s}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5, delay: i * 0.25, repeat: Infinity }}
              className="text-xl text-purple-300"
            >
              {s}
            </motion.span>
          ))}
        </div>
      </motion.div>
    );
  }

  const currentStep = steps[step];
  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      {/* Progress */}
      <div className="flex gap-2 mb-10">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-amber-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.35 }}
          className="flex-1 flex flex-col"
        >
          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-purple-300" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h2>
            <p className="text-white/50 text-sm">{currentStep.subtitle}</p>
          </div>

          <div className="space-y-4">
            {step === 0 && (
              <div>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Seu nome..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base rounded-xl focus:border-purple-400 focus:ring-purple-400/20"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && isStepValid() && handleNext()}
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <Input
                  type="date"
                  value={form.birth_date}
                  onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white h-12 text-base rounded-xl focus:border-purple-400 [color-scheme:dark]"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <Input
                  type="time"
                  value={form.birth_time}
                  onChange={e => setForm(f => ({ ...f, birth_time: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white h-12 text-base rounded-xl focus:border-purple-400 [color-scheme:dark]"
                />
                <p className="text-white/30 text-xs flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Sem a hora exata, o Ascendente será aproximado
                </p>
                <button
                  onClick={handleNext}
                  className="text-purple-400 text-xs underline"
                >
                  Não sei a hora — continuar sem ela
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <Input
                  value={form.birth_city}
                  onChange={e => setForm(f => ({ ...f, birth_city: e.target.value }))}
                  placeholder="Ex: São Paulo, Brasil..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-base rounded-xl focus:border-purple-400 focus:ring-purple-400/20"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleNext()}
                />
                <p className="text-white/30 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" />
                  Usado para calcular as casas astrológicas com precisão
                </p>
              </div>
            )}
          </div>

          <div className="mt-auto pt-8">
            <Button
              onClick={handleNext}
              disabled={!isStepValid() || isSaving}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-base border-0"
            >
              {step === steps.length - 1 ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Revelar meu Mapa Astral
                </>
              ) : (
                <>
                  Continuar
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
