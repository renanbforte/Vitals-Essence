// Astral Calculations — Vitalis Essence / Astral module
// Sun sign, Moon sign (approximation), Ascendant, Life Path Number

export const SIGNS = [
  'Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem',
  'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'
] as const;

export type ZodiacSign = typeof SIGNS[number];

export const SIGN_SYMBOLS: Record<ZodiacSign, string> = {
  'Áries': '♈', 'Touro': '♉', 'Gêmeos': '♊', 'Câncer': '♋',
  'Leão': '♌', 'Virgem': '♍', 'Libra': '♎', 'Escorpião': '♏',
  'Sagitário': '♐', 'Capricórnio': '♑', 'Aquário': '♒', 'Peixes': '♓'
};

export const SIGN_COLORS: Record<ZodiacSign, string> = {
  'Áries': '#FF6B6B', 'Touro': '#4ECDC4', 'Gêmeos': '#FFE66D',
  'Câncer': '#A8DADC', 'Leão': '#FFD93D', 'Virgem': '#95D5B2',
  'Libra': '#FF9FF3', 'Escorpião': '#C44569', 'Sagitário': '#F8A5C2',
  'Capricórnio': '#778CA3', 'Aquário': '#5F27CD', 'Peixes': '#00D2D3'
};

export const SIGN_ELEMENTS: Record<ZodiacSign, string> = {
  'Áries': 'Fogo', 'Touro': 'Terra', 'Gêmeos': 'Ar', 'Câncer': 'Água',
  'Leão': 'Fogo', 'Virgem': 'Terra', 'Libra': 'Ar', 'Escorpião': 'Água',
  'Sagitário': 'Fogo', 'Capricórnio': 'Terra', 'Aquário': 'Ar', 'Peixes': 'Água'
};

export const SIGN_DESCRIPTIONS: Record<ZodiacSign, { sun: string; moon: string; rising: string }> = {
  'Áries': {
    sun: 'Você é uma chama viva — pioneiro, corajoso e cheio de energia vital. Sua alma anseia por novos começos e desafios que fazem o sangue pulsar.',
    moon: 'Sua alma emocional é impetuosa e apaixonada. Você sente tudo com intensidade e age por instinto puro.',
    rising: 'O mundo te vê como alguém dinâmico, direto e magnético. Sua presença acende o ambiente.'
  },
  'Touro': {
    sun: 'Você é a força da terra — estável, sensual e determinado. Constrói com paciência o que durará para sempre.',
    moon: 'Sua alma busca segurança, conforto e beleza. Você precisa de estabilidade emocional para florescer.',
    rising: 'O mundo te vê como alguém confiável, elegante e de presença acolhedora.'
  },
  'Gêmeos': {
    sun: 'Você é um espírito dual e curioso — brilhante na comunicação, adaptável e eternamente jovem em essência.',
    moon: 'Sua alma processa emoções através da mente. Você precisa conversar, analisar e conectar ideias para sentir paz.',
    rising: 'O mundo te vê como alguém espirituoso, versátil e sempre com algo interessante a dizer.'
  },
  'Câncer': {
    sun: 'Você é o guardião da alma — intuitivo, protetor e profundamente empático. Seu lar é o seu santuário.',
    moon: 'Você está em casa aqui. Sua lua natal amplifica sua intuição e profundidade emocional imensamente.',
    rising: 'O mundo te vê como alguém caloroso, acolhedor e com uma profundidade misteriosa.'
  },
  'Leão': {
    sun: 'Você é luz solar personificada — criativo, generoso e nascido para brilhar. Sua presença aquece tudo ao redor.',
    moon: 'Sua alma precisa de reconhecimento e expressão criativa. O amor é seu alimento emocional mais puro.',
    rising: 'O mundo te vê como alguém carismático, nobre e de presença irresistível.'
  },
  'Virgem': {
    sun: 'Você é a mente analítica a serviço do coração — preciso, dedicado e com um dom natural para curar e organizar.',
    moon: 'Sua alma encontra paz na ordem e no serviço. Você processa emoções analisando-as com cuidado.',
    rising: 'O mundo te vê como alguém competente, detalhista e de grande integridade.'
  },
  'Libra': {
    sun: 'Você é o artesão da harmonia — elegante, justo e com um talento inato para criar beleza nas relações.',
    moon: 'Sua alma floresce em relacionamentos equilibrados. Você precisa de harmonia ao redor para sentir paz interior.',
    rising: 'O mundo te vê como alguém refinado, diplomático e encantador.'
  },
  'Escorpião': {
    sun: 'Você é a profundeza do oceano — intenso, transformador e com uma capacidade única de renascer das cinzas.',
    moon: 'Sua alma sente tudo em camadas. Você guarda segredos preciosos e ama com uma devoção que poucos compreendem.',
    rising: 'O mundo te vê como alguém magnético, misterioso e de olhar penetrante.'
  },
  'Sagitário': {
    sun: 'Você é a flecha apontada para o horizonte — aventureiro, filosófico e eternamente em busca de verdades maiores.',
    moon: 'Sua alma precisa de liberdade e expansão. Você encontra paz nas grandes questões e em novos territórios.',
    rising: 'O mundo te vê como alguém otimista, aventureiro e com uma risada contagiante.'
  },
  'Capricórnio': {
    sun: 'Você é a montanha em marcha lenta e firme — ambicioso, disciplinado e construtor de legados que atravessam o tempo.',
    moon: 'Sua alma é discreta e resiliente. Você expressa amor através de atos concretos e responsabilidade.',
    rising: 'O mundo te vê como alguém sério, capaz e com uma autoridade natural.'
  },
  'Aquário': {
    sun: 'Você é o visionário à frente do tempo — original, humanitário e com uma mente que quebra todos os padrões.',
    moon: 'Sua alma precisa de liberdade intelectual. Você processa emoções de forma única, às vezes surpreendente.',
    rising: 'O mundo te vê como alguém único, progressista e com uma energia elétrica.'
  },
  'Peixes': {
    sun: 'Você é o oceano da alma — empático, criativo e com um acesso natural ao invisível e ao sagrado.',
    moon: 'Sua alma é porosa e sensível. Você absorve as energias ao redor e conecta mundos através da intuição.',
    rising: 'O mundo te vê como alguém etéreo, compassivo e com um charme difuso e encantador.'
  }
};

// Sun sign calculation based on birth date
export function calculateSunSign(birthDate: Date): ZodiacSign {
  const month = birthDate.getMonth() + 1; // 1-12
  const day = birthDate.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Áries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Touro';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gêmeos';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Câncer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leão';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgem';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Escorpião';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagitário';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricórnio';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquário';
  return 'Peixes';
}

// Approximate Moon sign (cycles ~2.5 days per sign)
// Based on known reference: Moon was in Áries on Jan 1, 2000 00:00 UTC
export function calculateMoonSign(birthDate: Date): ZodiacSign {
  const referenceDate = new Date('2000-01-06T18:14:00Z'); // Known new moon reference
  const msPerDay = 86400000;
  const lunarCycleDays = 29.53058770576;
  const daysSinceRef = (birthDate.getTime() - referenceDate.getTime()) / msPerDay;
  const cyclePosition = ((daysSinceRef % lunarCycleDays) + lunarCycleDays) % lunarCycleDays;
  const daysPerSign = lunarCycleDays / 12;
  const signIndex = Math.floor(cyclePosition / daysPerSign) % 12;
  return SIGNS[signIndex];
}

// Ascendant approximation based on birth time and sun sign
export function calculateAscendant(birthDate: Date, birthTimeStr?: string): ZodiacSign {
  const sunSign = calculateSunSign(birthDate);
  if (!birthTimeStr) return sunSign; // Default: ascendant same as sun

  const [h, m] = birthTimeStr.split(':').map(Number);
  const totalMinutes = h * 60 + (m || 0);

  // Each sign rises for ~2 hours. Base on sun sign index
  const sunIndex = SIGNS.indexOf(sunSign);
  // Approximate: noon = sun sign on ascendant, adjust by hours from noon
  const hoursFromNoon = (totalMinutes / 60) - 12;
  const signShift = Math.round(hoursFromNoon / 2);
  const ascIndex = ((sunIndex + signShift) % 12 + 12) % 12;
  return SIGNS[ascIndex];
}

// Life Path Number (numerology)
export function calculateLifePathNumber(birthDate: Date): number {
  const dateStr = birthDate.toISOString().split('T')[0].replace(/-/g, '');
  const sum = dateStr.split('').reduce((acc, d) => acc + parseInt(d), 0);
  // Reduce to single digit (except master numbers 11, 22, 33)
  let n = sum;
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n).split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return n;
}

// Planet positions (simplified — based on approximate orbital periods)
export const PLANETS = ['Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte', 'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão'] as const;
export type Planet = typeof PLANETS[number];

export function calculatePlanetPlacements(birthDate: Date, birthTimeStr?: string): Array<{
  planet: Planet;
  sign: ZodiacSign;
  house: number;
  degrees: number;
}> {
  const sunSign = calculateSunSign(birthDate);
  const moonSign = calculateMoonSign(birthDate);
  const ascendant = calculateAscendant(birthDate, birthTimeStr);
  const ascIndex = SIGNS.indexOf(ascendant);

  // Approximate planet positions relative to sun
  const year = birthDate.getFullYear();
  const dayOfYear = Math.floor((birthDate.getTime() - new Date(year, 0, 0).getTime()) / 86400000);

  const getSign = (offset: number): ZodiacSign => SIGNS[Math.abs(offset % 12)] as ZodiacSign;
  const getHouse = (signIndex: number): number => ((signIndex - ascIndex + 12) % 12) + 1;

  const sunIndex = SIGNS.indexOf(sunSign);
  const moonIndex = SIGNS.indexOf(moonSign);

  // Mercury is always within 1 sign of Sun
  const mercuryOffset = dayOfYear % 3 === 0 ? -1 : dayOfYear % 3 === 1 ? 0 : 1;
  const mercuryIndex = ((sunIndex + mercuryOffset) % 12 + 12) % 12;

  // Venus within 2 signs of Sun
  const venusOffset = ((year + dayOfYear) % 5) - 2;
  const venusIndex = ((sunIndex + venusOffset) % 12 + 12) % 12;

  // Mars ~2 year cycle
  const marsIndex = ((sunIndex + Math.floor(dayOfYear / 60)) % 12 + 12) % 12;

  // Outer planets move slowly
  const jupiterIndex = ((year - 2000) % 12 + 12) % 12;
  const saturnIndex = (Math.floor((year - 1988) / 2.5) % 12 + 12) % 12;
  const uranusIndex = (Math.floor((year - 1996) / 7) % 12 + 12) % 12;
  const neptuneIndex = (Math.floor((year - 1984) / 14) % 12 + 12) % 12;
  const plutoIndex = (Math.floor((year - 2008) / 20) % 12 + 12) % 12;

  const placements = [
    { planet: 'Sol' as Planet, idx: sunIndex, deg: (dayOfYear / 365) * 30 },
    { planet: 'Lua' as Planet, idx: moonIndex, deg: ((dayOfYear * 13.18) % 30) },
    { planet: 'Mercúrio' as Planet, idx: mercuryIndex, deg: (dayOfYear % 30) },
    { planet: 'Vênus' as Planet, idx: venusIndex, deg: ((dayOfYear * 1.6) % 30) },
    { planet: 'Marte' as Planet, idx: marsIndex, deg: ((dayOfYear / 2) % 30) },
    { planet: 'Júpiter' as Planet, idx: jupiterIndex, deg: ((year * 3.3) % 30) },
    { planet: 'Saturno' as Planet, idx: saturnIndex, deg: ((year * 1.2) % 30) },
    { planet: 'Urano' as Planet, idx: uranusIndex, deg: ((year * 0.5) % 30) },
    { planet: 'Netuno' as Planet, idx: neptuneIndex, deg: ((year * 0.2) % 30) },
    { planet: 'Plutão' as Planet, idx: plutoIndex, deg: ((year * 0.15) % 30) },
  ];

  return placements.map(({ planet, idx, deg }) => ({
    planet,
    sign: SIGNS[Math.abs(idx % 12)] as ZodiacSign,
    house: getHouse(Math.abs(idx % 12)),
    degrees: Math.round(deg * 10) / 10,
  }));
}

// Moon phases
export function getMoonPhase(date: Date = new Date()): { name: string; emoji: string; insight: string } {
  const knownNewMoon = new Date('2024-01-11T11:57:00Z');
  const lunarCycle = 29.53058770576;
  const daysSince = (date.getTime() - knownNewMoon.getTime()) / 86400000;
  const cyclePos = ((daysSince % lunarCycle) + lunarCycle) % lunarCycle;

  if (cyclePos < 1.85) return { name: 'Lua Nova', emoji: '🌑', insight: 'Tempo de semear intenções e começar novos ciclos. O cosmos convida você ao silêncio criativo.' };
  if (cyclePos < 7.38) return { name: 'Lua Crescente', emoji: '🌒', insight: 'Sua energia está em expansão. Aja com coragem sobre o que foi plantado na lua nova.' };
  if (cyclePos < 9.22) return { name: 'Quarto Crescente', emoji: '🌓', insight: 'Momento de superar obstáculos. Tome decisões com clareza e determinação.' };
  if (cyclePos < 14.77) return { name: 'Lua Gibosa Crescente', emoji: '🌔', insight: 'Refinamento e dedicação. Aperfeiçoe seus projetos antes da culminação.' };
  if (cyclePos < 16.61) return { name: 'Lua Cheia', emoji: '🌕', insight: 'Culminação e revelação. Tudo que estava oculto vem à tona. Celebre suas conquistas.' };
  if (cyclePos < 22.15) return { name: 'Lua Minguante', emoji: '🌖', insight: 'Gratidão e liberação. Solte o que não serve mais ao seu caminho.' };
  if (cyclePos < 23.99) return { name: 'Quarto Minguante', emoji: '🌗', insight: 'Momento de reflexão e rendição. Confie no processo cósmico.' };
  return { name: 'Lua Balsâmica', emoji: '🌘', insight: 'O fim de um ciclo. Descanse, integre e prepare-se para o novo começo.' };
}

// Life path descriptions
export const LIFE_PATH_DESCRIPTIONS: Record<number, string> = {
  1: 'O Líder — sua alma veio para pioneirar, liderar e criar. Você é um catalisador de mudança.',
  2: 'O Diplomata — sua missão é unir, equilibrar e trazer harmonia ao mundo através da sensibilidade.',
  3: 'O Criador — expressão, alegria e comunicação são seus presentes. Você inspira através da arte.',
  4: 'O Construtor — disciplina, ordem e trabalho árduo são seus alicerces. Você constrói o eterno.',
  5: 'O Aventureiro — liberdade, mudança e experiências múltiplas são sua moeda de troca com o universo.',
  6: 'O Curador — amor, família e serviço aos outros compõem sua missão de vida mais profunda.',
  7: 'O Sábio — busca interior, espiritualidade e profundidade intelectual guiam sua jornada singular.',
  8: 'O Realizador — poder, abundância e liderança material são os temas centrais de sua missão.',
  9: 'O Humanitário — compaixão universal, sabedoria e serviço à humanidade definem seu propósito.',
  11: 'O Visionário (Mestre 11) — intuição elevada e inspiração espiritual são seus dons mais sagrados.',
  22: 'O Mestre Construtor (22) — você tem o poder de manifestar sonhos grandiosos em realidade tangível.',
  33: 'O Mestre Curador (33) — amor incondicional e cura espiritual profunda são sua missão sagrada.',
};

// Compatibility calculation
export function calculateCompatibility(sign1: ZodiacSign, sign2: ZodiacSign): {
  score: number;
  harmony: string[];
  challenges: string[];
  summary: string;
} {
  const elements = SIGN_ELEMENTS;
  const el1 = elements[sign1];
  const el2 = elements[sign2];

  let score = 50;
  const harmony: string[] = [];
  const challenges: string[] = [];

  // Same element = high harmony
  if (el1 === el2) {
    score += 30;
    harmony.push(`Vocês compartilham o elemento ${el1}, criando uma compreensão intuitiva profunda.`);
  }

  // Compatible elements
  const compatMap: Record<string, string[]> = {
    'Fogo': ['Ar', 'Fogo'],
    'Terra': ['Água', 'Terra'],
    'Ar': ['Fogo', 'Ar'],
    'Água': ['Terra', 'Água'],
  };

  if (compatMap[el1]?.includes(el2) && el1 !== el2) {
    score += 20;
    harmony.push(`${el1} e ${el2} se complementam de forma natural e nutritiva.`);
  }

  // Opposite signs (polarity)
  const idx1 = SIGNS.indexOf(sign1);
  const idx2 = SIGNS.indexOf(sign2);
  const distance = Math.abs(idx1 - idx2);

  if (distance === 6) {
    score += 10;
    harmony.push(`${sign1} e ${sign2} são signos opostos — uma atração magnética e transformadora.`);
    challenges.push('A oposição pode gerar tensão. A chave é a integração dos opostos.');
  }

  // Square aspect (90°) = challenge
  if (distance === 3 || distance === 9) {
    score -= 10;
    challenges.push(`A quadratura entre ${sign1} e ${sign2} traz fricção que pode impulsionar crescimento.`);
    challenges.push('Paciência e comunicação aberta são essenciais para superar os desafios.');
  }

  if (score > 85) {
    harmony.push('Existe uma ressonância cósmica raramente encontrada entre vocês.');
  }

  score = Math.min(95, Math.max(40, score));

  const summary = score >= 80
    ? `Uma conexão de ${score}% de harmonia cósmica! As estrelas celebram este encontro de almas.`
    : score >= 65
    ? `${score}% de compatibilidade — uma relação com profundidade e possibilidade de crescimento mútuo.`
    : `${score}% de compatibilidade — há desafios, mas cada obstáculo é um convite ao crescimento conjunto.`;

  return { score, harmony, challenges, summary };
}
