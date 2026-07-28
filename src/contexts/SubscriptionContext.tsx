import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// Mapeamento de produtos Stripe — v2 com mensal e anual
export const STRIPE_PRODUCTS = {
  financeiro: {
    product_ids: ['prod_U0zjXfyqNYTkxf', 'prod_U2XTATDBcwXyHx', 'prod_U2XYStgfziowX9'],
    monthly_price_id: 'price_1T4SOHAWmzfsTswaNiafo2Rl',
    annual_price_id: 'price_1T4ST2AWmzfsTswa6B90NdgJ',
    name: 'Módulo Financeiro',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  tarefas: {
    product_ids: ['prod_U0zjamfVsHR5gb', 'prod_U2XTRJRlU13ObA', 'prod_U2XY3rsRM1s6ml'],
    monthly_price_id: 'price_1T4SOVAWmzfsTswaBN8qTECg',
    annual_price_id: 'price_1T4STDAWmzfsTswahyITsuZA',
    name: 'Módulo Vida Pessoal',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  viagens: {
    product_ids: ['prod_U0zjZoezDuhPef', 'prod_U2XUqQR0r0n0cD', 'prod_U2XZnlGuqQZXLQ'],
    monthly_price_id: 'price_1T4SPeAWmzfsTswaiUcoZKPa',
    annual_price_id: 'price_1T4SU8AWmzfsTswabzbnVCkB',
    name: 'Módulo Viagens',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  'lista-compras': {
    product_ids: ['prod_U0zjwIvAzeMqDg', 'prod_U2XV6HHTq0f3p7', 'prod_U2XZLUKGo7euiQ'],
    monthly_price_id: 'price_1T4SQbAWmzfsTswazudt2JEi',
    annual_price_id: 'price_1T4SUQAWmzfsTswa7yYJ6YHA',
    name: 'Módulo Lista de Compras',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  encontros: {
    product_ids: ['prod_U0zkwmSDQtLDyY', 'prod_U2XVvrKeh1Qxfe', 'prod_U2XZ0DqyQ96KnU'],
    monthly_price_id: 'price_1T4SQtAWmzfsTswanaI28hWq',
    annual_price_id: 'price_1T4SUjAWmzfsTswarEvnbXj1',
    name: 'Módulo Encontros',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  libertacao: {
    product_ids: ['prod_U0zkTBPHKkUtlO', 'prod_U2XX6P6IX2swrd', 'prod_U2XavjxaFzQJN1'],
    monthly_price_id: 'price_1T4SS9AWmzfsTswaoxm1yprk',
    annual_price_id: 'price_1T4SUyAWmzfsTswaN6hxVSQK',
    name: 'Módulo Libertação',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  feminino: {
    product_ids: ['prod_U0zk80gCRhrbuP', 'prod_U2XXBXfwotVEv8', 'prod_U2XaB7v40QnaZ0'],
    monthly_price_id: 'price_1T4SSRAWmzfsTswaSvMn0nAI',
    annual_price_id: 'price_1T4SVEAWmzfsTswasVN9UfrU',
    name: 'Módulo Saúde Reprodutiva',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  astral: {
    product_ids: ['prod_U0zl7Vujc79R7C', 'prod_U2XXb9PCzlXC7v', 'prod_U2XbNc4hafUmOm'],
    monthly_price_id: 'price_1T4SSgAWmzfsTswaOc2RLLrH',
    annual_price_id: 'price_1T4SVxAWmzfsTswaVOvFRX8b',
    name: 'Módulo Astral',
    monthly_price: 9.99,
    annual_price: 83.92,
  },
  trio: {
    product_ids: ['prod_U2XQXOrGdDdeGh', 'prod_U2XRNKDm2cY5DK'],
    monthly_price_id: 'price_1T4SLlAWmzfsTswaHrYEM9Vk',
    annual_price_id: 'price_1T4SMiAWmzfsTswatqyY0ODm',
    name: 'Trio Vitalis',
    monthly_price: 19.90,
    annual_price: 167.16,
  },
  pacote: {
    product_ids: ['prod_U0zlAZoRH0ZVrl', 'prod_U2XSKiF1MJFrtf', 'prod_U2XSRBEungK3tm', 'prod_U2XutUxX0Ka8Sz', 'prod_U2XvRhYxektxSM'],
    monthly_price_id: 'price_1T4SokAWmzfsTswaodwc8aq3',
    annual_price_id: 'price_1T4SpIAWmzfsTswaY3kOOabm',
    name: 'Pacote Completo Vitalis',
    monthly_price: 49.90,
    annual_price: 419.16,
  },
};

// Módulos que são SEMPRE gratuitos
export const FREE_MODULES = ['saude'];

// Módulos pagos
export const PAID_MODULES = ['financeiro', 'tarefas', 'viagens', 'lista-compras', 'encontros', 'libertacao', 'feminino', 'astral'];

interface SubscriptionState {
  loading: boolean;
  subscribed: boolean;
  is_package: boolean;
  is_trio: boolean;
  trio_modules: string[];
  is_lifetime: boolean;
  payment_failed: boolean;
  cancel_at_period_end: boolean;
  canceled_modules: string[];
  canceled_is_package: boolean;
  modules: string[];
  trial_modules: string[];
  trial_end_dates: Record<string, string>;
  subscription_end: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  hasModuleAccess: (moduleKey: string) => boolean;
  hasTrial: (moduleKey: string) => boolean;
  getTrialDaysLeft: (moduleKey: string) => number;
  checkSubscription: () => Promise<void>;
  startCheckout: (priceId: string, trioModules?: string[]) => Promise<void>;
  openPortal: () => Promise<void>;
  startTrial: (moduleKey: string) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    loading: false,
    subscribed: false,
    is_package: false,
    is_trio: false,
    trio_modules: [],
    is_lifetime: false,
    payment_failed: false,
    cancel_at_period_end: false,
    canceled_modules: [],
    canceled_is_package: false,
    modules: [],
    trial_modules: [],
    trial_end_dates: {},
    subscription_end: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(s => ({ ...s, loading: false, subscribed: false, is_package: false, is_trio: false, trio_modules: [], is_lifetime: false, payment_failed: false, modules: [], trial_modules: [], trial_end_dates: {}, canceled_modules: [], canceled_is_package: false }));
      return;
    }
    setState(s => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setState({
        loading: false,
        subscribed: data.subscribed ?? false,
        is_package: data.is_package ?? false,
        is_trio: data.is_trio ?? false,
        trio_modules: data.trio_modules ?? [],
        is_lifetime: data.is_lifetime ?? false,
        payment_failed: data.payment_failed ?? false,
        cancel_at_period_end: data.cancel_at_period_end ?? false,
        canceled_modules: data.canceled_modules ?? [],
        canceled_is_package: data.canceled_is_package ?? false,
        modules: data.modules ?? [],
        trial_modules: data.trial_modules ?? [],
        trial_end_dates: data.trial_end_dates ?? {},
        subscription_end: data.subscription_end ?? null,
      });
    } catch (e) {
      console.error('check-subscription error:', e);
      setState(s => ({ ...s, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setTimeout(() => checkSubscription(), 2000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkSubscription]);

  const hasModuleAccess = useCallback((moduleKey: string) => {
    if (FREE_MODULES.includes(moduleKey)) return true;
    if (state.is_lifetime) return true;
    if (state.is_package) return true;
    if (state.is_trio && state.trio_modules.includes(moduleKey)) return true;
    if (state.modules.includes(moduleKey)) return true;
    if (state.trial_modules.includes(moduleKey)) return true;
    return false;
  }, [state.is_lifetime, state.is_package, state.is_trio, state.trio_modules, state.modules, state.trial_modules]);

  const hasTrial = useCallback((moduleKey: string) => {
    return state.trial_modules.includes(moduleKey);
  }, [state.trial_modules]);

  const getTrialDaysLeft = useCallback((moduleKey: string): number => {
    const endDate = state.trial_end_dates[moduleKey];
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [state.trial_end_dates]);

  const startTrial = useCallback(async (moduleKey: string): Promise<boolean> => {
    if (!user) return false;
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('module_trials')
      .insert({ user_id: user.id, module_key: moduleKey, trial_end: trialEnd });
    if (error) {
      console.error('startTrial error:', error);
      return false;
    }
    await checkSubscription();
    return true;
  }, [user, checkSubscription]);

  const startCheckout = useCallback(async (priceId: string, trioModules?: string[]) => {
    try {
      const body: Record<string, unknown> = { price_id: priceId };
      if (trioModules && trioModules.length === 3) {
        body.trio_modules = trioModules;
      }
      const { data, error } = await supabase.functions.invoke('create-checkout', { body });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error('create-checkout error:', e);
    }
  }, []);

  const openPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error('customer-portal error:', e);
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{ ...state, hasModuleAccess, hasTrial, getTrialDaysLeft, checkSubscription, startCheckout, openPortal, startTrial }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
