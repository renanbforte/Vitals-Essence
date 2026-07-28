// ============================================================================
// ResetPassword  —  TELA DE REDEFINIR SENHA (rota /reset-password)
// ----------------------------------------------------------------------------
// Aberta quando o usuário clica no link "esqueci minha senha" recebido por
// e-mail. Confere se o link é válido, deixa digitar a nova senha (duas vezes),
// salva a senha nova no Supabase e devolve o usuário para a tela de login.
// ============================================================================

// Ferramentas do React (estados e efeitos) e troca de tela.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Ícones usados na tela (cadeado, seta, "rodinha" de carregando, olho de mostrar/ocultar senha).
import { Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// "supabase" é a conexão com o banco/serviço de login online.
import { supabase } from '@/integrations/supabase/client';
// "toast" mostra mensagens rápidas de aviso (verde de sucesso, vermelho de erro).
import { toast } from 'sonner';
import logo from '@/assets/logo-ve.png';

export default function ResetPassword() {
  // Permite mudar de tela (usado para voltar ao login depois de redefinir).
  const navigate = useNavigate();
  // --- Memória da tela (valores que mudam enquanto o usuário interage) ---
  const [newPassword, setNewPassword] = useState('');       // senha nova digitada
  const [confirmPassword, setConfirmPassword] = useState(''); // repetição da senha nova
  const [showPassword, setShowPassword] = useState(false);  // mostra/oculta a senha na tela
  const [loading, setLoading] = useState(false);            // true enquanto está salvando
  const [isValidSession, setIsValidSession] = useState(false); // link de redefinição é válido?
  const [checking, setChecking] = useState(true);           // ainda verificando o link?

  // Ao abrir a tela: verifica se o usuário chegou por um link válido de redefinição.
  useEffect(() => {
    // Caminho 1: o Supabase avisa que é uma recuperação de senha ("PASSWORD_RECOVERY").
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);  // link confirmado como válido
        setChecking(false);       // pode parar de verificar
      }
    });

    // Caminho 2 (reforço): lê o endereço da página e confirma a sessão manualmente.
    const checkSession = async () => {
      // Pega os parâmetros que vêm depois do "#" no endereço do link.
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');

      if (type === 'recovery') {
        // Espera o Supabase processar o código de recuperação vindo no link.
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidSession(true); // existe sessão válida -> libera a troca de senha
        }
      }
      setChecking(false);
    };

    // Dá 1 segundo para o aviso automático acontecer antes de conferir na mão.
    setTimeout(checkSession, 1000);

    // Ao sair da tela, cancela a "escuta" para não deixar processo aberto.
    return () => subscription.unsubscribe();
  }, []);

  // Executado ao enviar o formulário: valida as senhas e salva a nova senha.
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); // impede a página de recarregar ao enviar

    // Regra 1: a senha precisa ter no mínimo 6 caracteres.
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    // Regra 2: as duas senhas digitadas devem ser iguais.
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true); // mostra o "carregando" no botão
    // Envia a nova senha para o Supabase salvar na conta do usuário.
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      // Deu problema ao salvar: avisa em vermelho.
      toast.error('Erro ao redefinir senha. Tente novamente.');
    } else {
      // Deu certo: avisa em verde e leva o usuário de volta para o login.
      toast.success('Senha redefinida com sucesso!');
      navigate('/auth');
    }
    setLoading(false); // tira o "carregando"
  };

  // Enquanto ainda está verificando o link, não mostra nada na tela.
  if (checking) return null;

  // Se o link NÃO for válido (expirado ou errado): mostra aviso e botão para voltar ao login.
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          {/* Logo do app */}
          <img src={logo} alt="Vitalis Essence" className="w-20 h-20 mx-auto rounded-2xl shadow-xl" />
          <h1 className="text-xl font-bold text-foreground">Link inválido ou expirado</h1>
          <p className="text-muted-foreground text-sm">
            Este link de redefinição de senha não é válido ou já expirou. Solicite um novo link.
          </p>
          {/* Botão que leva de volta à tela de login para pedir um novo link */}
          <Button onClick={() => navigate('/auth')} className="gradient-water text-white border-0">
            Voltar para Login
          </Button>
        </div>
      </div>
    );
  }

  // Link válido: mostra o formulário de criação da nova senha.
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Topo: logo e título "Nova Senha" */}
        <div className="text-center mb-8">
          <img src={logo} alt="Vitalis Essence" className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-xl" />
          <h1 className="text-2xl font-bold text-foreground">Nova Senha</h1>
          <p className="text-muted-foreground mt-2">Digite sua nova senha abaixo</p>
        </div>

        {/* Cartão com o formulário */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Campo 1: nova senha (com cadeado e botão de olho para mostrar/ocultar) */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                {/* Olho: alterna entre mostrar e esconder o texto da senha */}
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

            {/* Campo 2: repetir a senha para confirmar que não houve erro de digitação */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Botão de enviar: desativado enquanto salva ou se algum campo está vazio.
                Mostra a rodinha girando durante o salvamento. */}
            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full gradient-water text-white border-0 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Redefinir Senha
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
