// review-kr: AI-powered review of an OKR Key Result.
// v1: opera con el payload recibido (sin DB). Diseñado para enriquecer luego desde Supabase.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ReviewPayload {
  kr_id?: string;
  objective?: string;
  keyResult?: string;
  cycle?: string;
  context?: {
    metric?: string;
    baseline?: number | string;
    target?: number | string;
    current?: number | string;
    owner?: string;
    notes?: string;
    [k: string]: unknown;
  };
}

const SYSTEM_PROMPT = `Eres un coach experto en OKRs siguiendo el método de John Doerr / Christina Wodtke.
Evalúas un Key Result (KR) y devuelves un análisis estructurado en español.

Criterios:
- SMART: específico, medible, alcanzable, relevante, con plazo.
- Outcome vs Output: el KR debe medir resultado, no actividad.
- Alineación con el Objetivo padre.
- Ambición: idealmente "stretch" (50-70% de probabilidad de logro).
- Claridad de la métrica (baseline → target).

Sé directo, accionable y concreto. No inventes datos que no estén en el payload.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Auth (verify_jwt = true ya valida, pero confirmamos el claim)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Unauthorized" });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return json(401, { error: "Unauthorized" });
    }
  } catch (e) {
    console.error("Auth error", e);
    return json(401, { error: "Unauthorized" });
  }

  // Parse payload
  let payload: ReviewPayload;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!payload.keyResult || typeof payload.keyResult !== "string") {
    return json(400, { error: "Field 'keyResult' is required (string)" });
  }
  if (!payload.objective || typeof payload.objective !== "string") {
    return json(400, { error: "Field 'objective' is required (string)" });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return json(500, { error: "AI not configured" });
  }

  const userPrompt = `Analiza el siguiente Key Result.

Objetivo: ${payload.objective}
Key Result: ${payload.keyResult}
Ciclo: ${payload.cycle ?? "(no especificado)"}
KR ID: ${payload.kr_id ?? "(no especificado)"}

Contexto adicional:
${payload.context ? JSON.stringify(payload.context, null, 2) : "(sin contexto)"}

Devuelve la evaluación usando la herramienta 'submit_kr_review'.`;

  try {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_kr_review",
              description: "Devuelve el análisis estructurado del Key Result.",
              parameters: {
                type: "object",
                properties: {
                  overall_score: {
                    type: "number",
                    description: "Score global 0-100 sobre la calidad del KR.",
                  },
                  rating: {
                    type: "string",
                    enum: ["excellent", "good", "needs_work", "poor"],
                  },
                  is_outcome: {
                    type: "boolean",
                    description: "True si mide outcome (resultado), false si mide output (actividad).",
                  },
                  is_measurable: { type: "boolean" },
                  is_time_bound: { type: "boolean" },
                  is_aligned: {
                    type: "boolean",
                    description: "Si el KR está alineado con el objetivo padre.",
                  },
                  ambition_level: {
                    type: "string",
                    enum: ["low", "balanced", "stretch", "unrealistic"],
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 fortalezas concretas.",
                  },
                  issues: {
                    type: "array",
                    items: { type: "string" },
                    description: "Problemas detectados (vacío si no hay).",
                  },
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Sugerencias accionables para mejorar el KR.",
                  },
                  improved_kr: {
                    type: "string",
                    description: "Reescritura sugerida del KR aplicando las mejoras.",
                  },
                  summary: {
                    type: "string",
                    description: "Resumen ejecutivo en 1-2 frases.",
                  },
                },
                required: [
                  "overall_score",
                  "rating",
                  "is_outcome",
                  "is_measurable",
                  "is_time_bound",
                  "is_aligned",
                  "ambition_level",
                  "strengths",
                  "issues",
                  "suggestions",
                  "improved_kr",
                  "summary",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_kr_review" } },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return json(429, { error: "Rate limit excedido. Intenta de nuevo en unos segundos." });
      }
      if (aiResp.status === 402) {
        return json(402, {
          error: "Sin créditos de IA. Agrega fondos en Settings → Workspace → Usage.",
        });
      }
      return json(502, { error: "AI gateway error" });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response", JSON.stringify(data));
      return json(502, { error: "AI no devolvió un análisis estructurado" });
    }

    let review: unknown;
    try {
      review = JSON.parse(toolCall.function.arguments);
    } catch (e) {
      console.error("Failed to parse tool arguments", e, toolCall.function.arguments);
      return json(502, { error: "Respuesta de IA inválida" });
    }

    return json(200, {
      kr_id: payload.kr_id ?? null,
      model: "google/gemini-3-flash-preview",
      reviewed_at: new Date().toISOString(),
      review,
    });
  } catch (e) {
    console.error("review-kr error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json(500, { error: msg });
  }
});
