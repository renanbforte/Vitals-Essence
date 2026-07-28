import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Get MIME type from file extension
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, examUploadId, examDate, userId, fileName } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Downloading exam file:", filePath);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('exams')
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Data = arrayBufferToBase64(arrayBuffer);
    
    const mimeType = getMimeType(fileName);
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    console.log("File converted to base64, MIME type:", mimeType);

    // Check if it's a PDF - use text content for PDFs since vision models have limited PDF support
    const isPdf = mimeType === 'application/pdf';
    
    let messages;
    if (isPdf) {
      // For PDFs, we'll send as file and ask to extract
      messages = [
        {
          role: "system",
          content: `Você é um especialista em análise de exames médicos. Analise o documento PDF do exame e extraia todos os biomarcadores encontrados.

Para cada biomarcador encontrado, retorne um objeto JSON com:
- biomarker_name: nome do biomarcador (ex: "Glicemia", "Colesterol Total", "Hemoglobina")
- biomarker_category: categoria (ex: "Sangue", "Hormonal", "Hepático", "Renal", "Lipídico", "Ressonância")
- value: valor numérico encontrado
- unit: unidade de medida (ex: "mg/dL", "g/dL", "%")
- reference_min: valor mínimo de referência (se disponível)
- reference_max: valor máximo de referência (se disponível)
- status: "normal" se dentro da referência, "low" se abaixo, "high" se acima

IMPORTANTE: 
- Retorne APENAS um array JSON válido com os biomarcadores
- Se não conseguir identificar valores de referência, deixe reference_min e reference_max como null
- Se for uma ressonância ou outro exame de imagem, extraia as observações principais como biomarcadores com categoria "Ressonância" ou "Imagem"
- Não inclua texto adicional, apenas o JSON

Exemplo de resposta:
[
  {"biomarker_name": "Glicemia", "biomarker_category": "Sangue", "value": 95, "unit": "mg/dL", "reference_min": 70, "reference_max": 100, "status": "normal"},
  {"biomarker_name": "Colesterol Total", "biomarker_category": "Lipídico", "value": 220, "unit": "mg/dL", "reference_min": null, "reference_max": 200, "status": "high"}
]`
        },
        {
          role: "user",
          content: [
            {
              type: "file",
              file: {
                filename: fileName,
                file_data: dataUrl,
              }
            },
            {
              type: "text",
              text: "Analise este exame médico e extraia todos os biomarcadores com seus valores, unidades e referências. Retorne apenas o JSON."
            }
          ]
        }
      ];
    } else {
      // For images, use image_url
      messages = [
        {
          role: "system",
          content: `Você é um especialista em análise de exames médicos. Analise a imagem do exame e extraia todos os biomarcadores encontrados.

Para cada biomarcador encontrado, retorne um objeto JSON com:
- biomarker_name: nome do biomarcador (ex: "Glicemia", "Colesterol Total", "Hemoglobina")
- biomarker_category: categoria (ex: "Sangue", "Hormonal", "Hepático", "Renal", "Lipídico", "Ressonância")
- value: valor numérico encontrado
- unit: unidade de medida (ex: "mg/dL", "g/dL", "%")
- reference_min: valor mínimo de referência (se disponível)
- reference_max: valor máximo de referência (se disponível)
- status: "normal" se dentro da referência, "low" se abaixo, "high" se acima

IMPORTANTE: 
- Retorne APENAS um array JSON válido com os biomarcadores
- Se não conseguir identificar valores de referência, deixe reference_min e reference_max como null
- Se for uma ressonância ou outro exame de imagem, extraia as observações principais como biomarcadores com categoria "Ressonância" ou "Imagem"
- Não inclua texto adicional, apenas o JSON

Exemplo de resposta:
[
  {"biomarker_name": "Glicemia", "biomarker_category": "Sangue", "value": 95, "unit": "mg/dL", "reference_min": 70, "reference_max": 100, "status": "normal"},
  {"biomarker_name": "Colesterol Total", "biomarker_category": "Lipídico", "value": 220, "unit": "mg/dL", "reference_min": null, "reference_max": 200, "status": "high"}
]`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            },
            {
              type: "text",
              text: "Analise este exame médico e extraia todos os biomarcadores com seus valores, unidades e referências. Retorne apenas o JSON."
            }
          ]
        }
      ];
    }

    console.log("Chamando a OpenAI com", isPdf ? "arquivo PDF" : "imagem");

    // Call AI to analyze the exam
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na conta OpenAI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "[]";
    
    console.log("AI Response content:", content);

    // Parse the JSON response
    let biomarkers = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        biomarkers = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      biomarkers = [];
    }

    console.log("Parsed biomarkers:", biomarkers.length);

    // Insert the extracted biomarkers into the database
    if (biomarkers.length > 0) {
      const resultsToInsert = biomarkers.map((b: any) => ({
        user_id: userId,
        exam_upload_id: examUploadId,
        exam_date: examDate,
        biomarker_name: b.biomarker_name,
        biomarker_category: b.biomarker_category,
        value: b.value,
        unit: b.unit,
        reference_min: b.reference_min,
        reference_max: b.reference_max,
        status: b.status,
      }));

      const { error: insertError } = await supabase
        .from("exam_results")
        .insert(resultsToInsert);

      if (insertError) {
        console.error("Error inserting results:", insertError);
        throw insertError;
      }

      // Mark the upload as processed
      await supabase
        .from("exam_uploads")
        .update({ processed: true })
        .eq("id", examUploadId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      biomarkers_count: biomarkers.length,
      biomarkers 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error analyzing exam:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
