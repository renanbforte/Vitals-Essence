import { useState, useEffect } from 'react';
import { Pencil, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { UserWorkoutPlan } from '@/hooks/useUserWorkoutPlans';
import { toast } from 'sonner';

interface EditWorkoutDialogProps {
  workout: UserWorkoutPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (workout: UserWorkoutPlan) => Promise<{ error: Error | null }>;
  onDelete?: (workoutId: string) => Promise<{ error: Error | null }>;
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const workoutTypes = [
  { value: 'swimming', label: 'Natação' },
  { value: 'gym_upper', label: 'Musculação - Superiores' },
  { value: 'gym_lower', label: 'Musculação - Inferiores' },
  { value: 'gym_full', label: 'Musculação - Full Body' },
  { value: 'volleyball', label: 'Vôlei' },
  { value: 'running', label: 'Corrida' },
  { value: 'cycling', label: 'Ciclismo' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'functional', label: 'Funcional' },
  { value: 'dance', label: 'Dança' },
  { value: 'martial_arts', label: 'Artes Marciais' },
  { value: 'rest', label: 'Descanso' },
  { value: 'other', label: 'Outro' },
];

const durationOptions = [
  '15 min',
  '20 min',
  '30 min',
  '45 min',
  '60 min',
  '75 min',
  '90 min',
  '120 min',
  'Variável',
];

export function EditWorkoutDialog({ workout, open, onOpenChange, onSave, onDelete }: EditWorkoutDialogProps) {
  const [editedWorkout, setEditedWorkout] = useState<UserWorkoutPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [customDuration, setCustomDuration] = useState(false);

  useEffect(() => {
    if (workout && open) {
      setEditedWorkout({ ...workout });
      // Check if duration is custom (not in predefined options)
      const isCustom = workout.duration && !durationOptions.includes(workout.duration);
      setCustomDuration(isCustom);
    }
  }, [workout, open]);

  const handleSave = async () => {
    if (!editedWorkout) return;
    
    setSaving(true);
    const { error } = await onSave(editedWorkout);
    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar treino');
    } else {
      toast.success('Treino salvo com sucesso!');
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!editedWorkout?.id || !onDelete) return;
    
    setSaving(true);
    const { error } = await onDelete(editedWorkout.id);
    setSaving(false);

    if (error) {
      toast.error('Erro ao remover atividade');
    } else {
      toast.success('Atividade removida!');
      onOpenChange(false);
    }
  };

  const addDetail = () => {
    if (!editedWorkout) return;
    setEditedWorkout({
      ...editedWorkout,
      details: [...editedWorkout.details, '']
    });
  };

  const updateDetail = (index: number, value: string) => {
    if (!editedWorkout) return;
    const newDetails = [...editedWorkout.details];
    newDetails[index] = value;
    setEditedWorkout({ ...editedWorkout, details: newDetails });
  };

  const removeDetail = (index: number) => {
    if (!editedWorkout) return;
    const newDetails = editedWorkout.details.filter((_, i) => i !== index);
    setEditedWorkout({ ...editedWorkout, details: newDetails });
  };

  if (!editedWorkout) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar Atividade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Workout Type */}
          <div>
            <Label>Tipo de Atividade</Label>
            <Select
              value={editedWorkout.workout_type}
              onValueChange={(value) => {
                const typeLabel = workoutTypes.find(t => t.value === value)?.label || value;
                setEditedWorkout({ 
                  ...editedWorkout, 
                  workout_type: value,
                  workout_name: typeLabel
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {workoutTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Workout Name */}
          <div>
            <Label>Nome da Atividade</Label>
            <Input
              value={editedWorkout.workout_name}
              onChange={(e) => setEditedWorkout({ ...editedWorkout, workout_name: e.target.value })}
              placeholder="Ex: Vôlei com os amigos"
            />
          </div>

          {/* Weekly Frequency - NEW */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" />
              <Label className="text-base font-medium">Frequência Semanal</Label>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[editedWorkout.weekly_frequency]}
                onValueChange={([value]) => setEditedWorkout({ ...editedWorkout, weekly_frequency: value })}
                min={1}
                max={7}
                step={1}
                className="flex-1"
              />
              <div className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-lg min-w-[60px] text-center">
                {editedWorkout.weekly_frequency}x
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {editedWorkout.weekly_frequency === 1 
                ? '1 vez por semana' 
                : `${editedWorkout.weekly_frequency} vezes por semana`}
            </p>
          </div>

          {/* Duration - IMPROVED */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <Label className="text-base font-medium">Duração</Label>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {durationOptions.map((duration) => (
                <Button
                  key={duration}
                  type="button"
                  variant={editedWorkout.duration === duration && !customDuration ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEditedWorkout({ ...editedWorkout, duration });
                    setCustomDuration(false);
                  }}
                  className="text-xs"
                >
                  {duration}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                placeholder="Duração personalizada (ex: 40-50 min)"
                value={customDuration ? (editedWorkout.duration || '') : ''}
                onChange={(e) => {
                  setCustomDuration(true);
                  setEditedWorkout({ ...editedWorkout, duration: e.target.value });
                }}
                className="flex-1"
              />
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <Label>Dia da Semana Principal</Label>
            <Select
              value={editedWorkout.day_of_week.toString()}
              onValueChange={(value) => setEditedWorkout({ ...editedWorkout, day_of_week: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayNames.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              O dia em que esta atividade aparecerá no card de treino
            </p>
          </div>

          {/* Description */}
          <div>
            <Label>Descrição (opcional)</Label>
            <Input
              value={editedWorkout.description || ''}
              onChange={(e) => setEditedWorkout({ ...editedWorkout, description: e.target.value })}
              placeholder="Ex: Cardiovascular de média intensidade"
            />
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Detalhes / Exercícios</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDetail}
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            
            <div className="space-y-2">
              {editedWorkout.details.map((detail, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="Ex: Supino reto: 4x10"
                    value={detail}
                    onChange={(e) => updateDetail(idx, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDetail(idx)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {editedWorkout.details.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum detalhe adicionado
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            {onDelete && editedWorkout.id && (
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={saving}
                size="sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remover
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
