// ============================================================================
// analyze-exam-evolution  —  ANALISADOR DE EVOLUÇÃO DOS EXAMES
// ----------------------------------------------------------------------------
// Coleta TODOS os exames do usuário, lê cada arquivo (PDF de laboratório/laudo
// ou imagem) com a IA, extrai os dados mesmo sem um padrão de campos, e depois
// cruza tudo na linha do tempo para avaliar a EVOLUÇÃO dos resultados e gerar um
// relatório da situação. Arquivos de imagem compactados (.zip) não são lidos:
// entram no relatório como "pendente de laudo".
//
// Segurança: o usuário é identificado pelo JWT (não aceita user_id do corpo).
// O relatório final é salvo em public.exam_analyses.
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Converte bytes em base64 sem estourar a pilha (processa em blocos).
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext || ""] || "application/octet-stream";
}

const EXTRACT_SYSTEM = `Você é um especialista em exames médicos. Leia o documento (PDF ou imagem) de UM exame e devolva um ÚNICO objeto JSON, sem texto fora do JSON:
{
  "exam_kind": "laboratorio" | "imagem" | "outro",
  "biomarkers": [
    { "name": string, "category": string, "value": número|null, "unit": string|null,
      "reference_min": número|null, "reference_max": número|null,
      "status": "normal" | "baixo" | "alto" | "indeterminado" }
  ],
  "findings": string
}
Regras:
- Extraia TODOS os marcadores quantitativos que encontrar (sangue, urina, hormônios, vitaminas, lipídico, hepático, renal, etc.). Normalize o nome para português claro.
- Preencha "status" comparando o valor com a faixa de referência do próprio laudo quando houver.
- Use "findings" para laudos de imagem/tomografia/ultrassom/ergometria ou observações qualitativas (texto corrido com os principais achados). Deixe "" se não houver.
- NÃO invente valores: se não existir, use null. Se não conseguir ler o documento, devolva "biomarkers": [] e explique em "findings".`;

const SYNTH_SYSTEM = `Você é um médico analista avaliando a EVOLUÇÃO dos exames de um paciente ao longo do tempo. Você recebe um array JSON de exames (cada um com data e dados já extraídos: biomarcadores e/ou achados), possivelmente com nomes e unidades INCONSISTENTES entre laboratórios. Faça uma análise REAL:
1. Agrupe marcadores equivalentes mesmo com nomes diferentes (ex.: "Glicemia de jejum" e "Glicose"; "Hemoglobina" e "Hb"). Padronize nome e unidade.
2. Para cada marcador com 2 ou mais medições, monte a evolução cronológica e classifique a tendência em "melhora", "piora", "estavel" ou "oscilando" — considerando a faixa de referência (aproximar-se/entrar na faixa = melhora; afastar-se/sair = piora). Com 1 medição use "dado_unico".
3. Destaque os valores fora da referência no exame mais recente.
4. Resuma os achados de imagem/laudos numa linha do tempo.
5. Escreva um resumo geral honesto (o que está bem, o que melhorou, o que piorou, o que merece atenção).

Devolva SOMENTE um objeto JSON:
{
  "summary": string,
  "biomarkers": [ { "name": string, "unit": string|null,
    "trend": "melhora"|"piora"|"estavel"|"oscilando"|"dado_unico",
    "latest_status": "normal"|"baixo"|"alto"|"indeterminado",
    "points": [ { "date": "YYYY-MM-DD", "value": número|null, "status": "normal"|"baixo"|"alto"|"indeterminado" } ],
    "note": string } ],
  "imaging": [ { "date": "YYYY-MM-DD", "exam": string, "findings": string } ],
  "pending": [ { "date": "YYYY-MM-DD", "exam": string, "reason": string } ],
  "improved": [string],
  "worsened": [string],
  "attention": [string],
  "disclaimer": string
}
Ordene os pontos de cada marcador por data crescente. Coloque em "pending" os exames marcados como não analisados (ex.: pacotes de imagem .zip). Linguagem acessível, em português. O "disclaimer" DEVE deixar claro que é apoio informativo e NÃO substitui avaliação médica — não dê diagnóstico definitivo nem prescreva.`;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(apiKey: string, messages: unknown[], maxTokens: number): Promise<string> {
  const resp = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${text}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || "{}";
}

function safeParse(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* ignore */ }
    }
    return null;
  }
}

const ARCHIVE_EXTS = ["zip", "rar", "7z", "dcm", "dicom"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identifica o usuário pelo JWT enviado pelo app (não confia em id do corpo).
    const authHeader = req.headers.get("Authorization") || "";
    const authed = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authed.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Todos os exames do usuário, do mais antigo ao mais novo.
    const { data: uploads, error: upErr } = await admin
      .from("exam_uploads")
      .select("*")
      .eq("user_id", userId)
      .order("exam_date", { ascending: true });
    if (upErr) throw upErr;

    if (!uploads || uploads.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum exame enviado ainda." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extrai os dados de cada arquivo (em paralelo, com proteção por arquivo).
    const perExam = await Promise.all(uploads.map(async (up: any) => {
      const base = { date: up.exam_date, file: up.file_name, exam_type: up.exam_type };
      const ext = up.file_name.split(".").pop()?.toLowerCase() || "";
      const mime = getMimeType(up.file_name);

      // Pacotes de imagem / formatos não legíveis → pendentes.
      if (ARCHIVE_EXTS.includes(ext) || mime === "application/octet-stream") {
        return { ...base, analyzed: false, reason: "Pacote de imagens/arquivo não legível automaticamente — pendente de laudo em texto." };
      }

      try {
        const { data: fileData, error: dlErr } = await admin.storage.from("exams").download(up.file_path);
        if (dlErr || !fileData) {
          return { ...base, analyzed: false, reason: `Falha ao baixar o arquivo: ${dlErr?.message || "desconhecido"}` };
        }
        const buf = await fileData.arrayBuffer();
        if (buf.byteLength > 18_000_000) {
          return { ...base, analyzed: false, reason: "Arquivo muito grande para análise automática." };
        }
        const dataUrl = `data:${mime};base64,${arrayBufferToBase64(buf)}`;
        const isPdf = mime === "application/pdf";
        const userContent = isPdf
          ? [
              { type: "file", file: { filename: up.file_name, file_data: dataUrl } },
              { type: "text", text: "Extraia os dados deste exame conforme o formato JSON pedido." },
            ]
          : [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: "Extraia os dados deste exame conforme o formato JSON pedido." },
            ];
        const content = await callOpenAI(
          OPENAI_API_KEY,
          [ { role: "system", content: EXTRACT_SYSTEM }, { role: "user", content: userContent } ],
          4096,
        );
        const parsed = safeParse(content) || {};
        return {
          ...base,
          analyzed: true,
          exam_kind: parsed.exam_kind || "outro",
          biomarkers: Array.isArray(parsed.biomarkers) ? parsed.biomarkers : [],
          findings: typeof parsed.findings === "string" ? parsed.findings : "",
        };
      } catch (e) {
        return { ...base, analyzed: false, reason: `Erro ao analisar: ${e instanceof Error ? e.message : "desconhecido"}` };
      }
    }));

    const filesAnalyzed = perExam.filter((e: any) => e.analyzed).length;

    // Síntese: cruza tudo e avalia a evolução.
    const synthContent = await callOpenAI(
      OPENAI_API_KEY,
      [
        { role: "system", content: SYNTH_SYSTEM },
        { role: "user", content: `Exames do paciente (JSON):\n${JSON.stringify(perExam)}` },
      ],
      4096,
    );
    const report = safeParse(synthContent) || {
      summary: "Não foi possível gerar a análise desta vez.",
      biomarkers: [], imaging: [], pending: [], improved: [], worsened: [], attention: [],
      disclaimer: "Este relatório é apoio informativo e NÃO substitui avaliação médica.",
    };
    if (!report.disclaimer) {
      report.disclaimer = "Este relatório é apoio informativo e NÃO substitui avaliação médica. Leve seus exames ao seu médico.";
    }

    const { data: saved, error: saveErr } = await admin
      .from("exam_analyses")
      .insert({
        user_id: userId,
        report,
        exams_count: uploads.length,
        files_analyzed: filesAnalyzed,
        model: "gpt-4o",
      })
      .select()
      .single();
    if (saveErr) throw saveErr;

    return new Response(JSON.stringify({ success: true, analysis: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-exam-evolution error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
