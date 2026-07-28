import { Droplets, Plus, Pencil, Minus, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { HydrationEntry } from '@/hooks/useHydrationSchedule';

interface WaterCardProps {
  waterMl: number;
  onAddWater: (amount: number) => void;
  onSetWater?: (amount: number) => void;
  schedule?: HydrationEntry[];
  completedScheduleIds?: string[];
  onToggleScheduleEntry?: (entryId: string, amount: number) => void;
  totalScheduledMl?: number;
}

function getOverflowWord(date: Date) {
  const words = ["EXCELENTE", "HIDRATADO", "SEM SEDE", "H2OOOOOOO"];
  // Deterministic per day
  const dayHash = date.getFullYear() * 1000 + date.getMonth() * 32 + date.getDate();
  return words[dayHash % words.length];
}

function WaterBottle({ percentage, waterMl, goalMl }: { percentage: number; waterMl: number; goalMl: number }) {
  const fillHeight = Math.min(percentage, 100);
  const isOverflowing = percentage >= 100;
  const liters = (waterMl / 1000).toFixed(1);
  const goalLiters = (goalMl / 1000).toFixed(1);

  // Premium bottle dimensions
  const bodyTop = 52;
  const bodyBot = 162;
  const bodyH = bodyBot - bodyTop;
  const waterY = bodyBot - (fillHeight / 100) * bodyH;

  return (
    <div className="flex items-center justify-center py-3 relative" style={{ minHeight: 260 }}>
      <div className="flex flex-col items-center relative" style={{ zIndex: 1 }}>
        <svg width="120" height="185" viewBox="0 0 120 185" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Bottle body clip */}
            <clipPath id="bottleClip">
              <path d="M28 52 Q28 44 36 42 L44 38 L44 22 L76 22 L76 38 L84 42 Q92 44 92 52 L92 150 Q92 162 80 162 L40 162 Q28 162 28 150 Z" />
            </clipPath>
            {/* Water gradient — premium cool tones */}
            <linearGradient id="waterGrad" x1="60" y1="40" x2="60" y2="165" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(210 90% 72% / 0.8)" />
              <stop offset="50%" stopColor="hsl(220 85% 58% / 0.9)" />
              <stop offset="100%" stopColor="hsl(230 75% 48% / 0.95)" />
            </linearGradient>
            {/* Glass body gradient */}
            <linearGradient id="glassGrad" x1="30" y1="50" x2="90" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            {/* Reflection highlight */}
            <linearGradient id="reflectGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* === CAP === */}
          <motion.g
            animate={isOverflowing 
              ? { y: -16, rotate: 12, scale: 1 } 
              : { y: 0, rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.5, type: 'spring', stiffness: 80, damping: 10 }}
            style={{ transformOrigin: '60px 8px' }}
          >
            <motion.g
              animate={isOverflowing ? { y: [0, -3, 0] } : { y: 0 }}
              transition={isOverflowing ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {/* Cap body */}
              <rect x="42" y="4" width="36" height="10" rx="4" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
              {/* Cap ridge */}
              <rect x="40" y="13" width="40" height="4" rx="2" fill="rgba(255,255,255,0.12)" />
              {/* Cap grip lines */}
              <line x1="49" y1="7" x2="49" y2="11" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="55" y1="7" x2="55" y2="11" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="61" y1="7" x2="61" y2="11" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="67" y1="7" x2="67" y2="11" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
              <line x1="71" y1="7" x2="71" y2="11" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
            </motion.g>
          </motion.g>

          {/* === NECK === */}
          <rect x="44" y="17" width="32" height="6" rx="1" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
          {/* Neck rim */}
          <rect x="42" y="22" width="36" height="2" rx="1" fill="rgba(255,255,255,0.15)" />

          {/* Neck to body transition */}
          <path d="M44 24 L44 38 L36 42 Q28 44 28 52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <path d="M76 24 L76 38 L84 42 Q92 44 92 52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />

          {/* === BOTTLE BODY === */}
          <path 
            d="M28 52 L28 150 Q28 162 40 162 L80 162 Q92 162 92 150 L92 52" 
            fill="url(#glassGrad)" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1.5" 
          />

          {/* === WATER FILL === */}
          <g clipPath="url(#bottleClip)">
            <motion.g
              initial={{ y: 170 }}
              animate={{ y: fillHeight === 0 ? 170 : waterY - bodyTop }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              {/* Primary wave */}
              <motion.path
                d="M20 0 Q32 -5 44 0 Q56 5 68 0 Q80 -5 92 0 Q104 5 110 0 L110 200 L20 200 Z"
                fill="url(#waterGrad)"
                animate={{ d: [
                  "M20 0 Q32 -5 44 0 Q56 5 68 0 Q80 -5 92 0 Q104 5 110 0 L110 200 L20 200 Z",
                  "M20 0 Q32 5 44 0 Q56 -5 68 0 Q80 5 92 0 Q104 -5 110 0 L110 200 L20 200 Z",
                  "M20 0 Q32 -5 44 0 Q56 5 68 0 Q80 -5 92 0 Q104 5 110 0 L110 200 L20 200 Z",
                ]}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Secondary deeper wave */}
              <motion.path
                d="M20 4 Q35 -2 50 4 Q65 10 80 4 Q95 -2 110 4 L110 200 L20 200 Z"
                fill="hsl(225 70% 45% / 0.25)"
                animate={{ d: [
                  "M20 4 Q35 -2 50 4 Q65 10 80 4 Q95 -2 110 4 L110 200 L20 200 Z",
                  "M20 4 Q35 10 50 4 Q65 -2 80 4 Q95 10 110 4 L110 200 L20 200 Z",
                  "M20 4 Q35 -2 50 4 Q65 10 80 4 Q95 -2 110 4 L110 200 L20 200 Z",
                ]}}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Bubbles */}
              <motion.circle cx="42" cy="35" r="1.8" fill="rgba(255,255,255,0.3)"
                animate={{ cy: [35, 12, -5], opacity: [0.3, 0.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
              />
              <motion.circle cx="65" cy="50" r="1.2" fill="rgba(255,255,255,0.25)"
                animate={{ cy: [50, 20, 0], opacity: [0.25, 0.4, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.2 }}
              />
              <motion.circle cx="52" cy="65" r="2" fill="rgba(255,255,255,0.2)"
                animate={{ cy: [65, 30, 5], opacity: [0.2, 0.35, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: 2 }}
              />
            </motion.g>
          </g>

          {/* === MEASUREMENT MARKS === */}
          {[25, 50, 75].map((mark) => {
            const markY = bodyBot - (mark / 100) * bodyH;
            return (
              <g key={mark}>
                <line x1="88" y1={markY} x2="94" y2={markY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="86" y={markY + 1} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.2)" fontFamily="system-ui">{mark}%</text>
              </g>
            );
          })}

          {/* === GLASS REFLECTIONS === */}
          {/* Left edge reflection */}
          <path d="M32 58 L32 148 Q32 154 36 156" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Top-left highlight */}
          <path d="M38 50 L40 58" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Right subtle reflection */}
          <path d="M88 60 L88 80" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Overflow bubbling at neck */}
          {isOverflowing && (
            <g>
              <motion.ellipse cx="60" cy="20" rx="14" ry="3" fill="hsl(210 85% 65% / 0.4)"
                animate={{ ry: [3, 5, 3], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.circle cx="52" cy="17" r="2" fill="hsl(210 85% 70% / 0.35)"
                animate={{ cy: [17, 10, 3], opacity: [0.35, 0.15, 0], r: [2, 2.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.circle cx="66" cy="18" r="1.5" fill="hsl(210 85% 70% / 0.3)"
                animate={{ cy: [18, 11, 4], opacity: [0.3, 0.12, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 1 }}
              />
            </g>
          )}
        </svg>

        {/* Labels */}
        <motion.p 
          className="text-3xl font-extrabold text-white mt-1 tracking-tight"
          key={liters}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {liters}L
        </motion.p>
        <p className="text-white/50 text-[11px]">de {goalLiters}L</p>
      </div>
    </div>
  );
}

export function WaterCard({ 
  waterMl, onAddWater, onSetWater, schedule = [], completedScheduleIds = [],
  onToggleScheduleEntry, totalScheduledMl = 3000,
}: WaterCardProps) {
  const rawPercentage = (waterMl / totalScheduledMl) * 100;
  const percentage = Math.min(rawPercentage, 100);
  const isOverflowing = rawPercentage >= 100;
  const [editOpen, setEditOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleEditOpen = () => { setEditValue((waterMl / 1000).toFixed(1)); setEditOpen(true); };
  const handleSave = () => {
    const mlValue = Math.max(0, Math.min(parseFloat(editValue) * 1000, 5000));
    if (!isNaN(mlValue) && onSetWater) onSetWater(mlValue);
    setEditOpen(false);
  };
  const handleRemoveWater = (amount: number) => {
    if (onSetWater) onSetWater(Math.max(0, waterMl - amount));
  };

  const completedCount = completedScheduleIds.length;
  const totalCount = schedule.length;
  const goalLiters = (totalScheduledMl / 1000).toFixed(1);

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      {/* Header with gradient + bottle */}
      <div className="gradient-water p-5 pb-3 relative overflow-hidden">
        {/* Condensation / fogged glass effect when overflowing */}
        {isOverflowing && (
          <>
            {/* Frosted glass overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
              <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-[1px]" />
            </div>

            {/* SVG realistic water droplets and streaks */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} preserveAspectRatio="none">
              <defs>
                <radialGradient id="dropGrad" cx="50%" cy="30%" r="60%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="60%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                </radialGradient>
                <filter id="dropBlur">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                </filter>
              </defs>

              {/* Static condensation dots scattered */}
              {[
                { cx: '8%', cy: '15%', r: 3 }, { cx: '15%', cy: '55%', r: 2 }, { cx: '22%', cy: '30%', r: 2.5 },
                { cx: '35%', cy: '70%', r: 1.8 }, { cx: '42%', cy: '20%', r: 3.5 }, { cx: '50%', cy: '85%', r: 2 },
                { cx: '58%', cy: '40%', r: 2.8 }, { cx: '65%', cy: '65%', r: 1.5 }, { cx: '72%', cy: '12%', r: 3 },
                { cx: '80%', cy: '50%', r: 2.2 }, { cx: '88%', cy: '75%', r: 2.5 }, { cx: '93%', cy: '25%', r: 1.8 },
                { cx: '18%', cy: '80%', r: 2 }, { cx: '48%', cy: '45%', r: 1.5 }, { cx: '76%', cy: '35%', r: 3.2 },
              ].map((dot, i) => (
                <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} fill="url(#dropGrad)" filter="url(#dropBlur)" opacity="0.7" />
              ))}
            </svg>

            {/* Animated drops that slide down with realistic trails */}
            {/* Drop 1 - large, slow */}
            <motion.div className="absolute pointer-events-none" style={{ left: '18%', zIndex: 0 }}
              initial={{ top: '8%' }}
              animate={{ top: ['8%', '95%'] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative">
                <div className="w-[3px] h-[3px] rounded-full bg-white/30 shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
                {/* Trail behind the drop */}
                <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[1.5px] h-12 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full" />
              </div>
            </motion.div>

            {/* Drop 2 - medium */}
            <motion.div className="absolute pointer-events-none" style={{ left: '45%', zIndex: 0 }}
              initial={{ top: '15%' }}
              animate={{ top: ['15%', '92%'] }}
              transition={{ duration: 6, repeat: Infinity, delay: 1.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative">
                <div className="w-[2.5px] h-[4px] rounded-full bg-white/25 shadow-[0_0_3px_rgba(255,255,255,0.15)]" style={{ borderRadius: '40% 40% 50% 50%' }} />
                <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[1px] h-10 bg-gradient-to-t from-transparent via-white/8 to-white/15 rounded-full" />
              </div>
            </motion.div>

            {/* Drop 3 - small, fast */}
            <motion.div className="absolute pointer-events-none" style={{ left: '72%', zIndex: 0 }}
              initial={{ top: '5%' }}
              animate={{ top: ['5%', '88%'] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative">
                <div className="w-[2px] h-[3px] rounded-full bg-white/20 shadow-[0_0_3px_rgba(255,255,255,0.1)]" style={{ borderRadius: '40% 40% 50% 50%' }} />
                <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[1px] h-8 bg-gradient-to-t from-transparent via-white/6 to-white/12 rounded-full" />
              </div>
            </motion.div>

            {/* Drop 4 - large, starts mid */}
            <motion.div className="absolute pointer-events-none" style={{ left: '88%', zIndex: 0 }}
              initial={{ top: '25%' }}
              animate={{ top: ['25%', '96%'] }}
              transition={{ duration: 4.5, repeat: Infinity, delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative">
                <div className="w-[3px] h-[4px] rounded-full bg-white/28" style={{ borderRadius: '40% 40% 50% 50%' }} />
                <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[1.5px] h-14 bg-gradient-to-t from-transparent via-white/8 to-white/18 rounded-full" />
              </div>
            </motion.div>

            {/* Drop 5 - tiny accent */}
            <motion.div className="absolute pointer-events-none" style={{ left: '32%', zIndex: 0 }}
              initial={{ top: '35%' }}
              animate={{ top: ['35%', '90%'] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 3.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative">
                <div className="w-[2px] h-[2px] rounded-full bg-white/22" />
                <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[0.5px] h-6 bg-gradient-to-t from-transparent to-white/10 rounded-full" />
              </div>
            </motion.div>

            {/* Drop 6 */}
            <motion.div className="absolute pointer-events-none" style={{ left: '58%', zIndex: 0 }}
              initial={{ top: '12%' }}
              animate={{ top: ['12%', '94%'] }}
              transition={{ duration: 5.5, repeat: Infinity, delay: 4, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative">
                <div className="w-[2.5px] h-[3.5px] rounded-full bg-white/25" style={{ borderRadius: '40% 40% 50% 50%' }} />
                <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[1px] h-11 bg-gradient-to-t from-transparent via-white/7 to-white/14 rounded-full" />
              </div>
            </motion.div>
          </>
        )}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Hidratação</h3>
              <p className="text-white/70 text-xs">Meta: {goalLiters}L por dia</p>
            </div>
          </div>
          
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleEditOpen} className="text-white/60 hover:text-white hover:bg-white/15 rounded-xl h-9 w-9">
                <Pencil className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
              <DialogHeader><DialogTitle>Editar Hidratação</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Input type="number" step="0.1" min="0" max="5" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="text-center text-lg" placeholder="0.0" />
                  <span className="text-lg font-medium text-muted-foreground">L</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">Salvar</Button>
                  <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Animated Water Bottle */}
        <WaterBottle percentage={percentage} waterMl={waterMl} goalMl={totalScheduledMl} />
        
        {/* Percentage badge */}
        <div className="flex justify-center -mt-1 mb-2">
          <motion.span 
            className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full"
            key={Math.round(percentage)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {Math.round(percentage)}% da meta
          </motion.span>
        </div>
      </div>

      {/* Body with controls */}
      <div className="bg-card p-4 space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleRemoveWater(250)} disabled={waterMl === 0}
            className="rounded-xl border-border hover:border-primary/30 hover:bg-primary/5 disabled:opacity-30">
            <Minus className="w-3.5 h-3.5" />
          </Button>
          {[250, 500, 1000].map((ml) => (
            <Button key={ml} variant="outline" size="sm" onClick={() => onAddWater(ml)}
              className="flex-1 rounded-xl border-border hover:border-primary/30 hover:bg-primary/5 gap-1 font-semibold text-xs">
              <Plus className="w-3.5 h-3.5 text-primary" />
              {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
            </Button>
          ))}
        </div>

        {schedule.length > 0 && (
          <Collapsible open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between rounded-xl bg-muted/50 hover:bg-muted text-foreground font-semibold text-sm h-11">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Horários do Dia</span>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                  {completedCount}/{totalCount}
                </span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1.5">
              {schedule.map((entry) => {
                const isCompleted = completedScheduleIds.includes(entry.id);
                return (
                  <motion.div
                    key={entry.id}
                    onClick={() => onToggleScheduleEntry?.(entry.id, entry.amount_ml)}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      isCompleted 
                        ? 'bg-primary/10 border-primary/20' 
                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      }`}>
                        {isCompleted && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isCompleted ? 'text-foreground' : 'text-foreground/80'}`}>{entry.label}</span>
                        <span className="text-muted-foreground text-xs">{entry.schedule_time}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold ${isCompleted ? 'text-primary line-through' : 'text-muted-foreground'}`}>
                      {entry.amount_ml}ml
                    </span>
                  </motion.div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
