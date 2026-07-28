// ============================================================================
// CARTÃO DE EVOLUÇÃO DE PESO
// Mostra um cartão onde o usuário registra seu peso atual e acompanha a
// evolução em um gráfico de linha ao longo do tempo. Também lista o histórico
// recente dos últimos registros e exibe a meta de peso definida.
// ============================================================================

import { useState } from 'react';
import { TrendingDown, Plus, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { WeightEntry } from '@/hooks/useWeightHistory';
import { toast } from 'sonner';

interface WeightCardProps {
  weights: WeightEntry[];
  onAddWeight: (weight: number) => Promise<{ error: Error | null }>;
  targetWeight?: number;
}

export function WeightCard({ weights, onAddWeight, targetWeight = 80 }: WeightCardProps) {
  // Guarda o valor de peso que o usuário está digitando no campo
  const [newWeight, setNewWeight] = useState('');
  // Indica se está salvando (para desabilitar o botão enquanto grava)
  const [loading, setLoading] = useState(false);

  // Valida e registra o novo peso quando o formulário é enviado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 30 || weight > 300) {
      toast.error('Peso deve estar entre 30kg e 300kg');
      return;
    }

    setLoading(true);
    const { error } = await onAddWeight(weight);
    setLoading(false);

    if (error) {
      toast.error('Erro ao registrar peso');
    } else {
      toast.success('Peso registrado com sucesso!');
      setNewWeight('');
    }
  };

  // Prepara os dados dos registros de peso no formato que o gráfico entende
  // (data curta dd/MM + valor do peso)
  const chartData = weights.map((w) => ({
    date: format(parseISO(w.date), 'dd/MM', { locale: ptBR }),
    peso: Number(w.weight_kg),
  }));

  return (
    <div className="gradient-weight rounded-2xl p-6 text-white shadow-xl animate-fade-in">
      {/* Cabeçalho: ícone, título e a meta de peso do usuário */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Evolução de Peso</h3>
            <p className="text-white/80 text-sm">Meta: {targetWeight}kg</p>
          </div>
        </div>
      </div>

      {/* Formulário para digitar e registrar um novo peso */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <Input
          type="number"
          step="0.1"
          min="30"
          max="300"
          placeholder="Ex: 85.5"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          className="bg-white/20 border-white/30 text-white placeholder:text-white/50 focus:border-white"
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar
        </Button>
      </form>

      {/* Se já houver pesos registrados, mostra o gráfico de linha da evolução; */}
      {/* caso contrário, mostra uma mensagem convidando a registrar o primeiro peso */}
      {chartData.length > 0 ? (
        <div className="h-48 bg-white/10 rounded-xl p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
                tickLine={false}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#333',
                }}
                formatter={(value: number) => [`${value}kg`, 'Peso']}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="#fff"
                strokeWidth={3}
                dot={{ fill: '#fff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 bg-white/10 rounded-xl flex items-center justify-center">
          <div className="text-center text-white/70">
            <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum peso registrado ainda</p>
            <p className="text-sm">Registre seu primeiro peso acima</p>
          </div>
        </div>
      )}

      {/* Lista dos 5 registros de peso mais recentes (do mais novo para o mais antigo) */}
      {weights.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-white/70 mb-2">Histórico Recente</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {[...weights].reverse().slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <span>{format(parseISO(entry.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                <span className="font-semibold">{entry.weight_kg}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
