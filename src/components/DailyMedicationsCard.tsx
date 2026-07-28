import { useState, useEffect } from 'react';
import { Pill, Plus, Edit2, Trash2, Clock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useUserMedications, type Medication, type MedicationInput } from '@/hooks/useUserMedications';
import { useMedicationIntake } from '@/hooks/useMedicationIntake';

interface DailyMedicationsCardProps {
  selectedDate: Date;
}

const DAYS_OF_WEEK = [
  { key: 0, label: 'D', fullLabel: 'Domingo' },
  { key: 1, label: 'S', fullLabel: 'Segunda' },
  { key: 2, label: 'T', fullLabel: 'Terça' },
  { key: 3, label: 'Q', fullLabel: 'Quarta' },
  { key: 4, label: 'Q', fullLabel: 'Quinta' },
  { key: 5, label: 'S', fullLabel: 'Sexta' },
  { key: 6, label: 'S', fullLabel: 'Sábado' },
];

export function DailyMedicationsCard({ 
  selectedDate,
}: DailyMedicationsCardProps) {
  const { medications, loading, fetchMedications, addMedication, updateMedication, deleteMedication } = useUserMedications();
  const { toggleIntake, isCompleted, loading: intakeLoading } = useMedicationIntake(selectedDate);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [expandedMedication, setExpandedMedication] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [compositionItems, setCompositionItems] = useState<{ name: string; dose: string }[]>([]);
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(['']);
  const [notes, setNotes] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const resetForm = () => {
    setName('');
    setDosage('');
    setCompositionItems([]);
    setScheduleTimes(['']);
    setNotes('');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setEditingMedication(null);
  };

  // Parse composition string to items
  const parseComposition = (comp: string | null): { name: string; dose: string }[] => {
    if (!comp) return [];
    try {
      const parsed = JSON.parse(comp);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // If not JSON, try to parse as text lines
      const lines = comp.split('\n').filter(l => l.trim());
      return lines.map(line => {
        const match = line.match(/^(.+?)\s*[-–]\s*(.+)$/);
        if (match) {
          return { name: match[1].trim(), dose: match[2].trim() };
        }
        return { name: line.trim(), dose: '' };
      });
    }
    return [];
  };

  // Convert items to JSON string for storage
  const compositionToString = (items: { name: string; dose: string }[]): string => {
    const validItems = items.filter(i => i.name.trim());
    if (validItems.length === 0) return '';
    return JSON.stringify(validItems);
  };

  const openEditDialog = (medication: Medication) => {
    setEditingMedication(medication);
    setName(medication.name);
    setDosage(medication.dosage || '');
    setCompositionItems(parseComposition(medication.composition));
    setScheduleTimes(medication.schedule_times.length > 0 ? medication.schedule_times : ['']);
    setNotes(medication.notes || '');
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome do medicamento é obrigatório');
      return;
    }

    const validTimes = scheduleTimes.filter(t => t.trim());
    const compositionString = compositionToString(compositionItems);
    
    const input: MedicationInput = {
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      composition: compositionString || undefined,
      schedule_times: validTimes,
      notes: notes.trim() || undefined,
      active: true,
    };

    if (editingMedication) {
      const { error } = await updateMedication(editingMedication.id, input);
      if (error) {
        toast.error('Erro ao atualizar medicamento');
      } else {
        toast.success('Medicamento atualizado!');
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await addMedication(input);
      if (error) {
        toast.error('Erro ao adicionar medicamento');
      } else {
        toast.success('Medicamento adicionado!');
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteMedication(id);
    if (error) {
      toast.error('Erro ao remover medicamento');
    } else {
      toast.success('Medicamento removido');
    }
  };

  const addTimeSlot = () => {
    setScheduleTimes([...scheduleTimes, '']);
  };

  const removeTimeSlot = (index: number) => {
    if (scheduleTimes.length > 1) {
      setScheduleTimes(scheduleTimes.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, value: string) => {
    const newTimes = [...scheduleTimes];
    newTimes[index] = value;
    setScheduleTimes(newTimes);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const addCompositionItem = () => {
    setCompositionItems([...compositionItems, { name: '', dose: '' }]);
  };

  const removeCompositionItem = (index: number) => {
    setCompositionItems(compositionItems.filter((_, i) => i !== index));
  };

  const updateCompositionItem = (index: number, field: 'name' | 'dose', value: string) => {
    const newItems = [...compositionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setCompositionItems(newItems);
  };

  const isToday = format(new Date(), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  const isFuture = selectedDate > new Date();

  const activeMedications = medications.filter(m => m.active);

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="gradient-medications p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Medicamentos</h3>
              <p className="text-white/70 text-xs">
                {isToday ? 'Hoje' : format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="icon" className="bg-white/20 hover:bg-white/30 text-white border-0 h-9 w-9 rounded-xl">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingMedication ? 'Editar Medicamento' : 'Novo Medicamento'}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome *</label>
                  <Input placeholder="Ex: Vitamina D" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Dosagem</label>
                  <Input placeholder="Ex: 1000 UI" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Horários</label>
                  <div className="space-y-2">
                    {scheduleTimes.map((time, index) => (
                      <div key={index} className="flex gap-2">
                        <Input type="time" value={time} onChange={(e) => updateTimeSlot(index, e.target.value)} className="flex-1" />
                        {scheduleTimes.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeTimeSlot(index)}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addTimeSlot} className="w-full">
                      <Plus className="w-4 h-4 mr-1" />Adicionar horário
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Dias da Semana</label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((day) => (
                      <button key={day.key} type="button" onClick={() => toggleDay(day.key)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                          selectedDays.includes(day.key) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`} title={day.fullLabel}>{day.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Composição (ingredientes)</label>
                  <div className="space-y-2">
                    {compositionItems.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input placeholder="Nome (ex: Bupropiona)" value={item.name} onChange={(e) => updateCompositionItem(index, 'name', e.target.value)} className="flex-1" />
                        <Input placeholder="Dose (ex: 150mg)" value={item.dose} onChange={(e) => updateCompositionItem(index, 'dose', e.target.value)} className="w-28" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCompositionItem(index)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addCompositionItem} className="w-full">
                      <Plus className="w-4 h-4 mr-1" />Adicionar ingrediente
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Observações</label>
                  <Textarea placeholder="Observações adicionais..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
                <Button onClick={handleSubmit} className="w-full">{editingMedication ? 'Salvar Alterações' : 'Adicionar Medicamento'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Body */}
      <div className="bg-card p-4">
        {isFuture ? (
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm">Visualização de datas futuras</p>
          </div>
        ) : loading || intakeLoading ? (
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        ) : activeMedications.length === 0 ? (
          <div className="text-center py-6">
            <Pill className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Nenhum medicamento cadastrado</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Clique em + para cadastrar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeMedications.map((medication) => (
              <MedicationItem
                key={medication.id}
                medication={medication}
                expanded={expandedMedication === medication.id}
                onToggleExpand={() => setExpandedMedication(expandedMedication === medication.id ? null : medication.id)}
                onEdit={() => openEditDialog(medication)}
                onDelete={() => handleDelete(medication.id)}
                onToggleIntake={toggleIntake}
                isCompleted={isCompleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MedicationItemProps {
  medication: Medication;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleIntake: (medicationId: string, scheduleTime: string) => Promise<{ error: Error | null }>;
  isCompleted: (medicationId: string, scheduleTime: string) => boolean;
}

function MedicationItem({ medication, expanded, onToggleExpand, onEdit, onDelete, onToggleIntake, isCompleted }: MedicationItemProps) {
  const compositionItems = (() => {
    if (!medication.composition) return [];
    try {
      const parsed = JSON.parse(medication.composition);
      if (Array.isArray(parsed)) return parsed as { name: string; dose: string }[];
    } catch { return null; }
    return [];
  })();

  const scheduleTimes = medication.schedule_times || [];
  const hasSchedules = scheduleTimes.length > 0;
  const allCompleted = hasSchedules && scheduleTimes.every(time => isCompleted(medication.id, time));
  const someCompleted = hasSchedules && scheduleTimes.some(time => isCompleted(medication.id, time));

  const handleToggleTime = async (time: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await onToggleIntake(medication.id, time);
    if (error) toast.error('Erro ao atualizar');
  };

  return (
    <Collapsible open={expanded} onOpenChange={onToggleExpand}>
      <div className="rounded-2xl border border-border/50 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full p-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left bg-muted/10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              allCompleted ? 'bg-primary/15 text-primary' : someCompleted ? 'bg-amber-500/15 text-amber-600' : 'bg-primary/10 text-primary'
            }`}>
              {allCompleted ? <Check className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm truncate ${allCompleted ? 'text-muted-foreground' : 'text-foreground'}`}>{medication.name}</span>
                {medication.dosage && (
                  <Badge variant="secondary" className="text-[10px] font-bold">{medication.dosage}</Badge>
                )}
              </div>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        {/* Schedule times as checkable items - always visible */}
        {hasSchedules && (
          <div className="px-3 pb-3 space-y-2">
            {scheduleTimes.map((time, idx) => {
              const completed = isCompleted(medication.id, time);
              return (
                <button
                  key={idx}
                  onClick={(e) => handleToggleTime(time, e)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    completed 
                      ? 'bg-green-500/20 hover:bg-green-500/30' 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Checkbox
                    checked={completed}
                    className="border-white/50 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <Clock className="w-3.5 h-3.5 text-white/60" />
                  <span className={`text-sm font-medium ${completed ? 'line-through text-white/60' : ''}`}>
                    {time}
                  </span>
                  {completed && (
                    <Badge className="ml-auto bg-green-500/30 text-green-200 text-xs">
                      Tomado
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
        
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
            {medication.composition && (
              <div>
                <p className="text-xs text-white/60 mb-2">Composição</p>
                {compositionItems ? (
                  <ul className="space-y-1.5">
                    {compositionItems.map((item, idx) => (
                      <li key={idx} className="flex items-baseline gap-2 text-sm">
                        <span className="text-white/90">{item.name}</span>
                        {item.dose && (
                          <span className="text-white/50 text-xs">({item.dose})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{medication.composition}</p>
                )}
              </div>
            )}
            
            {medication.notes && (
              <div>
                <p className="text-xs text-white/60 mb-1">Observações</p>
                <p className="text-sm text-white/90">{medication.notes}</p>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-red-500/20 hover:bg-red-500/30 text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover medicamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação não pode ser desfeita. O medicamento "{medication.name}" será removido permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Remover</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
