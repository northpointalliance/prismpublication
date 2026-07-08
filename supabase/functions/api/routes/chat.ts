import { Hono } from "hono";
import type { Env } from "../../_shared/http.ts";
import { readJson } from "../../_shared/http.ts";
import { openaiApiKey } from "../../_shared/config.ts";

// Mounted at /api/chat. Public, no auth — powers the Skylar demo assistant on the
// marketing site. Was previously missing entirely, which is why the Skylar page
// caught every request in its `catch` block and showed "I hit a snag" on every message.
const chat = new Hono<Env>();

const MAX_MESSAGE_LENGTH = 2000; // bounds input tokens (and therefore cost) per request
const MAX_REPLY_TOKENS = 300; // bounds output tokens (and therefore cost) per reply
const MODEL = "gpt-4o-mini"; // cheap, fast default — see packages/sdk/README.md for the same guidance

const generateFallbackReply = (message: string) => {
  const text = message.trim().toLowerCase();
  if (!text) {
    return "Hello! I can help you plan your week, turn a messy idea into a clear next step, or draft a quick follow-up. What would you like to tackle first?";
  }
  if (text.includes("plan") || text.includes("week") || text.includes("organize")) {
    return "A simple next step is to choose one priority and block 30 minutes for it first. Once that is moving, the rest of the week gets easier.";
  }
  if (text.includes("help") || text.includes("idea") || text.includes("draft")) {
    return "Start with the core message you want to send, then tighten it into three bullets. That usually makes the final draft much faster.";
  }
  return "I can help turn this into a clear next step, a short plan, or a polished draft. Tell me what you want to tackle.";
};

chat.post("/", async (c) => {
  const body = (await readJson(c)) as { message?: unknown } | undefined;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return c.json({ error: "message is required" }, 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return c.json({ error: `message must be under ${MAX_MESSAGE_LENGTH} characters` }, 400);
  }
  if (!openaiApiKey) {
    console.warn("OPENAI_API_KEY is not configured; falling back to local Skylar response logic.");
    return c.json({ reply: generateFallbackReply(message) });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are Skylar, a calm, practical assistant that helps people turn messy ideas into a focused plan and a concrete next step. Keep replies short and actionable.",
          },
          { role: "user", content: message },
        ],
        max_tokens: MAX_REPLY_TOKENS,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return c.json({ error: "Chat request failed" }, 502);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      console.error("OpenAI returned no reply content", data);
      return c.json({ error: "Chat request failed" }, 502);
    }

    return c.json({ reply });
  } catch (err) {
    console.error("Chat handler failed", err);
    return c.json({ error: "Chat request failed" }, 500);
  }
});

export default chat;
