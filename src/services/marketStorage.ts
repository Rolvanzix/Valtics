import { DBCPoolState } from '../types';

const STORAGE_KEY = 'valtics_created_dbc_markets_v1';
const LISTEN_EVENT = 'valtics_market_created';

export function getCreatedMarkets(): DBCPoolState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse created markets from localStorage:', err);
    return [];
  }
}

export function saveCreatedMarket(pool: DBCPoolState): void {
  if (typeof window === 'undefined') return;
  try {
    const now = new Date();
    const enriched: DBCPoolState = {
      ...pool,
      createdAt: pool.createdAt || now.toISOString(),
      creationDate:
        pool.creationDate ||
        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    const existing = getCreatedMarkets();
    const updated = [enriched, ...existing.filter((p) => p.poolAddress !== pool.poolAddress)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(LISTEN_EVENT, { detail: enriched }));
  } catch (err) {
    console.warn('Failed to persist created market to localStorage:', err);
  }
}

export function getMarketByAddress(address: string): DBCPoolState | null {
  const all = getCreatedMarkets();
  return all.find((p) => p.poolAddress === address || p.baseMint === address) || null;
}

export function onMarketCreated(callback: (pool: DBCPoolState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<DBCPoolState>;
    if (custom.detail) callback(custom.detail);
  };
  window.addEventListener(LISTEN_EVENT, handler);
  return () => window.removeEventListener(LISTEN_EVENT, handler);
}
