import { Droplets, Apple, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DailyTracking } from '@/hooks/useDailyTracking';
import type { WeightEntry } from '@/hooks/useWeightHistory';

interface SummaryCardsProps {
  tracking: DailyTracking | null;
  latestWeight: WeightEntry | null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function SummaryCards({ tracking, latestWeight }: SummaryCardsProps) {
  const waterLiters = ((tracking?.water_ml || 0) / 1000).toFixed(1);
  const mealsCompleted = [
    tracking?.breakfast_completed, tracking?.morning_snack_completed,
    tracking?.lunch_completed, tracking?.afternoon_snack_completed,
    tracking?.dinner_completed, tracking?.night_snack_completed,
  ].filter(Boolean).length;

  const items = [
    {
      icon: Droplets,
      label: 'Água Hoje',
      value: `${waterLiters}L`,
      gradient: 'gradient-water',
      bg: 'bg-water/5',
      border: 'border-water/15',
      text: 'text-water',
    },
    {
      icon: Apple,
      label: 'Refeições',
      value: `${mealsCompleted}/6`,
      gradient: 'gradient-meals',
      bg: 'bg-meals/5',
      border: 'border-meals/15',
      text: 'text-meals',
    },
    {
      icon: Scale,
      label: 'Peso Atual',
      value: latestWeight ? `${latestWeight.weight_kg}kg` : '--',
      gradient: 'gradient-weight',
      bg: 'bg-accent/5',
      border: 'border-accent/15',
      text: 'text-accent',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={cardVariants}
          className={`rounded-2xl p-4 border ${item.bg} ${item.border} text-center`}
        >
          <div className={`w-10 h-10 rounded-xl ${item.gradient} flex items-center justify-center mx-auto mb-2 shadow-md`}>
            <item.icon className="w-5 h-5 text-white" />
          </div>
          <p className={`text-xl font-extrabold ${item.text}`}>{item.value}</p>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
