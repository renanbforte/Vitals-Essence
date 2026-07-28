// ============================================================================
// Install  —  TELA DE INSTALAÇÃO DO APP (rota "/install")
// ----------------------------------------------------------------------------
// Convida o usuário a instalar o Vitalis Essence como aplicativo no celular
// (PWA). Detecta se já está instalado, se é iPhone/iPad (mostra passo a passo
// do Safari) ou Android/desktop (mostra o botão "Instalar Agora").
// ============================================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, ArrowLeft, Heart, DollarSign, Briefcase, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Formato do evento que o navegador dispara quando o app pode ser instalado.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  // Guarda o "convite de instalação" do navegador para dispará-lo depois.
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Indica se o app já está instalado no aparelho.
  const [isInstalled, setIsInstalled] = useState(false);
  // Indica se o aparelho é iPhone/iPad (que precisa de passo a passo diferente).
  const [isIOS, setIsIOS] = useState(false);
  // Ferramenta para navegar entre telas.
  const navigate = useNavigate();

  // Ao abrir a tela: descobre o estado do aparelho e fica ouvindo o navegador.
  useEffect(() => {
    // Se o app já está rodando em modo "aplicativo" (standalone), marca como instalado.
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Verifica pelo tipo do aparelho se é um iPhone/iPad.
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Quando o navegador avisa que o app pode ser instalado, guardamos o convite
    // (e cancelamos o aviso automático para mostrarmos nosso próprio botão).
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Ao sair da tela, para de ouvir o aviso do navegador (limpeza).
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Acionado pelo botão "Instalar Agora": abre o convite oficial do navegador.
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra a janela de instalação e espera a decisão do usuário.
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // Se o usuário aceitou, marca como instalado.
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Os 4 módulos do app exibidos como ícones coloridos (Saúde, Financeiro, etc.).
  const features = [
    { icon: Heart, label: 'Saúde', color: 'from-[hsl(262,83%,58%)] to-[hsl(280,72%,40%)]' },
    { icon: DollarSign, label: 'Financeiro', color: 'from-emerald-500 to-teal-600' },
    { icon: Briefcase, label: 'Profissional', color: 'from-amber-500 to-orange-600' },
    { icon: Plane, label: 'Viagens', color: 'from-sky-500 to-blue-600' },
  ];

  return (
    // Fundo azul em degradê que ocupa a tela inteira e centraliza o conteúdo.
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Círculos decorativos desfocados ao fundo (apenas enfeite visual) */}
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-300/20 rounded-full blur-xl" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo e título do app, com animação de entrada */}
        {/* Logo and title */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto w-28 h-28 mb-4 rounded-3xl overflow-hidden shadow-2xl"
          >
            <img src="/pwa-512x512.png" alt="Vitalis Essence" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-wide uppercase">Vitalis Essence</h1>
          <p className="text-white/80 text-lg">Vida em funcionamento</p>
        </div>

        {/* Fileira de ícones dos 4 módulos, cada um surgindo em sequência */}
        {/* Feature icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mb-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/70 text-xs mt-1">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Cartão branco central: seu conteúdo muda conforme a situação do aparelho */}
        {/* Main card */}
        <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            {/* CASO 1 — App já instalado: mostra confirmação e botão "Abrir App" */}
            {isInstalled ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">App Instalado!</h2>
                <p className="text-gray-500 mb-6">
                  O app está pronto na sua tela inicial
                </p>
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Abrir App
                </Button>
              </motion.div>
            /* CASO 2 — iPhone/iPad: mostra o passo a passo manual pelo Safari */
            ) : isIOS ? (
              <div className="space-y-4">
                {/* Título da instrução para iOS */}
                <div className="text-center mb-4">
                  <Smartphone className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                  <h2 className="text-lg font-bold text-gray-800">Instalar no iPhone/iPad</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Siga os passos abaixo no Safari
                  </p>
                </div>

                {/* Visual Safari Share Icon */}
                <div className="flex justify-center mb-2">
                  <div className="bg-gray-100 rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Procure este ícone:</span>
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        <rect x="4" y="14" width="16" height="6" rx="1" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Lista numerada dos 4 passos para instalar pelo Safari */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 space-y-4">
                  {[
                    {
                      step: 1,
                      text: 'Abra no Safari',
                      highlight: 'Este app só pode ser instalado pelo Safari',
                      icon: '🌐'
                    },
                    { 
                      step: 2, 
                      text: 'Toque no botão Compartilhar', 
                      highlight: 'Ícone no rodapé da tela (quadrado com seta ↑)',
                      icon: '📤'
                    },
                    { 
                      step: 3, 
                      text: 'Role a lista de opções', 
                      highlight: 'Procure "Adicionar à Tela Inicial"',
                      icon: '📱'
                    },
                    { 
                      step: 4, 
                      text: 'Toque em "Adicionar"', 
                      highlight: 'O app aparecerá na sua tela inicial',
                      icon: '✅'
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                        {item.step}
                      </div>
                      <div className="pt-1 flex-1">
                        <p className="text-gray-800 font-medium flex items-center gap-2">
                          <span>{item.icon}</span> {item.text}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">{item.highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Important note for iOS */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-800 text-xs text-center">
                    ⚠️ <strong>Importante:</strong> No iPhone, você precisa usar o navegador <strong>Safari</strong> para instalar o app. Chrome e outros navegadores não suportam instalação.
                  </p>
                </div>

                {/* Botão para voltar ao app sem instalar */}
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar ao App
                </Button>
              </div>
            /* CASO 3 — Navegador aceita instalação direta: mostra botão "Instalar Agora" */
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Instale o App</h2>
                  <p className="text-gray-500 text-sm mt-1">Acesso rápido direto da sua tela inicial</p>
                </div>
                {/* Botão principal que dispara a instalação do app */}
                <Button
                  onClick={handleInstallClick}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                >
                  <Download className="w-6 h-6 mr-2" />
                  Instalar Agora
                </Button>
                {/* Alternativa: seguir usando pelo navegador, sem instalar */}
                <Button
                  onClick={() => navigate('/')}
                  variant="ghost"
                  className="w-full h-12 text-gray-500 font-medium rounded-xl hover:bg-gray-100"
                >
                  Continuar no Navegador
                </Button>
              </div>
            /* CASO 4 (padrão) — Android/outros: mostra passo a passo pelo menu do navegador */
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Smartphone className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                  <h2 className="text-lg font-bold text-gray-800">Instalar no Android</h2>
                </div>
                {/* Lista dos 2 passos para instalar pelo menu do navegador Android */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 space-y-3">
                  {[
                    { step: 1, text: 'Toque no menu do navegador', highlight: '(⋮ três pontos)' },
                    { step: 2, text: 'Selecione', highlight: '"Instalar aplicativo"' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <p className="text-gray-600 text-sm pt-1">
                        {item.text} <span className="font-semibold text-gray-800">{item.highlight}</span>
                      </p>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar ao App
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé com os benefícios do app instalado */}
        {/* Footer text */}
        <p className="text-center text-white/60 text-sm mt-6">
          Funciona offline • Atualizações automáticas
        </p>
      </motion.div>
    </div>
  );
};

export default Install;
