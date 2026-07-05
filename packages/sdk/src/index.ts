/**
 * Prism Ad Network SDK
 * 
 * A JavaScript SDK for integrating ads into AI chatbots
 * 
 * @package @prismpublication/sdk
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// ============================================
// Types
// ============================================

export interface PrismConfig {
  /** Your Prism API key */
  apiKey: string;
  /** Your bot's unique identifier */
  botId: string;
  /** Ad placement position */
  position?: 'inline' | 'sidebar' | 'floating';
  /** Ad format type */
  adFormat?: 'text' | 'card' | 'banner';
  /** Base API URL (optional, for self-hosted) */
  baseUrl?: string;
  /**
   * Send HMAC request signatures (X-Prism-Timestamp + X-Prism-Signature).
   * Default `true` — required by Prism servers (REQUIRE_SDK_HMAC defaults to on).
   * Set `false` only during a migration window against a server that has signing disabled.
   */
  signRequests?: boolean;
}

/** Live Prism backend (Supabase Edge Functions). Override via `baseUrl` for self-hosted. */
const DEFAULT_BASE_URL = 'https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api';

/**
 * HMAC-SHA256 hex digest using Web Crypto (available in browsers and Node 20+).
 * Must match the server's `verifyHmac` which signs `<timestamp>\n<rawBody>`.
 */
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Prism: Web Crypto (crypto.subtle) is unavailable; cannot sign requests');
  }
  const key = await subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface AdContext {
  /** Topic for targeted ads */
  topic?: string;
  /** User ID for tracking */
  userId?: string;
  /** Additional context data */
  [key: string]: unknown;
}

export interface Ad {
  /** Unique ad ID */
  id: string;
  /** Ad title */
  title: string;
  /** Ad description */
  description: string;
  /** CTA button text */
  ctaText: string;
  /** Click-through URL */
  clickUrl: string;
  /** Image URL (for card/banner formats) */
  imageUrl?: string;
  /** Advertiser name */
  advertiser: string;
  /** Category/tags */
  tags?: string[];
}

export interface AdRequest {
  botId: string;
  context: AdContext;
  position: string;
  format: string;
}

export interface TrackEventRequest {
  adId: string;
  botId: string;
  userId?: string;
  /** Revenue amount in cents (revenue events only). */
  amount?: number;
  /** Optional topic the ad was shown against. */
  topic?: string;
  /** Arbitrary structured metadata, stored as JSON server-side. */
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Main SDK Class
// ============================================

export class PrismAds {
  private apiKey: string;
  private botId: string;
  private position: 'inline' | 'sidebar' | 'floating';
  private adFormat: 'text' | 'card' | 'banner';
  private signRequests: boolean;
  private client: AxiosInstance;
  private messageCount: Map<string, number> = new Map();

  /**
   * Create a new PrismAds instance
   * @param config - Configuration options
   */
  constructor(config: PrismConfig) {
    if (!config.apiKey) {
      throw new Error('Prism: API key is required');
    }
    if (!config.botId) {
      throw new Error('Prism: Bot ID is required');
    }

    this.apiKey = config.apiKey;
    this.botId = config.botId;
    this.position = config.position || 'inline';
    this.adFormat = config.adFormat || 'text';
    this.signRequests = config.signRequests !== false;

    // Initialize axios client
    this.client = axios.create({
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Bot-ID': this.botId,
      },
      timeout: 10000,
    });
  }

  /**
   * POST a JSON body, signing the exact serialized bytes with HMAC when enabled.
   * Sends the pre-serialized string so the signed payload matches what the server verifies.
   */
  private async postSigned<T = unknown>(path: string, body: unknown): Promise<{ data: T }> {
    const bodyStr = JSON.stringify(body ?? {});
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.signRequests) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = await hmacSha256Hex(this.apiKey, `${timestamp}\n${bodyStr}`);
      headers['X-Prism-Timestamp'] = timestamp;
      headers['X-Prism-Signature'] = `sha256=${signature}`;
    }
    // Pass the already-serialized string; axios leaves string bodies untouched, so the
    // signed bytes are exactly what is transmitted.
    return this.client.post<T>(path, bodyStr, {
      headers,
      transformRequest: [(d) => d],
    });
  }

  /**
   * Fetch ads from the Prism network
   * @param context - Context for ad targeting
   * @returns Promise resolving to array of ads
   */
  async fetchAds(context: AdContext = {}): Promise<Ad[]> {
    try {
      const request: AdRequest = {
        botId: this.botId,
        context,
        position: this.position,
        format: this.adFormat,
      };

      const response = await this.postSigned<ApiResponse<Ad[]>>('/ads', request);

      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      console.warn('Prism: No ads available');
      return [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Prism: Invalid API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Prism: Rate limit exceeded');
        }
      }
      console.error('Prism: Failed to fetch ads', error);
      return [];
    }
  }

  /**
   * Get a single formatted ad for display
   * @param context - Context for ad targeting
   * @returns Promise resolving to formatted ad or null
   */
  async displayAd(context: AdContext = {}): Promise<Ad | null> {
    const ads = await this.fetchAds(context);
    return ads.length > 0 ? ads[0] : null;
  }

  /**
   * Format ad for display based on format type
   * @param ad - Raw ad object
   * @returns Formatted ad object
   */
  formatAd(ad: Ad): FormattedAd {
    switch (this.adFormat) {
      case 'card':
        return {
          type: 'card',
          title: ad.title,
          description: ad.description,
          cta: ad.ctaText,
          url: ad.clickUrl,
          image: ad.imageUrl,
          advertiser: ad.advertiser,
        };
      case 'banner':
        return {
          type: 'banner',
          image: ad.imageUrl,
          url: ad.clickUrl,
          alt: ad.title,
        };
      default: // text
        return {
          type: 'text',
          content: `${ad.title}\n\n${ad.description}\n\n${ad.ctaText}: ${ad.clickUrl}`,
        };
    }
  }

  /**
   * Track an ad impression
   * @param adId - The ad ID that was displayed
   * @param userId - Optional user ID
   */
  async trackImpression(adId: string, userId?: string): Promise<void> {
    await this.trackEvent('impression', adId, userId);
  }

  /**
   * Track an ad click
   * @param adId - The ad ID that was clicked
   * @param userId - Optional user ID
   */
  async trackClick(adId: string, userId?: string): Promise<void> {
    await this.trackEvent('click', adId, userId);
  }

  /**
   * Track ad revenue
   * @param adId - The ad ID
   * @param amount - Revenue amount in cents
   * @param userId - Optional user ID
   */
  async trackRevenue(adId: string, amount: number, userId?: string): Promise<void> {
    await this.trackEvent('revenue', adId, userId, { amount });
  }

  /**
   * Internal method to track events.
   * `amount` and `topic` are sent as top-level fields (the server schema reads them there);
   * everything else is nested under `metadata` so it is persisted as JSON rather than dropped.
   */
  private async trackEvent(
    eventType: string,
    adId: string,
    userId?: string,
    options?: { amount?: number; topic?: string; metadata?: Record<string, unknown> },
  ): Promise<void> {
    try {
      const event: TrackEventRequest = { adId, botId: this.botId };
      if (userId) event.userId = userId;
      if (options?.amount !== undefined) event.amount = options.amount;
      if (options?.topic !== undefined) event.topic = options.topic;
      if (options?.metadata && Object.keys(options.metadata).length > 0) {
        event.metadata = options.metadata;
      }

      await this.postSigned(`/track/${eventType}`, event);
    } catch (error) {
      console.error(`Prism: Failed to track ${eventType}`, error);
    }
  }

  /**
   * Check if an ad should be shown based on message frequency
   * @param userId - User identifier
   * @param frequency - Show ad every N messages
   * @returns Boolean indicating if ad should be shown
   */
  shouldShowAd(userId: string, frequency: number = 5): boolean {
    const count = this.messageCount.get(userId) || 0;
    const newCount = count + 1;
    this.messageCount.set(userId, newCount);
    return newCount % frequency === 0;
  }

  /**
   * Reset message count for a user
   * @param userId - User identifier
   */
  resetMessageCount(userId: string): void {
    this.messageCount.set(userId, 0);
  }

  /**
   * Get message count for a user
   * @param userId - User identifier
   */
  getMessageCount(userId: string): number {
    return this.messageCount.get(userId) || 0;
  }

  /**
   * Update configuration
   * @param config - New configuration options
   */
  updateConfig(config: Partial<PrismConfig>): void {
    if (config.position) this.position = config.position;
    if (config.adFormat) this.adFormat = config.adFormat;
    if (config.baseUrl) {
      this.client.defaults.baseURL = config.baseUrl;
    }
  }

  /**
   * Get SDK version
   */
  getVersion(): string {
    return '1.0.0';
  }
}

// ============================================
// Formatted Ad Types
// ============================================

export interface FormattedAdText {
  type: 'text';
  content: string;
}

export interface FormattedAdCard {
  type: 'card';
  title: string;
  description: string;
  cta: string;
  url: string;
  image?: string;
  advertiser: string;
}

export interface FormattedAdBanner {
  type: 'banner';
  image?: string;
  url: string;
  alt: string;
}

export type FormattedAd = FormattedAdText | FormattedAdCard | FormattedAdBanner;

// ============================================
// React Hook (Optional)
// ============================================

export interface UsePrismAdOptions {
  apiKey: string;
  botId: string;
  position?: 'inline' | 'sidebar' | 'floating';
  adFormat?: 'text' | 'card' | 'banner';
  topic?: string;
  userId?: string;
  frequency?: number;
}

// Re-export for convenience
export default PrismAds;
