import { useState } from 'react';
import { ListTodo, Plus, Trash2, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DailyActivity } from '@/hooks/useDailyActivities';
import { toast } from 'sonner';

interface ActivitiesCardProps {
  activities: DailyActivity[];
  onAdd: (title: string, repeatDaily: boolean) => Promise<{ error: Error | null } | undefined>;
  onToggle: (id: string) => void;
  onDelete: (id: string, deleteAllRepeating: boolean) => void;
  onUpdateRepeat: (id: string, repeatDaily: boolean) => void;
}

export function ActivitiesCard({ activities, onAdd, onToggle, onDelete, onUpdateRepeat }: ActivitiesCardProps) {
  const [newActivity, setNewActivity] = useState('');
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<DailyActivity | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.trim()) { toast.error('Digite uma atividade'); return; }
    const result = await onAdd(newActivity.trim(), repeatDaily);
    if (!result?.error) {
      toast.success(repeatDaily ? 'Meta adicionada (repete diariamente)' : 'Meta adicionada');
      setNewActivity(''); setRepeatDaily(false);
    }
  };

  const handleDeleteClick = (activity: DailyActivity) => {
    if (activity.repeat_daily) { setActivityToDelete(activity); setDeleteDialogOpen(true); }
    else { onDelete(activity.id, false); toast.success('Meta removida'); }
  };

  const handleConfirmDelete = (deleteAll: boolean) => {
    if (activityToDelete) { onDelete(activityToDelete.id, deleteAll); toast.success(deleteAll ? 'Meta removida de todos os dias' : 'Meta removida apenas deste dia'); }
    setDeleteDialogOpen(false); setActivityToDelete(null);
  };

  const completedCount = activities.filter(a => a.completed).length;

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="gradient-activities p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Metas do Dia</h3>
            <p className="text-white/60 text-xs">{completedCount} de {activities.length} concluídas</p>
          </div>
          {activities.length > 0 && (
            <div className="w-14 h-2 bg-white/15 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${activities.length > 0 ? (completedCount / activities.length) * 100 : 0}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-card p-4 space-y-3">
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="flex gap-2">
            <Input placeholder="Nova atividade..." value={newActivity} onChange={(e) => setNewActivity(e.target.value)}
              className="bg-muted/30 border-border rounded-xl text-sm" />
            <Button type="submit" size="icon" className="rounded-xl gradient-hub text-white border-0 shadow-md shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="repeat" checked={repeatDaily} onCheckedChange={setRepeatDaily} className="data-[state=checked]:bg-primary scale-90" />
            <Label htmlFor="repeat" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
              <Repeat className="w-3 h-3" /> Repetir diariamente
            </Label>
          </div>
        </form>

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-6">
              <ListTodo className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">Nenhuma meta adicionada</p>
              <p className="text-[10px] text-muted-foreground/60">Adicione suas metas pessoais acima</p>
            </div>
          ) : (
            activities.map((activity) => (
              <motion.div key={activity.id} layout
                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                  activity.completed ? 'bg-primary/5 border-primary/10' : 'bg-muted/20 border-border/30'
                }`}
              >
                <Checkbox checked={activity.completed} onCheckedChange={() => onToggle(activity.id)}
                  className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <span className={`flex-1 text-sm ${activity.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                  {activity.title}
                </span>
                {activity.repeat_daily && <Repeat className="w-3 h-3 text-muted-foreground/50" />}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-primary rounded-lg" onClick={() => onUpdateRepeat(activity.id, !activity.repeat_daily)}>
                  <Repeat className={`w-3 h-3 ${activity.repeat_daily ? 'text-primary' : ''}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-destructive rounded-lg" onClick={() => handleDeleteClick(activity)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover atividade recorrente</AlertDialogTitle>
            <AlertDialogDescription>Esta atividade está configurada para repetir diariamente. Como deseja removê-la?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmDelete(false)} className="bg-slate-600 hover:bg-slate-700">Apenas este dia</AlertDialogAction>
            <AlertDialogAction onClick={() => handleConfirmDelete(true)} className="bg-destructive hover:bg-destructive/90">Todos os dias</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
