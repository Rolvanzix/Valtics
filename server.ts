import './src/server-polyfills';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  createDevnetMarket,
  getDevnetMarkets
} from './src/services/devnetMarketService';
import {
  processAgentChat,
  processMarketScan
} from './src/services/valticsAgentEngine';
import {
  createRateLimiter,
  scanAndRedactCredentials,
  safeServerLog,
  validateDevnetClusterStrict
} from './src/services/agentSecurityGuard';
import { PANTA_SEED_MARKETS } from './src/data/pantaSeedMarkets';
import {
  getPantaMarkets,
  getPantaMarketById,
  getPantaPositions,
  getPantaTrades,
  checkPantaHealth,
  getPantaMarketCreationQuote,
  buildPantaMarketCreationTx,
  getPantaTradeQuote,
  buildPantaBuyTx,
  broadcastTransaction,
  checkClaimEligibility,
  buildClaimTransaction,
  buildClaimCreatorFeesTransaction,
  getPantaConfig
} from './src/services/pantaBackendService';
import {
  generateMarketSuggestion,
  validateMarketQuality,
  generateMarketBrief
} from './src/services/marketIntelligenceEngine';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Pyth API key is strictly maintained server-side
const PYTH_API_KEY = (process.env.PYTH_API_KEY || process.env.VITE_PYTH_API_KEY || '').trim();

// Panta API credentials and URL (maintained strictly server-side)
const PANTA_API_URL = (process.env.PANTA_API_URL || 'https://live-api.panta.market/api/v1').trim().replace(/\/$/, '');
const PANTA_API_KEY = (process.env.PANTA_API_KEY || '').trim();

// In-memory cache for Pyth responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const priceCache = new Map<string, CacheEntry<any>>();
const feedListCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const PRICE_CACHE_TTL_MS = 5000; // 5 seconds for live prices
const FEED_LIST_CACHE_TTL_MS = 300000; // 5 minutes for feed lists

// In-memory cache for Panta prediction market responses
const pantaMarketsCache = new Map<string, CacheEntry<any>>();
const pantaDetailCache = new Map<string, CacheEntry<any>>();
const PANTA_MARKETS_CACHE_TTL_MS = 10000; // 10 seconds for market listings
const PANTA_DETAIL_CACHE_TTL_MS = 5000;   // 5 seconds for single market detail

interface Stats24h {
  change24hPct: number | null;
  change24hValue: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  timestamp: number;
}
const stats24hCache = new Map<string, Stats24h>();

function inferIssuerName(symbol: string, displaySymbol: string, description: string, assetType: string): string {
  const dUpper = (description || '').toUpperCase();
  const dispUpper = (displaySymbol || '').toUpperCase();

  if (dispUpper === 'ARKB') return 'ARK Invest / 21Shares';
  if (dispUpper === 'ARKK' || dispUpper === 'ARKW' || dispUpper === 'ARKG') return 'ARK Investment Management';
  if (dispUpper === 'BITB') return 'Bitwise Asset Management';
  if (dispUpper === 'IBIT' || dUpper.includes('ISHARES') || dispUpper === 'GOVT' || dispUpper === 'TLT' || dispUpper === 'SHV' || dispUpper === 'IEF') return 'BlackRock iShares';
  if (dispUpper === 'SPY' || dispUpper === 'GLD' || dUpper.includes('SPDR')) return 'State Street Global Advisors';
  if (dispUpper === 'QQQ' || dUpper.includes('INVESCO')) return 'Invesco';
  if (dispUpper === 'USDY' || dispUpper === 'USDYUSD') return 'Ondo Finance';
  if (dispUpper === 'PAXG' || dispUpper === 'PAXGUSD') return 'Paxos Trust Company';
  if (dispUpper === 'XAUT' || dispUpper === 'XAUTUSD') return 'Tether Gold Operations';
  if (dispUpper === 'US10Y' || dispUpper === 'US2Y' || dispUpper === 'US3M' || dUpper.includes('TREASURY')) return 'US Department of the Treasury';
  if (dispUpper === 'USDC' || dispUpper === 'USDCUSD') return 'Circle Internet Financial';
  if (dispUpper === 'SOL' || dispUpper === 'SOLUSD') return 'Solana Foundation';
  if (dispUpper === 'BTC' || dispUpper === 'BTCUSD') return 'Bitcoin Sovereign Network';
  if (dispUpper === 'ETH' || dispUpper === 'ETHUSD') return 'Ethereum Foundation';
  if (dispUpper === 'XAU' || dispUpper === 'XAUUSD') return 'COMEX / LBMA Benchmark';
  if (dispUpper === 'XAG' || dispUpper === 'XAGUSD') return 'COMEX / LBMA Benchmark';
  if (dispUpper === 'USO' || dispUpper === 'WTI') return 'NYMEX Commodity Benchmark';

  if ((assetType || '').toLowerCase() === 'equity' || dUpper.includes('/ US DOLLAR') || dUpper.includes('/ USD')) {
    const rawName = description.split('/')[0].trim();
    if (rawName && rawName.length > 2) {
      return rawName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  if ((assetType || '').toLowerCase() === 'metal') return 'LBMA / Metal Benchmark';
  if ((assetType || '').toLowerCase() === 'crypto') return `${dispUpper.replace(/USD|USDT$/, '')} Network`;
  if ((assetType || '').toLowerCase() === 'fx') return 'Central Bank Settlement';

  return 'Pyth Network Benchmark';
}

function inferCategoryLabel(symbol: string, displaySymbol: string, description: string, rawAssetType: string): string {
  const dUpper = (description || '').toUpperCase();
  const dispUpper = (displaySymbol || '').toUpperCase();
  const typeLower = (rawAssetType || '').toLowerCase();

  if (
    dispUpper === 'USDY' ||
    dispUpper === 'GOVT' ||
    dispUpper === 'TLT' ||
    dispUpper === 'SHV' ||
    dispUpper === 'IEF' ||
    dispUpper === 'US10Y' ||
    dispUpper === 'US2Y' ||
    dispUpper === 'US3M' ||
    dispUpper === 'HYG' ||
    dUpper.includes('TREASURY') ||
    dUpper.includes('BOND') ||
    dUpper.includes('YIELD') ||
    typeLower === 'rates'
  ) {
    return 'Tokenized Bonds';
  }

  if (
    dispUpper === 'PAXG' ||
    dispUpper === 'XAUT' ||
    dispUpper === 'XAU' ||
    dispUpper === 'XAUUSD' ||
    dispUpper === 'XAG' ||
    dispUpper === 'XAGUSD' ||
    dispUpper === 'USO' ||
    typeLower === 'metal' ||
    dUpper.includes('GOLD') ||
    dUpper.includes('SILVER') ||
    dUpper.includes('OIL') ||
    dUpper.includes('COPPER')
  ) {
    return 'Tokenized Commodities';
  }

  if (
    dispUpper === 'ARKB' ||
    dispUpper === 'ARKK' ||
    dispUpper === 'BITB' ||
    dispUpper === 'IBIT' ||
    dispUpper === 'SPY' ||
    dispUpper === 'QQQ' ||
    dispUpper === 'GLD' ||
    dUpper.includes('ETF') ||
    dUpper.includes('INDEX') ||
    dUpper.includes('FUND') ||
    typeLower === 'index'
  ) {
    return 'Tokenized Funds';
  }

  if (typeLower === 'crypto' || (symbol || '').toUpperCase().startsWith('CRYPTO.')) {
    return 'Tokenized Digital Assets';
  }

  if (typeLower === 'equity' || (symbol || '').toUpperCase().startsWith('EQUITY.')) {
    return 'Tokenized Equities';
  }

  return 'Tokenized Real-World Assets';
}

/**
 * Fetch and cache the complete list of price feeds from Hermes
 */
async function getHermesPriceFeeds(): Promise<any[]> {
  const now = Date.now();
  if (feedListCache.data && now - feedListCache.timestamp < FEED_LIST_CACHE_TTL_MS) {
    return feedListCache.data;
  }

  try {
    const res = await fetch('https://hermes.pyth.network/v2/price_feeds');
    if (!res.ok) throw new Error(`Hermes price_feeds failed with status ${res.status}`);
    const data = await res.json();
    feedListCache.data = data;
    feedListCache.timestamp = now;
    return data;
  } catch (err) {
    console.error('Failed to load Hermes price feeds:', err);
    return feedListCache.data || [];
  }
}

/**
 * Resolves an asset symbol, ticker, or hex ID to a Pyth feed
 */
function resolveFeedFromList(query: string, feeds: any[]): any | null {
  if (!query) return null;
  const clean = query.trim();

  // If already 64-char hex feed ID
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    const cleanLower = clean.toLowerCase();
    return feeds.find((f) => (f.id || '').toLowerCase() === cleanLower) || { id: cleanLower };
  }

  const upper = clean.toUpperCase();

  // Special canonical mappings for metals & commodities
  if (upper === 'XAU' || upper === 'GOLD') {
    const xau = feeds.find((f) => f.attributes?.symbol === 'Metal.XAU/USD');
    if (xau) return xau;
  }
  if (upper === 'XAG' || upper === 'SILVER') {
    const xag = feeds.find((f) => f.attributes?.symbol === 'Metal.XAG/USD');
    if (xag) return xag;
  }

  // Exact display symbol match (e.g. "ARKB", "ARKK", "BITB", "TSLA", "BTC")
  let match = feeds.find(
    (f) => (f.attributes?.display_symbol || '').toUpperCase() === upper
  );
  if (match) return match;

  // Exact symbol match (e.g. "Equity.US.ARKB/USD", "Crypto.BTC/USD")
  match = feeds.find(
    (f) => (f.attributes?.symbol || '').toUpperCase() === upper
  );
  if (match) return match;

  // Normalized search: check if symbol ends with the ticker or contains it
  match = feeds.find((f) => {
    const sym = (f.attributes?.symbol || '').toUpperCase();
    return sym === `EQUITY.US.${upper}/USD` || sym === `CRYPTO.${upper}/USD` || sym === `METAL.${upper}/USD`;
  });
  if (match) return match;

  // Partial substring match
  match = feeds.find((f) => {
    const display = (f.attributes?.display_symbol || '').toUpperCase();
    const sym = (f.attributes?.symbol || '').toUpperCase();
    return display.includes(upper) || sym.includes(upper);
  });

  return match || null;
}

/**
 * Maps a Pyth feed or ticker query to a live institutional market ticker
 */
function getBenchmarkTickerForPythFeed(feed: any, query?: string): string | null {
  const sym = (feed?.attributes?.symbol || query || '').toUpperCase();
  const display = (feed?.attributes?.display_symbol || '').toUpperCase();
  const desc = (feed?.attributes?.description || '').toUpperCase();
  const assetType = (feed?.attributes?.asset_type || '').toLowerCase();

  // 1. Metals / Commodities
  if (sym.includes('XAU') || display.includes('XAU') || desc.includes('GOLD')) return 'GC=F';
  if (sym.includes('XAG') || display.includes('XAG') || desc.includes('SILVER')) return 'SI=F';
  if (sym.includes('WTI') || desc.includes('CRUDE') || desc.includes('OIL')) return 'CL=F';
  if (sym.includes('BRENT')) return 'BZ=F';
  if (sym.includes('COPPER')) return 'HG=F';
  if (sym.includes('NATURAL GAS') || sym.includes('NG/')) return 'NG=F';
  if (sym.includes('PLATINUM') || display.includes('XPT')) return 'PL=F';
  if (sym.includes('PALLADIUM') || display.includes('XPD')) return 'PA=F';

  // 2. Crypto
  if (sym.includes('SOL') || display === 'SOL' || display === 'SOLUSD') return 'SOL-USD';
  if (sym.includes('BTC') || display === 'BTC' || display === 'BTCUSD') return 'BTC-USD';
  if (sym.includes('ETH') || display === 'ETH' || display === 'ETHUSD') return 'ETH-USD';
  if (sym.includes('USDC')) return 'USDC-USD';

  // 3. Equities / ETFs
  if (assetType === 'equity' || sym.startsWith('EQUITY.US.')) {
    if (sym.includes('.')) {
      const parts = sym.split('/')[0].split('.');
      return parts[parts.length - 1];
    }
    if (display && !display.includes('/')) return display;
  }

  // 4. Clean ticker fallback
  const clean = (display || sym).replace(/[^a-zA-Z0-9]/g, '');
  if (clean.endsWith('USD') && clean.length > 4) {
    const base = clean.slice(0, -3);
    if (assetType === 'crypto') return `${base}-USD`;
    return base;
  }

  return clean || null;
}

const liveBenchmarkCache = new Map<string, { data: any; timestamp: number }>();
const LIVE_BENCHMARK_CACHE_TTL_MS = 8000;

/**
 * Fetches real market price, 24h stats, and high/low from live institutional benchmark
 */
async function fetchLiveBenchmarkPrice(feedIdOrSymbol: string, feedObj?: any): Promise<{
  id: string;
  status: 'ok';
  price: number;
  confidence: number;
  publishTime: number;
  isAvailable: boolean;
  change24hPct?: number | null;
  change24hValue?: number | null;
  high24h?: number | null;
  low24h?: number | null;
  volume?: number | null;
  source: string;
} | null> {
  try {
    const cleanId = feedIdOrSymbol.replace(/^0x/, '').toLowerCase();
    const now = Date.now();
    const cached = liveBenchmarkCache.get(cleanId);
    if (cached && now - cached.timestamp < LIVE_BENCHMARK_CACHE_TTL_MS) {
      return cached.data;
    }

    let targetFeed = feedObj;
    if (!targetFeed) {
      const feeds = await getHermesPriceFeeds();
      targetFeed = resolveFeedFromList(cleanId, feeds);
    }

    const ticker = getBenchmarkTickerForPythFeed(targetFeed, feedIdOrSymbol);
    if (!ticker) return null;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const result0 = json.chart?.result?.[0];
    const meta = result0?.meta;
    if (!meta || meta.regularMarketPrice == null) return null;

    const price = Number(meta.regularMarketPrice);
    const prevClose = Number(meta.chartPreviousClose || meta.previousClose || price);
    const change24hPct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    const change24hValue = price - prevClose;
    const high24h = meta.regularMarketDayHigh != null ? Number(meta.regularMarketDayHigh) : price * 1.015;
    const low24h = meta.regularMarketDayLow != null ? Number(meta.regularMarketDayLow) : price * 0.985;
    const volume = meta.regularMarketVolume != null ? Number(meta.regularMarketVolume) : null;
    const publishTime = meta.regularMarketTime || Math.floor(now / 1000);

    const statsObj: Stats24h = {
      change24hPct,
      change24hValue,
      high: high24h,
      low: low24h,
      volume,
      timestamp: now,
    };
    stats24hCache.set(cleanId, statsObj);
    if (targetFeed?.attributes?.symbol) {
      stats24hCache.set(targetFeed.attributes.symbol.toLowerCase(), statsObj);
    }
    if (ticker) {
      stats24hCache.set(ticker.toLowerCase(), statsObj);
    }

    const result = {
      id: cleanId,
      status: 'ok' as const,
      price,
      confidence: price * 0.0005,
      publishTime,
      isAvailable: true,
      change24hPct,
      change24hValue,
      high24h,
      low24h,
      volume,
      source: 'Live Market Benchmark',
    };

    liveBenchmarkCache.set(cleanId, { data: result, timestamp: now });
    if (targetFeed?.id) {
      liveBenchmarkCache.set(targetFeed.id.toLowerCase(), { data: result, timestamp: now });
    }

    return result;
  } catch (err) {
    console.warn(`Live benchmark price lookup failed for ${feedIdOrSymbol}:`, err);
    return null;
  }
}

/**
 * Fetches real historical OHLC candles from live institutional benchmark
 */
async function fetchLiveBenchmarkHistory(symbolOrFeedId: string, timeframe: string): Promise<any | null> {
  try {
    const feeds = await getHermesPriceFeeds();
    const resolved = resolveFeedFromList(symbolOrFeedId, feeds);
    const ticker = getBenchmarkTickerForPythFeed(resolved, symbolOrFeedId);
    if (!ticker) return null;

    let interval = '1d';
    let range = '1mo';
    if (timeframe === '1H') {
      interval = '2m';
      range = '1d';
    } else if (timeframe === '24H') {
      interval = '15m';
      range = '5d';
    } else if (timeframe === '7D') {
      interval = '1h';
      range = '7d';
    } else if (timeframe === '30D' || timeframe === 'ALL') {
      interval = '1d';
      range = '3mo';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    const res0 = json.chart?.result?.[0];
    if (!res0) return null;

    const timestamps: number[] = res0.timestamp || [];
    const quote = res0.indicators?.quote?.[0] || {};
    const bars: Array<{
      time: string;
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      price: number;
      volume?: number;
    }> = [];

    let minLow = Infinity;
    let maxHigh = -Infinity;

    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      if (o != null && c != null) {
        const ts = timestamps[i] * 1000;
        const d = new Date(ts);
        const timeStr =
          timeframe === '24H' || timeframe === '1H'
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

        const openVal = Number(o);
        const highVal = Number(h != null ? h : Math.max(openVal, c));
        const lowVal = Number(l != null ? l : Math.min(openVal, c));
        const closeVal = Number(c);
        const volVal = quote.volume?.[i] ? Number(quote.volume[i]) : undefined;

        if (lowVal < minLow) minLow = lowVal;
        if (highVal > maxHigh) maxHigh = highVal;

        bars.push({
          time: timeStr,
          timestamp: ts,
          open: openVal,
          high: highVal,
          low: lowVal,
          close: closeVal,
          price: closeVal,
          volume: volVal,
        });
      }
    }

    if (bars.length === 0) return null;

    // Slice to 24 bars for 24H if window has many intervals
    const finalBars = timeframe === '24H' && bars.length > 24 ? bars.slice(-24) : bars;
    const firstBar = finalBars[0];
    const lastBar = finalBars[finalBars.length - 1];
    const change24hPct = firstBar && firstBar.open > 0 ? ((lastBar.close - firstBar.open) / firstBar.open) * 100 : 0;
    const change24hValue = firstBar && lastBar ? lastBar.close - firstBar.open : 0;

    return {
      status: 'ok',
      symbol: resolved?.attributes?.symbol || symbolOrFeedId,
      channel: 'live_benchmark',
      timeframe,
      resolution: interval,
      bars: finalBars,
      change24hPct,
      change24hValue,
      high: maxHigh !== -Infinity ? maxHigh : null,
      low: minLow !== Infinity ? minLow : null,
      currentPrice: lastBar ? lastBar.close : null,
      source: 'Live Market Benchmark',
    };
  } catch (err) {
    console.warn(`Live benchmark history lookup failed for ${symbolOrFeedId}:`, err);
    return null;
  }
}

/**
 * Fetches latest price for a single Pyth feed ID
 */
async function fetchSingleFeedPrice(feedId: string): Promise<{
  id: string;
  status: 'ok' | 'unsupported' | 'not_found' | 'error';
  price: number | null;
  confidence: number | null;
  publishTime: number | null;
  expo?: number;
  rawPrice?: string;
  isAvailable: boolean;
  change24hPct?: number | null;
  change24hValue?: number | null;
  high24h?: number | null;
  low24h?: number | null;
  volume?: number | null;
  source?: string;
  reason?: string;
  error?: string;
}> {
  const cleanId = feedId.replace(/^0x/, '').toLowerCase();
  const now = Date.now();
  const cached = priceCache.get(cleanId);
  if (cached && now - cached.timestamp < PRICE_CACHE_TTL_MS) {
    return cached.data;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (PYTH_API_KEY) {
    headers['Authorization'] = `Bearer ${PYTH_API_KEY}`;
  }

  try {
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${cleanId}`;
    const res = await fetch(url, { headers });

    if (res.status === 200) {
      const data = await res.json();
      const parsed = data.parsed?.[0]?.price;
      if (parsed) {
        const expo = Number(parsed.expo);
        const rawPrice = String(parsed.price);
        const rawConf = String(parsed.conf);
        const publishTime = Number(parsed.publish_time);
        const price = Number(rawPrice) * Math.pow(10, expo);
        const confidence = Number(rawConf) * Math.pow(10, expo);
        const stats = stats24hCache.get(cleanId);

        const result = {
          id: cleanId,
          status: 'ok' as const,
          price,
          confidence,
          publishTime,
          expo,
          rawPrice,
          isAvailable: true,
          change24hPct: stats?.change24hPct ?? null,
          change24hValue: stats?.change24hValue ?? null,
          high24h: stats?.high ?? null,
          low24h: stats?.low ?? null,
          volume: stats?.volume ?? null,
          source: 'Pyth Hermes API',
        };
        priceCache.set(cleanId, { data: result, timestamp: now });
        return result;
      }
    }

    // If Hermes returned 403 (unentitled/unlicensed) or 401 or price not in Hermes,
    // seamlessly fall back to live institutional market benchmark
    const fallback = await fetchLiveBenchmarkPrice(cleanId);
    if (fallback && fallback.price != null && fallback.price > 0) {
      priceCache.set(cleanId, { data: fallback, timestamp: now });
      return fallback;
    }

    if (res.status === 403) {
      const errText = await res.text();
      const result = {
        id: cleanId,
        status: 'unsupported' as const,
        price: null,
        confidence: null,
        publishTime: null,
        isAvailable: false,
        reason: 'Pyth feed not entitled: institutional exchange subscription grant required (e.g. Cboe BZX/equity gate)',
        error: errText,
      };
      priceCache.set(cleanId, { data: result, timestamp: now + 30000 });
      return result;
    }

    if (res.status === 404) {
      const result = {
        id: cleanId,
        status: 'not_found' as const,
        price: null,
        confidence: null,
        publishTime: null,
        isAvailable: false,
        reason: 'Pyth feed ID not found',
      };
      priceCache.set(cleanId, { data: result, timestamp: now + 30000 });
      return result;
    }

    const errText = await res.text();
    return {
      id: cleanId,
      status: 'error',
      price: null,
      confidence: null,
      publishTime: null,
      isAvailable: false,
      error: `Pyth API returned status ${res.status}: ${errText.slice(0, 100)}`,
    };
  } catch (err: any) {
    // On network failure to Hermes, try live benchmark
    const fallback = await fetchLiveBenchmarkPrice(cleanId);
    if (fallback && fallback.price != null && fallback.price > 0) {
      priceCache.set(cleanId, { data: fallback, timestamp: now });
      return fallback;
    }

    return {
      id: cleanId,
      status: 'error',
      price: null,
      confidence: null,
      publishTime: null,
      isAvailable: false,
      error: err.message,
    };
  }
}

// ==========================================
// 1. Health Endpoint
// ==========================================
app.get('/api/health', (req, res) => {
  const isPantaConfigured = !!PANTA_API_KEY;
  const pantaKeyFingerprint = isPantaConfigured
    ? `${PANTA_API_KEY.slice(0, 12)}...${PANTA_API_KEY.slice(-6)}`
    : null;

  res.json({
    status: 'ok',
    pythConfigured: !!PYTH_API_KEY,
    keyLength: PYTH_API_KEY.length,
    pantaConfigured: isPantaConfigured,
    pantaKeyFingerprint,
    pantaKeyLength: PANTA_API_KEY.length,
    pantaApiUrl: PANTA_API_URL,
    timestamp: Date.now(),
  });
});

// Panta Status & Diagnostics Endpoint
app.get('/api/panta/status', (req, res) => {
  const isPantaConfigured = !!PANTA_API_KEY;
  const keyFingerprint = isPantaConfigured
    ? `${PANTA_API_KEY.slice(0, 12)}...${PANTA_API_KEY.slice(-6)}`
    : null;

  res.json({
    success: true,
    configured: isPantaConfigured,
    keyFingerprint,
    keyLength: PANTA_API_KEY.length,
    apiUrl: PANTA_API_URL,
    status: isPantaConfigured ? 'synced' : 'missing_key',
    timestamp: Date.now(),
  });
});

// ==========================================
// 1b. Devnet Market Creation & Query Endpoints
// ==========================================

// Devnet Market Creation (Frictionless, Devnet-only)
app.post(['/api/devnet/create-market', '/api/testnet/create-market'], (req, res) => {
  try {
    const result = createDevnetMarket(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to create Devnet market.' });
  }
});

// Markets List API
app.get('/api/markets', (_req, res) => {
  const markets = getDevnetMarkets();
  return res.json({ markets });
});

// ==========================================
// 1c. VALTICS Agent Intelligence Endpoints
// Devnet-Only, Non-Custodial Intelligence Layer
// Rate Limited & Cryptographically Protected
// ==========================================

// Rate Limiters: 20 req/min for chat, 30 req/min for scanner per client IP
const agentChatRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 20 });
const agentScanRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 30 });
// Rate Limiter for Panta Prediction Market Proxy: 60 req/min per client IP
const pantaRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 60 });

function getClientIdentifier(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Agent Chat & Research Endpoint
app.post('/api/agent/chat', async (req, res) => {
  const clientIp = getClientIdentifier(req);

  // 1. Rate Limiting Check
  const rateLimit = agentChatRateLimiter(clientIp);
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000).toString());
    safeServerLog('RateLimit', `Chat rate limit exceeded for client ${clientIp}`);
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. To protect service availability, please wait a moment before sending another query.',
      recoveryAction: 'rate_limited_wait',
      resetSeconds: Math.ceil(rateLimit.resetMs / 1000),
    });
  }

  try {
    const { messages, walletContext, clientKnownMarkets } = req.body;

    // 2. Strict Payload Validation
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Payload validation error: messages must be an array',
        recoveryAction: 'check_payload',
      });
    }

    if (messages.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Payload validation error: message history cannot exceed 20 messages',
        recoveryAction: 'clear_or_truncate',
      });
    }

    for (const m of messages) {
      if (!m || typeof m.content !== 'string' || !['user', 'assistant', 'system'].includes(m.role)) {
        return res.status(400).json({
          success: false,
          error: 'Payload validation error: malformed message structure',
          recoveryAction: 'check_payload',
        });
      }
      if (m.content.length > 4000) {
        return res.status(400).json({
          success: false,
          error: 'Payload validation error: message text cannot exceed 4,000 characters',
          recoveryAction: 'truncate_message',
        });
      }

      // 3. Sensitive Credential Early Interception (zero-logging & zero-storage)
      const credScan = scanAndRedactCredentials(m.content);
      if (credScan.hasSensitiveData) {
        safeServerLog('SecurityViolation', `Private key or seed phrase detected from client ${clientIp}, neutralized.`);
        return res.json({
          success: false,
          message: `### ⚠️ Security Safeguard: Non-Custodial Protocol Protection\n\nVALTICS Agent intercepted sensitive data resembling a **private key or mnemonic seed phrase** in your query.\n\n#### Actions Taken:\n- **Immediate Neutralization**: The sensitive string was intercepted at the API boundary and permanently discarded.\n- **Zero-Storage Guarantee**: This data was **not sent** to any AI provider, was **not written** to disk, and will **never be stored**.\n\n#### Non-Custodial Security Policy:\n- VALTICS operates on strict non-custodial principles.\n- The Agent **NEVER** requires, requests, or processes private keys, seed phrases, or wallet passwords.\n- All blockchain operations require you to review and sign explicitly with your connected Solana Devnet wallet.\n\n*Please ensure you keep your private keys and seed phrases completely confidential at all times.*`,
        });
      }
    }

    // 4. Cluster Environment Verification
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    if (!validateDevnetClusterStrict(lastUserMessage)) {
      return res.json({
        success: false,
        message: `### 🛡️ Devnet Environment Enforcement Notice\n\nVALTICS Agent operates **strictly on Solana Devnet**. Requests referencing Mainnet or unsupported cluster environments are rejected to protect user assets and prevent unintended mainnet execution.`,
      });
    }

    // 5. 15-second timeout safeguard for AI queries
    const timeoutPromise = new Promise<{ success: false; message: string; error: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Agent query timed out after 15 seconds.')), 15000)
    );

    const agentPromise = processAgentChat({
      messages,
      walletContext,
      clientKnownMarkets,
    });

    const result = await Promise.race([agentPromise, timeoutPromise]);
    return res.json(result);
  } catch (err: any) {
    safeServerLog('AgentError', 'Error in /api/agent/chat: ' + (err?.message || 'Unknown error'));
    return res.status(500).json({
      success: false,
      message: 'The VALTICS Agent intelligence service encountered a transient issue: ' + (err.message || 'Unknown error'),
      error: err.message || 'Agent service error',
      recoveryAction: 'retry_or_fallback',
    });
  }
});

// Agent Market Scanner Endpoint
app.post('/api/agent/scan-markets', async (req, res) => {
  const clientIp = getClientIdentifier(req);

  // Rate Limiting Check
  const rateLimit = agentScanRateLimiter(clientIp);
  res.setHeader('X-RateLimit-Limit', '30');
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil(rateLimit.resetMs / 1000).toString());
    safeServerLog('RateLimit', `Scan rate limit exceeded for client ${clientIp}`);
    return res.status(429).json({
      error: 'Scan rate limit exceeded. Please wait a moment before refreshing market scanner.',
      resetSeconds: Math.ceil(rateLimit.resetMs / 1000),
    });
  }

  try {
    const { clientKnownMarkets } = req.body;
    const summary = await processMarketScan(clientKnownMarkets);
    return res.json(summary);
  } catch (err: any) {
    safeServerLog('ScanError', 'Error in /api/agent/scan-markets: ' + (err?.message || 'Unknown error'));
    return res.status(500).json({ error: err.message || 'Market scan error' });
  }
});

// ==========================================
// 1d. Panta Prediction Market Proxy Endpoints
// Secure Server-Side Proxy Layer protecting credentials & handling CORS
// ==========================================

// 1. Discover & List Panta Prediction Markets
app.get('/api/panta/markets', async (req, res) => {
  const clientIp = getClientIdentifier(req);
  const rateLimit = pantaRateLimiter(clientIp);
  if (!rateLimit.allowed) {
    safeServerLog('RateLimit', `Panta rate limit exceeded for client ${clientIp}`);
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests to Panta proxy. Please wait a moment.',
        resetSeconds: Math.ceil(rateLimit.resetMs / 1000)
      }
    });
  }

  const result = await getPantaMarkets({
    category: req.query.category as string,
    status: req.query.status as any,
    query: (req.query.q || req.query.query) as string,
    sortBy: req.query.sortBy as any,
    sortDirection: req.query.sortDirection as any,
    limit: parseInt(String(req.query.limit || '20'), 10),
    offset: parseInt(String(req.query.offset || '0'), 10),
    cursor: req.query.cursor as string,
  });

  return res.json(result);
});

// 2. Single Panta Market Details
app.get('/api/panta/markets/:id', async (req, res) => {
  const clientIp = getClientIdentifier(req);
  const rateLimit = pantaRateLimiter(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests to Panta proxy. Please wait a moment.',
        resetSeconds: Math.ceil(rateLimit.resetMs / 1000)
      }
    });
  }

  const marketId = (req.params.id || '').trim();
  if (!marketId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_MARKET_ID', message: 'Market ID parameter is required' }
    });
  }

  const result = await getPantaMarketById(marketId);
  return res.status(result.success ? 200 : (result.error?.status || 404)).json(result);
});

// 3. User Wallet Prediction Positions
app.get('/api/panta/positions', async (req, res) => {
  const wallet = (req.query.wallet as string || '').trim();
  const marketId = (req.query.marketId as string || '').trim();
  const result = await getPantaPositions(wallet, marketId || undefined);
  return res.json(result);
});

// 4. Historical / Live Prediction Trades
app.get('/api/panta/trades', async (req, res) => {
  const marketId = (req.query.marketId as string || '').trim();
  const wallet = (req.query.wallet as string || '').trim();
  const result = await getPantaTrades({ marketId: marketId || undefined, wallet: wallet || undefined });
  return res.json(result);
});

// 5. Dedicated Developer-Only Health Check
app.get('/api/panta/health', async (req, res) => {
  const health = await checkPantaHealth();
  return res.json(health);
});

// 6. Market Creation Quote
app.post('/api/panta/markets/quote', async (req, res) => {
  const result = await getPantaMarketCreationQuote(req.body);
  return res.json(result);
});

// 7. Market Creation Transaction Builder (Unsigned)
app.post('/api/panta/markets/build-create-tx', async (req, res) => {
  const result = await buildPantaMarketCreationTx(req.body);
  return res.status(result.success ? 200 : 400).json(result);
});

// 8. Trade Quote (YES / NO)
app.post('/api/panta/trades/quote', async (req, res) => {
  const result = await getPantaTradeQuote(req.body);
  return res.json(result);
});

// 9. Buy Transaction Builder (Unsigned)
app.post('/api/panta/trades/build-buy-tx', async (req, res) => {
  const result = await buildPantaBuyTx(req.body);
  return res.status(result.success ? 200 : 400).json(result);
});

// 9b. Broadcast Signed Transaction
app.post('/api/panta/trades/broadcast', async (req, res) => {
  const result = await broadcastTransaction(req.body);
  return res.status(result.success ? 200 : 400).json(result);
});

// 10. Claim Quote & Eligibility
app.post('/api/panta/positions/claim-quote', async (req, res) => {
  const { walletAddress, marketId } = req.body;
  const result = await checkClaimEligibility(walletAddress, marketId);
  return res.json(result);
});

// 11. Claim Transaction Builder (Unsigned)
app.post('/api/panta/positions/build-claim-tx', async (req, res) => {
  const result = await buildClaimTransaction(req.body);
  return res.status(result.success ? 200 : 400).json(result);
});

// 12. Creator Fee Claims Transaction Builder (Unsigned)
app.post('/api/panta/creator-fees/claim-tx', async (req, res) => {
  const result = await buildClaimCreatorFeesTransaction(req.body);
  return res.status(result.success ? 200 : 400).json(result);
});

// ==========================================
// 1b. Valtics Market Intelligence Endpoints
// ==========================================
// Suggest Market Question around Tokenized Asset
app.post('/api/intelligence/suggest-market', async (req, res) => {
  try {
    const result = await generateMarketSuggestion(req.body);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Validate Market Quality (objective YES/NO, horizon, public source)
app.post('/api/intelligence/validate-market', async (req, res) => {
  try {
    const result = await validateMarketQuality(req.body);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Generate Research Brief (FACTS vs MARKET DATA vs AI INTERPRETATION)
app.post('/api/intelligence/market-brief', async (req, res) => {
  try {
    const result = await generateMarketBrief(req.body);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. Pyth Feed Resolution Endpoint
// Asset symbol -> Pyth feed resolution -> feed ID
// ==========================================
app.get('/api/pyth/resolve', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string || '').trim();
    if (!symbol) {
      return res.status(400).json({ error: 'Missing symbol query parameter' });
    }

    const feeds = await getHermesPriceFeeds();
    const feed = resolveFeedFromList(symbol, feeds);

    if (!feed) {
      return res.status(404).json({
        found: false,
        symbol,
        error: `Could not resolve Pyth feed for symbol: ${symbol}`,
      });
    }

    return res.json({
      found: true,
      feed: {
        id: feed.id,
        symbol: feed.attributes?.symbol || symbol,
        displaySymbol: feed.attributes?.display_symbol || symbol,
        description: feed.attributes?.description || symbol,
        assetType: feed.attributes?.asset_type || 'Unknown',
        minChannel: feed.attributes?.min_channel || 'real_time',
        marketHours: feed.market_hours || { is_open: true, next_open: null, next_close: null },
        schedule: feed.attributes?.schedule,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Pyth Latest Price Endpoint
// Feed ID or Symbol -> Latest price with price + expo handling
// ==========================================
app.get('/api/pyth/price', async (req, res) => {
  try {
    let feedId = (req.query.id as string || '').trim();
    const symbol = (req.query.symbol as string || '').trim();

    // If ID is not a 64-char hex, resolve via symbol
    if (!feedId || !/^[0-9a-fA-F]{64}$/.test(feedId)) {
      const querySym = symbol || feedId;
      if (!querySym) {
        return res.status(400).json({ error: 'Missing id or symbol query parameter' });
      }
      const feeds = await getHermesPriceFeeds();
      const resolved = resolveFeedFromList(querySym, feeds);
      if (!resolved || !resolved.id) {
        return res.status(404).json({
          status: 'not_found',
          price: null,
          isAvailable: false,
          reason: `Could not resolve Pyth feed for: ${querySym}`,
        });
      }
      feedId = resolved.id;
    }

    const priceResult = await fetchSingleFeedPrice(feedId);
    return res.json(priceResult);
  } catch (err: any) {
    return res.status(500).json({ status: 'error', price: null, isAvailable: false, error: err.message });
  }
});

// ==========================================
// 4. Pyth Batch Latest Prices Endpoint
// Handles multiple feed IDs concurrently without single-failure cascade
// ==========================================
app.post('/api/pyth/prices/batch', async (req, res) => {
  try {
    const ids: string[] = req.body.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    // Limit batch to 60 feeds per request
    const cleanIds = ids.slice(0, 60).map((id) => id.replace(/^0x/, '').toLowerCase());

    const results = await Promise.allSettled(
      cleanIds.map((id) => fetchSingleFeedPrice(id))
    );

    const pricesMap: Record<string, any> = {};
    results.forEach((resItem, idx) => {
      const feedId = cleanIds[idx];
      const stats = stats24hCache.get(feedId);
      if (resItem.status === 'fulfilled') {
        pricesMap[feedId] = {
          ...resItem.value,
          change24hPct: stats?.change24hPct ?? null,
          change24hValue: stats?.change24hValue ?? null,
          high24h: stats?.high ?? null,
          low24h: stats?.low ?? null,
          volume: stats?.volume ?? null,
        };
      } else {
        pricesMap[feedId] = {
          id: feedId,
          status: 'error',
          price: null,
          isAvailable: false,
          error: resItem.reason?.message || 'Failed to fetch price',
          change24hPct: null,
          change24hValue: null,
          high24h: null,
          low24h: null,
          volume: null,
        };
      }
    });

    return res.json({ prices: pricesMap });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. Pyth Real History & OHLC Endpoint
// Uses Pyth Pro History API (pyth.dourolabs.app)
// ==========================================
app.get('/api/pyth/history', async (req, res) => {
  try {
    let pythSymbol = (req.query.symbol as string || '').trim();
    let feedId = (req.query.feedId as string || '').trim();
    const timeframe = (req.query.timeframe as string || '7D').toUpperCase();
    let resolution = (req.query.resolution as string || '').trim();
    let requestedChannel = (req.query.channel as string || '').trim();

    // If symbol is missing or looks like ticker/feed ID, resolve from catalog
    if (!pythSymbol || !pythSymbol.includes('.') || pythSymbol.length === 64) {
      const feeds = await getHermesPriceFeeds();
      const resolved = resolveFeedFromList(pythSymbol || feedId, feeds);
      if (resolved) {
        pythSymbol = resolved.attributes?.symbol || pythSymbol;
        feedId = resolved.id || feedId;
        if (!requestedChannel && resolved.attributes?.min_channel) {
          requestedChannel = resolved.attributes.min_channel;
        }
      }
    }

    if (!pythSymbol) {
      return res.status(400).json({
        status: 'unavailable',
        bars: [],
        reason: 'Missing symbol for historical data',
      });
    }

    const now = Math.floor(Date.now() / 1000);
    let from = now - 86400 * 7;
    let to = now;

    if (timeframe === '1H') {
      from = now - 3600;
      if (!resolution) resolution = '1';
    } else if (timeframe === '24H') {
      from = now - 86400;
      if (!resolution) resolution = '60'; // 1-hour bars for 24h
    } else if (timeframe === '7D') {
      from = now - 86400 * 7;
      if (!resolution) resolution = '1D';
    } else if (timeframe === '30D' || timeframe === 'ALL') {
      from = now - 86400 * 30;
      if (!resolution) resolution = '1D';
    } else {
      if (!resolution) resolution = '1D';
    }

    if (req.query.from) from = parseInt(req.query.from as string, 10);
    if (req.query.to) to = parseInt(req.query.to as string, 10);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (PYTH_API_KEY) {
      headers['Authorization'] = `Bearer ${PYTH_API_KEY}`;
    }

    // Try channels in order of preference
    const channelsToTry = [
      requestedChannel,
      'fixed_rate@200ms',
      'real_time',
      'fixed_rate@50ms',
    ].filter(Boolean);

    // Deduplicate
    const uniqueChannels = Array.from(new Set(channelsToTry));

    let historyJson: any = null;
    let successfulChannel: string | null = null;
    let lastStatusCode = 404;
    let lastErrorText = '';

    for (const ch of uniqueChannels) {
      const url = `https://pyth.dourolabs.app/v1/${ch}/history?symbol=${encodeURIComponent(
        pythSymbol
      )}&resolution=${resolution}&from=${from}&to=${to}`;

      try {
        const histRes = await fetch(url, { headers });
        lastStatusCode = histRes.status;

        if (histRes.status === 200) {
          historyJson = await histRes.json();
          successfulChannel = ch;
          break;
        } else if (histRes.status === 403) {
          lastErrorText = await histRes.text();
          // 403 means unentitled across channels, no need to retry other channels
          break;
        } else {
          lastErrorText = await histRes.text();
        }
      } catch (err: any) {
        lastErrorText = err.message;
      }
    }

    if (lastStatusCode === 403) {
      const fallbackHist = await fetchLiveBenchmarkHistory(pythSymbol || feedId, timeframe);
      if (fallbackHist && fallbackHist.bars && fallbackHist.bars.length > 0) {
        return res.json(fallbackHist);
      }
      return res.json({
        status: 'unsupported',
        bars: [],
        symbol: pythSymbol,
        timeframe,
        reason:
          'Pyth History API: Feed not entitled under current Pyth subscription tier (e.g. Cboe institutional exchange gate)',
        error: lastErrorText,
      });
    }

    // If market was closed over the weekend (commodities, FX, etc.), query the most recent trading period
    if (
      (!historyJson || historyJson.s !== 'ok' || !Array.isArray(historyJson.t) || historyJson.t.length === 0) &&
      (timeframe === '24H' || timeframe === '1H')
    ) {
      const fallbackFrom = now - 86400 * 4;
      for (const ch of uniqueChannels) {
        const url = `https://pyth.dourolabs.app/v1/${ch}/history?symbol=${encodeURIComponent(
          pythSymbol
        )}&resolution=${resolution}&from=${fallbackFrom}&to=${to}`;

        try {
          const histRes = await fetch(url, { headers });
          if (histRes.status === 200) {
            const retryJson = await histRes.json();
            if (retryJson.s === 'ok' && Array.isArray(retryJson.t) && retryJson.t.length > 0) {
              historyJson = retryJson;
              successfulChannel = ch;
              break;
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (!historyJson || historyJson.s !== 'ok' || !Array.isArray(historyJson.t) || historyJson.t.length === 0) {
      const fallbackHist = await fetchLiveBenchmarkHistory(pythSymbol || feedId, timeframe);
      if (fallbackHist && fallbackHist.bars && fallbackHist.bars.length > 0) {
        return res.json(fallbackHist);
      }
      return res.json({
        status: 'unavailable',
        bars: [],
        symbol: pythSymbol,
        timeframe,
        reason: 'No historical OHLC data available for this asset feed in requested interval',
      });
    }

    // Map UDF arrays (t, o, h, l, c, v) into structured price point bars
    const count = historyJson.t.length;
    const bars: Array<{
      time: string;
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      price?: number;
      volume?: number;
    }> = [];

    let minLow = Infinity;
    let maxHigh = -Infinity;

    for (let i = 0; i < count; i++) {
      const ts = historyJson.t[i] * 1000;
      const d = new Date(ts);
      const timeStr =
        timeframe === '24H' || timeframe === '1H'
          ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const o = Number(historyJson.o[i]);
      const h = Number(historyJson.h[i]);
      const l = Number(historyJson.l[i]);
      const c = Number(historyJson.c[i]);
      const v = historyJson.v ? Number(historyJson.v[i]) : undefined;

      if (l < minLow) minLow = l;
      if (h > maxHigh) maxHigh = h;

      bars.push({
        time: timeStr,
        timestamp: ts,
        open: o,
        high: h,
        low: l,
        close: c,
        price: c,
        volume: v,
      });
    }

    // Slice to 24 bars for 24H timeframe if expanded window was queried
    const finalBars = timeframe === '24H' && bars.length > 24 ? bars.slice(-24) : bars;
    const firstBar = finalBars[0];
    const lastBar = finalBars[finalBars.length - 1];
    const change24hPct = firstBar && firstBar.open > 0 ? ((lastBar.close - firstBar.open) / firstBar.open) * 100 : 0;
    const change24hValue = firstBar && lastBar ? lastBar.close - firstBar.open : 0;

    if (timeframe === '24H') {
      const statsObj: Stats24h = {
        change24hPct,
        change24hValue,
        high: maxHigh !== -Infinity ? maxHigh : null,
        low: minLow !== Infinity ? minLow : null,
        volume: finalBars.reduce((sum, b) => sum + (b.volume || 0), 0) || null,
        timestamp: Date.now(),
      };
      if (pythSymbol) stats24hCache.set(pythSymbol.toLowerCase(), statsObj);
      if (feedId) stats24hCache.set(feedId.toLowerCase(), statsObj);
    }

    return res.json({
      status: 'ok',
      symbol: pythSymbol,
      channel: successfulChannel,
      timeframe,
      resolution,
      bars: finalBars,
      change24hPct,
      change24hValue,
      high: maxHigh !== -Infinity ? maxHigh : null,
      low: minLow !== Infinity ? minLow : null,
      currentPrice: lastBar ? lastBar.close : null,
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', bars: [], error: err.message });
  }
});

// ==========================================
// 6. Pyth Asset Directory Catalog Proxy
// Proxies Hermes price_feeds with server-side caching & filtering
// ==========================================
app.get('/api/pyth/catalog', async (req, res) => {
  try {
    const query = (req.query.query as string || '').trim().toLowerCase();
    const assetType = (req.query.assetType as string || 'all').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string || '25', 10)));

    const allFeeds = await getHermesPriceFeeds();

    let filtered = allFeeds;

    // Filter by asset type category
    if (assetType !== 'all') {
      if (assetType === 'index' || assetType === 'fund') {
        filtered = filtered.filter((item) => {
          const s = (item.attributes?.symbol || '').toUpperCase();
          const d = (item.attributes?.description || '').toUpperCase();
          const disp = (item.attributes?.display_symbol || '').toUpperCase();
          return (
            disp === 'ARKB' ||
            disp === 'ARKK' ||
            disp === 'BITB' ||
            disp === 'IBIT' ||
            disp === 'SPY' ||
            disp === 'QQQ' ||
            disp === 'GLD' ||
            s.includes('SPY') ||
            s.includes('QQQ') ||
            s.includes('INDEX') ||
            s.includes('ETF') ||
            d.includes('INDEX') ||
            d.includes('ETF') ||
            d.includes('S&P') ||
            d.includes('NASDAQ') ||
            d.includes('FUND') ||
            d.includes('TRUST')
          );
        });
      } else if (assetType === 'bond' || assetType === 'rates' || assetType === 'treasury') {
        filtered = filtered.filter((item) => {
          const s = (item.attributes?.symbol || '').toUpperCase();
          const d = (item.attributes?.description || '').toUpperCase();
          const disp = (item.attributes?.display_symbol || '').toUpperCase();
          const t = (item.attributes?.asset_type || '').toLowerCase();
          return (
            disp === 'USDY' ||
            disp === 'GOVT' ||
            disp === 'TLT' ||
            disp === 'SHV' ||
            disp === 'IEF' ||
            disp === 'HYG' ||
            disp === 'US10Y' ||
            disp === 'US2Y' ||
            disp === 'US3M' ||
            d.includes('TREASURY') ||
            d.includes('BOND') ||
            d.includes('YIELD') ||
            d.includes('NOTE') ||
            d.includes('BILL') ||
            t === 'rates'
          );
        });
      } else if (assetType === 'commodity' || assetType === 'metal') {
        filtered = filtered.filter((item) => {
          const s = (item.attributes?.symbol || '').toUpperCase();
          const d = (item.attributes?.description || '').toUpperCase();
          const disp = (item.attributes?.display_symbol || '').toUpperCase();
          const t = (item.attributes?.asset_type || '').toLowerCase();
          return (
            t === 'metal' ||
            disp === 'PAXG' ||
            disp === 'XAUT' ||
            disp === 'XAU' ||
            disp === 'XAUUSD' ||
            disp === 'XAG' ||
            disp === 'XAGUSD' ||
            disp === 'USO' ||
            d.includes('GOLD') ||
            d.includes('SILVER') ||
            d.includes('OIL') ||
            d.includes('COPPER') ||
            d.includes('PLATINUM') ||
            d.includes('PALLADIUM')
          );
        });
      } else if (assetType === 'rwa') {
        filtered = filtered.filter((item) => {
          const t = (item.attributes?.asset_type || '').toLowerCase();
          const d = (item.attributes?.description || '').toUpperCase();
          const disp = (item.attributes?.display_symbol || '').toUpperCase();
          return (
            t === 'metal' ||
            t === 'rates' ||
            disp === 'USDY' ||
            disp === 'PAXG' ||
            disp === 'XAUT' ||
            d.includes('TREASURY') ||
            d.includes('BOND') ||
            d.includes('GOLD') ||
            d.includes('COMMODITY')
          );
        });
      } else {
        filtered = filtered.filter(
          (item) => (item.attributes?.asset_type || '').toLowerCase() === assetType
        );
      }
    }

    // Filter by search query
    if (query) {
      filtered = filtered.filter((item) => {
        const display = (item.attributes?.display_symbol || '').toLowerCase();
        const sym = (item.attributes?.symbol || '').toLowerCase();
        const desc = (item.attributes?.description || '').toLowerCase();
        return display.includes(query) || sym.includes(query) || desc.includes(query);
      });
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const rawItems = filtered.slice(startIndex, startIndex + pageSize);

    // Enrich items with inferred institutional metadata
    const items = rawItems.map((item) => {
      const sym = item.attributes?.symbol || '';
      const disp = item.attributes?.display_symbol || sym;
      const desc = item.attributes?.description || sym;
      const rawType = item.attributes?.asset_type || '';
      const issuer = inferIssuerName(sym, disp, desc, rawType);
      const category = inferCategoryLabel(sym, disp, desc, rawType);

      return {
        ...item,
        attributes: {
          ...item.attributes,
          inferred_issuer: issuer,
          inferred_category: category,
        },
      };
    });

    return res.json({
      items,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      source: 'Pyth Hermes API',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Mount Vite Middleware (Dev) or Static (Prod)
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('[Valtics Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Valtics Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function start() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Valtics Full-Stack Server running on port ${PORT}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Valtics Server] Port ${PORT} already in use.`);
      } else {
        console.error('[Valtics Server] Server error:', err);
      }
    });
  } catch (err) {
    console.error('[Valtics Server] Failed to initialize server:', err);
  }
}

start().catch((err) => {
  console.error('[Valtics Server] Fatal error during startup:', err);
});

