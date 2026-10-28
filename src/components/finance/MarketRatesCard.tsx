// ============================================================================
// MarketRatesCard — TAXAS DE MERCADO (CDI / IPCA) DO USUÁRIO
// ----------------------------------------------------------------------------
// Pequeno painel para ver e ajustar o CDI e o IPCA que o app usa para calcular
// a renda fixa. Dá para atualizar automaticamente (Banco Central) ou editar na
// mão. Serve de base para "100% do CDI", "IPCA + x%" etc.
// ============================================================================
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Percent, RefreshCw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { useMarketRates } from '@/hooks/useMarketRates';

// Recebe o retorno do hook useMarketRates (para compartilhar o mesmo estado).
type MarketRatesApi = ReturnType<typeof useMarketRates>;

export function MarketRatesCard({ api }: { api: MarketRatesApi }) {
  const { rates, updatedAt, fetching, save, refreshOnline } = api;
  const { toast } = useToast();
  const [cdi, setCdi] = useState(String(rates.cdi));
  const [ipca, setIpca] = useState(String(rates.ipca));
  const [dirty, setDirty] = useState(false);

  // Sincroniza os campos quando as taxas carregam/atualizam de fora.
  useEffect(() => {
    if (!dirty) {
      setCdi(String(rates.cdi));
      setIpca(String(rates.ipca));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates.cdi, rates.ipca]);

  const handleSave = async () => {
    await save({ cdi: Number(cdi.replace(',', '.')) || 0, ipca: Number(ipca.replace(',', '.')) || 0 });
    setDirty(false);
    toast({ title: 'Taxas salvas' });
  };

  const handleRefresh = async () => {
    const ok = await refreshOnline();
    setDirty(false);
    toast(ok
      ? { title: 'Taxas atualizadas', description: 'CDI e IPCA do Banco Central.' }
      : { title: 'Não consegui buscar agora', description: 'Ajuste manualmente os valores.', variant: 'destructive' });
  };

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;

  return (
    <Card className="border-border/60">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-[hsl(var(--finance))]" />
            <p className="text-sm font-bold">Taxas de mercado</p>
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-sky-600" disabled={fetching} onClick={handleRefresh}>
            <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[10px] text-muted-foreground">CDI (% a.a.)</span>
            <Input
              type="number" step="0.01" value={cdi}
              onChange={e => { setCdi(e.target.value); setDirty(true); }}
              className="h-8 text-sm rounded-lg tabular-nums"
            />
          </label>
          <label className="block">
            <span className="text-[10px] text-muted-foreground">IPCA 12m (% a.a.)</span>
            <Input
              type="number" step="0.01" value={ipca}
              onChange={e => { setIpca(e.target.value); setDirty(true); }}
              className="h-8 text-sm rounded-lg tabular-nums"
            />
          </label>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{updatedLabel ? `Atualizado em ${updatedLabel}` : 'Usando valores padrão'}</span>
          {dirty && (
            <Button size="sm" className="h-7 gap-1 text-xs gradient-finance text-white" onClick={handleSave}>
              <Check className="w-3.5 h-3.5" /> Salvar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
