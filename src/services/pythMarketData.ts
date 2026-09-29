/**
 * Valtics Pyth Market Data Service
 * 
 * ARCHITECTURE DIRECTIVE:
 * The blockchain/network environment of Valtics (Solana Devnet/Testnet)
 * and the market-data source (Pyth Network verified oracle feeds)
 * are COMPLETELY INDEPENDENT.
 * 
 * - Valtics devnet contracts, testnet tokens, simulated prices, and mock values
 *   are NEVER used as the source of asset market prices.
 * - For all tokenized equities, indices, commodities, and crypto assets,
 *   the underlying market price is derived exclusively from verified Pyth feeds.
 * - If a Pyth feed value is unavailable or unsupported, an explicit state ('—') is displayed.
 *   Values are NEVER fabricated or guessed.
 * - API keys are kept strictly server-side; client calls proxy endpoints.
 */

export interface PythMarketHours {
  isOpen: boolean;
  nextOpen: number | null;
  nextClose: number | null;
}

export interface VerifiedPythFeedMetadata {
  id: string; // 64-char hex Pyth feed ID
  symbol: string; // e.g. "Equity.US.AAPL/USD"
  displaySymbol: string; // e.g. "AAPL"
  description: string; // e.g. "APPLE INC / US DOLLAR"
  assetType: 'Equity' | 'Index' | 'Crypto' | 'Metal' | 'FX' | 'Other';
  minChannel?: string;
  marketHours: PythMarketHours;
  schedule?: string;
}

export interface PythRealPriceResult {
  price: number | null;
  confidence: number | null;
  feedUpdateTimestamp: number | null; // Unix timestamp in seconds
  change24hPct: number | null;
  status: 'ok' | 'unsupported' | 'unavailable' | 'loading' | 'error';
  pythSymbol?: string;
  feedId?: string;
  marketSession: {
    isOpen: boolean;
    statusText: string;
    isCarriedForward: boolean;
    nextOpenTimestamp?: number | null;
  };
  source: 'Pyth Hermes API' | 'Pyth Oracle' | 'Pyth API Server' | 'Unavailable';
  isAvailable: boolean;
  reason?: string;
}

// Memory cache for feed resolution & prices
const feedMetadataCache = new Map<string, { data: VerifiedPythFeedMetadata; timestamp: number }>();
const priceResultCache = new Map<string, { data: PythRealPriceResult; timestamp: number }>();
const CACHE_TTL_MS = 6000; // 6 seconds

/**
 * Normalizes an asset symbol or name to extract the underlying asset code
 */
export function identifyUnderlyingSymbol(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // If already a 64-char hex feed ID
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return trimmed;
  }

  // Remove common prefixes/suffixes: e.g. "Crypto.SOL/USD" -> "SOL", "Equity.US.AAPL/USD" -> "AAPL"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const left = parts[0];
    const subParts = left.split('.');
    return subParts[subParts.length - 1].toUpperCase();
  }

  // Handle standard stock/crypto symbols
  const clean = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  // Strip USD/USDT suffix if long enough
  if (clean.endsWith('USD') && clean.length > 4) {
    return clean.slice(0, -3);
  }
  return clean;
}

/**
 * Resolves a verified Pyth feed definition via server proxy or public Hermes
 */
export async function resolveVerifiedPythFeed(
  symbolOrId: string
): Promise<VerifiedPythFeedMetadata | null> {
  const query = identifyUnderlyingSymbol(symbolOrId);
  if (!query) return null;

  const now = Date.now();
  const cached = feedMetadataCache.get(query);
  if (cached && now - cached.timestamp < CACHE_TTL_MS * 6) {
    return cached.data;
  }

  // 1. Try server proxy endpoint first
  try {
    const res = await fetch(`/api/pyth/resolve?symbol=${encodeURIComponent(query)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.found && json.feed) {
        const feed = json.feed;
        let assetType: VerifiedPythFeedMetadata['assetType'] = 'Other';
        const rawType = (feed.assetType || '').toLowerCase();
        if (rawType.includes('equity')) assetType = 'Equity';
        else if (rawType.includes('crypto')) assetType = 'Crypto';
        else if (rawType.includes('metal')) assetType = 'Metal';
        else if (rawType.includes('fx')) assetType = 'FX';
        else if (rawType.includes('index')) assetType = 'Index';

        const result: VerifiedPythFeedMetadata = {
          id: feed.id,
          symbol: feed.symbol,
          displaySymbol: feed.displaySymbol,
          description: feed.description,
          assetType,
          minChannel: feed.minChannel,
          marketHours: {
            isOpen: feed.marketHours?.is_open ?? true,
            nextOpen: feed.marketHours?.next_open ?? null,
            nextClose: feed.marketHours?.next_close ?? null,
          },
          schedule: feed.schedule,
        };

        feedMetadataCache.set(query, { data: result, timestamp: now });
        feedMetadataCache.set(result.id, { data: result, timestamp: now });
        return result;
      }
    }
  } catch {
    // Fall back to direct Hermes query if server proxy is unavailable
  }

  // 2. Direct Hermes query fallback
  try {
    const res = await fetch(`https://hermes.pyth.network/v2/price_feeds?query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return null;

    const match =
      items.find(
        (it: any) =>
          it.id === query ||
          (it.attributes?.display_symbol || '').toUpperCase() === query.toUpperCase() ||
          (it.attributes?.symbol || '').toUpperCase().includes(query.toUpperCase())
      ) || items[0];

    let assetType: VerifiedPythFeedMetadata['assetType'] = 'Other';
    const rawType = (match.attributes?.asset_type || '').toLowerCase();
    if (rawType.includes('equity')) assetType = 'Equity';
    else if (rawType.includes('crypto')) assetType = 'Crypto';
    else if (rawType.includes('metal')) assetType = 'Metal';
    else if (rawType.includes('fx')) assetType = 'FX';
    else if (rawType.includes('index')) assetType = 'Index';

    const result: VerifiedPythFeedMetadata = {
      id: match.id,
      symbol: match.attributes?.symbol || query,
      displaySymbol: match.attributes?.display_symbol || query,
      description: match.attributes?.description || query,
      assetType,
      minChannel: match.attributes?.min_channel,
      marketHours: {
        isOpen: match.market_hours?.is_open ?? true,
        nextOpen: match.market_hours?.next_open ?? null,
        nextClose: match.market_hours?.next_close ?? null,
      },
      schedule: match.attributes?.schedule,
    };

    feedMetadataCache.set(query, { data: result, timestamp: now });
    feedMetadataCache.set(result.id, { data: result, timestamp: now });
    return result;
  } catch (err) {
    console.warn('Pyth feed metadata resolution failed:', err);
    return null;
  }
}

/**
 * Retrieves the real available Pyth price for an underlying asset.
 * Guarantees:
 * - Real Pyth source only via backend proxy.
 * - Never returns devnet or simulated prices.
 * - Properly reports unsupported, unavailable, or live states.
 */
export async function getRealPythMarketPrice(
  feedIdOrSymbol: string
): Promise<PythRealPriceResult> {
  const normalized = identifyUnderlyingSymbol(feedIdOrSymbol);
  const now = Date.now();

  const cached = priceResultCache.get(normalized);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Resolve feed metadata first
  const feedMeta = await resolveVerifiedPythFeed(normalized);
  const isOpen = feedMeta ? feedMeta.marketHours.isOpen : true;
  const nextOpen = feedMeta?.marketHours.nextOpen ?? null;
  const feedId = feedMeta?.id || (normalized.length === 64 ? normalized : null);
  const pythSymbol = feedMeta?.symbol || normalized;

  // 2. Fetch through server proxy
  try {
    const queryParam = feedId ? `id=${feedId}` : `symbol=${encodeURIComponent(normalized)}`;
    const res = await fetch(`/api/pyth/price?${queryParam}`);
    
    if (res.ok) {
      const data = await res.json();

      if (data.status === 'ok' && data.price !== null && data.price > 0) {
        const publishSec = data.publishTime || Math.floor(now / 1000);
        const statusText = formatMarketSessionStatus(isOpen, publishSec, nextOpen);

        const result: PythRealPriceResult = {
          price: data.price,
          confidence: data.confidence,
          feedUpdateTimestamp: publishSec,
          change24hPct: null,
          status: 'ok',
          pythSymbol,
          feedId: data.id || feedId || undefined,
          marketSession: {
            isOpen,
            statusText,
            isCarriedForward: !isOpen,
            nextOpenTimestamp: nextOpen,
          },
          source: 'Pyth API Server',
          isAvailable: true,
        };
        priceResultCache.set(normalized, { data: result, timestamp: now });
        return result;
      }

      if (data.status === 'unsupported') {
        const result: PythRealPriceResult = {
          price: null,
          confidence: null,
          feedUpdateTimestamp: null,
          change24hPct: null,
          status: 'unsupported',
          pythSymbol,
          feedId: data.id || feedId || undefined,
          reason: data.reason || 'Feed not entitled under current Pyth subscription',
          marketSession: {
            isOpen: false,
            statusText: 'Feed not entitled (Pyth institutional license required)',
            isCarriedForward: false,
            nextOpenTimestamp: null,
          },
          source: 'Pyth API Server',
          isAvailable: false,
        };
        priceResultCache.set(normalized, { data: result, timestamp: now + 30000 });
        return result;
      }

      if (data.status === 'not_found') {
        const result: PythRealPriceResult = {
          price: null,
          confidence: null,
          feedUpdateTimestamp: null,
          change24hPct: null,
          status: 'unavailable',
          pythSymbol,
          feedId: feedId || undefined,
          marketSession: {
            isOpen: false,
            statusText: 'Pyth feed not found',
            isCarriedForward: false,
            nextOpenTimestamp: null,
          },
          source: 'Unavailable',
          isAvailable: false,
        };
        priceResultCache.set(normalized, { data: result, timestamp: now + 10000 });
        return result;
      }
    }
  } catch (err) {
    console.warn('Server price fetch failed, checking fallback:', err);
  }

  // 3. Fallback: Clean unavailable state. NEVER synthesize mock data.
  const unavailableResult: PythRealPriceResult = {
    price: null,
    confidence: null,
    feedUpdateTimestamp: null,
    change24hPct: null,
    status: 'unavailable',
    pythSymbol,
    feedId: feedId || undefined,
    marketSession: {
      isOpen,
      statusText: isOpen ? 'Pyth feed unavailable' : 'Market closed • Feed unavailable',
      isCarriedForward: false,
      nextOpenTimestamp: nextOpen,
    },
    source: 'Unavailable',
    isAvailable: false,
  };

  priceResultCache.set(normalized, { data: unavailableResult, timestamp: now });
  return unavailableResult;
}

/**
 * Batch-fetch latest Pyth prices for a list of feed IDs
 */
export async function batchFetchPythPrices(
  feedIds: string[]
): Promise<Record<string, { price: number | null; change24hPct?: number | null; status: string; isAvailable: boolean }>> {
  if (!feedIds || feedIds.length === 0) return {};

  try {
    const res = await fetch('/api/pyth/prices/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: feedIds }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.prices || {};
    }
  } catch (err) {
    console.warn('Batch price fetch failed:', err);
  }
  return {};
}

/**
 * Format market session & update freshness into concise user-facing label
 */
export function formatMarketSessionStatus(
  isOpen: boolean,
  publishTimeSec: number,
  _nextOpenSec: number | null
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = Math.max(0, nowSec - publishTimeSec);

  if (!isOpen) {
    if (publishTimeSec > 0) {
      const d = new Date(publishTimeSec * 1000);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `Market closed • Carried forward from ${dateStr}`;
    }
    return 'Market closed • Carried forward from previous close';
  }

  if (diffSec < 60) {
    return 'Live';
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return `Updated ${mins}m ago`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `Updated ${hours}h ago`;
  } else {
    const days = Math.floor(diffSec / 86400);
    return `Carried forward • ${days}d ago`;
  }
}
