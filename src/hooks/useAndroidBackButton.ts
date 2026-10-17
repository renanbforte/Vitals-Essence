// ============================================================================
// useAndroidBackButton  —  BOTÃO "VOLTAR" DO ANDROID
// ----------------------------------------------------------------------------
// No app empacotado (APK), o botão físico/gesto de "voltar" do Android fechava o
// aplicativo de qualquer tela. Aqui a gente intercepta esse botão para que ele
// volte uma tela dentro do app (como um navegador) e só feche o app quando já
// estiver na tela inicial. No navegador comum isso não roda (fica desligado).
// ============================================================================
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Telas consideradas "raiz": nelas, o voltar fecha o app (comportamento esperado).
const ROOT_PATHS = ['/', '/auth'];

export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Só faz sentido no app nativo (Android). No navegador, não mexe em nada.
    if (!Capacitor.isNativePlatform()) return;

    let remove: (() => void) | undefined;
    App.addListener('backButton', ({ canGoBack }) => {
      if (ROOT_PATHS.includes(location.pathname)) {
        // Já está na tela inicial: aí sim o voltar fecha o app.
        App.exitApp();
      } else if (canGoBack) {
        // Em qualquer outra tela: volta uma página no histórico.
        window.history.back();
      } else {
        // Sem histórico para voltar: vai para a tela inicial em vez de fechar.
        navigate('/');
      }
    }).then((handle) => { remove = () => handle.remove(); });

    return () => { remove?.(); };
  }, [location.pathname, navigate]);
}
