import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partName, vehicleInfo, existingCompatibilities } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating compatibility suggestions for:", { partName, vehicleInfo });

    const systemPrompt = `Você é um especialista em peças automotivas e compatibilidade de veículos brasileiros.
Sua tarefa é sugerir veículos compatíveis para uma peça com base no nome da peça e no veículo de origem.

Regras:
- Sugira apenas veículos que realmente podem ser compatíveis (mesma plataforma, motor similar, mesma geração)
- Foque em veículos do mercado brasileiro
- Inclua faixa de anos quando aplicável
- Seja conservador: é melhor sugerir menos veículos com alta certeza do que muitos com baixa certeza
- Máximo de 5 sugestões por vez
- Não repita compatibilidades já existentes`;

    const userPrompt = `Peça: ${partName}
${vehicleInfo ? `Veículo de origem: ${vehicleInfo}` : "Veículo de origem: não especificado"}
${existingCompatibilities?.length > 0 ? `\nCompatibilidades já cadastradas (não repetir):\n${existingCompatibilities.map((c: any) => `- ${c.marca} ${c.modelo} ${c.ano_inicio || ""}${c.ano_fim ? `-${c.ano_fim}` : ""}`).join("\n")}` : ""}

Retorne sugestões de veículos compatíveis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_compatibilities",
              description: "Retorna sugestões de veículos compatíveis com a peça",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        marca: { type: "string", description: "Marca do veículo (ex: Honda, Toyota, Volkswagen)" },
                        modelo: { type: "string", description: "Modelo do veículo (ex: Civic, Corolla, Golf)" },
                        ano_inicio: { type: "number", description: "Ano inicial da compatibilidade" },
                        ano_fim: { type: "number", description: "Ano final da compatibilidade" },
                        observacoes: { type: "string", description: "Observações sobre a compatibilidade (versão, motor, etc)" },
                      },
                      required: ["marca", "modelo"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_compatibilities" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na sua conta." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "suggest_compatibilities") {
      throw new Error("Invalid AI response format");
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    console.log("Parsed suggestions:", suggestions);

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-compatibilities:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
