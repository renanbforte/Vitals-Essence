// ============================================================================
// COMPONENTE: MealsCard (Cartão de Alimentação)
// Cartão do plano nutricional do dia. No topo mostra um gráfico em formato de
// pizza com as refeições concluídas e as calorias consumidas; abaixo, a lista de
// refeições que podem ser marcadas como feitas, expandidas para ver os detalhes
// (opção principal e alternativa), fotografadas e editadas.
// ============================================================================
import { UtensilsCrossed, Check, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { DailyTracking } from '@/hooks/useDailyTracking';
import type { UserMealPlan } from '@/hooks/useUserMealPlans';
import type { MealPhoto } from '@/hooks/useMealPhotos';
import type { UserWorkoutPlan } from '@/hooks/useUserWorkoutPlans';
import { EditMealDialog } from './EditMealDialog';
import { PhotoUploadButton } from './PhotoUploadButton';

interface MealsCardProps {
  tracking: DailyTracking | null;
  onToggleMeal: (meal: keyof DailyTracking) => void;
  mealPlans: UserMealPlan[];
  onSaveMealPlan: (meal: UserMealPlan) => Promise<{ error: Error | null }>;
  mealPhotos?: MealPhoto[];
  onUploadMealPhoto?: (mealKey: string, file: File) => Promise<{ error: Error | null }>;
  onDeleteMealPhoto?: (mealKey: string) => Promise<{ error: Error | null }>;
  uploadingPhoto?: boolean;
}

// De/Para: liga a "chave" de cada refeição ao campo correspondente no registro
// diário que guarda se aquela refeição foi concluída (ex.: 'lunch' -> 'lunch_completed')
const mealKeyToTrackingKey: Record<string, keyof DailyTracking> = {
  'breakfast': 'breakfast_completed',
  'morning_snack': 'morning_snack_completed',
  'lunch': 'lunch_completed',
  'afternoon_snack': 'afternoon_snack_completed',
  'dinner': 'dinner_completed',
  'night_snack': 'night_snack_completed',
};

// Nomes curtos de cada refeição, usados como rótulos dentro do gráfico de pizza
// (o "\n" quebra o texto em duas linhas, ex.: "Lanche" na primeira e "Manhã" na segunda)
const mealShortNames: Record<string, string> = {
  'breakfast': 'Café',
  'morning_snack': 'Lanche\nManhã',
  'lunch': 'Almoço',
  'afternoon_snack': 'Lanche\nTarde',
  'dinner': 'Jantar',
  'night_snack': 'Ceia',
};

// Sub-componente que desenha o gráfico de pizza (rosca) das refeições:
// cada fatia é uma refeição, colorida quando concluída, com o total no centro.
// Pizza/Pie chart visualization for meals
function MealPizza({ meals, tracking }: { meals: UserMealPlan[]; tracking: DailyTracking | null }) {
  // Medidas e geometria do gráfico: quantidade de fatias, ângulo de cada uma,
  // centro (cx, cy) e raios externo/interno da rosca.
  const totalMeals = meals.length;
  const sliceAngle = totalMeals > 0 ? 360 / totalMeals : 360;
  const cx = 100;
  const cy = 100;
  const outerR = 85;
  const innerR = 30;
  // Refeições ordenadas pelo horário (recalculado só quando a lista muda)
  const sortedMeals = useMemo(() => [...meals].sort((a, b) => a.meal_time.localeCompare(b.meal_time)), [meals]);
  // Quantas refeições já foram marcadas como concluídas
  const completedCount = meals.filter(m => tracking?.[mealKeyToTrackingKey[m.meal_key]]).length;

  // Soma as calorias apenas das refeições concluídas (energia já consumida)
  const totalCalories = useMemo(() => {
    return sortedMeals.reduce((sum, m) => {
      const isCompleted = tracking?.[mealKeyToTrackingKey[m.meal_key]];
      if (isCompleted) return sum + (m.main_macros?.calories || 0);
      return sum;
    }, 0);
  }, [sortedMeals, tracking]);

  // Soma as calorias de TODAS as refeições planejadas (meta total do dia)
  const totalPlannedCalories = useMemo(() => {
    return sortedMeals.reduce((sum, m) => sum + (m.main_macros?.calories || 0), 0);
  }, [sortedMeals]);

  // Se não há refeições, não desenha nada
  if (totalMeals === 0) return null;

  // Converte um ângulo (em graus) em coordenadas x/y sobre o círculo — usado para desenhar as fatias
  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Monta o "caminho" (path SVG) que desenha o formato de uma fatia da rosca
  function describeSlice(index: number, outerRadius: number, innerRadius: number) {
    const startAngle = index * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    const gap = 1.5; // gap between slices in degrees

    const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle + gap);
    const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle - gap);
    const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle - gap);
    const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle + gap);
    const largeArc = sliceAngle - gap * 2 > 180 ? 1 : 0;

    return `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y} Z`;
  }

  // Position for emoji label in the middle of each slice
  function getEmojiPosition(index: number) {
    const midAngle = index * sliceAngle + sliceAngle / 2;
    const labelR = (outerR + innerR) / 2;
    return polarToCartesian(cx, cy, labelR, midAngle);
  }

  // Paleta de cores (degradês) para as fatias concluídas — tons quentes de comida
  // Gradient colors for completed slices (from outer to inner, warm food tones)
  const sliceColors = [
    { from: 'hsl(25, 95%, 55%)', to: 'hsl(35, 90%, 60%)' },   // warm orange
    { from: 'hsl(340, 75%, 55%)', to: 'hsl(350, 70%, 65%)' },  // berry red
    { from: 'hsl(45, 90%, 55%)', to: 'hsl(50, 85%, 65%)' },    // golden
    { from: 'hsl(150, 60%, 45%)', to: 'hsl(160, 55%, 55%)' },  // fresh green
    { from: 'hsl(280, 60%, 55%)', to: 'hsl(290, 55%, 65%)' },  // plum
    { from: 'hsl(200, 70%, 50%)', to: 'hsl(210, 65%, 60%)' },  // cool blue
  ];

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            {sortedMeals.map((_, i) => (
              <linearGradient key={`grad-${i}`} id={`sliceGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={sliceColors[i % sliceColors.length].from} />
                <stop offset="100%" stopColor={sliceColors[i % sliceColors.length].to} />
              </linearGradient>
            ))}
            <filter id="sliceGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Empty slices (background) */}
          {sortedMeals.map((_, i) => (
            <path key={`bg-${i}`} d={describeSlice(i, outerR, innerR)}
              fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          ))}

          {/* Completed slices */}
          {sortedMeals.map((meal, i) => {
            const isCompleted = !!tracking?.[mealKeyToTrackingKey[meal.meal_key]];
            return (
              <motion.path
                key={`fill-${i}`}
                d={describeSlice(i, outerR, innerR)}
                fill={isCompleted ? `url(#sliceGrad${i})` : 'transparent'}
                filter={isCompleted ? 'url(#sliceGlow)' : undefined}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isCompleted ? 0.9 : 0, scale: isCompleted ? 1 : 0.8 }}
                transition={{ duration: 0.5, delay: i * 0.08, type: 'spring', stiffness: 200 }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            );
          })}

          {/* Meal name labels */}
          {sortedMeals.map((meal, i) => {
            const pos = getEmojiPosition(i);
            const isCompleted = !!tracking?.[mealKeyToTrackingKey[meal.meal_key]];
            const label = mealShortNames[meal.meal_key] || meal.meal_name;
            const lines = label.split('\n');
            return (
              <g key={`label-${i}`}>
                {lines.map((line, li) => (
                  <text key={li} x={pos.x} y={pos.y + (li - (lines.length - 1) / 2) * 10}
                    textAnchor="middle" dominantBaseline="central"
                    fill={isCompleted ? 'white' : 'rgba(255,255,255,0.35)'}
                    fontSize="8" fontWeight={isCompleted ? '700' : '600'}
                    style={{ transition: 'fill 0.3s' }}>
                    {line}
                  </text>
                ))}
              </g>
            );
          })}

          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="22" fontWeight="800">{completedCount}/{totalMeals}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="central"
            fill="rgba(255,255,255,0.5)" fontSize="9" fontWeight="600">refeições</text>
        </svg>
      </div>

      <div className="text-center -mt-1">
        <motion.p className="text-lg font-bold text-white" key={totalCalories}
          initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
          {totalCalories} <span className="text-sm font-normal text-white/60">/ {totalPlannedCalories} kcal</span>
        </motion.p>
        <p className="text-white/40 text-[10px]">energia consumida</p>
      </div>
    </div>
  );
}

// Componente principal do cartão. Recebe: o registro do dia (tracking), a função
// para marcar/desmarcar uma refeição, o plano de refeições, a função de salvar
// edição, além das fotos e das funções de enviar/apagar foto de cada refeição.
export function MealsCard({
  tracking, onToggleMeal, mealPlans, onSaveMealPlan,
  mealPhotos = [], onUploadMealPhoto, onDeleteMealPhoto, uploadingPhoto = false,
}: MealsCardProps) {
  // Guarda qual refeição está com os detalhes expandidos (null = nenhuma)
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  // Guarda a refeição que está sendo editada no diálogo (null = nenhuma)
  const [editingMeal, setEditingMeal] = useState<UserMealPlan | null>(null);

  // Abre/fecha os detalhes de uma refeição ao clicar na setinha
  const toggleExpand = (key: string) => setExpandedMeal(expandedMeal === key ? null : key);
  // Busca a foto já enviada para uma refeição específica (se houver)
  const getPhotoForMeal = (mealKey: string) => mealPhotos.find(p => p.meal_key === mealKey);

  return (
    <div className="rounded-3xl overflow-hidden shadow-xl">
      {/* Pizza Header */}
      <div className="gradient-meals p-5 pb-3">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Alimentação</h3>
              <p className="text-white/70 text-xs">Seu plano nutricional</p>
            </div>
          </div>
        </div>
        
        <MealPizza meals={mealPlans} tracking={tracking} />
      </div>

      {/* Meal Items */}
      <div className="bg-card p-3 space-y-2">
        {/* Para cada refeição do plano, desenha uma linha com marcar/foto/editar/expandir */}
        {mealPlans.map((meal) => {
          // Campo do registro que indica se esta refeição foi concluída
          const trackingKey = mealKeyToTrackingKey[meal.meal_key];
          // Está concluída? / Está com os detalhes abertos?
          const isCompleted = tracking?.[trackingKey] || false;
          const isExpanded = expandedMeal === meal.meal_key;
          
          return (
            <div key={meal.meal_key} className="overflow-hidden rounded-2xl border border-border/50">
              <div className={`flex items-center gap-3 p-3.5 transition-all duration-200 ${
                isCompleted ? 'bg-meals/5' : 'bg-muted/30 hover:bg-muted/50'
              }`}>
                <motion.button
                  onClick={() => onToggleMeal(trackingKey)}
                  whileTap={{ scale: 0.85 }}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                    isCompleted ? 'bg-meals text-white shadow-md' : 'border-2 border-muted-foreground/25'
                  }`}
                >
                  {isCompleted && <Check className="w-4 h-4" />}
                </motion.button>
                
                <div className="flex-1 min-w-0" onClick={() => onToggleMeal(trackingKey)}>
                  <span className={`font-semibold text-sm ${isCompleted ? 'text-foreground/60 line-through' : 'text-foreground'}`}>
                    {meal.meal_name}
                  </span>
                  {isCompleted && meal.main_macros?.calories && (
                    <span className="text-[10px] text-meals ml-2 font-bold">+{meal.main_macros.calories} kcal</span>
                  )}
                </div>
                
                <span className="text-[11px] text-muted-foreground font-medium">{meal.meal_time}</span>
                
                {onUploadMealPhoto && (
                  <PhotoUploadButton
                    onUpload={(file) => onUploadMealPhoto(meal.meal_key, file)}
                    existingPhotoUrl={getPhotoForMeal(meal.meal_key)?.photo_url}
                    onDelete={onDeleteMealPhoto ? () => onDeleteMealPhoto(meal.meal_key) : undefined}
                    uploading={uploadingPhoto}
                    size="sm"
                  />
                )}
                
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg" onClick={() => setEditingMeal(meal)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                
                <button onClick={() => toggleExpand(meal.meal_key)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-muted/20 space-y-4 border-t border-border/30">
                      {/* Main Option */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Opção Principal</p>
                          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{meal.main_macros.calories} kcal</span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">{meal.main_description}</p>
                        <ul className="space-y-0.5 ml-1">
                          {meal.main_ingredients.map((ing, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              <span><span className="font-medium text-foreground/80">{ing.item}</span>{ing.quantity && <span> — {ing.quantity}</span>}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground font-semibold">
                          <span>P: {meal.main_macros.protein}g</span>
                          <span>C: {meal.main_macros.carbs}g</span>
                          <span>G: {meal.main_macros.fat}g</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-border/30" />
                      
                      {/* Alternative */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Alternativa</p>
                          <span className="text-[10px] font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">{meal.alt_macros.calories} kcal</span>
                        </div>
                        <p className="text-sm font-medium text-foreground mb-2">{meal.alt_description}</p>
                        <ul className="space-y-0.5 ml-1">
                          {meal.alt_ingredients.map((ing, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-secondary mt-0.5">•</span>
                              <span><span className="font-medium text-foreground/80">{ing.item}</span>{ing.quantity && <span> — {ing.quantity}</span>}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground font-semibold">
                          <span>P: {meal.alt_macros.protein}g</span>
                          <span>C: {meal.alt_macros.carbs}g</span>
                          <span>G: {meal.alt_macros.fat}g</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Diálogo (modal) de edição de uma refeição, aberto ao clicar no lápis */}
      <EditMealDialog
        meal={editingMeal}
        open={!!editingMeal}
        onOpenChange={(open) => !open && setEditingMeal(null)}
        onSave={onSaveMealPlan}
      />
    </div>
  );
}
