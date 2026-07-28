import { useState } from 'react';
import { UtensilsCrossed, Info, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import type { OnboardingData } from '../OnboardingWizard';

interface StepMealsProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

// Food database with nutritional info per 100g
const foodDatabase = {
  proteins: {
    label: '🥩 Proteínas',
    items: [
      { id: 'chicken_breast', name: 'Frango (peito)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { id: 'beef_lean', name: 'Carne bovina magra', calories: 250, protein: 26, carbs: 0, fat: 15 },
      { id: 'fish_tilapia', name: 'Tilápia', calories: 96, protein: 20, carbs: 0, fat: 1.7 },
      { id: 'salmon', name: 'Salmão', calories: 208, protein: 20, carbs: 0, fat: 13 },
      { id: 'eggs', name: 'Ovos', calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      { id: 'tuna', name: 'Atum', calories: 132, protein: 28, carbs: 0, fat: 1.3 },
      { id: 'shrimp', name: 'Camarão', calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
      { id: 'turkey', name: 'Peru', calories: 135, protein: 30, carbs: 0, fat: 1 },
      { id: 'pork_loin', name: 'Lombo suíno', calories: 143, protein: 27, carbs: 0, fat: 3.5 },
    ],
  },
  carbs: {
    label: '🍚 Carboidratos',
    items: [
      { id: 'rice_white', name: 'Arroz branco', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
      { id: 'rice_brown', name: 'Arroz integral', calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
      { id: 'sweet_potato', name: 'Batata doce', calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
      { id: 'potato', name: 'Batata inglesa', calories: 77, protein: 2, carbs: 17, fat: 0.1 },
      { id: 'pasta', name: 'Macarrão', calories: 131, protein: 5, carbs: 25, fat: 1.1 },
      { id: 'bread_whole', name: 'Pão integral', calories: 247, protein: 13, carbs: 41, fat: 4.2 },
      { id: 'oats', name: 'Aveia', calories: 389, protein: 17, carbs: 66, fat: 7 },
      { id: 'quinoa', name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
      { id: 'cassava', name: 'Mandioca', calories: 160, protein: 1.4, carbs: 38, fat: 0.3 },
    ],
  },
  vegetables: {
    label: '🥗 Vegetais e Legumes',
    items: [
      { id: 'broccoli', name: 'Brócolis', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
      { id: 'spinach', name: 'Espinafre', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
      { id: 'carrot', name: 'Cenoura', calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
      { id: 'tomato', name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
      { id: 'lettuce', name: 'Alface', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
      { id: 'cucumber', name: 'Pepino', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1 },
      { id: 'zucchini', name: 'Abobrinha', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
      { id: 'beans', name: 'Feijão', calories: 127, protein: 8.7, carbs: 22, fat: 0.5 },
      { id: 'lentils', name: 'Lentilha', calories: 116, protein: 9, carbs: 20, fat: 0.4 },
    ],
  },
  fruits: {
    label: '🍎 Frutas',
    items: [
      { id: 'banana', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
      { id: 'apple', name: 'Maçã', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
      { id: 'orange', name: 'Laranja', calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
      { id: 'strawberry', name: 'Morango', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
      { id: 'watermelon', name: 'Melancia', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
      { id: 'papaya', name: 'Mamão', calories: 43, protein: 0.5, carbs: 11, fat: 0.3 },
      { id: 'mango', name: 'Manga', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
      { id: 'grape', name: 'Uva', calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
    ],
  },
  dairy: {
    label: '🥛 Laticínios',
    items: [
      { id: 'milk_skim', name: 'Leite desnatado', calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
      { id: 'milk_whole', name: 'Leite integral', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
      { id: 'yogurt_natural', name: 'Iogurte natural', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
      { id: 'yogurt_greek', name: 'Iogurte grego', calories: 97, protein: 9, carbs: 3.6, fat: 5 },
      { id: 'cheese_white', name: 'Queijo branco', calories: 264, protein: 17, carbs: 3.4, fat: 21 },
      { id: 'cottage', name: 'Cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
      { id: 'whey', name: 'Whey protein', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
    ],
  },
  fats: {
    label: '🥑 Gorduras saudáveis',
    items: [
      { id: 'avocado', name: 'Abacate', calories: 160, protein: 2, carbs: 8.5, fat: 15 },
      { id: 'olive_oil', name: 'Azeite de oliva', calories: 884, protein: 0, carbs: 0, fat: 100 },
      { id: 'nuts', name: 'Castanhas', calories: 607, protein: 15, carbs: 16, fat: 54 },
      { id: 'peanut', name: 'Amendoim', calories: 567, protein: 26, carbs: 16, fat: 49 },
      { id: 'chia', name: 'Chia', calories: 486, protein: 17, carbs: 42, fat: 31 },
      { id: 'flaxseed', name: 'Linhaça', calories: 534, protein: 18, carbs: 29, fat: 42 },
      { id: 'coconut_oil', name: 'Óleo de coco', calories: 862, protein: 0, carbs: 0, fat: 100 },
    ],
  },
};

type FoodCategory = keyof typeof foodDatabase;

// Calculadora de calorias baseada no peso e meta
const calculateDailyCalories = (currentWeight: number, targetWeight: number) => {
  const baseTMB = currentWeight * 22;
  
  if (currentWeight > targetWeight) {
    return Math.round(baseTMB * 0.85);
  } else if (currentWeight < targetWeight) {
    return Math.round(baseTMB * 1.15);
  }
  return Math.round(baseTMB);
};

const mealPresets = [
  {
    name: '6 Refeições (Recomendado)',
    meals: 6,
    distribution: [
      { key: 'breakfast', name: 'Café da Manhã', time: '07:00', caloriePercent: 20 },
      { key: 'morning_snack', name: 'Lanche da Manhã', time: '10:00', caloriePercent: 10 },
      { key: 'lunch', name: 'Almoço', time: '12:30', caloriePercent: 30 },
      { key: 'afternoon_snack', name: 'Lanche da Tarde', time: '15:30', caloriePercent: 10 },
      { key: 'dinner', name: 'Jantar', time: '19:00', caloriePercent: 25 },
      { key: 'night_snack', name: 'Ceia', time: '21:00', caloriePercent: 5 },
    ],
  },
  {
    name: '5 Refeições',
    meals: 5,
    distribution: [
      { key: 'breakfast', name: 'Café da Manhã', time: '07:00', caloriePercent: 25 },
      { key: 'morning_snack', name: 'Lanche da Manhã', time: '10:00', caloriePercent: 10 },
      { key: 'lunch', name: 'Almoço', time: '12:30', caloriePercent: 30 },
      { key: 'afternoon_snack', name: 'Lanche da Tarde', time: '16:00', caloriePercent: 10 },
      { key: 'dinner', name: 'Jantar', time: '19:30', caloriePercent: 25 },
    ],
  },
  {
    name: '4 Refeições',
    meals: 4,
    distribution: [
      { key: 'breakfast', name: 'Café da Manhã', time: '07:30', caloriePercent: 25 },
      { key: 'lunch', name: 'Almoço', time: '12:00', caloriePercent: 35 },
      { key: 'afternoon_snack', name: 'Lanche', time: '16:00', caloriePercent: 15 },
      { key: 'dinner', name: 'Jantar', time: '19:30', caloriePercent: 25 },
    ],
  },
  {
    name: '3 Refeições',
    meals: 3,
    distribution: [
      { key: 'breakfast', name: 'Café da Manhã', time: '08:00', caloriePercent: 30 },
      { key: 'lunch', name: 'Almoço', time: '12:30', caloriePercent: 40 },
      { key: 'dinner', name: 'Jantar', time: '19:00', caloriePercent: 30 },
    ],
  },
];

export default function StepMeals({ data, updateData }: StepMealsProps) {
  const [step, setStep] = useState<'meals' | 'foods'>(data.mealPlan.length > 0 ? 'foods' : 'meals');
  const [expandedCategory, setExpandedCategory] = useState<FoodCategory | null>('proteins');

  const selectedFoods = new Set(data.selectedFoods || []);

  const dailyCalories = calculateDailyCalories(data.currentWeight, data.targetWeight);

  const selectPreset = (preset: typeof mealPresets[0]) => {
    const mealPlan = preset.distribution.map(meal => {
      const calories = Math.round((dailyCalories * meal.caloriePercent) / 100);
      return {
        key: meal.key,
        name: meal.name,
        time: meal.time,
        description: '',
        calories,
        protein: Math.round((calories * 0.25) / 4),
        carbs: Math.round((calories * 0.45) / 4),
        fat: Math.round((calories * 0.30) / 9),
      };
    });

    updateData({
      mealsPerDay: preset.meals,
      mealPlan,
    });
    
    // Automatically go to food selection after choosing meals
    setStep('foods');
  };

  const toggleFood = (foodId: string) => {
    const newSelected = new Set(selectedFoods);
    if (newSelected.has(foodId)) {
      newSelected.delete(foodId);
    } else {
      newSelected.add(foodId);
    }
    
    // Update data with selected foods
    updateData({ selectedFoods: Array.from(newSelected) });
    updateMealDescriptions(newSelected);
  };

  const updateMealDescriptions = (foods: Set<string>) => {
    // Get all selected food names
    const selectedFoodNames: string[] = [];
    Object.values(foodDatabase).forEach(category => {
      category.items.forEach(item => {
        if (foods.has(item.id)) {
          selectedFoodNames.push(item.name);
        }
      });
    });

    // Update meal plans with generic description based on selections
    const updatedMealPlan = data.mealPlan.map(meal => ({
      ...meal,
      description: selectedFoodNames.length > 0 
        ? `Preferências: ${selectedFoodNames.slice(0, 5).join(', ')}${selectedFoodNames.length > 5 ? '...' : ''}`
        : '',
    }));

    updateData({ mealPlan: updatedMealPlan });
  };

  const getFoodsByCategory = (categoryKey: FoodCategory) => {
    return foodDatabase[categoryKey].items;
  };

  const currentTotalCalories = data.mealPlan.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = data.mealPlan.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = data.mealPlan.reduce((sum, m) => sum + m.carbs, 0);
  const totalFat = data.mealPlan.reduce((sum, m) => sum + m.fat, 0);

  if (step === 'foods') {
    return (
      <div className="space-y-6">
        {/* Info card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  🍽️ Selecione seus alimentos preferidos
                </p>
                <p className="text-muted-foreground">
                  Marque os alimentos que você gosta e tem acesso. Isso ajudará a criar 
                  um plano alimentar personalizado para você.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected count */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('meals')} className="gap-2">
            <ChevronUp className="w-4 h-4 rotate-[-90deg]" />
            Voltar
          </Button>
          <Badge variant="secondary" className="text-base">
            {selectedFoods.size} alimentos selecionados
          </Badge>
        </div>

        {/* Food categories */}
        <div className="space-y-3">
          {(Object.keys(foodDatabase) as FoodCategory[]).map((categoryKey) => {
            const category = foodDatabase[categoryKey];
            const selectedInCategory = category.items.filter(item => selectedFoods.has(item.id)).length;
            
            return (
              <Collapsible
                key={categoryKey}
                open={expandedCategory === categoryKey}
                onOpenChange={(open) => setExpandedCategory(open ? categoryKey : null)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.label.split(' ')[0]}</span>
                      <span className="font-medium text-foreground">
                        {category.label.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedInCategory > 0 && (
                        <Badge className="bg-primary/20 text-primary">
                          {selectedInCategory}
                        </Badge>
                      )}
                      {expandedCategory === categoryKey ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <div className="grid grid-cols-1 gap-2">
                        {getFoodsByCategory(categoryKey).map((food) => (
                          <label
                            key={food.id}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                              selectedFoods.has(food.id)
                                ? 'bg-primary/10 border border-primary/30'
                                : 'bg-muted/50 hover:bg-muted border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedFoods.has(food.id)}
                                onCheckedChange={() => toggleFood(food.id)}
                              />
                              <div>
                                <span className="font-medium text-foreground">{food.name}</span>
                                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span>{food.calories} kcal</span>
                                  <span>•</span>
                                  <span>P: {food.protein}g</span>
                                  <span>C: {food.carbs}g</span>
                                  <span>G: {food.fat}g</span>
                                </div>
                              </div>
                            </div>
                            {selectedFoods.has(food.id) && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        {/* Summary */}
        {data.mealPlan.length > 0 && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <h4 className="font-medium text-foreground mb-3">Resumo do seu plano</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-background">
                  <p className="text-lg font-semibold text-foreground">{currentTotalCalories}</p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <p className="text-lg font-semibold text-destructive">{totalProtein}g</p>
                  <p className="text-xs text-muted-foreground">Proteína</p>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <p className="text-lg font-semibold text-chart-4">{totalCarbs}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <p className="text-lg font-semibold text-primary">{totalFat}g</p>
                  <p className="text-xs text-muted-foreground">Gordura</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">
                🍽️ Seu Plano Calórico Sugerido
              </p>
              <p className="text-muted-foreground">
                Com base no seu peso atual ({data.currentWeight}kg) e meta ({data.targetWeight}kg),
                sugerimos aproximadamente <strong>{dailyCalories} kcal/dia</strong>.
                {data.currentWeight > data.targetWeight && (
                  <span className="text-primary"> Isso é um déficit moderado para perda de peso saudável.</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <div>
        <h3 className="font-medium text-foreground mb-3">Quantas refeições por dia?</h3>
        <div className="grid gap-3">
          {mealPresets.map((preset) => (
            <Card
              key={preset.name}
              className={`cursor-pointer transition-all hover:border-primary/50 ${
                data.mealsPerDay === preset.meals
                  ? 'border-primary bg-primary/5'
                  : ''
              }`}
              onClick={() => selectPreset(preset)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{preset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {preset.distribution.map(m => m.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selected meal plan details */}
      {data.mealPlan.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Seu Plano</h3>
              <Badge variant="outline">{currentTotalCalories} kcal</Badge>
            </div>

            {/* Macro summary */}
            <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-muted/50">
              <div className="text-center">
                <p className="text-lg font-semibold text-destructive">{totalProtein}g</p>
                <p className="text-xs text-muted-foreground">Proteína</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-chart-4">{totalCarbs}g</p>
                <p className="text-xs text-muted-foreground">Carboidratos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-primary">{totalFat}g</p>
                <p className="text-xs text-muted-foreground">Gorduras</p>
              </div>
            </div>

            {/* Meal list */}
            <div className="space-y-2">
              {data.mealPlan.map((meal) => (
                <div
                  key={meal.key}
                  className="p-3 rounded-lg border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground w-14">
                      {meal.time}
                    </span>
                    <span className="font-medium text-foreground">{meal.name}</span>
                  </div>
                  <Badge variant="secondary">{meal.calories} kcal</Badge>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep('foods')}
              className="w-full mt-4 gap-2"
            >
              Escolher alimentos
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
