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

export function Header({ title = 'Operação Nutrição', showBack = false, gradientClass = 'gradient-hub' }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className={`${gradientClass} sticky top-0 z-50 shadow-lg`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          
          <div className="flex items-center gap-1">
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
