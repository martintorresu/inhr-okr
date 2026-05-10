// exec-summary: brief ejecutivo automático sobre métricas agregadas de OKRs.
// Recibe stats ya calculadas en cliente y devuelve 3-5 bullets accionables en español.

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

const SYSTEM = `Eres un asesor ejecutivo de gestión por OKRs.
Recibes métricas agregadas (no datos individuales sensibles) y devuelves un resumen en español, directo, sin relleno.

Tu objetivo NO es decir "qué está mal", sino "QUÉ DEBO RESOLVER PRIMERO".
Pondera SIEMPRE por peso estratégico (alto > medio > bajo): un KR de alto impacto en riesgo importa más que uno de bajo impacto crítico. Empieza por los focos de alto impacto.

Formato: 3 a 5 bullets cortos (máx 25 palabras cada uno):
- Bullet 1: la prioridad #1 (KR/área de mayor impacto en problema) y por qué importa
- Bullet 2-3: siguientes focos en orden de impacto
- Último bullet: 1 acción concreta recomendada

No inventes números. Usa solo los datos provistos. Si faltan datos, dilo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json(500, { error: "LOVABLE_API_KEY missing" });

  let payload: any;
  try { payload = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

  const userPrompt = `Métricas actuales:\n${JSON.stringify(payload, null, 2)}\n\nGenera el resumen ejecutivo.`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (r.status === 429) return json(429, { error: "Rate limit, intenta en unos segundos" });
    if (r.status === 402) return json(402, { error: "Sin créditos de IA disponibles" });
    if (!r.ok) {
      const t = await r.text();
      return json(502, { error: "AI gateway error", detail: t.slice(0, 300) });
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return json(200, { summary: String(text).trim() });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : String(e) });
  }
});
