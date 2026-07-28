// ============================================================================
// usePushNotifications.ts  —  NOTIFICAÇÕES PUSH (LEMBRETES NO CELULAR/NAVEGADOR)
// ----------------------------------------------------------------------------
// Cuida das notificações push do app: pede permissão, inscreve o aparelho para
// receber avisos (medicação, hidratação, treino, etc.), guarda essa inscrição no
// Supabase e permite ligar/desligar as notificações de cada módulo.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Função técnica auxiliar: converte a chave de segurança (VAPID) do formato texto
// para o formato de bytes que o navegador exige na hora de se inscrever. Não
// precisa entender os detalhes; é só uma tradução de formato exigida pelo padrão push.
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

// Lista dos módulos do app que podem enviar notificações.
export type NotificationModule =
  | 'medicacao'
  | 'hidratacao' 
  | 'refeicoes' 
  | 'treino' 
  | 'financeiro' 
  | 'ciclo' 
  | 'tarefas'
  | 'geral';

// Nomes "bonitos" de cada módulo, para exibir na tela em português.
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

// Hook das notificações push, usado pela tela de configurações de avisos.
export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default'); // permitido/negado/ainda não decidido
  const [isSubscribed, setIsSubscribed] = useState(false);   // este aparelho já está inscrito?
  const [loading, setLoading] = useState(false);             // executando uma ação agora?
  const [preferences, setPreferences] = useState<Record<string, boolean>>({}); // quais módulos estão ligados
  const vapidKeyRef = useRef<string>(''); // guarda a chave de segurança sem causar re-render

  // Ao abrir, lê a permissão de notificação já concedida (ou não) pelo navegador.
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Quando há usuário logado: busca a chave VAPID, confere se já está inscrito
  // e carrega as preferências de cada módulo.
  useEffect(() => {
    if (!user) return;
    fetchVapidKey();
    checkSubscription();
    loadPreferences();
  }, [user]);

  // Busca no servidor (edge function) a chave pública VAPID necessária para inscrever o aparelho.
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

  // Pergunta ao navegador se este aparelho já possui uma inscrição push ativa.
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

  // Carrega do banco quais módulos o usuário deixou ligados/desligados.
  const loadPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('module, enabled')
      .eq('user_id', user.id);

    // Transforma a lista do banco em um objeto { modulo: ligado? } fácil de consultar.
    if (data) {
      const prefs: Record<string, boolean> = {};
      data.forEach((p: any) => { prefs[p.module] = p.enabled; });
      setPreferences(prefs);
    }
  };

  // Ativa as notificações: pede permissão, inscreve o aparelho e salva a inscrição
  // no banco. Também cria as preferências padrão (todos os módulos ligados).
  const subscribe = useCallback(async () => {
    if (!user || !vapidKeyRef.current) {
      toast.error('Configuração de notificações indisponível');
      return false;
    }
    setLoading(true);
    try {
      // Pede ao usuário a permissão de notificação; se recusar, para por aqui.
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Permissão de notificação negada');
        setLoading(false);
        return false;
      }

      // Inscreve o aparelho no serviço de push do navegador usando a chave VAPID.
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKeyRef.current),
      });

      // Salva no banco os dados da inscrição (endereço e chaves) deste aparelho.
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

      // Cria as preferências iniciais, deixando todos os módulos ligados por padrão.
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

  // Desativa as notificações: cancela a inscrição no navegador e apaga o registro do banco.
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

  // Liga ou desliga as notificações de um módulo específico e grava a escolha no banco.
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

  // Entrega para a tela os estados e as ações; "supported" indica se o
  // navegador/aparelho suporta notificações push.
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
