// Nutritional values per 100g (or 100ml for liquids)
export interface FoodItem {
  id: string;
  name: string;
  category: string;
  kcalPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  units: FoodUnit[];
  isCustom?: boolean;
}

export interface FoodUnit {
  label: string;
  gramsEquivalent: number; // how many grams 1 unit equals
}

const COMMON_UNITS: FoodUnit[] = [
  { label: 'g', gramsEquivalent: 1 },
  { label: 'kg', gramsEquivalent: 1000 },
];

const LIQUID_UNITS: FoodUnit[] = [
  { label: 'ml', gramsEquivalent: 1 },
  { label: 'L', gramsEquivalent: 1000 },
  { label: 'copo (200ml)', gramsEquivalent: 200 },
  { label: 'xícara (240ml)', gramsEquivalent: 240 },
];

const SPOON_UNITS: FoodUnit[] = [
  { label: 'g', gramsEquivalent: 1 },
  { label: 'colher de sopa (15g)', gramsEquivalent: 15 },
  { label: 'colher de chá (5g)', gramsEquivalent: 5 },
  { label: 'xícara (120g)', gramsEquivalent: 120 },
];

const EGG_UNITS: FoodUnit[] = [
  { label: 'unidade (50g)', gramsEquivalent: 50 },
  { label: 'g', gramsEquivalent: 1 },
];

const FRUIT_UNITS: FoodUnit[] = [
  { label: 'unidade média', gramsEquivalent: 150 },
  { label: 'unidade pequena', gramsEquivalent: 100 },
  { label: 'unidade grande', gramsEquivalent: 200 },
  { label: 'fatia', gramsEquivalent: 50 },
  { label: 'g', gramsEquivalent: 1 },
];

const SLICE_UNITS: FoodUnit[] = [
  { label: 'fatia (30g)', gramsEquivalent: 30 },
  { label: 'g', gramsEquivalent: 1 },
];

const MEAT_UNITS: FoodUnit[] = [
  { label: 'g', gramsEquivalent: 1 },
  { label: 'filé (120g)', gramsEquivalent: 120 },
  { label: 'bife (100g)', gramsEquivalent: 100 },
  { label: 'peito (150g)', gramsEquivalent: 150 },
  { label: 'porção (180g)', gramsEquivalent: 180 },
];

const BREAD_UNITS: FoodUnit[] = [
  { label: 'fatia (25g)', gramsEquivalent: 25 },
  { label: 'unidade (50g)', gramsEquivalent: 50 },
  { label: 'g', gramsEquivalent: 1 },
];

const CAN_UNITS: FoodUnit[] = [
  { label: 'lata (130g)', gramsEquivalent: 130 },
  { label: 'g', gramsEquivalent: 1 },
];

const HANDFUL_UNITS: FoodUnit[] = [
  { label: 'punhado (30g)', gramsEquivalent: 30 },
  { label: 'unidade', gramsEquivalent: 3 },
  { label: 'g', gramsEquivalent: 1 },
];

export const foodDatabase: FoodItem[] = [
  // === PROTEÍNAS / CARNES ===
  { id: 'frango_peito', name: 'Frango (peito grelhado)', category: 'Proteínas', kcalPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6, units: MEAT_UNITS },
  { id: 'frango_coxa', name: 'Frango (coxa/sobrecoxa)', category: 'Proteínas', kcalPer100: 209, proteinPer100: 26, carbsPer100: 0, fatPer100: 11, units: MEAT_UNITS },
  { id: 'frango_desfiado', name: 'Frango desfiado', category: 'Proteínas', kcalPer100: 163, proteinPer100: 30, carbsPer100: 0, fatPer100: 4, units: [...MEAT_UNITS, { label: 'colher de sopa (25g)', gramsEquivalent: 25 }] },
  { id: 'carne_bovina', name: 'Carne bovina (patinho)', category: 'Proteínas', kcalPer100: 219, proteinPer100: 26, carbsPer100: 0, fatPer100: 12, units: MEAT_UNITS },
  { id: 'carne_moida', name: 'Carne moída', category: 'Proteínas', kcalPer100: 250, proteinPer100: 25, carbsPer100: 0, fatPer100: 16, units: [...MEAT_UNITS, { label: 'colher de sopa (25g)', gramsEquivalent: 25 }] },
  { id: 'picanha', name: 'Picanha', category: 'Proteínas', kcalPer100: 290, proteinPer100: 23, carbsPer100: 0, fatPer100: 22, units: MEAT_UNITS },
  { id: 'costela', name: 'Costela bovina', category: 'Proteínas', kcalPer100: 304, proteinPer100: 21, carbsPer100: 0, fatPer100: 24, units: MEAT_UNITS },
  { id: 'linguica', name: 'Linguiça', category: 'Proteínas', kcalPer100: 296, proteinPer100: 16, carbsPer100: 2, fatPer100: 25, units: [{ label: 'unidade (60g)', gramsEquivalent: 60 }, ...COMMON_UNITS] },
  { id: 'carne_porco', name: 'Carne de porco (lombo)', category: 'Proteínas', kcalPer100: 210, proteinPer100: 27, carbsPer100: 0, fatPer100: 11, units: MEAT_UNITS },
  { id: 'bacon', name: 'Bacon', category: 'Proteínas', kcalPer100: 541, proteinPer100: 37, carbsPer100: 1, fatPer100: 42, units: [{ label: 'fatia (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'presunto', name: 'Presunto', category: 'Proteínas', kcalPer100: 134, proteinPer100: 18, carbsPer100: 2, fatPer100: 6, units: SLICE_UNITS },
  { id: 'peito_peru', name: 'Peito de peru', category: 'Proteínas', kcalPer100: 104, proteinPer100: 18, carbsPer100: 3, fatPer100: 2, units: SLICE_UNITS },
  { id: 'cordeiro', name: 'Cordeiro', category: 'Proteínas', kcalPer100: 282, proteinPer100: 25, carbsPer100: 0, fatPer100: 20, units: MEAT_UNITS },

  // === PEIXES E FRUTOS DO MAR ===
  { id: 'salmao', name: 'Salmão', category: 'Peixes', kcalPer100: 208, proteinPer100: 20, carbsPer100: 0, fatPer100: 13, units: [{ label: 'filé (150g)', gramsEquivalent: 150 }, ...COMMON_UNITS] },
  { id: 'atum_lata', name: 'Atum em lata', category: 'Peixes', kcalPer100: 116, proteinPer100: 26, carbsPer100: 0, fatPer100: 1, units: CAN_UNITS },
  { id: 'tilapia', name: 'Tilápia', category: 'Peixes', kcalPer100: 128, proteinPer100: 26, carbsPer100: 0, fatPer100: 2.7, units: [{ label: 'filé (120g)', gramsEquivalent: 120 }, ...COMMON_UNITS] },
  { id: 'bacalhau', name: 'Bacalhau', category: 'Peixes', kcalPer100: 136, proteinPer100: 29, carbsPer100: 0, fatPer100: 2, units: MEAT_UNITS },
  { id: 'sardinha', name: 'Sardinha em lata', category: 'Peixes', kcalPer100: 208, proteinPer100: 24, carbsPer100: 0, fatPer100: 12, units: CAN_UNITS },
  { id: 'camarao', name: 'Camarão', category: 'Peixes', kcalPer100: 99, proteinPer100: 24, carbsPer100: 0, fatPer100: 0.3, units: [{ label: 'porção (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'merluza', name: 'Merluza', category: 'Peixes', kcalPer100: 90, proteinPer100: 18, carbsPer100: 0, fatPer100: 2, units: [{ label: 'filé (120g)', gramsEquivalent: 120 }, ...COMMON_UNITS] },

  // === OVOS ===
  { id: 'ovo_inteiro', name: 'Ovo inteiro', category: 'Ovos', kcalPer100: 155, proteinPer100: 13, carbsPer100: 1, fatPer100: 11, units: EGG_UNITS },
  { id: 'ovo_clara', name: 'Clara de ovo', category: 'Ovos', kcalPer100: 52, proteinPer100: 11, carbsPer100: 0.7, fatPer100: 0.2, units: [{ label: 'unidade (33g)', gramsEquivalent: 33 }, ...COMMON_UNITS] },
  { id: 'ovo_codorna', name: 'Ovo de codorna', category: 'Ovos', kcalPer100: 158, proteinPer100: 13, carbsPer100: 0.4, fatPer100: 11, units: [{ label: 'unidade (10g)', gramsEquivalent: 10 }, ...COMMON_UNITS] },

  // === LATICÍNIOS ===
  { id: 'leite_integral', name: 'Leite integral', category: 'Laticínios', kcalPer100: 61, proteinPer100: 3.2, carbsPer100: 4.8, fatPer100: 3.3, units: LIQUID_UNITS },
  { id: 'leite_desnatado', name: 'Leite desnatado', category: 'Laticínios', kcalPer100: 35, proteinPer100: 3.4, carbsPer100: 5, fatPer100: 0.1, units: LIQUID_UNITS },
  { id: 'leite_semi', name: 'Leite semi-desnatado', category: 'Laticínios', kcalPer100: 46, proteinPer100: 3.3, carbsPer100: 4.9, fatPer100: 1.6, units: LIQUID_UNITS },
  { id: 'iogurte_natural', name: 'Iogurte natural', category: 'Laticínios', kcalPer100: 59, proteinPer100: 3.5, carbsPer100: 5, fatPer100: 3, units: [{ label: 'pote (170g)', gramsEquivalent: 170 }, ...LIQUID_UNITS] },
  { id: 'iogurte_grego', name: 'Iogurte grego', category: 'Laticínios', kcalPer100: 97, proteinPer100: 9, carbsPer100: 4, fatPer100: 5, units: [{ label: 'pote (170g)', gramsEquivalent: 170 }, ...LIQUID_UNITS] },
  { id: 'iogurte_desnatado', name: 'Iogurte desnatado', category: 'Laticínios', kcalPer100: 40, proteinPer100: 4, carbsPer100: 6, fatPer100: 0.2, units: [{ label: 'pote (170g)', gramsEquivalent: 170 }, ...LIQUID_UNITS] },
  { id: 'queijo_minas', name: 'Queijo minas frescal', category: 'Laticínios', kcalPer100: 264, proteinPer100: 17, carbsPer100: 3, fatPer100: 20, units: [{ label: 'fatia (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'queijo_mussarela', name: 'Queijo mussarela', category: 'Laticínios', kcalPer100: 318, proteinPer100: 22, carbsPer100: 3, fatPer100: 24, units: SLICE_UNITS },
  { id: 'queijo_prato', name: 'Queijo prato', category: 'Laticínios', kcalPer100: 358, proteinPer100: 23, carbsPer100: 2, fatPer100: 29, units: SLICE_UNITS },
  { id: 'queijo_parmesao', name: 'Queijo parmesão', category: 'Laticínios', kcalPer100: 431, proteinPer100: 38, carbsPer100: 4, fatPer100: 29, units: [{ label: 'colher de sopa (10g)', gramsEquivalent: 10 }, ...COMMON_UNITS] },
  { id: 'queijo_cottage', name: 'Queijo cottage', category: 'Laticínios', kcalPer100: 98, proteinPer100: 11, carbsPer100: 3, fatPer100: 4, units: [{ label: 'colher de sopa (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },
  { id: 'requeijao', name: 'Requeijão cremoso', category: 'Laticínios', kcalPer100: 257, proteinPer100: 7, carbsPer100: 3, fatPer100: 24, units: [{ label: 'colher de sopa (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },
  { id: 'cream_cheese', name: 'Cream cheese', category: 'Laticínios', kcalPer100: 342, proteinPer100: 6, carbsPer100: 4, fatPer100: 34, units: [{ label: 'colher de sopa (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'manteiga', name: 'Manteiga', category: 'Laticínios', kcalPer100: 717, proteinPer100: 0.9, carbsPer100: 0.1, fatPer100: 81, units: [{ label: 'colher de chá (5g)', gramsEquivalent: 5 }, { label: 'colher de sopa (12g)', gramsEquivalent: 12 }, ...COMMON_UNITS] },
  { id: 'creme_leite', name: 'Creme de leite', category: 'Laticínios', kcalPer100: 195, proteinPer100: 2.1, carbsPer100: 3.6, fatPer100: 19, units: [{ label: 'colher de sopa (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'whey_protein', name: 'Whey protein', category: 'Laticínios', kcalPer100: 375, proteinPer100: 75, carbsPer100: 10, fatPer100: 4, units: [{ label: 'scoop (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },

  // === CEREAIS E GRÃOS ===
  { id: 'arroz_branco', name: 'Arroz branco cozido', category: 'Cereais', kcalPer100: 130, proteinPer100: 2.7, carbsPer100: 28, fatPer100: 0.3, units: [{ label: 'colher de sopa (25g)', gramsEquivalent: 25 }, { label: 'xícara (160g)', gramsEquivalent: 160 }, ...COMMON_UNITS] },
  { id: 'arroz_integral', name: 'Arroz integral cozido', category: 'Cereais', kcalPer100: 124, proteinPer100: 2.6, carbsPer100: 26, fatPer100: 1, units: [{ label: 'colher de sopa (25g)', gramsEquivalent: 25 }, { label: 'xícara (160g)', gramsEquivalent: 160 }, ...COMMON_UNITS] },
  { id: 'feijao_carioca', name: 'Feijão carioca cozido', category: 'Cereais', kcalPer100: 76, proteinPer100: 4.8, carbsPer100: 14, fatPer100: 0.5, units: [{ label: 'concha (80g)', gramsEquivalent: 80 }, { label: 'colher de sopa (25g)', gramsEquivalent: 25 }, ...COMMON_UNITS] },
  { id: 'feijao_preto', name: 'Feijão preto cozido', category: 'Cereais', kcalPer100: 77, proteinPer100: 4.5, carbsPer100: 14, fatPer100: 0.5, units: [{ label: 'concha (80g)', gramsEquivalent: 80 }, { label: 'colher de sopa (25g)', gramsEquivalent: 25 }, ...COMMON_UNITS] },
  { id: 'lentilha', name: 'Lentilha cozida', category: 'Cereais', kcalPer100: 93, proteinPer100: 6.3, carbsPer100: 16, fatPer100: 0.4, units: [{ label: 'concha (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'grao_bico', name: 'Grão-de-bico cozido', category: 'Cereais', kcalPer100: 164, proteinPer100: 9, carbsPer100: 27, fatPer100: 2.6, units: [{ label: 'concha (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'ervilha', name: 'Ervilha cozida', category: 'Cereais', kcalPer100: 81, proteinPer100: 5.4, carbsPer100: 14, fatPer100: 0.4, units: [{ label: 'colher de sopa (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },
  { id: 'quinoa', name: 'Quinoa cozida', category: 'Cereais', kcalPer100: 120, proteinPer100: 4.4, carbsPer100: 21, fatPer100: 1.9, units: [{ label: 'colher de sopa (25g)', gramsEquivalent: 25 }, ...COMMON_UNITS] },
  { id: 'aveia', name: 'Aveia em flocos', category: 'Cereais', kcalPer100: 389, proteinPer100: 17, carbsPer100: 66, fatPer100: 7, units: SPOON_UNITS },
  { id: 'granola', name: 'Granola', category: 'Cereais', kcalPer100: 471, proteinPer100: 10, carbsPer100: 64, fatPer100: 20, units: SPOON_UNITS },
  { id: 'tapioca', name: 'Tapioca (goma)', category: 'Cereais', kcalPer100: 340, proteinPer100: 0.5, carbsPer100: 85, fatPer100: 0.1, units: SPOON_UNITS },
  { id: 'milho', name: 'Milho cozido', category: 'Cereais', kcalPer100: 96, proteinPer100: 3.2, carbsPer100: 21, fatPer100: 1.2, units: [{ label: 'espiga', gramsEquivalent: 100 }, { label: 'colher de sopa (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },
  { id: 'cuscuz', name: 'Cuscuz de milho', category: 'Cereais', kcalPer100: 112, proteinPer100: 2.5, carbsPer100: 25, fatPer100: 0.3, units: [{ label: 'fatia (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },

  // === MASSAS ===
  { id: 'macarrao_cozido', name: 'Macarrão cozido', category: 'Massas', kcalPer100: 158, proteinPer100: 5.8, carbsPer100: 31, fatPer100: 0.9, units: [{ label: 'porção (200g)', gramsEquivalent: 200 }, { label: 'pegador (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'macarrao_integral', name: 'Macarrão integral cozido', category: 'Massas', kcalPer100: 124, proteinPer100: 5.3, carbsPer100: 25, fatPer100: 0.5, units: [{ label: 'porção (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'lasanha', name: 'Lasanha pronta', category: 'Massas', kcalPer100: 170, proteinPer100: 8, carbsPer100: 18, fatPer100: 7, units: [{ label: 'pedaço (250g)', gramsEquivalent: 250 }, ...COMMON_UNITS] },
  { id: 'nhoque', name: 'Nhoque', category: 'Massas', kcalPer100: 133, proteinPer100: 3, carbsPer100: 29, fatPer100: 0.7, units: [{ label: 'porção (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },

  // === PÃES E PADARIA ===
  { id: 'pao_frances', name: 'Pão francês', category: 'Pães', kcalPer100: 300, proteinPer100: 8, carbsPer100: 58, fatPer100: 3, units: [{ label: 'unidade (50g)', gramsEquivalent: 50 }, ...COMMON_UNITS] },
  { id: 'pao_integral', name: 'Pão integral', category: 'Pães', kcalPer100: 247, proteinPer100: 9, carbsPer100: 44, fatPer100: 4, units: BREAD_UNITS },
  { id: 'pao_forma', name: 'Pão de forma', category: 'Pães', kcalPer100: 270, proteinPer100: 8, carbsPer100: 50, fatPer100: 4, units: BREAD_UNITS },
  { id: 'pao_queijo', name: 'Pão de queijo', category: 'Pães', kcalPer100: 363, proteinPer100: 6, carbsPer100: 34, fatPer100: 23, units: [{ label: 'unidade (25g)', gramsEquivalent: 25 }, ...COMMON_UNITS] },
  { id: 'torrada', name: 'Torrada', category: 'Pães', kcalPer100: 410, proteinPer100: 10, carbsPer100: 75, fatPer100: 7, units: [{ label: 'unidade (8g)', gramsEquivalent: 8 }, ...COMMON_UNITS] },
  { id: 'wrap_tortilha', name: 'Wrap/Tortilha', category: 'Pães', kcalPer100: 312, proteinPer100: 8, carbsPer100: 52, fatPer100: 8, units: [{ label: 'unidade (65g)', gramsEquivalent: 65 }, ...COMMON_UNITS] },
  { id: 'biscoito_cream', name: 'Biscoito cream cracker', category: 'Pães', kcalPer100: 442, proteinPer100: 9, carbsPer100: 68, fatPer100: 15, units: [{ label: 'unidade (8g)', gramsEquivalent: 8 }, { label: 'pacote (26g)', gramsEquivalent: 26 }, ...COMMON_UNITS] },

  // === TUBÉRCULOS ===
  { id: 'batata_inglesa', name: 'Batata inglesa cozida', category: 'Tubérculos', kcalPer100: 86, proteinPer100: 1.7, carbsPer100: 20, fatPer100: 0.1, units: [{ label: 'unidade média (130g)', gramsEquivalent: 130 }, ...COMMON_UNITS] },
  { id: 'batata_doce', name: 'Batata-doce cozida', category: 'Tubérculos', kcalPer100: 77, proteinPer100: 0.6, carbsPer100: 18, fatPer100: 0.1, units: [{ label: 'unidade média (130g)', gramsEquivalent: 130 }, ...COMMON_UNITS] },
  { id: 'mandioca', name: 'Mandioca/Aipim cozida', category: 'Tubérculos', kcalPer100: 125, proteinPer100: 0.6, carbsPer100: 30, fatPer100: 0.3, units: [{ label: 'pedaço (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'inhame', name: 'Inhame cozido', category: 'Tubérculos', kcalPer100: 97, proteinPer100: 2, carbsPer100: 23, fatPer100: 0.1, units: [{ label: 'pedaço (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'mandioquinha', name: 'Mandioquinha cozida', category: 'Tubérculos', kcalPer100: 89, proteinPer100: 1, carbsPer100: 21, fatPer100: 0.2, units: [{ label: 'unidade (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },

  // === FRUTAS ===
  { id: 'banana', name: 'Banana', category: 'Frutas', kcalPer100: 89, proteinPer100: 1.1, carbsPer100: 23, fatPer100: 0.3, units: [{ label: 'unidade média (120g)', gramsEquivalent: 120 }, ...COMMON_UNITS] },
  { id: 'maca', name: 'Maçã', category: 'Frutas', kcalPer100: 52, proteinPer100: 0.3, carbsPer100: 14, fatPer100: 0.2, units: FRUIT_UNITS },
  { id: 'laranja', name: 'Laranja', category: 'Frutas', kcalPer100: 47, proteinPer100: 0.9, carbsPer100: 12, fatPer100: 0.1, units: [{ label: 'unidade média (180g)', gramsEquivalent: 180 }, ...COMMON_UNITS] },
  { id: 'mamao', name: 'Mamão', category: 'Frutas', kcalPer100: 40, proteinPer100: 0.5, carbsPer100: 10, fatPer100: 0.1, units: [{ label: 'fatia (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'manga', name: 'Manga', category: 'Frutas', kcalPer100: 60, proteinPer100: 0.8, carbsPer100: 15, fatPer100: 0.4, units: [{ label: 'unidade (300g)', gramsEquivalent: 300 }, { label: 'fatia (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'abacaxi', name: 'Abacaxi', category: 'Frutas', kcalPer100: 50, proteinPer100: 0.5, carbsPer100: 13, fatPer100: 0.1, units: [{ label: 'fatia (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'melancia', name: 'Melancia', category: 'Frutas', kcalPer100: 30, proteinPer100: 0.6, carbsPer100: 8, fatPer100: 0.2, units: [{ label: 'fatia (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'melao', name: 'Melão', category: 'Frutas', kcalPer100: 34, proteinPer100: 0.8, carbsPer100: 8, fatPer100: 0.2, units: [{ label: 'fatia (150g)', gramsEquivalent: 150 }, ...COMMON_UNITS] },
  { id: 'morango', name: 'Morango', category: 'Frutas', kcalPer100: 32, proteinPer100: 0.7, carbsPer100: 8, fatPer100: 0.3, units: [{ label: 'unidade (12g)', gramsEquivalent: 12 }, { label: 'xícara (150g)', gramsEquivalent: 150 }, ...COMMON_UNITS] },
  { id: 'uva', name: 'Uva', category: 'Frutas', kcalPer100: 69, proteinPer100: 0.7, carbsPer100: 18, fatPer100: 0.2, units: [{ label: 'cacho (150g)', gramsEquivalent: 150 }, ...COMMON_UNITS] },
  { id: 'abacate', name: 'Abacate', category: 'Frutas', kcalPer100: 160, proteinPer100: 2, carbsPer100: 9, fatPer100: 15, units: [{ label: 'unidade (200g)', gramsEquivalent: 200 }, { label: '1/4 unidade (50g)', gramsEquivalent: 50 }, ...COMMON_UNITS] },
  { id: 'kiwi', name: 'Kiwi', category: 'Frutas', kcalPer100: 61, proteinPer100: 1.1, carbsPer100: 15, fatPer100: 0.5, units: [{ label: 'unidade (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'pera', name: 'Pêra', category: 'Frutas', kcalPer100: 57, proteinPer100: 0.4, carbsPer100: 15, fatPer100: 0.1, units: FRUIT_UNITS },
  { id: 'pessego', name: 'Pêssego', category: 'Frutas', kcalPer100: 39, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.3, units: FRUIT_UNITS },
  { id: 'ameixa', name: 'Ameixa', category: 'Frutas', kcalPer100: 46, proteinPer100: 0.7, carbsPer100: 11, fatPer100: 0.3, units: [{ label: 'unidade (60g)', gramsEquivalent: 60 }, ...COMMON_UNITS] },
  { id: 'acai', name: 'Açaí (polpa)', category: 'Frutas', kcalPer100: 58, proteinPer100: 0.8, carbsPer100: 6, fatPer100: 3.5, units: [{ label: 'tigela (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'goiaba', name: 'Goiaba', category: 'Frutas', kcalPer100: 54, proteinPer100: 0.9, carbsPer100: 13, fatPer100: 0.4, units: FRUIT_UNITS },
  { id: 'maracuja', name: 'Maracujá (polpa)', category: 'Frutas', kcalPer100: 68, proteinPer100: 2, carbsPer100: 16, fatPer100: 0.4, units: [{ label: 'unidade (15g polpa)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'coco_ralado', name: 'Coco ralado', category: 'Frutas', kcalPer100: 354, proteinPer100: 3, carbsPer100: 15, fatPer100: 33, units: SPOON_UNITS },
  { id: 'limao', name: 'Limão (suco)', category: 'Frutas', kcalPer100: 22, proteinPer100: 0.4, carbsPer100: 7, fatPer100: 0.2, units: [{ label: 'unidade (30ml)', gramsEquivalent: 30 }, ...LIQUID_UNITS] },

  // === VERDURAS E LEGUMES ===
  { id: 'alface', name: 'Alface', category: 'Verduras', kcalPer100: 15, proteinPer100: 1.4, carbsPer100: 2.9, fatPer100: 0.2, units: [{ label: 'folha (10g)', gramsEquivalent: 10 }, { label: 'prato (50g)', gramsEquivalent: 50 }, ...COMMON_UNITS] },
  { id: 'tomate', name: 'Tomate', category: 'Verduras', kcalPer100: 18, proteinPer100: 0.9, carbsPer100: 3.9, fatPer100: 0.2, units: [{ label: 'unidade (120g)', gramsEquivalent: 120 }, { label: 'rodela (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'cenoura', name: 'Cenoura', category: 'Verduras', kcalPer100: 41, proteinPer100: 0.9, carbsPer100: 10, fatPer100: 0.2, units: [{ label: 'unidade (70g)', gramsEquivalent: 70 }, ...COMMON_UNITS] },
  { id: 'brocolis', name: 'Brócolis', category: 'Verduras', kcalPer100: 34, proteinPer100: 2.8, carbsPer100: 7, fatPer100: 0.4, units: [{ label: 'xícara (90g)', gramsEquivalent: 90 }, { label: 'ramo (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'couve_flor', name: 'Couve-flor', category: 'Verduras', kcalPer100: 25, proteinPer100: 1.9, carbsPer100: 5, fatPer100: 0.3, units: [{ label: 'xícara (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'espinafre', name: 'Espinafre', category: 'Verduras', kcalPer100: 23, proteinPer100: 2.9, carbsPer100: 3.6, fatPer100: 0.4, units: [{ label: 'xícara (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'couve', name: 'Couve refogada', category: 'Verduras', kcalPer100: 90, proteinPer100: 3, carbsPer100: 7, fatPer100: 6, units: [{ label: 'colher de sopa (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'rucula', name: 'Rúcula', category: 'Verduras', kcalPer100: 25, proteinPer100: 2.6, carbsPer100: 3.7, fatPer100: 0.7, units: [{ label: 'prato (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'pepino', name: 'Pepino', category: 'Verduras', kcalPer100: 16, proteinPer100: 0.7, carbsPer100: 3.6, fatPer100: 0.1, units: [{ label: 'unidade (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'cebola', name: 'Cebola', category: 'Verduras', kcalPer100: 40, proteinPer100: 1.1, carbsPer100: 9, fatPer100: 0.1, units: [{ label: 'unidade (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'abobrinha', name: 'Abobrinha', category: 'Verduras', kcalPer100: 17, proteinPer100: 1.2, carbsPer100: 3, fatPer100: 0.3, units: [{ label: 'unidade (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'berinjela', name: 'Berinjela', category: 'Verduras', kcalPer100: 25, proteinPer100: 1, carbsPer100: 6, fatPer100: 0.2, units: [{ label: 'unidade (250g)', gramsEquivalent: 250 }, ...COMMON_UNITS] },
  { id: 'pimentao', name: 'Pimentão', category: 'Verduras', kcalPer100: 31, proteinPer100: 1, carbsPer100: 6, fatPer100: 0.3, units: [{ label: 'unidade (120g)', gramsEquivalent: 120 }, ...COMMON_UNITS] },
  { id: 'beterraba', name: 'Beterraba cozida', category: 'Verduras', kcalPer100: 44, proteinPer100: 1.7, carbsPer100: 10, fatPer100: 0.2, units: [{ label: 'unidade (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'quiabo', name: 'Quiabo cozido', category: 'Verduras', kcalPer100: 33, proteinPer100: 1.9, carbsPer100: 7, fatPer100: 0.2, units: [{ label: 'porção (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'abobora', name: 'Abóbora cozida', category: 'Verduras', kcalPer100: 26, proteinPer100: 1, carbsPer100: 6.5, fatPer100: 0.1, units: [{ label: 'fatia (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'chuchu', name: 'Chuchu cozido', category: 'Verduras', kcalPer100: 19, proteinPer100: 0.8, carbsPer100: 4.3, fatPer100: 0.1, units: [{ label: 'unidade (150g)', gramsEquivalent: 150 }, ...COMMON_UNITS] },
  { id: 'vagem', name: 'Vagem cozida', category: 'Verduras', kcalPer100: 35, proteinPer100: 1.9, carbsPer100: 8, fatPer100: 0.1, units: [{ label: 'porção (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'tomate_cereja', name: 'Tomate cereja', category: 'Verduras', kcalPer100: 18, proteinPer100: 0.9, carbsPer100: 3.9, fatPer100: 0.2, units: [{ label: 'unidade (10g)', gramsEquivalent: 10 }, ...COMMON_UNITS] },

  // === OLEAGINOSAS E SEMENTES ===
  { id: 'castanha_para', name: 'Castanha-do-pará', category: 'Oleaginosas', kcalPer100: 656, proteinPer100: 14, carbsPer100: 12, fatPer100: 66, units: HANDFUL_UNITS },
  { id: 'castanha_caju', name: 'Castanha de caju', category: 'Oleaginosas', kcalPer100: 553, proteinPer100: 18, carbsPer100: 30, fatPer100: 44, units: HANDFUL_UNITS },
  { id: 'amendoim', name: 'Amendoim torrado', category: 'Oleaginosas', kcalPer100: 567, proteinPer100: 26, carbsPer100: 16, fatPer100: 49, units: HANDFUL_UNITS },
  { id: 'nozes', name: 'Nozes', category: 'Oleaginosas', kcalPer100: 654, proteinPer100: 15, carbsPer100: 14, fatPer100: 65, units: HANDFUL_UNITS },
  { id: 'amendoas', name: 'Amêndoas', category: 'Oleaginosas', kcalPer100: 579, proteinPer100: 21, carbsPer100: 22, fatPer100: 50, units: HANDFUL_UNITS },
  { id: 'pasta_amendoim', name: 'Pasta de amendoim', category: 'Oleaginosas', kcalPer100: 588, proteinPer100: 25, carbsPer100: 20, fatPer100: 50, units: [{ label: 'colher de sopa (15g)', gramsEquivalent: 15 }, { label: 'colher de chá (5g)', gramsEquivalent: 5 }, ...COMMON_UNITS] },
  { id: 'chia', name: 'Semente de chia', category: 'Oleaginosas', kcalPer100: 486, proteinPer100: 17, carbsPer100: 42, fatPer100: 31, units: [{ label: 'colher de sopa (12g)', gramsEquivalent: 12 }, ...COMMON_UNITS] },
  { id: 'linhaça', name: 'Semente de linhaça', category: 'Oleaginosas', kcalPer100: 534, proteinPer100: 18, carbsPer100: 29, fatPer100: 42, units: [{ label: 'colher de sopa (10g)', gramsEquivalent: 10 }, ...COMMON_UNITS] },
  { id: 'gergelim', name: 'Gergelim', category: 'Oleaginosas', kcalPer100: 573, proteinPer100: 18, carbsPer100: 23, fatPer100: 50, units: [{ label: 'colher de sopa (10g)', gramsEquivalent: 10 }, ...COMMON_UNITS] },
  { id: 'semente_girassol', name: 'Semente de girassol', category: 'Oleaginosas', kcalPer100: 584, proteinPer100: 21, carbsPer100: 20, fatPer100: 51, units: HANDFUL_UNITS },

  // === ÓLEOS E GORDURAS ===
  { id: 'azeite', name: 'Azeite de oliva', category: 'Óleos', kcalPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, units: [{ label: 'colher de sopa (13ml)', gramsEquivalent: 13 }, { label: 'colher de chá (5ml)', gramsEquivalent: 5 }, ...LIQUID_UNITS] },
  { id: 'oleo_soja', name: 'Óleo de soja', category: 'Óleos', kcalPer100: 884, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, units: [{ label: 'colher de sopa (13ml)', gramsEquivalent: 13 }, ...LIQUID_UNITS] },
  { id: 'oleo_coco', name: 'Óleo de coco', category: 'Óleos', kcalPer100: 862, proteinPer100: 0, carbsPer100: 0, fatPer100: 100, units: [{ label: 'colher de sopa (13ml)', gramsEquivalent: 13 }, ...LIQUID_UNITS] },

  // === DOCES E AÇÚCARES ===
  { id: 'acucar', name: 'Açúcar refinado', category: 'Doces', kcalPer100: 387, proteinPer100: 0, carbsPer100: 100, fatPer100: 0, units: [{ label: 'colher de chá (5g)', gramsEquivalent: 5 }, { label: 'colher de sopa (12g)', gramsEquivalent: 12 }, ...COMMON_UNITS] },
  { id: 'mel', name: 'Mel', category: 'Doces', kcalPer100: 304, proteinPer100: 0.3, carbsPer100: 82, fatPer100: 0, units: [{ label: 'colher de sopa (21g)', gramsEquivalent: 21 }, { label: 'colher de chá (7g)', gramsEquivalent: 7 }, ...COMMON_UNITS] },
  { id: 'chocolate_amargo', name: 'Chocolate 70% cacau', category: 'Doces', kcalPer100: 598, proteinPer100: 8, carbsPer100: 46, fatPer100: 43, units: [{ label: 'quadradinho (10g)', gramsEquivalent: 10 }, { label: 'barra (25g)', gramsEquivalent: 25 }, ...COMMON_UNITS] },
  { id: 'chocolate_leite', name: 'Chocolate ao leite', category: 'Doces', kcalPer100: 535, proteinPer100: 8, carbsPer100: 59, fatPer100: 30, units: [{ label: 'quadradinho (10g)', gramsEquivalent: 10 }, { label: 'barra (25g)', gramsEquivalent: 25 }, ...COMMON_UNITS] },
  { id: 'sorvete', name: 'Sorvete', category: 'Doces', kcalPer100: 207, proteinPer100: 3.5, carbsPer100: 24, fatPer100: 11, units: [{ label: 'bola (60g)', gramsEquivalent: 60 }, ...COMMON_UNITS] },
  { id: 'brigadeiro', name: 'Brigadeiro', category: 'Doces', kcalPer100: 370, proteinPer100: 5, carbsPer100: 60, fatPer100: 12, units: [{ label: 'unidade (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },
  { id: 'pudim', name: 'Pudim', category: 'Doces', kcalPer100: 240, proteinPer100: 5, carbsPer100: 35, fatPer100: 9, units: [{ label: 'fatia (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'bolo_chocolate', name: 'Bolo de chocolate', category: 'Doces', kcalPer100: 370, proteinPer100: 5, carbsPer100: 50, fatPer100: 17, units: [{ label: 'fatia (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'geleia', name: 'Geleia de frutas', category: 'Doces', kcalPer100: 250, proteinPer100: 0.4, carbsPer100: 65, fatPer100: 0.1, units: [{ label: 'colher de sopa (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },

  // === BEBIDAS ===
  { id: 'cafe', name: 'Café (sem açúcar)', category: 'Bebidas', kcalPer100: 2, proteinPer100: 0.1, carbsPer100: 0, fatPer100: 0, units: [{ label: 'xícara (50ml)', gramsEquivalent: 50 }, ...LIQUID_UNITS] },
  { id: 'cha', name: 'Chá (sem açúcar)', category: 'Bebidas', kcalPer100: 1, proteinPer100: 0, carbsPer100: 0.3, fatPer100: 0, units: [{ label: 'xícara (200ml)', gramsEquivalent: 200 }, ...LIQUID_UNITS] },
  { id: 'suco_laranja', name: 'Suco de laranja natural', category: 'Bebidas', kcalPer100: 45, proteinPer100: 0.7, carbsPer100: 10, fatPer100: 0.2, units: [{ label: 'copo (250ml)', gramsEquivalent: 250 }, ...LIQUID_UNITS] },
  { id: 'suco_verde', name: 'Suco verde', category: 'Bebidas', kcalPer100: 30, proteinPer100: 0.5, carbsPer100: 7, fatPer100: 0.2, units: [{ label: 'copo (300ml)', gramsEquivalent: 300 }, ...LIQUID_UNITS] },
  { id: 'agua_coco', name: 'Água de coco', category: 'Bebidas', kcalPer100: 19, proteinPer100: 0.7, carbsPer100: 3.7, fatPer100: 0.2, units: [{ label: 'copo (200ml)', gramsEquivalent: 200 }, ...LIQUID_UNITS] },
  { id: 'refrigerante', name: 'Refrigerante', category: 'Bebidas', kcalPer100: 42, proteinPer100: 0, carbsPer100: 11, fatPer100: 0, units: [{ label: 'lata (350ml)', gramsEquivalent: 350 }, { label: 'copo (300ml)', gramsEquivalent: 300 }, ...LIQUID_UNITS] },
  { id: 'refrigerante_zero', name: 'Refrigerante zero', category: 'Bebidas', kcalPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0, units: [{ label: 'lata (350ml)', gramsEquivalent: 350 }, ...LIQUID_UNITS] },
  { id: 'cerveja', name: 'Cerveja', category: 'Bebidas', kcalPer100: 43, proteinPer100: 0.5, carbsPer100: 3.6, fatPer100: 0, units: [{ label: 'lata (350ml)', gramsEquivalent: 350 }, { label: 'long neck (355ml)', gramsEquivalent: 355 }, ...LIQUID_UNITS] },
  { id: 'vinho_tinto', name: 'Vinho tinto', category: 'Bebidas', kcalPer100: 85, proteinPer100: 0.1, carbsPer100: 2.6, fatPer100: 0, units: [{ label: 'taça (150ml)', gramsEquivalent: 150 }, ...LIQUID_UNITS] },
  { id: 'leite_vegetal', name: 'Leite vegetal (amêndoas)', category: 'Bebidas', kcalPer100: 15, proteinPer100: 0.6, carbsPer100: 0.3, fatPer100: 1.2, units: LIQUID_UNITS },

  // === TEMPEROS E MOLHOS ===
  { id: 'alho', name: 'Alho', category: 'Temperos', kcalPer100: 149, proteinPer100: 6.4, carbsPer100: 33, fatPer100: 0.5, units: [{ label: 'dente (3g)', gramsEquivalent: 3 }, ...COMMON_UNITS] },
  { id: 'molho_tomate', name: 'Molho de tomate', category: 'Temperos', kcalPer100: 32, proteinPer100: 1.2, carbsPer100: 6, fatPer100: 0.5, units: [{ label: 'colher de sopa (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'maionese', name: 'Maionese', category: 'Temperos', kcalPer100: 680, proteinPer100: 1, carbsPer100: 1, fatPer100: 75, units: [{ label: 'colher de sopa (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'mostarda', name: 'Mostarda', category: 'Temperos', kcalPer100: 60, proteinPer100: 4, carbsPer100: 5, fatPer100: 3, units: [{ label: 'colher de chá (5g)', gramsEquivalent: 5 }, ...COMMON_UNITS] },
  { id: 'ketchup', name: 'Ketchup', category: 'Temperos', kcalPer100: 112, proteinPer100: 1, carbsPer100: 28, fatPer100: 0.1, units: [{ label: 'colher de sopa (15g)', gramsEquivalent: 15 }, ...COMMON_UNITS] },
  { id: 'shoyu', name: 'Molho shoyu', category: 'Temperos', kcalPer100: 53, proteinPer100: 8, carbsPer100: 5, fatPer100: 0, units: [{ label: 'colher de sopa (15ml)', gramsEquivalent: 15 }, ...LIQUID_UNITS] },
  { id: 'vinagre', name: 'Vinagre', category: 'Temperos', kcalPer100: 18, proteinPer100: 0, carbsPer100: 0.6, fatPer100: 0, units: [{ label: 'colher de sopa (15ml)', gramsEquivalent: 15 }, ...LIQUID_UNITS] },

  // === COMIDAS PRONTAS / FAST FOOD ===
  { id: 'pizza', name: 'Pizza (fatia mussarela)', category: 'Prontos', kcalPer100: 266, proteinPer100: 11, carbsPer100: 33, fatPer100: 10, units: [{ label: 'fatia (115g)', gramsEquivalent: 115 }, ...COMMON_UNITS] },
  { id: 'hamburguer', name: 'Hambúrguer (pão + carne)', category: 'Prontos', kcalPer100: 250, proteinPer100: 13, carbsPer100: 24, fatPer100: 12, units: [{ label: 'unidade (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'coxinha', name: 'Coxinha', category: 'Prontos', kcalPer100: 279, proteinPer100: 8, carbsPer100: 26, fatPer100: 16, units: [{ label: 'unidade (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'pastel', name: 'Pastel frito', category: 'Prontos', kcalPer100: 320, proteinPer100: 7, carbsPer100: 30, fatPer100: 19, units: [{ label: 'unidade (100g)', gramsEquivalent: 100 }, ...COMMON_UNITS] },
  { id: 'esfiha', name: 'Esfiha', category: 'Prontos', kcalPer100: 260, proteinPer100: 9, carbsPer100: 30, fatPer100: 12, units: [{ label: 'unidade (80g)', gramsEquivalent: 80 }, ...COMMON_UNITS] },
  { id: 'empada', name: 'Empada', category: 'Prontos', kcalPer100: 330, proteinPer100: 7, carbsPer100: 28, fatPer100: 21, units: [{ label: 'unidade (60g)', gramsEquivalent: 60 }, ...COMMON_UNITS] },
  { id: 'batata_frita', name: 'Batata frita', category: 'Prontos', kcalPer100: 312, proteinPer100: 3.4, carbsPer100: 41, fatPer100: 15, units: [{ label: 'porção média (120g)', gramsEquivalent: 120 }, ...COMMON_UNITS] },
  { id: 'sushi', name: 'Sushi (niguiri)', category: 'Prontos', kcalPer100: 150, proteinPer100: 6, carbsPer100: 25, fatPer100: 3, units: [{ label: 'unidade (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'temaki', name: 'Temaki', category: 'Prontos', kcalPer100: 170, proteinPer100: 8, carbsPer100: 22, fatPer100: 6, units: [{ label: 'unidade (200g)', gramsEquivalent: 200 }, ...COMMON_UNITS] },
  { id: 'acai_preparado', name: 'Açaí preparado (com granola)', category: 'Prontos', kcalPer100: 180, proteinPer100: 2, carbsPer100: 28, fatPer100: 7, units: [{ label: 'tigela 300ml', gramsEquivalent: 300 }, { label: 'tigela 500ml', gramsEquivalent: 500 }, ...COMMON_UNITS] },
  { id: 'farofa', name: 'Farofa', category: 'Prontos', kcalPer100: 403, proteinPer100: 2, carbsPer100: 52, fatPer100: 20, units: [{ label: 'colher de sopa (20g)', gramsEquivalent: 20 }, ...COMMON_UNITS] },
  { id: 'pirao', name: 'Pirão', category: 'Prontos', kcalPer100: 80, proteinPer100: 2, carbsPer100: 17, fatPer100: 0.5, units: [{ label: 'colher de sopa (30g)', gramsEquivalent: 30 }, ...COMMON_UNITS] },
  { id: 'feijao_tropeiro', name: 'Feijão tropeiro', category: 'Prontos', kcalPer100: 140, proteinPer100: 7, carbsPer100: 16, fatPer100: 5, units: [{ label: 'colher de sopa (40g)', gramsEquivalent: 40 }, ...COMMON_UNITS] },
  { id: 'strogonoff', name: 'Strogonoff de frango', category: 'Prontos', kcalPer100: 140, proteinPer100: 12, carbsPer100: 5, fatPer100: 8, units: [{ label: 'concha (120g)', gramsEquivalent: 120 }, ...COMMON_UNITS] },
  { id: 'feijoada', name: 'Feijoada', category: 'Prontos', kcalPer100: 160, proteinPer100: 10, carbsPer100: 8, fatPer100: 10, units: [{ label: 'concha (150g)', gramsEquivalent: 150 }, ...COMMON_UNITS] },
];

// Helper: calculate macros from a food item + unit + quantity
export function calculateMacros(food: FoodItem, unit: FoodUnit, quantity: number) {
  const totalGrams = unit.gramsEquivalent * quantity;
  const factor = totalGrams / 100;
  return {
    calories: Math.round(food.kcalPer100 * factor),
    protein: Math.round(food.proteinPer100 * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100 * factor * 10) / 10,
    fat: Math.round(food.fatPer100 * factor * 10) / 10,
    totalGrams: Math.round(totalGrams),
  };
}

// Get unique categories
export function getFoodCategories(): string[] {
  return [...new Set(foodDatabase.map(f => f.category))];
}

// Search foods
export function searchFoods(query: string, category?: string): FoodItem[] {
  const lower = query.toLowerCase().trim();
  let results = foodDatabase;
  if (category) results = results.filter(f => f.category === category);
  if (lower) results = results.filter(f => f.name.toLowerCase().includes(lower));
  return results;
}
