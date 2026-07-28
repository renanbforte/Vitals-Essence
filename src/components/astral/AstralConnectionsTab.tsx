import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useAstral } from '@/hooks/useAstral';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { calculateCompatibility, SIGN_SYMBOLS, SIGN_COLORS, SIGN_ELEMENTS } from '@/lib/astralCalculations';
import type { ZodiacSign } from '@/lib/astralCalculations';
import synastryImg from '@/assets/astral-synastry.png';

const SIGNS_LIST: ZodiacSign[] = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
];

interface FriendAstral {
  userId: string;
  name: string;
  sunSign: ZodiacSign | null;
  moonSign?: string;
  ascendant?: string;
  planets: { planet: string; sign: string; house: number; degrees: number }[];
  hasAstralProfile?: boolean;
}

// Per-planet compatibility descriptions
const PLANET_ASPECTS: Record<string, { label: string; area: string }> = {
  'Sol': { label: 'Sol', area: 'Essência & Identidade' },
  'Lua': { label: 'Lua', area: 'Emoções & Intimidade' },
  'Mercúrio': { label: 'Mercúrio', area: 'Comunicação & Mente' },
  'Vênus': { label: 'Vênus', area: 'Amor & Valores' },
  'Marte': { label: 'Marte', area: 'Paixão & Energia' },
  'Júpiter': { label: 'Júpiter', area: 'Crescimento & Filosofia' },
  'Saturno': { label: 'Saturno', area: 'Compromisso & Estrutura' },
};

function calcPlanetCompat(sign1: string, sign2: string): { score: number; desc: string } {
  const z1 = sign1 as ZodiacSign;
  const z2 = sign2 as ZodiacSign;
  const el1 = SIGN_ELEMENTS[z1];
  const el2 = SIGN_ELEMENTS[z2];
  if (!el1 || !el2) return { score: 50, desc: 'Energia neutra entre estes posicionamentos.' };

  if (z1 === z2) return { score: 95, desc: `Mesmo signo! Sintonia intensa e espelhamento profundo.` };
  if (el1 === el2) return { score: 85, desc: `Mesmo elemento (${el1}). Compreensão natural e fluida.` };

  const compat: Record<string, string[]> = { 'Fogo': ['Ar'], 'Ar': ['Fogo'], 'Terra': ['Água'], 'Água': ['Terra'] };
  if (compat[el1]?.includes(el2)) return { score: 75, desc: `${el1} e ${el2} se complementam, criando equilíbrio.` };

  const idx1 = SIGNS_LIST.indexOf(z1);
  const idx2 = SIGNS_LIST.indexOf(z2);
  const dist = Math.abs(idx1 - idx2);
  if (dist === 6) return { score: 65, desc: `Oposição magnética — atração intensa com tensão criativa.` };
  if (dist === 3 || dist === 9) return { score: 45, desc: `Quadratura — fricção que impulsiona crescimento quando trabalhada.` };
  return { score: 55, desc: `Dinâmica de aprendizado mútuo entre energias diferentes.` };
}

export default function AstralConnectionsTab() {
  const { user } = useAuth();
  const { profile, planetPlacements } = useAstral();
  const [friendSign, setFriendSign] = useState<ZodiacSign | null>(null);
  const [friendName, setFriendName] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [friendsWithAstral, setFriendsWithAstral] = useState<FriendAstral[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendAstral | null>(null);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFriendsList, setShowFriendsList] = useState(false);

  const userSign = profile?.sun_sign as ZodiacSign | undefined;

  // Fetch ALL friends, enriching with astral data when available
  useEffect(() => {
    if (!user) return;
    async function fetchFriendsAstral() {
      setLoadingFriends(true);
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`)
        .eq('status', 'accepted');

      if (!friendships?.length) { setLoadingFriends(false); return; }

      const friendIds = friendships.map(f => f.user_id === user!.id ? f.friend_id : f.user_id);

      // Get names for ALL friends
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', friendIds);

      // Get astral profiles (may be empty)
      const { data: astralProfiles } = await supabase
        .from('astral_profiles')
        .select('*')
        .in('user_id', friendIds);

      // Get planet placements for those with astral
      const astralUserIds = (astralProfiles || []).map(a => a.user_id);
      let placements: any[] = [];
      if (astralUserIds.length > 0) {
        const { data } = await supabase
          .from('planet_placements')
          .select('*')
          .in('user_id', astralUserIds);
        placements = data || [];
      }

      // Build list: ALL friends, with astral data when available
      const result: FriendAstral[] = friendIds.map(fid => {
        const prof = profiles?.find(p => p.user_id === fid);
        const ap = astralProfiles?.find(a => a.user_id === fid);
        const pls = placements.filter(p => p.user_id === fid);
        return {
          userId: fid,
          name: prof?.name || 'Amigo(a)',
          sunSign: (ap?.sun_sign as ZodiacSign) || (null as any),
          moonSign: ap?.moon_sign || undefined,
          ascendant: ap?.ascendant_sign || undefined,
          planets: pls.map(p => ({ planet: p.planet, sign: p.sign, house: p.house, degrees: p.degrees })),
          hasAstralProfile: !!ap,
        };
      });

      setFriendsWithAstral(result);
      setLoadingFriends(false);
    }
    fetchFriendsAstral();
  }, [user]);

  const compatibility = userSign && friendSign ? calculateCompatibility(userSign, friendSign) : null;

  const handleSelectFriend = (friend: FriendAstral) => {
    setSelectedFriend(friend);
    if (friend.sunSign) {
      setFriendSign(friend.sunSign);
      setFriendName(friend.name);
      setShowResult(true);
    } else {
      setFriendName(friend.name);
      setFriendSign(null);
      setShowResult(false);
    }
  };

  const handleCheck = () => { if (friendSign) setShowResult(true); };
  const reset = () => {
    setShowResult(false);
    setFriendSign(null);
    setFriendName('');
    setSelectedFriend(null);
  };

  // === RESULT VIEW ===
  if (showResult && compatibility && userSign && friendSign) {
    const score = Math.round(compatibility.score);
    const scoreColor = score >= 75 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
    const scoreGlow = score >= 75 ? 'rgba(52,211,153,0.4)' : score >= 50 ? 'rgba(251,191,36,0.4)' : 'rgba(248,113,113,0.4)';

    // Build per-planet compatibility if friend has placements
    const planetComparisons = selectedFriend?.planets?.length
      ? Object.keys(PLANET_ASPECTS).map(planet => {
          const myPlacement = planetPlacements.find(p => p.planet === planet);
          const friendPlacement = selectedFriend.planets.find(p => p.planet === planet);
          if (!myPlacement || !friendPlacement) return null;
          const compat = calcPlanetCompat(myPlacement.sign, friendPlacement.sign);
          return {
            planet,
            ...PLANET_ASPECTS[planet],
            mySign: myPlacement.sign,
            friendSign: friendPlacement.sign,
            ...compat,
          };
        }).filter(Boolean)
      : [];

    return (
      <div className="flex-1 overflow-y-auto pb-6 px-4 space-y-4">
        {/* Card de resultado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(88,28,135,0.4) 0%, rgba(49,46,129,0.35) 100%)',
            border: '1px solid rgba(167,139,250,0.2)',
            boxShadow: '0 0 60px rgba(139,92,246,0.15)',
          }}
        >
          <div className="absolute inset-0 opacity-15">
            <img src={synastryImg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'rgba(8,6,22,0.7)' }} />
          </div>

          <div className="relative">
            <div className="flex items-center justify-center gap-6 mb-5">
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2"
                  style={{
                    background: `${SIGN_COLORS[userSign]}20`,
                    border: `1px solid ${SIGN_COLORS[userSign]}40`,
                    boxShadow: `0 0 20px ${SIGN_COLORS[userSign]}30`,
                  }}
                >
                  {SIGN_SYMBOLS[userSign]}
                </div>
                <p className="text-white/35 text-[10px] uppercase tracking-widest">Você</p>
                <p className="text-white text-xs font-semibold mt-0.5">{userSign}</p>
              </div>

              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl"
                style={{ filter: `drop-shadow(0 0 10px ${scoreGlow})` }}
              >
                💫
              </motion.div>

              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-2"
                  style={{
                    background: `${SIGN_COLORS[friendSign]}20`,
                    border: `1px solid ${SIGN_COLORS[friendSign]}40`,
                    boxShadow: `0 0 20px ${SIGN_COLORS[friendSign]}30`,
                  }}
                >
                  {SIGN_SYMBOLS[friendSign]}
                </div>
                <p className="text-white/35 text-[10px] uppercase tracking-widest">{friendName || 'Amigo(a)'}</p>
                <p className="text-white text-xs font-semibold mt-0.5">{friendSign}</p>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <span
                className="text-6xl font-bold block"
                style={{ color: scoreColor, textShadow: `0 0 30px ${scoreGlow}` }}
              >
                {score}%
              </span>
              <p className="text-white/35 text-[10px] uppercase tracking-widest mt-1">Harmonia Cósmica</p>
            </motion.div>

            <div className="w-full h-2 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, #7c3aed, ${scoreColor})`,
                  boxShadow: `0 0 10px ${scoreGlow}`,
                }}
              />
            </div>

            <p className="text-white/65 text-sm italic leading-relaxed">{compatibility.summary}</p>
          </div>
        </motion.div>

        {/* Per-planet compatibility (only for friends with profile) */}
        {planetComparisons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.08) 100%)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <p className="text-violet-300/60 text-[10px] uppercase tracking-widest mb-4">Sinastria por Planeta</p>
            <div className="space-y-3">
              {planetComparisons.map((pc: any, i: number) => {
                const color = pc.score >= 75 ? '#34d399' : pc.score >= 50 ? '#fbbf24' : '#f87171';
                return (
                  <motion.div
                    key={pc.planet}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="rounded-xl p-3"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-white text-xs font-semibold">{pc.label}</span>
                        <span className="text-white/30 text-[10px] ml-2">{pc.area}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color }}>{pc.score}%</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white/50 text-[10px]">
                        {pc.mySign} × {pc.friendSign}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pc.score}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                    <p className="text-white/45 text-[10px] mt-1.5 leading-relaxed">{pc.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Harmony */}
        {compatibility.harmony.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(16,185,129,0.05) 100%)',
              border: '1px solid rgba(52,211,153,0.2)',
            }}
          >
            <p className="text-emerald-400/60 text-[10px] uppercase tracking-widest mb-3">A Melodia de Vocês</p>
            <div className="space-y-2">
              {compatibility.harmony.map((h, i) => (
                <p key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0">•</span> {h}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Challenges */}
        {compatibility.challenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <p className="text-amber-400/60 text-[10px] uppercase tracking-widest mb-3">Desafios para Crescer</p>
            <div className="space-y-2">
              {compatibility.challenges.map((c, i) => (
                <p key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                  <span className="text-amber-400 flex-shrink-0">•</span> {c}
                </p>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          onClick={reset}
          whileHover={{ scale: 1.02 }}
          className="w-full h-12 rounded-2xl text-white/40 hover:text-white/70 text-sm transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Nova consulta de sinastria
        </motion.button>
      </div>
    );
  }

  // === INPUT VIEW ===
  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 space-y-5">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden" style={{ height: 160 }}>
        <img src={synastryImg} alt="Sinastria" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,6,22,0.3) 0%, rgba(8,6,22,0.65) 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h3 className="text-white font-bold text-xl mb-2" style={{ textShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
            Sinastria Cósmica
          </h3>
          <p
            className="text-white/90 text-xs max-w-[220px] leading-relaxed px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(8,6,22,0.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Descubra a compatibilidade astral entre dois signos
          </p>
        </div>
      </div>

      {/* Your sign */}
      {userSign && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: `${SIGN_COLORS[userSign]}15`,
            border: `1px solid ${SIGN_COLORS[userSign]}30`,
          }}
        >
          <span className="text-3xl" style={{ filter: `drop-shadow(0 0 8px ${SIGN_COLORS[userSign]})` }}>
            {SIGN_SYMBOLS[userSign]}
          </span>
          <div>
            <p className="text-white/35 text-[10px] uppercase tracking-widest">Seu signo solar</p>
            <p className="text-white font-semibold text-sm">{userSign}</p>
          </div>
        </div>
      )}

      {/* Friend search & list */}
      {!loadingFriends && friendsWithAstral.length > 0 && (
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-3">Selecionar amigo(a)</p>
          <div className="flex gap-2">
            <Input
              value={friendName}
              readOnly
              placeholder="Nenhum amigo selecionado"
              className="rounded-xl text-white placeholder:text-white/20 flex-1"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setShowFriendsList(!showFriendsList); setSearchQuery(''); }}
              className="w-12 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: showFriendsList ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)',
                border: showFriendsList ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              👥
            </motion.button>
          </div>

          {showFriendsList && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-2xl p-3"
              style={{
                background: 'rgba(15,10,40,0.95)',
                border: '1px solid rgba(139,92,246,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar pelo nome..."
                className="rounded-xl text-white placeholder:text-white/20 mb-3 h-9 text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                autoFocus
              />
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                {friendsWithAstral
                  .filter(f => !searchQuery.trim() || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(friend => (
                    <motion.button
                      key={friend.userId}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { handleSelectFriend(friend); setSearchQuery(''); setShowFriendsList(false); }}
                      className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all"
                      style={{
                        background: friend.sunSign ? `${SIGN_COLORS[friend.sunSign]}08` : 'rgba(255,255,255,0.04)',
                        border: friend.sunSign ? `1px solid ${SIGN_COLORS[friend.sunSign]}20` : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                        style={{
                          background: friend.sunSign ? `${SIGN_COLORS[friend.sunSign]}20` : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {friend.sunSign ? SIGN_SYMBOLS[friend.sunSign] : '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{friend.name}</p>
                        <p className="text-white/30 text-[10px]">
                          {friend.hasAstralProfile ? `☀️ ${friend.sunSign}` : 'Mapa não preenchido'}
                          {friend.hasAstralProfile && friend.moonSign ? ` · 🌙 ${friend.moonSign}` : ''}
                        </p>
                      </div>
                      {friend.hasAstralProfile && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                      )}
                    </motion.button>
                  ))}
                {friendsWithAstral.filter(f => !searchQuery.trim() || f.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-white/20 text-xs text-center py-4">Nenhum amigo encontrado</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-white/20 text-[10px] uppercase tracking-widest">ou escolha manualmente</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Sign grid */}
      <div>
        <p className="text-white/35 text-[10px] uppercase tracking-widest mb-3">Signo solar do(a) amigo(a)</p>
        <div className="grid grid-cols-4 gap-2">
          {SIGNS_LIST.map(sign => {
            const isSelected = friendSign === sign;
            return (
              <motion.button
                key={sign}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setFriendSign(sign); setSelectedFriend(null); }}
                className="rounded-xl p-2.5 text-center transition-all"
                style={{
                  background: isSelected ? `${SIGN_COLORS[sign]}25` : 'rgba(255,255,255,0.04)',
                  border: isSelected ? `1.5px solid ${SIGN_COLORS[sign]}60` : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: isSelected ? `0 0 15px ${SIGN_COLORS[sign]}30` : 'none',
                }}
              >
                <span
                  className="text-xl block"
                  style={{ filter: isSelected ? `drop-shadow(0 0 6px ${SIGN_COLORS[sign]})` : 'none' }}
                >
                  {SIGN_SYMBOLS[sign]}
                </span>
                <p className={`text-[9px] mt-1 font-medium ${isSelected ? 'text-white' : 'text-white/35'}`}>
                  {sign.slice(0, 4)}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.button
        onClick={handleCheck}
        disabled={!friendSign || !userSign}
        whileHover={{ scale: friendSign && userSign ? 1.02 : 1 }}
        whileTap={{ scale: 0.98 }}
        className="w-full h-13 py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 text-sm transition-all"
        style={{
          background: friendSign && userSign
            ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)'
            : 'rgba(255,255,255,0.06)',
          boxShadow: friendSign && userSign ? '0 0 30px rgba(124,58,237,0.4)' : 'none',
          opacity: !friendSign || !userSign ? 0.5 : 1,
        }}
      >
        Revelar Sinastria
      </motion.button>
    </div>
  );
}
