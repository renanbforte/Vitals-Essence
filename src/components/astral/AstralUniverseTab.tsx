// ============================================================================
// AstralUniverseTab — Aba "Universo" da seção Astral.
// Apresenta o mapa astral do usuário: a roda do zodíaco animada, o "Big Three"
// (Sol, Lua e Ascendente), o número do Caminho de Vida (numerologia) e a lista
// de posicionamentos planetários. Tocar num planeta abre um modal com detalhes.
// ============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAstral } from '@/hooks/useAstral';
import {
  SIGN_SYMBOLS, SIGN_DESCRIPTIONS, SIGN_ELEMENTS,
  LIFE_PATH_DESCRIPTIONS
} from '@/lib/astralCalculations';
import type { ZodiacSign } from '@/lib/astralCalculations';
import zodiacWheelImg from '@/assets/astral-zodiac-wheel.png';
import planetSolImg from '@/assets/planet-sol.png';
import planetLuaImg from '@/assets/planet-lua.png';
import planetMercurioImg from '@/assets/planet-mercurio.png';
import planetVenusImg from '@/assets/planet-venus.png';
import planetMarteImg from '@/assets/planet-marte.png';
import planetJupiterImg from '@/assets/planet-jupiter.png';
import planetSaturnoImg from '@/assets/planet-saturno.png';
import planetUranoImg from '@/assets/planet-urano.png';
import planetNetunoImg from '@/assets/planet-netuno.png';
import planetPlutaoImg from '@/assets/planet-plutao.png';

// Imagem ilustrativa de cada planeta (usada nos cards e no modal).
const PLANET_IMG: Record<string, string> = {
  'Sol': planetSolImg,
  'Lua': planetLuaImg,
  'Mercúrio': planetMercurioImg,
  'Vênus': planetVenusImg,
  'Marte': planetMarteImg,
  'Júpiter': planetJupiterImg,
  'Saturno': planetSaturnoImg,
  'Urano': planetUranoImg,
  'Netuno': planetNetunoImg,
  'Plutão': planetPlutaoImg,
};

// Cor de fundo (semitransparente) associada a cada planeta.
const PLANET_COLORS: Record<string, string> = {
  'Sol': 'rgba(251,191,36,0.25)',
  'Lua': 'rgba(196,181,253,0.2)',
  'Mercúrio': 'rgba(167,243,208,0.2)',
  'Vênus': 'rgba(251,113,133,0.2)',
  'Marte': 'rgba(239,68,68,0.2)',
  'Júpiter': 'rgba(251,191,36,0.2)',
  'Saturno': 'rgba(156,163,175,0.2)',
  'Urano': 'rgba(147,197,253,0.2)',
  'Netuno': 'rgba(99,102,241,0.2)',
  'Plutão': 'rgba(139,92,246,0.2)',
};

// Cor da borda associada a cada planeta.
const PLANET_BORDER: Record<string, string> = {
  'Sol': 'rgba(251,191,36,0.3)',
  'Lua': 'rgba(196,181,253,0.3)',
  'Mercúrio': 'rgba(167,243,208,0.3)',
  'Vênus': 'rgba(251,113,133,0.3)',
  'Marte': 'rgba(239,68,68,0.3)',
  'Júpiter': 'rgba(251,191,36,0.3)',
  'Saturno': 'rgba(156,163,175,0.25)',
  'Urano': 'rgba(147,197,253,0.3)',
  'Netuno': 'rgba(99,102,241,0.3)',
  'Plutão': 'rgba(139,92,246,0.3)',
};

// Texto que explica, em linguagem simples, o que cada planeta representa.
const PLANET_DESC: Record<string, string> = {
  'Sol': 'Sua essência, vitalidade e identidade central',
  'Lua': 'Suas emoções, intuição e necessidades íntimas',
  'Mercúrio': 'Seu estilo de comunicação e raciocínio',
  'Vênus': 'Como você ama, atrai e aprecia a beleza',
  'Marte': 'Sua força, ambição e como você age no mundo',
  'Júpiter': 'Onde a expansão e a fortuna fluem naturalmente',
  'Saturno': 'Suas lições kármicas e onde você cresce com disciplina',
  'Urano': 'Onde a revolução e o despertar chegam à sua vida',
  'Netuno': 'Seu acesso ao sagrado, sonhos e espiritualidade',
  'Plutão': 'Onde a transformação profunda e o renascimento acontecem',
};

export default function AstralUniverseTab() {
  // Perfil astral do usuário e a lista de posicionamentos planetários.
  const { profile, planetPlacements } = useAstral();
  // Guarda o planeta escolhido para exibir no modal (ou null se fechado).
  const [selectedPlanet, setSelectedPlanet] = useState<any | null>(null);

  // Extrai do perfil os signos principais e o número do caminho de vida.
  const sunSign = profile?.sun_sign as ZodiacSign | undefined;
  const moonSign = profile?.moon_sign as ZodiacSign | undefined;
  const ascendant = profile?.ascendant_sign as ZodiacSign | undefined;
  const lifePathNumber = profile?.life_path_number;

  // Monta o "Big Three" (Sol, Lua, Ascendente) com rótulo, valor, descrição,
  // emoji e cores — usado para renderizar os três cards de destaque.
  const bigThree = [
    { label: 'Sol', value: sunSign, desc: sunSign ? SIGN_DESCRIPTIONS[sunSign]?.sun : '', emoji: '☀️', color: 'rgba(251,191,36,0.3)', glow: 'rgba(251,191,36,0.5)' },
    { label: 'Lua', value: moonSign, desc: moonSign ? SIGN_DESCRIPTIONS[moonSign]?.moon : '', emoji: '🌙', color: 'rgba(196,181,253,0.3)', glow: 'rgba(196,181,253,0.5)' },
    { label: 'Asc.', value: ascendant, desc: ascendant ? SIGN_DESCRIPTIONS[ascendant]?.rising : '', emoji: '⬆️', color: 'rgba(99,102,241,0.3)', glow: 'rgba(99,102,241,0.5)' },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-6 space-y-4 px-4">

      {/* Roda do Zodíaco — imagem decorativa */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative flex items-center justify-center mx-auto"
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(88,28,135,0.5) 0%, rgba(8,6,22,0.9) 70%)',
          border: '1px solid rgba(167,139,250,0.2)',
          boxShadow: '0 0 60px rgba(139,92,246,0.2), 0 0 30px rgba(251,191,36,0.1)',
          overflow: 'hidden',
        }}
      >
        <motion.img
          src={zodiacWheelImg}
          alt="Zodiac Wheel"
          className="w-44 h-44 object-cover"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          style={{ filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.4))' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
            style={{
              background: 'rgba(8,6,22,0.85)',
              border: '2px solid rgba(251,191,36,0.35)',
              boxShadow: '0 0 20px rgba(251,191,36,0.3)',
            }}
          >
            {sunSign ? SIGN_SYMBOLS[sunSign] : '✨'}
          </div>
        </div>
      </motion.div>

      {/* Big Three */}
      <div className="grid grid-cols-3 gap-2">
        {bigThree.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-3 text-center"
            style={{
              background: `linear-gradient(135deg, ${item.color}, rgba(8,6,22,0.3))`,
              border: `1px solid ${item.color}`,
              boxShadow: `0 0 20px ${item.glow.replace('0.5', '0.1')}`,
            }}
          >
            <span className="text-2xl block mb-1" style={{ filter: `drop-shadow(0 0 8px ${item.glow})` }}>
              {item.emoji}
            </span>
            <p className="text-white/40 text-[9px] uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-white font-bold text-xs">{item.value || '—'}</p>
            {item.value && (
              <p className="text-white/30 text-[9px] mt-0.5">{SIGN_ELEMENTS[item.value as ZodiacSign]}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Descrições do Big Three */}
      <div className="space-y-3">
        {bigThree.map((item, i) => item.desc && (
          <motion.div
            key={item.label + '-desc'}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.12 }}
            className="rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${item.color.replace('0.3', '0.08')} 0%, rgba(8,6,22,0.3) 100%)`,
              border: `1px solid ${item.color}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ filter: `drop-shadow(0 0 6px ${item.glow})` }}>{item.emoji}</span>
              <p className="text-white/50 text-[10px] uppercase tracking-widest">
                {item.label} em <span className="text-white">{item.value}</span>
              </p>
              {item.value && (
                <span className="ml-auto text-lg">{SIGN_SYMBOLS[item.value as ZodiacSign]}</span>
              )}
            </div>
            <p className="text-white/70 text-xs leading-relaxed italic">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Caminho de Vida */}
      {lifePathNumber && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl font-bold opacity-5 select-none" style={{ color: '#fbbf24' }}>
            {lifePathNumber}
          </div>
          <p className="text-amber-400/50 text-[10px] uppercase tracking-widest mb-3">Caminho de Vida · Numerologia</p>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(251,191,36,0.15)',
                border: '1px solid rgba(251,191,36,0.3)',
                boxShadow: '0 0 20px rgba(251,191,36,0.2)',
              }}
            >
              <span className="text-amber-300 font-bold text-2xl">{lifePathNumber}</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed">
              {LIFE_PATH_DESCRIPTIONS[lifePathNumber] || ''}
            </p>
          </div>
        </motion.div>
      )}

      {/* Planetas */}
      {planetPlacements.length > 0 && (
        <div>
          <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3 px-1">Posicionamentos Planetários</p>
          <div className="space-y-2">
            {planetPlacements.map((p: any, i: number) => (
              <motion.button
                key={p.planet}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.07 * i }}
                onClick={() => setSelectedPlanet(p)}
                className="w-full rounded-2xl text-left transition-all hover:scale-[1.01] relative overflow-hidden flex items-stretch"
                style={{
                  border: `1px solid ${PLANET_BORDER[p.planet] || 'rgba(255,255,255,0.1)'}`,
                  minHeight: 64,
                }}
              >
                {/* Left: text content with blurred background */}
                <div
                  className="flex-1 px-4 py-3 flex flex-col justify-center"
                  style={{
                    background: PLANET_COLORS[p.planet] || 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <p className="text-white/40 text-[10px] uppercase tracking-widest">{p.planet}</p>
                  <p className="text-white text-sm font-semibold">
                    {p.sign} · Casa {p.house}
                  </p>
                </div>

                {/* Right: degrees + planet image cropped */}
                <div className="relative w-20 overflow-hidden flex-shrink-0">
                  {/* Planet image — cropped from left side */}
                  {PLANET_IMG[p.planet] && (
                    <img
                      src={PLANET_IMG[p.planet]}
                      alt={p.planet}
                      className="absolute inset-0 w-full h-full object-cover object-left"
                      style={{ opacity: 0.85 }}
                    />
                  )}
                  {/* Fade from left so it blends into text area */}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${PLANET_COLORS[p.planet] || 'rgba(8,6,22,0.8)'} 0%, transparent 50%)` }} />
                  {/* Degrees label */}
                  <div className="absolute bottom-2 right-2"
                    style={{
                      background: 'rgba(8,6,22,0.6)',
                      backdropFilter: 'blur(6px)',
                      borderRadius: 6,
                      padding: '1px 5px',
                    }}
                  >
                    <p className="text-white/60 text-[10px]">{p.degrees}°</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Modal planeta */}
      <AnimatePresence>
        {selectedPlanet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedPlanet(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, rgba(30,27,75,0.98) 0%, rgba(8,6,22,0.98) 100%)',
                border: `1px solid ${PLANET_BORDER[selectedPlanet.planet] || 'rgba(255,255,255,0.1)'}`,
                boxShadow: `0 0 60px ${(PLANET_COLORS[selectedPlanet.planet] || 'rgba(139,92,246,0.2)')}`,
              }}
            >
              {/* Planet image hero in modal */}
              {PLANET_IMG[selectedPlanet.planet] && (
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={PLANET_IMG[selectedPlanet.planet]}
                    alt={selectedPlanet.planet}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,6,22,0.1) 0%, rgba(8,6,22,0.9) 100%)' }} />
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <h3 className="text-white font-bold text-lg">{selectedPlanet.planet} em {selectedPlanet.sign}</h3>
                    <p className="text-white/40 text-xs mt-0.5">Casa {selectedPlanet.house} · {selectedPlanet.degrees}°</p>
                  </div>
                </div>
              )}
              <div className="p-5">
                <button
                  onClick={() => setSelectedPlanet(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
                <div className="rounded-2xl p-4 mb-3"
                  style={{
                    background: PLANET_COLORS[selectedPlanet.planet] || 'rgba(255,255,255,0.03)',
                    border: `1px solid ${PLANET_BORDER[selectedPlanet.planet] || 'rgba(255,255,255,0.08)'}`,
                  }}>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">O que isso significa</p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {PLANET_DESC[selectedPlanet.planet]}
                  </p>
                </div>
                {selectedPlanet.sign && SIGN_DESCRIPTIONS[selectedPlanet.sign as ZodiacSign] && (
                  <div className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}>
                    <p className="text-purple-400/50 text-[10px] uppercase tracking-widest mb-2">
                      Essência de {selectedPlanet.sign}
                    </p>
                    <p className="text-white/65 text-xs leading-relaxed italic">
                      {SIGN_DESCRIPTIONS[selectedPlanet.sign as ZodiacSign]?.sun}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
