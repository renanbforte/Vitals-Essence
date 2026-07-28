// ============================================================================
// main.tsx  —  PONTO DE ENTRADA DO APLICATIVO
// ----------------------------------------------------------------------------
// É o PRIMEIRO arquivo que roda no navegador. Ele faz duas coisas:
//   1. Mantém o "service worker" (PWA) sempre atualizado.
//   2. Coloca o app React dentro da página (na div #root do index.html).
// ============================================================================

import { createRoot } from "react-dom/client"; // função que "liga" o React numa div da página
import App from "./App.tsx";                    // o componente principal (o mapa de rotas)
import "./index.css";                            // estilos globais (Tailwind + base do projeto)

// ----------------------------------------------------------------------------
// Atualização do Service Worker (o "motor" do PWA que faz cache offline).
// Sem isto, o usuário poderia ficar preso numa versão antiga em cache.
// A cada carregamento, forçamos a checagem de uma versão nova.
// ----------------------------------------------------------------------------
if ('serviceWorker' in navigator) {                          // só roda se o navegador suportar PWA
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {              // para cada service worker registrado
      registration.update();                                 // pede ao navegador para checar atualização
      registration.addEventListener('updatefound', () => {   // quando encontra uma versão nova...
        const newWorker = registration.installing;           // ...pega o worker que está instalando
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {  // acompanha o estado da instalação
            if (newWorker.state === 'activated') {           // quando a versão nova fica ativa...
              window.location.reload();                      // ...recarrega a página para usá-la
            }
          });
        }
      });
    }
  });
}

// Renderiza o <App /> dentro da div de id "root" (definida no index.html).
// O "!" diz ao TypeScript que temos certeza que essa div existe.
createRoot(document.getElementById("root")!).render(<App />);
