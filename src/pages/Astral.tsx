import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAstral } from '@/hooks/useAstral';
import AstralOnboarding from '@/components/astral/AstralOnboarding';
import AstralTodayTab from '@/components/astral/AstralTodayTab';
import AstralUniverseTab from '@/components/astral/AstralUniverseTab';
import AstralOracleTab from '@/components/astral/AstralOracleTab';
import AstralConnectionsTab from '@/components/astral/AstralConnectionsTab';
import AstralProfileTab from '@/components/astral/AstralProfileTab';
import zodiacWheel from '@/assets/astral-zodiac-wheel.png';
import tarotBg from '@/assets/astral-tarot-bg.png';
import synastryImg from '@/assets/astral-synastry.png';
import moonImg from '@/assets/astral-moon.png';
import journalImg from '@/assets/astral-journal.png';

const tabs = [
  {
    id: 'today',
    label: 'Hoje',
    image: moonImg,
    emoji: '🌙',
    glow: 'rgba(139,92,246,0.6)',
  },
  {
    id: 'universe',
    label: 'Universo',
    image: zodiacWheel,
    emoji: '✨',
    glow: 'rgba(251,191,36,0.6)',
  },
  {
    id: 'oracle',
    label: 'Oráculos',
    image: tarotBg,
    emoji: '🃏',
    glow: 'rgba(168,85,247,0.6)',
  },
  {
    id: 'connections',
    label: 'Conexões',
    image: synastryImg,
    emoji: '💫',
    glow: 'rgba(99,102,241,0.6)',
  },
  {
    id: 'me',
    label: 'Eu',
    image: journalImg,
    emoji: '📖',
    glow: 'rgba(236,72,153,0.5)',
  },
];

function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 80 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() > 0.85 ? 3 : Math.random() > 0.6 ? 2 : 1,
            height: Math.random() > 0.85 ? 3 : Math.random() > 0.6 ? 2 : 1,
            background: Math.random() > 0.5 ? '#fbbf24' : Math.random() > 0.5 ? '#c4b5fd' : '#e0e7ff',
            boxShadow: Math.random() > 0.7 ? `0 0 4px 1px rgba(251,191,36,0.6)` : 'none',
          }}
          animate={{ opacity: [0.05, Math.random() * 0.9 + 0.1, 0.05] }}
          transition={{
            duration: Math.random() * 4 + 2,
            delay: Math.random() * 5,
            repeat: Infinity,
          }}
        />
      ))}
      {/* Nebula glows */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', top: '-5%', left: '-10%' }}
      />
      <div
        className="absolute w-80 h-80 rounded-full opacity-8 blur-3xl"
        style={{ background: 'radial-gradient(circle, #4f46e5, transparent)', bottom: '10%', right: '-5%' }}
      />
      <div
        className="absolute w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', top: '40%', left: '60%' }}
      />
    </div>
  );
}

export default function Astral() {
  const navigate = useNavigate();
  const { profile, isLoading } = useAstral();
  const [activeTab, setActiveTab] = useState('today');
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [isInSubView, setIsInSubView] = useState(false);
  const resetSubViewRef = useRef<(() => void) | null>(null);

  const handleBack = () => {
    if (isInSubView && resetSubViewRef.current) {
      resetSubViewRef.current();
    } else {
      navigate('/');
    }
  };
  const hasProfile = !!profile || onboardingDone;
  

  const renderTab = () => {
    switch (activeTab) {
      case 'today': return <AstralTodayTab />;
      case 'universe': return <AstralUniverseTab />;
      case 'oracle': return <AstralOracleTab onModeChange={setIsInSubView} resetRef={resetSubViewRef} />;
      case 'connections': return <AstralConnectionsTab />;
      case 'me': return <AstralProfileTab />;
      default: return <AstralTodayTab />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-dvh flex flex-col" style={{ background: 'linear-gradient(160deg, #080616 0%, #0f0b2a 40%, #12082e 70%, #080616 100%)' }}>
        {/* Skeleton header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-9 h-9 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-16 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-32 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
        {/* Skeleton content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="w-20 h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="space-y-3 w-full max-w-xs">
            <div className="h-4 w-3/4 mx-auto rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="h-3 w-1/2 mx-auto rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <p className="text-white/30 text-xs tracking-widest uppercase mt-2">Consultando os astros</p>
        </div>
        {/* Skeleton tab bar */}
        <div className="flex items-end justify-around px-3 pb-5 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="w-8 h-2 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, #080616 0%, #0f0b2a 40%, #12082e 70%, #080616 100%)' }}
    >
      <StarField />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-safe pt-4 pb-3">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1">
          <h1
            className="font-bold text-lg leading-none"
            style={{ background: 'linear-gradient(90deg, #fbbf24, #c4b5fd, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200%' }}
          >
            Astral
          </h1>
          <p className="text-white/30 text-xs">Seu guia cósmico pessoal</p>
        </div>
        
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!hasProfile ? (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-6 py-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🌌
                </motion.div>
                <h2 className="text-white font-bold text-xl mb-1">Bem-vindo ao Astral</h2>
                <p className="text-white/40 text-sm">
                  As estrelas sussurram seu nome. Vamos descobrir o que elas dizem.
                </p>
              </div>
              <AstralOnboarding onComplete={() => setOnboardingDone(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-hidden flex flex-col"
                >
                  {renderTab()}
                </motion.div>
              </AnimatePresence>

              {/* Tab bar — image-based */}
              <div
                className="relative z-10 flex items-end justify-around px-3 pb-safe pb-5 pt-2 border-t"
                style={{
                  borderColor: 'rgba(255,255,255,0.07)',
                  background: 'linear-gradient(0deg, rgba(8,6,22,0.98) 0%, rgba(8,6,22,0.85) 100%)',
                  backdropFilter: 'blur(24px)',
                }}
              >
                {tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setIsInSubView(false); resetSubViewRef.current = null; }}
                      className="flex flex-col items-center gap-1.5 px-1 py-1 relative"
                    >
                      {/* Image icon */}
                      <div className="relative">
                        {isActive && (
                          <motion.div
                            layoutId="astral-tab-glow"
                            className="absolute inset-0 rounded-full blur-md"
                            style={{ background: tab.glow, transform: 'scale(1.5)' }}
                          />
                        )}
                        <motion.div
                          animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="relative w-10 h-10 rounded-xl overflow-hidden"
                          style={{
                            border: isActive ? `1.5px solid rgba(251,191,36,0.5)` : '1.5px solid rgba(255,255,255,0.08)',
                            boxShadow: isActive ? `0 0 12px 2px ${tab.glow}` : 'none',
                          }}
                        >
                          <img
                            src={tab.image}
                            alt={tab.label}
                            className="w-full h-full object-cover"
                            style={{ opacity: isActive ? 1 : 0.45 }}
                          />
                          {/* Overlay for inactive */}
                          {!isActive && (
                            <div className="absolute inset-0" style={{ background: 'rgba(8,6,22,0.4)' }} />
                          )}
                        </motion.div>
                      </div>
                      <span
                        className="text-[9px] font-medium tracking-wide transition-all duration-200"
                        style={{ color: isActive ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
