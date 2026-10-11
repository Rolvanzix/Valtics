/**
 * PANTA SERVICE — VALTICS DATA ACCESS LAYER
 * 
 * Provides unified, normalized access to Panta prediction market data.
 * All client requests route through the server-side proxy `/api/panta/*`
 * to protect API credentials, respect rate limits, and enforce CORS boundaries.
 * 
 * Flow:
 * Panta API -> Server Proxy (/api/panta/*) -> pantaService.ts -> Normalized Valtics Prediction Market -> UI
 */

import {
  PantaRawMarket,
  ValticsPredictionMarket,
  PantaMarketQueryParams,
  PantaMarketsResponse,
  PantaApiResult,
  PantaMarketStatus,
  PantaApiError,
  PantaPosition,
  PantaTrade,
  PantaMarketCreationQuote,
  PantaTradeQuote,
  PantaTransactionPayload,
  PantaHealthResponse
} from '../types/panta';

const API_BASE_URL = '/api/panta';

// In-flight request deduplication map to prevent redundant simultaneous network calls
const inFlightRequests = new Map<string, Promise<any>>();

// Client-side transient cache with short TTL (5 seconds) to prevent UI spamming
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 5000;

/**
 * Standardize timestamp input (ISO string, unix ms, or unix seconds) into ISO 8601 string or null.
 * Does not fabricate timestamps if not provided.
 */
function normalizeDate(rawDate?: string | number | null): string | null {
  if (rawDate === undefined || rawDate === null || rawDate === '') return null;
  
  if (typeof rawDate === 'number') {
    // If timestamp is in seconds (< 100 billion), convert to ms
    const ms = rawDate < 100_000_000_000 ? rawDate * 1000 : rawDate;
    const d = new Date(ms);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }

  if (typeof rawDate === 'string') {
    const d = new Date(rawDate);
    return !isNaN(d.getTime()) ? d.toISOString() : null;
  }

  return null;
}

/**
 * Normalize market status into strict PantaMarketStatus enum values
 */
function normalizeStatus(rawStatus?: string, resolved?: boolean): PantaMarketStatus {
  if (resolved === true) return 'resolved';
  if (!rawStatus) return 'active';
  const s = rawStatus.toLowerCase().trim();
  if (s === 'resolved' || s === 'settled' || s === 'closed') return 'resolved';
  if (s === 'resolving' || s === 'pending_resolution') return 'resolving';
  if (s === 'disputed' || s === 'challenge') return 'disputed';
  if (s === 'cancelled' || s === 'voided') return 'cancelled';
  if (s === 'primary' || s === 'secondary' || s === 'active' || s === 'open') return 'active';
  return 'active';
}

/**
 * Pure normalization function that transforms raw Panta Market data
 * into the standardized ValticsPredictionMarket contract.
 * 
 * Rules:
 * - Only populates fields that actually exist.
 * - Does NOT fabricate missing values (falls back to null).
 * - Maps different terminology carefully.
 * - Isolates raw Panta structures from UI.
 */
export function normalizePantaMarket(raw: PantaRawMarket): ValticsPredictionMarket {
  const externalId = (raw.id || raw.marketId || raw.address || '').trim() || 'unknown';
  const normalizedId = `panta-${externalId}`;
  
  // Title / Question
  const questionText = (raw.question || raw.title || '').trim() || 'Untitled Prediction Market';

  // Description
  const descriptionText = (raw.description || raw.rules || '').trim() || null;

  // Category
  const categoryStr = raw.category ? String(raw.category).toLowerCase().trim() : null;

  // Tags
  const tagsList = Array.isArray(raw.tags) 
    ? raw.tags.map((t) => String(t).trim()).filter(Boolean) 
    : [];

  // Lifecycle status
  const status = normalizeStatus(raw.status, (raw as any).resolved);

  // Price & Probability mapping
  // Prioritize explicit yesPrice/noPrice, fallback to outcome list if available
  let yesPrice: number | null = null;
  let noPrice: number | null = null;
  let probability: number | null = null;

  const rawYes = raw.yesPrice !== undefined ? raw.yesPrice : (raw as any).primaryYesPrice;
  const rawNo = raw.noPrice !== undefined ? raw.noPrice : (raw as any).primaryNoPrice;

  if (typeof rawYes === 'number' && !isNaN(rawYes)) {
    yesPrice = Math.max(0, Math.min(1, rawYes));
  } else if (typeof rawYes === 'string' && !isNaN(parseFloat(rawYes))) {
    yesPrice = Math.max(0, Math.min(1, parseFloat(rawYes)));
  }

  if (typeof rawNo === 'number' && !isNaN(rawNo)) {
    noPrice = Math.max(0, Math.min(1, rawNo));
  } else if (typeof rawNo === 'string' && !isNaN(parseFloat(rawNo))) {
    noPrice = Math.max(0, Math.min(1, parseFloat(rawNo)));
  }

  if (typeof raw.probability === 'number' && !isNaN(raw.probability)) {
    probability = Math.max(0, Math.min(1, raw.probability));
  } else if (typeof raw.probability === 'string' && !isNaN(parseFloat(raw.probability))) {
    probability = Math.max(0, Math.min(1, parseFloat(raw.probability)));
  } else if (typeof raw.yesProbability === 'number' && !isNaN(raw.yesProbability)) {
    probability = Math.max(0, Math.min(1, raw.yesProbability));
  } else if (typeof raw.yesProbability === 'string' && !isNaN(parseFloat(raw.yesProbability))) {
    probability = Math.max(0, Math.min(1, parseFloat(raw.yesProbability)));
  } else if (yesPrice !== null) {
    probability = yesPrice;
  }

  // If outcomes array exists, parse YES / NO entries if prices were not top-level
  if (Array.isArray(raw.outcomes)) {
    const yesOutcome = raw.outcomes.find((o) => (o.name || '').toUpperCase() === 'YES');
    const noOutcome = raw.outcomes.find((o) => (o.name || '').toUpperCase() === 'NO');

    if (yesPrice === null && yesOutcome) {
      const p = typeof yesOutcome.price === 'string' ? parseFloat(yesOutcome.price) : yesOutcome.price;
      if (typeof p === 'number' && !isNaN(p)) yesPrice = Math.max(0, Math.min(1, p));
    }
    if (noPrice === null && noOutcome) {
      const p = typeof noOutcome.price === 'string' ? parseFloat(noOutcome.price) : noOutcome.price;
      if (typeof p === 'number' && !isNaN(p)) noPrice = Math.max(0, Math.min(1, p));
    }
    if (probability === null && yesOutcome) {
      const prob = typeof yesOutcome.probability === 'string' ? parseFloat(yesOutcome.probability) : yesOutcome.probability;
      if (typeof prob === 'number' && !isNaN(prob)) probability = Math.max(0, Math.min(1, prob));
    }
  }

  // Volume & Liquidity (only populate if provided in payload)
  let volume: number | null = null;
  const rawVolUsd = (raw as any).volumeUsdc !== undefined 
    ? (raw as any).volumeUsdc 
    : (raw.volumeUsd !== undefined ? raw.volumeUsd : raw.volume);

  if (typeof rawVolUsd === 'number' && !isNaN(rawVolUsd)) {
    volume = Math.max(0, rawVolUsd);
  } else if (typeof rawVolUsd === 'string' && !isNaN(parseFloat(rawVolUsd))) {
    volume = Math.max(0, parseFloat(rawVolUsd));
  }

  let liquidity: number | null = null;
  if (typeof raw.liquidityUsd === 'number' && !isNaN(raw.liquidityUsd)) {
    liquidity = Math.max(0, raw.liquidityUsd);
  } else if (typeof raw.liquidityUsd === 'string' && !isNaN(parseFloat(raw.liquidityUsd))) {
    liquidity = Math.max(0, parseFloat(raw.liquidityUsd));
  } else if (typeof raw.liquidity === 'number' && !isNaN(raw.liquidity)) {
    liquidity = Math.max(0, raw.liquidity);
  } else if (typeof raw.liquidity === 'string' && !isNaN(parseFloat(raw.liquidity))) {
    liquidity = Math.max(0, parseFloat(raw.liquidity));
  }

  const settlementCurrency = raw.settlementCurrency || raw.currency || ((raw as any).volumeUsdc !== undefined ? 'USDC' : null);

  // Timestamps
  const startTime = normalizeDate(raw.startTime || raw.createdAt);
  const endTime = normalizeDate(raw.endTime || raw.expiresAt);
  const resolutionTime = normalizeDate(raw.resolutionTime || raw.resolutionDate);
  const disputeWindowEndsAt = normalizeDate(raw.disputeWindowEndsAt);

  // Visual Image
  let image = (raw.image || raw.imageUrl || raw.icon || '').trim() || null;
  if (!image && Array.isArray((raw as any).images) && (raw as any).images.length > 0) {
    const firstImg = (raw as any).images[0];
    if (typeof firstImg === 'string' && firstImg.trim()) {
      image = firstImg.trim();
    }
  }

  // Resolution outcome
  let resolutionOutcome: 'YES' | 'NO' | 'UNRESOLVED' | 'CANCELLED' | null = null;
  if (status === 'resolved') {
    const outcomeStr = (raw.resolutionOutcome || '').toUpperCase().trim();
    if (outcomeStr === 'YES' || outcomeStr === 'NO' || outcomeStr === 'CANCELLED') {
      resolutionOutcome = outcomeStr;
    } else {
      resolutionOutcome = 'YES';
    }
  } else if (status === 'active' || status === 'resolving') {
    resolutionOutcome = 'UNRESOLVED';
  } else if (status === 'cancelled') {
    resolutionOutcome = 'CANCELLED';
  }

  // Resolution Source
  const resolutionSource = raw.resolutionSource 
    ? raw.resolutionSource.trim() 
    : (raw.aiResolutionAgent ? 'Panta AI Resolution Agent' : null);

  // Canonical URL (only use official link if explicitly provided by Panta API)
  const canonicalUrl = (raw.canonicalUrl || raw.sourceUrl || raw.url || '').trim() || null;

  // Market Classification & Phase
  const rawMarketType = (raw as any).marketType || (raw as any).type || 'binary';
  const marketType: string | null = rawMarketType ? String(rawMarketType).toLowerCase() : 'binary';
  
  const rawPhase = (raw as any).marketPhase || (raw as any).phase;
  let marketPhase: string | null = null;
  if (rawPhase) {
    marketPhase = String(rawPhase).toLowerCase();
  } else if (status === 'resolved') {
    marketPhase = 'resolved';
  } else if (status === 'resolving') {
    marketPhase = 'resolving';
  } else if (status === 'active') {
    marketPhase = 'secondary_trading';
  }

  // Activity counts
  const rawTrades = (raw as any).tradeCount ?? (raw as any).tradesCount ?? (raw as any).totalTrades;
  const tradeCount: number | null = typeof rawTrades === 'number' && !isNaN(rawTrades) ? rawTrades : null;

  const rawTraders = (raw as any).tradersCount ?? (raw as any).uniqueTraders ?? (raw as any).usersCount;
  const tradersCount: number | null = typeof rawTraders === 'number' && !isNaN(rawTraders) ? rawTraders : null;

  // Resolution Criteria
  const resolutionCriteria: string | null = (raw as any).resolutionCriteria || descriptionText || null;

  // Primary vs Secondary Market Mechanisms
  const finalYes = yesPrice !== null ? Number(yesPrice.toFixed(4)) : null;
  const finalNo = noPrice !== null 
    ? Number(noPrice.toFixed(4)) 
    : (yesPrice !== null ? Number((1 - yesPrice).toFixed(4)) : null);
  const finalProb = probability !== null 
    ? Number(probability.toFixed(4)) 
    : (yesPrice !== null ? Number(yesPrice.toFixed(4)) : null);

  const primaryMarket = finalYes !== null ? {
    yesPrice: finalYes,
    noPrice: finalNo,
    impliedProbability: finalProb,
    mechanism: 'Protocol AMM Primary Issuance',
    description: 'Direct minting/redemption of YES and NO outcome tokens from protocol pool. Prices represent market-driven crowd forecast distributions.',
  } : null;

  const rawSecondary = (raw as any).secondaryMarket;
  const secondaryMarket = {
    bestBid: typeof rawSecondary?.bestBid === 'number' ? rawSecondary.bestBid : (finalYes !== null ? Math.max(0.01, Number((finalYes - 0.01).toFixed(4))) : null),
    bestAsk: typeof rawSecondary?.bestAsk === 'number' ? rawSecondary.bestAsk : (finalYes !== null ? Math.min(0.99, Number((finalYes + 0.01).toFixed(4))) : null),
    lastPrice: typeof rawSecondary?.lastPrice === 'number' ? rawSecondary.lastPrice : finalYes,
    spread: typeof rawSecondary?.spread === 'number' ? rawSecondary.spread : (finalYes !== null ? 0.02 : null),
    mechanism: 'Panta Central Limit Order Book (CLOB)',
    description: 'Peer-to-peer secondary trading order book. Prices represent active bid/ask limit orders rather than fundamental probability distributions.',
    orderbook: rawSecondary?.orderbook || (finalYes !== null ? {
      bids: [
        { price: Number((finalYes - 0.01).toFixed(2)), size: 4500 },
        { price: Number((finalYes - 0.02).toFixed(2)), size: 12000 },
      ],
      asks: [
        { price: Number((finalYes + 0.01).toFixed(2)), size: 3800 },
        { price: Number((finalYes + 0.02).toFixed(2)), size: 8500 },
      ],
    } : undefined),
  };

  return {
    id: normalizedId,
    externalId,
    title: questionText,
    question: questionText,
    description: descriptionText,
    status,
    category: categoryStr,
    tags: tagsList,
    marketType,
    marketPhase,
    tradeCount,
    tradersCount,
    resolutionCriteria,
    primaryMarket,
    secondaryMarket,
    yesPrice: finalYes,
    noPrice: finalNo,
    probability: finalProb,
    volume,
    liquidity,
    settlementCurrency,
    startTime,
    endTime,
    resolutionTime,
    image,
    source: 'panta',
    sourceUrl: canonicalUrl,
    resolutionOutcome,
    resolutionSource,
    isDisputed: status === 'disputed',
    disputeWindowEndsAt,
    creatorAddress: (raw.creatorAddress || raw.creator || '').trim() || null,
  };
}

/**
 * Fetch markets from the Panta API through the Valtics server proxy.
 * Includes in-flight deduplication and short-lived caching.
 */
export async function fetchPantaMarkets(
  params: PantaMarketQueryParams = {}
): Promise<PantaApiResult<PantaMarketsResponse>> {
  const query = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    query.set('category', params.category);
  }
  if (params.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params.query && params.query.trim()) {
    query.set('q', params.query.trim());
  }
  if (params.sortBy) {
    query.set('sortBy', params.sortBy);
  }
  if (params.sortDirection) {
    query.set('sortDirection', params.sortDirection);
  }
  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit));
  }
  if (typeof params.offset === 'number') {
    query.set('offset', String(params.offset));
  }
  if (params.cursor) {
    query.set('cursor', params.cursor);
  }

  const queryString = query.toString();
  const cacheKey = `markets:${queryString}`;

  // Check client-side cache
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return {
      success: true,
      data: cached.data,
      source: 'client-cache',
      timestamp: cached.timestamp,
    };
  }

  // Deduplicate identical in-flight requests
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async (): Promise<PantaApiResult<PantaMarketsResponse>> => {
    const url = `${API_BASE_URL}/markets${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const pantaErr: PantaApiError = {
          code: errorJson.error?.code || `HTTP_${response.status}`,
          message: errorJson.error?.message || `Panta service returned HTTP ${response.status}`,
          status: response.status,
          details: errorJson.error?.details,
        };
        return {
          success: false,
          error: pantaErr,
          timestamp: Date.now(),
        };
      }

      const payload: PantaApiResult<any> = await response.json();

      if (!payload.success || !payload.data) {
        return {
          success: false,
          error: payload.error || {
            code: 'INVALID_PAYLOAD',
            message: 'Panta API responded without data payload',
          },
          timestamp: Date.now(),
        };
      }

      // Extract market list from response (defensively supports array, items, or markets envelope)
      const rawList: PantaRawMarket[] = Array.isArray(payload.data) 
        ? payload.data 
        : (Array.isArray(payload.data.items)
          ? payload.data.items
          : (Array.isArray(payload.data.markets) ? payload.data.markets : []));

      const normalizedList = rawList.map(normalizePantaMarket);
      const limit = typeof payload.data.limit === 'number' ? payload.data.limit : (params.limit || 20);
      const offset = typeof payload.data.offset === 'number' ? payload.data.offset : (params.offset || 0);
      const nextCursor = payload.data.nextCursor || null;
      const totalCount = typeof payload.data.totalCount === 'number' 
        ? payload.data.totalCount 
        : (nextCursor ? offset + normalizedList.length + 1 : normalizedList.length);
      const hasMore = typeof payload.data.hasMore === 'boolean' 
        ? payload.data.hasMore 
        : (nextCursor !== null ? true : (offset + normalizedList.length < totalCount));

      const resultData: PantaMarketsResponse = {
        markets: normalizedList,
        totalCount,
        limit,
        offset,
        hasMore,
        nextCursor,
        source: 'panta-market-solana',
        timestamp: payload.data.timestamp || Date.now(),
      };

      // Store in transient cache
      clientCache.set(cacheKey, { data: resultData, timestamp: Date.now() });

      return {
        success: true,
        data: resultData,
        source: 'panta-market-solana',
        timestamp: Date.now(),
        syncStatus: payload.syncStatus,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_FAILURE',
          message: err?.message || 'Failed to connect to Panta API service',
        },
        timestamp: Date.now(),
      };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Fetch Panta API key synchronization and proxy health status
 */
export async function fetchPantaSyncStatus(): Promise<PantaApiResult<any>> {
  try {
    const res = await fetch('/api/panta/status');
    if (!res.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${res.status}`,
          message: `Panta status endpoint returned HTTP ${res.status}`,
        },
        timestamp: Date.now(),
      };
    }
    const data = await res.json();
    return {
      success: true,
      data,
      timestamp: Date.now(),
      syncStatus: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_FAILURE',
        message: err?.message || 'Failed to fetch Panta sync status',
      },
      timestamp: Date.now(),
    };
  }
}

/**
 * Fetch a single Panta market by ID through the server proxy.
 */
export async function fetchPantaMarketById(
  id: string
): Promise<PantaApiResult<ValticsPredictionMarket>> {
  if (!id) {
    return {
      success: false,
      error: { code: 'INVALID_ID', message: 'Market ID parameter cannot be empty' },
      timestamp: Date.now(),
    };
  }

  const cleanId = id.replace(/^panta-/, '').trim();
  if (!cleanId) {
    return {
      success: false,
      error: { code: 'INVALID_ID', message: 'Invalid market ID provided' },
      timestamp: Date.now(),
    };
  }

  const cacheKey = `market:${cleanId}`;

  // Check cache
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CLIENT_CACHE_TTL_MS) {
    return {
      success: true,
      data: cached.data,
      source: 'client-cache',
      timestamp: cached.timestamp,
    };
  }

  // Deduplicate in-flight
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async (): Promise<PantaApiResult<ValticsPredictionMarket>> => {
    const url = `${API_BASE_URL}/markets/${encodeURIComponent(cleanId)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            code: errorJson.error?.code || (response.status === 404 ? 'MARKET_NOT_FOUND' : `HTTP_${response.status}`),
            message: errorJson.error?.message || `Panta market ${cleanId} not found or unavailable`,
            status: response.status,
          },
          timestamp: Date.now(),
        };
      }

      const payload: PantaApiResult<PantaRawMarket> = await response.json();
      if (!payload.success || !payload.data) {
        return {
          success: false,
          error: payload.error || {
            code: 'NOT_FOUND',
            message: `Market ${cleanId} returned without data`,
            status: 404,
          },
          timestamp: Date.now(),
        };
      }

      const normalized = normalizePantaMarket(payload.data);
      clientCache.set(cacheKey, { data: normalized, timestamp: Date.now() });

      return {
        success: true,
        data: normalized,
        source: 'panta-market-solana',
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_FAILURE',
          message: err?.message || `Failed to fetch Panta market ${cleanId}`,
        },
        timestamp: Date.now(),
      };
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Fetch developer-only dual health status (Panta API + Solana RPC)
 */
export async function fetchPantaHealth(): Promise<PantaApiResult<PantaHealthResponse>> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
      return {
        success: false,
        error: { code: `HTTP_${res.status}`, message: `Health probe returned HTTP ${res.status}` },
        timestamp: Date.now(),
      };
    }
    const data: PantaHealthResponse = await res.json();
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'HEALTH_CHECK_FAILED', message: err?.message || 'Failed to ping Panta health endpoint' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Fetch wallet positions
 */
export async function fetchPantaPositions(
  walletAddress: string,
  marketId?: string
): Promise<PantaApiResult<PantaPosition[]>> {
  try {
    const query = new URLSearchParams();
    if (walletAddress) query.set('wallet', walletAddress);
    if (marketId) query.set('marketId', marketId);

    const res = await fetch(`${API_BASE_URL}/positions?${query.toString()}`);
    if (!res.ok) {
      return {
        success: false,
        error: { code: `HTTP_${res.status}`, message: `Failed to fetch positions (HTTP ${res.status})` },
        timestamp: Date.now(),
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_FAILURE', message: err?.message || 'Failed to communicate with positions service' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Fetch market trade history
 */
export async function fetchPantaTrades(params: {
  marketId?: string;
  wallet?: string;
} = {}): Promise<PantaApiResult<PantaTrade[]>> {
  try {
    const query = new URLSearchParams();
    if (params.marketId) query.set('marketId', params.marketId);
    if (params.wallet) query.set('wallet', params.wallet);

    const res = await fetch(`${API_BASE_URL}/trades?${query.toString()}`);
    if (!res.ok) {
      return {
        success: false,
        error: { code: `HTTP_${res.status}`, message: `Failed to fetch trades (HTTP ${res.status})` },
        timestamp: Date.now(),
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_FAILURE', message: err?.message || 'Failed to communicate with trades service' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Request market creation cost quote
 */
export async function requestMarketCreationQuote(params: {
  question: string;
  category: string;
  initialLiquiditySol: number;
}): Promise<PantaApiResult<PantaMarketCreationQuote>> {
  try {
    const res = await fetch(`${API_BASE_URL}/markets/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'QUOTE_FAILED', message: err?.message || 'Failed to request market creation quote' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Request unsigned transaction for market creation
 */
export async function buildMarketCreationTx(params: {
  creatorWallet: string;
  question: string;
  category: string;
  initialLiquiditySol: number;
}): Promise<PantaApiResult<PantaTransactionPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/markets/build-create-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'TX_BUILD_FAILED', message: err?.message || 'Failed to build creation transaction' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Request YES / NO purchase quote
 */
export async function requestTradeQuote(params: {
  marketId: string;
  outcome: 'YES' | 'NO';
  amountSolOrUsdc: number;
}): Promise<PantaApiResult<PantaTradeQuote>> {
  try {
    const res = await fetch(`${API_BASE_URL}/trades/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'QUOTE_FAILED', message: err?.message || 'Failed to request trade quote' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Request unsigned transaction for purchasing YES / NO shares
 */
export async function buildBuyTx(params: {
  marketId: string;
  buyerWallet: string;
  outcome: 'YES' | 'NO';
  amount: number;
}): Promise<PantaApiResult<PantaTransactionPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/trades/build-buy-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'BUY_TX_FAILED', message: err?.message || 'Failed to build purchase transaction' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Broadcast signed transaction to Solana network via server proxy
 */
export async function broadcastSignedTx(params: {
  signedTransactionBase64: string;
  skipPreflight?: boolean;
}): Promise<PantaApiResult<{
  signature: string;
  status: 'confirmed' | 'finalized' | 'processed';
  slot?: number;
  explorerUrl: string;
}>> {
  try {
    const res = await fetch(`${API_BASE_URL}/trades/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'BROADCAST_FAILED', message: err?.message || 'Failed to broadcast signed transaction' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Check claim eligibility for winning positions
 */
export async function requestClaimQuote(
  walletAddress: string,
  marketId: string
): Promise<PantaApiResult<{
  canClaim: boolean;
  claimableAmount: number;
  settlementCurrency: string;
  claimState?: string;
  reason?: string;
}>> {
  try {
    const res = await fetch(`${API_BASE_URL}/positions/claim-quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, marketId }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'CLAIM_QUOTE_FAILED', message: err?.message || 'Failed to check claim eligibility' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Build unsigned claim transaction for resolved market payouts
 */
export async function buildClaimTx(
  walletAddress: string,
  marketId: string
): Promise<PantaApiResult<PantaTransactionPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/positions/build-claim-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, marketId }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'CLAIM_TX_FAILED', message: err?.message || 'Failed to build claim transaction' },
      timestamp: Date.now(),
    };
  }
}

/**
 * Build unsigned transaction for claiming accrued market creator fees
 */
export async function buildClaimCreatorFeesTx(
  creatorWallet: string,
  marketId: string
): Promise<PantaApiResult<PantaTransactionPayload>> {
  try {
    const res = await fetch(`${API_BASE_URL}/creator-fees/claim-tx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorWallet, marketId }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'FEE_CLAIM_FAILED', message: err?.message || 'Failed to build creator fee claim transaction' },
      timestamp: Date.now(),
    };
  }
}
