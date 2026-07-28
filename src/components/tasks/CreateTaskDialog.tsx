import { useState } from 'react';
import { Plus, MapPin, Link as LinkIcon, Clock, Zap, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Task } from '@/hooks/useTasks';
import { format } from 'date-fns';

const LIFE_AREAS = [
  { value: 'vida_pessoal', label: '🌱 Vida Pessoal' },
  { value: 'trabalho', label: '💼 Trabalho' },
  { value: 'saude', label: '💪 Saúde' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'casa', label: '🏠 Casa' },
  { value: 'relacionamentos', label: '❤️ Relacionamentos' },
  { value: 'lazer', label: '🎉 Lazer' },
];

const SUB_AREAS = [
  { value: 'saude_mental', label: '🧠 Saúde Mental' },
  { value: 'saude_fisica', label: '💪 Saúde Física' },
  { value: 'casa', label: '🏠 Casa' },
  { value: 'relacionamentos', label: '❤️ Relacionamentos' },
  { value: 'desenvolvimento', label: '🎯 Desenvolvimento' },
  { value: 'lazer', label: '🎉 Lazer' },
  { value: 'autocuidado', label: '🧘 Autocuidado' },
];

const ENERGY_LEVELS = [
  { value: 'baixa', label: '🔋 Baixa' },
  { value: 'media', label: '🔋🔋 Média' },
  { value: 'alta', label: '🔋🔋🔋 Alta' },
];

interface CreateTaskDialogProps {
  onAdd: (task: Partial<Task>) => Promise<{ error: Error | null }>;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({ onAdd, trigger }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'pontual' | 'recorrente'>('pontual');
  const [lifeArea, setLifeArea] = useState('vida_pessoal');
  const [subArea, setSubArea] = useState<string>('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [flexibility, setFlexibility] = useState<'flexivel' | 'fixa'>('flexivel');
  const [duration, setDuration] = useState('');
  const [energy, setEnergy] = useState<'baixa' | 'media' | 'alta'>('media');
  const [canSkip, setCanSkip] = useState(false);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [recurrence, setRecurrence] = useState<string>('');
  const [showExtra, setShowExtra] = useState(false);

  const reset = () => {
    setTitle(''); setType('pontual'); setLifeArea('vida_pessoal'); setSubArea('');
    setCategory(''); setStartDate(format(new Date(), 'yyyy-MM-dd')); setStartTime('');
    setEndTime(''); setFlexibility('flexivel'); setDuration(''); setEnergy('media');
    setCanSkip(false); setNotes(''); setLocation(''); setLink(''); setRecurrence('');
    setShowExtra(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Digite um título'); return; }

    const taskData: Partial<Task> = {
      title: title.trim(),
      type,
      life_area: lifeArea,
      sub_area: subArea || null,
      category: category || null,
      start_date: startDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
      flexibility,
      estimated_duration: duration ? parseInt(duration) : null,
      energy_required: energy,
      can_skip: canSkip,
      notes: notes || null,
      location: location || null,
      link: link || null,
      recurrence: recurrence || null,
      status: 'a_fazer',
    };

    const result = await onAdd(taskData);
    if (!result.error) {
      toast.success('Tarefa criada!');
      reset();
      setOpen(false);
    } else {
      toast.error('Erro ao criar tarefa');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl gradient-tasks text-white border-0 shadow-lg gap-2">
            <Plus className="w-4 h-4" /> Nova tarefa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div>
            <Input
              placeholder="O que precisa fazer?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-base font-medium"
              autoFocus
            />
          </div>

          {/* Type + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontual">🎯 Pontual</SelectItem>
                  <SelectItem value="recorrente">🔁 Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Área</Label>
              <Select value={lifeArea} onValueChange={setLifeArea}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sub-area for vida pessoal */}
          {lifeArea === 'vida_pessoal' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Subárea</Label>
              <Select value={subArea} onValueChange={setSubArea}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {SUB_AREAS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date + Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><CalendarIcon className="w-3 h-3" />Data</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />Início</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-9 text-xs" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Fim</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          {/* Recurrence (if recorrente) */}
          {type === 'recorrente' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Repeat className="w-3 h-3" />Recorrência</Label>
              <Select value={recurrence} onValueChange={setRecurrence}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Energy + Flexibility */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Zap className="w-3 h-3" />Energia</Label>
              <Select value={energy} onValueChange={(v: any) => setEnergy(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENERGY_LEVELS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Duração (min)</Label>
              <Input type="number" placeholder="30" value={duration} onChange={e => setDuration(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>

          {/* Flexibility + Can skip */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={flexibility === 'fixa'} onCheckedChange={v => setFlexibility(v ? 'fixa' : 'flexivel')} className="scale-90" />
              <Label className="text-xs text-muted-foreground">Horário fixo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={canSkip} onCheckedChange={setCanSkip} className="scale-90" />
              <Label className="text-xs text-muted-foreground">Pode não ser feita</Label>
            </div>
          </div>

          {/* Extra fields toggle */}
          <button onClick={() => setShowExtra(!showExtra)} className="text-xs text-primary font-medium">
            {showExtra ? 'Menos opções' : 'Mais opções (local, link, notas...)'}
          </button>

          {showExtra && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Categoria</Label>
                <Input placeholder="Ex: reunião, leitura..." value={category} onChange={e => setCategory(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Local</Label>
                <Input placeholder="Onde?" value={location} onChange={e => setLocation(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><LinkIcon className="w-3 h-3" />Link</Label>
                <Input placeholder="URL" value={link} onChange={e => setLink(e.target.value)} className="h-9 text-xs" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Observações</Label>
                <Textarea placeholder="Notas..." value={notes} onChange={e => setNotes(e.target.value)} className="text-xs min-h-[60px]" />
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full gradient-tasks text-white border-0">
            Criar tarefa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
