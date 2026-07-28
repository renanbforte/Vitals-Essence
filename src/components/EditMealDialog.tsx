// ============================================================================
// EditMealDialog — Janela (diálogo) para EDITAR uma refeição do plano alimentar.
// Permite mudar o nome e o horário da refeição e, em duas abas (Principal e
// Alternativa), a descrição e os alimentos/ingredientes de cada opção.
// Ao salvar, envia a refeição editada e mostra um aviso de sucesso ou erro.
// ============================================================================
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
  // Cópia editável da refeição (o usuário mexe nesta, não na original).
  const [editedMeal, setEditedMeal] = useState<UserMealPlan | null>(null);
  // Indica se está salvando (para trocar o texto do botão e travá-lo).
  const [saving, setSaving] = useState(false);
  // Guarda qual refeição já foi carregada, para não recarregar sem necessidade.
  const [lastMealKey, setLastMealKey] = useState<string | null>(null);

  // Sync editedMeal whenever meal prop changes or dialog opens
  // Quando abre a janela com uma refeição diferente da última carregada,
  // copia os dados dessa refeição para a cópia editável.
  const currentKey = meal ? `${meal.meal_key}_${meal.id ?? ''}` : null;
  if (open && meal && currentKey !== lastMealKey) {
    setEditedMeal({ ...meal });
    setLastMealKey(currentKey);
  }

  // Ao fechar a janela, limpa os dados temporários da edição.
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLastMealKey(null);
      setEditedMeal(null);
    }
    onOpenChange(newOpen);
  };

  // Salva a refeição editada; avisa sucesso e fecha, ou avisa erro.
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

  // Atualiza os ingredientes e os valores nutricionais (macros) da opção
  // Principal ('main') ou da Alternativa ('alt') quando o usuário muda os alimentos.
  const handleFoodChange = (type: 'main' | 'alt', ingredients: MealIngredient[], macros: MealMacros) => {
    if (!editedMeal) return;
    const ingredientsKey = type === 'main' ? 'main_ingredients' : 'alt_ingredients';
    const macrosKey = type === 'main' ? 'main_macros' : 'alt_macros';
    setEditedMeal({ ...editedMeal, [ingredientsKey]: ingredients, [macrosKey]: macros });
  };

  // Sem refeição carregada, não desenha nada na tela.
  if (!editedMeal) return null;

  // Monta a janela: cabeçalho, campos de nome e horário, abas Principal/
  // Alternativa (com descrição e seletor de alimentos) e botões de ação.
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
