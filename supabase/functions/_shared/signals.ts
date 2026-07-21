// Niche-agnostic conversation turn scorer for publisher Signals SaaS.
// Heuristics always run; optional LLM merge when bot policy enables it.

export type SignalIntent = "research" | "compare" | "buy" | "support" | "other";
export type SignalEmotion = "neutral" | "curious" | "anxious" | "frustrated" | "positive";
export type SignalStage = "explore" | "consider" | "decide" | "post_purchase";
export type SignalAction =
  | "clarify"
  | "retrieve"
  | "escalate"
  | "tone_shift"
  | "recommend"
  | "offer"
  | "none";

export type ChatMessage = { role: string; content: string };

export type ConversationSignals = {
  intent: SignalIntent;
  confidence: number;
  emotion: SignalEmotion;
  stage: SignalStage;
  topics: string[];
  safety: { ok: boolean; flags: string[] };
};

export type ScoreResult = {
  signals: ConversationSignals;
  action: SignalAction;
  actionReason: string;
  engine: "heuristic" | "hybrid";
};

const BUY_RE =
  /\b(buy|purchase|order|checkout|subscribe|sign\s*up|pricing|price|cost|how much|add to cart|get started|book now|hire)\b/i;
const COMPARE_RE =
  /\b(compare|vs\.?|versus|alternative|better than|which (one|is)|difference between|pros and cons)\b/i;
const SUPPORT_RE =
  /\b(help|broken|error|bug|issue|not working|refund|cancel|complaint|support|fix my)\b/i;
const RESEARCH_RE =
  /\b(what is|how (do|does|to)|why|explain|learn|guide|tutorial|overview|tell me about)\b/i;
const CONSIDER_RE =
  /\b(maybe|thinking about|considering|looking at|interested in|options?|recommend)\b/i;
const DECIDE_RE =
  /\b(ready|decide|i'?ll take|let'?s (go|do)|confirm|yes please|i want|i need to buy)\b/i;
const POST_RE =
  /\b(already (bought|purchased|ordered)|my order|tracking|return|warranty|setup after)\b/i;
const CURIOUS_RE = /\b(curious|interesting|wonder|tell me more|how does)\b/i;
const ANXIOUS_RE =
  /\b(worried|anxious|scared|afraid|panic|stress|overwhelmed|nervous|urgent|asap)\b/i;
const FRUSTRATED_RE =
  /\b(frustrated|annoyed|angry|ridiculous|waste|useless|hate|stupid|fed up)\b/i;
const POSITIVE_RE = /\b(great|awesome|love|perfect|thanks|thank you|excited|amazing)\b/i;
const QUESTION_RE = /\?/;

const SAFETY_PATTERNS: { flag: string; re: RegExp }[] = [
  { flag: "self_harm", re: /\b(kill myself|suicide|self[- ]?harm|end my life|want to die)\b/i },
  { flag: "crisis", re: /\b(emergency|overdose|can'?t breathe|having a panic attack)\b/i },
  { flag: "violence", re: /\b(kill (him|her|them)|bomb|shoot|attack)\b/i },
  { flag: "illegal", re: /\b(buy (drugs|weapons)|how to hack|steal credit)\b/i },
  { flag: "medical", re: /\b(diagnos(e|is)|prescribe|dosage|should i take|medical advice)\b/i },
];

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "is", "are",
  "was", "were", "be", "been", "i", "you", "we", "they", "it", "this", "that", "with",
  "from", "have", "has", "had", "do", "does", "did", "can", "could", "would", "should",
  "my", "your", "our", "me", "about", "what", "how", "why", "when", "where", "which",
]);

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const latestUserText = (messages: ChatMessage[]): string => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && (m.role === "user" || m.role === "human") && m.content?.trim()) {
      return m.content.trim();
    }
  }
  return messages.map((m) => m.content).filter(Boolean).join("\n").trim();
};

const extractTopics = (text: string): string[] => {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
};

export const scoreHeuristic = (messages: ChatMessage[]): ConversationSignals => {
  const text = latestUserText(messages);
  const flags = SAFETY_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.flag);

  let intent: SignalIntent = "other";
  if (BUY_RE.test(text)) intent = "buy";
  else if (COMPARE_RE.test(text)) intent = "compare";
  else if (SUPPORT_RE.test(text)) intent = "support";
  else if (RESEARCH_RE.test(text) || QUESTION_RE.test(text)) intent = "research";

  let stage: SignalStage = "explore";
  if (POST_RE.test(text)) stage = "post_purchase";
  else if (DECIDE_RE.test(text) || intent === "buy") stage = "decide";
  else if (CONSIDER_RE.test(text) || intent === "compare") stage = "consider";
  else if (intent === "research") stage = "explore";

  let emotion: SignalEmotion = "neutral";
  if (ANXIOUS_RE.test(text)) emotion = "anxious";
  else if (FRUSTRATED_RE.test(text)) emotion = "frustrated";
  else if (POSITIVE_RE.test(text)) emotion = "positive";
  else if (CURIOUS_RE.test(text) || QUESTION_RE.test(text)) emotion = "curious";

  let confidence = 0.45;
  if (intent !== "other") confidence += 0.2;
  if (text.length > 40) confidence += 0.1;
  if (messages.length >= 3) confidence += 0.1;
  if (QUESTION_RE.test(text) && intent === "other") confidence -= 0.05;
  confidence = clamp01(confidence);

  return {
    intent,
    confidence,
    emotion,
    stage,
    topics: extractTopics(text),
    safety: { ok: flags.length === 0, flags },
  };
};

const INTENT_SET = new Set<SignalIntent>(["research", "compare", "buy", "support", "other"]);
const EMOTION_SET = new Set<SignalEmotion>(["neutral", "curious", "anxious", "frustrated", "positive"]);
const STAGE_SET = new Set<SignalStage>(["explore", "consider", "decide", "post_purchase"]);

const coerceSignals = (raw: Record<string, unknown>, fallback: ConversationSignals): ConversationSignals => {
  const intent = INTENT_SET.has(raw.intent as SignalIntent) ? (raw.intent as SignalIntent) : fallback.intent;
  const emotion = EMOTION_SET.has(raw.emotion as SignalEmotion)
    ? (raw.emotion as SignalEmotion)
    : fallback.emotion;
  const stage = STAGE_SET.has(raw.stage as SignalStage) ? (raw.stage as SignalStage) : fallback.stage;
  const confidence = typeof raw.confidence === "number" ? clamp01(raw.confidence) : fallback.confidence;
  const topics = Array.isArray(raw.topics)
    ? (raw.topics as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 8)
    : fallback.topics;
  const safetyRaw = (raw.safety && typeof raw.safety === "object") ? raw.safety as Record<string, unknown> : null;
  const flags = safetyRaw && Array.isArray(safetyRaw.flags)
    ? (safetyRaw.flags as unknown[]).filter((f): f is string => typeof f === "string")
    : fallback.safety.flags;
  const ok = safetyRaw && typeof safetyRaw.ok === "boolean" ? safetyRaw.ok : flags.length === 0;
  return { intent, confidence, emotion, stage, topics, safety: { ok, flags } };
};

export const scoreWithLlm = async (
  messages: ChatMessage[],
  heuristic: ConversationSignals,
): Promise<{ signals: ConversationSignals; usedLlm: boolean }> => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return { signals: heuristic, usedLlm: false };

  const transcript = messages
    .slice(-12)
    .map((m) => `${m.role}: ${String(m.content || "").slice(0, 800)}`)
    .join("\n");

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You score chatbot conversations for a niche-agnostic decisioning API. " +
              "Return ONLY via the tool call. Be conservative on safety flags.",
          },
          {
            role: "user",
            content: `Score this conversation.\n\nHeuristic hint (JSON):\n${JSON.stringify(heuristic)}\n\nTranscript:\n${transcript}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_signals",
              description: "Return conversation signals",
              parameters: {
                type: "object",
                properties: {
                  intent: { type: "string", enum: [...INTENT_SET] },
                  confidence: { type: "number" },
                  emotion: { type: "string", enum: [...EMOTION_SET] },
                  stage: { type: "string", enum: [...STAGE_SET] },
                  topics: { type: "array", items: { type: "string" } },
                  safety: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      flags: { type: "array", items: { type: "string" } },
                    },
                    required: ["ok", "flags"],
                  },
                },
                required: ["intent", "confidence", "emotion", "stage", "topics", "safety"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_signals" } },
      }),
    });

    if (!response.ok) {
      console.error("Signals LLM failed", response.status, await response.text());
      return { signals: heuristic, usedLlm: false };
    }

    const data = await response.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr || typeof argsStr !== "string") return { signals: heuristic, usedLlm: false };
    const parsed = JSON.parse(argsStr) as Record<string, unknown>;
    // Prefer LLM, but never clear a heuristic safety fail.
    const merged = coerceSignals(parsed, heuristic);
    if (!heuristic.safety.ok) {
      merged.safety.ok = false;
      merged.safety.flags = [...new Set([...heuristic.safety.flags, ...merged.safety.flags])];
    }
    return { signals: merged, usedLlm: true };
  } catch (err) {
    console.error("Signals LLM error", err);
    return { signals: heuristic, usedLlm: false };
  }
};

export const recommendAction = (
  signals: ConversationSignals,
): { action: SignalAction; actionReason: string } => {
  if (!signals.safety.ok) {
    return {
      action: "escalate",
      actionReason: `Safety flags present (${signals.safety.flags.join(", ") || "unknown"}). Hand off or follow crisis protocol.`,
    };
  }
  if (signals.emotion === "anxious" || signals.emotion === "frustrated") {
    return {
      action: "tone_shift",
      actionReason: `User emotion is ${signals.emotion}. Soften tone before selling or advancing.`,
    };
  }
  if (signals.confidence < 0.4) {
    return {
      action: "clarify",
      actionReason: "Low confidence in intent. Ask one clarifying question.",
    };
  }
  if (signals.stage === "decide" && (signals.intent === "buy" || signals.intent === "compare")) {
    return {
      action: "offer",
      actionReason: "User appears ready to act. A contextual offer or recommendation is appropriate.",
    };
  }
  if (signals.intent === "buy" || signals.stage === "consider") {
    return {
      action: "recommend",
      actionReason: "User is evaluating options. Recommend a relevant product or next step.",
    };
  }
  if (signals.stage === "explore" || signals.intent === "research") {
    return {
      action: "retrieve",
      actionReason: "Early exploration. Retrieve helpful documents or explain concepts.",
    };
  }
  if (signals.intent === "support") {
    return {
      action: "clarify",
      actionReason: "Support intent. Clarify the issue before escalating or offering.",
    };
  }
  return { action: "none", actionReason: "No strong action signal. Continue the conversation." };
};

export const scoreConversation = async (
  messages: ChatMessage[],
  opts: { useLlm?: boolean } = {},
): Promise<ScoreResult> => {
  const heuristic = scoreHeuristic(messages);
  let signals = heuristic;
  let usedLlm = false;
  if (opts.useLlm) {
    const llm = await scoreWithLlm(messages, heuristic);
    signals = llm.signals;
    usedLlm = llm.usedLlm;
  }
  const { action, actionReason } = recommendAction(signals);
  return {
    signals,
    action,
    actionReason,
    engine: usedLlm ? "hybrid" : "heuristic",
  };
};

export const readSignalsPolicy = (
  placementPolicy: unknown,
): { useLlm: boolean } => {
  if (!placementPolicy || typeof placementPolicy !== "object") return { useLlm: false };
  const policy = placementPolicy as Record<string, unknown>;
  const signals = policy.signals;
  if (signals && typeof signals === "object") {
    const s = signals as Record<string, unknown>;
    if (typeof s.useLlm === "boolean") return { useLlm: s.useLlm };
  }
  if (typeof policy.signalsUseLlm === "boolean") return { useLlm: policy.signalsUseLlm };
  return { useLlm: false };
};
