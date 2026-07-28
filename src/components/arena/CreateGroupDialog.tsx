// ============================================================================
// CreateGroupDialog (Diálogo de Criar Grupo)
// Assistente (wizard) em 7 passos para criar um novo grupo de desafio: nome,
// tipo, pilares, regras, intensidade, tipos de ranking e calendário. Ao final,
// junta tudo num objeto e envia para quem chamou o componente (onSubmit).
// ============================================================================
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Globe, Shield, Eye, EyeOff, Minus, Droplets, Utensils, Dumbbell, Camera, Clock, Flame, Trophy, TrendingUp, Scale, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

// Títulos dos 7 passos do assistente, na ordem em que aparecem.
const STEPS = ['Básico', 'Tipo', 'Pilares', 'Regras', 'Intensidade', 'Ranking', 'Calendário'];

export function CreateGroupDialog({ open, onOpenChange, onSubmit }: CreateGroupDialogProps) {
  // Passo atual do assistente (começa em 0 = primeiro passo).
  const [step, setStep] = useState(0);
  // Formulário com todos os dados do grupo em construção e seus valores padrão.
  const [form, setForm] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    group_type: 'private',
    transparency_level: 'full',
    pillar_hydration: true,
    pillar_nutrition: true,
    pillar_workout: true,
    photo_required: false,
    deadline_hour: '',
    streak_breaks_on_fail: false,
    ranking_resets_weekly: false,
    intensity: 'balanced',
    ranking_total_score: true,
    ranking_evolution: false,
    ranking_streak: false,
    ranking_balance: false,
    calendar_show_photos: true,
    calendar_show_daily_score: true,
    calendar_members_only: true,
  });

  // Atualiza um único campo do formulário, preservando os demais.
  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  // No primeiro passo, só permite avançar se o nome estiver preenchido.
  const canNext = step === 0 ? form.name.trim().length > 0 : true;
  // Verifica se pelo menos um pilar foi selecionado (obrigatório para criar o grupo).
  const atLeastOnePillar = form.pillar_hydration || form.pillar_nutrition || form.pillar_workout;

  // Finaliza a criação: valida os pilares, remove campos opcionais vazios, envia os
  // dados via onSubmit e zera o assistente (volta ao passo 0 com os valores padrão).
  const handleSubmit = () => {
    if (!atLeastOnePillar) return;
    const payload = { ...form };
    if (!payload.end_date) delete (payload as any).end_date;
    if (!payload.deadline_hour) delete (payload as any).deadline_hour;
    onSubmit(payload);
    setStep(0);
    setForm({ name: '', description: '', start_date: new Date().toISOString().split('T')[0], end_date: '', group_type: 'private', transparency_level: 'full', pillar_hydration: true, pillar_nutrition: true, pillar_workout: true, photo_required: false, deadline_hour: '', streak_breaks_on_fail: false, ranking_resets_weekly: false, intensity: 'balanced', ranking_total_score: true, ranking_evolution: false, ranking_streak: false, ranking_balance: false, calendar_show_photos: true, calendar_show_daily_score: true, calendar_members_only: true });
  };

  // Opções de tipo de grupo mostradas no passo "Tipo" (valor, ícone, rótulo e descrição).
  const groupTypes = [
    { value: 'private', icon: Lock, label: 'Privado', desc: 'Só entra por convite' },
    { value: 'public', icon: Globe, label: 'Público', desc: 'Qualquer pessoa pode entrar' },
    { value: 'hybrid', icon: Shield, label: 'Híbrido', desc: 'Privado + ranking global' },
  ];

  // Opções de nível de transparência (quanto os outros participantes podem ver).
  const transparencyLevels = [
    { value: 'full', icon: Eye, label: 'Transparente', desc: 'Tudo visível' },
    { value: 'partial', icon: Minus, label: 'Parcial', desc: 'Só pontuação final' },
    { value: 'discreet', icon: EyeOff, label: 'Discreto', desc: 'Apenas posição' },
  ];

  // Opções de intensidade (definem como falhas afetam pontos e streak).
  const intensityLevels = [
    { value: 'light', icon: '🌿', label: 'Leve', desc: 'Apenas soma pontos' },
    { value: 'balanced', icon: '⚖', label: 'Equilibrado', desc: 'Perde streak, não pontos' },
    { value: 'hardcore', icon: '🔥', label: 'Hardcore', desc: 'Perde pontos e streak' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Criar Grupo</DialogTitle>
          {/* Barra de progresso: um traço por passo, preenchido até o passo atual */}
          <div className="flex items-center gap-1 mt-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{STEPS[step]}</p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-2"
          >
            {/* Passo 0 - Básico: nome, descrição e datas de início/fim do grupo */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label>Nome do grupo *</Label>
                  <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Squad Fitness" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Opcional..." rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim (opcional)</Label>
                    <Input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* Passo 1 - Tipo: escolha do tipo de grupo e do nível de transparência */}
            {step === 1 && (
              <>
                <Label className="text-sm font-semibold">Tipo de Grupo</Label>
                <div className="space-y-2">
                  {groupTypes.map(t => (
                    <button
                      key={t.value}
                      onClick={() => update('group_type', t.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${form.group_type === t.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}
                    >
                      <t.icon className={`w-5 h-5 ${form.group_type === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <Label className="text-sm font-semibold mt-4">Transparência</Label>
                <div className="space-y-2">
                  {transparencyLevels.map(t => (
                    <button
                      key={t.value}
                      onClick={() => update('transparency_level', t.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${form.transparency_level === t.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}
                    >
                      <t.icon className={`w-5 h-5 ${form.transparency_level === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Passo 2 - Pilares: liga/desliga os pilares do desafio (mínimo de 1) */}
            {step === 2 && (
              <>
                <Label className="text-sm font-semibold">Pilares Ativos</Label>
                <p className="text-xs text-muted-foreground">Selecione ao menos 1 pilar</p>
                <div className="space-y-3">
                  {[
                    { key: 'pillar_hydration', icon: Droplets, label: 'Hidratação', color: 'text-blue-500' },
                    { key: 'pillar_nutrition', icon: Utensils, label: 'Alimentação', color: 'text-green-500' },
                    { key: 'pillar_workout', icon: Dumbbell, label: 'Corpo em Ativação', color: 'text-orange-500' },
                  ].map(p => (
                    <div key={p.key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${(form as any)[p.key] ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <div className="flex items-center gap-3">
                        <p.icon className={`w-5 h-5 ${p.color}`} />
                        <span className="font-semibold text-sm">{p.label}</span>
                      </div>
                      <Switch checked={(form as any)[p.key]} onCheckedChange={v => update(p.key, v)} />
                    </div>
                  ))}
                </div>
                {!atLeastOnePillar && <p className="text-xs text-destructive">Selecione ao menos 1 pilar</p>}
              </>
            )}

            {/* Passo 3 - Regras: foto obrigatória, horário limite, quebra de streak e reset semanal */}
            {step === 3 && (
              <>
                <Label className="text-sm font-semibold">Regras</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Camera className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Foto obrigatória</p>
                        <p className="text-xs text-muted-foreground">Para pontuar</p>
                      </div>
                    </div>
                    <Switch checked={form.photo_required} onCheckedChange={v => update('photo_required', v)} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Horário limite</p>
                        <p className="text-xs text-muted-foreground">Registrar até</p>
                      </div>
                    </div>
                    <Input type="time" value={form.deadline_hour} onChange={e => update('deadline_hour', e.target.value)} className="w-24 text-sm" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Flame className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Streak quebra</p>
                        <p className="text-xs text-muted-foreground">Se falhar 1 pilar</p>
                      </div>
                    </div>
                    <Switch checked={form.streak_breaks_on_fail} onCheckedChange={v => update('streak_breaks_on_fail', v)} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Reset semanal</p>
                        <p className="text-xs text-muted-foreground">Ranking reinicia</p>
                      </div>
                    </div>
                    <Switch checked={form.ranking_resets_weekly} onCheckedChange={v => update('ranking_resets_weekly', v)} />
                  </div>
                </div>
              </>
            )}

            {/* Passo 4 - Intensidade: define o rigor do grupo (leve, equilibrado ou hardcore) */}
            {step === 4 && (
              <>
                <Label className="text-sm font-semibold">Intensidade</Label>
                <div className="space-y-2">
                  {intensityLevels.map(t => (
                    <button
                      key={t.value}
                      onClick={() => update('intensity', t.value)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${form.intensity === t.value ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/30'}`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Passo 5 - Ranking: escolhe quais tipos de classificação o grupo terá */}
            {step === 5 && (
              <>
                <Label className="text-sm font-semibold">Tipos de Ranking</Label>
                <p className="text-xs text-muted-foreground">Ative os que desejar</p>
                <div className="space-y-3">
                  {[
                    { key: 'ranking_total_score', icon: Trophy, label: 'Pontuação total' },
                    { key: 'ranking_evolution', icon: TrendingUp, label: 'Evolução' },
                    { key: 'ranking_streak', icon: Flame, label: 'Streak' },
                    { key: 'ranking_balance', icon: Scale, label: 'Equilíbrio (3 pilares)' },
                  ].map(r => (
                    <div key={r.key} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${(form as any)[r.key] ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <div className="flex items-center gap-3">
                        <r.icon className={`w-5 h-5 ${(form as any)[r.key] ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-semibold text-sm">{r.label}</span>
                      </div>
                      <Switch checked={(form as any)[r.key]} onCheckedChange={v => update(r.key, v)} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Passo 6 - Calendário: define o que fica visível no calendário compartilhado */}
            {step === 6 && (
              <>
                <Label className="text-sm font-semibold">Calendário Compartilhado</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <span className="font-semibold text-sm">Todos veem fotos do dia</span>
                    <Switch checked={form.calendar_show_photos} onCheckedChange={v => update('calendar_show_photos', v)} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <span className="font-semibold text-sm">Todos veem pontuação diária</span>
                    <Switch checked={form.calendar_show_daily_score} onCheckedChange={v => update('calendar_show_daily_score', v)} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <span className="font-semibold text-sm">Apenas participantes veem</span>
                    <Switch checked={form.calendar_members_only} onCheckedChange={v => update('calendar_members_only', v)} />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Rodapé de navegação: botão de voltar/cancelar e botão de avançar/criar */}
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(s => s - 1) : onOpenChange(false)} size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          {/* Antes do último passo mostra "Próximo"; no último, mostra "Criar Grupo" */}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext || (step === 2 && !atLeastOnePillar)} size="sm">
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!atLeastOnePillar} size="sm" className="gap-1">
              <Check className="w-4 h-4" />
              Criar Grupo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
