import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MealIngredient {
  item: string;
  quantity?: string;
}

export interface MealMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserMealPlan {
  id?: string;
  user_id: string;
  meal_key: string;
  meal_name: string;
  meal_time: string;
  main_description: string | null;
  main_ingredients: MealIngredient[];
  main_macros: MealMacros;
  alt_description: string | null;
  alt_ingredients: MealIngredient[];
  alt_macros: MealMacros;
}

// Default meals (used when user has no custom plan)
export const defaultMeals: Omit<UserMealPlan, 'id' | 'user_id'>[] = [
  {
    meal_key: 'breakfast',
    meal_name: 'Primeira Refeição',
    meal_time: '09:00',
    main_description: 'Ovos mexidos com aveia e banana',
    main_ingredients: [
      { item: 'Ovos', quantity: '3 unidades' },
      { item: 'Aveia', quantity: '2 colheres de sopa' },
      { item: 'Banana média', quantity: '1 unidade' },
      { item: 'Chá de sua preferência', quantity: 'sem açúcar' },
    ],
    main_macros: { calories: 420, protein: 18, carbs: 45, fat: 15 },
    alt_description: 'Crepioca com queijo minas',
    alt_ingredients: [
      { item: 'Ovo', quantity: '1 unidade' },
      { item: 'Tapioca', quantity: '2 colheres de sopa' },
      { item: 'Queijo minas', quantity: '2 fatias' },
      { item: 'Maçã', quantity: '1 unidade' },
    ],
    alt_macros: { calories: 380, protein: 16, carbs: 45, fat: 14 }
  },
  {
    meal_key: 'morning_snack',
    meal_name: 'Lanche da Manhã',
    meal_time: '11:30',
    main_description: 'Maçã com pasta de amendoim',
    main_ingredients: [
      { item: 'Maçã', quantity: '1 unidade' },
      { item: 'Pasta de amendoim', quantity: '1 colher de sopa' },
    ],
    main_macros: { calories: 200, protein: 4, carbs: 25, fat: 8 },
    alt_description: 'Vitamina de abacate',
    alt_ingredients: [
      { item: 'Abacate', quantity: '1/4 de unidade' },
      { item: 'Leite desnatado', quantity: '200ml' },
      { item: 'Whey protein', quantity: 'opcional' },
    ],
    alt_macros: { calories: 200, protein: 12, carbs: 18, fat: 9 }
  },
  {
    meal_key: 'lunch',
    meal_name: 'Almoço',
    meal_time: '14:00',
    main_description: 'Filé de frango grelhado com arroz integral',
    main_ingredients: [
      { item: 'Filé de frango grelhado', quantity: '180g' },
      { item: 'Arroz integral', quantity: '4 colheres de sopa' },
      { item: 'Feijão', quantity: '3 colheres de sopa' },
      { item: 'Salada de folhas verdes', quantity: 'à vontade' },
      { item: 'Legumes cozidos', quantity: 'à vontade' },
    ],
    main_macros: { calories: 550, protein: 45, carbs: 55, fat: 12 },
    alt_description: 'Salmão assado com quinoa',
    alt_ingredients: [
      { item: 'Salmão assado', quantity: '150g' },
      { item: 'Quinoa', quantity: '4 colheres de sopa' },
      { item: 'Brócolis no vapor', quantity: '1 xícara' },
      { item: 'Salada de rúcula', quantity: 'com tomate cereja' },
    ],
    alt_macros: { calories: 520, protein: 40, carbs: 50, fat: 18 }
  },
  {
    meal_key: 'afternoon_snack',
    meal_name: 'Lanche da Tarde',
    meal_time: '17:00',
    main_description: 'Iogurte natural com castanhas',
    main_ingredients: [
      { item: 'Iogurte natural', quantity: '180g' },
      { item: 'Castanhas', quantity: '1 punhado (30g)' },
    ],
    main_macros: { calories: 180, protein: 12, carbs: 15, fat: 8 },
    alt_description: 'Chocolate amargo com chá',
    alt_ingredients: [
      { item: 'Chocolate 70% cacau', quantity: '30g (2-3 quadradinhos)' },
      { item: 'Chá de camomila', quantity: '1 xícara' },
    ],
    alt_macros: { calories: 160, protein: 2, carbs: 12, fat: 12 }
  },
  {
    meal_key: 'dinner',
    meal_name: 'Jantar',
    meal_time: '20:30',
    main_description: 'Sopa de legumes com frango',
    main_ingredients: [
      { item: 'Frango desfiado', quantity: '150g' },
      { item: 'Legumes variados', quantity: 'à vontade' },
      { item: 'Pão integral', quantity: '2 fatias' },
    ],
    main_macros: { calories: 350, protein: 35, carbs: 40, fat: 8 },
    alt_description: 'Salada completa com atum',
    alt_ingredients: [
      { item: 'Folhas verdes', quantity: 'à vontade' },
      { item: 'Tomate, pepino e cenoura', quantity: 'à vontade' },
      { item: 'Atum em água', quantity: '1 lata' },
      { item: 'Ovo cozido', quantity: '1 unidade' },
      { item: 'Azeite e limão', quantity: 'para temperar' },
    ],
    alt_macros: { calories: 280, protein: 30, carbs: 20, fat: 10 }
  },
  {
    meal_key: 'night_snack',
    meal_name: 'Ceia',
    meal_time: '23:00',
    main_description: 'Iogurte com chia',
    main_ingredients: [
      { item: 'Iogurte natural', quantity: '150g' },
      { item: 'Semente de chia', quantity: '1 colher de sopa' },
    ],
    main_macros: { calories: 150, protein: 10, carbs: 12, fat: 6 },
    alt_description: 'Leite desnatado ou chá',
    alt_ingredients: [
      { item: 'Leite desnatado ou chá', quantity: '1 copo' },
      { item: 'Castanhas', quantity: '2 unidades' },
    ],
    alt_macros: { calories: 120, protein: 8, carbs: 10, fat: 5 }
  },
];

export function useUserMealPlans() {
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<UserMealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMealPlans = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('meal_key');

    if (error) {
      console.error('Error fetching meal plans:', error);
    }

    // If user has no custom plans, use defaults
    if (!data || data.length === 0) {
      setMealPlans(defaultMeals.map(meal => ({ ...meal, user_id: user.id })));
    } else {
      // Parse JSONB fields and merge with defaults for any missing meals
      const userPlans: UserMealPlan[] = data.map(p => ({
        id: p.id,
        user_id: p.user_id,
        meal_key: p.meal_key,
        meal_name: p.meal_name,
        meal_time: p.meal_time,
        main_description: p.main_description,
        main_ingredients: p.main_ingredients as unknown as MealIngredient[],
        main_macros: p.main_macros as unknown as MealMacros,
        alt_description: p.alt_description,
        alt_ingredients: p.alt_ingredients as unknown as MealIngredient[],
        alt_macros: p.alt_macros as unknown as MealMacros,
      }));
      
      const allMealKeys = defaultMeals.map(m => m.meal_key);
      const mergedPlans = allMealKeys.map(key => {
        const userPlan = userPlans.find(p => p.meal_key === key);
        if (userPlan) return userPlan;
        const defaultMeal = defaultMeals.find(m => m.meal_key === key)!;
        return { ...defaultMeal, user_id: user.id };
      });
      setMealPlans(mergedPlans);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const saveMealPlan = async (mealPlan: UserMealPlan) => {
    if (!user) return { error: new Error('Not authenticated') };

    const planData = {
      user_id: user.id,
      meal_key: mealPlan.meal_key,
      meal_name: mealPlan.meal_name,
      meal_time: mealPlan.meal_time,
      main_description: mealPlan.main_description,
      main_ingredients: JSON.parse(JSON.stringify(mealPlan.main_ingredients)),
      main_macros: JSON.parse(JSON.stringify(mealPlan.main_macros)),
      alt_description: mealPlan.alt_description,
      alt_ingredients: JSON.parse(JSON.stringify(mealPlan.alt_ingredients)),
      alt_macros: JSON.parse(JSON.stringify(mealPlan.alt_macros)),
    };

    if (mealPlan.id) {
      const { error } = await supabase
        .from('user_meal_plans')
        .update(planData)
        .eq('id', mealPlan.id);
      
      if (!error) await fetchMealPlans();
      return { error };
    } else {
      const { error } = await supabase
        .from('user_meal_plans')
        .upsert([planData], { onConflict: 'user_id,meal_key' });
      
      if (!error) await fetchMealPlans();
      return { error };
    }
  };

  return {
    mealPlans,
    loading,
    saveMealPlan,
    refetch: fetchMealPlans,
  };
}
