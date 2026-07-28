import { useState } from 'react';
import { Dumbbell, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OnboardingData } from '../OnboardingWizard';

interface StepWorkoutsProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const daysOfWeek = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const workoutTypes = [
  { value: 'gym', label: 'Academia', icon: '🏋️', duration: '1h' },
  { value: 'running', label: 'Corrida', icon: '🏃', duration: '45min' },
  { value: 'swimming', label: 'Natação', icon: '🏊', duration: '1h' },
  { value: 'volleyball', label: 'Vôlei', icon: '🏐', duration: '1h30' },
  { value: 'cycling', label: 'Ciclismo', icon: '🚴', duration: '1h' },
  { value: 'yoga', label: 'Yoga', icon: '🧘', duration: '45min' },
  { value: 'crossfit', label: 'CrossFit', icon: '💪', duration: '1h' },
  { value: 'hiking', label: 'Caminhada', icon: '🚶', duration: '1h' },
  { value: 'dance', label: 'Dança', icon: '💃', duration: '1h' },
  { value: 'martial_arts', label: 'Artes Marciais', icon: '🥋', duration: '1h' },
  { value: 'rest', label: 'Descanso Ativo', icon: '🧘‍♂️', duration: '30min' },
  { value: 'other', label: 'Outro', icon: '🎯', duration: '1h' },
];

const presetRoutines = [
  {
    name: 'Academia 3x/semana',
    description: 'Segunda, Quarta e Sexta',
    days: [
      { dayOfWeek: 1, type: 'gym', name: 'Academia - Treino A', duration: '1h' },
      { dayOfWeek: 3, type: 'gym', name: 'Academia - Treino B', duration: '1h' },
      { dayOfWeek: 5, type: 'gym', name: 'Academia - Treino C', duration: '1h' },
    ],
  },
  {
    name: 'Academia + Cardio',
    description: '4 dias de treino',
    days: [
      { dayOfWeek: 1, type: 'gym', name: 'Academia - Superior', duration: '1h' },
      { dayOfWeek: 2, type: 'running', name: 'Corrida Leve', duration: '30min' },
      { dayOfWeek: 4, type: 'gym', name: 'Academia - Inferior', duration: '1h' },
      { dayOfWeek: 5, type: 'running', name: 'Corrida Intervalada', duration: '30min' },
    ],
  },
  {
    name: 'Ativo Todos os Dias',
    description: 'Rotina completa semanal',
    days: [
      { dayOfWeek: 0, type: 'rest', name: 'Descanso Ativo', duration: '30min' },
      { dayOfWeek: 1, type: 'gym', name: 'Academia - Peito/Tríceps', duration: '1h' },
      { dayOfWeek: 2, type: 'gym', name: 'Academia - Costas/Bíceps', duration: '1h' },
      { dayOfWeek: 3, type: 'swimming', name: 'Natação', duration: '1h' },
      { dayOfWeek: 4, type: 'gym', name: 'Academia - Pernas', duration: '1h' },
      { dayOfWeek: 5, type: 'volleyball', name: 'Vôlei', duration: '1h30' },
      { dayOfWeek: 6, type: 'running', name: 'Corrida 4km', duration: '30min' },
    ],
  },
];

export default function StepWorkouts({ data, updateData }: StepWorkoutsProps) {
  const [selectedDays, setSelectedDays] = useState<Set<number>>(
    new Set(data.workoutDays.map(w => w.dayOfWeek))
  );

  const selectPreset = (preset: typeof presetRoutines[0]) => {
    setSelectedDays(new Set(preset.days.map(d => d.dayOfWeek)));
    updateData({ workoutDays: preset.days });
  };

  const toggleDay = (dayValue: number) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayValue)) {
      newSelected.delete(dayValue);
      updateData({
        workoutDays: data.workoutDays.filter(w => w.dayOfWeek !== dayValue),
      });
    } else {
      newSelected.add(dayValue);
      const defaultWorkout = {
        dayOfWeek: dayValue,
        type: 'gym',
        name: 'Treino',
        duration: '1h',
      };
      updateData({
        workoutDays: [...data.workoutDays, defaultWorkout].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek
        ),
      });
    }
    setSelectedDays(newSelected);
  };

  const updateWorkoutDay = (
    dayOfWeek: number,
    updates: Partial<OnboardingData['workoutDays'][0]>
  ) => {
    const updated = data.workoutDays.map(w =>
      w.dayOfWeek === dayOfWeek ? { ...w, ...updates } : w
    );
    updateData({ workoutDays: updated });
  };

  const getWorkoutForDay = (dayValue: number) => {
    return data.workoutDays.find(w => w.dayOfWeek === dayValue);
  };

  return (
    <div className="space-y-6">
      {/* Info card */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                💪 Dica de Treino
              </p>
              <p className="text-muted-foreground">
                Para perda de peso, recomendamos combinar <strong>musculação</strong> (para 
                manter a massa muscular) com <strong>exercícios aeróbicos</strong> (para queimar 
                calorias). 3-5 dias por semana é o ideal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Escolha uma rotina pronta</h3>
        <div className="grid gap-3">
          {presetRoutines.map((preset) => (
            <Card
              key={preset.name}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                JSON.stringify(data.workoutDays) === JSON.stringify(preset.days)
                  ? 'border-primary bg-primary/5'
                  : ''
              }`}
              onClick={() => selectPreset(preset)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{preset.name}</p>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{preset.days.length}x</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom day selection */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-4">
            Ou personalize seus dias de treino
          </h3>
          
          {/* Day toggles */}
          <div className="flex justify-between mb-6">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  selectedDays.has(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>

          {/* Selected days details */}
          {data.workoutDays.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Detalhes de cada dia
              </h4>
              {daysOfWeek
                .filter(day => selectedDays.has(day.value))
                .map((day) => {
                  const workout = getWorkoutForDay(day.value);
                  const workoutType = workoutTypes.find(t => t.value === workout?.type);
                  
                  return (
                    <div
                      key={day.value}
                      className="p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{day.label}</span>
                        <span className="text-2xl">{workoutType?.icon || '🎯'}</span>
                      </div>
                      <Select
                        value={workout?.type || 'gym'}
                        onValueChange={(value) => {
                          const type = workoutTypes.find(t => t.value === value);
                          updateWorkoutDay(day.value, {
                            type: value,
                            name: type?.label || 'Treino',
                            duration: type?.duration || '1h',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {workoutTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                <span>{type.label}</span>
                                <span className="text-muted-foreground text-xs">
                                  ({type.duration})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
            </div>
          )}

          {data.workoutDays.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Selecione os dias da semana que você deseja treinar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {data.workoutDays.length > 0 && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-primary/10 border border-purple-500/20">
          <p className="text-sm text-center">
            Você vai treinar <strong>{data.workoutDays.length}x por semana</strong>
            {data.workoutDays.length >= 3 && data.workoutDays.length <= 5 && (
              <span className="text-green-500 ml-1">✓ Frequência ideal!</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
