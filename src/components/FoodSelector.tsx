import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, ChevronDown, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  foodDatabase,
  searchFoods,
  getFoodCategories,
  calculateMacros,
  type FoodItem,
  type FoodUnit,
} from '@/lib/foodDatabase';
import type { MealIngredient } from '@/hooks/useUserMealPlans';

export interface SelectedFood {
  food: FoodItem;
  unit: FoodUnit;
  quantity: number;
}

interface FoodSelectorProps {
  ingredients: MealIngredient[];
  onChange: (ingredients: MealIngredient[], macros: { calories: number; protein: number; carbs: number; fat: number }) => void;
}

export function FoodSelector({ ingredients, onChange }: FoodSelectorProps) {
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>(() =>
    ingredientsToSelectedFoods(ingredients)
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  // Sync changes upward
  const emitChange = (foods: SelectedFood[]) => {
    setSelectedFoods(foods);
    const newIngredients: MealIngredient[] = foods.map(f => ({
      item: f.food.name,
      quantity: `${f.quantity} ${f.unit.label}`,
    }));
    const totalMacros = foods.reduce(
      (acc, f) => {
        const m = calculateMacros(f.food, f.unit, f.quantity);
        return {
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          carbs: acc.carbs + m.carbs,
          fat: acc.fat + m.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    onChange(newIngredients, {
      calories: Math.round(totalMacros.calories),
      protein: Math.round(totalMacros.protein),
      carbs: Math.round(totalMacros.carbs),
      fat: Math.round(totalMacros.fat),
    });
  };

  const addFood = (food: FoodItem) => {
    const newFood: SelectedFood = {
      food,
      unit: food.units[0],
      quantity: 1,
    };
    emitChange([...selectedFoods, newFood]);
    setSearchOpen(false);
  };

  const updateFood = (index: number, updates: Partial<SelectedFood>) => {
    const newFoods = [...selectedFoods];
    newFoods[index] = { ...newFoods[index], ...updates };
    emitChange(newFoods);
  };

  const removeFood = (index: number) => {
    emitChange(selectedFoods.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Ingredientes</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
            <Search className="w-3.5 h-3.5 mr-1" />
            Buscar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setCustomOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {/* Selected foods list */}
      <div className="space-y-2">
        {selectedFoods.map((sf, idx) => {
          const macros = calculateMacros(sf.food, sf.unit, sf.quantity);
          return (
            <div key={idx} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">{sf.food.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeFood(idx)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={sf.quantity || ''}
                  onFocus={e => { if (sf.quantity === 0) e.target.value = ''; }}
                  onChange={e => updateFood(idx, { quantity: parseFloat(e.target.value) || 0 })}
                  placeholder="Qtd"
                  className="w-20 h-8 text-sm"
                />
                <Select
                  value={sf.unit.label}
                  onValueChange={label => {
                    const unit = sf.food.units.find(u => u.label === label);
                    if (unit) updateFood(idx, { unit });
                  }}
                >
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sf.food.units.map(u => (
                      <SelectItem key={u.label} value={u.label} className="text-xs">
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{macros.calories} kcal</span>
                <span>P: {macros.protein}g</span>
                <span>C: {macros.carbs}g</span>
                <span>G: {macros.fat}g</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedFoods.length > 0 && (
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
          <p className="text-xs font-semibold text-primary mb-1">Total da refeição</p>
          <div className="flex gap-3 text-xs">
            {(() => {
              const total = selectedFoods.reduce(
                (acc, f) => {
                  const m = calculateMacros(f.food, f.unit, f.quantity);
                  return { cal: acc.cal + m.calories, p: acc.p + m.protein, c: acc.c + m.carbs, f: acc.f + m.fat };
                },
                { cal: 0, p: 0, c: 0, f: 0 }
              );
              return (
                <>
                  <span className="font-bold">{Math.round(total.cal)} kcal</span>
                  <span>P: {Math.round(total.p)}g</span>
                  <span>C: {Math.round(total.c)}g</span>
                  <span>G: {Math.round(total.f)}g</span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <FoodSearchDialog open={searchOpen} onOpenChange={setSearchOpen} onSelect={addFood} />
      <CustomFoodDialog open={customOpen} onOpenChange={setCustomOpen} onAdd={addFood} />
    </div>
  );
}

// === Search Dialog ===
function FoodSearchDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (o: boolean) => void; onSelect: (f: FoodItem) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const categories = useMemo(() => getFoodCategories(), []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCategory('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const results = useMemo(() => searchFoods(query, category || undefined), [query, category]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Buscar Alimento</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Digite o nome do alimento..."
              className="pl-9"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Badge
              variant={!category ? 'default' : 'outline'}
              className="cursor-pointer shrink-0 text-xs"
              onClick={() => setCategory('')}
            >
              Todos
            </Badge>
            {categories.map(c => (
              <Badge
                key={c}
                variant={category === c ? 'default' : 'outline'}
                className="cursor-pointer shrink-0 text-xs"
                onClick={() => setCategory(category === c ? '' : c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum alimento encontrado</p>
          ) : (
            <div className="space-y-1">
              {results.map(food => (
                <button
                  key={food.id}
                  onClick={() => onSelect(food)}
                  className="w-full text-left rounded-lg p-2.5 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{food.name}</span>
                    <span className="text-xs text-muted-foreground">{food.kcalPer100} kcal/100g</span>
                  </div>
                  <div className="flex gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span>P: {food.proteinPer100}g</span>
                    <span>C: {food.carbsPer100}g</span>
                    <span>G: {food.fatPer100}g</span>
                    <Badge variant="outline" className="text-[10px] h-4 ml-auto">{food.category}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// === Custom Food Dialog ===
function CustomFoodDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (f: FoodItem) => void }) {
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const custom: FoodItem = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      category: 'Personalizado',
      kcalPer100: parseFloat(kcal) || 0,
      proteinPer100: parseFloat(protein) || 0,
      carbsPer100: parseFloat(carbs) || 0,
      fatPer100: parseFloat(fat) || 0,
      units: [
        { label: 'g', gramsEquivalent: 1 },
        { label: 'porção (100g)', gramsEquivalent: 100 },
        { label: 'colher de sopa (15g)', gramsEquivalent: 15 },
        { label: 'unidade', gramsEquivalent: 100 },
        { label: 'ml', gramsEquivalent: 1 },
      ],
      isCustom: true,
    };
    onAdd(custom);
    onOpenChange(false);
    setName(''); setKcal(''); setProtein(''); setCarbs(''); setFat('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cadastrar Alimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nome do alimento</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bolo caseiro" />
          </div>
          <p className="text-xs text-muted-foreground">Valores nutricionais por 100g:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Calorias (kcal)</Label>
              <Input type="number" value={kcal} onChange={e => setKcal(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Proteína (g)</Label>
              <Input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Carboidratos (g)</Label>
              <Input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Gordura (g)</Label>
              <Input type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder="0" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim()} className="w-full">
            Cadastrar e Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Fuzzy match: find the best food from the database for a given ingredient name
function findBestMatch(name: string): FoodItem | null {
  const lower = name.toLowerCase().trim();
  
  // 1. Exact match
  const exact = foodDatabase.find(f => f.name.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Map of common ingredient names to food IDs
  const aliasMap: Record<string, string> = {
    'ovos': 'ovo_inteiro',
    'ovo': 'ovo_inteiro',
    'ovos mexidos': 'ovo_inteiro',
    'ovo cozido': 'ovo_inteiro',
    'ovo frito': 'ovo_inteiro',
    'clara': 'ovo_clara',
    'claras': 'ovo_clara',
    'aveia': 'aveia',
    'banana': 'banana',
    'banana média': 'banana',
    'banana prata': 'banana',
    'maçã': 'maca',
    'abacate': 'abacate',
    'arroz': 'arroz_branco',
    'arroz integral': 'arroz_integral',
    'arroz branco': 'arroz_branco',
    'feijão': 'feijao_carioca',
    'feijão carioca': 'feijao_carioca',
    'feijão preto': 'feijao_preto',
    'frango': 'frango_peito',
    'frango grelhado': 'frango_peito',
    'filé de frango': 'frango_peito',
    'filé de frango grelhado': 'frango_peito',
    'frango desfiado': 'frango_desfiado',
    'peito de frango': 'frango_peito',
    'salmão': 'salmao',
    'salmão assado': 'salmao',
    'atum': 'atum_lata',
    'atum em água': 'atum_lata',
    'atum em lata': 'atum_lata',
    'leite': 'leite_integral',
    'leite integral': 'leite_integral',
    'leite desnatado': 'leite_desnatado',
    'leite desnatado ou chá': 'leite_desnatado',
    'iogurte': 'iogurte_natural',
    'iogurte natural': 'iogurte_natural',
    'queijo': 'queijo_minas',
    'queijo minas': 'queijo_minas',
    'queijo minas frescal': 'queijo_minas',
    'pão': 'pao_frances',
    'pão francês': 'pao_frances',
    'pão integral': 'pao_integral',
    'tapioca': 'tapioca',
    'whey': 'whey_protein',
    'whey protein': 'whey_protein',
    'castanhas': 'castanha_caju',
    'castanha': 'castanha_caju',
    'pasta de amendoim': 'pasta_amendoim',
    'chia': 'chia',
    'semente de chia': 'chia',
    'chocolate': 'chocolate_amargo',
    'chocolate 70%': 'chocolate_amargo',
    'chocolate 70% cacau': 'chocolate_amargo',
    'chocolate amargo': 'chocolate_amargo',
    'café': 'cafe',
    'chá': 'cha',
    'chá de camomila': 'cha',
    'chá de sua preferência': 'cha',
    'azeite': 'azeite',
    'azeite e limão': 'azeite',
    'quinoa': 'quinoa',
    'brócolis': 'brocolis',
    'brócolis no vapor': 'brocolis',
    'batata doce': 'batata_doce',
    'batata-doce': 'batata_doce',
    'batata': 'batata_inglesa',
    'tomate': 'tomate',
    'tomate cereja': 'tomate_cereja',
    'cenoura': 'cenoura',
    'pepino': 'pepino',
    'alface': 'alface',
    'rúcula': 'rucula',
    'salada': 'alface',
    'salada de folhas verdes': 'alface',
    'salada de rúcula': 'rucula',
    'folhas verdes': 'alface',
    'legumes': 'cenoura',
    'legumes variados': 'cenoura',
    'legumes cozidos': 'cenoura',
    'tomate, pepino e cenoura': 'tomate',
    'limão': 'limao',
    'suco de laranja': 'suco_laranja',
    'manteiga': 'manteiga',
    'requeijão': 'requeijao',
    'cream cheese': 'cream_cheese',
    'granola': 'granola',
    'mel': 'mel',
    'linhaça': 'linhaca',
    'lentilha': 'lentilha',
    'grão-de-bico': 'grao_bico',
    'carne': 'carne_bovina',
    'carne moída': 'carne_moida',
    'presunto': 'presunto',
    'peito de peru': 'peito_peru',
  };

  const aliasId = aliasMap[lower];
  if (aliasId) {
    const found = foodDatabase.find(f => f.id === aliasId);
    if (found) return found;
  }

  // 3. Partial match: food name contains ingredient or vice versa
  const partial = foodDatabase.find(f => f.name.toLowerCase().includes(lower) || lower.includes(f.name.toLowerCase()));
  if (partial) return partial;

  // 4. Word-based match
  const words = lower.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    let bestScore = 0;
    let bestFood: FoodItem | null = null;
    for (const food of foodDatabase) {
      const fName = food.name.toLowerCase();
      const score = words.filter(w => fName.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestFood = food;
      }
    }
    if (bestScore > 0 && bestFood) return bestFood;
  }

  return null;
}

// Try to match existing ingredients to food database
function ingredientsToSelectedFoods(ingredients: MealIngredient[]): SelectedFood[] {
  return ingredients.map(ing => {
    const match = findBestMatch(ing.item);
    if (match) {
      // Try to parse quantity
      const qtyMatch = ing.quantity?.match(/^([\d.,]+)\s*(.*)$/);
      let quantity = 1;
      let unit = match.units[0];
      if (qtyMatch) {
        quantity = parseFloat(qtyMatch[1].replace(',', '.')) || 1;
        const unitLabel = qtyMatch[2].trim();
        const foundUnit = match.units.find(u => u.label.toLowerCase().includes(unitLabel.toLowerCase()));
        if (foundUnit) unit = foundUnit;
      }
      return { food: match, unit, quantity };
    }
    // No match - create a generic entry
    const genericFood: FoodItem = {
      id: `generic_${ing.item}`,
      name: ing.item,
      category: 'Personalizado',
      kcalPer100: 0,
      proteinPer100: 0,
      carbsPer100: 0,
      fatPer100: 0,
      units: [
        { label: 'g', gramsEquivalent: 1 },
        { label: 'porção (100g)', gramsEquivalent: 100 },
        { label: 'unidade', gramsEquivalent: 100 },
        { label: 'colher de sopa (15g)', gramsEquivalent: 15 },
      ],
    };
    return { food: genericFood, unit: genericFood.units[2], quantity: 1 };
  });
}
