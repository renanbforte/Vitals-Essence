// ============================================================================
// MetasTab (Aba Metas)
// ----------------------------------------------------------------------------
// Aba de metas financeiras e projeções do módulo Financeiro. Em cima, as metas
// do usuário (com progresso e data estimada de conclusão); embaixo, o
// Simulador de Projeção por juros compostos, com visão mês a mês e o controle
// de aporte mensal para simular cenários.
// ============================================================================
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialGoals, type FinancialGoal } from '@/hooks/useFinancialGoals';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { ProjectionSimulator } from './ProjectionSimulator';

// Animação: cada item surge de baixo para cima com leve efeito de mola.
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } },
};

// Animação: faz os filhos aparecerem em sequência (um após o outro).
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

interface MetasTabProps {
  // Patrimônio investido total (da carteira) — alimenta metas vinculadas e o simulador.
  totalInvested: number;
}

export function MetasTab({ totalInvested }: MetasTabProps) {
  // Metas do usuário e as ações de criar/editar/concluir/excluir.
  const { goals, loading, addGoal, updateGoal, toggleCompleted, deleteGoal } = useFinancialGoals();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Abre o formulário em modo edição com a meta escolhida.
  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  // Enquanto carrega, mostra "esqueletos" cinzas no lugar do conteúdo.
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Cabeçalho da seção de metas + botão de criar */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold">Metas financeiras</h3>
          <p className="text-[11px] text-muted-foreground">Defina o alvo e acompanhe quando você chega lá.</p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditingGoal(null); setFormOpen(true); }}
          className="rounded-xl gap-1.5 gradient-finance text-white font-bold h-9"
        >
          <Plus className="w-4 h-4" />
          Nova meta
        </Button>
      </motion.div>

      {/* Lista de metas — ou um convite para criar a primeira */}
      {goals.length === 0 ? (
        <motion.div variants={fadeUp}>
          <Card className="border-dashed border-2 border-[hsl(var(--finance))]/20 bg-[hsl(var(--finance-light))]">
            <CardContent className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl gradient-finance flex items-center justify-center shadow-md mx-auto">
                <Target className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-semibold">Nenhuma meta ainda</p>
              <p className="text-xs text-muted-foreground">
                Crie sua primeira meta — reserva de emergência, viagem, entrada do imóvel — e veja a data estimada de conclusão.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        goals.map(goal => (
          <motion.div key={goal.id} variants={fadeUp}>
            <GoalCard
              goal={goal}
              portfolioTotal={totalInvested}
              onEdit={handleEdit}
              onDelete={deleteGoal}
              onToggleCompleted={toggleCompleted}
            />
          </motion.div>
        ))
      )}

      {/* Simulador de projeção por juros compostos (visão mês a mês + aporte) */}
      <motion.div variants={fadeUp}>
        <ProjectionSimulator defaultPrincipal={totalInvested} />
      </motion.div>

      {/* Formulário (janela) para criar ou editar uma meta */}
      <GoalForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingGoal(null); }}
        onSubmit={addGoal}
        editGoal={editingGoal}
        onUpdate={updateGoal}
      />
    </motion.div>
  );
}
