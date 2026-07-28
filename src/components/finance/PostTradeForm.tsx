import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PostTradeInput } from '@/hooks/useTradeSessions';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (input: PostTradeInput) => void;
  savedBanks?: string[];
}

const PLAN_OPTIONS = ['Sim', 'Parcial', 'Não'];

export function PostTradeForm({ open, onOpenChange, onSubmit, savedBanks = [] }: Props) {
  const [result, setResult] = useState('');
  const [pctResult, setPctResult] = useState('');
  const [numOps, setNumOps] = useState('');
  const [winRate, setWinRate] = useState('');
  const [bigGain, setBigGain] = useState('');
  const [bigLoss, setBigLoss] = useState('');
  const [respectedRisk, setRespectedRisk] = useState(true);
  const [respectedPlan, setRespectedPlan] = useState('Sim');
  const [brokenRules, setBrokenRules] = useState('');
  const [observations, setObservations] = useState('');
  const [bankName, setBankName] = useState('');

  const handleSubmit = () => {
    onSubmit({
      financial_result: Number(result),
      percentage_result: pctResult ? Number(pctResult) : undefined,
      num_operations: numOps ? Number(numOps) : undefined,
      win_rate: winRate ? Number(winRate) : undefined,
      biggest_gain: bigGain ? Number(bigGain) : undefined,
      biggest_loss: bigLoss ? Number(bigLoss) : undefined,
      respected_daily_risk: respectedRisk,
      respected_plan: respectedPlan,
      broken_rules: brokenRules || undefined,
      observations: observations || undefined,
      bank_name: bankName || undefined,
    });
    setResult(''); setPctResult(''); setNumOps(''); setWinRate('');
    setBigGain(''); setBigLoss(''); setBrokenRules(''); setObservations('');
    setBankName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📤 Pós-Trade</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-b pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">📊 RESULTADO DO DIA</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[10px]">Resultado (R$) *</Label><Input type="number" value={result} onChange={e => setResult(e.target.value)} placeholder="0.00" /></div>
              <div><Label className="text-[10px]">Resultado (%)</Label><Input type="number" value={pctResult} onChange={e => setPctResult(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Nº Operações</Label><Input type="number" value={numOps} onChange={e => setNumOps(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Acerto (%)</Label><Input type="number" value={winRate} onChange={e => setWinRate(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Maior Gain (R$)</Label><Input type="number" value={bigGain} onChange={e => setBigGain(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Maior Loss (R$)</Label><Input type="number" value={bigLoss} onChange={e => setBigLoss(e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          {/* Bank selector */}
          <div className="border-b pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">🏦 CONTA DESTINO</p>
            <div>
              <Label className="text-[10px]">Em qual banco cairá o resultado?</Label>
              {savedBanks.length > 0 ? (
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                  <SelectContent>
                    {savedBanks.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ex: XP, Clear, BTG..." className="text-xs h-9" />
              )}
            </div>
          </div>

          <div className="border-b pb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">📉 GESTÃO E DISCIPLINA</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Respeitou risco diário?</Label>
                <Switch checked={respectedRisk} onCheckedChange={setRespectedRisk} />
              </div>
              <div>
                <Label className="text-xs">Respeitou o plano?</Label>
                <Select value={respectedPlan} onValueChange={setRespectedPlan}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLAN_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-[10px]">Regra quebrada?</Label><Input value={brokenRules} onChange={e => setBrokenRules(e.target.value)} placeholder="Opcional" /></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">🧠 OBSERVAÇÕES</p>
            <Textarea value={observations} onChange={e => setObservations(e.target.value)} placeholder="Erros, acertos, aprendizados..." rows={3} />
          </div>

          <Button onClick={handleSubmit} disabled={!result} className="w-full gradient-finance text-white">
            Finalizar Sessão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
