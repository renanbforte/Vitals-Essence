import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import type { CryptoSnapshotInput } from '@/hooks/useCryptoSnapshots';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (input: CryptoSnapshotInput) => void;
}

const EXCHANGES = ['Binance', 'Bybit', 'OKX', 'Coinbase', 'Kraken', 'Bitget', 'Outra'];
const ACCOUNT_TYPES = ['Spot', 'Futures'];
const MARGIN_MODES = ['Isolated', 'Cross'];

export function CryptoSnapshotForm({ open, onOpenChange, onSubmit }: Props) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [exchange, setExchange] = useState('');
  const [accountType, setAccountType] = useState('Spot');
  const [marginMode, setMarginMode] = useState('');
  const [totalPositions, setTotalPositions] = useState('');
  const [positionsValue, setPositionsValue] = useState('');
  const [equity, setEquity] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [availableBalance, setAvailableBalance] = useState('');
  const [marginUsed, setMarginUsed] = useState('');
  const [unrealizedPnl, setUnrealizedPnl] = useState('');
  const [totalPnl, setTotalPnl] = useState('');
  const [totalPnlPct, setTotalPnlPct] = useState('');
  const [usdBrl, setUsdBrl] = useState('5.70');
  const [includePatrimony, setIncludePatrimony] = useState(true);

  const canSubmit = !!exchange && Number(equity) > 0 && Number(usdBrl) > 0;

  const handleSubmit = () => {
    onSubmit({
      date,
      time: time || undefined,
      exchange,
      account_type: accountType,
      margin_mode: marginMode || undefined,
      total_positions: totalPositions ? Number(totalPositions) : undefined,
      positions_value_usd: positionsValue ? Number(positionsValue) : undefined,
      equity_usd: Number(equity),
      wallet_balance_usd: walletBalance ? Number(walletBalance) : undefined,
      available_balance_usd: availableBalance ? Number(availableBalance) : undefined,
      margin_used_usd: marginUsed ? Number(marginUsed) : undefined,
      unrealized_pnl_usd: unrealizedPnl ? Number(unrealizedPnl) : undefined,
      total_pnl_usd: totalPnl ? Number(totalPnl) : undefined,
      total_pnl_pct: totalPnlPct ? Number(totalPnlPct) : undefined,
      usd_brl_rate: Number(usdBrl),
      include_in_patrimony: includePatrimony,
    });
    setEquity(''); setWalletBalance(''); setAvailableBalance('');
    setMarginUsed(''); setUnrealizedPnl(''); setTotalPnl(''); setTotalPnlPct('');
    setTotalPositions(''); setPositionsValue('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🪙 Novo Snapshot Cripto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Identification */}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><Label className="text-xs">Hora</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Corretora *</Label>
              <Select value={exchange} onValueChange={setExchange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{EXCHANGES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de Conta</Label>
              <Select value={accountType} onValueChange={setAccountType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {accountType === 'Futures' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Modo Margem</Label>
                <Select value={marginMode} onValueChange={setMarginMode}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{MARGIN_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Total Posições</Label><Input type="number" value={totalPositions} onChange={e => setTotalPositions(e.target.value)} placeholder="0" /></div>
            </div>
          )}

          {/* Capital */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">💰 CAPITAL (USD)</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-[10px]">Equity Total *</Label><Input type="number" value={equity} onChange={e => setEquity(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Saldo Carteira</Label><Input type="number" value={walletBalance} onChange={e => setWalletBalance(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Disponível</Label><Input type="number" value={availableBalance} onChange={e => setAvailableBalance(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">Margem em Uso</Label><Input type="number" value={marginUsed} onChange={e => setMarginUsed(e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          {/* Result */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">📈 RESULTADO (USD)</p>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-[10px]">P&L não realiz.</Label><Input type="number" value={unrealizedPnl} onChange={e => setUnrealizedPnl(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">P&L Total</Label><Input type="number" value={totalPnl} onChange={e => setTotalPnl(e.target.value)} placeholder="0" /></div>
              <div><Label className="text-[10px]">P&L Total (%)</Label><Input type="number" value={totalPnlPct} onChange={e => setTotalPnlPct(e.target.value)} placeholder="0" /></div>
            </div>
          </div>

          {/* Conversion */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">🌎 CONVERSÃO</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">USD/BRL *</Label><Input type="number" value={usdBrl} onChange={e => setUsdBrl(e.target.value)} step="0.01" /></div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={includePatrimony} onCheckedChange={setIncludePatrimony} />
                <Label className="text-xs">Incluir no patrimônio</Label>
              </div>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gradient-finance text-white">
            Registrar Snapshot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
