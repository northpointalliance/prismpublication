# BotGrid Ad Integration Examples

This document provides code snippets for integrating BotGrid ads into your AI chatbot or conversational AI.

## Basic Integration

### JavaScript/TypeScript SDK

```javascript
// BotGrid Ad SDK
class BotGridAds {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.botId = options.botId;
    this.position = options.position || 'inline'; // 'inline', 'sidebar', 'floating'
    this.adFormat = options.adFormat || 'text'; // 'text', 'card', 'banner'
  }

  // Fetch ads from BotGrid network
  async fetchAds(context = {}) {
    const response = await fetch('https://api.botgrid.io/v1/ads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        bot_id: this.botId,
        context: context,
        position: this.position,
        format: this.adFormat
      })
    });
    
    return response.json();
  }

  // Display ad in chat
  async displayAd(context = {}) {
    const ad = await this.fetchAds(context);
    
    if (!ad || ad.length === 0) {
      return null; // No ads available
    }
    
    return this.formatAd(ad[0]);
  }

  // Format ad based on type
  formatAd(ad) {
    switch (this.adFormat) {
      case 'card':
        return {
          type: 'card',
          title: ad.title,
          description: ad.description,
          cta: ad.cta_text,
          url: ad.click_url,
          image: ad.image_url
        };
      case 'banner':
        return {
          type: 'banner',
          image: ad.image_url,
          url: ad.click_url,
          alt: ad.title
        };
      default: // text
        return {
          type: 'text',
          content: `${ad.title}\n\n${ad.description}\n\n${ad.cta_text}: ${ad.click_url}`
        };
    }
  }

  // Track ad impression
  async trackImpression(adId) {
    await fetch('https://api.botgrid.io/v1/track/impression', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ ad_id: adId })
    });
  }

  // Track ad click
  async trackClick(adId) {
    await fetch('https://api.botgrid.io/v1/track/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ ad_id: adId })
    });
  }
}

// Usage Example
const botGrid = new BotGridAds({
  apiKey: 'YOUR_API_KEY',
  botId: 'your-bot-id',
  position: 'inline',
  adFormat: 'text'
});

// In your chat response handler
async function handleUserMessage(userMessage) {
  const response = await generateAIResponse(userMessage);
  
  // Display ad every N messages
  if (messageCount % 5 === 0) {
    const ad = await botGrid.displayAd({ 
      topic: detectTopic(userMessage),
      user_id: userId 
    });
    
    if (ad) {
      return [response, ad];
    }
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

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'my-assistant-bot'
});

// Function to get ad
const functions = [
  {
    name: 'get_botgrid_ad',
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
    const ad = await botGrid.displayAd({
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
// Discord.js bot with BotGrid ads
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent] 
});

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'discord-bot-id',
  adFormat: 'card'
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  // Generate response
  const response = await generateAIResponse(message.content);
  
  // Show ad every 10 messages from user
  const messageCount = await getUserMessageCount(message.author.id);
  
  if (messageCount % 10 === 0) {
    const ad = await botGrid.displayAd({
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

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'slack-bot-id',
  adFormat: 'text'
});

app.message(async ({ message, say }) => {
  // Skip bot messages
  if (message.subtype === 'bot_message') return;
  
  // Generate AI response
  const response = await generateAIResponse(message.text);
  
  // Show ad every 5 messages
  const userMessages = await getChannelMessageCount(message.channel);
  
  if (userMessages % 5 === 0) {
    const ad = await botGrid.displayAd({
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

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'telegram-bot-id',
  adFormat: 'text'
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
    const ad = await botGrid.displayAd({
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

```javascript
// Express middleware for websites
const express = require('express');
const app = express();

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'my-website-bot',
  adFormat: 'card'
});

// API endpoint for fetching ads
app.get('/api/ad', async (req, res) => {
  const { topic, user_id, placement } = req.query;
  
  try {
    const ad = await botGrid.displayAd({
      topic: topic || 'general',
      user_id: user_id,
      position: placement
    });
    
    // Track impression
    if (ad) {
      await botGrid.trackImpression(ad.id);
    }
    
    res.json({ ad });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

// Click tracking endpoint
app.post('/api/ad/click', async (req, res) => {
  const { ad_id, user_id } = req.body;
  
  await botGrid.trackClick(ad_id);
  
  // Redirect to ad URL
  const ad = await botGrid.getAd(ad_id);
  res.redirect(ad.click_url);
});

app.listen(3000);
```

---

## React/Web Component

```tsx
// React component for web integration
import { useState, useEffect } from 'react';

interface BotGridAdProps {
  apiKey: string;
  botId: string;
  position?: 'inline' | 'sidebar' | 'floating';
  topic?: string;
}

export function BotGridAd({ apiKey, botId, position = 'inline', topic }: BotGridAdProps) {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAd() {
      try {
        const response = await fetch('https://api.botgrid.io/v1/ads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            bot_id: botId,
            position,
            topic
          })
        });
        
        const data = await response.json();
        setAd(data[0]);
      } catch (error) {
        console.error('Failed to fetch ad:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAd();
  }, [apiKey, botId, position, topic]);

  if (loading) {
    return <div className="ad-loading">Loading ad...</div>;
  }

  if (!ad) {
    return null;
  }

  return (
    <div className="botgrid-ad" data-ad-id={ad.id}>
      <div className="ad-content">
        <h4 className="ad-title">{ad.title}</h4>
        <p className="ad-description">{ad.description}</p>
        <a 
          href={ad.click_url} 
          className="ad-cta"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            // Track click
            fetch('https://api.botgrid.io/v1/track/click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ad_id: ad.id })
            });
          }}
        >
          {ad.cta_text}
        </a>
      </div>
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} className="ad-image" />
      )}
    </div>
  );
}
```

---

## WordPress Plugin

```php
<?php
// WordPress shortcode for BotGrid ads
function botgrid_ad_shortcode($atts) {
  $atts = shortcode_atts([
    'position' => 'inline',
    'topic' => '',
    'format' => 'text'
  ], $atts);
  
  $api_key = get_option('botgrid_api_key');
  $bot_id = get_option('botgrid_bot_id');
  
  $response = wp_remote_post('https://api.botgrid.io/v1/ads', [
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
    '<div class="botgrid-ad">
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

add_shortcode('botgrid_ad', 'botgrid_ad_shortcode');
```

---

## Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `apiKey` | string | Your BotGrid API key | Required |
| `botId` | string | Your bot's unique ID | Required |
| `position` | string | Ad placement: 'inline', 'sidebar', 'floating' | 'inline' |
| `adFormat` | string | Format: 'text', 'card', 'banner' | 'text' |
| `topic` | string | Context topic for targeted ads | 'general' |
| `userId` | string | User ID for tracking | null |

---

## Best Practices

1. **Don't overdo it** - Show ads every 5-10 messages, not every message
2. **Be transparent** - Let users know they're seeing ads
3. **Match the tone** - Use the ad format that fits your bot's personality
4. **Track everything** - Impressions and clicks help optimize
5. **Test different positions** - Find what works best for your audience
6. **Respect user privacy** - Don't collect more data than needed

---

*For more integration examples, visit the BotGrid developer docs or contact support.*
