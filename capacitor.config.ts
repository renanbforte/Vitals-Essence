import type { CapacitorConfig } from '@capacitor/cli';

// Configuração do app Android empacotado com Capacitor.
// O build web (dist) é embutido no APK; os dados continuam vindo do Supabase online.
const config: CapacitorConfig = {
  appId: 'br.com.vitalisessence.app',
  appName: 'Vitalis Essence',
  webDir: 'dist',
  android: {
    // Permite o WebView carregar recursos (ex.: tiles de mapa, APIs) sem bloqueio.
    allowMixedContent: false,
  },
};

export default config;
