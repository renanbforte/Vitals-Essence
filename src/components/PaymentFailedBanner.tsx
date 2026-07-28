import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/contexts/SubscriptionContext';

export function PaymentFailedBanner() {
  const { payment_failed, openPortal, checkSubscription, loading } = useSubscription();

  if (!payment_failed) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 rounded-2xl border border-destructive/40 bg-card p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <h2 className="text-xl font-bold mb-2 text-foreground">Pagamento não confirmado</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Identificamos um problema com o pagamento da sua assinatura. O acesso está temporariamente suspenso até que o pagamento seja confirmado.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full gap-2"
            onClick={openPortal}
          >
            <ExternalLink className="w-4 h-4" />
            Regularizar pagamento
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={checkSubscription}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Verificando...' : 'Já paguei — verificar agora'}
          </Button>
        </div>

        <p className="text-muted-foreground text-xs mt-5">
          Após regularizar, clique em "Já paguei" para restaurar seu acesso imediatamente.
        </p>
      </div>
    </div>
  );
}
