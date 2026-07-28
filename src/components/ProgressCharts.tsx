// ============================================================================
// Gráficos de Progresso (ProgressCharts)
// Exibe quatro gráficos do acompanhamento diário do usuário: hidratação (água),
// refeições completadas, treinos realizados e evolução do peso. Recebe os dados
// já registrados e os transforma em barras e linhas fáceis de visualizar.
// ============================================================================

import { Droplets, Apple, Dumbbell, Scale } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { WeightEntry } from '@/hooks/useWeightHistory';
import type { DailyTracking } from '@/hooks/useDailyTracking';

interface ProgressChartsProps {
  weights: WeightEntry[];
  trackingHistory: DailyTracking[];
  targetWeight: number;
}

export function ProgressCharts({ weights, trackingHistory, targetWeight }: ProgressChartsProps) {
  // Monta os dados de água: para cada dia, converte mililitros em litros (meta de 3L)
  const waterData = trackingHistory.map(t => ({
    date: format(parseISO(t.date), 'dd/MM', { locale: ptBR }),
    litros: (t.water_ml / 1000).toFixed(1),
    meta: 3,
  }));

  // Monta os dados de refeições: conta quantas das 6 refeições do dia foram concluídas
  const mealsData = trackingHistory.map(t => {
    const completed = [
      t.breakfast_completed,
      t.morning_snack_completed,
      t.lunch_completed,
      t.afternoon_snack_completed,
      t.dinner_completed,
      t.night_snack_completed,
    ].filter(Boolean).length;
    return {
      date: format(parseISO(t.date), 'dd/MM', { locale: ptBR }),
      refeicoes: completed,
    };
  });

  // Monta os dados de treino: 1 quando o treino do dia foi feito, 0 quando não
  const workoutData = trackingHistory.map(t => ({
    date: format(parseISO(t.date), 'dd/MM', { locale: ptBR }),
    feito: t.workout_completed ? 1 : 0,
  }));

  // Monta os dados de peso: converte cada registro em número para o gráfico de linha
  const weightData = weights.map(w => ({
    date: format(parseISO(w.date), 'dd/MM', { locale: ptBR }),
    peso: Number(w.weight_kg),
  }));

  // Classe de estilo reutilizada por todos os cartões de gráfico
  const chartCardClass = "bg-card rounded-2xl p-5 shadow-lg border";

  // Estrutura visual: grade com os quatro cartões de gráfico
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cartão do gráfico de Hidratação (litros de água por dia, meta 3L) */}
      <div className={chartCardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-water flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Hidratação</h3>
            <p className="text-sm text-muted-foreground">Meta: 3L/dia</p>
          </div>
        </div>
        
        {waterData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={[0, 4]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}L`, 'Água']}
                />
                <Bar dataKey="litros" fill="hsl(var(--water))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Sem dados ainda
          </div>
        )}
      </div>

      {/* Cartão do gráfico de Refeições (quantas das 6 refeições foram feitas por dia) */}
      <div className={chartCardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-meals flex items-center justify-center">
            <Apple className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Refeições</h3>
            <p className="text-sm text-muted-foreground">Meta: 6/dia</p>
          </div>
        </div>
        
        {mealsData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={[0, 6]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}/6`, 'Refeições']}
                />
                <Bar dataKey="refeicoes" fill="hsl(var(--meals))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Sem dados ainda
          </div>
        )}
      </div>

      {/* Cartão do gráfico de Treinos (mostra em quais dias o treino foi realizado) */}
      <div className={chartCardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Treinos</h3>
            <p className="text-sm text-muted-foreground">Consistência semanal</p>
          </div>
        </div>
        
        {workoutData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={[0, 1]} ticks={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [value === 1 ? '✓ Feito' : '✗ Não feito', 'Treino']}
                />
                <Bar dataKey="feito" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Sem dados ainda
          </div>
        )}
      </div>

      {/* Cartão do gráfico de Peso (evolução do peso ao longo do tempo, com a meta) */}
      <div className={chartCardClass}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl gradient-weight flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Peso</h3>
            <p className="text-sm text-muted-foreground">Meta: {targetWeight}kg</p>
          </div>
        </div>
        
        {weightData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  fontSize={11} 
                  stroke="hsl(var(--muted-foreground))" 
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}kg`, 'Peso']}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="hsl(var(--weight))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--weight))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Sem dados ainda
          </div>
        )}
      </div>
    </div>
  );
}
