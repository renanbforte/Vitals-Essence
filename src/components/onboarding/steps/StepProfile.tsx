// ============================================================================
// TELA DE PERFIL (Onboarding)
// Este componente é a etapa em que o usuário informa seus dados pessoais:
// nome, data de nascimento, CPF (opcional), peso atual e meta de peso.
// Ele também mostra automaticamente quantos quilos faltam para atingir a meta.
// ============================================================================
import { User, Target, Scale, Cake, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { OnboardingData } from '../OnboardingWizard';

interface StepProfileProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

export default function StepProfile({ data, updateData }: StepProfileProps) {
  // Formata o CPF enquanto o usuário digita, colocando pontos e traço
  // automaticamente (ex.: 000.000.000-00) e limitando a 11 dígitos.
  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  return (
    <div className="space-y-6">
      {/* Campo do nome do usuário */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Seu Nome</h3>
              <p className="text-sm text-muted-foreground">Como devemos te chamar?</p>
            </div>
          </div>
          <Input
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Digite seu nome"
            className="text-lg"
          />
        </CardContent>
      </Card>

      {/* Campo da data de nascimento */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Cake className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Data de Nascimento</h3>
              <p className="text-sm text-muted-foreground">Quando você nasceu?</p>
            </div>
          </div>
          <Input
            type="date"
            value={data.birthDate || ''}
            onChange={(e) => updateData({ birthDate: e.target.value })}
            className="text-lg"
          />
        </CardContent>
      </Card>

      {/* Campo do CPF (opcional), formatado automaticamente ao digitar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">CPF</h3>
              <p className="text-sm text-muted-foreground">Opcional — usado para identificação</p>
            </div>
          </div>
          <Input
            value={data.cpf || ''}
            onChange={(e) => updateData({ cpf: formatCpf(e.target.value) })}
            placeholder="000.000.000-00"
            className="text-lg"
            maxLength={14}
          />
        </CardContent>
      </Card>

      {/* Campo do peso atual do usuário (em kg) */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Peso Atual</h3>
              <p className="text-sm text-muted-foreground">Quanto você pesa hoje?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={data.currentWeight}
              onChange={(e) => updateData({ currentWeight: parseFloat(e.target.value) || 0 })}
              placeholder="80"
              className="text-lg"
              step="0.1"
            />
            <span className="text-muted-foreground font-medium">kg</span>
          </div>
        </CardContent>
      </Card>

      {/* Campo da meta de peso, com o resumo de quanto falta logo abaixo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Meta de Peso</h3>
              <p className="text-sm text-muted-foreground">Qual seu peso ideal?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={data.targetWeight}
              onChange={(e) => updateData({ targetWeight: parseFloat(e.target.value) || 0 })}
              placeholder="75"
              className="text-lg"
              step="0.1"
            />
            <span className="text-muted-foreground font-medium">kg</span>
          </div>
          
          {/* Resumo automático: mostra se o usuário precisa perder, ganhar ou já está no peso ideal */}
          {data.currentWeight > 0 && data.targetWeight > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {data.currentWeight > data.targetWeight ? (
                  <>
                    Você precisa perder{' '}
                    <span className="font-semibold text-primary">
                      {(data.currentWeight - data.targetWeight).toFixed(1)} kg
                    </span>
                  </>
                ) : data.currentWeight < data.targetWeight ? (
                  <>
                    Você quer ganhar{' '}
                    <span className="font-semibold text-green-500">
                      {(data.targetWeight - data.currentWeight).toFixed(1)} kg
                    </span>
                  </>
                ) : (
                  <span className="text-green-500 font-semibold">
                    Você já está no peso ideal! 🎉
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
