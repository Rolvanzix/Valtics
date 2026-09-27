import { DBCPoolState } from '../types';
import { getCreatedMarkets } from './marketStorage';
import { batchFetchPythPrices } from './pythMarketData';
import { fetchPythHistoricalOHLC } from './pyth';
import { PythFeedItem } from './pythReference';

export type ScreenerCategory =
  | 'all'
  | 'equity'
  | 'commodity'
  | 'fund'
  | 'bond'
  | 'crypto'
  | 'rwa';

export interface ScreenerAsset {
  id: string; // Pyth Feed ID or Pool Address
  symbol: string; // Clean ticker, e.g. "BTC", "SOL", "ARKB", "PAXG", "GOVT", "AAPL"
  displaySymbol: string; // e.g. "BTC / USD", "ARKB", "AAPL"
  name: string; // e.g. "Bitcoin", "Ark 21Shares Bitcoin ETF", "Paxos Gold", "Apple Inc."
  category:
    | 'Tokenized Equities'
    | 'Tokenized Commodities'
    | 'Tokenized Funds'
    | 'Tokenized Bonds'
    | 'Tokenized Digital Assets'
    | 'Tokenized Real-World Assets';
  rawAssetType: string;
  price: number | null;
  confidence: number | null;
  change24hPct: number | null;
  change24hValue: number | null;
  high24h: number | null;
  low24h: number | null;
  volume: number | null;
  marketCap: number | null;
  supply: string | null;
  issuer: string;
  marketStatus: 'Live' | 'Market Closed' | 'Carried Forward' | 'Unsupported' | 'Unavailable';
  statusText: string;
  isAvailable: boolean;
  mintAddress: string;
  poolAddress?: string;
  pythFeedId?: string;
  pythSymbol?: string;
  feedItem?: PythFeedItem;
  poolState?: DBCPoolState;
  provenance: 'Pyth Oracle' | 'Issuer Disclosed' | 'Valtics DevNet';
}

export interface ScreenerResult {
  assets: ScreenerAsset[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  lastUpdated: number;
  source: string;
}

export type ScreenerSortField =
  | 'name'
  | 'symbol'
  | 'price'
  | 'change24hPct'
  | 'high24h'
  | 'low24h'
  | 'volume'
  | 'marketCap'
  | 'issuer'
  | 'category'
  | 'status';

export type SortDirection = 'asc' | 'desc';

// Memory cache for screener results to prevent rapid spamming
const screenerCache = new Map<string, { data: ScreenerResult; timestamp: number }>();
const CACHE_TTL_MS = 6000; // 6 seconds

// In-flight tracking of history requests so we don't duplicate
const inFlightHistory = new Set<string>();

/**
 * Normalizes symbol to clean ticker
 */
export function cleanSymbol(symbol: string, displaySymbol?: string): string {
  if (displaySymbol && displaySymbol.length <= 8 && !displaySymbol.includes('/')) {
    return displaySymbol.toUpperCase();
  }
  if (!symbol) return 'ASSET';
  if (symbol.includes('/')) {
    const left = symbol.split('/')[0];
    const parts = left.split('.');
    return parts[parts.length - 1].toUpperCase();
  }
  return symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Converts a raw Pyth item + batch price + stats into a standardized ScreenerAsset
 */
export function buildScreenerAsset(
  item: PythFeedItem,
  priceData?: {
    price: number | null;
    confidence?: number | null;
    change24hPct?: number | null;
    change24hValue?: number | null;
    high24h?: number | null;
    low24h?: number | null;
    volume?: number | null;
    status: string;
    isAvailable: boolean;
  }
): ScreenerAsset {
  const sym = item.attributes?.symbol || '';
  const disp = item.attributes?.display_symbol || sym;
  const desc = item.attributes?.description || sym;
  const rawType = item.attributes?.asset_type || '';

  const symbol = cleanSymbol(sym, disp);
  const name = (desc.split('/')[0] || symbol).trim();
  const issuer =
    (item.attributes as any)?.inferred_issuer ||
    (rawType.toLowerCase() === 'equity' ? `${name} Inc.` : 'Pyth Oracle Benchmark');
  const category =
    ((item.attributes as any)?.inferred_category as ScreenerAsset['category']) ||
    (rawType.toLowerCase() === 'equity'
      ? 'Tokenized Equities'
      : rawType.toLowerCase() === 'metal'
      ? 'Tokenized Commodities'
      : rawType.toLowerCase() === 'crypto'
      ? 'Tokenized Digital Assets'
      : 'Tokenized Real-World Assets');

  const price = priceData?.price !== undefined ? priceData.price : null;
  const change24hPct = priceData?.change24hPct !== undefined ? priceData.change24hPct : null;
  const change24hValue = priceData?.change24hValue !== undefined ? priceData.change24hValue : null;
  const high24h = priceData?.high24h !== undefined ? priceData.high24h : null;
  const low24h = priceData?.low24h !== undefined ? priceData.low24h : null;
  const volume = priceData?.volume !== undefined ? priceData.volume : null;

  const isOpen = item.market_hours ? item.market_hours.is_open : true;
  let marketStatus: ScreenerAsset['marketStatus'] = 'Live';
  let statusText = 'Live Pyth Feed';

  if (priceData?.status === 'unsupported') {
    marketStatus = 'Unsupported';
    statusText = 'Institutional license required';
  } else if (!isOpen) {
    marketStatus = 'Market Closed';
    statusText = 'Market Closed • Carried forward';
  } else if (price === null) {
    marketStatus = 'Unavailable';
    statusText = 'Feed unavailable';
  } else {
    marketStatus = 'Live';
    statusText = 'Live oracle';
  }

  return {
    id: item.id,
    symbol,
    displaySymbol: disp || `${symbol} / USD`,
    name,
    category,
    rawAssetType: rawType,
    price,
    confidence: priceData?.confidence ?? null,
    change24hPct,
    change24hValue,
    high24h,
    low24h,
    volume,
    marketCap: null, // Pyth doesn't fabricate market cap
    supply: null,
    issuer,
    marketStatus,
    statusText,
    isAvailable: priceData?.isAvailable ?? (price !== null && price > 0),
    mintAddress: item.id,
    pythFeedId: item.id,
    pythSymbol: sym,
    feedItem: item,
    provenance: 'Pyth Oracle',
  };
}

/**
 * Converts an on-chain DevNet DBC pool into a ScreenerAsset
 */
export function buildDevNetPoolAsset(pool: DBCPoolState): ScreenerAsset {
  const symbol = pool.tokenSymbol || 'DBC';
  const name = pool.tokenName || `Asset ${symbol}`;
  const price = pool.currentPrice || null;
  const changePct = pool.activity24h?.priceChange24hPct ?? null;
  const volume = pool.activity24h?.volumeUsd ?? (pool.tvlUsd ? pool.tvlUsd * 0.12 : null);

  let category: ScreenerAsset['category'] = 'Tokenized Real-World Assets';
  if (pool.rwaCategory === 'Treasuries') category = 'Tokenized Bonds';
  else if (pool.rwaCategory === 'Equity') category = 'Tokenized Equities';
  else if (pool.rwaCategory === 'Real Estate' || pool.rwaCategory === 'Private Credit') {
    category = 'Tokenized Real-World Assets';
  }

  const supplyNum = parseFloat(pool.baseReserve?.replace(/,/g, '') || '0') || 1000000;
  const marketCap = price && price > 0 ? price * supplyNum : (pool.tvlUsd || null);

  return {
    id: pool.poolAddress,
    symbol,
    displaySymbol: `${symbol} / SOL`,
    name,
    category,
    rawAssetType: pool.rwaCategory || 'DevNet Market',
    price,
    confidence: null,
    change24hPct: changePct,
    change24hValue: null,
    high24h: price ? price * 1.05 : null,
    low24h: price ? price * 0.95 : null,
    volume,
    marketCap,
    supply: pool.baseReserve || '1,000,000',
    issuer: pool.creator ? `Issuer ${pool.creator.slice(0, 6)}...` : 'Valtics DevNet Issuer',
    marketStatus: 'Live',
    statusText: 'Valtics DevNet Bonding Curve',
    isAvailable: true,
    mintAddress: pool.baseMint || pool.poolAddress,
    poolAddress: pool.poolAddress,
    poolState: pool,
    provenance: 'Valtics DevNet',
  };
}

/**
 * Primary screener data loader
 * Coordinates Pyth catalog + on-chain DevNet pools + live batch prices + 24h stats
 */
export async function fetchScreenerData(params: {
  category?: ScreenerCategory;
  query?: string;
  page?: number;
  pageSize?: number;
  sortBy?: ScreenerSortField;
  sortDirection?: SortDirection;
}): Promise<ScreenerResult> {
  const {
    category = 'all',
    query = '',
    page = 1,
    pageSize = 25,
    sortBy = 'volume',
    sortDirection = 'desc',
  } = params;

  const cacheKey = `${category}_${query.trim().toLowerCase()}_${page}_${pageSize}_${sortBy}_${sortDirection}`;
  const now = Date.now();
  const cached = screenerCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Fetch Pyth catalog items from backend proxy
  const catalogUrl = new URL('/api/pyth/catalog', window.location.origin);
  if (query.trim()) catalogUrl.searchParams.set('query', query.trim());
  if (category !== 'all') catalogUrl.searchParams.set('assetType', category);
  catalogUrl.searchParams.set('page', page.toString());
  catalogUrl.searchParams.set('pageSize', pageSize.toString());

  let pythItems: PythFeedItem[] = [];
  let totalCount = 0;
  let totalPages = 1;

  try {
    const res = await fetch(catalogUrl.toString());
    if (res.ok) {
      const json = await res.json();
      pythItems = json.items || [];
      totalCount = json.totalCount || 0;
      totalPages = json.totalPages || 1;
    }
  } catch (err) {
    console.warn('Failed to load Pyth catalog for screener:', err);
  }

  // 2. Fetch on-chain DevNet created pools (if applicable)
  const devnetMarkets = getCreatedMarkets();
  let devnetAssets: ScreenerAsset[] = [];
  if (page === 1) {
    devnetAssets = devnetMarkets.map(buildDevNetPoolAsset);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      devnetAssets = devnetAssets.filter(
        (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') {
      if (category === 'bond') devnetAssets = devnetAssets.filter((a) => a.category === 'Tokenized Bonds');
      else if (category === 'equity') devnetAssets = devnetAssets.filter((a) => a.category === 'Tokenized Equities');
      else if (category === 'rwa') devnetAssets = devnetAssets.filter((a) => a.category === 'Tokenized Real-World Assets');
      else devnetAssets = [];
    }
  }

  // 3. Batch fetch prices for Pyth items
  const feedIds = pythItems.map((it) => it.id);
  let batchPrices: Record<string, any> = {};
  if (feedIds.length > 0) {
    try {
      batchPrices = await batchFetchPythPrices(feedIds);
    } catch (err) {
      console.warn('Batch price fetch failed:', err);
    }
  }

  // 4. Construct unified ScreenerAsset array
  const pythAssets: ScreenerAsset[] = pythItems.map((item) => {
    const priceInfo = batchPrices[item.id.toLowerCase()] || batchPrices[item.id];
    return buildScreenerAsset(item, priceInfo);
  });

  // Combine DevNet assets + Pyth assets
  let allAssets = [...devnetAssets, ...pythAssets];

  // 5. In background, fetch 24h stats for top active items without 24h stats
  pythAssets.slice(0, 10).forEach((asset) => {
    if (
      asset.isAvailable &&
      asset.change24hPct === null &&
      asset.pythFeedId &&
      !inFlightHistory.has(asset.pythFeedId)
    ) {
      inFlightHistory.add(asset.pythFeedId);
      fetchPythHistoricalOHLC(asset.pythFeedId, '24H')
        .then((res) => {
          if (res.status === 'ok' && res.change24hPct !== null) {
            asset.change24hPct = res.change24hPct;
            asset.change24hValue = res.change24hValue ?? null;
            asset.high24h = res.high ?? null;
            asset.low24h = res.low ?? null;
          }
        })
        .finally(() => {
          inFlightHistory.delete(asset.pythFeedId!);
        });
    }
  });

  // 6. Sort assets
  allAssets.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'price': {
        const valA = a.price;
        const valB = b.price;
        if (valA === null && valB === null) comparison = 0;
        else if (valA === null) comparison = 1;
        else if (valB === null) comparison = -1;
        else comparison = valA - valB;
        break;
      }
      case 'change24hPct': {
        const valA = a.change24hPct;
        const valB = b.change24hPct;
        if (valA === null && valB === null) comparison = 0;
        else if (valA === null) comparison = 1;
        else if (valB === null) comparison = -1;
        else comparison = valA - valB;
        break;
      }
      case 'high24h': {
        const valA = a.high24h;
        const valB = b.high24h;
        if (valA === null && valB === null) comparison = 0;
        else if (valA === null) comparison = 1;
        else if (valB === null) comparison = -1;
        else comparison = valA - valB;
        break;
      }
      case 'low24h': {
        const valA = a.low24h;
        const valB = b.low24h;
        if (valA === null && valB === null) comparison = 0;
        else if (valA === null) comparison = 1;
        else if (valB === null) comparison = -1;
        else comparison = valA - valB;
        break;
      }
      case 'volume': {
        const valA = a.volume;
        const valB = b.volume;
        if (valA === null && valB === null) comparison = 0;
        else if (valA === null) comparison = 1;
        else if (valB === null) comparison = -1;
        else comparison = valA - valB;
        break;
      }
      case 'marketCap': {
        const valA = a.marketCap;
        const valB = b.marketCap;
        if (valA === null && valB === null) comparison = 0;
        else if (valA === null) comparison = 1;
        else if (valB === null) comparison = -1;
        else comparison = valA - valB;
        break;
      }
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'symbol':
        comparison = a.symbol.localeCompare(b.symbol);
        break;
      case 'issuer':
        comparison = a.issuer.localeCompare(b.issuer);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'status':
        comparison = a.marketStatus.localeCompare(b.marketStatus);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const result: ScreenerResult = {
    assets: allAssets,
    totalCount: totalCount + devnetAssets.length,
    page,
    pageSize,
    totalPages,
    lastUpdated: now,
    source: 'Pyth Network Hermes Reference Oracle',
  };

  screenerCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}
