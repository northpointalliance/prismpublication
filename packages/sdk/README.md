# @botgrid/sdk

BotGrid Ad Network SDK for AI Chatbots - Integrate ads into your AI and start monetizing!

## Installation

```bash
npm install @botgrid/sdk
```

## Quick Start

```javascript
import { BotGridAds } from '@botgrid/sdk';

// Initialize the SDK
const botGrid = new BotGridAds({
  apiKey: 'YOUR_API_KEY',
  botId: 'your-bot-id',
  position: 'inline',
  adFormat: 'text'
});

// Fetch and display an ad
async function handleUserMessage(userMessage) {
  const response = await generateAIResponse(userMessage);
  
  // Show ad every 5 messages
  if (botGrid.shouldShowAd(userId, 5)) {
    const ad = await botGrid.displayAd({
      topic: detectTopic(userMessage),
      userId: userId
    });
    
    if (ad) {
      // Track impression
      botGrid.trackImpression(ad.id, userId);
      return [response, ad];
    }
  }
  
  return [response];
}
```

## React Integration

```tsx
import { BotGridAdComponent, useBotGridAd } from '@botgrid/sdk/react';

// Using the hook
function ChatMessage() {
  const { ad, loading, refresh } = useBotGridAd({
    apiKey: 'YOUR_API_KEY',
    botId: 'your-bot-id',
    baseUrl: 'http://localhost:8787/api',
    topic: 'technology',
    userId: 'user-123',
    frequency: 5
  });

  if (loading) return <div>Loading ad...</div>;
  if (!ad) return null;

  return (
    <div>
      <h3>{ad.title}</h3>
      <p>{ad.description}</p>
      <a href={ad.clickUrl}>{ad.ctaText}</a>
    </div>
  );
}

// Using the component
function App() {
  return (
    <BotGridAdComponent
      apiKey="YOUR_API_KEY"
      botId="your-bot-id"
      baseUrl="http://localhost:8787/api"
      topic="tech"
      userId="user-123"
      frequency={5}
    />
  );
}
```

## API Reference

### BotGridAds Class

```typescript
new BotGridAds(config: BotGridConfig)
```

#### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | string | Yes | Your BotGrid API key |
| `botId` | string | Yes | Your bot's unique ID |
| `position` | string | No | Ad placement: 'inline', 'sidebar', 'floating' |
| `adFormat` | string | No | Format: 'text', 'card', 'banner' |
| `baseUrl` | string | No | Custom API URL for self-hosted |

#### Methods

##### fetchAds(context?: AdContext): Promise<Ad[]>
Fetch multiple ads with targeting context.

##### displayAd(context?: AdContext): Promise<Ad | null>
Get a single ad for display.

##### formatAd(ad: Ad): FormattedAd
Format an ad based on the configured format type.

##### trackImpression(adId: string, userId?: string): Promise<void>
Track when an ad is displayed.

##### trackClick(adId: string, userId?: string): Promise<void>
Track when an ad is clicked.

##### trackRevenue(adId: string, amount: number, userId?: string): Promise<void>
Track ad revenue (in cents).

##### shouldShowAd(userId: string, frequency?: number): boolean
Check if an ad should be shown based on message frequency.

##### resetMessageCount(userId: string): void
Reset the message counter for a user.

##### getMessageCount(userId: string): number
Get the current message count for a user.

### Types

```typescript
interface Ad {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  imageUrl?: string;
  advertiser: string;
  tags?: string[];
}

interface AdContext {
  topic?: string;
  userId?: string;
  [key: string]: any;
}
```

## Examples

### Discord Bot

```javascript
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.MessageContent] });

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'discord-bot',
  adFormat: 'card'
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const response = await generateAIResponse(message.content);
  
  if (botGrid.shouldShowAd(message.author.id, 10)) {
    const ad = await botGrid.displayAd({ topic: 'general' });
    
    if (ad) {
      const embed = new EmbedBuilder()
        .setTitle(ad.title)
        .setDescription(ad.description)
        .addFields({ name: ad.ctaText, value: ad.clickUrl });
      
      await message.reply({ embeds: [embed] });
      await botGrid.trackImpression(ad.id, message.author.id);
    }
  }
});
```

### Telegram Bot

```javascript
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

const botGrid = new BotGridAds({
  apiKey: process.env.BOTGRID_API_KEY,
  botId: 'telegram-bot'
});

bot.on('message', async (msg) => {
  if (msg.from.is_bot) return;
  
  const response = await generateAIResponse(msg.text);
  
  if (botGrid.shouldShowAd(msg.from.id, 5)) {
    const ad = await botGrid.displayAd();
    
    if (ad) {
      const adText = `\n\n━━━ Sponsored ━━━\n${ad.title}\n${ad.description}\n${ad.ctaText}: ${ad.clickUrl}`;
      bot.sendMessage(msg.chat.id, response + adText);
      await botGrid.trackImpression(ad.id, msg.from.id);
    }
  }
});
```

## License

MIT
