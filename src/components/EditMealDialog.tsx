import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FoodSelector } from '@/components/FoodSelector';
import type { UserMealPlan, MealIngredient, MealMacros } from '@/hooks/useUserMealPlans';
import { toast } from 'sonner';

interface EditMealDialogProps {
  meal: UserMealPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (meal: UserMealPlan) => Promise<{ error: Error | null }>;
}

export function EditMealDialog({ meal, open, onOpenChange, onSave }: EditMealDialogProps) {
  const [editedMeal, setEditedMeal] = useState<UserMealPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastMealKey, setLastMealKey] = useState<string | null>(null);

  // Sync editedMeal whenever meal prop changes or dialog opens
  const currentKey = meal ? `${meal.meal_key}_${meal.id ?? ''}` : null;
  if (open && meal && currentKey !== lastMealKey) {
    setEditedMeal({ ...meal });
    setLastMealKey(currentKey);
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLastMealKey(null);
      setEditedMeal(null);
    }
    onOpenChange(newOpen);
  };

  const handleSave = async () => {
    if (!editedMeal) return;
    
    setSaving(true);
    const { error } = await onSave(editedMeal);
    setSaving(false);

    if (error) {
      toast.error('Erro ao salvar refeição');
    } else {
      toast.success('Refeição salva com sucesso!');
      onOpenChange(false);
    }
  };

  const handleFoodChange = (type: 'main' | 'alt', ingredients: MealIngredient[], macros: MealMacros) => {
    if (!editedMeal) return;
    const ingredientsKey = type === 'main' ? 'main_ingredients' : 'alt_ingredients';
    const macrosKey = type === 'main' ? 'main_macros' : 'alt_macros';
    setEditedMeal({ ...editedMeal, [ingredientsKey]: ingredients, [macrosKey]: macros });
  };

  if (!editedMeal) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar {editedMeal.meal_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome da Refeição</Label>
              <Input
                value={editedMeal.meal_name}
                onChange={(e) => setEditedMeal({ ...editedMeal, meal_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input
                type="time"
                value={editedMeal.meal_time}
                onChange={(e) => setEditedMeal({ ...editedMeal, meal_time: e.target.value })}
              />
            </div>
          </div>

          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="main">Opção Principal</TabsTrigger>
              <TabsTrigger value="alt">Alternativa</TabsTrigger>
            </TabsList>

            {(['main', 'alt'] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={type === 'main' ? editedMeal.main_description || '' : editedMeal.alt_description || ''}
                    onChange={(e) => setEditedMeal({
                      ...editedMeal,
                      [type === 'main' ? 'main_description' : 'alt_description']: e.target.value
                    })}
                    placeholder="Ex: Ovos mexidos com aveia"
                  />
                </div>

                <FoodSelector
                  ingredients={type === 'main' ? editedMeal.main_ingredients : editedMeal.alt_ingredients}
                  onChange={(ingredients, macros) => handleFoodChange(type, ingredients, macros)}
                />
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
