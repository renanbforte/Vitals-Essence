import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Lock } from 'lucide-react';
import tarotBack from '@/assets/tarot/tarot-back.png';
import { MINOR_ARCANA } from '@/lib/tarotMinorArcana';
import { useTarotReadings } from '@/hooks/useAstral';
import spreadSituacao from '@/assets/spread-situacao.png';
import spreadDesafio from '@/assets/spread-desafio.png';
import spreadConselho from '@/assets/spread-conselho.png';
import spreadAjuda from '@/assets/spread-ajuda.png';
import spreadTendencia from '@/assets/spread-tendencia.png';

// Re-use major arcana images
import tarot00 from '@/assets/tarot/tarot-00-fool.png';
import tarot01 from '@/assets/tarot/tarot-01-magician.png';
import tarot02 from '@/assets/tarot/tarot-02-priestess.png';
import tarot03 from '@/assets/tarot/tarot-03-empress.png';
import tarot04 from '@/assets/tarot/tarot-04-emperor.png';
import tarot05 from '@/assets/tarot/tarot-05-hierophant.png';
import tarot06 from '@/assets/tarot/tarot-06-lovers.png';
import tarot07 from '@/assets/tarot/tarot-07-chariot.png';
import tarot08 from '@/assets/tarot/tarot-08-strength.png';
import tarot09 from '@/assets/tarot/tarot-09-hermit.png';
import tarot10 from '@/assets/tarot/tarot-10-wheel.png';
import tarot11 from '@/assets/tarot/tarot-11-justice.png';
import tarot12 from '@/assets/tarot/tarot-12-hanged.png';
import tarot13 from '@/assets/tarot/tarot-13-death.png';
import tarot14 from '@/assets/tarot/tarot-14-temperance.png';
import tarot15 from '@/assets/tarot/tarot-15-devil.png';
import tarot16 from '@/assets/tarot/tarot-16-tower.png';
import tarot17 from '@/assets/tarot/tarot-17-star.png';
import tarot18 from '@/assets/tarot/tarot-18-moon.png';
import tarot19 from '@/assets/tarot/tarot-19-sun.png';
import tarot20 from '@/assets/tarot/tarot-20-judgement.png';
import tarot21 from '@/assets/tarot/tarot-21-world.png';

const MAJOR_CARD_IMAGES: Record<number, string> = {
  0: tarot00, 1: tarot01, 2: tarot02, 3: tarot03, 4: tarot04,
  5: tarot05, 6: tarot06, 7: tarot07, 8: tarot08, 9: tarot09,
  10: tarot10, 11: tarot11, 12: tarot12, 13: tarot13, 14: tarot14,
  15: tarot15, 16: tarot16, 17: tarot17, 18: tarot18, 19: tarot19,
  20: tarot20, 21: tarot21,
};

const MAJOR_ARCANA = [
  { number: 0, name: 'O Louco', keywords: 'Liberdade, novos começos', upright: 'Um novo capítulo se abre. Dê o salto de fé.', reversed: 'Impulsividade e falta de direção.' },
  { number: 1, name: 'O Mago', keywords: 'Vontade, manifestação', upright: 'Você tem todos os recursos para criar sua realidade.', reversed: 'Dons mal utilizados.' },
  { number: 2, name: 'A Sacerdotisa', keywords: 'Intuição, mistério', upright: 'Confie na voz silenciosa da sua alma.', reversed: 'Você está ignorando sua intuição.' },
  { number: 3, name: 'A Imperatriz', keywords: 'Abundância, criatividade', upright: 'É tempo de florescer.', reversed: 'Bloqueio criativo.' },
  { number: 4, name: 'O Imperador', keywords: 'Estrutura, estabilidade', upright: 'Construa com disciplina.', reversed: 'Excesso de controle.' },
  { number: 5, name: 'O Hierofante', keywords: 'Tradição, espiritualidade', upright: 'Busque sabedoria em fontes estabelecidas.', reversed: 'Desafie dogmas ultrapassados.' },
  { number: 6, name: 'Os Amantes', keywords: 'Amor, escolhas', upright: 'Siga o que ressoa com seu coração.', reversed: 'Desalinhamento de valores.' },
  { number: 7, name: 'O Carro', keywords: 'Vitória, determinação', upright: 'Avance com confiança e propósito.', reversed: 'Falta de direção.' },
  { number: 8, name: 'A Força', keywords: 'Coragem, compaixão', upright: 'A verdadeira força nasce da gentileza.', reversed: 'Dúvida sobre si mesmo.' },
  { number: 9, name: 'O Eremita', keywords: 'Introspecção, sabedoria', upright: 'A solidão pode ser um presente agora.', reversed: 'Isolamento excessivo.' },
  { number: 10, name: 'A Roda da Fortuna', keywords: 'Ciclos, mudança', upright: 'Os ciclos estão a seu favor.', reversed: 'Resistência à mudança.' },
  { number: 11, name: 'A Justiça', keywords: 'Equilíbrio, verdade', upright: 'Aja com integridade.', reversed: 'Injustiça ou desonestidade.' },
  { number: 12, name: 'O Enforcado', keywords: 'Pausa, perspectiva', upright: 'Veja com outros olhos.', reversed: 'Resistência ao necessário.' },
  { number: 13, name: 'A Morte', keywords: 'Transformação, renascimento', upright: 'Abrace a transformação sem medo.', reversed: 'Resistência à mudança necessária.' },
  { number: 14, name: 'A Temperança', keywords: 'Equilíbrio, moderação', upright: 'A harmonia vem da moderação.', reversed: 'Excesso e desequilíbrio.' },
  { number: 15, name: 'O Diabo', keywords: 'Apego, libertação', upright: 'Examine seus padrões limitantes.', reversed: 'Você está rompendo um padrão antigo.' },
  { number: 16, name: 'A Torre', keywords: 'Ruptura, revelação', upright: 'O que não serve cai.', reversed: 'Evitando uma mudança necessária.' },
  { number: 17, name: 'A Estrela', keywords: 'Esperança, cura', upright: 'Renove sua fé.', reversed: 'Desespero passageiro.' },
  { number: 18, name: 'A Lua', keywords: 'Ilusão, intuição', upright: 'Confie na sua intuição.', reversed: 'A névoa se dissipa.' },
  { number: 19, name: 'O Sol', keywords: 'Vitalidade, alegria', upright: 'É tempo de brilhar.', reversed: 'Alegria temporariamente encoberta.' },
  { number: 20, name: 'O Julgamento', keywords: 'Renascimento, chamado', upright: 'Responda ao que a vida pede.', reversed: 'Autocrítica excessiva.' },
  { number: 21, name: 'O Mundo', keywords: 'Conclusão, conquista', upright: 'Celebre sua jornada.', reversed: 'Algo ainda precisa ser completado.' },
];

interface SpreadCard {
  name: string;
  keywords: string;
  upright: string;
  reversed: string;
  image: string;
  arcana: 'major' | 'minor';
  cardNumber: number;
  cardId: string;
  elementLabel?: string;
  isReversed: boolean;
}

const POSITIONS = [
  { label: 'Situação Atual', image: spreadSituacao, desc: 'Onde você está agora' },
  { label: 'Desafio', image: spreadDesafio, desc: 'O que se opõe a você' },
  { label: 'Conselho', image: spreadConselho, desc: 'O que o universo sugere' },
  { label: 'O que Ajuda', image: spreadAjuda, desc: 'Forças a seu favor' },
  { label: 'Tendência', image: spreadTendencia, desc: 'Para onde o caminho aponta' },
];

function buildDeck() {
  const major = MAJOR_ARCANA.map(c => ({
    name: c.name, keywords: c.keywords, upright: c.upright, reversed: c.reversed,
    image: MAJOR_CARD_IMAGES[c.number], arcana: 'major' as const,
    cardNumber: c.number, cardId: `major-${c.number}`,
  }));
  const minor = MINOR_ARCANA.map(c => ({
    name: c.name, keywords: c.keywords, upright: c.upright, reversed: c.reversed,
    image: c.image, arcana: 'minor' as const,
    cardNumber: c.number, cardId: c.id, elementLabel: c.elementLabel,
  }));
  return [...major, ...minor];
}

const DECK = buildDeck();

function shuffleDeck() {
  const arr = [...DECK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface Props {
  onBack: () => void;
}

export default function TarotFiveCardSpread({ onBack }: Props) {
  const { readings, saveReading } = useTarotReadings();
  const [phase, setPhase] = useState<'checking' | 'locked' | 'idle' | 'shuffling' | 'picking' | 'revealed'>('checking');
  const [shuffled, setShuffled] = useState<typeof DECK>([]);
  const [drawnCards, setDrawnCards] = useState<SpreadCard[]>([]);
  const [pickIndex, setPickIndex] = useState(0);
  
  const [unlockDate, setUnlockDate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [savedSpread, setSavedSpread] = useState<SpreadCard[] | null>(null);

  // Live countdown timer
  useEffect(() => {
    if (!unlockDate) return;
    const tick = () => {
      const now = new Date();
      const diff = unlockDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [unlockDate]);

  // Check cooldown and existing spread — only on initial load
  useEffect(() => {
    // Don't reset phase if user is mid-flow
    if (phase === 'shuffling' || phase === 'picking' || phase === 'revealed') return;

    const fiveCardReadings = readings.filter(r => r.reading_type?.startsWith('FIVE_CARD_'));
    if (fiveCardReadings.length >= 5) {
      // Group by date to find complete spreads (all 5 positions)
      const byDate: Record<string, typeof fiveCardReadings> = {};
      fiveCardReadings.forEach(r => {
        const dateKey = r.created_at.split('T')[0];
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(r);
      });

      // Find the most recent COMPLETE spread (exactly 5 positions 0-4)
      const completeDates = Object.entries(byDate)
        .filter(([, items]) => {
          const positions = items.map(i => i.reading_type?.replace('FIVE_CARD_', '')).sort();
          return positions.length >= 5 && ['0','1','2','3','4'].every(p => positions.includes(p));
        })
        .sort(([a], [b]) => b.localeCompare(a));

      if (completeDates.length > 0) {
        const [, spreadReadings] = completeDates[0];
        const latestReading = spreadReadings.reduce((a, b) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        );
        const lastDate = new Date(latestReading.created_at);
        const unlock = new Date(lastDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
          const sorted = spreadReadings.sort((a, b) => {
            const posA = parseInt(a.reading_type?.replace('FIVE_CARD_', '') || '0');
            const posB = parseInt(b.reading_type?.replace('FIVE_CARD_', '') || '0');
            return posA - posB;
          });

          const reconstructed: SpreadCard[] = sorted.slice(0, 5).map(r => {
            let card;
            if (r.arcana === 'minor') {
              const minor = MINOR_ARCANA.find(c => c.id === r.card_name || c.name === r.card_name);
              card = minor ? {
                name: minor.name, keywords: minor.keywords, upright: minor.upright,
                reversed: minor.reversed, image: minor.image, arcana: 'minor' as const,
                cardNumber: minor.number, cardId: minor.id, elementLabel: minor.elementLabel,
              } : null;
            } else {
              const major = MAJOR_ARCANA.find(c => c.number === r.card_number);
              card = major ? {
                name: major.name, keywords: major.keywords, upright: major.upright,
                reversed: major.reversed, image: MAJOR_CARD_IMAGES[major.number],
                arcana: 'major' as const, cardNumber: major.number, cardId: `major-${major.number}`,
              } : null;
            }
            return card ? { ...card, isReversed: r.is_reversed } : null;
          }).filter(Boolean) as SpreadCard[];

          if (reconstructed.length === 5) {
            setSavedSpread(reconstructed);
            setDrawnCards(reconstructed);
            
            setUnlockDate(unlock);
            setPhase('revealed');
            return;
          }

          
          setUnlockDate(unlock);
          setPhase('locked');
          return;
        }
      }
    }
    setPhase('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings]);

  const startReading = () => {
    setPhase('shuffling');
    setShuffled(shuffleDeck());
    setDrawnCards([]);
    setPickIndex(0);
    setTimeout(() => setPhase('picking'), 2000);
  };

  const pickCard = async (visualIndex: number) => {
    if (pickIndex >= 5) return;
    const card = shuffled[visualIndex + pickIndex * 7]; // offset to avoid repeats
    const reversed = Math.random() > 0.7;
    const newCard: SpreadCard = { ...card, isReversed: reversed };
    const newDrawn = [...drawnCards, newCard];
    setDrawnCards(newDrawn);

    // Save to DB
    await saveReading({
      card_name: card.arcana === 'minor' ? card.cardId : card.name,
      card_number: card.cardNumber,
      arcana: card.arcana,
      is_reversed: reversed,
      interpretation_text: reversed ? card.reversed : card.upright,
      reading_type: `FIVE_CARD_${pickIndex}`,
      user_question: POSITIONS[pickIndex].label,
    });

    if (pickIndex < 4) {
      setPickIndex(pickIndex + 1);
    } else {
      setPhase('revealed');
    }
  };

  const elementColor = (cardId: string) => {
    if (cardId.startsWith('water')) return { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' };
    if (cardId.startsWith('earth')) return { bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.2)' };
    if (cardId.startsWith('air')) return { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' };
    if (cardId.startsWith('fire')) return { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.2)' };
    return { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.2)' };
  };

  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4">
      <AnimatePresence mode="wait">

        {/* LOCKED */}
        {phase === 'locked' && (
          <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center pt-10 gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Lock className="w-8 h-8 text-violet-400/60" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg mb-1">Tiragem Indisponível</h3>
              <p className="text-white/40 text-sm max-w-xs">
                A tiragem de 5 cartas pode ser feita a cada 7 dias.
              </p>
            </div>

            {/* Live countdown */}
            <div className="flex items-center gap-3">
              {[
                { value: countdown.days, label: 'dias' },
                { value: countdown.hours, label: 'hrs' },
                { value: countdown.minutes, label: 'min' },
                { value: countdown.seconds, label: 'seg' },
              ].map((unit, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      boxShadow: '0 0 15px rgba(139,92,246,0.1)',
                    }}>
                    <span className="text-white font-bold text-xl tabular-nums">
                      {String(unit.value).padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-white/30 text-[9px] mt-1 uppercase tracking-wider">{unit.label}</span>
                </div>
              ))}
            </div>

             <button onClick={onBack}
               className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
               style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
               ← Voltar ao Oráculo
             </button>
          </motion.div>
        )}

        {/* IDLE */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center pt-8 gap-6 px-2">

            {/* Mystical card fan with glow */}
            <div className="relative h-56 w-80 mx-auto flex items-end justify-center">
              {/* Central ambient glow */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-40 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.6), rgba(251,191,36,0.3), transparent)' }} />

              {POSITIONS.map((pos, i) => {
                const angle = (i - 2) * 14;
                const yOffset = Math.abs(i - 2) * 8;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 40, rotate: 0 }}
                    animate={{ opacity: 1, y: -yOffset, rotate: angle }}
                    transition={{ delay: 0.15 + i * 0.08, type: 'spring', damping: 18, stiffness: 120 }}
                    className="absolute rounded-xl overflow-hidden"
                    style={{
                      width: 72, height: 112,
                      left: `calc(50% + ${(i - 2) * 36}px)`,
                      bottom: 0,
                      marginLeft: -36,
                      transformOrigin: 'bottom center',
                      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,${i === 2 ? 0.4 : 0.15}), 0 0 8px rgba(251,191,36,0.15)`,
                      border: i === 2 ? '1.5px solid rgba(251,191,36,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      zIndex: 5 - Math.abs(i - 2),
                    }}>
                    <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                    {i === 2 && (
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(251,191,36,0.08) 0%, transparent 60%)' }} />
                    )}
                  </motion.div>
                );
              })}

              {/* Floating sparkle particles */}
              {[...Array(5)].map((_, i) => (
                <motion.div key={`spark-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: 3, height: 3,
                    background: i % 2 === 0 ? '#fbbf24' : '#c4b5fd',
                    left: `${25 + i * 14}%`,
                    top: `${15 + (i % 3) * 20}%`,
                  }}
                  animate={{ opacity: [0, 0.8, 0], y: [0, -12, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 2 + i * 0.5, delay: i * 0.4, repeat: Infinity }}
                />
              ))}
            </div>

            {/* Title and description */}
            <div className="text-center space-y-2">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-bold text-xl"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Tiragem de 5 Cartas
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white/40 text-sm max-w-[280px] mx-auto leading-relaxed">
                Uma leitura profunda sobre sua jornada. Disponível a cada 7 dias.
              </motion.p>
            </div>

            {/* Position badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap justify-center gap-2 max-w-xs">
              {POSITIONS.map((p, i) => (
                <div key={i}
                  className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-xl font-medium"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    color: 'rgba(196,181,253,0.8)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  <img src={p.image} alt="" className="w-4 h-4 rounded-full object-cover" style={{ boxShadow: '0 0 4px rgba(139,92,246,0.3)' }} />
                  {p.label}
                </div>
              ))}
            </motion.div>

            {/* CTA button */}
            <motion.button onClick={startReading}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring' }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2.5 h-14 px-12 rounded-2xl font-semibold text-base text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)',
                boxShadow: '0 0 40px rgba(217,119,6,0.35), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
              <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%)' }} />
              <Sparkles className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Iniciar Tiragem</span>
            </motion.button>

             <button onClick={onBack}
               className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
               style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
               ← Voltar ao Oráculo
             </button>
          </motion.div>
        )}

        {/* SHUFFLING */}
        {phase === 'shuffling' && (
          <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-96 gap-6">
            <div className="relative h-44 w-32">
              {[...Array(6)].map((_, i) => (
                <motion.div key={i} className="absolute inset-0 rounded-xl overflow-hidden"
                  animate={{
                    x: [0, (i % 2 === 0 ? 30 : -30), 0, (i % 2 === 0 ? -20 : 20), 0],
                    rotate: [0, (i % 2 === 0 ? 8 : -8), 0],
                  }}
                  transition={{ duration: 0.6, delay: i * 0.08, repeat: 2, ease: 'easeInOut' }}
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', zIndex: 6 - i }}>
                  <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
            <motion.p animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/50 text-sm tracking-widest">
              Embaralhando para a tiragem...
            </motion.p>
          </motion.div>
        )}

        {/* PICKING */}
        {phase === 'picking' && (
          <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center pt-4 gap-4">

            {/* Progress dots */}
            <div className="flex items-center gap-3 mb-1">
              {POSITIONS.map((pos, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                    i < pickIndex ? 'scale-100' : i === pickIndex ? 'scale-110' : 'scale-90 opacity-40'
                  }`} style={{
                    background: i < pickIndex ? 'rgba(251,191,36,0.2)' : i === pickIndex ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
                    border: i === pickIndex ? '2px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: i === pickIndex ? '0 0 15px rgba(251,191,36,0.3)' : 'none',
                  }}>
                    {i < pickIndex ? '✓' : <img src={pos.image} alt="" className="w-5 h-5 rounded-full object-cover" />}
                  </div>
                  <span className={`text-[8px] font-medium ${i === pickIndex ? 'text-amber-300/90' : 'text-white/30'}`}>
                    {pos.label.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center flex flex-col items-center gap-1">
              <img src={POSITIONS[pickIndex].image} alt="" className="w-8 h-8 rounded-full object-cover" style={{ boxShadow: '0 0 12px rgba(251,191,36,0.3)' }} />
              <p className="text-amber-300/80 text-sm font-medium">
                {POSITIONS[pickIndex].label}
              </p>
              <p className="text-white/35 text-xs">{POSITIONS[pickIndex].desc}</p>
            </div>

            <p className="text-white/40 text-xs tracking-widest">Escolha uma carta</p>

            <div className="flex justify-center gap-2 flex-wrap px-2">
              {[...Array(7)].map((_, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, y: 40, rotate: (i - 3) * 5 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', damping: 15 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => pickCard(i)}
                  className="w-14 h-22 rounded-lg overflow-hidden flex-shrink-0"
                  style={{
                    width: 56, height: 88,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(251,191,36,0.15)',
                    border: '1px solid rgba(251,191,36,0.2)',
                  }}>
                  <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>

            {/* Already picked cards mini */}
            {drawnCards.length > 0 && (
              <div className="flex gap-2 mt-2">
                {drawnCards.map((c, i) => (
                  <div key={i} className="w-10 h-14 rounded-lg overflow-hidden"
                    style={{
                      border: '1px solid rgba(251,191,36,0.3)',
                      boxShadow: '0 0 8px rgba(251,191,36,0.2)',
                      transform: c.isReversed ? 'rotate(180deg)' : 'none',
                    }}>
                    <img src={c.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* REVEALED */}
        {phase === 'revealed' && drawnCards.length === 5 && (
          <motion.div key="revealed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="space-y-6 pt-2">

            <div className="text-center mb-1">
              <h3 className="font-bold text-lg" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Sua Tiragem de 5 Cartas
              </h3>
              {savedSpread && unlockDate && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  {[
                    { value: countdown.days, label: 'd' },
                    { value: countdown.hours, label: 'h' },
                    { value: countdown.minutes, label: 'm' },
                    { value: countdown.seconds, label: 's' },
                  ].map((unit, idx) => (
                    <div key={idx} className="flex items-center gap-0.5">
                      <span className="text-amber-300/80 font-bold text-sm tabular-nums">{String(unit.value).padStart(2, '0')}</span>
                      <span className="text-white/30 text-[9px]">{unit.label}</span>
                    </div>
                  ))}
                  <span className="text-white/25 text-[10px] ml-1">para próxima</span>
                </div>
              )}
              {!savedSpread && (
                <p className="text-white/35 text-xs mt-1">Toque em uma carta para ver detalhes</p>
              )}
            </div>

            {/* Cards — vertical full-width like daily reading */}
            <div className="space-y-8">
              {drawnCards.map((card, i) => {
                const ec = elementColor(card.cardId);
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: savedSpread ? 0 : i * 0.12 }}
                    className="flex flex-col items-center">

                    {/* Position label above card */}
                    <div className="flex items-center gap-2 mb-3">
                      <img src={POSITIONS[i].image} alt="" className="w-6 h-6 rounded-full object-cover" style={{ boxShadow: '0 0 8px rgba(139,92,246,0.4)' }} />
                      <span className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                        {POSITIONS[i].label}
                      </span>
                    </div>

                    {/* Large card image */}
                    <div className="relative mx-auto flex items-center justify-center p-1 rounded-2xl"
                      style={{
                        width: 230,
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(139,92,246,0.1))',
                        border: '2px solid rgba(251,191,36,0.25)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 30px rgba(139,92,246,0.2), 0 0 15px rgba(251,191,36,0.1)',
                        transform: card.isReversed ? 'rotate(180deg)' : 'none',
                      }}>
                      <img src={card.image} alt={card.name} className="w-full h-auto block rounded-xl" />
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[10px] px-3 py-1 rounded-full font-medium"
                        style={{
                          background: card.arcana === 'major' ? 'rgba(168,85,247,0.12)' : ec.bg,
                          color: card.arcana === 'major' ? '#c4b5fd' : ec.text,
                          border: `1px solid ${card.arcana === 'major' ? 'rgba(168,85,247,0.25)' : ec.border}`,
                        }}>
                        {card.arcana === 'major' ? 'Arcano Maior' : card.elementLabel?.replace(/[^\p{L}\p{N}\s]/gu, '').trim()}
                      </span>
                      {card.isReversed && (
                        <span className="text-[10px] px-3 py-1 rounded-full text-rose-400 font-medium"
                          style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)' }}>
                          Invertida
                        </span>
                      )}
                    </div>

                    {/* Card name & keywords */}
                    <h4 className="text-white font-bold text-xl mt-2 text-center">{card.name}</h4>
                    <p className="text-white/40 text-xs text-center italic">{card.keywords}</p>

                    {/* Interpretation */}
                    <p className="text-white/70 text-sm leading-relaxed text-center mt-2 max-w-[280px] italic">
                      {card.isReversed ? card.reversed : card.upright}
                    </p>

                    {/* Separator between cards */}
                    {i < 4 && (
                      <div className="w-24 h-px mt-6" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)' }} />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Back button */}
            <div className="flex justify-center pt-2 pb-4">
               <button onClick={onBack}
                 className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
                 style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                 ← Voltar ao Oráculo
               </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
