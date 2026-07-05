/**
 * Prism React Hook
 * 
 * React hooks for integrating Prism ads into React applications
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PrismAds, type PrismConfig, type Ad, type FormattedAd } from './index';

// Re-export types
export type { PrismConfig, Ad, FormattedAd };

export interface UsePrismAdOptions extends PrismConfig {
  /** Topic for ad targeting */
  topic?: string;
  /** User ID for tracking */
  userId?: string;
  /** Show ad every N messages */
  frequency?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

/**
 * React hook for displaying ads in React applications
 * 
 * @example
 * ```tsx
 * const { ad, loading, error, refresh } = usePrismAd({
 *   apiKey: 'your-api-key',
 *   botId: 'your-bot-id',
 *   topic: 'technology',
 *   userId: 'user-123',
 *   frequency: 5
 * });
 * 
 * return (
 *   <div>
 *     {loading && <p>Loading ad...</p>}
 *     {ad && (
 *       <div className="ad-card">
 *         <h3>{ad.title}</h3>
 *         <p>{ad.description}</p>
 *         <a href={ad.clickUrl}>{ad.ctaText}</a>
 *       </div>
 *     )}
 *   </div>
 * );
 * ```
 */
export function usePrismAd(options: UsePrismAdOptions) {
  const {
    apiKey,
    botId,
    position = 'inline',
    adFormat = 'text',
    baseUrl,
    signRequests,
    topic,
    userId,
    frequency = 5,
    autoFetch = false,
  } = options;

  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const sdk = useMemo(() => {
    return new PrismAds({ apiKey, botId, position, adFormat, baseUrl, signRequests });
  }, [apiKey, botId, position, adFormat, baseUrl, signRequests]);

  useEffect(() => {
    setAd(null);
    setError(null);
  }, [sdk]);

  const fetchAd = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if we should show an ad based on frequency
      if (userId && !sdk.shouldShowAd(userId, frequency)) {
        setLoading(false);
        return;
      }

      const fetchedAd = await sdk.displayAd({ topic, userId });
      
      if (fetchedAd) {
        setAd(fetchedAd);
        // Track impression
        await sdk.trackImpression(fetchedAd.id, userId);
      } else {
        setAd(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch ad';
      setError(message);
      console.error('Prism: Error fetching ad:', err);
    } finally {
      setLoading(false);
    }
  }, [sdk, topic, userId, frequency]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchAd();
    }
  }, [autoFetch, fetchAd]);

  // Format the ad based on the current format
  const formattedAd: FormattedAd | null = ad ? sdk.formatAd(ad) : null;

  return {
    /** The fetched ad object */
    ad,
    /** Formatted ad ready for display */
    formattedAd,
    /** Whether the ad is loading */
    loading,
    /** Error message if fetch failed */
    error,
    /** Function to manually fetch a new ad */
    refresh: fetchAd,
    /** Message count for the current user */
    messageCount: userId ? sdk.getMessageCount(userId) : 0,
    /** Reset message count for the user */
    resetCount: userId ? () => sdk.resetMessageCount(userId) : undefined,
  };
}

/**
 * React component for displaying Prism ads
 * 
 * @example
 * ```tsx
 * import { PrismAd } from '@prismpublication/sdk';
 * 
 * function ChatApp() {
 *   return (
 *     <div>
 *       <PrismAd
 *         apiKey="your-api-key"
 *         botId="your-bot-id"
 *         topic="technology"
 *         userId="user-123"
 *         frequency={5}
 *         onAdClick={(ad) => console.log('Ad clicked:', ad)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export interface PrismAdProps {
  /** Your Prism API key */
  apiKey: string;
  /** Your bot's unique identifier */
  botId: string;
  /** Ad placement position */
  position?: 'inline' | 'sidebar' | 'floating';
  /** Ad format type */
  adFormat?: 'text' | 'card' | 'banner';
  /** Base API URL */
  baseUrl?: string;
  /** Send HMAC request signatures (default true). Set false only against a server with signing disabled. */
  signRequests?: boolean;
  /** Topic for ad targeting */
  topic?: string;
  /** User ID for tracking */
  userId?: string;
  /** Show ad every N messages */
  frequency?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Render function for custom display */
  render?: (ad: FormattedAd) => React.ReactNode;
  /** Callback when ad is clicked */
  onAdClick?: (ad: Ad) => void;
  /** Callback when ad is displayed */
  onAdDisplay?: (ad: Ad) => void;
  /** Loading component */
  loadingComponent?: React.ReactNode;
  /** Component to render when no ad is available */
  emptyComponent?: React.ReactNode;
  /** CSS class name */
  className?: string;
}

export function PrismAdComponent({
  apiKey,
  botId,
  position = 'inline',
  adFormat = 'text',
  baseUrl,
  signRequests,
  topic,
  userId,
  frequency = 5,
  autoFetch = true,
  render,
  onAdClick,
  onAdDisplay,
  loadingComponent,
  emptyComponent,
  className,
}: PrismAdProps) {
  const { ad, formattedAd, loading, error } = usePrismAd({
    apiKey,
    botId,
    position,
    adFormat,
    baseUrl,
    signRequests,
    topic,
    userId,
    frequency,
    autoFetch,
  });

  const handleClick = () => {
    if (ad && onAdClick) {
      onAdClick(ad);
    }
  };

  useEffect(() => {
    if (ad && onAdDisplay) {
      onAdDisplay(ad);
    }
  }, [ad, onAdDisplay]);

  // Show loading state
  if (loading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className={`prism-ad-loading ${className || ''}`}>
        Loading advertisement...
      </div>
    );
  }

  // Show error state
  if (error || !formattedAd) {
    return emptyComponent ? (
      <>{emptyComponent}</>
    ) : null;
  }

  // Custom render function
  if (render) {
    return <>{render(formattedAd)}</>;
  }

  // Default rendering based on format
  const defaultRender = () => {
    switch (formattedAd.type) {
      case 'card':
        return (
          <div 
            className={`prism-ad-card ${className || ''}`}
            onClick={handleClick}
            style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', margin: '8px 0' }}
          >
            {formattedAd.image && (
              <img 
                src={formattedAd.image} 
                alt={formattedAd.title}
                style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }}
              />
            )}
            <h4 style={{ margin: '0 0 8px 0' }}>{formattedAd.title}</h4>
            <p style={{ margin: '0 0 12px 0', color: '#666' }}>{formattedAd.description}</p>
            <a 
              href={formattedAd.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              style={{ 
                display: 'inline-block', 
                padding: '8px 16px', 
                background: '#0077b6', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              {formattedAd.cta}
            </a>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Sponsored by {formattedAd.advertiser}
            </p>
          </div>
        );

      case 'banner':
        return (
          <a 
            href={formattedAd.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`prism-ad-banner ${className || ''}`}
          >
            {formattedAd.image && (
              <img 
                src={formattedAd.image} 
                alt={formattedAd.alt}
                style={{ width: '100%' }}
              />
            )}
          </a>
        );

      default: // text
        return (
          <div 
            className={`prism-ad-text ${className || ''}`}
            onClick={handleClick}
            style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', margin: '8px 0' }}
          >
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {formattedAd.content}
            </pre>
          </div>
        );
    }
  };

  return defaultRender();
}

// Named exports
export { PrismAds };
export default PrismAds;
