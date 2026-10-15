// ============================================================================
// TELA DE HIDRATAÇÃO (Onboarding)
// Esta etapa deixa o usuário montar sua rotina de beber água ao longo do dia.
// Ele pode escolher um modelo pronto (2L, 3L ou 4L) ou personalizar os
// horários e quantidades. A meta diária é recalculada conforme os horários.
// ============================================================================
import { useState } from 'react';
import { Droplets, Plus, Trash2, Clock, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OnboardingData } from '../OnboardingWizard';

interface StepHydrationProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

// Modelos prontos de hidratação: cada um traz a meta total (em ml) e uma
// lista de horários com quantidade e um rótulo (ex.: "Manhã", "Almoço").
const presetSchedules = [
  {
    name: 'Básico (2L)',
    total: 2000,
    schedule: [
      { time: '08:00', amount: 250, label: 'Manhã' },
      { time: '10:00', amount: 250, label: 'Meio da manhã' },
      { time: '12:00', amount: 250, label: 'Almoço' },
      { time: '14:00', amount: 250, label: 'Início da tarde' },
      { time: '16:00', amount: 250, label: 'Meio da tarde' },
      { time: '18:00', amount: 250, label: 'Fim da tarde' },
      { time: '20:00', amount: 250, label: 'Noite' },
      { time: '22:00', amount: 250, label: 'Antes de dormir' },
    ],
  },
  {
    name: 'Moderado (3L)',
    total: 3000,
    schedule: [
      { time: '07:00', amount: 300, label: 'Ao acordar' },
      { time: '09:00', amount: 300, label: 'Manhã 1' },
      { time: '11:00', amount: 400, label: 'Manhã 2' },
      { time: '13:00', amount: 300, label: 'Almoço' },
      { time: '15:00', amount: 400, label: 'Tarde 1' },
      { time: '17:00', amount: 400, label: 'Tarde 2' },
      { time: '19:00', amount: 400, label: 'Noite 1' },
      { time: '21:00', amount: 500, label: 'Noite 2' },
    ],
  },
  {
    name: 'Intenso (4L)',
    total: 4000,
    schedule: [
      { time: '06:30', amount: 400, label: 'Ao acordar' },
      { time: '08:30', amount: 400, label: 'Café' },
      { time: '10:30', amount: 500, label: 'Manhã' },
      { time: '12:30', amount: 400, label: 'Almoço' },
      { time: '14:30', amount: 500, label: 'Pós-almoço' },
      { time: '16:30', amount: 500, label: 'Tarde' },
      { time: '18:30', amount: 400, label: 'Pré-jantar' },
      { time: '20:30', amount: 500, label: 'Noite' },
      { time: '22:00', amount: 400, label: 'Antes de dormir' },
    ],
  },
];

export default function StepHydration({ data, updateData }: StepHydrationProps) {
  // Controla se o painel de personalização de horários está aberto ou não.
  const [customMode, setCustomMode] = useState(false);
  // Guarda os dados do novo horário que o usuário está digitando para adicionar.
  const [newEntry, setNewEntry] = useState({ time: '12:00', amount: 250, label: '' });

  // Aplica um modelo pronto: define a meta e a lista de horários, e fecha
  // o modo de personalização.
  const selectPreset = (preset: typeof presetSchedules[0]) => {
    updateData({
      hydrationGoal: preset.total,
      hydrationSchedule: preset.schedule,
    });
    setCustomMode(false);
  };

  // Adiciona um horário personalizado à lista, mantém os horários em ordem
  // e recalcula a meta diária somando todas as quantidades.
  const addCustomEntry = () => {
    if (!newEntry.label) return;
    const updated = [...data.hydrationSchedule, newEntry].sort((a, b) => 
      a.time.localeCompare(b.time)
    );
    updateData({ 
      hydrationSchedule: updated,
      hydrationGoal: updated.reduce((sum, e) => sum + e.amount, 0)
    });
    setNewEntry({ time: '12:00', amount: 250, label: '' });
  };

  // Remove um horário da lista (pela posição) e recalcula a meta diária.
  const removeEntry = (index: number) => {
    const updated = data.hydrationSchedule.filter((_, i) => i !== index);
    updateData({ 
      hydrationSchedule: updated,
      hydrationGoal: updated.reduce((sum, e) => sum + e.amount, 0)
    });
  };

  const currentTotal = data.hydrationSchedule.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                💡 Dica de Hidratação
              </p>
              <p className="text-muted-foreground">
                A recomendação geral é beber cerca de <strong>35ml por kg de peso corporal</strong>. 
                Para você ({data.currentWeight}kg), isso seria aproximadamente{' '}
                <strong>{Math.round(data.currentWeight * 35 / 100) * 100}ml</strong> por dia.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Escolha um modelo</h3>
        <div className="grid gap-3">
          {presetSchedules.map((preset) => (
            <Card
              key={preset.name}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                currentTotal === preset.total && !customMode
                  ? 'border-primary bg-primary/5'
                  : ''
              }`}
              onClick={() => selectPreset(preset)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-water flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{preset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {preset.schedule.length} lembretes ao longo do dia
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {(preset.total / 1000).toFixed(1)}L
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom toggle */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setCustomMode(!customMode)}
      >
        {customMode ? 'Esconder personalização' : 'Personalizar horários'}
      </Button>

      {/* Custom schedule */}
      {(customMode || data.hydrationSchedule.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Seus Horários</h3>
              <Badge className="gradient-water text-white">
                Total: {(currentTotal / 1000).toFixed(1)}L
              </Badge>
            </div>

            {/* Existing entries */}
            <div className="space-y-2 mb-4">
              {data.hydrationSchedule.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{entry.time}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-muted-foreground">{entry.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{entry.amount}ml</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeEntry(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new entry */}
            {customMode && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Horário</label>
                  <Input
                    type="time"
                    value={newEntry.time}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Quantidade (ml)</label>
                  <Input
                    type="number"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    step="50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Nome</label>
                  <Input
                    value={newEntry.label}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Ex: Café da manhã"
                  />
                </div>
                <Button onClick={addCustomEntry} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
