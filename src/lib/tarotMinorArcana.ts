// Minor Arcana card images
import waterAce from '@/assets/tarot/tarot-water-01.png';
import water02 from '@/assets/tarot/tarot-water-02.png';
import water03 from '@/assets/tarot/tarot-water-03.png';
import water04 from '@/assets/tarot/tarot-water-04.png';
import water05 from '@/assets/tarot/tarot-water-05.png';
import water06 from '@/assets/tarot/tarot-water-06.png';
import water07 from '@/assets/tarot/tarot-water-07.png';
import water08 from '@/assets/tarot/tarot-water-08.png';
import water09 from '@/assets/tarot/tarot-water-09.png';
import water10 from '@/assets/tarot/tarot-water-10.png';
import water11 from '@/assets/tarot/tarot-water-11.png';
import water12 from '@/assets/tarot/tarot-water-12.png';
import water13 from '@/assets/tarot/tarot-water-13.png';
import water14 from '@/assets/tarot/tarot-water-14.png';

import earthAce from '@/assets/tarot/tarot-earth-01.png';
import earth02 from '@/assets/tarot/tarot-earth-02.png';
import earth03 from '@/assets/tarot/tarot-earth-03.png';
import earth04 from '@/assets/tarot/tarot-earth-04.png';
import earth05 from '@/assets/tarot/tarot-earth-05.png';
import earth06 from '@/assets/tarot/tarot-earth-06.png';
import earth07 from '@/assets/tarot/tarot-earth-07.png';
import earth08 from '@/assets/tarot/tarot-earth-08.png';
import earth09 from '@/assets/tarot/tarot-earth-09.png';
import earth10 from '@/assets/tarot/tarot-earth-10.png';
import earth11 from '@/assets/tarot/tarot-earth-11.png';
import earth12 from '@/assets/tarot/tarot-earth-12.png';
import earth13 from '@/assets/tarot/tarot-earth-13.png';
import earth14 from '@/assets/tarot/tarot-earth-14.png';

import airAce from '@/assets/tarot/tarot-air-01.png';
import air02 from '@/assets/tarot/tarot-air-02.png';
import air03 from '@/assets/tarot/tarot-air-03.png';
import air04 from '@/assets/tarot/tarot-air-04.png';
import air05 from '@/assets/tarot/tarot-air-05.png';
import air06 from '@/assets/tarot/tarot-air-06.png';
import air07 from '@/assets/tarot/tarot-air-07.png';
import air08 from '@/assets/tarot/tarot-air-08.png';
import air09 from '@/assets/tarot/tarot-air-09.png';
import air10 from '@/assets/tarot/tarot-air-10.png';
import air11 from '@/assets/tarot/tarot-air-11.png';
import air12 from '@/assets/tarot/tarot-air-12.png';
import air13 from '@/assets/tarot/tarot-air-13.png';
import air14 from '@/assets/tarot/tarot-air-14.png';

import fireAce from '@/assets/tarot/tarot-fire-01.png';
import fire02 from '@/assets/tarot/tarot-fire-02.png';
import fire03 from '@/assets/tarot/tarot-fire-03.png';
import fire04 from '@/assets/tarot/tarot-fire-04.png';
import fire05 from '@/assets/tarot/tarot-fire-05.png';
import fire06 from '@/assets/tarot/tarot-fire-06.png';
import fire07 from '@/assets/tarot/tarot-fire-07.png';
import fire08 from '@/assets/tarot/tarot-fire-08.png';
import fire09 from '@/assets/tarot/tarot-fire-09.png';
import fire10 from '@/assets/tarot/tarot-fire-10.png';
import fire11 from '@/assets/tarot/tarot-fire-11.png';
import fire12 from '@/assets/tarot/tarot-fire-12.png';
import fire13 from '@/assets/tarot/tarot-fire-13.png';
import fire14 from '@/assets/tarot/tarot-fire-14.png';

export interface MinorArcanaCard {
  id: string;
  number: number;
  name: string;
  element: string;
  elementLabel: string;
  keywords: string;
  upright: string;
  reversed: string;
  image: string;
}

export const MINOR_ARCANA: MinorArcanaCard[] = [
  // ═══════════════════════════════════════
  // ÁGUA (Copas) — Emoções, amor, intuição
  // ═══════════════════════════════════════
  { id: 'water-01', number: 1, name: 'Ás de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Novo amor, intuição, emoção pura',
    upright: 'Uma nova onda emocional chega até você. Abra seu coração para receber o que o universo oferece.',
    reversed: 'Emoções reprimidas ou bloqueio afetivo. Permita-se sentir.', image: waterAce },
  { id: 'water-02', number: 2, name: 'Dois de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Parceria, união, atração mútua',
    upright: 'Uma conexão significativa se fortalece. Reciprocidade e harmonia fluem entre vocês.',
    reversed: 'Desequilíbrio na relação. Reveja o que está dando e recebendo.', image: water02 },
  { id: 'water-03', number: 3, name: 'Três de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Celebração, amizade, alegria compartilhada',
    upright: 'Momento de celebrar com quem você ama. A alegria é multiplicada quando compartilhada.',
    reversed: 'Excesso ou superficialidade nas relações. Busque conexões mais profundas.', image: water03 },
  { id: 'water-04', number: 4, name: 'Quatro de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Contemplação, apatia, oportunidade ignorada',
    upright: 'Algo novo é oferecido, mas você está preso na contemplação. Abra os olhos para o presente.',
    reversed: 'Despertar de um período de estagnação. Motivação renovada.', image: water04 },
  { id: 'water-05', number: 5, name: 'Cinco de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Perda, luto, arrependimento',
    upright: 'O foco na perda impede ver o que ainda resta. Há bênçãos que você não percebe.',
    reversed: 'Aceitação e recuperação. Você começa a ver além da dor.', image: water05 },
  { id: 'water-06', number: 6, name: 'Seis de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Nostalgia, memórias, inocência',
    upright: 'Doces memórias do passado trazem conforto. Reconecte-se com sua essência mais pura.',
    reversed: 'Preso ao passado. É hora de seguir em frente com gratidão.', image: water06 },
  { id: 'water-07', number: 7, name: 'Sete de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Ilusão, fantasia, escolhas difíceis',
    upright: 'Nem tudo que brilha é real. Separe sonhos válidos de ilusões que distraem.',
    reversed: 'Clareza surge. Você finalmente enxerga a realidade como ela é.', image: water07 },
  { id: 'water-08', number: 8, name: 'Oito de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Partida, busca interior, desapego',
    upright: 'É hora de deixar para trás o que não nutre mais sua alma e seguir em busca de algo maior.',
    reversed: 'Medo de se mover. Coragem para dar o próximo passo.', image: water08 },
  { id: 'water-09', number: 9, name: 'Nove de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Realização de desejos, satisfação, abundância',
    upright: 'Seus desejos mais profundos estão se manifestando. Permita-se receber com gratidão.',
    reversed: 'Insatisfação apesar das conquistas. Reavalie o que realmente importa.', image: water09 },
  { id: 'water-10', number: 10, name: 'Dez de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Felicidade plena, harmonia familiar, bênção',
    upright: 'Plenitude emocional e harmonia reinam. Um ciclo de bênçãos se completa em sua vida.',
    reversed: 'Desarmonia familiar ou expectativas irrealistas de perfeição.', image: water10 },
  { id: 'water-11', number: 11, name: 'Pajem de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Mensagem emocional, criatividade, sensibilidade',
    upright: 'Uma mensagem do coração chega até você. Abra-se para novas inspirações criativas.',
    reversed: 'Imaturidade emocional ou bloqueio criativo. Cultive sua sensibilidade.', image: water11 },
  { id: 'water-12', number: 12, name: 'Cavaleiro de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Romance, convite, seguir o coração',
    upright: 'Um convite romântico ou proposta inspiradora surge. Siga o que toca seu coração.',
    reversed: 'Idealismo excessivo ou decepção amorosa. Mantenha os pés no chão.', image: water12 },
  { id: 'water-13', number: 13, name: 'Rainha de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Intuição, compaixão, profundidade emocional',
    upright: 'Confie na sua sabedoria emocional. Sua intuição é seu maior guia neste momento.',
    reversed: 'Codependência ou manipulação emocional. Estabeleça limites saudáveis.', image: water13 },
  { id: 'water-14', number: 14, name: 'Rei de Água', element: 'water', elementLabel: '💧 Água',
    keywords: 'Maturidade emocional, diplomacia, equilíbrio',
    upright: 'Domine suas emoções com sabedoria e compaixão. Você é o porto seguro dos que o cercam.',
    reversed: 'Frieza emocional ou manipulação. Reconecte-se com seus sentimentos genuínos.', image: water14 },

  // ═══════════════════════════════════════
  // TERRA (Ouros) — Materialidade, trabalho, corpo
  // ═══════════════════════════════════════
  { id: 'earth-01', number: 1, name: 'Ás de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Nova oportunidade material, prosperidade, semente',
    upright: 'Uma semente de abundância é plantada. Uma oportunidade material concreta se apresenta.',
    reversed: 'Oportunidade desperdiçada ou ganância. Avalie com cuidado antes de agir.', image: earthAce },
  { id: 'earth-02', number: 2, name: 'Dois de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Equilíbrio, adaptação, malabarismo',
    upright: 'Equilibre suas prioridades com graça. A flexibilidade é sua aliada agora.',
    reversed: 'Sobrecarga ou desorganização. Simplifique e priorize.', image: earth02 },
  { id: 'earth-03', number: 3, name: 'Três de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Trabalho em equipe, maestria, colaboração',
    upright: 'Sua habilidade é reconhecida. A colaboração eleva o resultado de todos.',
    reversed: 'Falta de planejamento ou conflitos na equipe. Busque alinhamento.', image: earth03 },
  { id: 'earth-04', number: 4, name: 'Quatro de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Segurança, controle, possessividade',
    upright: 'Proteção dos seus recursos é sábia, mas não se apegue demais. Saiba quando compartilhar.',
    reversed: 'Generosidade ou desprendimento material. Deixe a abundância fluir.', image: earth04 },
  { id: 'earth-05', number: 5, name: 'Cinco de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Dificuldade financeira, exclusão, provação',
    upright: 'Um período desafiador testa sua resiliência. Ajuda está mais perto do que imagina.',
    reversed: 'Recuperação financeira. A tempestade começa a passar.', image: earth05 },
  { id: 'earth-06', number: 6, name: 'Seis de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Generosidade, caridade, equilíbrio de dar e receber',
    upright: 'O fluxo de dar e receber traz equilíbrio à sua vida. Compartilhe com generosidade.',
    reversed: 'Dívidas emocionais ou exploração. Restaure o equilíbrio nas trocas.', image: earth06 },
  { id: 'earth-07', number: 7, name: 'Sete de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Paciência, investimento, crescimento lento',
    upright: 'As sementes plantadas estão crescendo. Tenha paciência — os frutos virão no tempo certo.',
    reversed: 'Impaciência ou investimentos mal direcionados. Reavalie sua estratégia.', image: earth07 },
  { id: 'earth-08', number: 8, name: 'Oito de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Dedicação, aperfeiçoamento, disciplina',
    upright: 'O domínio vem da prática constante. Sua dedicação está construindo algo extraordinário.',
    reversed: 'Perfeccionismo paralisante ou trabalho sem propósito. Reconecte-se com o significado.', image: earth08 },
  { id: 'earth-09', number: 9, name: 'Nove de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Autossuficiência, luxo merecido, conquista pessoal',
    upright: 'Você construiu algo belo por conta própria. Desfrute da abundância que conquistou.',
    reversed: 'Isolamento na prosperidade ou dependência material. Conecte-se com o que importa.', image: earth09 },
  { id: 'earth-10', number: 10, name: 'Dez de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Legado, riqueza familiar, tradição',
    upright: 'Você é parte de algo maior que você mesmo. Honre seu legado e construa para o futuro.',
    reversed: 'Conflitos familiares sobre bens ou perda de tradição. Valorize o que realmente importa.', image: earth10 },
  { id: 'earth-11', number: 11, name: 'Pajem de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Aprendizado, ambição, novo projeto',
    upright: 'Um novo projeto ou estudo desperta seu interesse. Invista em conhecimento prático.',
    reversed: 'Falta de foco ou procrastinação. Comprometa-se com um caminho.', image: earth11 },
  { id: 'earth-12', number: 12, name: 'Cavaleiro de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Persistência, rotina, progresso constante',
    upright: 'O progresso vem do esforço constante. Continue no caminho — a persistência vence.',
    reversed: 'Estagnação ou teimosia improdutiva. Adapte-se sem perder o foco.', image: earth12 },
  { id: 'earth-13', number: 13, name: 'Rainha de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Abundância prática, conforto, nutrição',
    upright: 'Crie um ambiente de nutrição e abundância ao seu redor. Você é o pilar que sustenta.',
    reversed: 'Negligência com o autocuidado ou materialismo excessivo. Reequilibre.', image: earth13 },
  { id: 'earth-14', number: 14, name: 'Rei de Terra', element: 'earth', elementLabel: '🌿 Terra',
    keywords: 'Sucesso material, empreendedorismo, estabilidade',
    upright: 'Você tem a visão e a disciplina para construir um império. Lidere com sabedoria e propósito.',
    reversed: 'Ganância ou workaholic. O sucesso sem alma é vazio.', image: earth14 },

  // ═══════════════════════════════════════
  // AR (Espadas) — Mente, verdade, conflito
  // ═══════════════════════════════════════
  { id: 'air-01', number: 1, name: 'Ás de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Clareza mental, verdade, avanço intelectual',
    upright: 'Uma verdade se revela com força. Clareza mental corta através da confusão como uma espada.',
    reversed: 'Confusão mental ou uso destrutivo de palavras. Pense antes de falar.', image: airAce },
  { id: 'air-02', number: 2, name: 'Dois de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Indecisão, impasse, negação',
    upright: 'Uma decisão difícil exige coragem. Remova a venda e enfrente a verdade dos fatos.',
    reversed: 'Decisão tomada sob pressão ou informação revelada. A verdade vem à tona.', image: air02 },
  { id: 'air-03', number: 3, name: 'Três de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Dor, separação, verdade dolorosa',
    upright: 'Uma verdade dolorosa é necessária para a cura. A dor é temporária, a sabedoria é eterna.',
    reversed: 'Início da recuperação emocional. A ferida começa a cicatrizar.', image: air03 },
  { id: 'air-04', number: 4, name: 'Quatro de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Descanso, recuperação, meditação',
    upright: 'Seu corpo e mente precisam de repouso. A pausa é parte essencial da jornada.',
    reversed: 'Agitação ou ansiedade. Resista à urgência de agir antes de estar pronto.', image: air04 },
  { id: 'air-05', number: 5, name: 'Cinco de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Conflito, vitória vazia, desonra',
    upright: 'Vencer a qualquer custo tem seu preço. Avalie se a batalha vale o que está em jogo.',
    reversed: 'Reconciliação ou aceitação da derrota com dignidade. Escolha suas batalhas.', image: air05 },
  { id: 'air-06', number: 6, name: 'Seis de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Transição, viagem, águas mais calmas',
    upright: 'Você está em transição para águas mais calmas. O pior já ficou para trás.',
    reversed: 'Resistência à mudança necessária. Confie no processo de transição.', image: air06 },
  { id: 'air-07', number: 7, name: 'Sete de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Estratégia, discrição, astúcia',
    upright: 'Aja com inteligência e discrição. Nem tudo precisa ser revelado agora.',
    reversed: 'Desonestidade exposta ou autoengano. A verdade sempre vem à tona.', image: air07 },
  { id: 'air-08', number: 8, name: 'Oito de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Prisão mental, limitação autoimposta, vitimismo',
    upright: 'As correntes que o prendem são mentais. Você tem o poder de se libertar a qualquer momento.',
    reversed: 'Libertação de padrões mentais limitantes. Novo senso de liberdade.', image: air08 },
  { id: 'air-09', number: 9, name: 'Nove de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Ansiedade, insônia, preocupação excessiva',
    upright: 'A ansiedade amplifica medos que talvez nem se realizem. Traga sua mente para o presente.',
    reversed: 'Alívio da ansiedade. A luz começa a aparecer no fim do túnel.', image: air09 },
  { id: 'air-10', number: 10, name: 'Dez de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Fim de ciclo doloroso, recomeço, fundo do poço',
    upright: 'O pior já passou. Deste ponto, só há uma direção: para cima. Um novo amanhecer desponta.',
    reversed: 'Resistência a aceitar o fim. Deixe morrer o que precisa morrer.', image: air10 },
  { id: 'air-11', number: 11, name: 'Pajem de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Curiosidade, vigilância, novas ideias',
    upright: 'Sua mente está afiada e curiosa. Explore novas ideias com entusiasmo e atenção.',
    reversed: 'Fofoca ou espionagem. Use sua inteligência para fins construtivos.', image: air11 },
  { id: 'air-12', number: 12, name: 'Cavaleiro de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Ação rápida, ambição, determinação',
    upright: 'Aja com determinação e velocidade. O momento pede decisão firme e coragem.',
    reversed: 'Impulsividade ou crueldade verbal. Pense antes de atacar.', image: air12 },
  { id: 'air-13', number: 13, name: 'Rainha de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Clareza, independência, verdade direta',
    upright: 'Fale a verdade com elegância e firmeza. Sua clareza mental é um dom raro.',
    reversed: 'Frieza excessiva ou julgamento severo. Equilibre razão com compaixão.', image: air13 },
  { id: 'air-14', number: 14, name: 'Rei de Ar', element: 'air', elementLabel: '🌬️ Ar',
    keywords: 'Autoridade intelectual, justiça, lógica',
    upright: 'Lidere com a mente clara e o coração justo. Sua palavra tem peso e poder.',
    reversed: 'Tirania intelectual ou manipulação. O poder exige responsabilidade.', image: air14 },

  // ═══════════════════════════════════════
  // FOGO (Paus/Bastões) — Ação, criatividade, paixão
  // ═══════════════════════════════════════
  { id: 'fire-01', number: 1, name: 'Ás de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Inspiração, início ardente, centelha criativa',
    upright: 'Uma centelha de inspiração acende dentro de você. Agarre esta energia e crie algo extraordinário.',
    reversed: 'Falta de direção ou entusiasmo perdido. Reconecte-se com sua paixão.', image: fireAce },
  { id: 'fire-02', number: 2, name: 'Dois de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Planejamento, visão de futuro, decisão',
    upright: 'O mundo está aos seus pés. Planeje com visão e ouse sonhar grande.',
    reversed: 'Medo do desconhecido ou falta de planejamento. Dê o primeiro passo.', image: fire02 },
  { id: 'fire-03', number: 3, name: 'Três de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Expansão, exploração, horizontes amplos',
    upright: 'Seus esforços iniciais estão se expandindo. Olhe além do horizonte — há muito a conquistar.',
    reversed: 'Atrasos ou obstáculos na expansão. Não desista, ajuste a rota.', image: fire03 },
  { id: 'fire-04', number: 4, name: 'Quatro de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Celebração, harmonia, lar sagrado',
    upright: 'Celebre suas conquistas e a estabilidade alcançada. Seu lar é seu santuário.',
    reversed: 'Falta de celebração ou instabilidade no lar. Crie raízes com intenção.', image: fire04 },
  { id: 'fire-05', number: 5, name: 'Cinco de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Competição, desafio, tensão criativa',
    upright: 'A competição pode ser construtiva se canalizada. Use a tensão como combustível criativo.',
    reversed: 'Evitando conflitos necessários ou excesso de rivalidade. Encontre o equilíbrio.', image: fire05 },
  { id: 'fire-06', number: 6, name: 'Seis de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Vitória, reconhecimento, triunfo público',
    upright: 'O reconhecimento pelo seu esforço finalmente chega. Receba o aplauso com humildade.',
    reversed: 'Ego inflado ou falta de reconhecimento. O valor não depende de aplausos.', image: fire06 },
  { id: 'fire-07', number: 7, name: 'Sete de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Perseverança, defesa, manter a posição',
    upright: 'Mantenha sua posição com firmeza. Seus valores merecem ser defendidos.',
    reversed: 'Sentir-se sobrecarregado ou sem apoio. Peça ajuda quando necessário.', image: fire07 },
  { id: 'fire-08', number: 8, name: 'Oito de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Velocidade, progresso rápido, alinhamento',
    upright: 'Tudo se alinha e acelera. Aproveite este momento de fluxo e deixe-se levar pela corrente.',
    reversed: 'Ansiedade com a velocidade das mudanças. Respire e confie no processo.', image: fire08 },
  { id: 'fire-09', number: 9, name: 'Nove de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Resiliência, última resistência, coragem',
    upright: 'Você está quase lá. A fadiga é real, mas sua força interior é maior que qualquer desafio.',
    reversed: 'Exaustão ou paranoia. Descanse antes de seguir — não há vergonha em pausar.', image: fire09 },
  { id: 'fire-10', number: 10, name: 'Dez de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Sobrecarga, responsabilidade excessiva, fardo',
    upright: 'Você carrega mais do que deveria. Delegue, solte e lembre-se: pedir ajuda é sabedoria.',
    reversed: 'Alívio de um fardo ou aprender a dizer não. Liberdade recuperada.', image: fire10 },
  { id: 'fire-11', number: 11, name: 'Pajem de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Entusiasmo, descoberta, espírito aventureiro',
    upright: 'Uma aventura chama seu nome. Siga sua curiosidade com o entusiasmo de um explorador.',
    reversed: 'Impulsividade ou falta de comprometimento. Canalize sua energia com foco.', image: fire11 },
  { id: 'fire-12', number: 12, name: 'Cavaleiro de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Paixão, ousadia, ação destemida',
    upright: 'Avance com paixão e coragem. Sua energia contagiante inspira todos ao seu redor.',
    reversed: 'Impaciência ou ações impensadas. A coragem sem sabedoria é temeridade.', image: fire12 },
  { id: 'fire-13', number: 13, name: 'Rainha de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Carisma, confiança, energia magnética',
    upright: 'Sua presença ilumina qualquer ambiente. Lidere com carisma e generosidade de espírito.',
    reversed: 'Insegurança ou ciúme. Reconheça seu próprio brilho sem diminuir o dos outros.', image: fire13 },
  { id: 'fire-14', number: 14, name: 'Rei de Fogo', element: 'fire', elementLabel: '🔥 Fogo',
    keywords: 'Visão, liderança natural, empreendedorismo',
    upright: 'Você é o visionário que transforma ideias em realidade. Lidere com ousadia e propósito.',
    reversed: 'Autoritarismo ou expectativas irrealistas. Grandes líderes também ouvem.', image: fire14 },
];

export const MINOR_CARD_IMAGES: Record<string, string> = {};
MINOR_ARCANA.forEach(card => {
  MINOR_CARD_IMAGES[card.id] = card.image;
});
