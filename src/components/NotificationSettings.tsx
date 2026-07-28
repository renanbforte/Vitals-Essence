import { Bell, BellOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications, MODULE_LABELS, NotificationModule } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const {
    isSubscribed,
    loading,
    preferences,
    subscribe,
    unsubscribe,
    toggleModule,
    supported,
  } = usePushNotifications();

  if (!supported) {
    return (
      <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <BellOff className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-bold text-foreground">Notificações</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Seu navegador não suporta notificações push.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-foreground">Notificações Push</h2>
      </div>

      {!isSubscribed ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Receba lembretes de medicação, hidratação, refeições e mais direto no seu celular.
          </p>
          <Button
            onClick={subscribe}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bell className="w-4 h-4 mr-2" />
            )}
            Ativar Notificações
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs">
            Escolha quais módulos podem enviar notificações.
          </p>

          <div className="space-y-3">
            {(Object.keys(MODULE_LABELS) as NotificationModule[]).map((mod) => (
              <div
                key={mod}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm text-foreground">{MODULE_LABELS[mod]}</span>
                <Switch
                  checked={preferences[mod] !== false}
                  onCheckedChange={(checked) => toggleModule(mod, checked)}
                />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={unsubscribe}
            disabled={loading}
            className="w-full text-destructive border-destructive/20 hover:bg-destructive/5"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BellOff className="w-4 h-4 mr-2" />
            )}
            Desativar Notificações
          </Button>
        </div>
      )}
    </motion.div>
  );
}
