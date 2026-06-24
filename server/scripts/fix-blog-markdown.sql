-- =============================================================================
-- Prism Blog Post Markdown Fix
-- Run in: Supabase Dashboard > SQL Editor > New Query > paste > Run
-- Safe to re-run — all changes are idempotent.
-- =============================================================================


-- PART 1: Fix title fields that have markdown # prefix
-- These show as "# Title" in the page <h1>. Strip the prefix.

UPDATE blog_posts
SET title = 'Everyone''s Talking About "Targeting Ads" — But This Is What Actually Works in 2026'
WHERE id = 'cmpydhpr8002plggw01sao40q';

UPDATE blog_posts
SET title = 'Why Chatbot Operators Are Ditching Subscriptions for Ad Revenue'
WHERE id = 'cmpvdop2t001xlggwnzbxm4e7';

UPDATE blog_posts
SET title = 'How Native Ads in AI Chatbots Actually Work'
WHERE id = 'cmpqlv446001klggw60bcqao9';

UPDATE blog_posts
SET title = 'How ad matching actually happens'
WHERE id = 'cmpedu90o000tlggwqyes0p5j';

UPDATE blog_posts
SET title = 'Charging Users $10/Month for Your AI Chatbot Sounds Like a Business. Often It Isn''t.'
WHERE id = 'cmn7o57bq000rije3isznesmt';


-- PART 2: Strip "# Title" from body start
-- The article page already renders the title as <h1>. A repeated # heading in
-- the body creates visual duplication.

UPDATE blog_posts
SET body = regexp_replace(body, E'^# [^\n]+\n+', '')
WHERE id IN (
  'cmpydhpr8002plggw01sao40q',
  'cmpqlv446001klggw60bcqao9',
  'cmn7o57bq000rije3isznesmt',
  'cmnbia4cv000pdqnke6k9kd2t'
);


-- PART 3: Strip plain-text title repetition from body start

UPDATE blog_posts
SET body = regexp_replace(body, E'^The Death of the Cookie and the Rise of Conversational Intent\n+', '')
WHERE id = 'cmplc73uu0010lggwidhn5zps';

UPDATE blog_posts
SET body = regexp_replace(body, E'^What advertisers should be asking\n+', '')
WHERE id = 'cmomijh62001ydqnkc39shzyy';

UPDATE blog_posts
SET body = regexp_replace(body, E'^What chatbot operators need to understand\n+', '')
WHERE id = 'cmofh4exf001mdqnkgtrqveeh';

UPDATE blog_posts
SET body = regexp_replace(body, E'^Why chatbot context is high\\-intent territory\n+', '')
WHERE id = 'cmobhr9za001edqnk6q2sdkek';

UPDATE blog_posts
SET body = regexp_replace(body, E'^What Contextual Ads in Chatbots Actually Are \\(And Why They Work Differently\\)\n+', '')
WHERE id = 'cmo8fxgfl0018dqnk7emisltn';

UPDATE blog_posts
SET body = regexp_replace(body, E'^Advertisers, It''s Time to Rethink Where the Conversation Is Happening\n+', '')
WHERE id = 'cmmygzg9c006e3j1j1v5in4ex';

UPDATE blog_posts
SET body = regexp_replace(body, E'^Sponsored Responses vs\\. Real Answers — Who Do You Trust in a Chatbot\\?\n+', '')
WHERE id = 'cmmrzi3kg00573j1j8gu1afkx';

UPDATE blog_posts
SET body = regexp_replace(body, E'^How to Monetize Chatbot Sessions: The Revenue Models Actually Working Right Now\n+', '')
WHERE id = 'cmmmbb6hq004c3j1jbdzahrvd';

UPDATE blog_posts
SET body = regexp_replace(body, E'^OpenAI Adding Shopping to ChatGPT Isn''t a Product Update\\. It''s a Declaration of War on Google''s Core Business Model\\.\n+', '')
WHERE id = 'cmmhd55t5003s3j1jxze9ml0q';


-- PART 4: Strip stray metadata block left by LinkedIn/Substack copy-paste
-- One post has "Prism Publication · Advertiser Education" pasted in.

UPDATE blog_posts
SET body = regexp_replace(body, E'Prism Publication\n\n\\.\n\nAdvertiser Education\n+', '')
WHERE id = 'cmo8fxgfl0018dqnk7emisltn';

UPDATE blog_posts
SET body = regexp_replace(body, E'Prism Publication\n\n·\nAdvertiser Education\n+', '')
WHERE id = 'cmo8fxgfl0018dqnk7emisltn';


-- PART 5: Strip leading blank lines from posts that start with whitespace

UPDATE blog_posts
SET body = regexp_replace(body, E'^[\\n ]+', '')
WHERE id IN (
  'cmpvdop2t001xlggwnzbxm4e7',
  'cmpedu90o000tlggwqyes0p5j',
  'cmmekw7i000353j1jeql7v3tt',
  'cmmc5span001h3j1jugmt35gv',
  'cmmur0juh005e3j1joux1475a',
  'cmp9x70ur000dlggwm7aag6i7'
);


-- PART 6: Rewrite flat plain-text posts with proper markdown structure
-- These posts have no ## headers at all. Content is good — they just need structure.

-- "What advertisers should be asking"
UPDATE blog_posts SET body =
'If you are a media buyer or brand strategist evaluating chatbot inventory for the first time, a few questions are worth pressing on before committing budget.

## Questions to ask before you buy

**How is relevance determined?** Is the ad matched to the full conversation or just a session-level topic tag? The answer tells you how much targeting precision you are actually getting.

**What does the disclosure look like?** Regulatory scrutiny on AI-generated commercial content is increasing. Any inventory you buy should have clear, consistent attribution so you are not exposed.

**What is the user opt-out path?** Chatbot users are primed to trust the product they are using. Placements that feel deceptive erode that trust fast — and you do not want your brand in that environment.

**What performance metrics are available?** Chatbot advertising is new enough that some operators are still figuring out their measurement stack. Understand what data you will get back before you commit budget.

## The bigger picture

AI chat interfaces are eating a meaningful share of what used to be search traffic. Where attention moves, advertising eventually follows.

The contextual ad model is a different way of thinking about relevance: one that uses what a user actually said they need, in their own words, as the targeting signal. That is a better input than a cookie, a browsing history, or a keyword. The hard part is building ad delivery that does not waste it.

The operators who get this right will have a sustainable revenue model. The advertisers who show up early will have a format advantage before it gets crowded. That is the window.'
WHERE id = 'cmomijh62001ydqnkc39shzyy';


-- "What chatbot operators need to understand"
-- Note: the original body had a second post accidentally pasted in at the end.
-- This version strips that and keeps only the content relevant to this title.
UPDATE blog_posts SET body =
'If you run a chatbot product and you are thinking about monetization, the contextual ad model solves a problem that subscriptions alone cannot fix: not everyone will pay, but nearly everyone can be monetized if the experience stays intact.

## The math behind ad-supported chatbots

Subscription models depend on converting a fraction of users. Ad-supported models can run revenue across your entire active base — even the users who would never pull out a credit card. Given the compute costs sitting behind most AI products right now, that matters.

## The real risk

Bad ad implementations have burned user trust in other contexts. The chatbot space is still early enough that operators can set a high bar. The right model is one where the ad infrastructure knows what the conversation is actually about and surfaces things that fit — not just whatever the highest bidder paid for.

Platforms like Prism are building exactly for this: a native ad layer that integrates with chat at the conversation level, not just the session or page level. The idea is that operators should not have to choose between revenue and user experience.'
WHERE id = 'cmofh4exf001mdqnkgtrqveeh';


-- "Why chatbot context is high-intent territory"
-- Note: the original body had a second post accidentally pasted in at the end.
-- This version strips that and keeps only the content relevant to this title.
UPDATE blog_posts SET body =
'People do not open a chatbot to browse. They open it because they have something specific to figure out. That is a fundamentally different mode than scrolling a feed or landing on an article.

## Why this matters for advertisers

The ads that fit this environment are not the awareness plays you would run on YouTube or a display network. They are consideration-stage placements where someone is actively working through a decision. That profile maps cleanly onto performance budgets.

For advertisers losing signal from cookie deprecation and watching search ROI compress, this is worth paying attention to. Conversational context does not require third-party data. The signal is right there in the thread.

## The ceiling on getting it wrong

A chatbot that inserts irrelevant ads into a conversation does not just underperform. It breaks the product experience. Users leave and do not come back. Operators know this, which is why the better ones are being deliberate about what kind of advertising they let into their products.

That is the forcing function that makes this format worth taking seriously.'
WHERE id = 'cmobhr9za001edqnk6q2sdkek';


-- "Why the Question Is the Ad"
UPDATE blog_posts SET body =
'## The shift from behavioral targeting to intent-moment monetization

For decades, digital advertising operated on a simple but flawed premise: follow the user.

Track what they browsed last Tuesday. Build a profile. Serve them a banner for running shoes on a recipe website because they once visited a sneaker page. Hope they notice. Hope they click. Most of the time, they do not.

The industry called this behavioral targeting, and it dominated digital advertising for twenty years. It also produced banner blindness, ad blockers, privacy regulations, and a growing public hostility toward online ads that never seems to improve.

## A fundamentally different insight

Forward-thinking companies across retail, travel, and consumer health are abandoning the follow-the-user model entirely. They are building around a different insight: the moment a user asks a specific question in natural language is the moment of highest purchase intent they will ever have.

Not yesterday. Not last week. Right now, in this conversation.

That shift is not a better version of behavioral advertising. It is a fundamentally different thing.'
WHERE id = 'cmmekw7i000353j1jeql7v3tt';


-- PART 7: Add categories and reading times where missing

UPDATE blog_posts SET category = 'Ad Strategy',      "readingTime" = 5 WHERE id = 'cmpydhpr8002plggw01sao40q';
UPDATE blog_posts SET category = 'Publisher Ops',    "readingTime" = 7 WHERE id = 'cmpvdop2t001xlggwnzbxm4e7';
UPDATE blog_posts SET category = 'Ad Strategy',      "readingTime" = 5 WHERE id = 'cmpqlv446001klggw60bcqao9';
UPDATE blog_posts SET category = 'Ad Strategy',      "readingTime" = 6 WHERE id = 'cmpedu90o000tlggwqyes0p5j';
UPDATE blog_posts SET category = 'Publisher Ops',    "readingTime" = 4 WHERE id = 'cmn7o57bq000rije3isznesmt';
UPDATE blog_posts SET category = 'Ad Strategy',      "readingTime" = 5 WHERE id = 'cmnbia4cv000pdqnke6k9kd2t';
UPDATE blog_posts SET category = 'Industry Trends',  "readingTime" = 8 WHERE id = 'cmplc73uu0010lggwidhn5zps';
UPDATE blog_posts SET category = 'Advertiser Guide', "readingTime" = 4 WHERE id = 'cmomijh62001ydqnkc39shzyy';
UPDATE blog_posts SET category = 'Publisher Ops',    "readingTime" = 4 WHERE id = 'cmofh4exf001mdqnkgtrqveeh';
UPDATE blog_posts SET category = 'Advertiser Guide', "readingTime" = 4 WHERE id = 'cmobhr9za001edqnk6q2sdkek';
UPDATE blog_posts SET category = 'Ad Strategy',      "readingTime" = 5 WHERE id = 'cmo8fxgfl0018dqnk7emisltn';
UPDATE blog_posts SET category = 'Industry Trends',  "readingTime" = 3 WHERE id = 'cmp9x70ur000dlggwm7aag6i7';
UPDATE blog_posts SET category = 'Publisher Ops',    "readingTime" = 6 WHERE id = 'cmozn3hsi002hdqnk4k9dn4ty';
UPDATE blog_posts SET category = 'Advertiser Guide', "readingTime" = 4 WHERE id = 'cmmygzg9c006e3j1j1v5in4ex';
UPDATE blog_posts SET category = 'SEO + AEO',        "readingTime" = 6 WHERE id = 'cmmur0juh005e3j1joux1475a';
UPDATE blog_posts SET category = 'Trust + Policy',   "readingTime" = 5 WHERE id = 'cmmrzi3kg00573j1j8gu1afkx';
UPDATE blog_posts SET category = 'Publisher Ops',    "readingTime" = 7 WHERE id = 'cmmoth0p7004m3j1jflibo4tr';
UPDATE blog_posts SET category = 'Publisher Ops',    "readingTime" = 8 WHERE id = 'cmmmbb6hq004c3j1jbdzahrvd';
UPDATE blog_posts SET category = 'SEO + AEO',        "readingTime" = 4 WHERE id = 'cmmk2yxwz00413j1jsotjsd03';
UPDATE blog_posts SET category = 'Industry Trends',  "readingTime" = 3 WHERE id = 'cmmhd55t5003s3j1jxze9ml0q';
UPDATE blog_posts SET category = 'Ad Strategy',      "readingTime" = 5 WHERE id = 'cmmekw7i000353j1jeql7v3tt';
UPDATE blog_posts SET category = 'Industry Trends',  "readingTime" = 4 WHERE id = 'cmmc5span001h3j1jugmt35gv';
