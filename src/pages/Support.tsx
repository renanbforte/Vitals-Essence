import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, HelpCircle, Mail, ChevronDown, ChevronUp,
  Heart, DollarSign, Dumbbell, Plane, ShieldCheck, Smartphone,
  Bell, Users, Star, Lock, CreditCard, Trash2, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
  category: string;
}

const faqItems: FAQItem[] = [
  // Geral
  {
    category: 'Geral',
    icon: <Smartphone className="w-4 h-4" />,
    question: 'O que é o Vitalis Essence?',
    answer: 'O Vitalis Essence é uma plataforma modular de gestão pessoal que integra saúde, finanças, carreira, viagens, vida pessoal e mais — tudo em um único aplicativo. Funciona como um PWA (Progressive Web App), podendo ser instalado direto no celular sem precisar de loja de apps.'
  },
  {
    category: 'Geral',
    icon: <Smartphone className="w-4 h-4" />,
    question: 'Como instalo o app no meu celular?',
    answer: 'No Android, abra o site no Chrome e toque em "Adicionar à tela inicial" no menu do navegador. No iPhone, abra no Safari, toque no ícone de compartilhar (quadrado com seta) e selecione "Adicionar à Tela de Início". Você também pode acessar a página /install para um guia visual completo.'
  },
  {
    category: 'Geral',
    icon: <Smartphone className="w-4 h-4" />,
    question: 'O app funciona offline?',
    answer: 'A interface carrega offline graças ao Service Worker, mas funcionalidades que dependem do banco de dados (salvar dados, sincronizar) precisam de conexão com a internet. Ao reconectar, tudo volta a funcionar normalmente.'
  },
  {
    category: 'Geral',
    icon: <Smartphone className="w-4 h-4" />,
    question: 'Em quais dispositivos o Vitalis funciona?',
    answer: 'O Vitalis funciona em qualquer dispositivo com um navegador moderno: smartphones Android e iPhone, tablets e computadores. A experiência é otimizada para uso mobile.'
  },

  // Conta e Segurança
  {
    category: 'Conta e Segurança',
    icon: <Lock className="w-4 h-4" />,
    question: 'Como crio minha conta?',
    answer: 'Acesse a página de login, clique em "Criar conta" e preencha seu email e senha. Você receberá um email de confirmação — clique no link para ativar sua conta. Depois, complete o onboarding para personalizar sua experiência.'
  },
  {
    category: 'Conta e Segurança',
    icon: <Lock className="w-4 h-4" />,
    question: 'Esqueci minha senha. Como recupero?',
    answer: 'Na tela de login, clique em "Esqueci minha senha" e informe seu email. Você receberá um link para redefinir sua senha. O link expira em 1 hora por segurança.'
  },
  {
    category: 'Conta e Segurança',
    icon: <ShieldCheck className="w-4 h-4" />,
    question: 'Meus dados são seguros?',
    answer: 'Sim! Utilizamos criptografia de ponta a ponta, autenticação segura e políticas de segurança em nível de linha (RLS) no banco de dados. Isso garante que apenas você tenha acesso aos seus próprios dados. Nenhum outro usuário pode ver suas informações.'
  },
  {
    category: 'Conta e Segurança',
    icon: <Trash2 className="w-4 h-4" />,
    question: 'Posso excluir minha conta e todos os meus dados?',
    answer: 'Sim. Entre em contato com o suporte solicitando a exclusão da conta. Todos os seus dados pessoais serão removidos permanentemente dos nossos servidores em conformidade com a LGPD.'
  },
  {
    category: 'Conta e Segurança',
    icon: <Lock className="w-4 h-4" />,
    question: 'Como altero minha senha?',
    answer: 'Acesse Minha Conta (ícone no canto superior da tela inicial), role até a seção "Alterar Senha", digite a nova senha e confirme. A senha deve ter no mínimo 6 caracteres.'
  },

  // Módulo Saúde
  {
    category: 'Saúde',
    icon: <Heart className="w-4 h-4" />,
    question: 'O que posso acompanhar no módulo de Saúde?',
    answer: 'Você pode registrar: consumo de água (com horários programados), refeições (com fotos), treinos (tipo, duração, fotos e GPS), peso diário, medicações com lembretes, nível de energia, atividades do dia e exames médicos com análise automática de biomarcadores.'
  },
  {
    category: 'Saúde',
    icon: <Heart className="w-4 h-4" />,
    question: 'Como funciona o registro de refeições?',
    answer: 'Você pode configurar até 6 refeições por dia (café, lanche da manhã, almoço, lanche da tarde, jantar e ceia) com horários personalizados. Cada refeição pode ser marcada como concluída e você pode adicionar fotos do que comeu.'
  },
  {
    category: 'Saúde',
    icon: <Dumbbell className="w-4 h-4" />,
    question: 'Posso acompanhar meus treinos com GPS?',
    answer: 'Sim! O módulo de treinos inclui rastreamento de rota via GPS para atividades como corrida, caminhada e ciclismo. Você pode ver o percurso no mapa, distância, duração e adicionar fotos do treino.'
  },
  {
    category: 'Saúde',
    icon: <Heart className="w-4 h-4" />,
    question: 'Como funcionam os lembretes de medicação?',
    answer: 'Cadastre seus medicamentos com nome, dosagem e horários. O app enviará notificações push nos horários programados para você não esquecer de tomar. Você pode ativar/desativar notificações por módulo nas configurações.'
  },
  {
    category: 'Saúde',
    icon: <Heart className="w-4 h-4" />,
    question: 'O que é a Área Feminina?',
    answer: 'É um módulo dedicado ao acompanhamento da saúde reprodutiva feminina: ciclo menstrual (previsões, fases e sintomas), métodos contraceptivos (pílula, DIU, injeção), registros de intimidade com insights e calendário visual do ciclo.'
  },

  // Módulo Financeiro
  {
    category: 'Financeiro',
    icon: <DollarSign className="w-4 h-4" />,
    question: 'O que posso controlar no módulo Financeiro?',
    answer: 'Controle de receitas e despesas com centros de custo, saldo real por banco, reserva de emergência, investimentos com metas, operações de trade (pré e pós-operação), snapshots de criptomoedas e capacidade de investimento.'
  },
  {
    category: 'Financeiro',
    icon: <DollarSign className="w-4 h-4" />,
    question: 'Como funciona o controle de despesas recorrentes?',
    answer: 'Ao criar uma transação, marque-a como recorrente e defina o intervalo (semanal, mensal, anual). O app criará automaticamente as próximas ocorrências. Você pode marcar cada parcela como paga individualmente.'
  },
  {
    category: 'Financeiro',
    icon: <DollarSign className="w-4 h-4" />,
    question: 'Posso ter múltiplas contas bancárias?',
    answer: 'Sim! Cadastre quantas contas quiser, cada uma com seu saldo inicial. O app calcula automaticamente o saldo atualizado baseado nas transações vinculadas a cada conta.'
  },

  // Módulo Viagens
  {
    category: 'Viagens',
    icon: <Plane className="w-4 h-4" />,
    question: 'Como funciona o módulo de Viagens?',
    answer: 'Crie roteiros de viagem com destinos, hospedagem, voos, transportes, alimentação, documentos e agenda. Inclui checklist automático, timeline visual, controle de despesas com divisão entre participantes e recomendações inteligentes de destinos.'
  },
  {
    category: 'Viagens',
    icon: <Plane className="w-4 h-4" />,
    question: 'Posso compartilhar uma viagem com amigos?',
    answer: 'Sim! Convide amigos para a mesma viagem usando o código de amigo. Todos os participantes podem ver e editar o roteiro, e as despesas podem ser divididas automaticamente entre os membros.'
  },

  // Notificações
  {
    category: 'Notificações',
    icon: <Bell className="w-4 h-4" />,
    question: 'Como ativo as notificações push?',
    answer: 'Acesse Minha Conta → seção Notificações → clique em "Ativar Notificações". Permita o envio quando o navegador solicitar. Depois, ative/desative individualmente para cada módulo (medicação, hidratação, refeições, treinos, etc.).'
  },
  {
    category: 'Notificações',
    icon: <Bell className="w-4 h-4" />,
    question: 'Por que não estou recebendo notificações?',
    answer: 'Verifique: 1) Se as notificações estão ativadas em Minha Conta. 2) Se seu navegador tem permissão para enviar notificações. 3) Se as notificações do módulo específico estão habilitadas. 4) No iPhone, notificações push só funcionam se o app foi adicionado à tela inicial via Safari.'
  },

  // Social e Arena
  {
    category: 'Social',
    icon: <Users className="w-4 h-4" />,
    question: 'Como adiciono amigos no app?',
    answer: 'Vá em Amigos, digite o código de amigo da pessoa que deseja adicionar. Cada usuário tem um código único visível em Minha Conta. Após o envio, a pessoa precisa aceitar a solicitação.'
  },
  {
    category: 'Social',
    icon: <Users className="w-4 h-4" />,
    question: 'O que é a Arena?',
    answer: 'A Arena é um sistema de desafios em grupo! Crie ou entre em grupos com amigos para competir em pilares como treino, nutrição e hidratação. Inclui ranking, streaks, calendário compartilhado e feed de atividades com reações.'
  },

  // Astral
  {
    category: 'Astral',
    icon: <Star className="w-4 h-4" />,
    question: 'Como funciona o módulo Astral?',
    answer: 'Informe sua data, hora e local de nascimento para gerar seu mapa astral completo com signo solar, lunar e ascendente. Inclui horóscopo diário com IA, diário cósmico, leitura de tarot de 5 cartas, sinastria com outras pessoas e visualização dos planetas nas casas.'
  },

  // Libertação
  {
    category: 'Libertação',
    icon: <ShieldCheck className="w-4 h-4" />,
    question: 'O que é o módulo Libertação?',
    answer: 'Um módulo para ajudar você a se libertar de hábitos indesejados (cigarro, redes sociais, junk food, etc.). Registre gatilhos, cravings, estratégias de substituição e acompanhe seu progresso com streaks e estatísticas motivacionais.'
  },

  // Planos e Pagamentos
  {
    category: 'Planos',
    icon: <CreditCard className="w-4 h-4" />,
    question: 'O app é gratuito?',
    answer: 'O Vitalis Essence oferece funcionalidades gratuitas com limites. Para acesso completo a todos os módulos e funcionalidades premium, assine um dos planos disponíveis na página de Planos.'
  },
  {
    category: 'Planos',
    icon: <CreditCard className="w-4 h-4" />,
    question: 'Como assino um plano premium?',
    answer: 'Acesse a página de Planos através do Hub ou das configurações. Escolha o plano desejado e complete o pagamento. A ativação é imediata após a confirmação do pagamento.'
  },
  {
    category: 'Planos',
    icon: <CreditCard className="w-4 h-4" />,
    question: 'Posso cancelar minha assinatura?',
    answer: 'Sim, a qualquer momento. Acesse o portal do cliente através da página de Planos. O acesso premium continuará ativo até o final do período já pago.'
  },

  // Encontros & Rateios
  {
    category: 'Encontros',
    icon: <Users className="w-4 h-4" />,
    question: 'Como funciona o módulo de Encontros & Rateios?',
    answer: 'Organize encontros (jantares, churrascos, viagens, etc.) e divida as despesas entre os participantes. O app calcula automaticamente quem deve quanto para quem, considerando gastos individuais e compartilhados. Você pode adicionar participantes externos que não usam o app.'
  },

  // Profissional
  {
    category: 'Profissional',
    icon: <Star className="w-4 h-4" />,
    question: 'O que posso fazer no módulo Profissional?',
    answer: 'Gerencie oportunidades de emprego/negócio com acompanhamento de currículos, entrevistas, propostas e reuniões. Inclui checklists personalizados e radar de oportunidades para manter tudo organizado.'
  },
];

const categories = [...new Set(faqItems.map(item => item.category))];

export default function Support() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Geral');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sending, setSending] = useState(false);

  const filteredFAQ = faqItems.filter(item => item.category === activeCategory);

  const handleSendEmail = () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const subject = encodeURIComponent(contactSubject || 'Suporte Vitalis Essence');
    const body = encodeURIComponent(
      `Nome: ${contactName}\nEmail: ${contactEmail}\n\n${contactMessage}`
    );

    window.open(`mailto:suporte@vitalisessence.com?subject=${subject}&body=${body}`, '_blank');
    toast.success('Redirecionando para o seu app de email...');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hub">
        <div className="container mx-auto px-5 pt-6 pb-10">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/conta')}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-white text-xl font-bold">Suporte</h1>
          </div>
          <p className="text-white/60 text-sm ml-11">
            Encontre respostas ou entre em contato conosco
          </p>
        </div>
      </div>

      <div className="rounded-t-[2rem] -mt-6 bg-background relative z-10">
        <div className="container mx-auto px-5 pt-8 pb-10 space-y-6">

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Perguntas Frequentes</h2>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="space-y-2">
              {filteredFAQ.map((item, idx) => {
                const globalIdx = faqItems.indexOf(item);
                const isOpen = openIndex === globalIdx;
                return (
                  <motion.div
                    key={globalIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <span className="text-primary shrink-0">{item.icon}</span>
                      <span className="text-sm font-medium text-foreground flex-1">
                        {item.question}
                      </span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="px-4 pb-4"
                      >
                        <p className="text-muted-foreground text-sm leading-relaxed pl-7">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground text-lg">Fale com o Suporte</h2>
            </div>
            <p className="text-muted-foreground text-xs mb-5">
              Não encontrou sua resposta? Envie uma mensagem e responderemos o mais breve possível.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Nome *</label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Seu nome completo"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Email *</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="seu@email.com"
                  maxLength={255}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Assunto</label>
                <Input
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Resumo do problema"
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Mensagem *</label>
                <Textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Descreva sua dúvida ou problema em detalhes..."
                  rows={5}
                  maxLength={2000}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleSendEmail}
                disabled={!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          </motion.div>

          {/* Footer info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center space-y-2 pt-2"
          >
            <p className="text-muted-foreground text-xs">
              📧 suporte@vitalisessence.com
            </p>
            <p className="text-muted-foreground/60 text-[10px]">
              Respondemos em até 48 horas úteis
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}