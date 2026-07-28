import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Traços profundos de cada signo para personalizar o prompt
const SIGN_TRAITS: Record<string, string> = {
  'Áries': 'impulsivo, corajoso, pioneiro, energético, apaixonado, líder nato, direto, competitivo, aventureiro, intolerante à lentidão',
  'Touro': 'sensorial, persistente, apreciador de beleza e conforto, leal, paciente, materialista, estável, teimoso, prazeroso, apegado à rotina',
  'Gêmeos': 'comunicativo, curioso, dual, versátil, inteligente, inquieto, sociável, adaptável, espirituoso, ávido por novidades',
  'Câncer': 'intuitivo, protetor, emocional, familiar, nostálgico, empático, sensível, ciumento, receptivo, apegado ao passado e ao lar',
  'Leão': 'magnético, criativo, generoso, orgulhoso, dramático, leal, carismático, teatral, autoconfiante, necessita de reconhecimento',
  'Virgem': 'analítico, perfeccionista, prestativo, meticuloso, crítico consigo mesmo, prático, modesto, trabalhador, organizado, voltado à saúde',
  'Libra': 'diplomático, estético, indeciso, charmoso, justo, sociável, harmonioso, refinado, idealista em amor, aversão a conflitos',
  'Escorpião': 'intenso, magnético, investigativo, transformador, ciumento, poderoso, secreto, profundo, apaixonado, resiliente e vingativo',
  'Sagitário': 'otimista, filosófico, aventureiro, livre, honesto demais, expansivo, viajante, entusiasmado, irresponsável às vezes, buscador de sentido',
  'Capricórnio': 'ambicioso, disciplinado, pragmático, responsável, reservado, paciente, melancólico às vezes, persistente, tradicional, orientado a metas',
  'Aquário': 'inovador, humanitário, excêntrico, independente, intelectual, distante emocionalmente, visionário, rebelde, original, amante da liberdade',
  'Peixes': 'intuitivo, compassivo, sonhador, espiritual, sensível, artístico, fuga da realidade, empático, misterioso, fluido e camaleônico',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { sunSign, userId, date } = await req.json();

    const today = new Date(date || new Date().toISOString().split('T')[0]);
    const dayOfWeek = today.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dateFormatted = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    const traits = SIGN_TRAITS[sunSign] || 'espiritual, sensível, intuitivo';

    const prompt = `Você é um astrólogo sábio, poético e profundamente conhecedor de astrologia tradicional e moderna.
Gere um horóscopo diário ALTAMENTE PERSONALIZADO para ${sunSign} para ${dayOfWeek}, ${dateFormatted}.

Características essenciais de ${sunSign}: ${traits}

REGRA FUNDAMENTAL: Cada frase deve ressoar ESPECIFICAMENTE com quem nasceu sob ${sunSign}.
Alguém experiente em astrologia deve ler e pensar "isso fala EXATAMENTE sobre mim como ${sunSign}".
Cite traços, tendências, desafios e dons únicos deste signo. NUNCA use frases genéricas que servem para qualquer signo.

Responda APENAS com um JSON válido, sem markdown, com esta estrutura exata:
{
  "horoscope_text": "parágrafo principal poético sobre a energia do dia para ${sunSign}, referenciando sua natureza específica (máx 3 frases impactantes)",
  "love_insight": "conselho de amor que faz ${sunSign} se reconhecer — cite seus padrões relacionais únicos como ${traits.split(',')[0].trim()} (1-2 frases poéticas e específicas)",
  "career_insight": "conselho de carreira que reflita as ambições e estilo de trabalho característico de ${sunSign} (1-2 frases específicas)",
  "wellness_insight": "conselho de bem-estar conectado ao corpo e mente de ${sunSign}, suas vulnerabilidades e forças físicas/emocionais (1-2 frases)",
  "creativity_insight": "conselho criativo alinhado com a expressão artística e imaginativa natural de ${sunSign} (1-2 frases)",
  "affirmation": "afirmação poderosa em primeira pessoa que capture a essência de ${sunSign} (máx 15 palavras, deve soar como ${sunSign} falando)",
  "moon_phase_insight": "como a lua de hoje interage com a energia específica de ${sunSign} (1 frase)"
}

Tom: místico, empoderador, poético, ALTAMENTE ESPECÍFICO para ${sunSign}. Responda em português brasileiro.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.88,
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI error:', response.status, errText);
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    let parsed: any = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('Failed to parse AI response:', content);
    }

    // Save to database
    const { createClient } = await import('jsr:@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const horoscopeData = {
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
      sun_sign: sunSign,
      horoscope_text: parsed.horoscope_text || `As estrelas de ${sunSign} brilham com toda sua intensidade singular neste dia.`,
      love_insight: parsed.love_insight || 'O coração de ' + sunSign + ' pulsa com sua força única hoje.',
      career_insight: parsed.career_insight || 'Seu propósito se alinha com sua ação hoje.',
      wellness_insight: parsed.wellness_insight || 'Cuide do seu corpo como templo da sua alma.',
      creativity_insight: parsed.creativity_insight || 'Expresse sua essência sem filtros hoje.',
      affirmation: parsed.affirmation || `Sou ${sunSign} em toda minha plenitude cósmica.`,
      moon_phase: parsed.moon_phase_insight || 'A lua ilumina seu caminho com sabedoria.',
      focus_areas: ['amor', 'carreira', 'bem-estar', 'criatividade'],
    };

    const { error } = await supabase
      .from('daily_horoscopes')
      .upsert(horoscopeData, { onConflict: 'user_id,date' });

    if (error) console.error('DB error:', error);

    return new Response(JSON.stringify(horoscopeData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
