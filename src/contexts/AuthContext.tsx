// ============================================================================
// AuthContext.tsx  —  CONTROLE DE LOGIN E PERFIL DO USUÁRIO
// ----------------------------------------------------------------------------
// Guarda, em um único lugar acessível por todo o app, quem é o usuário logado,
// sua sessão e seu perfil. Oferece as funções de cadastrar, entrar e sair.
// Qualquer tela pode ler esses dados chamando o hook useAuth().
// ============================================================================

// Ferramentas do React para criar/usar um "contexto" (estado global compartilhado).
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// Tipos do Supabase que representam o usuário e a sessão (o "login ativo").
import { User, Session } from '@supabase/supabase-js';
// Conexão pronta com o Supabase (banco de dados + autenticação na nuvem).
import { supabase } from '@/integrations/supabase/client';

// Formato dos dados do perfil que ficam guardados no banco (nome, peso, etc.).
interface Profile {
  id: string;
  user_id: string;
  name: string;
  target_weight: number;
  onboarding_completed: boolean;
  friend_code: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  cpf: string | null;
}

// Lista de tudo que o contexto disponibiliza para as telas do app:
// os dados atuais (usuário, sessão, perfil, carregando) e as ações possíveis.
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
}

// Cria o "recipiente" do contexto onde os dados de login ficam guardados.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Componente que envolve o app e fornece os dados de login para todas as telas.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Estados (memória viva do app): usuário, sessão, perfil e se ainda está carregando.
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca no banco (tabela "profiles") os dados de perfil do usuário informado.
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  // Ao abrir o app (roda uma vez), configura a vigilância do estado de login.
  useEffect(() => {
    // Fica "escutando" mudanças de login/logout em tempo real (entrar, sair, expirar).
    // Sempre que muda, atualiza sessão e usuário e (se logado) busca o perfil.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // setTimeout com 0: adia a busca do perfil para evitar conflito com o Supabase.
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Além de escutar mudanças futuras, verifica se JÁ existe um login ativo agora.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Ao fechar/desmontar, para de escutar as mudanças de login (evita vazamentos).
    return () => subscription.unsubscribe();
  }, []);

  // Cadastra um novo usuário (e-mail, senha e nome) e envia e-mail de confirmação.
  const signUp = async (email: string, password: string, name: string) => {
    // Endereço para onde o usuário volta após clicar no link de confirmação do e-mail.
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name }
      }
    });
    
    return { error };
  };

  // Faz login com e-mail e senha. Retorna erro se as credenciais estiverem erradas.
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  // Encerra a sessão no Supabase e limpa os dados locais (usuário, sessão, perfil).
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Atualiza o perfil apenas na tela (memória local), sem gravar no banco.
  // Útil para refletir mudanças na hora, mesclando os novos dados com os atuais.
  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  // Entrega os dados e as ações de login para todos os componentes-filhos do app.
  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Atalho que as telas usam para acessar o login (ex.: const { user } = useAuth()).
// Protege contra uso fora do AuthProvider, avisando com um erro claro.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
