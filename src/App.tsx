import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { PaymentFailedBanner } from "@/components/PaymentFailedBanner";
import Index from "./pages/Index";
import Plans from "./pages/Plans";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Install from "./pages/Install";
import Friends from "./pages/Friends";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Viagens from "./pages/Viagens";
import TripDetail from "./pages/TripDetail";
import Shopping from "./pages/Shopping";
import Tasks from "./pages/Tasks";
import Account from "./pages/Account";
import Encontros from "./pages/Encontros";
import EncontroDetail from "./pages/EncontroDetail";
import Liberation from "./pages/Liberation";
import FeminineArea from "./pages/FeminineArea";
import Astral from "./pages/Astral";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Arena from "./pages/Arena";
import ArenaGroup from "./pages/ArenaGroup";
import Professional from "./pages/Professional";
import Support from "./pages/Support";
import ResetPassword from "./pages/ResetPassword";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <Toaster />
          <Sonner />
          <PaymentFailedBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/saude" element={<Dashboard />} />
              <Route path="/financeiro" element={<Finance />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/install" element={<Install />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/viagens" element={<Viagens />} />
              <Route path="/viagens/:tripId" element={<TripDetail />} />
              <Route path="/lista-compras" element={<Shopping />} />
              <Route path="/tarefas" element={<Tasks />} />
              <Route path="/encontros" element={<Encontros />} />
              <Route path="/encontros/:eventId" element={<EncontroDetail />} />
              <Route path="/libertacao" element={<Liberation />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
