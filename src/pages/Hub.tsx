// ============================================================================
// Hub  —  TELA INICIAL / MENU DE MÓDULOS (rota principal "/")
// ----------------------------------------------------------------------------
// Vitrine do super-app. Mostra os módulos (Saúde, Financeiro, etc.) num carrossel
// deslizável com imagem grande. O usuário arrasta para escolher, toca para entrar,
// pode ativar teste grátis de 14 dias e alternar entre "todos" e "só os meus".
// ============================================================================

// Ferramenta para navegar entre telas
import { useNavigate } from 'react-router-dom';
// Ícones usados na tela
import { Heart, DollarSign, Briefcase, Sparkles, Plane, ShoppingCart, LogOut, Lock, PartyPopper, Leaf, Info, X, Users, Flower2, Star, Crown, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, FREE_MODULES } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';
import logo from '@/assets/logo-ve.png';
import heroSaude from '@/assets/hero-saude.png';
import heroFinanceiro from '@/assets/hero-financeiro.png';
import heroProfissional from '@/assets/hero-profissional.png';
import heroVidaPessoal from '@/assets/hero-vida-pessoal.png';
import heroViagens from '@/assets/hero-viagens.png';
import heroCompras from '@/assets/hero-compras.png';
import heroEncontros from '@/assets/hero-encontros.png';
import heroLibertacao from '@/assets/hero-libertacao.png';
import heroFeminino from '@/assets/hero-feminino.png';
import heroAstral from '@/assets/hero-astral.png';

// Lista de todos os módulos do app. Cada item define o nome, a descrição curta,
// o ícone, a cor, a imagem de fundo, a rota de destino e o texto de detalhes.
// Para adicionar/editar um módulo, basta alterar esta lista.
const modules = [
  {
    id: 'saude',
    title: 'Saúde',
    subtitle: 'Diário, Progresso & Exames',
    icon: Heart,
    route: '/saude',
    active: true,
    color: 'hsl(262, 83%, 58%)',
    hero: heroSaude,
    info: 'Controle diário de alimentação, hidratação, treinos, peso, medicamentos e exames. Acompanhe seu progresso com gráficos, fotos e calendário de performance.',
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    subtitle: 'Controle financeiro pessoal',
    icon: DollarSign,
    route: '/financeiro',
    active: true,
    color: 'hsl(152, 68%, 42%)',
    hero: heroFinanceiro,
    info: 'Gerencie entradas e saídas com recorrência automática, acompanhe saldos bancários, patrimônio investido, trade de criptomoedas e centros de custo.',
  },
  {
    id: 'profissional',
    title: 'Profissional',
    subtitle: 'Carreira & desenvolvimento',
    icon: Briefcase,
    route: '/profissional',
    active: true,
    color: 'hsl(38, 92%, 50%)',
    hero: heroProfissional,
    info: 'Painel de evolução profissional: score diário, estudos, competências e radar de oportunidades.',
  },
  {
    id: 'tarefas',
    title: 'Vida Pessoal',
    subtitle: 'Tarefas, rotinas & equilíbrio',
    icon: Sparkles,
    route: '/tarefas',
    active: true,
    color: 'hsl(330, 80%, 55%)',
    hero: heroVidaPessoal,
    info: 'Organize tarefas por área da vida, defina recorrências, gerencie energia e mantenha o equilíbrio entre compromissos e autocuidado.',
  },
  {
    id: 'viagens',
    title: 'Viagens',
    subtitle: 'Roteiros & aventuras',
    icon: Plane,
    route: '/viagens',
    active: true,
    color: 'hsl(199, 89%, 48%)',
    hero: heroViagens,
    info: 'Planeje viagens completas com destinos, hospedagens, transportes, atividades e rateio de despesas entre participantes.',
  },
  {
    id: 'lista-compras',
    title: 'Lista de Compras',
    subtitle: 'Controle inteligente de preços',
    icon: ShoppingCart,
    route: '/lista-compras',
    active: true,
    color: 'hsl(25, 95%, 53%)',
    hero: heroCompras,
    info: 'Crie listas de compras inteligentes com histórico de preços, comparação entre estabelecimentos e templates reutilizáveis.',
  },
  {
    id: 'encontros',
    title: 'Encontros',
    subtitle: 'Rateios & eventos com amigos',
    icon: PartyPopper,
    route: '/encontros',
    active: true,
    color: 'hsl(340, 82%, 52%)',
    hero: heroEncontros,
    info: 'Organize encontros com amigos, registre despesas compartilhadas e faça rateios justos automaticamente.',
  },
  {
    id: 'libertacao',
    title: 'Libertação',
    subtitle: 'Retome o controle, no seu ritmo',
    icon: Leaf,
    route: '/libertacao',
    active: true,
    color: 'hsl(170, 60%, 42%)',
    hero: heroLibertacao,
    info: 'Acompanhe hábitos que deseja mudar sem julgamento. Registre momentos de vontade, use estratégias personalizadas e veja seu progresso real.',
  },
  {
    id: 'feminino',
    title: 'Saúde Reprodutiva',
    subtitle: 'Ciclo, fases & bem-estar',
    icon: Flower2,
    route: '/feminino',
    active: true,
    color: 'hsl(340, 65%, 55%)',
    hero: heroFeminino,
    info: 'Acompanhe seu ciclo menstrual com previsões inteligentes, registro de sintomas, fases do ciclo e dicas personalizadas de bem-estar para cada fase.',
  },
  {
    id: 'astral',
    title: 'Astral',
    subtitle: 'Horóscopo & mapa natal',
    icon: Star,
    route: '/astral',
    active: true,
    color: 'hsl(270, 70%, 55%)',
    hero: heroAstral,
    info: 'Descubra seu mapa astral completo, horóscopo diário personalizado por IA, leituras de tarot e compatibilidade entre signos.',
  },
];

// Componente principal da tela inicial (Hub).
export default function Hub() {
  const navigate = useNavigate();          // para navegar entre telas
  const { signOut } = useAuth();           // função de sair da conta
  // Controle de assinatura: verifica acesso, teste grátis (trial) e dias restantes
  const { hasModuleAccess, hasTrial, getTrialDaysLeft, startTrial } = useSubscription();
  const [startingTrial, setStartingTrial] = useState(false); // se está ativando um teste grátis

  // Alternância "mostrar todos os módulos" x "só os meus" — lembra a escolha do usuário (localStorage)
  const [showAllModules, setShowAllModules] = useState(() => {
    const saved = localStorage.getItem('hub-show-all-modules');
    return saved === null ? true : saved === 'true';
  });
  const [showInfo, setShowInfo] = useState(false); // se a tela de detalhes do módulo está aberta

  // Lista de módulos exibidos: todos, ou só os gratuitos/contratados/em teste
  const visibleModules = useMemo(() => {
    if (showAllModules) return modules;
    return modules.filter(m => FREE_MODULES.includes(m.id) || hasModuleAccess(m.id) || hasTrial(m.id));
  }, [showAllModules, hasModuleAccess, hasTrial]);

  // Módulo atualmente selecionado no carrossel — recupera o último visto (localStorage)
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const saved = localStorage.getItem('hub-selected-module');
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < visibleModules.length) return idx;
    }
    return 0;
  });

  // Configura o carrossel deslizável (biblioteca Embla): dá loop se houver mais de um módulo
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: visibleModules.length > 1,
    align: 'center',
    skipSnaps: false,
  });

  // Quando o carrossel troca de slide: atualiza o módulo selecionado e fecha os detalhes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setShowInfo(false);
  }, [emblaApi]);

  // Ao montar/reagir: posiciona o carrossel no último módulo salvo e "escuta" as trocas de slide
  useEffect(() => {
    if (!emblaApi) return;
    const saved = localStorage.getItem('hub-selected-module');
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < visibleModules.length) {
        emblaApi.scrollTo(idx, true);
      }
    }
    onSelect();
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect, visibleModules.length]);

  // Salva o módulo selecionado, para reabrir nele na próxima visita
  useEffect(() => {
    localStorage.setItem('hub-selected-module', String(selectedIndex));
  }, [selectedIndex]);

  // Salva a preferência do botão "Todos / Meus"
  useEffect(() => {
    localStorage.setItem('hub-show-all-modules', String(showAllModules));
  }, [showAllModules]);

  // Se a lista de módulos encolher e o índice ficar inválido, volta para o primeiro
  useEffect(() => {
    if (selectedIndex >= visibleModules.length) {
      setSelectedIndex(0);
      emblaApi?.scrollTo(0, true);
    }
  }, [visibleModules.length, selectedIndex, emblaApi]);

  // Move o carrossel para um módulo específico
  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  // Módulo em destaque no momento
  const currentModule = visibleModules[selectedIndex] || visibleModules[0];

  // Ao "entrar" num módulo: se não estiver liberado, leva à tela de planos; senão, abre o módulo
  const handleEnter = () => {
    if (!currentModule.active) return;
    if (!hasModuleAccess(currentModule.id)) {
      navigate('/planos');
      return;
    }
    navigate(currentModule.route);
  };

  // Referências para distinguir um "toque" (entrar) de um "arraste" (trocar de módulo)
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const navDrag = useRef<{ startX: number; startIndex: number; moved: boolean } | null>(null);

  // Registra onde e quando o dedo/mouse tocou a tela
  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  // Ao soltar: se mal se moveu e foi rápido, entende como toque e entra no módulo
  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    const dt = Date.now() - pointerStart.current.time;
    // Se moveu menos de 10px e durou menos de 300ms → é um toque
    if (dx < 10 && dy < 10 && dt < 300) {
      handleEnter();
    }
    pointerStart.current = null;
  };

  // --- APARÊNCIA DA TELA (o que o usuário vê) ---
  return (
    <div className="h-[100dvh] bg-background relative flex flex-col overflow-hidden">
      {/* Brilho de fundo que muda de cor conforme o módulo em destaque (decorativo) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          key={currentModule.id + '-glow'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 0.6 }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ background: currentModule.color }}
        />
      </div>

      {/* Barra superior: logo (leva à conta) à esquerda e botões de ação à direita */}
      <div className="relative md:relative z-20 container mx-auto px-5 pt-5 pb-2 flex items-center justify-between">
        {/* Logo + nome do app; ao clicar, abre a tela da conta */}
        <button onClick={() => navigate('/conta')} className="flex items-center gap-3 group">
           <img src={logo} alt="Vitalis Essence" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
          <span className="text-muted-foreground font-bold text-xs tracking-[0.2em] uppercase group-hover:text-foreground transition-colors">Vitalis Essence</span>
        </button>
        {/* Grupo de botões de ação da barra superior */}
        <div className="flex items-center gap-1">
          {/* Botão que alterna entre mostrar "Todos" os módulos ou só os "Meus" */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllModules(prev => !prev)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl h-8 px-2.5 gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
            title={showAllModules ? 'Mostrar só meus módulos' : 'Mostrar todos os módulos'}
          >
            {showAllModules ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showAllModules ? 'Todos' : 'Meus'}
          </Button>
          {/* Botão coroa: abre a tela de planos/assinatura */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/planos')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl w-9 h-9"
          >
            <Crown className="w-4 h-4" />
          </Button>
          {/* Botão amigos: abre a tela de Amigos */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/friends')}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl w-9 h-9"
          >
            <Users className="w-4 h-4" />
          </Button>
          {/* Botão sair: encerra a sessão (logout) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl w-9 h-9"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Área da imagem grande do módulo (ocupa a tela no celular, contida no desktop) */}
      <div className="flex-1 relative z-10 flex flex-col min-h-0">
        <div
          className="flex-1 relative mx-3 md:mx-auto md:max-w-2xl md:w-full rounded-3xl overflow-hidden group shadow-2xl"
          style={{
            boxShadow: `0 20px 60px -15px ${currentModule.color}50`,
          }}
        >
          {/* Imagem do módulo em destaque, com transição suave ao trocar */}
          <AnimatePresence mode="wait">
            <motion.img
              key={currentModule.id}
              src={currentModule.hero}
              alt={currentModule.title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>

          {/* Escurecimento na parte de baixo da imagem, para o texto ficar legível */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Sobre a imagem: nome do módulo, selos de status e sua descrição curta */}
          <div className="absolute bottom-0 inset-x-0 p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentModule.id + '-info'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">
                    {currentModule.title}
                  </h2>
                  {/* Selo "Em breve" quando o módulo ainda não está disponível */}
                  {!currentModule.active && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/60 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" />
                      Em breve
                    </span>
                  )}
                  {/* Selo com os dias restantes quando o módulo está em período de teste */}
                  {currentModule.active && !FREE_MODULES.includes(currentModule.id) && hasTrial(currentModule.id) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <Clock className="w-3 h-3" />
                      {getTrialDaysLeft(currentModule.id)} dias restantes
                    </span>
                  )}
                  {/* Botão "14 dias grátis": ativa o teste quando o módulo é pago e ainda não foi liberado */}
                  {currentModule.active && !hasModuleAccess(currentModule.id) && !FREE_MODULES.includes(currentModule.id) && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setStartingTrial(true);
                        const ok = await startTrial(currentModule.id);
                        setStartingTrial(false);
                        if (ok) {
                          toast.success('Trial de 14 dias ativado! Aproveite 🎉');
                        } else {
                          toast.error('Não foi possível ativar o trial');
                        }
                      }}
                      disabled={startingTrial}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full hover:bg-white/30 transition-all shadow-lg shadow-black/10 border border-white/10"
                    >
                      <Sparkles className="w-3 h-3" />
                      {startingTrial ? 'Ativando...' : '14 dias grátis'}
                    </button>
                  )}
                </div>
                <p className="text-white/60 text-sm">
                  {currentModule.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Botão "i" (canto superior esquerdo): abre/fecha os detalhes do módulo */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowInfo(v => !v); }}
            className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            {showInfo ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </button>

          {/* Tela de detalhes (sobreposta): ícone, título e descrição completa do módulo */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-10 bg-black/75 backdrop-blur-sm flex items-center justify-center p-8"
                onClick={() => setShowInfo(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="text-center max-w-xs"
                >
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: currentModule.color }}>
                    <currentModule.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2">{currentModule.title}</h3>
                  <p className="text-white/80 text-sm leading-relaxed">{currentModule.info}</p>
                  {!currentModule.active && (
                    <p className="text-white/50 text-xs mt-3 font-semibold uppercase tracking-wider">Em breve</p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Etiqueta "Acessar →" / "Testar grátis →" que aparece ao passar o mouse (desktop) */}
          {currentModule.active && !showInfo && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {hasModuleAccess(currentModule.id) ? 'Acessar →' : 'Testar grátis →'}
            </div>
          )}
        </div>

        {/* Camada invisível sobre a imagem que captura os gestos: toque entra, arraste troca de módulo */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          ref={emblaRef}
          style={{ touchAction: 'pan-y' }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className="flex h-full">
            {visibleModules.map((mod) => (
              <div key={mod.id} className="min-w-0 shrink-0 grow-0 basis-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Navegação inferior por ícones (estilo "carrossel giratório"): mostra os módulos em fila e pode ser arrastada */}
      <div className="relative z-20 py-4 pb-8 overflow-hidden">
        <div
          className="relative flex items-center justify-center h-20 touch-none select-none"
          onPointerDown={(e) => {
            navDrag.current = { startX: e.clientX, startIndex: selectedIndex, moved: false };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!navDrag.current) return;
            const dx = e.clientX - navDrag.current.startX;
            if (Math.abs(dx) > 8) navDrag.current.moved = true;
            const SPACING = 56;
            const steps = Math.round(-dx / SPACING);
            const total = visibleModules.length;
            const newIndex = ((navDrag.current.startIndex + steps) % total + total) % total;
            if (newIndex !== selectedIndex) {
              scrollTo(newIndex);
            }
          }}
          onPointerUp={() => {
            if (navDrag.current?.moved) {
              // Sync Embla carousel to the current selectedIndex so it stays in place
              emblaApi?.scrollTo(selectedIndex, true);
            }
            navDrag.current = null;
          }}
          onPointerCancel={() => { navDrag.current = null; }}
        >
          {/* Para cada módulo, calcula sua posição, tamanho e transparência conforme a distância do centro */}
          {visibleModules.map((mod, index) => {
            const isActive = index === selectedIndex;
            const total = visibleModules.length;
            let offset = index - selectedIndex;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;
            const SPACING = 56;
            const x = offset * SPACING;
            const absOffset = Math.abs(offset);
            const scale = absOffset === 0 ? 1.25 : absOffset === 1 ? 0.9 : absOffset === 2 ? 0.7 : 0.55;
            const opacity = absOffset === 0 ? 1 : absOffset === 1 ? 0.6 : absOffset === 2 ? 0.35 : 0.15;

            return (
              <motion.button
                key={mod.id}
                onClick={() => {
                  if (!navDrag.current?.moved) scrollTo(index);
                }}
                className="absolute flex flex-col items-center"
                animate={{
                  x,
                  scale,
                  opacity,
                  zIndex: total - absOffset,
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                aria-label={mod.title}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
                  style={{
                    background: isActive ? mod.color : 'hsl(var(--muted))',
                    boxShadow: isActive ? `0 6px 20px -4px ${mod.color}60` : 'none',
                  }}
                >
                  <mod.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <motion.span
                  animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.5 }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-bold text-foreground tracking-wide mt-1 whitespace-nowrap"
                >
                  {mod.title}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
