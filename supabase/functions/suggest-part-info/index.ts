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
    const { codigoOEM, vehicleInfo, categoryName } = await req.json();

    if (!codigoOEM || codigoOEM.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Código OEM muito curto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating part suggestions for OEM:", { codigoOEM, vehicleInfo, categoryName });

    const systemPrompt = `Você é um especialista em peças automotivas do mercado brasileiro.
Sua tarefa é identificar uma peça a partir do código OEM e fornecer:
1. Nome comercial da peça (como seria chamada no Mercado Livre)
2. Título otimizado para anúncio no Mercado Livre (máximo 60 caracteres)
3. Faixa de preço estimada para peça usada em bom estado
4. Lista de veículos compatíveis com essa peça (máximo 5)

Regras:
- Baseie-se em dados reais do mercado brasileiro
- Seja preciso no nome da peça
- O título para ML deve ser vendedor, incluir a marca se possível
- A faixa de preço deve ser realista para peças usadas
- Para compatibilidades, foque em veículos do mercado brasileiro
- Inclua faixas de anos quando aplicável para as compatibilidades
- Se não conseguir identificar a peça, indique isso`;

    const userPrompt = `Código OEM: ${codigoOEM}
${vehicleInfo ? `Veículo de origem: ${vehicleInfo}` : ""}
${categoryName ? `Categoria: ${categoryName}` : ""}

Identifique a peça e forneça nome, título otimizado para ML, faixa de preço e veículos compatíveis.`;

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
              name: "suggest_part_info",
              description: "Retorna informações sugeridas para a peça com base no código OEM",
              parameters: {
                type: "object",
                properties: {
                  nome: { 
                    type: "string", 
                    description: "Nome comercial da peça (ex: Motor de Arranque, Alternador, Bomba de Combustível)" 
                  },
                  tituloML: { 
                    type: "string", 
                    description: "Título otimizado para anúncio no Mercado Livre (máx 60 caracteres)" 
                  },
                  precoMinimo: { 
                    type: "number", 
                    description: "Preço mínimo sugerido em reais para peça usada" 
                  },
                  precoMaximo: { 
                    type: "number", 
                    description: "Preço máximo sugerido em reais para peça usada" 
                  },
                  precoSugerido: { 
                    type: "number", 
                    description: "Preço sugerido médio em reais" 
                  },
                  confianca: {
                    type: "string",
                    enum: ["alta", "media", "baixa"],
                    description: "Nível de confiança na identificação da peça"
                  },
                  descricao: {
                    type: "string",
                    description: "Breve descrição da peça identificada"
                  },
                  compatibilidades: {
                    type: "array",
                    description: "Lista de veículos compatíveis com a peça",
                    items: {
                      type: "object",
                      properties: {
                        marca: { type: "string", description: "Marca do veículo (ex: Honda, Toyota)" },
                        modelo: { type: "string", description: "Modelo do veículo (ex: Civic, Corolla)" },
                        ano_inicio: { type: "number", description: "Ano inicial da compatibilidade" },
                        ano_fim: { type: "number", description: "Ano final da compatibilidade" },
                        observacoes: { type: "string", description: "Observações sobre a compatibilidade" }
                      },
                      required: ["marca", "modelo"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["nome", "tituloML", "precoSugerido", "confianca"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_part_info" } },
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
    if (!toolCall || toolCall.function.name !== "suggest_part_info") {
      throw new Error("Invalid AI response format");
    }

    const suggestion = JSON.parse(toolCall.function.arguments);
    console.log("Parsed suggestion:", suggestion);

    return new Response(JSON.stringify(suggestion), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-part-info:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
