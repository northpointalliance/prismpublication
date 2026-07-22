-- Publish: What is Prism Signals, and why does your chatbot need turn-level judgment?
-- Live URL: https://prismpublication.com/blog/prism-signals-conversation-scoring-2026

INSERT INTO blog_posts (
  id, title, slug, excerpt, body, category, "readingTime",
  published, "publishedAt", "createdAt", "updatedAt"
) VALUES (
  'cm3k7signals20260721',
  'What is Prism Signals, and why does your chatbot need turn-level judgment?',
  'prism-signals-conversation-scoring-2026',
  'Your LLM already replies. Prism Signals scores each turn for intent, emotion, stage, and safety, then recommends what to do next. Ads stay optional.',
  $prism_body_signals_2026$You shipped an LLM in front of customers. It answers tickets, walks users through setup, or coaches them through a habit. That part works.

What usually does not work is judgment at the turn level. The bot keeps talking when it should ask one clarifying question. It stays cheerful when the user is frustrated. It suggests a product before the user is ready. Or worse, it keeps chatting when safety flags say escalate.

That gap is expensive. Bad handoffs burn support hours. Premature offers erode trust. Guessing wrong on retrieval wastes tokens on the wrong documents.

**Prism Signals** is our answer: a conversation scoring layer that runs on every turn, returns structured signals, and recommends a next action. Judgment is the product. Partner offers are optional when the moment is right.

This article explains what Signals is, who it is for, how the API works, and how it fits beside (not instead of) the chatbot you already run.

## Why do LLM chatbots need turn-level judgment?

Most teams treat the LLM as the brain and hope the prompt covers every edge case. Prompts help. They do not replace an explicit decision layer.

Real conversations branch. A user who says "this still is not fixed and I have waited two days" is not asking for a FAQ link. They are frustrated, likely in a support intent, probably in a consider-or-decide stage about whether to stay a customer. The right move is often **tone_shift** or **escalate**, not another generic troubleshooting step.

Without turn-level scoring, your stack guesses:

- When to pull different RAG documents
- When to route to a human
- When to ask a follow-up instead of answering
- When (if ever) to show a commercial suggestion

Those guesses show up as longer sessions, lower CSAT, and support teams that do not trust the bot.

**TL;DR:** Reply quality is table stakes. Knowing **what to do with the reply** is the missing layer.

See the live product overview at [Prism Signals](https://prismpublication.com/signals).

## What does Prism Signals actually return?

Each call to `POST /api/signals/score` sends recent messages (same auth as the Prism ads SDK). You get back structured signals plus one recommended action.

**Signals (every response):**

| Signal | Example values | What it tells you |
|---|---|---|
| Intent | research, compare, buy, support, other | What the user is trying to accomplish |
| Confidence | 0.0 to 1.0 | How sure the scorer is (low → clarify) |
| Emotion | neutral, curious, anxious, frustrated, positive | Tone the bot should match or soften |
| Stage | explore, consider, decide, post_purchase | Where they are in a decision journey |
| Topics | keyword list | What the turn is about (for routing or RAG) |
| Safety | ok + flags | Whether to escalate or suppress offers |

**Recommended action (one per turn):**

- `clarify`: ask one more question before answering
- `retrieve`: fetch different docs or context
- `escalate`: hand off to a human queue
- `tone_shift`: soften or adjust voice before continuing
- `recommend`: suggest a next step, plan, or resource
- `offer`: optional partner suggestion when safe and timely
- `none`: no structural change needed

Your bot (or agent orchestration layer) decides how to execute. Prism recommends; you remain in control.

**TL;DR:** One score, six possible actions, zero requirement to show an ad.

Integration shape lives in the [docs](https://prismpublication.com/docs).

## How is Signals different from just running another LLM call?

You could ask your main model "what should we do next?" on every turn. Many teams try. It is slow, costly, and inconsistent.

Signals uses **heuristics on every request** for fast, predictable baseline scoring. When you enable LLM scoring per bot in the publisher portal, heuristics merge with a lightweight model pass for a **hybrid** engine. You choose speed vs depth per bot.

That split matters for unit economics. A support bot handling thousands of tickets per day cannot afford a second full inference on every message. Heuristic-first scoring keeps latency low and bills predictable. LLM merge is there when you need nuance on high-trust or high-value flows.

Metering is built in (`signal_events` table, usage card in the publisher portal). We are metering now; paywall comes later. Early publishers can test judgment on real traffic without a pricing surprise.

**TL;DR:** Signals is a dedicated scoring layer, not a second copy of your main chat model.

For inference cost context on consumer bots, see [wellness chatbot API costs at scale](https://prismpublication.com/blog/wellness-chatbot-api-costs-2026).

## Who is Prism Signals built for?

We designed Signals for teams that **already run an LLM in production**, not for greenfield ad networks.

**Customer support bots.** You deflect tier-1 tickets with an LLM, but agents still clean up bad escalations. Signals tells you when frustration crosses a threshold, when to clarify account details, and when to stop deflecting.

**In-product assistants.** SaaS copilots that answer how-to questions need retrieval routing. Explore-stage questions map to `retrieve`. Compare-stage questions map to `recommend`. Support regressions map to `escalate`.

**Coaching and lifestyle bots.** High-trust conversations (wellness, fitness, travel planning) need safety and emotion awareness before any monetization. Signals suppresses `offer` when emotion is anxious or safety flags fire. Monetization becomes a plugin, not the default path.

If you are only looking for banner inventory, Signals is not the front door. If you want better conversations **and** optional partner revenue later, it is.

**TL;DR:** Support, copilots, and coaching bots gain the most from turn-level judgment.

Publisher onboarding: [prismpublication.com/publishers](https://prismpublication.com/publishers).

## What does a Signals scoring flow look like in practice?

Here is a concrete support scenario (the same pattern shown on [prismpublication.com/signals](https://prismpublication.com/signals)):

**User message:** "This still is not fixed and I have already waited two days. Can someone actually help?"

**Signals output (illustrative):**

- Intent: `support`
- Confidence: `0.41` (ambiguous details → consider clarifying)
- Emotion: `frustrated`
- Stage: `consider`
- Safety: `ok`
- **Action: `tone_shift`**

**Reason:** User emotion is frustrated. Soften tone before selling or advancing.

Your orchestration layer might:

1. Inject a system instruction to acknowledge delay and apologize briefly
2. Ask one clarifying question (order ID, environment) if confidence stays low
3. Set a flag to offer human handoff on the next frustrated turn

No ad. No hard sell. Just better alignment between what the user feels and what the bot does next.

Compare that to a buy-intent turn ("I want to upgrade today, what is the difference between plans?") where stage `decide` and intent `compare` might map to `recommend` or, if you opt in, `offer`.

**TL;DR:** Same API, different actions depending on what the user actually said.

Try the conversational UI patterns in the [demo](https://prismpublication.com/demo).

## When should a bot show an offer vs hold back?

This is where Signals diverges from ad-first networks.

`offer` is one action among six. It fires only when:

- Safety is clear (no crisis, self-harm, or medical triage flags)
- Emotion is not anxious or frustrated (unless your policy overrides)
- Stage and intent suggest the user is evaluating or ready to act
- You opt in to partner suggestions for that bot

For wellness and coaching bots, holding back is often the right default. A user describing sleep anxiety does not need a mattress ad in that turn. Signals recommends `tone_shift` or `clarify` first. Monetization waits.

For travel or SaaS upgrade flows, `offer` or `recommend` may appear more often because the user is explicitly comparing options.

That policy belongs to you. Signals gives a recommendation; your placement rules and allowlists stay in your product.

**TL;DR:** Offers are optional and gated by emotion, safety, and stage. Judgment comes first.

Trust-safe monetization patterns for wellness bots: [wellness chatbot monetization without breaking trust](https://prismpublication.com/blog/wellness-chatbot-monetization-contextual-2026).

## How do you integrate Prism Signals?

If you already use the Prism SDK for ads, Signals is one more method.

**JavaScript / TypeScript:**

```javascript
import { PrismAds } from "@prismpublication/sdk";

const result = await prism.scoreTurn({
  botId: "YOUR_PUBLIC_BOT_ID",
  messages: [
    { role: "user", content: "I want to compare the pro and team plans" },
  ],
  includeOffer: false, // set true only when you want ad payload
});

// result.signals → intent, confidence, emotion, stage, topics, safety
// result.action → clarify | retrieve | escalate | tone_shift | recommend | offer | none
// result.actionReason → human-readable why
// result.engine → heuristic | hybrid
```

**REST:** `POST /api/signals/score` with the same HMAC auth as `/api/ads`.

**Portal controls:**

- Toggle **Use LLM scoring** per bot (`placementPolicy.signals.useLlm`)
- View **Signals usage** for the last 30 days

Three steps end to end:

1. Send the last few turns
2. Receive signals + action
3. Wire the action into your stack (RAG path, escalation queue, tone rules, optional offer slot)

**TL;DR:** Same SDK auth as ads. One new endpoint. Your execution logic stays in your codebase.

Full request/response examples: [Prism docs](https://prismpublication.com/docs).

## How does Signals relate to the Prism ad marketplace?

Prism started as an ad marketplace for AI chat. Signals reflects a broader truth we kept hearing from publishers: **they need better conversation control before they need more ad slots.**

So the product split is intentional:

| Layer | Buyer story | Value |
|---|---|---|
| **Signals** | Teams running LLMs | Fewer bad handoffs, clearer next steps, safer moments |
| **Marketplace** | Advertisers + opt-in publishers | Partner suggestions when action is `offer` |

Same pipe. Different entry point. You can adopt Signals without running a single ad. You can run ads later without ripping out scoring.

For publishers comparing independent monetization to platform-owned ad programs, see [AI ad platforms vs independent publishers](https://prismpublication.com/blog/ai-ad-platforms-vs-independent-publishers-2026).

**TL;DR:** Judgment first. Marketplace when you are ready.

## What should you measure after turning Signals on?

Start with conversation quality metrics, not ad RPM:

| Metric | What to watch |
|---|---|
| Escalation rate | Are more tickets reaching humans appropriately? |
| Session length after frustrated turns | Does tone_shift reduce rage quits? |
| Clarify → resolve rate | Do follow-up questions help or annoy? |
| Offer suppression count | How often did Signals prevent a bad monetization moment? |
| CSAT or thumbs on scored turns | Qualitative validation |

If you later enable offers, add offer CTR and retention among exposed users. A healthy pattern: modest commercial CTR **and** stable session continuation. A red pattern: rising CTR with falling retention.

**TL;DR:** Measure whether judgment improves conversations before you measure ad revenue.

Broader publisher monetization frameworks: [AI app publisher monetization](https://prismpublication.com/blog/ai-app-publisher-monetization-2026).

## What is a sensible rollout plan for Signals?

Treat Signals like any production feature:

1. **Shadow mode:** log actions without changing bot behavior for a few days
2. **Tone and escalate only:** wire `tone_shift` and `escalate` first (lowest risk)
3. **Retrieval routing:** map `retrieve` to your RAG paths
4. **Clarify on low confidence:** reduce wrong answers before they happen
5. **Recommend and offer last:** only after safety and emotion gates feel right

Review the first 50 scored turns manually. You will quickly see where your prompt assumes context the user never gave.

**TL;DR:** Start with safety and tone. Add commercial actions only when conversation quality holds.

## Frequently Asked Questions

**Is Prism Signals only for chatbots that show ads?**
No. Ads are optional. The core product is turn-level scoring and recommended actions. Many teams will use Signals without ever enabling `offer`.

**How fast is the scoring API?**
Heuristic scoring runs on every call and is designed for low latency. Optional LLM merge adds processing time but runs only when you enable it per bot.

**Does Signals store full conversation content?**
Usage is metered per bot for billing visibility. Review the [ad policy](https://prismpublication.com/ad-policy) and your DPA for retention details. Design your integration to send only the turns you need scored.

**Can I use Signals with my own LLM provider?**
Yes. Signals scores messages you send. Your main inference (OpenAI, Anthropic, open models) stays separate. Signals does not replace your chat model.

**What is the difference between `recommend` and `offer`?**
`recommend` suggests a next step you control (docs, plans, internal upsell). `offer` is the path to optional partner suggestions from the Prism marketplace when you opt in.

**We already launched at prismpublication.com/signals. Where do we start?**
Read the API shape in [docs](https://prismpublication.com/docs), register a bot in the publisher portal, and call `scoreTurn` on staging traffic. Enable LLM scoring only if heuristics miss nuance you care about.

---

*Add turn-level judgment to the bots you already run. Explore [Prism Signals](https://prismpublication.com/signals) or talk to us at [prismpublication.com/contact](https://prismpublication.com/contact).*
$prism_body_signals_2026$,
  'Publishers',
  11,
  true,
  now(),
  now(),
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  "readingTime" = EXCLUDED."readingTime",
  published = true,
  "publishedAt" = now(),
  "updatedAt" = now();
