import { DBCPoolState, AppEnvironment } from '../types';

const STORAGE_KEY = 'valtics_created_dbc_markets_v1';
const LISTEN_EVENT = 'valtics_market_created';

export function getCreatedMarkets(_environment?: AppEnvironment): DBCPoolState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: DBCPoolState[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('Failed to parse created markets from localStorage:', err);
    return [];
  }
}

export function saveCreatedMarket(pool: DBCPoolState, _environment?: AppEnvironment): void {
  if (typeof window === 'undefined') return;
  try {
    const now = new Date();
    const marketId = (pool as any).marketId || `devnet-mkt-${Math.random().toString(36).substring(2, 10)}`;

    const enriched: DBCPoolState = {
      ...pool,
      network: 'testnet',
      createdAt: pool.createdAt || now.toISOString(),
      creationDate:
        pool.creationDate ||
        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...({
        environment: 'devnet',
        marketId,
        authenticatedCreatorWallet: (pool as any).authenticatedCreatorWallet || pool.creator,
      } as any),
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
  return all.find((p) => p.poolAddress === address || p.baseMint === address || (p as any).marketId === address) || null;
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
