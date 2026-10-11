import { DBCPoolState, AppEnvironment } from '../types';
import { Connection, PublicKey } from '@solana/web3.js';
import { getMeteoraPool } from './meteoraService';

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

export function isMarketAlreadyCreated(baseMint: string, poolAddress?: string): { exists: boolean; pool?: DBCPoolState } {
  const existing = getCreatedMarkets();
  const match = existing.find(
    (p) => (baseMint && p.baseMint === baseMint) || (poolAddress && p.poolAddress === poolAddress)
  );
  return {
    exists: Boolean(match),
    pool: match,
  };
}

export function saveCreatedMarket(pool: DBCPoolState, _environment?: AppEnvironment): void {
  if (typeof window === 'undefined') return;
  try {
    const now = new Date();
    // Deterministic market identifier anchored to the on-chain pool address
    const marketId = (pool as any).marketId || `devnet-${pool.poolAddress.slice(0, 10)}`;

    const enriched: DBCPoolState = {
      ...pool,
      network: 'devnet',
      createdAt: pool.createdAt || now.toISOString(),
      creationDate:
        pool.creationDate ||
        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...({
        environment: 'devnet',
        marketId,
        authenticatedCreatorWallet: (pool as any).authenticatedCreatorWallet || pool.creator,
        onChainVerified: true,
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

/**
 * Reconciles a cached market against live on-chain Solana blockchain state.
 * The blockchain is the sole source of truth; if cache disagrees, updates from ledger.
 */
export async function reconcileMarketWithBlockchain(
  poolAddress: string,
  connection: Connection
): Promise<{
  reconciled: boolean;
  pool: DBCPoolState | null;
  differenceDetected: boolean;
  discrepancies: string[];
}> {
  const localPool = getMarketByAddress(poolAddress);
  const discrepancies: string[] = [];

  try {
    const pubkey = new PublicKey(poolAddress);
    const onChainDetails = await getMeteoraPool(connection, pubkey);

    if (!onChainDetails) {
      if (localPool) {
        discrepancies.push('Pool exists in local cache but was not found on Solana Devnet ledger.');
      }
      return {
        reconciled: false,
        pool: localPool,
        differenceDetected: discrepancies.length > 0,
        discrepancies,
      };
    }

    let differenceDetected = false;

    if (localPool) {
      if (localPool.baseMint && onChainDetails.baseMint && localPool.baseMint !== onChainDetails.baseMint) {
        discrepancies.push(`Base mint mismatch: Cache=${localPool.baseMint}, Ledger=${onChainDetails.baseMint}`);
        differenceDetected = true;
      }
      if (localPool.quoteMint && onChainDetails.quoteMint && localPool.quoteMint !== onChainDetails.quoteMint) {
        discrepancies.push(`Quote mint mismatch: Cache=${localPool.quoteMint}, Ledger=${onChainDetails.quoteMint}`);
        differenceDetected = true;
      }
      if (localPool.isMigrated !== onChainDetails.isMigrated) {
        discrepancies.push(`Migration status mismatch: Cache=${localPool.isMigrated}, Ledger=${onChainDetails.isMigrated}`);
        differenceDetected = true;
      }
    }

    // Reconcile and update cache with verified on-chain data
    const reconciledPool: DBCPoolState = {
      ...(localPool || ({} as any)),
      poolAddress: onChainDetails.poolAddress,
      baseMint: onChainDetails.baseMint || localPool?.baseMint || '',
      quoteMint: onChainDetails.quoteMint || localPool?.quoteMint || '',
      baseVault: onChainDetails.baseVault || localPool?.baseVault || '',
      quoteVault: onChainDetails.quoteVault || localPool?.quoteVault || '',
      isMigrated: onChainDetails.isMigrated,
      quoteCurveProgressPct: onChainDetails.quoteCurveProgressPct,
      baseCurveProgressPct: onChainDetails.baseCurveProgressPct,
      network: 'devnet',
      currentPrice: localPool?.currentPrice || 0,
      quoteReserve: onChainDetails.quoteReserve || localPool?.quoteReserve || '0',
      baseReserve: onChainDetails.baseReserve || localPool?.baseReserve || '0',
      ...({
        onChainVerified: true,
        lastReconciledAt: new Date().toISOString(),
      } as any),
    };

    saveCreatedMarket(reconciledPool, 'devnet');

    return {
      reconciled: true,
      pool: reconciledPool,
      differenceDetected,
      discrepancies,
    };
  } catch (err: any) {
    console.warn(`Failed to reconcile market ${poolAddress}:`, err?.message);
    return {
      reconciled: false,
      pool: localPool,
      differenceDetected: false,
      discrepancies: [err?.message || 'RPC communication failure during reconciliation'],
    };
  }
}

export function getMarketByAddress(address: string): DBCPoolState | null {
  const all = getCreatedMarkets();
  return (
    all.find(
      (p) =>
        p.poolAddress === address ||
        p.baseMint === address ||
        (p as any).marketId === address
    ) || null
  );
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
