# Website Planning — Macro Thesis Content
### Planning only. Do not publish. No changes to prismpublication.com yet.

Companion to [WHITE-PAPER-MACRO-THESIS.md](./WHITE-PAPER-MACRO-THESIS.md) and [MARKETING-LANGUAGE-PLANNING.md](./MARKETING-LANGUAGE-PLANNING.md). This maps where the "why now" market thesis could eventually land on the live site, once there's a first publisher client to anchor it with proof (see the honest gap noted in both docs above).

---

## Guiding rule

The macro thesis is a supporting argument, not the headline. The site's job is still to get one publisher to install the SDK. Market-size slides belong in front of investors; the site should translate the same thesis into "here's why your app specifically needs this," using the ICP section of the white paper as the source material.

---

## Page-by-page plan

### Homepage (`/`, `src/pages/Index.tsx`)

Current flow: Hero → ScrollVideo → HowItWorks → Audience → Stats → FAQ → CTA.

- **StatsSection** (`src/components/StatsSection.tsx`) is the natural home for one or two macro stats, not a market-size claim. Best candidates: the 2-5% freemium conversion benchmark and the "token tax" idea (framed as "your most engaged free users cost you the most"). These are provable, relatable, and don't need investor-grade sourcing.
- Do **not** put the $28B-$140B AI companion market figure on the homepage. That's an investor argument, not a publisher argument. A publisher doesn't care how big the category is, they care about their own CAC and burn.
- Possible new one-liner near the Hero or Audience section: "It's never been cheaper to build an AI app, or more expensive to run one." This is the sharpest single-sentence version of Part 1 of the white paper and doubles as a hook.

### Publishers page (`/publishers`, `src/pages/Publishers.tsx`)

This is where the ICP section of the white paper belongs almost verbatim.

- Add a section that names the two costs a publisher already feels: CAC (cite the $80-100 real cost per paying user, since it's Prism's own derived estimate and directly relevant to this audience) and the token/compute cost of free users who never convert.
- Follow the existing "named enemy" pattern from MARKETING-LANGUAGE-PLANNING.md: don't attack subscriptions, name the friction ("You built a conversation product. A paywall turns it into a toll booth for 95% of the people who show up.").
- Close with the existing five-minute SDK install framing already drafted in MARKETING-LANGUAGE-PLANNING.md ("What you can do in under 30 minutes").

### Advertisers page (`/advertisers`, `src/pages/Advertisers.tsx`)

- Different angle: advertisers should hear "high-intent, explicit-text signal," not "publishers are broke." Pull from the "users don't scroll, they type exactly what they want" framing in Part 1.
- The knee/10k running shoe example from the white paper is a strong illustrative example for this page specifically, it shows an advertiser exactly what a placement looks like.

### Company / About (`src/pages/Company.tsx` or `src/pages/company/`)

- This is the more natural home for the investor-facing macro argument, if Prism ever adds an "our thesis" or "why we exist" section aimed at investors or press, not customers.
- Keep it short: one version of the "infinite supply, escalating cost" framing, plus the positioning sentence ("The only ad infrastructure built for the inside of a conversation"). Link out to the fuller white paper as a PDF/doc download rather than reproducing all of Part 1 on the page.

### Docs (`/docs`, `src/pages/Docs.tsx`)

- No change. This page is for integration, not narrative.

---

## What NOT to do yet

- Don't publish specific market-size numbers ($28B, $48B, $140B) anywhere on the live site until they're double-checked against a named, linkable source. Internal white paper caveats apply here too.
- Don't lead any page with the macro thesis. Every page still needs to end at "install the SDK" or "book a call," per the standing strategic decision to prioritize proof (one named publisher) over content/distribution plays.
- Don't build new standalone pages (e.g. a `/why-now` route) until there's a reason for someone to land there. Fold the thesis into existing pages first.

---

## Suggested order of operations, when this becomes real work

1. Add the two homepage stat callouts to `StatsSection.tsx` (small, low-risk copy change).
2. Draft the Publishers page CAC/token-tax section and route it through Dan for tone check (matches existing "no em dashes, no buzzwords" rule).
3. Advertiser-page intent-signal section.
4. Company page thesis summary + white paper download link, last, since it's the least urgent for landing a client.
