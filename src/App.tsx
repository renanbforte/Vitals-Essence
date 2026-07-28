// ============================================================================
// App.tsx  —  O "MAPA" PRINCIPAL DO APLICATIVO
// ----------------------------------------------------------------------------
// Este arquivo faz duas coisas:
//   1. Liga os "provedores" globais (login, assinatura, avisos, tooltips).
//   2. Define as ROTAS: qual endereço (ex: "/saude") abre qual tela.
// É por aqui que o app começa a montar tudo o que aparece na tela.
// ============================================================================

// ---- Componentes visuais de "aviso" (notificações que aparecem na tela) ----
import { Toaster } from "@/components/ui/toaster";            // avisos padrão (estilo shadcn)
import { Toaster as Sonner } from "@/components/ui/sonner";   // avisos "sonner" (renomeado p/ Sonner)
import { TooltipProvider } from "@/components/ui/tooltip";    // habilita as dicas ao passar o mouse

// ---- React Query: cuida de buscar/guardar dados do servidor em cache ----
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ---- Roteamento: controla a navegação entre páginas pela URL ----
import { BrowserRouter, Routes, Route } from "react-router-dom";

// ---- Provedores globais próprios do projeto ----
import { AuthProvider } from "@/contexts/AuthContext";               // sabe QUEM está logado
import { SubscriptionProvider } from "@/contexts/SubscriptionContext"; // sabe QUAIS módulos o usuário acessa
import { PaymentFailedBanner } from "@/components/PaymentFailedBanner"; // faixa de aviso se o pagamento falhou

// ---- As TELAS (cada import é uma página da pasta src/pages) ----
import Index from "./pages/Index";               // página inicial ("/")
import Plans from "./pages/Plans";               // planos/assinaturas
import Auth from "./pages/Auth";                 // login e cadastro
import Onboarding from "./pages/Onboarding";     // primeiros passos do novo usuário
import Install from "./pages/Install";           // instruções para instalar o PWA
import Friends from "./pages/Friends";           // amigos
import Dashboard from "./pages/Dashboard";       // módulo Saúde
import Finance from "./pages/Finance";           // módulo Financeiro
import Viagens from "./pages/Viagens";           // módulo Viagens (lista)
import TripDetail from "./pages/TripDetail";     // detalhe de uma viagem específica
import Shopping from "./pages/Shopping";         // módulo Lista de Compras
import Tasks from "./pages/Tasks";               // módulo Tarefas / Vida Pessoal
import Account from "./pages/Account";           // conta do usuário
import Encontros from "./pages/Encontros";       // módulo Encontros (lista)
import EncontroDetail from "./pages/EncontroDetail"; // detalhe de um encontro
import Liberation from "./pages/Liberation";     // módulo Libertação (vícios)
import FeminineArea from "./pages/FeminineArea"; // módulo Área Feminina
import Astral from "./pages/Astral";             // módulo Astral
import NotFound from "./pages/NotFound";         // página de "404 - não encontrado"
import Terms from "./pages/Terms";               // termos de uso
import Privacy from "./pages/Privacy";           // política de privacidade
import Arena from "./pages/Arena";               // módulo Arena (lista de grupos)
import ArenaGroup from "./pages/ArenaGroup";     // detalhe de um grupo da Arena
import Professional from "./pages/Professional"; // módulo Profissional
import Support from "./pages/Support";           // suporte
import ResetPassword from "./pages/ResetPassword"; // redefinir senha

// Cria a "central de dados" do React Query (guarda respostas do servidor em cache,
// evitando buscar a mesma coisa várias vezes).
const queryClient = new QueryClient();

// Componente principal do app. O JSX abaixo é montado de fora para dentro:
// cada provedor "abraça" os que estão dentro dele, disponibilizando algo para todos.
const App = () => (
  // Disponibiliza o cache do React Query para todo o app
  <QueryClientProvider client={queryClient}>
    {/* Habilita tooltips (dicas) em qualquer lugar */}
    <TooltipProvider>
      {/* Disponibiliza o usuário logado para todas as telas */}
      <AuthProvider>
        {/* Disponibiliza o status de assinatura/acesso para todas as telas */}
        <SubscriptionProvider>
          {/* Os dois "Toaster" ficam sempre montados para poder mostrar avisos */}
          <Toaster />
          <Sonner />
          {/* Faixa que aparece no topo se houver falha de pagamento */}
          <PaymentFailedBanner />
          {/* BrowserRouter: liga a barra de endereços do navegador às rotas abaixo */}
          <BrowserRouter>
            {/* Routes: lista de todas as rotas possíveis. Só UMA casa por vez. */}
            <Routes>
              {/* path = endereço na URL ; element = tela que será exibida */}
              <Route path="/" element={<Index />} />
              <Route path="/saude" element={<Dashboard />} />
              <Route path="/financeiro" element={<Finance />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/install" element={<Install />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/viagens" element={<Viagens />} />
              {/* ":tripId" é um valor variável — o id da viagem clicada */}
              <Route path="/viagens/:tripId" element={<TripDetail />} />
              <Route path="/lista-compras" element={<Shopping />} />
              <Route path="/tarefas" element={<Tasks />} />
              <Route path="/encontros" element={<Encontros />} />
              <Route path="/encontros/:eventId" element={<EncontroDetail />} />
              <Route path="/libertacao" element={<Liberation />} />
              {/* A Área Feminina responde por dois endereços diferentes */}
              <Route path="/area-feminina" element={<FeminineArea />} />
              <Route path="/feminino" element={<FeminineArea />} />
              <Route path="/arena" element={<Arena />} />
              <Route path="/arena/:groupId" element={<ArenaGroup />} />
              <Route path="/astral" element={<Astral />} />
              <Route path="/profissional" element={<Professional />} />
              <Route path="/conta" element={<Account />} />
              <Route path="/planos" element={<Plans />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/suporte" element={<Support />} />
              {/* IMPORTANTE: adicionar rotas novas ACIMA desta linha "*" */}
              {/* "*" = qualquer endereço não listado acima cai no "não encontrado" */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// Exporta o App para ser usado pelo ponto de entrada (src/main.tsx).
export default App;
