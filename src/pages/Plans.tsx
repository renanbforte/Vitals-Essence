import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Package, Crown, ArrowLeft, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription, STRIPE_PRODUCTS, PAID_MODULES } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo-ve.png';
import { Heart, DollarSign, Sparkles, Plane, ShoppingCart, PartyPopper, Leaf, Flower2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MODULE_META: Record<string, { icon: React.ElementType; color: string; label: string; teaser: string }> = {
  financeiro:      { icon: DollarSign, color: 'hsl(152, 68%, 42%)', label: 'Financeiro',       teaser: 'Fluxo, investimentos, trade e cripto' },
  tarefas:         { icon: Sparkles,   color: 'hsl(330, 80%, 55%)', label: 'Vida Pessoal',     teaser: 'Tarefas, rotinas e energia' },
  viagens:         { icon: Plane,      color: 'hsl(199, 89%, 48%)', label: 'Viagens',          teaser: 'Roteiros, hospedagem e rateio' },
  'lista-compras': { icon: ShoppingCart, color: 'hsl(25, 95%, 53%)', label: 'Lista de Compras', teaser: 'Histórico de preços e templates' },
  encontros:       { icon: PartyPopper,  color: 'hsl(340, 82%, 52%)', label: 'Encontros',       teaser: 'Rateios automáticos com amigos' },
  libertacao:      { icon: Leaf,       color: 'hsl(170, 60%, 42%)', label: 'Libertação',       teaser: 'Mudança de hábitos sem julgamento' },
  feminino:        { icon: Flower2,    color: 'hsl(340, 65%, 55%)', label: 'Saúde Reprodutiva', teaser: 'Ciclo, fases e bem-estar' },
  astral:          { icon: Star,       color: 'hsl(270, 70%, 55%)', label: 'Astral',           teaser: 'Mapa natal, horóscopo e tarot' },
};

type BillingPeriod = 'monthly' | 'annual';

export default function Plans() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    is_package, is_lifetime, is_trio, trio_modules: activeTrio, modules, trial_modules,
    loading, startCheckout, openPortal, checkSubscription, startTrial,
    cancel_at_period_end, subscription_end, canceled_modules, canceled_is_package,
  } = useSubscription();
  const [startingTrial, setStartingTrial] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [selectedTrioModules, setSelectedTrioModules] = useState<string[]>([]);

  const formattedEndDate = subscription_end
    ? format(parseISO(subscription_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null;

  const handleCheckout = async (priceId: string, trioMods?: string[]) => {
    if (!user) { navigate('/auth'); return; }
    await startCheckout(priceId, trioMods);
  };

  const handleStartTrial = async (moduleKey: string) => {
    if (!user) { navigate('/auth'); return; }
    setStartingTrial(moduleKey);
    const ok = await startTrial(moduleKey);
    if (ok) {
      toast.success('Trial de 14 dias ativado! Aproveite 🎉');
    } else {
      toast.error('Não foi possível ativar o trial');
    }
    setStartingTrial(null);
  };

  const toggleTrioModule = (key: string) => {
    setSelectedTrioModules(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const handleTrioCheckout = () => {
    if (selectedTrioModules.length !== 3) {
      toast.error('Selecione exatamente 3 módulos');
      return;
    }
    const priceId = billingPeriod === 'annual'
      ? STRIPE_PRODUCTS.trio.annual_price_id
      : STRIPE_PRODUCTS.trio.monthly_price_id;
    handleCheckout(priceId, selectedTrioModules);
  };

  const isAnnual = billingPeriod === 'annual';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <img src={logo} alt="Vitalis" className="w-7 h-7 rounded-lg" />
            <span className="font-semibold text-sm">Vitalis Essence</span>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={checkSubscription} disabled={loading} className="gap-2 text-muted-foreground">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Verificando...' : 'Atualizar'}
            </Button>
            {(is_package || is_lifetime) && !is_lifetime && (
              <Button variant="outline" size="sm" onClick={openPortal} className="gap-2">
                <ExternalLink className="w-3 h-3" />
                Gerenciar
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {is_lifetime ? (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Crown className="w-4 h-4" />
                Acesso Premium Vitalício ativo 🎉
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                <Crown className="w-4 h-4" />
                Escolha seu plano
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Desbloqueie todo o potencial</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              O módulo <span className="text-foreground font-semibold">Saúde</span> é sempre gratuito.{' '}
              {!is_lifetime && 'Experimente qualquer módulo por 14 dias grátis antes de assinar.'}
            </p>
          </motion.div>
        </div>

        {/* Billing toggle */}
        {!is_lifetime && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 bg-muted/50 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Anual
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">-30%</span>
              </button>
            </div>
          </div>
        )}

        {/* Banner: assinatura cancelada */}
        {cancel_at_period_end && formattedEndDate && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3"
          >
            <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {canceled_is_package
                  ? 'Pacote Completo cancelado'
                  : canceled_modules.length > 0
                    ? `${canceled_modules.length === 1 ? 'Assinatura cancelada' : 'Assinaturas canceladas'}: ${canceled_modules.map(m => MODULE_META[m]?.label ?? m).join(', ')}`
                    : 'Assinatura cancelada'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Seu acesso continua ativo até <span className="font-semibold text-foreground">{formattedEndDate}</span>.
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs" onClick={openPortal}>
              <ExternalLink className="w-3 h-3 mr-1" />
              Reativar
            </Button>
          </motion.div>
        )}

        {/* Cards de plano */}
        {!is_lifetime && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-14">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-rose-400" />
                <h2 className="font-bold text-lg">Free</h2>
              </div>
              <p className="text-3xl font-extrabold mb-1">R$ 0</p>
              <p className="text-muted-foreground text-sm mb-5">Para sempre</p>
              <ul className="space-y-3 flex-1 mb-6">
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Saúde completo</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />14 dias de trial por módulo</li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="w-4 h-4 shrink-0" />Sem cartão de crédito</li>
              </ul>
              <Button variant="outline" className="w-full" disabled>Plano atual</Button>
            </motion.div>

            {/* Módulo Individual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-lg">Por Módulo</h2>
              </div>
              <p className="text-3xl font-extrabold mb-1">
                {isAnnual ? (
                  <>R$ 6,99<span className="text-base font-normal text-muted-foreground">/mês</span></>
                ) : (
                  <>R$ 9,99<span className="text-base font-normal text-muted-foreground">/mês</span></>
                )}
              </p>
              <p className="text-muted-foreground text-sm mb-5">
                {isAnnual ? 'R$ 83,92/ano por módulo' : 'por módulo'}
              </p>
              <ul className="space-y-3 flex-1 mb-6">
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Escolha os módulos que usa</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Acumule quantos quiser</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Cancele quando quiser</li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => document.getElementById('modulos')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver módulos ↓
              </Button>
            </motion.div>

            {/* Trio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl border border-blue-500/50 bg-card p-6 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Popular
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-lg">Trio</h2>
              </div>
              <p className="text-3xl font-extrabold mb-1">
                {isAnnual ? (
                  <>R$ 13,93<span className="text-base font-normal text-muted-foreground">/mês</span></>
                ) : (
                  <>R$ 19,90<span className="text-base font-normal text-muted-foreground">/mês</span></>
                )}
              </p>
              <p className="text-muted-foreground text-sm mb-5">
                {isAnnual ? 'R$ 167,16/ano' : '3 módulos à sua escolha'}
              </p>
              <ul className="space-y-3 flex-1 mb-6">
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Escolha 3 módulos</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Economia vs individual</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Cancele quando quiser</li>
              </ul>
              {is_trio ? (
                <Button className="w-full gap-2" variant="outline" onClick={openPortal}>
                  <Star className="w-4 h-4" /> Gerenciar Trio
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => document.getElementById('trio-selector')?.scrollIntoView({ behavior: 'smooth' })}>
                  Escolher módulos ↓
                </Button>
              )}
            </motion.div>

            {/* Pacote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl border-2 border-primary bg-card p-6 flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Melhor valor
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Pacote Completo</h2>
              </div>
              <p className="text-3xl font-extrabold mb-1">
                {isAnnual ? (
                  <>R$ 34,93<span className="text-base font-normal text-muted-foreground">/mês</span></>
                ) : (
                  <>R$ 49,90<span className="text-base font-normal text-muted-foreground">/mês</span></>
                )}
              </p>
              <p className="text-muted-foreground text-sm mb-5">
                {isAnnual ? 'R$ 419,16/ano' : 'todos os módulos'}
              </p>
              <ul className="space-y-3 flex-1 mb-6">
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Todos os 8 módulos</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Novos módulos automáticos</li>
                <li className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-green-400 shrink-0" />Suporte prioritário</li>
              </ul>
              {is_package ? (
                <Button className="w-full gap-2" variant="outline" onClick={openPortal}>
                  <Crown className="w-4 h-4" /> Gerenciar assinatura
                </Button>
              ) : (
                <Button className="w-full gap-2 text-xs sm:text-sm" onClick={() => handleCheckout(
                  isAnnual ? STRIPE_PRODUCTS.pacote.annual_price_id : STRIPE_PRODUCTS.pacote.monthly_price_id
                )}>
                  <Package className="w-4 h-4 shrink-0" /> Assinar pacote
                </Button>
              )}
            </motion.div>
          </div>
        )}

        {/* Trio selector */}
        {!is_lifetime && !is_trio && (
          <div id="trio-selector" className="mb-14">
            <h2 className="text-xl font-bold mb-2">Monte seu Trio</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Selecione exatamente 3 módulos ({selectedTrioModules.length}/3)
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {PAID_MODULES.map((moduleKey) => {
                const meta = MODULE_META[moduleKey];
                const Icon = meta.icon;
                const isSelected = selectedTrioModules.includes(moduleKey);
                return (
                  <button
                    key={moduleKey}
                    onClick={() => toggleTrioModule(moduleKey)}
                    className={`rounded-xl border p-3 flex items-center gap-3 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.color + '22' }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{meta.label}</p>
                      <p className="text-muted-foreground text-xs truncate">{meta.teaser}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full sm:w-auto gap-2"
              disabled={selectedTrioModules.length !== 3}
              onClick={handleTrioCheckout}
            >
              <Star className="w-4 h-4" />
              Assinar Trio — {isAnnual ? 'R$ 167,16/ano' : 'R$ 19,90/mês'}
            </Button>
          </div>
        )}

        {/* Módulos individuais */}
        <div id="modulos">
          <h2 className="text-xl font-bold mb-2">Módulos individuais</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {is_lifetime
              ? 'Você tem acesso completo e vitalício a todos os módulos ✨'
              : isAnnual
                ? 'R$ 83,92/ano cada (R$ 6,99/mês) — experimente 14 dias grátis'
                : 'R$ 9,99/mês cada — experimente 14 dias grátis antes de assinar'}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAID_MODULES.map((moduleKey, i) => {
              const meta = MODULE_META[moduleKey];
              const product = STRIPE_PRODUCTS[moduleKey as keyof typeof STRIPE_PRODUCTS];
              const hasFullAccess = is_lifetime || is_package || modules.includes(moduleKey) || (is_trio && activeTrio.includes(moduleKey));
              const isTrial = !hasFullAccess && trial_modules.includes(moduleKey);
              const Icon = meta.icon;
              const isStarting = startingTrial === moduleKey;

              return (
                <motion.div
                  key={moduleKey}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                  className={`rounded-2xl border p-4 flex flex-col gap-3 ${
                    hasFullAccess ? 'border-green-500/50 bg-green-500/5' :
                    isTrial ? 'border-blue-500/50 bg-blue-500/5' :
                    'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: meta.color + '22' }}>
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    {hasFullAccess && !is_lifetime && (
                      <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-500">Ativo</Badge>
                    )}
                    {is_lifetime && (
                      <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">Vitalício</Badge>
                    )}
                    {isTrial && (
                      <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-500">Trial ativo</Badge>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{meta.label}</p>
                    <p className="text-muted-foreground text-xs">{meta.teaser}</p>
                  </div>
                  {hasFullAccess ? (
                    is_lifetime
                      ? <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => navigate('/')}>Acessar</Button>
                      : <Button size="sm" variant="outline" className="w-full text-xs" onClick={openPortal}>Gerenciar</Button>
                  ) : isTrial ? (
                    <Button size="sm" className="w-full text-xs" onClick={() => handleCheckout(
                      isAnnual ? product.annual_price_id : product.monthly_price_id
                    )}>
                      Assinar — {isAnnual ? 'R$ 83,92/ano' : 'R$ 9,99/mês'}
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        disabled={isStarting}
                        onClick={() => handleStartTrial(moduleKey)}
                      >
                        {isStarting ? 'Ativando...' : 'Testar 14 dias grátis'}
                      </Button>
                      <Button size="sm" className="w-full text-xs" onClick={() => handleCheckout(
                        isAnnual ? product.annual_price_id : product.monthly_price_id
                      )}>
                        Assinar — {isAnnual ? 'R$ 83,92/ano' : 'R$ 9,99/mês'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
