# Founder Q&A — Internal Notes

> Private. Not for the website. Raw questions from Dan (founder) and straight answers.
> Last updated: June 2026.

---

## How does the SDK actually work? Explain like I'm not a developer.

The SDK is a vending machine you put inside someone else's shop. A publisher — someone who built an AI chatbot — installs it in their app. The machine handles everything: asking Prism for an ad, showing it to the user, and reporting back when someone sees or clicks it. The publisher just decides where to put the machine and how often to turn it on.

Step by step:

1. **Setup (once).** The developer tells the SDK: here is my Prism key, here is my bot's name, show card-style ads. Done once, not repeated every time someone chats.

2. **Every message.** When a user sends a message, the bot silently asks Prism: "Do you have an ad that fits this conversation topic?" Prism either sends one back, or says nothing's available. Under a second. User never sees it happen.

3. **Display.** Prism hands back the pieces — headline, description, button text, link, image. The developer can use Prism's pre-built display block (no work required) or arrange the pieces themselves to match their app's look (optional, for publishers who want full control).

4. **Tracking.** The moment a user sees the ad, Prism records it. Click gets recorded too. Revenue counter ticks up automatically. No extra work from the developer.

5. **Frequency control.** Developer sets "show an ad every 5 messages" so users aren't bombarded. The other 4 messages, the machine stays quiet.

---

## The SDK says "the developer arranges the ad to match their app's look." Is that a friction problem I need to solve?

No. Not right now.

The SDK already ships a pre-built display component. The developer drops it in and it renders automatically — no arrangement needed. The "arrange it yourself" option exists only for publishers who want pixel-level control. It's optional, not required.

More importantly: at zero publishers, this is not problem #1 or #2. The first publisher will drop in the pre-built component, it'll render something, and if it looks off in their specific UI they'll tell you. That's the moment to care about display polish — not before anyone has integrated.

Current reality check:
- Zero publishers using the service
- Zero real advertisers
- Placeholder ads in the library put there by Dan to have something ready
- The SDK rendering question is problem #47 at best

---

## How does app developer / publisher trust work? Don't they have to trust us when they put our SDK in their app?

Yes — and this matters for the HMAC security question too.

When a publisher drops the Prism SDK into their app, they have already made the big trust decision. They are letting Prism's servers inject content directly into their users' conversations. The SDK key sitting in their code is already visible to anyone who inspects it.

This is why disabling HMAC for Google Ad Manager (GAM) integration is not a meaningful security downgrade for that use case. The publisher has already trusted Prism with their users. The HMAC was an extra lock on a door the publisher already handed us the keys to.

The real risk of a leaked SDK key is ad fraud — fake impressions inflating a publisher's stats — not data theft. The endpoint only returns ad content, not sensitive data.

---

## Why is GAM integration useful if it's not the path to the first client?

GAM integration is a credibility signal for larger, more established publishers — media companies, apps already running programmatic ads. They see "Google Ad Manager compatible" and know Prism fits into their existing stack without ripping anything out.

It is not the fastest path to client #1. The first publisher is most likely a small indie bot developer who just wants to paste an SDK key and see money come in. They don't have a GAM account.

Build the GAM integration (done), document it (done), mention it on the website (done). Then focus sales energy on small bot developers who can integrate in an afternoon.

---

## What did we actually change to enable GAM?

1. Set `REQUIRE_SDK_HMAC=false` in Supabase Edge Function secrets. This disables mandatory HMAC signing so GAM custom creatives — which run in a sandboxed iframe and cannot compute signatures — can call `POST /api/ads` with just a Bearer SDK key.

2. Added "Google Ad Manager compatible" badge to the Publishers page hero.

3. Updated the HMAC feature description on the Publishers page from "HMAC request signing" to "Flexible auth — Bearer token standard, optional HMAC signing" (because HMAC is now optional, not mandatory).

4. Added a GAM integration section to the Docs page explaining that publishers already running GAM can paste a snippet into a GAM line item — no certification, no approval queue.

5. Updated README.md and HANDOVER.md to document all of the above for any developer who picks this up.
