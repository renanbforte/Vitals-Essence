const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, startDate, endDate } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    if (!destination) {
      return new Response(JSON.stringify({ error: "Destino não informado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine travel month for seasonal clothing recommendations
    let travelMonth = "";
    if (startDate) {
      const d = new Date(startDate);
      const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
      travelMonth = months[d.getMonth()];
    }

    const dateInfo = startDate
      ? `A viagem acontece em ${travelMonth}${endDate ? ` (de ${startDate} até ${endDate})` : ""}.`
      : "";

    const systemPrompt = `Você é um especialista em viagens e turismo com profundo conhecimento local de destinos ao redor do mundo. 
Forneça recomendações detalhadas, práticas e baseadas em informações reais.
Responda SEMPRE em português do Brasil.
Seja específico com nomes, endereços e informações úteis.`;

    const userPrompt = `Crie um guia de recomendações completo para viagem ao destino: "${destination}".
${dateInfo}

Estruture sua resposta EXATAMENTE no seguinte formato JSON (sem markdown, apenas JSON puro):

{
  "restaurants": [
    { "name": "nome do restaurante", "type": "tipo de culinária", "address": "endereço completo", "tip": "dica especial", "priceRange": "$ / $$ / $$$" }
  ],
  "places": [
    { "name": "nome do local", "category": "categoria (museu/praia/parque/etc)", "address": "endereço ou bairro", "description": "o que ver/fazer lá", "mustSee": true/false }
  ],
  "typicalFood": [
    { "name": "nome do prato/bebida", "description": "descrição e onde encontrar" }
  ],
  "clothing": {
    "season": "estação do ano no destino durante a viagem",
    "recommendations": ["item de roupa 1", "item de roupa 2"],
    "temperature": "faixa de temperatura esperada",
    "tips": "dicas especiais sobre o vestuário"
  },
  "safety": {
    "generalLevel": "seguro / moderado / atenção",
    "avoidAreas": ["área ou bairro a evitar com motivo"],
    "tips": ["dica de segurança 1", "dica de segurança 2"],
    "emergencyNumbers": [{ "service": "nome do serviço", "number": "número" }]
  },
  "generalTips": ["dica geral 1", "dica geral 2", "dica geral 3"]
}

Retorne APENAS o JSON, sem nenhum texto antes ou depois. Use informações REAIS e ATUAIS do destino.
Inclua pelo menos 3 restaurantes, 4 locais, 3 pratos típicos, e 3 dicas gerais.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar recomendações." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from the response
    let recommendations;
    try {
      // Remove possible markdown code blocks
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar recomendações da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trip-recommendations error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
