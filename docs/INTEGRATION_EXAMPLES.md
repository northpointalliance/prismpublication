# Prism Ad Integration Examples

This document provides code snippets for integrating Prism ads into your AI chatbot or conversational AI.

## Basic Integration

### JavaScript/TypeScript SDK

API endpoints (relative to your Prism server):
- `POST /api/ads` — fetch a targeted ad
- `POST /api/track/impression` — record an impression
- `POST /api/track/click` — record a click
- `POST /api/track/revenue` — record revenue (SDK keys only)

```javascript
import crypto from "node:crypto"; // Node.js built-in; omit in browser environments

// ── Prism Ads client ─────────────────────────────────────────────────────────
class PrismAds {
  /**
   * @param {object} options
   * @param {string} options.apiKey   - SDK key from the publisher portal (bgsk_…)
   * @param {string} options.botId    - publicId shown on the portal bot list
   * @param {string} [options.baseUrl] - Base URL of your Prism API server (no trailing slash)
   * @param {string} [options.position] - 'inline' | 'sidebar' | 'floating'
   * @param {string} [options.adFormat] - 'text' | 'card' | 'banner'
   * @param {boolean} [options.signRequests] - Send HMAC signature headers. Default true — required by Prism servers (REQUIRE_SDK_HMAC defaults to on). Set false only during a migration window.
   */
  constructor(options) {
    this.apiKey      = options.apiKey;
    this.botId       = options.botId;
    this.baseUrl     = (options.baseUrl || "").replace(/\/$/, "");
    this.position    = options.position  || "inline";
    this.adFormat    = options.adFormat  || "card";
    this.signRequests = options.signRequests ?? true;
  }

  // Build signed headers for a request body string
  _headers(bodyStr) {
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
    if (this.signRequests) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const sig = crypto
        .createHmac("sha256", this.apiKey)
        .update(`${timestamp}\n${bodyStr}`)
        .digest("hex");
      headers["X-Prism-Timestamp"] = timestamp;
      headers["X-Prism-Signature"] = `sha256=${sig}`;
    }
    return headers;
  }

  async _post(path, payload) {
    const body = JSON.stringify(payload);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this._headers(body),
      body,
    });
    if (!res.ok) throw new Error(`Prism API error ${res.status} on ${path}`);
    return res.json();
  }

  // Fetch a targeted ad
  async fetchAd(context = {}) {
    const data = await this._post("/api/ads", {
      botId: this.botId,
      context,
      position: this.position,
      format: this.adFormat,
    });
    return data?.data?.[0] ?? null;
  }

  // Format ad for display
  formatAd(ad) {
    if (!ad) return null;
    switch (this.adFormat) {
      case "card":
        return { type: "card", title: ad.title, description: ad.description,
                 cta: ad.ctaText, url: ad.clickUrl, image: ad.imageUrl };
      case "banner":
        return { type: "banner", image: ad.imageUrl, url: ad.clickUrl, alt: ad.title };
      default: // text
        return { type: "text",
                 content: `${ad.title}\n\n${ad.description}\n\n${ad.ctaText}: ${ad.clickUrl}` };
    }
  }

  // Fetch + format in one call
  async displayAd(context = {}) {
    return this.formatAd(await this.fetchAd(context));
  }

  async trackImpression(adId, extra = {}) {
    await this._post("/api/track/impression", { adId, botId: this.botId, ...extra });
  }

  async trackClick(adId, extra = {}) {
    await this._post("/api/track/click", { adId, botId: this.botId, ...extra });
  }
}

// ── Usage ────────────────────────────────────────────────────────────────────
const prismAds = new PrismAds({
  apiKey: process.env.PRISM_API_KEY, // never expose in browser bundles
  botId:  "orgbot_abc123_my-bot_a1b2c3",
  baseUrl: "https://your-prism-server.example.com",
  position: "inline",
  adFormat: "card",
  signRequests: true, // default true — Prism servers require HMAC signing by default
});

// In your chat response handler
async function handleUserMessage(userMessage, userId, messageCount) {
  const response = await generateAIResponse(userMessage);

  // Show an ad every 5 messages
  if (messageCount % 5 === 0) {
    const ad = await prismAds.displayAd({
      topic: detectTopic(userMessage),
      userId,
    });
    if (ad) return [response, ad];
  }

  return [response];
}
```

---

## Framework-Specific Examples

### OpenAI Assistant Integration

```javascript
// For OpenAI Assistants with function calling
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prismAds = new PrismAds({
  apiKey: process.env.PRISM_API_KEY,
  botId: 'orgbot_abc123_my-assistant_a1b2c3',
  baseUrl: 'https://your-prism-server.example.com',
  signRequests: true,
});

// Function to get ad
const functions = [
  {
    name: 'get_prism_ad',
    description: 'Get a relevant advertisement to display in the chat',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The current topic of conversation'
        },
        user_preferences: {
          type: 'string',
          description: 'User preferences if known'
        }
      },
      required: ['topic']
    }
  }
];

async function handleAssistantResponse(userMessage) {
  const completion = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: userMessage }],
    functions: functions,
    function_call: 'auto'
  });
  
  const response = completion.choices[0].message;
  
  // If model wants to call ad function
  if (response.function_call) {
    const args = JSON.parse(response.function_call.arguments);
    const ad = await prismAds.displayAd({
      topic: args.topic,
      context: args.user_preferences
    });
    
    return {
      text: response.content,
      ad: ad
    };
  }
  
  return { text: response.content };
}
```

### Discord Bot Integration

```javascript
// Discord.js bot with Prism ads
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] 
});

const prismAds = new PrismAds({
  apiKey: process.env.PRISM_API_KEY,
  botId: 'orgbot_abc123_discord-bot_a1b2c3',
  baseUrl: 'https://your-prism-server.example.com',
  adFormat: 'card',
  signRequests: true,
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Generate response
  const response = await generateAIResponse(message.content);
  
  // Show ad every 10 messages from user
  const messageCount = await getUserMessageCount(message.author.id);
  
  if (messageCount % 10 === 0) {
    const ad = await prismAds.displayAd({
      topic: detectTopic(message.content),
      user_id: message.author.id
    });
    
    if (ad && ad.type === 'card') {
      const adEmbed = new EmbedBuilder()
        .setTitle(ad.title)
        .setDescription(ad.description)
        .setImage(ad.image)
        .addFields({ name: ad.cta, value: `[Click Here](${ad.url})` })
        .setColor('#0077b6');
      
      await message.reply({ embeds: [response, adEmbed] });
    } else {
      await message.reply(response);
    }
  } else {
    await message.reply(response);
  }
});
```

### Slack Bot Integration

```javascript
// Slack Bot (Bolt framework)
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const prismAds = new PrismAds({
  apiKey: process.env.PRISM_API_KEY,
  botId: 'orgbot_abc123_slack-bot_a1b2c3',
  baseUrl: 'https://your-prism-server.example.com',
  adFormat: 'text',
  signRequests: true,
});

app.message(async ({ message, say }) => {
  // Skip bot messages
  if (message.subtype === 'bot_message') return;
  
  // Generate AI response
  const response = await generateAIResponse(message.text);
  
  // Show ad every 5 messages
  const userMessages = await getChannelMessageCount(message.channel);
  
  if (userMessages % 5 === 0) {
    const ad = await prismAds.displayAd({
      topic: detectTopic(message.text)
    });
    
    if (ad) {
      await say({
        text: response,
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: response } },
          { type: 'divider' },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*${ad.title}*\n${ad.description}` },
            accessory: {
              type: 'button',
              text: { type: 'plain_text', text: ad.cta },
              url: ad.url
            }
          }
        ]
      });
    } else {
      await say(response);
    }
  } else {
    await say(response);
  }
});
```

### Telegram Bot Integration

```javascript
// Telegram Bot (node-telegram-bot-api)
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const prismAds = new PrismAds({
  apiKey: process.env.PRISM_API_KEY,
  botId: 'orgbot_abc123_telegram-bot_a1b2c3',
  baseUrl: 'https://your-prism-server.example.com',
  adFormat: 'text',
  signRequests: true,
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  
  // Skip bot messages
  if (msg.from.is_bot) return;
  
  // Generate response
  const response = await generateAIResponse(msg.text);
  
  // Show ad every 5 messages
  const messageCount = await getUserMessageCount(chatId);
  
  if (messageCount % 5 === 0) {
    const ad = await prismAds.displayAd({
      topic: detectTopic(msg.text)
    });
    
    if (ad) {
      const adText = `\n\n━━━━━━━━━━━━━━━━━━━━\n*${ad.title}*\n${ad.description}\n\n[${ad.cta}](${ad.url})`;
      bot.sendMessage(chatId, response + adText, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, response);
    }
  } else {
    bot.sendMessage(chatId, response);
  }
});
```

---

## Server-Side Integration

### Node.js API Middleware

The SDK key must only be used server-side. Never expose it in a browser bundle.

```javascript
// Express middleware — proxies ad fetching so the SDK key stays on your server
const express = require('express');
const app = express();

// PrismAds class defined above
const prismAds = new PrismAds({
  apiKey: process.env.PRISM_API_KEY,   // server-side only
  botId:  process.env.PRISM_BOT_ID,
  baseUrl: 'https://your-prism-server.example.com',
  adFormat: 'card',
  signRequests: true,
});

// Your app fetches an ad through this server-side proxy
app.get('/internal/ad', async (req, res) => {
  const { topic, userId } = req.query;
  try {
    const ad = await prismAds.fetchAd({ topic: topic || 'general', userId });
    if (ad) await prismAds.trackImpression(ad.id, { userId });
    res.json({ ad });
  } catch {
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

// Proxy click tracking (keeps the SDK key off the client)
app.post('/internal/ad/click', express.json(), async (req, res) => {
  const { adId, userId } = req.body;
  await prismAds.trackClick(adId, { userId });
  res.json({ ok: true });
});

app.listen(3000);
```

---

## React/Web Component

Fetch ads through your own server-side proxy (see Node.js middleware above) so the SDK key is never in the browser bundle.

```tsx
import { useState, useEffect } from 'react';

interface AdData {
  id: string; title: string; description: string;
  ctaText: string; clickUrl: string; imageUrl?: string;
}

interface PrismAdProps {
  topic?: string;
  userId?: string;
}

// Calls your server-side proxy, not the Prism API directly
export function PrismAd({ topic, userId }: PrismAdProps) {
  const [ad, setAd] = useState<AdData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (topic)  params.set('topic', topic);
    if (userId) params.set('userId', userId);
    fetch(`/internal/ad?${params}`)
      .then((r) => r.json())
      .then((data) => setAd(data.ad ?? null))
      .catch(() => {});
  }, [topic, userId]);

  if (!ad) return null;

  const trackClick = () =>
    fetch('/internal/ad/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, userId }),
    });

  return (
    <div className="prism-ad" data-ad-id={ad.id}>
      <h4 className="ad-title">{ad.title}</h4>
      <p className="ad-description">{ad.description}</p>
      <a href={ad.clickUrl} className="ad-cta" target="_blank"
         rel="noopener noreferrer" onClick={trackClick}>
        {ad.ctaText}
      </a>
      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="ad-image" />}
    </div>
  );
}
```

---

## WordPress Plugin

```php
<?php
// WordPress shortcode for Prism ads
function prism_ad_shortcode($atts) {
  $atts = shortcode_atts([
    'position' => 'inline',
    'topic' => '',
    'format' => 'text'
  ], $atts);
  
  $api_key   = get_option('prism_api_key');
  $bot_id    = get_option('prism_bot_id');
  $base_url  = get_option('prism_base_url'); // e.g. https://your-prism-server.example.com

  $response = wp_remote_post(trailingslashit($base_url) . 'api/ads', [
    'headers' => [
      'Authorization' => 'Bearer ' . $api_key,
      'Content-Type' => 'application/json'
    ],
    'body' => json_encode([
      'bot_id' => $bot_id,
      'position' => $atts['position'],
      'topic' => $atts['topic'],
      'format' => $atts['format']
    ])
  ]);
  
  if (is_wp_error($response)) {
    return '';
  }
  
  $ad = json_decode(wp_remote_retrieve_body($response), true);
  
  if (!$ad) {
    return '';
  }
  
  return sprintf(
    '<div class="prism-ad">
      <strong>%s</strong>
      <p>%s</p>
      <a href="%s" target="_blank">%s</a>
    </div>',
    esc_html($ad['title']),
    esc_html($ad['description']),
    esc_url($ad['click_url']),
    esc_html($ad['cta_text'])
  );
}

add_shortcode('prism_ad', 'prism_ad_shortcode');
```

---

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `apiKey` | string | SDK key from publisher portal (`bgsk_…`) — **never expose in browser** | Required |
| `botId` | string | Bot `publicId` shown on the portal bot list | Required |
| `baseUrl` | string | Base URL of your Prism API server (no trailing slash) | `""` |
| `position` | string | Ad placement: `inline` / `sidebar` / `floating` | `inline` |
| `adFormat` | string | Format: `text` / `card` / `banner` | `card` |
| `signRequests` | boolean | Send `X-Prism-Timestamp` + `X-Prism-Signature` headers. HMAC is **on by default** on Prism servers — always leave this `true` in production. | `true` |

---

## Best Practices

1. **Don't overdo it** - Show ads every 5-10 messages, not every message
2. **Be transparent** - Let users know they're seeing ads
3. **Match the tone** - Use the ad format that fits your bot's personality
4. **Track everything** - Impressions and clicks help optimize
5. **Test different positions** - Find what works best for your audience
6. **Respect user privacy** - Don't collect more data than needed

---

*For more integration examples, visit the Prism developer docs or contact support.*
