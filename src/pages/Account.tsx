// ============================================================================
// Account  —  MINHA CONTA (PERFIL E CONFIGURAÇÕES DO USUÁRIO)
// ----------------------------------------------------------------------------
// Tela da rota "/conta". O usuário vê e edita seus dados pessoais: foto, nome,
// e-mail, código de amigo (para ser adicionado por outras pessoas), troca de
// senha e notificações. Também acessa o suporte e faz logout (sair da conta).
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Key, UserCircle, Copy, Check, Shield, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProfilePhotoUpload } from '@/components/ProfilePhotoUpload';
import { NotificationSettings } from '@/components/NotificationSettings';

export default function Account() {
  // Permite mudar de página (voltar ao início, ir para suporte, etc.)
  const navigate = useNavigate();
  // Dados e ações do usuário logado, vindos do contexto de autenticação
  const { user, profile, signOut, updateProfile } = useAuth();
  // Campo de texto do nome (começa com o nome atual do perfil)
  const [name, setName] = useState(profile?.name || '');
  // Indica se o nome está sendo salvo (mostra "Salvando...")
  const [savingName, setSavingName] = useState(false);
  // Campo da nova senha digitada
  const [newPassword, setNewPassword] = useState('');
  // Campo de confirmação da nova senha
  const [confirmPassword, setConfirmPassword] = useState('');
  // Indica se a senha está sendo alterada (mostra "Alterando...")
  const [changingPassword, setChangingPassword] = useState(false);
  // Indica se o código de amigo acabou de ser copiado (troca ícone por 2s)
  const [codeCopied, setCodeCopied] = useState(false);

  // Salva o novo nome no banco de dados (tabela de perfis do Supabase)
  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('user_id', user.id);
    if (error) {
      toast.error('Erro ao salvar nome');
    } else {
      updateProfile({ name: name.trim() });
      toast.success('Nome atualizado!');
    }
    setSavingName(false);
  };

  // Altera a senha do usuário: valida tamanho mínimo e se as duas senhas batem
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error('Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  // Copia o código de amigo para a área de transferência e mostra confirmação
  const copyFriendCode = () => {
    if (profile?.friend_code) {
      navigator.clipboard.writeText(profile.friend_code);
      setCodeCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  // Faz logout e envia o usuário de volta para a tela de login
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho com fundo em gradiente: botão voltar, título e o perfil */}
      <div className="gradient-hub">
        <div className="container mx-auto px-5 pt-6 pb-10">
          {/* Linha do topo: seta de voltar para o início + título "Minha Conta" */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-white text-xl font-bold">Minha Conta</h1>
          </div>

          {/* Foto de perfil (com upload), nome e e-mail do usuário */}
          <div className="flex flex-col items-center gap-3">
            <ProfilePhotoUpload
              userId={user?.id || ''}
              userName={profile?.name || ''}
              currentPhotoUrl={profile?.avatar_url || null}
              onPhotoUpdated={(url) => updateProfile({ avatar_url: url })}
              size="lg"
            />
            <p className="text-white font-bold text-lg">{profile?.name}</p>
            <p className="text-white/50 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Corpo branco arredondado que sobe sobre o cabeçalho, com os cartões */}
      <div className="rounded-t-[2rem] -mt-6 bg-background relative z-10">
        <div className="container mx-auto px-5 pt-8 pb-10 space-y-6">

          {/* Cartão "Nome": editar e salvar o nome de exibição */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserCircle className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Nome</h2>
            </div>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="flex-1"
              />
              <Button onClick={handleSaveName} disabled={savingName} size="sm">
                {savingName ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </motion.div>

          {/* Cartão "Email": apenas exibe o e-mail (não editável aqui) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Email</h2>
            </div>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </motion.div>

          {/* Cartão "Código de Amigo": mostra e copia o código para clicar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Código de Amigo</h2>
            </div>
            <p className="text-muted-foreground text-xs mb-3">
              Compartilhe este código para que amigos te adicionem no app.
            </p>
            {/* Se existe código: botão que copia; senão, aviso de indisponível */}
            {profile?.friend_code ? (
              <button
                onClick={copyFriendCode}
                className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 w-full group hover:bg-muted/70 transition-colors"
              >
                <span className="font-mono text-lg font-bold text-foreground tracking-widest flex-1 text-left">
                  {profile.friend_code}
                </span>
                {/* Ícone muda para "check" verde logo após copiar */}
                {codeCopied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </button>
            ) : (
              <p className="text-muted-foreground text-sm italic">Código não disponível</p>
            )}
          </motion.div>

          {/* Cartão "Alterar Senha": nova senha + confirmação + botão de troca */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Alterar Senha</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nova senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword}
                className="w-full"
              >
                {changingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </motion.div>

          {/* Preferências de notificações (componente próprio) */}
          <NotificationSettings />

          {/* Botão que leva à Central de Ajuda e Suporte */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              variant="outline"
              onClick={() => navigate('/suporte')}
              className="w-full rounded-2xl h-14 border-primary/20 hover:bg-primary/5"
            >
              <HelpCircle className="w-4 h-4 mr-2 text-primary" />
              Central de Ajuda e Suporte
            </Button>
          </motion.div>

          {/* Botão vermelho para sair da conta (logout) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full rounded-2xl h-14 text-destructive border-destructive/20 hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
