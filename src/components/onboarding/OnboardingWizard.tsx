import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import StepProfile from './steps/StepProfile';
import StepHydration from './steps/StepHydration';
import StepMeals from './steps/StepMeals';
import StepWorkouts from './steps/StepWorkouts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OnboardingData {
  // Profile
  name: string;
  birthDate: string;
  cpf: string;
  currentWeight: number;
  targetWeight: number;
  
  // Hydration
  hydrationGoal: number;
  hydrationSchedule: Array<{
    time: string;
    amount: number;
    label: string;
  }>;
  
  // Meals
  mealsPerDay: number;
  mealPlan: Array<{
    key: string;
    name: string;
    time: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  selectedFoods: string[];
  
  // Workouts
  workoutDays: Array<{
    dayOfWeek: number;
    type: string;
    name: string;
    duration: string;
  }>;
}

const defaultData: OnboardingData = {
  name: '',
  birthDate: '',
  cpf: '',
  currentWeight: 80,
  targetWeight: 75,
  hydrationGoal: 3000,
  hydrationSchedule: [],
  mealsPerDay: 6,
  selectedFoods: [],
  mealPlan: [],
  workoutDays: [],
};

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  { id: 'profile', title: 'Perfil', description: 'Suas informações básicas' },
  { id: 'hydration', title: 'Hidratação', description: 'Sua rotina de água' },
  { id: 'meals', title: 'Refeições', description: 'Seu plano alimentar' },
  { id: 'workouts', title: 'Treinos', description: 'Sua rotina de exercícios' },
];

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    ...defaultData,
    name: profile?.name || '',
    targetWeight: profile?.target_weight || 75,
  });
  const [saving, setSaving] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({
          name: data.name,
          birth_date: data.birthDate || null,
          cpf: data.cpf ? data.cpf.replace(/\D/g, '') : null,
          target_weight: data.targetWeight,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      // Save initial weight
      if (data.currentWeight) {
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('weight_history')
          .upsert({
            user_id: user.id,
            date: today,
            weight_kg: data.currentWeight,
          }, { onConflict: 'user_id,date' });
      }

      // Save hydration schedule
      if (data.hydrationSchedule.length > 0) {
        // Delete existing schedule first
        await supabase
          .from('user_hydration_schedule')
          .delete()
          .eq('user_id', user.id);

        const hydrationEntries = data.hydrationSchedule.map((entry, index) => ({
          user_id: user.id,
          schedule_time: entry.time,
          amount_ml: entry.amount,
          label: entry.label,
          order_index: index,
        }));
        
        await supabase
          .from('user_hydration_schedule')
          .insert(hydrationEntries);
      }

      // Save meal plans
      if (data.mealPlan.length > 0) {
        // Delete existing meal plans first
        await supabase
          .from('user_meal_plans')
          .delete()
          .eq('user_id', user.id);

        const mealEntries = data.mealPlan.map(meal => ({
          user_id: user.id,
          meal_key: meal.key,
          meal_name: meal.name,
          meal_time: meal.time,
          main_description: meal.description,
          main_macros: {
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
          },
          main_ingredients: [],
          alt_description: null,
          alt_macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          alt_ingredients: [],
        }));

        await supabase
          .from('user_meal_plans')
          .insert(mealEntries);
      }

      // Save food preferences
      if (data.selectedFoods.length > 0) {
        // Delete existing preferences first
        await supabase
          .from('user_food_preferences')
          .delete()
          .eq('user_id', user.id);

        // Get food categories from the selection
        const foodPreferences = data.selectedFoods.map(foodId => {
          // Determine category from food ID
          let category = 'other';
          if (foodId.includes('chicken') || foodId.includes('beef') || foodId.includes('fish') || 
              foodId.includes('salmon') || foodId.includes('eggs') || foodId.includes('tuna') ||
              foodId.includes('shrimp') || foodId.includes('turkey') || foodId.includes('pork')) {
            category = 'proteins';
          } else if (foodId.includes('rice') || foodId.includes('potato') || foodId.includes('pasta') ||
                     foodId.includes('bread') || foodId.includes('oats') || foodId.includes('quinoa') ||
                     foodId.includes('cassava')) {
            category = 'carbs';
          } else if (foodId.includes('broccoli') || foodId.includes('spinach') || foodId.includes('carrot') ||
                     foodId.includes('tomato') || foodId.includes('lettuce') || foodId.includes('cucumber') ||
                     foodId.includes('zucchini') || foodId.includes('beans') || foodId.includes('lentils')) {
            category = 'vegetables';
          } else if (foodId.includes('banana') || foodId.includes('apple') || foodId.includes('orange') ||
                     foodId.includes('strawberry') || foodId.includes('watermelon') || foodId.includes('papaya') ||
                     foodId.includes('mango') || foodId.includes('grape')) {
            category = 'fruits';
          } else if (foodId.includes('milk') || foodId.includes('yogurt') || foodId.includes('cheese') ||
                     foodId.includes('cottage') || foodId.includes('whey')) {
            category = 'dairy';
          } else if (foodId.includes('avocado') || foodId.includes('olive') || foodId.includes('nuts') ||
                     foodId.includes('peanut') || foodId.includes('chia') || foodId.includes('flax') ||
                     foodId.includes('coconut')) {
            category = 'fats';
          }
          
          return {
            user_id: user.id,
            food_name: foodId,
            food_category: category,
          };
        });

        await supabase
          .from('user_food_preferences')
          .insert(foodPreferences);
      }

      // Save workout plans
      if (data.workoutDays.length > 0) {
        // Delete existing workout plans first
        await supabase
          .from('user_workout_plans')
          .delete()
          .eq('user_id', user.id);

        const workoutEntries = data.workoutDays.map(workout => ({
          user_id: user.id,
          day_of_week: workout.dayOfWeek,
          workout_type: workout.type,
          workout_name: workout.name,
          duration: workout.duration,
          description: null,
          details: [],
        }));

        await supabase
          .from('user_workout_plans')
          .insert(workoutEntries);
      }

      toast.success('Configuração concluída! 🎉');
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepProfile data={data} updateData={updateData} />;
      case 1:
        return <StepHydration data={data} updateData={updateData} />;
      case 2:
        return <StepMeals data={data} updateData={updateData} />;
      case 3:
        return <StepWorkouts data={data} updateData={updateData} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-foreground">
              Perfil de Saúde
            </h1>
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStep
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStep
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground">
                  {steps[currentStep].description}
                </p>
              </div>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={saving}
              className="gap-2 gradient-water text-white border-0"
            >
              {saving ? 'Salvando...' : 'Concluir'}
              <Check className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
