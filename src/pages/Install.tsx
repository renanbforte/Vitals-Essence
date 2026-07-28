import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle2, ArrowLeft, Heart, DollarSign, Briefcase, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Heart, label: 'Saúde', color: 'from-[hsl(262,83%,58%)] to-[hsl(280,72%,40%)]' },
    { icon: DollarSign, label: 'Financeiro', color: 'from-emerald-500 to-teal-600' },
    { icon: Briefcase, label: 'Profissional', color: 'from-amber-500 to-orange-600' },
    { icon: Plane, label: 'Viagens', color: 'from-sky-500 to-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 flex flex-col items-center justify-center relative overflow-hidden">
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

        {/* Main card */}
        <Card className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-6">
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
            ) : isIOS ? (
              <div className="space-y-4">
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

                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar ao App
                </Button>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-gray-800">Instale o App</h2>
                  <p className="text-gray-500 text-sm mt-1">Acesso rápido direto da sua tela inicial</p>
                </div>
                <Button 
                  onClick={handleInstallClick}
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                >
                  <Download className="w-6 h-6 mr-2" />
                  Instalar Agora
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="ghost"
                  className="w-full h-12 text-gray-500 font-medium rounded-xl hover:bg-gray-100"
                >
                  Continuar no Navegador
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Smartphone className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                  <h2 className="text-lg font-bold text-gray-800">Instalar no Android</h2>
                </div>
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

        {/* Footer text */}
        <p className="text-center text-white/60 text-sm mt-6">
          Funciona offline • Atualizações automáticas
        </p>
      </motion.div>
    </div>
  );
};

export default Install;
