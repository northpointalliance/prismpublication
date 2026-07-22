# What is Prism Signals, and why does your chatbot need turn-level judgment?

**Slug:** prism-signals-conversation-scoring-2026
**Category:** Publishers
**Excerpt:** Your LLM already replies. Prism Signals scores each turn for intent, emotion, stage, and safety, then recommends what to do next. Ads stay optional.
**Reading time:** 6 min
**Scheduled:** 2026-07-21
**Published:** 2026-07-21
**Status:** published
**Primary ICP:** all (support, SaaS copilots, coaching bots)
**Pillar:** vertical-depth (product launch)

## LinkedIn repost blurb (copy/paste)

Your LLM chatbot already replies. It probably does not know when to clarify, escalate, soften tone, or hold an offer.

We just launched **Prism Signals**: turn-level scoring for intent, emotion, decision stage, topics, and safety. One API call. A recommended next action. Monetization is a plugin, not the default.

Built for customer support bots, in-product assistants, and coaching apps that already run on LLMs.

Read the full breakdown: https://prismpublication.com/blog/prism-signals-conversation-scoring-2026
Product page: https://prismpublication.com/signals

---

You shipped an LLM in front of customers. It answers tickets, walks users through setup, or coaches them through a habit. That part works.

What often does not work is judgment at the turn level. The bot keeps talking when it should ask one clarifying question. It stays cheerful when the user is frustrated. It suggests a product before the user is ready. Or it keeps chatting when safety flags say escalate.

**Prism Signals** scores each turn, returns structured fields your code can read, and recommends one next action. Judgment is the product. Partner offers are optional when the moment is right.

## Why do LLM chatbots need turn-level judgment?

Prompts help, but they do not replace a decision layer. A user who says "this still is not fixed and I have waited two days" is not asking for a FAQ link. They are frustrated and likely need a softer tone or a human handoff, not another generic troubleshooting step.

Without scoring, your stack guesses when to pull different documents, route to a human, ask a follow-up, or show a commercial suggestion. Those guesses show up as longer sessions, lower satisfaction scores, and support teams that do not trust the bot.

See the product overview at [Prism Signals](https://prismpublication.com/signals).

## What does the API return?

Each call to `POST /api/signals/score` sends recent messages (same auth as the Prism ads SDK). **This is not a chat transcript.** You send messages in; you get back a structured score object plus one recommended action. Your bot decides how to act on it.

Example response shape:

```json
{
  "signals": {
    "intent": "support",
    "confidence": 0.41,
    "emotion": "frustrated",
    "stage": "consider",
    "topics": ["fixed", "waited", "help"],
    "safety": { "ok": true, "flags": [] }
  },
  "action": "tone_shift",
  "actionReason": "User emotion is frustrated. Soften tone before selling or advancing.",
  "engine": "heuristic"
}
```

**Signal fields (inside `signals`):**

- **intent:** what the user is trying to do (research, compare, buy, support, or other)
- **confidence:** how sure the scorer is, from 0.0 to 1.0 (low scores often mean ask a clarifying question)
- **emotion:** neutral, curious, anxious, frustrated, or positive
- **stage:** explore, consider, decide, or post_purchase
- **topics:** keywords from the turn (useful for routing or retrieval)
- **safety:** whether the turn is safe to continue, plus any flags (crisis, medical, and similar)

**Recommended action (top-level `action`, one per turn):**

- `clarify`: ask one more question before answering
- `retrieve`: fetch different docs or context
- `escalate`: hand off to a human queue
- `tone_shift`: soften or adjust voice before continuing
- `recommend`: suggest a next step, plan, or resource you control
- `offer`: optional partner suggestion when safe and timely (only if you opt in)
- `none`: no structural change needed

Integration details: [Prism docs](https://prismpublication.com/docs).

## What does this look like in a real conversation?

Here is a support example (also shown on [prismpublication.com/signals](https://prismpublication.com/signals)).

**User:** "This still is not fixed and I have already waited two days. Can someone actually help?"

**Your bot might:** acknowledge the delay, soften tone, ask for an order ID if confidence stays low, and flag human handoff on the next frustrated turn. No ad required.

**Compare with a buy-intent turn:** "I want to upgrade today, what is the difference between plans?" That might map to `recommend`, or to `offer` if you opt into partner suggestions.

Signals uses fast heuristics on every call. You can enable optional LLM scoring per bot in the publisher portal when you need more nuance. That keeps latency and cost predictable for high-volume support bots.

## Who is Signals for?

- **Customer support bots:** know when frustration crosses a threshold or deflection should stop
- **In-product assistants:** route retrieval and escalation instead of guessing
- **Coaching and lifestyle bots:** suppress offers when emotion or safety says wait

If you only want banner inventory, start with the [marketplace](https://prismpublication.com/publishers). If you want better conversations first, start with Signals.

## How do you integrate it?

```javascript
import { PrismAds } from "@prismpublication/sdk";

const result = await prism.scoreTurn({
  botId: "YOUR_PUBLIC_BOT_ID",
  messages: [
    { role: "user", content: "I want to compare the pro and team plans" },
  ],
  includeOffer: false,
});
```

Three steps: send the last few turns, read `signals` and `action`, wire the action into your stack (retrieval path, escalation queue, tone rules, optional offer slot).

## How does Signals relate to ads?

Same SDK, two layers. **Signals** improves conversations (clarify, escalate, tone). The **marketplace** surfaces partner integrations when action is `offer` and you opt in. You can adopt Signals without running a single ad.

## Frequently Asked Questions

**Is Signals only for chatbots that show ads?**
No. Many teams will use scoring without ever enabling `offer`.

**Can I use Signals with my own LLM provider?**
Yes. Signals scores the messages you send. Your main chat model stays separate.

**What is the difference between `recommend` and `offer`?**
`recommend` is a next step you control (docs, plans, internal upsell). `offer` is an optional partner suggestion from the Prism marketplace.

**Where do I start?**
Read the [docs](https://prismpublication.com/docs), register a bot in the publisher portal, and call `scoreTurn` on staging traffic.

---

*Add turn-level judgment to the bots you already run. Explore [Prism Signals](https://prismpublication.com/signals) or [contact us](https://prismpublication.com/contact).*
