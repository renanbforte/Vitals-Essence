import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Circle, Clock, Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTasks, calculatePriority, type Task } from '@/hooks/useTasks';

const priorityColors: Record<string, string> = {
  green: 'text-emerald-400',
  yellow: 'text-yellow-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
};

const priorityBg: Record<string, string> = {
  green: 'bg-emerald-400/10',
  yellow: 'bg-yellow-400/10',
  orange: 'bg-orange-400/10',
  red: 'bg-red-400/10',
};

function MiniTask({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const priority = calculatePriority(task);
  return (
    <motion.div
      layout
      className={`flex items-center gap-3 p-2.5 rounded-xl ${priorityBg[priority]} transition-all`}
    >
      <button onClick={() => onComplete(task.id)} className="shrink-0">
        <Circle className={`w-5 h-5 ${priorityColors[priority]} hover:scale-110 transition-transform`} />
      </button>
      <span className="text-sm font-medium text-foreground truncate flex-1">{task.title}</span>
      {task.start_time && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {task.start_time.slice(0, 5)}
        </span>
      )}
    </motion.div>
  );
}

export function TaskHubCard() {
  const navigate = useNavigate();
  const { todayStats, completeTask, loading } = useTasks();

  if (loading) {
    return (
      <div className="rounded-3xl overflow-hidden shadow-xl animate-pulse">
        <div className="gradient-tasks p-5 h-20" />
        <div className="bg-card p-4 h-32" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="gradient-tasks p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">Meu Dia</h3>
            <p className="text-white/60 text-xs">
              {todayStats.total === 0
                ? 'Nenhuma tarefa para hoje'
                : `${todayStats.total} tarefa${todayStats.total > 1 ? 's' : ''} · ${todayStats.critical > 0 ? `${todayStats.critical} urgente${todayStats.critical > 1 ? 's' : ''}` : 'tudo tranquilo'}`
              }
            </p>
          </div>
          {todayStats.critical > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-400/20">
              <Flame className="w-3.5 h-3.5 text-red-300" />
              <span className="text-xs font-bold text-red-200">{todayStats.critical}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-card p-4 space-y-2">
        {todayStats.topTasks.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400/40" />
            <p className="text-xs text-muted-foreground">Dia livre — aproveite!</p>
          </div>
        ) : (
          todayStats.topTasks.map(task => (
            <MiniTask key={task.id} task={task} onComplete={completeTask} />
          ))
        )}

        <button
          onClick={() => navigate('/tarefas')}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 pt-2 transition-colors"
        >
          Ver todas as tarefas
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
