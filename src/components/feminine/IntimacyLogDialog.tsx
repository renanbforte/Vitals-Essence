import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Shield, Clock, Heart, Smile, Zap, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { IntimacyLogInsert } from '@/hooks/useIntimacyLogs';

const ACTIVITY_TYPES = ['Penetrativa', 'Oral', 'Manual', 'Masturbação', 'Beijos/Carícias', 'Outro'];
const MOODS = ['Romântico', 'Apaixonado', 'Aventureiro', 'Carnal', 'Relaxado', 'Espontâneo'];
const ENERGY = ['Baixa', 'Média', 'Alta'];
const ORGASM = ['Nenhum', 'Um', 'Múltiplos'];
const DISCOMFORT = ['Nenhum', 'Leve', 'Moderado', 'Severo'];

interface Props {
  open: boolean;
  date: Date | null;
  onClose: () => void;
  onSave: (data: IntimacyLogInsert) => Promise<void>;
  isSaving: boolean;
}

function ScaleSelector({ value, onChange, color = 'hsl(340 60% 55%)' }: { value: number; onChange: (v: number) => void; color?: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 h-7 rounded-md text-xs font-semibold transition-all ${
            n <= value
              ? 'text-white shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
          style={n <= value ? { background: color } : undefined}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function IntimacyLogDialog({ open, date, onClose, onSave, isSaving }: Props) {
  const [form, setForm] = useState<Partial<IntimacyLogInsert>>({
    activity_type: [],
    protection_used: false,
    desire_before: 5,
    satisfaction: 5,
    pleasure: 5,
  });

  const toggleActivity = (a: string) =>
    setForm(f => ({
      ...f,
      activity_type: f.activity_type?.includes(a)
        ? f.activity_type.filter(x => x !== a)
        : [...(f.activity_type ?? []), a],
    }));

  const handleSave = async () => {
    if (!date) return;
    await onSave({
      log_date: format(date, 'yyyy-MM-dd'),
      activity_type: form.activity_type ?? [],
      protection_used: form.protection_used ?? false,
      desire_before: form.desire_before,
      satisfaction: form.satisfaction,
      pleasure: form.pleasure,
      duration_minutes: form.duration_minutes,
      partner_label: form.partner_label,
      location: form.location,
      orgasm: form.orgasm,
      energy_level: form.energy_level,
      mood: form.mood,
      contraception_used: form.contraception_used,
      discomfort: form.discomfort,
      notes: form.notes,
      log_time: form.log_time,
    });
    setForm({ activity_type: [], protection_used: false, desire_before: 5, satisfaction: 5, pleasure: 5 });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-background rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-3 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Novo Registro</h2>
                  {date && (
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Tipo de atividade */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> Tipo de atividade
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ACTIVITY_TYPES.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleActivity(a)}
                      className={`text-xs py-2.5 px-3 rounded-xl border text-left transition-all ${
                        form.activity_type?.includes(a)
                          ? 'bg-[hsl(340_60%_55%/0.15)] border-[hsl(340_60%_55%/0.5)] text-foreground font-medium'
                          : 'border-border/40 text-muted-foreground hover:border-border'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </section>

              {/* Duração + Horário */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Duração e horário
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Duração (min)"
                      className="h-10 rounded-xl text-sm"
                      value={form.duration_minutes ?? ''}
                      onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) || undefined }))}
                    />
                  </div>
                  <div>
                    <Input
                      type="time"
                      className="h-10 rounded-xl text-sm"
                      value={form.log_time ?? ''}
                      onChange={e => setForm(f => ({ ...f, log_time: e.target.value || undefined }))}
                    />
                  </div>
                </div>
              </section>

              {/* Parceiro e Local */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Contexto
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Parceiro(a) (opcional)"
                    className="h-10 rounded-xl text-sm"
                    value={form.partner_label ?? ''}
                    onChange={e => setForm(f => ({ ...f, partner_label: e.target.value || undefined }))}
                  />
                  <Input
                    placeholder="Local"
                    className="h-10 rounded-xl text-sm"
                    value={form.location ?? ''}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value || undefined }))}
                  />
                </div>
              </section>

              {/* Escalas */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5" /> Avaliação
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Desejo antes</span>
                      <span className="text-xs font-bold text-foreground">{form.desire_before}/10</span>
                    </div>
                    <ScaleSelector value={form.desire_before ?? 5} onChange={v => setForm(f => ({ ...f, desire_before: v }))} color="hsl(220 80% 55%)" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Satisfação</span>
                      <span className="text-xs font-bold text-foreground">{form.satisfaction}/10</span>
                    </div>
                    <ScaleSelector value={form.satisfaction ?? 5} onChange={v => setForm(f => ({ ...f, satisfaction: v }))} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">Prazer</span>
                      <span className="text-xs font-bold text-foreground">{form.pleasure}/10</span>
                    </div>
                    <ScaleSelector value={form.pleasure ?? 5} onChange={v => setForm(f => ({ ...f, pleasure: v }))} color="hsl(280 60% 55%)" />
                  </div>
                </div>
              </section>

              {/* Humor */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Humor e energia
                </p>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {MOODS.map(m => (
                      <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mood: f.mood === m ? undefined : m }))}
                        className={`text-xs py-2 px-2 rounded-xl border text-center transition-all ${form.mood === m ? 'bg-[hsl(40_80%_55%/0.2)] border-[hsl(40_80%_55%/0.5)] text-foreground font-medium' : 'border-border/40 text-muted-foreground'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ENERGY.map(e => (
                      <button key={e} type="button" onClick={() => setForm(f => ({ ...f, energy_level: f.energy_level === e ? undefined : e }))}
                        className={`text-xs py-2 px-2 rounded-xl border text-center transition-all ${form.energy_level === e ? 'bg-[hsl(120_50%_45%/0.2)] border-[hsl(120_50%_45%/0.5)] text-foreground font-medium' : 'border-border/40 text-muted-foreground'}`}>
                        {e} energia
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Orgasmo e Desconforto */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Saúde
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Orgasmo</p>
                    <div className="flex gap-1.5">
                      {ORGASM.map(o => (
                        <button key={o} type="button" onClick={() => setForm(f => ({ ...f, orgasm: f.orgasm === o ? undefined : o }))}
                          className={`flex-1 text-xs py-2 rounded-xl border transition-all ${form.orgasm === o ? 'bg-[hsl(340_60%_55%/0.15)] border-[hsl(340_60%_55%/0.5)] text-foreground font-medium' : 'border-border/40 text-muted-foreground'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Desconforto</p>
                    <div className="flex gap-1.5">
                      {DISCOMFORT.map(d => (
                        <button key={d} type="button" onClick={() => setForm(f => ({ ...f, discomfort: f.discomfort === d ? undefined : d }))}
                          className={`flex-1 text-xs py-2 rounded-xl border transition-all ${form.discomfort === d ? 'bg-[hsl(0_60%_55%/0.15)] border-[hsl(0_60%_55%/0.4)] text-foreground font-medium' : 'border-border/40 text-muted-foreground'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Anticoncepcional"
                      className="h-10 rounded-xl text-sm flex-1"
                      value={form.contraception_used ?? ''}
                      onChange={e => setForm(f => ({ ...f, contraception_used: e.target.value || undefined }))}
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, protection_used: !f.protection_used }))}
                      className={`px-3 h-10 rounded-xl border text-xs font-medium transition-all whitespace-nowrap ${form.protection_used ? 'bg-[hsl(120_50%_45%/0.2)] border-[hsl(120_50%_45%/0.5)] text-foreground' : 'border-border/40 text-muted-foreground'}`}
                    >
                      {form.protection_used ? '✓ Proteção' : 'Proteção'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Notas */}
              <section>
                <Textarea
                  placeholder="Notas livres... (privado e criptografado)"
                  className="rounded-xl text-sm min-h-[80px] resize-none"
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value || undefined }))}
                />
              </section>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[hsl(340_60%_55%)] to-[hsl(320_50%_50%)] text-white font-semibold shadow-lg"
              >
                {isSaving ? 'Salvando...' : 'Salvar registro'}
              </Button>

              <div className="pb-4" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
