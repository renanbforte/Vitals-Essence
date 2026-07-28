// ============================================================================
// COMPONENTE: Header (Cabeçalho do topo da tela)
// Barra fixa no topo das páginas do app. Mostra o logo (ou um botão de voltar),
// o título da tela, uma saudação com o primeiro nome do usuário, o atalho para a
// página de Amigos e o botão de Sair (encerrar sessão).
// ============================================================================
import { LogOut, Users, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo-ve.png';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  gradientClass?: string;
}

// Recebe (opcionalmente): o título a exibir, se deve mostrar o botão de voltar e
// a classe do gradiente de fundo. Todos têm valores padrão caso não sejam passados.
export function Header({ title = 'Operação Nutrição', showBack = false, gradientClass = 'gradient-hub' }: HeaderProps) {
  // Dados do usuário logado (perfil) e a função para sair (encerrar a sessão)
  const { profile, signOut } = useAuth();
  // Permite navegar entre telas via código (ex.: voltar para a página inicial)
  const navigate = useNavigate();
  // Informa qual é a página atual (usado para esconder o botão "Amigos" quando já estamos nela)
  const location = useLocation();

  return (
    <header className={`${gradientClass} sticky top-0 z-50 shadow-lg`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Lado esquerdo: botão de voltar OU logo, seguido do título e da saudação */}
          <div className="flex items-center gap-3">
            {/* Se showBack for verdadeiro mostra a seta de voltar; senão, mostra o logo */}
            {showBack ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <img 
                src={logo} 
                alt="Vitalis Essence" 
                className="w-9 h-9 rounded-xl shadow-md object-cover"
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-white">
                {title}
              </h1>
              {!showBack && (
                <p className="text-xs text-white/60">
                  Olá, {profile?.name?.split(' ')[0] || 'Usuário'} 👋
                </p>
              )}
            </div>
          </div>
          
          {/* Lado direito: atalho para "Amigos" e o botão de "Sair" */}
          <div className="flex items-center gap-1">
            {/* Só mostra o atalho de Amigos quando NÃO estamos já na página de amigos */}
            {location.pathname !== '/friends' && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-white/70 hover:text-white hover:bg-white/10 gap-2 rounded-xl"
              >
                <Link to="/friends">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Amigos</span>
                </Link>
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-2 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
