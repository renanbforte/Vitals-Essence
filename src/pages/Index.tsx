// ============================================================================
// Index  —  PORTA DE ENTRADA DO APP (rota "/")
// ----------------------------------------------------------------------------
// É a primeira tela que carrega. Ela verifica se o usuário está logado:
// se não estiver, manda para a tela de login; se estiver, mostra o Hub
// (o painel principal). Enquanto verifica, exibe um "Carregando...".
// ============================================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Hub from './Hub';
import { Loader2 } from 'lucide-react';

const Index = () => {
  // Pega o usuário logado e se ainda está checando (loading) a autenticação.
  const { user, loading } = useAuth();
  // Ferramenta para redirecionar o usuário para outra rota/tela.
  const navigate = useNavigate();

  // Assim que terminar de verificar: se NÃO houver usuário logado,
  // envia automaticamente para a tela de login ("/auth").
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Enquanto ainda está verificando o login, mostra a tela de carregamento.
  if (loading) {
    return (
      // Tela de carregamento: ícone girando centralizado com o texto "Carregando...".
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não há usuário (já está sendo redirecionado para o login), não mostra nada.
  if (!user) {
    return null;
  }

  // Usuário logado: exibe o Hub, o painel principal do app.
  return <Hub />;
};

export default Index;
