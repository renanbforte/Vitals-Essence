// ============================================================================
// PreTradeForm — Formulário de "Pré-Trade" (planejamento antes de operar)
// Abre uma janela (modal) onde o usuário planeja o dia ANTES de começar:
// mercado, gestão de capital/risco, plano do dia e estado emocional.
// Ao iniciar, envia os dados para quem chamou o componente (onSubmit).
// ============================================================================
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import type { PreTradeInput } from '@/hooks/useTradeSessions';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (input: PreTradeInput) => void;
}

// Listas fixas de opções usadas nos menus suspensos do formulário
const MARKETS = ['WIN', 'WDO', 'Ações', 'Opções', 'Outro'];
const EMOTIONS = ['Calmo', 'Neutro', 'Tenso', 'Ansioso', 'Confiante'];
const SLEEP = ['Ótima', 'Boa', 'Regular', 'Ruim'];
const ENERGY = ['Alta', 'Média', 'Baixa'];

export function PreTradeForm({ open, onOpenChange, onSubmit }: Props) {
  // Estados: cada linha guarda o valor de um campo do formulário enquanto o usuário preenche
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [market, setMarket] = useState('');
  const [allocatedCapital, setAllocatedCapital] = useState('');
  const [maxDailyRisk, setMaxDailyRisk] = useState('');
  const [riskPerOp, setRiskPerOp] = useState('');
  const [scenario, setScenario] = useState('');
  const [setups, setSetups] = useState('');
  const [allowedHours, setAllowedHours] = useState('');
  const [emotion, setEmotion] = useState('');
  const [sleep, setSleep] = useState('');
  const [energy, setEnergy] = useState('');

  // Só permite iniciar a sessão se os três valores de gestão de capital forem maiores que zero
  const canSubmit = Number(allocatedCapital) > 0 && Number(maxDailyRisk) > 0 && Number(riskPerOp) > 0;

  // Ao clicar em "Iniciar Sessão": envia o plano preenchido e depois limpa os campos
  const handleSubmit = () => {
    onSubmit({
      date,
      start_time: startTime,
      market: market || undefined,
      allocated_capital: Number(allocatedCapital),
      max_daily_risk: Number(maxDailyRisk),
      risk_per_operation: Number(riskPerOp),
      expected_scenario: scenario || undefined,
      allowed_setups: setups || undefined,
      allowed_hours: allowedHours || undefined,
      emotional_state: emotion || undefined,
      sleep_quality: sleep || undefined,
      energy_level: energy || undefined,
    });
    // Reset
    setAllocatedCapital(''); setMaxDailyRisk(''); setRiskPerOp('');
    setScenario(''); setSetups(''); setAllowedHours('');
    setEmotion(''); setSleep(''); setEnergy('');
  };

  // Tela do formulário (janela modal com as seções de planejamento)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📥 Pré-Trade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Data e hora de início da sessão */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label className="text-xs">Hora Início</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
          </div>

          {/* Escolha do mercado que será operado */}
          <div>
            <Label className="text-xs">Mercado</Label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{MARKETS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Gestão de capital: quanto vai usar e o limite de risco (campos obrigatórios) */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">💰 GESTÃO DE CAPITAL</p>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-[10px]">Capital (R$) *</Label><Input type="number" value={allocatedCapital} onChange={e => setAllocatedCapital(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Risco dia (R$) *</Label><Input type="number" value={maxDailyRisk} onChange={e => setMaxDailyRisk(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Risco/op (R$) *</Label><Input type="number" value={riskPerOp} onChange={e => setRiskPerOp(e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          {/* Plano do dia: cenário esperado, setups e horários permitidos para operar */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">🧠 PLANO DO DIA</p>
            <div className="space-y-2">
              <div><Label className="text-[10px]">Cenário esperado</Label><Input value={scenario} onChange={e => setScenario(e.target.value)} placeholder="Tendência, lateral..." /></div>
              <div><Label className="text-[10px]">Setups permitidos</Label><Input value={setups} onChange={e => setSetups(e.target.value)} placeholder="Ex: rompimento, pullback" /></div>
              <div><Label className="text-[10px]">Horários permitidos</Label><Input value={allowedHours} onChange={e => setAllowedHours(e.target.value)} placeholder="09:00 - 12:00" /></div>
            </div>
          </div>

          {/* Estado do trader: como está o emocional, o sono e a energia antes de operar */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">🧭 ESTADO DO TRADER</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px]">Emocional</Label>
                <Select value={emotion} onValueChange={setEmotion}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Sono</Label>
                <Select value={sleep} onValueChange={setSleep}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{SLEEP.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px]">Energia</Label>
                <Select value={energy} onValueChange={setEnergy}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{ENERGY.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Botão de envio: só fica ativo quando a gestão de capital está preenchida corretamente */}
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gradient-finance text-white">
            Iniciar Sessão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
