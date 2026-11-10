// ============================================================================
// Auth  —  TELA DE LOGIN / CADASTRO / RECUPERAÇÃO DE SENHA (rota /auth)
// ----------------------------------------------------------------------------
// Porta de entrada do app. A mesma tela alterna entre 3 modos: entrar,
// criar conta (com aceite dos Termos/LGPD) e "esqueci minha senha". Ao logar
// com sucesso, o usuário é redirecionado para a tela inicial ("/").
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import logo from '@/assets/logo-ve.png';

// Regras de validação dos campos (usando a biblioteca Zod): email válido,
// senha com no mínimo 6 caracteres e nome com pelo menos 2 (só no cadastro).
const authSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional(),
});

// Componente principal da tela de autenticação.
export default function Auth() {
  // true = modo "Entrar"; false = modo "Criar Conta".
  const [isLogin, setIsLogin] = useState(true);
  // Valores digitados nos campos do formulário.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Indica que uma ação de login/cadastro está em andamento (mostra spinner).
  const [loading, setLoading] = useState(false);
  // Controla se a senha aparece como texto ou como "••••••••".
  const [showPassword, setShowPassword] = useState(false);
  // true = tela está no modo "Esqueci minha senha".
  const [forgotMode, setForgotMode] = useState(false);
  // Indica que o envio do email de recuperação está em andamento.
  const [forgotLoading, setForgotLoading] = useState(false);
  // Funções de autenticação e usuário logado, vindos do contexto de Auth.
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Se o usuário já estiver logado, redireciona automaticamente para a home.
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Enviar o formulário de login OU de cadastro (conforme o modo atual).
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valida os campos antes de chamar o servidor; se houver erro, avisa e para.
    // Cadastro e login pedem apenas e-mail e senha.
    try {
      authSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setLoading(true);

    // Fluxo de LOGIN: tenta entrar e trata mensagens de erro amigáveis.
    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error('Erro ao fazer login');
        }
      } else {
        toast.success('Bem-vindo de volta!');
        navigate('/');
      }
    } else {
      // Fluxo de CADASTRO: cria a conta e trata o caso de email já existente.
      // Sem campo de nome: usamos a parte antes do "@" do e-mail como nome inicial
      // (o usuário pode ajustar depois no perfil).
      const derivedName = (email.split('@')[0] || 'Usuário').trim();
      const { error } = await signUp(email, password, derivedName);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Erro ao criar conta');
        }
      } else {
        toast.success('Conta criada com sucesso!');
        navigate('/');
      }
    }

    setLoading(false);
  };

  // Enviar o email de recuperação de senha (modo "Esqueci minha senha").
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Precisa ter um email digitado.
    if (!email.trim()) {
      toast.error('Digite seu email');
      return;
    }

    setForgotLoading(true);

    // Pede ao Supabase para enviar o link de redefinição; ao clicar no email,
    // o usuário volta para a página /reset-password deste mesmo site.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error('Erro ao enviar email de recuperação');
    } else {
      toast.success('Se este email estiver cadastrado, você receberá um link para redefinir sua senha.');
      setForgotMode(false);
    }

    setForgotLoading(false);
  };

  // Estrutura visual da tela (o que aparece na página).
  return (
    // Container que centraliza o cartão de login no meio da tela.
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Topo: logo, nome do app e subtítulo que muda conforme o modo atual */}
        <div className="text-center mb-8">
          <img
            src={logo} 
            alt="Vitalis Essence" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-xl"
          />
          <h1 className="text-2xl font-bold text-foreground">
            Vitalis Essence
          </h1>
          <p className="text-muted-foreground mt-2">
            {forgotMode ? 'Recupere sua senha' : isLogin ? 'Faça login para continuar' : 'Crie sua conta'}
          </p>
        </div>

        {/* Cartão branco que contém o formulário */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          {/* MODO "ESQUECI A SENHA": formulário só com o campo de email */}
          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {/* Campo de email para receber o link de recuperação */}
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email cadastrado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Botão para enviar o link (mostra spinner enquanto envia) */}
              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full gradient-water text-white border-0 gap-2"
              >
                {forgotLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Enviar Link de Recuperação
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {/* Link para voltar da recuperação de senha para a tela de login */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="font-medium text-primary">Voltar para login</span>
                </button>
              </div>
            </form>
          ) : (
            /* MODO LOGIN/CADASTRO: formulário principal com email, senha etc. */
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo de email (sempre presente) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Campo de senha com botão de olho para mostrar/ocultar */}
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Link "Esqueci minha senha" aparece apenas no modo login */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                {/* Botão principal: "Entrar" ou "Criar Conta" conforme o modo */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-water text-white border-0 gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Entrar' : 'Criar Conta'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Link que alterna entre os modos "Entrar" e "Cadastre-se" */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? (
                    <>
                      Não tem conta? <span className="font-medium text-primary">Cadastre-se</span>
                    </>
                  ) : (
                    <>
                      Já tem conta? <span className="font-medium text-primary">Faça login</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
