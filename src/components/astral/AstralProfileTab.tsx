// ============================================================================
// ABA "PERFIL" ASTRAL + DIÁRIO CÓSMICO
// Mostra um cartão com o mapa astral do usuário (signo solar, lua, ascendente,
// data e cidade de nascimento) e um "Diário Cósmico" onde ele escreve como se
// sente, marca o humor e vê as últimas anotações salvas.
// ============================================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile, Meh, Frown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useCosmicJournal, useAstral } from '@/hooks/useAstral';
import { SIGN_SYMBOLS } from '@/lib/astralCalculations';
import type { ZodiacSign } from '@/lib/astralCalculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import journalImg from '@/assets/astral-journal.png';

// Opções de humor do diário, cada uma com rótulo, ícone e cores próprias
const MOODS = [
  { id: 'great', label: 'Ótimo', icon: Smile, color: 'text-emerald-400', bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)' },
  { id: 'okay', label: 'Ok', icon: Meh, color: 'text-amber-400', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' },
  { id: 'low', label: 'Baixo', icon: Frown, color: 'text-rose-400', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.3)' },
];

// Emoji correspondente a cada humor, usado ao listar as entradas antigas
const MOOD_EMOJI: Record<string, string> = { great: '😊', okay: '😐', low: '😔' };

export default function AstralProfileTab() {
  // Mapa astral do usuário
  const { profile } = useAstral();
  // Entradas do diário, função de salvar e sinal de "salvando"
  const { entries, saveEntry, isSaving } = useCosmicJournal();
  // Texto que está sendo escrito na nova entrada
  const [content, setContent] = useState('');
  // Humor selecionado para a nova entrada (ou nenhum)
  const [mood, setMood] = useState<string | null>(null);

  // Signo solar do usuário
  const sunSign = profile?.sun_sign as ZodiacSign | undefined;

  // Salva a nova entrada do diário (ignora se estiver vazia) e limpa o formulário
  const handleSave = async () => {
    if (!content.trim()) return;
    await saveEntry({ content, mood: mood || undefined });
    setContent('');
    setMood(null);
  };

  // Layout: cartão do perfil astral (se houver) + o Diário Cósmico embaixo
  return (
    <div className="flex-1 overflow-y-auto pb-6 px-4 space-y-4">

      {/* Perfil astral — com hero image */}
      {profile && sunSign && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(88,28,135,0.4) 0%, rgba(49,46,129,0.4) 100%)',
            border: '1px solid rgba(167,139,250,0.15)',
            boxShadow: '0 0 40px rgba(139,92,246,0.12)',
          }}
        >
          {/* Background stars */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-15 blur-2xl rounded-full"
            style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />

          <div className="relative p-5 text-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="text-5xl block mb-2"
              style={{ filter: 'drop-shadow(0 0 15px rgba(251,191,36,0.5))' }}
            >
              {SIGN_SYMBOLS[sunSign]}
            </motion.div>
            <h3
              className="font-bold text-xl mb-0.5"
              style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.4)' }}
            >
              {sunSign}
            </h3>
            <p className="text-white/35 text-xs mb-4">
              {format(new Date(profile.birth_date + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Sol ☀️', value: profile.sun_sign },
                { label: 'Lua 🌙', value: profile.moon_sign },
                { label: 'Asc. ⬆️', value: profile.ascendant_sign },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-xl p-2.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <p className="text-white/30 text-[9px] uppercase tracking-widest">{item.label}</p>
                  <p className="text-white text-xs font-semibold mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            {profile.birth_city && (
              <p className="text-white/25 text-xs text-center mt-3">📍 {profile.birth_city}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Diário Cósmico — com imagem */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <img src={journalImg} alt="" className="w-5 h-5 rounded object-cover opacity-70" />
          <p className="text-white/40 text-[10px] uppercase tracking-widest">Diário Cósmico</p>
        </div>

        {/* Nova entrada */}
        <motion.div
          className="rounded-2xl p-4 mb-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Como você se sente hoje? O que as estrelas te trouxeram?"
            className="bg-transparent border-0 text-white/80 placeholder:text-white/20 resize-none p-0 focus-visible:ring-0 min-h-20 text-sm"
          />
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-1.5">
              {MOODS.map(m => {
                const Icon = m.icon;
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMood(mood === m.id ? null : m.id)}
                    className="p-2 rounded-xl transition-all"
                    style={{
                      background: isSelected ? m.bg : 'transparent',
                      border: isSelected ? `1px solid ${m.border}` : '1px solid transparent',
                    }}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? m.color : 'text-white/25'}`} />
                  </button>
                );
              })}
            </div>
            <motion.button
              onClick={handleSave}
              disabled={!content.trim() || isSaving}
              whileHover={{ scale: content.trim() ? 1.03 : 1 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-xl disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
            >
              <Send className="w-3 h-3" />
              Salvar
            </motion.button>
          </div>
        </motion.div>

        {/* Entradas anteriores */}
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry: any, i: number) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/25 text-xs">
                    {format(new Date(entry.entry_date + 'T12:00:00'), "d 'de' MMMM", { locale: ptBR })}
                  </p>
                  {entry.mood && (
                    <span className="text-sm">{MOOD_EMOJI[entry.mood]}</span>
                  )}
                </div>
                <p className="text-white/55 text-xs leading-relaxed line-clamp-3">{entry.content}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 relative">
            <img src={journalImg} alt="" className="w-20 h-20 object-cover rounded-2xl mx-auto mb-3 opacity-30" />
            <p className="text-white/25 text-xs">Suas reflexões cósmicas aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
