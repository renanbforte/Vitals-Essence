import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type NotificationModule = 
  | 'medicacao' 
  | 'hidratacao' 
  | 'refeicoes' 
  | 'treino' 
  | 'financeiro' 
  | 'ciclo' 
  | 'tarefas'
  | 'geral';

export const MODULE_LABELS: Record<NotificationModule, string> = {
  medicacao: 'Medicação',
  hidratacao: 'Hidratação',
  refeicoes: 'Refeições',
  treino: 'Treino',
  financeiro: 'Financeiro',
  ciclo: 'Ciclo Menstrual',
  tarefas: 'Tarefas',
  geral: 'Geral',
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const vapidKeyRef = useRef<string>('');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load VAPID key + check subscription
  useEffect(() => {
    if (!user) return;
    fetchVapidKey();
    checkSubscription();
    loadPreferences();
  }, [user]);

  const fetchVapidKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (!error && data?.publicKey) {
        vapidKeyRef.current = data.publicKey;
      }
    } catch (err) {
      console.error('Failed to fetch VAPID key:', err);
    }
  };

  const checkSubscription = async () => {
    if (!('serviceWorker' in navigator) || !user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  };

  const loadPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('module, enabled')
      .eq('user_id', user.id);
    
    if (data) {
      const prefs: Record<string, boolean> = {};
      data.forEach((p: any) => { prefs[p.module] = p.enabled; });
      setPreferences(prefs);
    }
  };

  const subscribe = useCallback(async () => {
    if (!user || !vapidKeyRef.current) {
      toast.error('Configuração de notificações indisponível');
      return false;
    }
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Permissão de notificação negada');
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKeyRef.current),
      });

      const subJson = sub.toJSON();
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
          device_label: navigator.userAgent.slice(0, 100),
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (error) throw error;

      // Create default preferences (all enabled)
      const modules: NotificationModule[] = Object.keys(MODULE_LABELS) as NotificationModule[];
      for (const mod of modules) {
        await supabase.from('notification_preferences').upsert(
          { user_id: user.id, module: mod, enabled: true },
          { onConflict: 'user_id,module' }
        );
      }

      setIsSubscribed(true);
      await loadPreferences();
      toast.success('Notificações ativadas!');
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('Push subscription error:', err);
      toast.error('Erro ao ativar notificações');
      setLoading(false);
      return false;
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint);
      }
      setIsSubscribed(false);
      toast.success('Notificações desativadas');
    } catch (err) {
      console.error('Unsubscribe error:', err);
      toast.error('Erro ao desativar notificações');
    }
    setLoading(false);
  }, [user]);

  const toggleModule = useCallback(async (module: string, enabled: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('notification_preferences').upsert(
      { user_id: user.id, module, enabled },
      { onConflict: 'user_id,module' }
    );
    if (!error) {
      setPreferences(prev => ({ ...prev, [module]: enabled }));
    }
  }, [user]);

  return {
    permission,
    isSubscribed,
    loading,
    preferences,
    subscribe,
    unsubscribe,
    toggleModule,
    supported: 'Notification' in window && 'serviceWorker' in navigator,
  };
}
