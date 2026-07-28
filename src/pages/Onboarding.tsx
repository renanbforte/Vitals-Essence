// ============================================================================
// Onboarding  —  TELA DE BOAS-VINDAS / PRIMEIRO ACESSO (rota /onboarding)
// ----------------------------------------------------------------------------
// Tela que recebe o usuário recém-cadastrado e o conduz por um passo a passo
// (o "assistente" OnboardingWizard) para configurar a conta. Só quem está
// logado entra aqui; ao terminar, o usuário é levado para o módulo Saúde.
// ============================================================================

// Ferramentas do React e do app usadas nesta tela.
import { useEffect } from 'react';                              // roda código quando a tela abre
import { useNavigate } from 'react-router-dom';                 // permite trocar de tela/rota
import { useAuth } from '@/contexts/AuthContext';               // informa quem está logado
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'; // o passo a passo em si
import { Loader2 } from 'lucide-react';                         // ícone de "carregando" que gira

export default function Onboarding() {
  // Pega o usuário logado e se a checagem de login ainda está em andamento.
  const { user, loading } = useAuth();
  // Ferramenta para redirecionar o usuário para outra tela.
  const navigate = useNavigate();

  // Proteção da tela: terminada a verificação, se ninguém estiver logado,
  // manda o usuário para a tela de login (/auth).
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Chamado quando o usuário conclui todos os passos: leva para o módulo Saúde.
  const handleComplete = () => {
    navigate('/saude');
  };

  // Enquanto o app verifica o login, mostra uma tela de carregamento.
  if (loading) {
    return (
      // Caixa que centraliza o indicador de carregamento na tela inteira.
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          {/* Ícone girando + texto "Carregando..." */}
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário logado, não mostra nada (o redirecionamento acima cuida disso).
  if (!user) {
    return null;
  }

  // Usuário logado: exibe o assistente de configuração inicial.
  return <OnboardingWizard onComplete={handleComplete} />;
}
