import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useTarotReadings } from '@/hooks/useAstral';
import TarotFiveCardSpread from './TarotFiveCardSpread';

// Major Arcana card images
import tarotBack from '@/assets/tarot/tarot-back.png';
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

import { MINOR_ARCANA } from '@/lib/tarotMinorArcana';

const MAJOR_CARD_IMAGES: Record<number, string> = {
  0: tarot00, 1: tarot01, 2: tarot02, 3: tarot03, 4: tarot04,
  5: tarot05, 6: tarot06, 7: tarot07, 8: tarot08, 9: tarot09,
  10: tarot10, 11: tarot11, 12: tarot12, 13: tarot13, 14: tarot14,
  15: tarot15, 16: tarot16, 17: tarot17, 18: tarot18, 19: tarot19,
  20: tarot20, 21: tarot21,
};

const MAJOR_ARCANA = [
  { number: 0, name: 'O Louco', keywords: 'Liberdade, novos começos, aventura',
    upright: 'Um novo capítulo se abre. Dê o salto de fé — o universo sustenta seus passos.', reversed: 'Impulsividade e falta de direção. Pause antes de agir.' },
  { number: 1, name: 'O Mago', keywords: 'Vontade, manifestação, poder criativo',
    upright: 'Você tem todos os recursos para criar a realidade que deseja. Aja com intenção.', reversed: 'Dons mal utilizados. Revise suas motivações.' },
  { number: 2, name: 'A Sacerdotisa', keywords: 'Intuição, mistério, sabedoria interior',
    upright: 'A resposta já está em você. Confie na voz silenciosa da sua alma.', reversed: 'Você está ignorando sua intuição. Escute com mais atenção.' },
  { number: 3, name: 'A Imperatriz', keywords: 'Abundância, criatividade, natureza',
    upright: 'É tempo de florescer. Nutra seus projetos e relacionamentos com amor maternal.', reversed: 'Bloqueio criativo ou dependência emocional. Cuide de si primeiro.' },
  { number: 4, name: 'O Imperador', keywords: 'Estrutura, autoridade, estabilidade',
    upright: 'Construa com disciplina. Sua liderança é necessária neste momento.', reversed: 'Excesso de controle ou rigidez. Aprenda a soltar.' },
  { number: 5, name: 'O Hierofante', keywords: 'Tradição, espiritualidade, ensino',
    upright: 'Busque sabedoria em fontes estabelecidas. Um mentor pode iluminar seu caminho.', reversed: 'Desafie dogmas que não servem mais à sua evolução.' },
  { number: 6, name: 'Os Amantes', keywords: 'Amor, escolhas, alinhamento',
    upright: 'Uma escolha importante se apresenta. Siga o que ressoa com seu coração mais profundo.', reversed: 'Desalinhamento de valores. Revisite seus compromissos.' },
  { number: 7, name: 'O Carro', keywords: 'Vitória, determinação, movimento',
    upright: 'Você tem força para superar qualquer obstáculo. Avance com confiança e propósito.', reversed: 'Controle excessivo ou falta de direção. Reequilibre forças.' },
  { number: 8, name: 'A Força', keywords: 'Coragem, compaixão, autocontrole',
    upright: 'A verdadeira força nasce da gentileza. Domine seus desafios com amor e paciência.', reversed: 'Dúvida sobre si mesmo. Reconecte-se com sua força interior.' },
  { number: 9, name: 'O Eremita', keywords: 'Introspecção, sabedoria, solidão criativa',
    upright: 'Um tempo de recolhimento é necessário. A solidão pode ser seu maior presente agora.', reversed: 'Isolamento excessivo. Não tenha medo de se reconectar.' },
  { number: 10, name: 'A Roda da Fortuna', keywords: 'Ciclos, destino, mudança',
    upright: 'Os ciclos da vida estão a seu favor. Confie no movimento natural das coisas.', reversed: 'Resistência à mudança. Solte o controle e fluia.' },
  { number: 11, name: 'A Justiça', keywords: 'Equilíbrio, verdade, karma',
    upright: 'Aja com integridade. O universo observa e reequilibra o que está fora de alinhamento.', reversed: 'Injustiça ou desonestidade. Enfrente a verdade com coragem.' },
  { number: 12, name: 'O Enforcado', keywords: 'Pausa, perspectiva, entrega',
    upright: 'Este é o momento de pausar e ver com outros olhos. A rendição traz iluminação.', reversed: 'Resistência ao que é necessário. Deixe o ego de lado.' },
  { number: 13, name: 'A Morte', keywords: 'Transformação, fim de ciclo, renascimento',
    upright: 'Uma fase se encerra para que algo maior nasça. Abrace a transformação sem medo.', reversed: 'Resistência à mudança necessária. Deixe o velho morrer.' },
  { number: 14, name: 'A Temperança', keywords: 'Equilíbrio, moderação, fluxo',
    upright: 'A harmonia vem da moderação. Integre os opostos dentro de você com paciência.', reversed: 'Excesso e desequilíbrio. Reajuste seu ritmo.' },
  { number: 15, name: 'O Diabo', keywords: 'Apego, sombra, libertação',
    upright: 'Examine seus apegos e padrões limitantes. O poder de se libertar está em suas mãos.', reversed: 'Libertação de correntes. Você está rompendo um padrão antigo.' },
  { number: 16, name: 'A Torre', keywords: 'Ruptura, revelação, catarse',
    upright: 'O que não serve cai. Uma ruptura necessária abre espaço para o que é real e verdadeiro.', reversed: 'Evitando uma mudança necessária. Enfrente a crise de frente.' },
  { number: 17, name: 'A Estrela', keywords: 'Esperança, cura, inspiração',
    upright: 'Após a tempestade, a luz retorna. Renove sua fé — os melhores dias estão por vir.', reversed: 'Desespero passageiro. Reconecte-se com sua esperança mais profunda.' },
  { number: 18, name: 'A Lua', keywords: 'Ilusão, intuição profunda, sonhos',
    upright: 'Nem tudo é o que parece. Confie na sua intuição para navegar pelas águas turvas.', reversed: 'A névoa se dissipa. Clareza está chegando.' },
  { number: 19, name: 'O Sol', keywords: 'Vitalidade, alegria, sucesso',
    upright: 'É tempo de brilhar. Energia, clareza e alegria fluem abundantemente para você.', reversed: 'Alegria temporariamente encoberta. Ela voltará em breve.' },
  { number: 20, name: 'O Julgamento', keywords: 'Renascimento, chamado, avaliação',
    upright: 'Um chamado profundo ecoa. É hora de responder com seu ser inteiro ao que a vida pede.', reversed: 'Autocrítica excessiva. Perdoe-se e siga em frente.' },
  { number: 21, name: 'O Mundo', keywords: 'Conclusão, totalidade, conquista',
    upright: 'Você chegou a um ponto de completude. Celebre sua jornada e prepare-se para o próximo ciclo.', reversed: 'Algo ainda precisa ser completado. Não desista antes do fim.' },
];

// Unified card type for the full 78-card deck
interface DrawnCard {
  name: string;
  keywords: string;
  upright: string;
  reversed: string;
  image: string;
  arcana: 'major' | 'minor';
  cardNumber: number;
  cardId: string;
  elementLabel?: string;
}

function buildFullDeck(): DrawnCard[] {
  const majorCards: DrawnCard[] = MAJOR_ARCANA.map(c => ({
    name: c.name,
    keywords: c.keywords,
    upright: c.upright,
    reversed: c.reversed,
    image: MAJOR_CARD_IMAGES[c.number],
    arcana: 'major',
    cardNumber: c.number,
    cardId: `major-${c.number}`,
  }));

  const minorCards: DrawnCard[] = MINOR_ARCANA.map(c => ({
    name: c.name,
    keywords: c.keywords,
    upright: c.upright,
    reversed: c.reversed,
    image: c.image,
    arcana: 'minor',
    cardNumber: c.number,
    cardId: c.id,
    elementLabel: c.elementLabel,
  }));

  return [...majorCards, ...minorCards];
}

const FULL_DECK = buildFullDeck();

export default function AstralOracleTab({ onModeChange, resetRef }: { onModeChange?: (inSubView: boolean) => void; resetRef?: React.MutableRefObject<(() => void) | null> }) {
  const { saveReading, todayReading, isTodayLoading } = useTarotReadings();
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'picking' | 'flipping' | 'revealed'>('idle');
  const [mode, setMode] = useState<'menu' | 'daily' | 'spread'>('menu');

  useEffect(() => {
    onModeChange?.(mode !== 'menu');
    if (resetRef) {
      resetRef.current = mode !== 'menu' ? () => setMode('menu') : null;
    }
  }, [mode, onModeChange, resetRef]);

  useEffect(() => {
    if (todayReading) {
      // Reconstruct card from saved reading
      let card: DrawnCard | undefined;
      if (todayReading.arcana === 'minor') {
        // For minor arcana, card_name stores the id
        const minor = MINOR_ARCANA.find(c => c.id === todayReading.card_name || c.name === todayReading.card_name);
        if (minor) {
          card = {
            name: minor.name, keywords: minor.keywords, upright: minor.upright,
            reversed: minor.reversed, image: minor.image, arcana: 'minor',
            cardNumber: minor.number, cardId: minor.id, elementLabel: minor.elementLabel,
          };
        }
      } else {
        const major = MAJOR_ARCANA.find(c => c.number === todayReading.card_number);
        if (major) {
          card = {
            name: major.name, keywords: major.keywords, upright: major.upright,
            reversed: major.reversed, image: MAJOR_CARD_IMAGES[major.number],
            arcana: 'major', cardNumber: major.number, cardId: `major-${major.number}`,
          };
        }
      }
      if (card) {
        setDrawnCard(card);
        setIsReversed(todayReading.is_reversed);
        setPhase('revealed');
      }
    }
  }, [todayReading]);

  const startReading = () => {
    setPhase('shuffling');
    setTimeout(() => setPhase('picking'), 1800);
  };

  const pickCard = async (_index: number) => {
    setPhase('flipping');
    const card = FULL_DECK[Math.floor(Math.random() * FULL_DECK.length)];
    const reversed = Math.random() > 0.7;

    setTimeout(async () => {
      setDrawnCard(card);
      setIsReversed(reversed);
      setPhase('revealed');
      await saveReading({
        card_name: card.arcana === 'minor' ? card.cardId : card.name,
        card_number: card.cardNumber,
        arcana: card.arcana,
        is_reversed: reversed,
        interpretation_text: reversed ? card.reversed : card.upright,
        reading_type: 'DAILY',
      });
    }, 1200);
  };

  if (isTodayLoading && mode !== 'spread') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-32 rounded-xl overflow-hidden"
          style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
        >
          <img src={tarotBack} alt="" className="w-full h-full object-cover" />
        </motion.div>
        <p className="text-white/40 text-sm tracking-widest">Consultando os astros...</p>
      </div>
    );
  }

  // SPREAD MODE
  if (mode === 'spread') {
    return <TarotFiveCardSpread onBack={() => setMode('menu')} />;
  }

  // MENU MODE — show both options
  if (mode === 'menu') {
    return (
      <div className="flex-1 overflow-y-auto pb-6 px-4">
        <div className="flex flex-col items-center pt-6 gap-6">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 25px rgba(139,92,246,0.3)' }}
          >
            <img src={tarotBack} alt="" className="w-full h-full object-cover" />
          </motion.div>
          <div className="text-center">
            <h3 className="text-white font-bold text-xl mb-1">Oráculos</h3>
            <p className="text-white/40 text-sm">Escolha seu tipo de leitura</p>
          </div>

          {/* Daily option */}
          <motion.button
            onClick={() => setMode('daily')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(79,70,229,0.15) 100%)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}
          >
            <div className="w-14 h-20 rounded-xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.3), 0 0 10px rgba(139,92,246,0.2)' }}>
              <img src={tarotBack} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-base">Carta do Dia</h4>
              <p className="text-white/40 text-xs mt-0.5">Uma carta diária com a mensagem do universo para hoje.</p>
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full text-violet-300/80"
                style={{ background: 'rgba(139,92,246,0.15)' }}>
                Disponível diariamente
              </span>
            </div>
            <span className="text-white/20">→</span>
          </motion.button>

          {/* 5-card option */}
          <motion.button
            onClick={() => setMode('spread')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl p-4 text-left flex items-center gap-4"
            style={{
              background: 'linear-gradient(135deg, rgba(217,119,6,0.12) 0%, rgba(180,83,9,0.12) 100%)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <div className="relative w-14 h-20 flex-shrink-0">
              {[0, 1, 2].map(i => (
                <div key={i} className="absolute rounded-lg overflow-hidden"
                  style={{
                    width: 32, height: 48,
                    left: i * 8, top: i * 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: i,
                  }}>
                  <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-base">Tiragem de 5 Cartas</h4>
              <p className="text-white/40 text-xs mt-0.5">Leitura profunda: Situação, Desafio, Conselho, Ajuda e Tendência.</p>
              <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full text-amber-300/80"
                style={{ background: 'rgba(251,191,36,0.12)' }}>
                A cada 7 dias
              </span>
            </div>
            <span className="text-white/20">→</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // DAILY MODE — existing flow
  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4">
      <AnimatePresence mode="wait">

        {/* === IDLE === */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center pt-6 gap-6"
          >
            <div className="relative h-52 w-64 mx-auto">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute left-1/2 bottom-0 w-24 h-36 rounded-xl overflow-hidden"
                  style={{
                    transform: `translateX(-50%) rotate(${(i - 2) * 12}deg)`,
                    transformOrigin: 'bottom center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.2)',
                    zIndex: i,
                  }}
                >
                  <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <h3 className="text-white font-bold text-xl mb-2">Tarot do Dia</h3>
              <p className="text-white/45 text-sm max-w-xs mx-auto leading-relaxed">
                78 cartas — Arcanos Maiores e Menores. Concentre-se e revele sua mensagem.
              </p>
            </div>

            <motion.button
              onClick={startReading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 h-14 px-10 rounded-2xl font-semibold text-base text-white"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6d28d9 100%)',
                boxShadow: '0 0 30px rgba(124,58,237,0.5), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <Sparkles className="w-5 h-5" />
              Iniciar Leitura
            </motion.button>

            <button onClick={() => setMode('menu')}
              className="text-white/40 text-sm underline underline-offset-4 hover:text-white/60 transition-colors">
              ← Voltar
            </button>
          </motion.div>
        )}

        {/* === SHUFFLING === */}
        {phase === 'shuffling' && (
          <motion.div
            key="shuffling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-96 gap-6"
          >
            <div className="relative h-44 w-32">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-xl overflow-hidden"
                  animate={{
                    x: [0, (i % 2 === 0 ? 30 : -30), 0, (i % 2 === 0 ? -20 : 20), 0],
                    rotate: [0, (i % 2 === 0 ? 8 : -8), 0],
                  }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    repeat: 2,
                    ease: 'easeInOut',
                  }}
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    zIndex: 6 - i,
                  }}
                >
                  <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
            <motion.p
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/50 text-sm tracking-widest"
            >
              Embaralhando 78 cartas...
            </motion.p>
          </motion.div>
        )}

        {/* === PICKING === */}
        {phase === 'picking' && (
          <motion.div
            key="picking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center pt-4 gap-5"
          >
            <p className="text-white/50 text-sm tracking-widest text-center">
              Escolha uma carta com o coração
            </p>
            <div className="flex justify-center gap-2 flex-wrap px-2">
              {[...Array(7)].map((_, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 40, rotate: (i - 3) * 5 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', damping: 15 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => pickCard(i)}
                  className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0"
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(139,92,246,0.2)',
                    border: '1px solid rgba(167,139,250,0.2)',
                  }}
                >
                  <img src={tarotBack} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* === FLIPPING === */}
        {phase === 'flipping' && (
          <motion.div
            key="flipping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-96 gap-4"
          >
            <motion.div
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="w-36 h-56 rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 0 40px rgba(251,191,36,0.4), 0 8px 30px rgba(0,0,0,0.5)',
                perspective: 1000,
              }}
            >
              <img src={tarotBack} alt="" className="w-full h-full object-cover" />
            </motion.div>
            <motion.p
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white/40 text-sm tracking-widest"
            >
              O oráculo revela...
            </motion.p>
          </motion.div>
        )}

        {/* === REVEALED === */}
        {phase === 'revealed' && drawnCard && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 pt-2"
          >
            {/* Card image */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  width: 200,
                  height: 325,
                  boxShadow: '0 0 50px rgba(251,191,36,0.3), 0 0 80px rgba(139,92,246,0.2), 0 10px 40px rgba(0,0,0,0.5)',
                  border: '2px solid rgba(251,191,36,0.3)',
                  transform: isReversed ? 'rotate(180deg)' : 'none',
                }}
              >
                <img
                  src={drawnCard.image}
                  alt={drawnCard.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

            {/* Badges */}
            <div className="flex justify-center gap-2 flex-wrap">
              {drawnCard.elementLabel && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    background: drawnCard.cardId.startsWith('water') ? 'rgba(59,130,246,0.15)' :
                      drawnCard.cardId.startsWith('earth') ? 'rgba(34,197,94,0.15)' :
                      drawnCard.cardId.startsWith('air') ? 'rgba(148,163,184,0.15)' :
                      'rgba(249,115,22,0.15)',
                    color: drawnCard.cardId.startsWith('water') ? '#60a5fa' :
                      drawnCard.cardId.startsWith('earth') ? '#4ade80' :
                      drawnCard.cardId.startsWith('air') ? '#94a3b8' :
                      '#fb923c',
                    border: `1px solid ${
                      drawnCard.cardId.startsWith('water') ? 'rgba(59,130,246,0.25)' :
                      drawnCard.cardId.startsWith('earth') ? 'rgba(34,197,94,0.25)' :
                      drawnCard.cardId.startsWith('air') ? 'rgba(148,163,184,0.25)' :
                      'rgba(249,115,22,0.25)'
                    }`,
                  }}
                >
                  {drawnCard.elementLabel}
                </motion.span>
              )}

              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center text-[10px] uppercase tracking-widest px-3 py-1 rounded-full text-violet-400/80"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                {drawnCard.arcana === 'major' ? '✦ Arcano Maior' : '✧ Arcano Menor'}
              </motion.span>

              {isReversed && (
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-1 text-rose-400/90 text-[10px] uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}
                >
                  ↕ Invertida
                </motion.span>
              )}
            </div>

            {/* Card info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(88,28,135,0.4) 0%, rgba(49,46,129,0.4) 100%)',
                border: '1px solid rgba(167,139,250,0.2)',
                boxShadow: '0 0 30px rgba(139,92,246,0.1)',
              }}
            >
              <h3
                className="font-bold text-2xl mb-1"
                style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.4)' }}
              >
                {drawnCard.name}
              </h3>
              <p className="text-white/35 text-xs mb-4 tracking-wider">{drawnCard.keywords}</p>
              <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)' }} />
              <p className="text-white/85 text-sm leading-relaxed italic">
                {isReversed ? drawnCard.reversed : drawnCard.upright}
              </p>
            </motion.div>

            {/* Daily notice */}
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-2.5"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'rgba(167,139,250,0.7)' }} />
              <p className="text-white/40 text-xs leading-relaxed">
                Esta é sua carta para hoje. Uma nova carta estará disponível amanhã ao amanhecer.
              </p>
            </div>

            {/* Back button */}
            <div className="flex justify-center">
               <button onClick={() => setMode('menu')}
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