import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required and must be a non-empty string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (query.length > 500) {
      return new Response(
        JSON.stringify({ error: "Query must be under 500 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Prism's Query Fan-Out engine — an AIO (AI Optimisation) layer that maximises ad discoverability.

TASK: Given a user's raw chatbot query, perform Query Fan-Out by decomposing it into 4-8 diverse sub-intents that together capture the full commercial surface area of the original query.

RULES:
1. Each sub-intent must be a short, specific phrase (2-5 words) suitable as an ad-matching keyword cluster.
2. Cover multiple intent dimensions: informational, transactional, navigational, and commercial investigation.
3. Include at least one long-tail variation (3+ words) to capture niche demand.
4. Include at least one synonym or semantically related rephrasing to broaden recall.
5. Order sub-intents from highest commercial intent to lowest.
6. Return a confidence score (0-1) for each sub-intent indicating relevance to the original query.
7. Return an optimised_query field: a rewritten version of the original query that is keyword-dense and ad-system friendly.

Respond ONLY via the tool call provided.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: context
                ? `User query: "${query}"\nAdditional context: ${context}`
                : `User query: "${query}"`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_fan_out",
                description:
                  "Return the fan-out sub-intents, optimised query, and metadata.",
                parameters: {
                  type: "object",
                  properties: {
                    original_query: {
                      type: "string",
                      description: "The original user query echoed back.",
                    },
                    optimised_query: {
                      type: "string",
                      description:
                        "A rewritten, keyword-dense version of the query optimised for ad matching.",
                    },
                    sub_intents: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          intent: {
                            type: "string",
                            description: "Short sub-intent phrase (2-5 words).",
                          },
                          dimension: {
                            type: "string",
                            enum: [
                              "transactional",
                              "informational",
                              "navigational",
                              "commercial_investigation",
                            ],
                            description: "The intent dimension category.",
                          },
                          confidence: {
                            type: "number",
                            description:
                              "Relevance confidence score between 0 and 1.",
                          },
                          is_long_tail: {
                            type: "boolean",
                            description: "Whether this is a long-tail variation.",
                          },
                        },
                        required: [
                          "intent",
                          "dimension",
                          "confidence",
                          "is_long_tail",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "original_query",
                    "optimised_query",
                    "sub_intents",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_fan_out" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured fan-out data.");
    }

    const fanOutResult = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(fanOutResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("query-fan-out error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
