// ============================================================================
// FinanceHero — Cabeçalho de resumo do Financeiro
// ----------------------------------------------------------------------------
// Card de destaque no topo do módulo: mostra o Saldo Real grande sobre o
// gradiente verde do tema (como pede o guia de marca) e, abaixo, três chips de
// vidro translúcido com os números do mês, do patrimônio e da reserva.
// ============================================================================
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/finance';

interface FinanceHeroProps {
  realBalance: number;   // saldo real total (bancos + pagos/recebidos)
  monthBalance: number;  // saldo do mês (entradas - saídas do mês)
  patrimony: number;     // total investido
  reserve: number;       // reserva de emergência
}

// Um chip de vidro com rótulo e valor, usado na faixa inferior do hero.
function HeroStat({ icon: Icon, label, value, positive }: {
  icon: React.ElementType; label: string; value: number; positive?: boolean;
}) {
  return (
    <div className="flex-1 rounded-2xl bg-white/15 backdrop-blur-sm px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1.5 text-white/80">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="text-[10px] font-semibold uppercase tracking-wide truncate">{label}</span>
      </div>
      <p className="text-sm font-extrabold text-white tabular-nums truncate mt-0.5">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function FinanceHero({ realBalance, monthBalance, patrimony, reserve }: FinanceHeroProps) {
  const monthUp = monthBalance >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="gradient-finance rounded-3xl p-5 shadow-lg shadow-[hsl(var(--finance))]/20"
    >
      {/* Saldo real em destaque (texto branco sobre o gradiente) */}
      <div className="flex items-center gap-2 text-white/80">
        <Wallet className="w-4 h-4" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">Saldo real</span>
      </div>
      <p className="text-4xl font-extrabold text-white tabular-nums mt-1 tracking-tight">
        {formatCurrency(realBalance)}
      </p>
      <div className="flex items-center gap-1 mt-1 text-white/80 text-xs font-medium">
        {monthUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        <span>{monthUp ? '+' : ''}{formatCurrency(monthBalance)} neste mês</span>
      </div>

      {/* Faixa de chips: mês, patrimônio e reserva */}
      <div className="flex gap-2 mt-4">
        <HeroStat icon={monthUp ? ArrowUpRight : ArrowDownRight} label="Este mês" value={monthBalance} />
        <HeroStat icon={TrendingUp} label="Patrimônio" value={patrimony} />
        <HeroStat icon={PiggyBank} label="Reserva" value={reserve} />
      </div>
    </motion.div>
  );
}
