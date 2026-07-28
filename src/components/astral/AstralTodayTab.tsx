// ============================================================================
// AstralTodayTab — Aba "Hoje" da seção Astral.
// Mostra o horóscopo do dia do usuário (baseado no signo solar), quatro áreas
// de foco (Amor, Carreira, Bem-estar, Criatividade) que abrem um painel com o
// texto, uma afirmação do dia e a fase atual da lua. Se ainda não houver
// horóscopo, ele é gerado automaticamente ao abrir a aba.
// ============================================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAstral, useDailyHoroscope } from '@/hooks/useAstral';
import { getMoonPhase, SIGN_SYMBOLS } from '@/lib/astralCalculations';
import type { ZodiacSign } from '@/lib/astralCalculations';
import moonImg from '@/assets/astral-moon.png';
import starImg from '@/assets/astral-star.png';
import loveImg from '@/assets/astral-focus-love.png';
import careerImg from '@/assets/astral-focus-career.png';
import wellnessImg from '@/assets/astral-focus-wellness.png';
import creativityImg from '@/assets/astral-focus-creativity.png';

// Configuração das 4 áreas de foco: cada uma tem rótulo, imagem de fundo e
// cores (gradiente, borda e brilho) usadas para montar os cards visuais.
const focusAreas = [
  {
    key: 'love',
    label: 'Amor',
    img: loveImg,
    gradient: 'linear-gradient(135deg, rgba(244,63,94,0.35) 0%, rgba(236,72,153,0.25) 100%)',
    border: 'rgba(244,63,94,0.3)',
    glow: 'rgba(244,63,94,0.4)',
  },
  {
    key: 'career',
    label: 'Carreira',
    img: careerImg,
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.35) 0%, rgba(245,158,11,0.25) 100%)',
    border: 'rgba(251,191,36,0.3)',
    glow: 'rgba(251,191,36,0.4)',
  },
  {
    key: 'wellness',
    label: 'Bem-estar',
    img: wellnessImg,
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.35) 0%, rgba(16,185,129,0.25) 100%)',
    border: 'rgba(52,211,153,0.3)',
    glow: 'rgba(52,211,153,0.4)',
  },
  {
    key: 'creativity',
    label: 'Criatividade',
    img: creativityImg,
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.35) 0%, rgba(139,92,246,0.25) 100%)',
    border: 'rgba(167,139,250,0.3)',
    glow: 'rgba(167,139,250,0.4)',
  },
];

export default function AstralTodayTab() {
  // Dados do perfil astral do usuário (signos, etc).
  const { profile } = useAstral();
  // Horóscopo do dia e funções/estados para carregar ou gerar esse horóscopo.
  const { horoscope, isLoading, generateHoroscope, isGenerating } = useDailyHoroscope();
  // Guarda qual área de foco está aberta no painel (ou null se nenhuma).
  const [activeArea, setActiveArea] = useState<string | null>(null);
  // Calcula a fase da lua de hoje (emoji, nome e texto).
  const moonPhase = getMoonPhase();

  // Ao abrir a aba: se o usuário tem signo mas ainda não há horóscopo, gera um.
  useEffect(() => {
    if (profile?.sun_sign && !horoscope && !isLoading) {
      generateHoroscope(profile.sun_sign);
    }
  }, [profile, horoscope, isLoading]);

  // Signo solar do usuário e o símbolo correspondente (ou uma estrela padrão).
  const sunSign = profile?.sun_sign as ZodiacSign | undefined;
  const signSymbol = sunSign ? SIGN_SYMBOLS[sunSign] : '✨';

  // Retorna o texto do horóscopo para a área de foco escolhida (amor, etc).
  const getAreaText = (key: string) => {
    if (!horoscope) return 'Gerando sua leitura cósmica...';
    const map: Record<string, string> = {
      love: (horoscope as any).love_insight,
      career: (horoscope as any).career_insight,
      wellness: (horoscope as any).wellness_insight,
      creativity: (horoscope as any).creativity_insight,
    };
    return map[key] || '';
  };

  // Enquanto carrega ou gera o horóscopo, mostra uma tela de "carregando".
  if (isLoading || isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl"
        >
          ✨
        </motion.div>
        <p className="text-white/40 text-sm tracking-widest">Consultando os astros...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-6 space-y-4 px-4">

      {/* Horóscopo principal — card deslumbrante */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(88,28,135,0.5) 0%, rgba(49,46,129,0.5) 50%, rgba(30,27,75,0.6) 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          boxShadow: '0 0 40px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-2xl"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-2xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

        <div className="relative p-5">
          <div className="flex flex-col items-center text-center mb-4">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Sua energia hoje</p>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-2"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(251,191,36,0.3)',
                boxShadow: '0 0 20px rgba(251,191,36,0.2)',
              }}
            >
              {signSymbol}
            </div>
            <h3
              className="font-bold text-lg"
              style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.5)' }}
            >
              {sunSign}
            </h3>
          </div>
          <p className="text-white/80 text-sm leading-relaxed italic text-center">
            {(horoscope as any)?.horoscope_text || 'As estrelas estão alinhando sua mensagem cósmica...'}
          </p>
        </div>
      </motion.div>

      {/* Áreas de foco — cards com imagem e glow */}
      <div>
        <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3 px-1">Áreas de Foco</p>
        <div className="grid grid-cols-2 gap-3">
          {focusAreas.map((area, i) => (
            <motion.button
              key={area.key}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setActiveArea(area.key)}
              className="rounded-2xl text-left relative overflow-hidden"
              style={{
                border: `1px solid ${area.border}`,
                minHeight: 120,
              }}
            >
              <img src={area.img} alt={area.label} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,6,22,0.05) 0%, rgba(8,6,22,0.6) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-center"
                style={{ background: 'rgba(8,6,22,0.50)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${area.border}` }}>
                <p className="text-white/70 text-[10px] uppercase tracking-widest mb-0.5">{area.label}</p>
                <p className="text-white/50 text-xs">Toque para revelar</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Overlay sheet para área de foco ativa */}
      <AnimatePresence>
        {activeArea && (() => {
          const area = focusAreas.find(a => a.key === activeArea)!;
          return (
            <motion.div
              key="focus-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center"
              onClick={() => setActiveArea(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(88,28,135,0.95) 0%, rgba(30,27,75,0.98) 100%)',
                  border: `1px solid ${area.border}`,
                  borderBottom: 'none',
                  maxHeight: '75vh',
                }}
              >
                {/* Background image */}
                <img src={area.img} alt={area.label} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,6,22,0.3) 0%, rgba(8,6,22,0.85) 50%)' }} />

                <div className="relative p-6">
                  {/* Handle bar */}
                  <div className="flex justify-center mb-4">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                  </div>
                  {/* Close button */}
                  <button
                    onClick={() => setActiveArea(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                  {/* Content */}
                  <p className="text-white/50 text-[10px] uppercase tracking-widest mb-2 text-center">{area.label}</p>
                  <p className="text-white/90 text-sm leading-relaxed text-center">
                    {getAreaText(area.key)}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Afirmação do dia */}
      {(horoscope as any)?.affirmation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl text-center relative overflow-hidden"
          style={{
            border: '1px solid rgba(251,191,36,0.2)',
            boxShadow: '0 0 30px rgba(251,191,36,0.05)',
            minHeight: 140,
          }}
        >
          {/* Star image as background */}
          <img src={starImg} alt="Estrela" className="absolute inset-0 w-full h-full object-cover" />
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,6,22,0.1) 0%, rgba(8,6,22,0.75) 100%)' }} />
          {/* Text with blur backdrop */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-center"
            style={{
              background: 'rgba(8,6,22,0.50)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <p className="text-amber-300/70 text-[10px] uppercase tracking-widest mb-1">Afirmação do Dia</p>
            <p
              className="font-medium text-sm italic"
              style={{ color: '#fde68a', textShadow: '0 0 15px rgba(251,191,36,0.3)' }}
            >
              "{(horoscope as any).affirmation}"
            </p>
          </div>
        </motion.div>
      )}

      {/* Fase da lua — com imagem */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute inset-0">
          <img src={moonImg} alt="Moon" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(8,6,22,0.5) 0%, rgba(8,6,22,0.3) 100%)' }} />
        </div>
        <div className="relative p-5 flex items-center gap-4">
          <span className="text-4xl" style={{ filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.5))' }}>
            {moonPhase.emoji}
          </span>
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Fase da Lua</p>
            <p className="text-white font-semibold text-sm mb-1">{moonPhase.name}</p>
            <p className="text-white/50 text-xs leading-relaxed">{moonPhase.insight}</p>
          </div>
        </div>
      </motion.div>

      {/* Energia Lunar */}
      {(horoscope as any)?.moon_phase && (
        <div className="rounded-2xl p-4"
          style={{
            background: 'rgba(139,92,246,0.07)',
            border: '1px solid rgba(139,92,246,0.15)',
          }}>
          <p className="text-purple-400/50 text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1.5">
            ✨ Energia Lunar
          </p>
          <p className="text-white/60 text-xs leading-relaxed">{(horoscope as any).moon_phase}</p>
        </div>
      )}
    </div>
  );
}
