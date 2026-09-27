import { getRealPythMarketPrice } from './pythMarketData';

export interface PythPricePoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PythAssetFeed {
  id: string;
  symbol: string;
  name: string;
  category: string;
  price: number;
  confidence: number;
  change24h: number;
  change24hPct: number;
  high24h?: number;
  low24h?: number;
  publishSlot?: number;
  publishTime?: number;
  status: 'live' | 'trading' | 'closed' | 'unknown';
  statusText?: string;
  source: string;
  lastUpdated: number;
  history: Record<'1H' | '24H' | '7D' | '30D', PythPricePoint[]>;
}

export interface PythHistoricalResult {
  status: 'ok' | 'unsupported' | 'unavailable' | 'error';
  bars: PythPricePoint[];
  change24hPct?: number | null;
  change24hValue?: number | null;
  high?: number | null;
  low?: number | null;
  currentPrice?: number | null;
  reason?: string;
}

// Canonical Primary Reference Feeds
export const PRIMARY_REFERENCE_FEEDS = {
  SOL_USD: {
    id: 'sol_usd',
    symbol: 'SOL',
    displaySymbol: 'SOL / USD',
    name: 'Solana Benchmark Feed',
    category: 'Layer 1 Protocol',
    pythFeedId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  },
  BTC_USD: {
    id: 'btc_usd',
    symbol: 'BTC',
    displaySymbol: 'BTC / USD',
    name: 'Bitcoin Sovereign Feed',
    category: 'Digital Gold',
    pythFeedId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  },
  ETH_USD: {
    id: 'eth_usd',
    symbol: 'ETH',
    displaySymbol: 'ETH / USD',
    name: 'Ethereum Settlement Feed',
    category: 'Layer 1 Protocol',
    pythFeedId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  },
  USDC_USD: {
    id: 'usdc_usd',
    symbol: 'USDC',
    displaySymbol: 'USDC / USD',
    name: 'USD Coin Stable Settlement',
    category: 'Fiat Settlement',
    pythFeedId: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  },
};

export const PYTH_DEVNET_FEEDS = PRIMARY_REFERENCE_FEEDS;

let cachedFeeds: Record<string, { data: PythAssetFeed; timestamp: number }> = {};
const CACHE_TTL_MS = 6000;

/**
 * Fetch real historical OHLC bars from Pyth Pro History API via server endpoint.
 * Strictly no mock, synthetic, or random data.
 */
export async function fetchPythHistoricalOHLC(
  symbolOrFeedId: string,
  timeframe: '24H' | '7D' | 'ALL' = '24H'
): Promise<PythHistoricalResult> {
  if (!symbolOrFeedId) {
    return { status: 'unavailable', bars: [], reason: 'No symbol provided' };
  }

  try {
    const isFeedId = /^[0-9a-fA-F]{64}$/.test(symbolOrFeedId.trim());
    const query = isFeedId
      ? `feedId=${encodeURIComponent(symbolOrFeedId.trim())}&timeframe=${timeframe}`
      : `symbol=${encodeURIComponent(symbolOrFeedId.trim())}&timeframe=${timeframe}`;

    const res = await fetch(`/api/pyth/history?${query}`);
    if (!res.ok) {
      if (res.status === 403) {
        return {
          status: 'unsupported',
          bars: [],
          reason: 'Pyth feed requires institutional license grant (e.g. Cboe BZX equities/ETFs)',
        };
      }
      return { status: 'unavailable', bars: [], reason: `HTTP error ${res.status}` };
    }

    const json = await res.json();
    return {
      status: json.status || 'ok',
      bars: json.bars || [],
      change24hPct: json.change24hPct ?? null,
      change24hValue: json.change24hValue ?? null,
      high: json.high ?? null,
      low: json.low ?? null,
      currentPrice: json.currentPrice ?? null,
      reason: json.reason,
    };
  } catch (err: any) {
    console.warn('Failed to fetch Pyth historical OHLC:', err);
    return { status: 'error', bars: [], reason: err.message };
  }
}

/**
 * Fetch Pyth oracle market data.
 * Completely independent of the Valtics blockchain / devnet execution environment.
 */
export async function fetchPythMarketData(
  feedKey: keyof typeof PRIMARY_REFERENCE_FEEDS = 'SOL_USD'
): Promise<PythAssetFeed> {
  const config = PRIMARY_REFERENCE_FEEDS[feedKey];
  const now = Date.now();

  if (cachedFeeds[feedKey] && now - cachedFeeds[feedKey].timestamp < CACHE_TTL_MS) {
    return cachedFeeds[feedKey].data;
  }

  // Fetch real Pyth price from verified oracle integration
  const pythResult = await getRealPythMarketPrice(config.pythFeedId || config.symbol);

  const price = pythResult.price ?? 0;
  const confidence = pythResult.confidence ?? 0;
  const publishTime = pythResult.feedUpdateTimestamp ?? Math.floor(now / 1000);
  const status = pythResult.marketSession.isOpen ? 'live' : 'closed';
  const statusText = pythResult.marketSession.statusText;

  // Fetch real historical OHLC for 24h & 7d
  const [hist24h, hist7d] = await Promise.allSettled([
    fetchPythHistoricalOHLC(config.pythFeedId, '24H'),
    fetchPythHistoricalOHLC(config.pythFeedId, '7D'),
  ]);

  const bars24h = hist24h.status === 'fulfilled' ? hist24h.value.bars : [];
  const bars7d = hist7d.status === 'fulfilled' ? hist7d.value.bars : [];
  const change24hPct = hist24h.status === 'fulfilled' && hist24h.value.change24hPct !== null
    ? hist24h.value.change24hPct
    : 0;
  const change24h = hist24h.status === 'fulfilled' && hist24h.value.change24hValue !== null
    ? hist24h.value.change24hValue
    : 0;
  const high24h = hist24h.status === 'fulfilled' && hist24h.value.high !== null
    ? hist24h.value.high
    : undefined;
  const low24h = hist24h.status === 'fulfilled' && hist24h.value.low !== null
    ? hist24h.value.low
    : undefined;

  const data: PythAssetFeed = {
    id: config.id,
    symbol: config.symbol,
    name: config.name,
    category: config.category,
    price,
    confidence,
    change24h,
    change24hPct,
    high24h,
    low24h,
    publishTime,
    status,
    statusText,
    source: pythResult.source,
    lastUpdated: now,
    history: {
      '1H': bars24h.slice(-12),
      '24H': bars24h,
      '7D': bars7d,
      '30D': bars7d,
    },
  };

  cachedFeeds[feedKey] = { data, timestamp: now };
  return data;
}

export async function fetchAllPythFeeds(): Promise<PythAssetFeed[]> {
  const keys = Object.keys(PRIMARY_REFERENCE_FEEDS) as (keyof typeof PRIMARY_REFERENCE_FEEDS)[];
  const promises = keys.map((k) => fetchPythMarketData(k));
  return Promise.all(promises);
}
