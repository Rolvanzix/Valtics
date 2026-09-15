import { Connection, PublicKey } from '@solana/web3.js';
import {
  DynamicBondingCurveClient,
  DYNAMIC_BONDING_CURVE_PROGRAM_ID,
  MigrationOption,
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import { DBCPoolState } from '../types';

let cachedClient: { rpcUrl: string; client: DynamicBondingCurveClient } | null = null;

export function getMeteoraDbcClient(connection: Connection, rpcUrl: string): DynamicBondingCurveClient {
  if (cachedClient && cachedClient.rpcUrl === rpcUrl) {
    return cachedClient.client;
  }
  const client = DynamicBondingCurveClient.create(connection);
  cachedClient = { rpcUrl, client };
  return client;
}

export async function fetchOnChainPool(
  connection: Connection,
  rpcUrl: string,
  poolAddress: string
): Promise<DBCPoolState | null> {
  try {
    const pubkey = new PublicKey(poolAddress);
    const client = getMeteoraDbcClient(connection, rpcUrl);

    const pool = await client.state.getPool(pubkey);
    if (!pool) return null;

    let quoteProgress = 0;
    try {
      const prog = await client.state.getPoolQuoteTokenCurveProgress(pubkey);
      if (prog) {
        quoteProgress = Number(prog) * 100;
      }
    } catch {
      // Progress calculation fallback if pool uninitialized or early stage
    }

    let baseProgress = 0;
    try {
      const bProg = await client.state.getPoolBaseTokenCurveProgress(pubkey);
      if (bProg) {
        baseProgress = Number(bProg) * 100;
      }
    } catch {
      // Ignore
    }

    const state: any = (pool as any).poolState || (pool as any).account || pool;
    const migrationOptionNum = state.migrationOption;
    const migrationOptionLabel = migrationOptionNum === MigrationOption.MET_DAMM ? 'MET_DAMM' : 'MET_DAMM_V2';

    // Retrieve quote mint & base fee from config account
    let quoteMint = 'So11111111111111111111111111111111111111112';
    let baseFeeBps = 25;
    let quoteThreshold = '0';
    if (state.config) {
      try {
        const config = await client.state.getPoolConfig(state.config);
        if (config?.quoteMint) quoteMint = config.quoteMint.toBase58();
        if (config?.poolFees?.baseFee?.firstFactor) {
          baseFeeBps = Number(config.poolFees.baseFee.firstFactor);
        }
        if (config?.migrationQuoteThreshold) {
          quoteThreshold = config.migrationQuoteThreshold.toString();
        }
      } catch {
        // Fallback
      }
    }

    // Estimate spot price from sqrtPrice if available
    let currentPrice = 0.0001;
    if (state.sqrtPrice) {
      try {
        const sqrtVal = Number(state.sqrtPrice.toString()) / (2 ** 64);
        currentPrice = sqrtVal * sqrtVal;
      } catch {
        // Fallback
      }
    }

    return {
      poolAddress: pubkey.toBase58(),
      configAddress: state.config?.toBase58?.() || '',
      baseMint: state.baseMint?.toBase58?.() || '',
      quoteMint,
      baseVault: state.baseVault?.toBase58?.() || '',
      quoteVault: state.quoteVault?.toBase58?.() || '',
      creator: state.creator?.toBase58?.() || '',
      migrationOption: migrationOptionNum ?? 1,
      migrationOptionLabel,
      baseReserve: state.baseReserve ? state.baseReserve.toString() : '0',
      quoteReserve: state.quoteReserve ? state.quoteReserve.toString() : '0',
      quoteThreshold: quoteThreshold !== '0' ? quoteThreshold : (state.migrationProgress ? state.migrationProgress.toString() : '0'),
      currentPrice: currentPrice > 0 ? currentPrice : 0.001,
      startPrice: currentPrice > 0 ? currentPrice : 0.001,
      migrationPrice: currentPrice > 0 ? currentPrice * 2.5 : 0.0025,
      quoteCurveProgressPct: Math.min(100, Math.max(0, quoteProgress)),
      baseCurveProgressPct: Math.min(100, Math.max(0, baseProgress)),
      isMigrated: !!state.isMigrated,
      baseFeeBps,
      activationSlot: state.activationSlot ? Number(state.activationSlot) : undefined,
    };
  } catch (err) {
    console.warn(`Could not fetch on-chain pool ${poolAddress}:`, err);
    return null;
  }
}

export async function fetchCreatorPools(
  connection: Connection,
  rpcUrl: string,
  creatorPubkeyStr: string
): Promise<DBCPoolState[]> {
  try {
    const creatorPubkey = new PublicKey(creatorPubkeyStr);
    const client = getMeteoraDbcClient(connection, rpcUrl);
    const pools = await client.state.getPoolsByCreator(creatorPubkey);
    if (!pools || !Array.isArray(pools)) return [];

    return pools.map((p: any) => {
      const state: any = p.poolState || p.account || p;
      const pubkey: PublicKey = p.publicKey || p.pubkey || creatorPubkey;
      const migrationOptionNum = state.migrationOption;
      const migrationOptionLabel = migrationOptionNum === MigrationOption.MET_DAMM ? 'MET_DAMM' : 'MET_DAMM_V2';
      return {
        poolAddress: pubkey.toBase58 ? pubkey.toBase58() : String(pubkey),
        configAddress: state.config?.toBase58?.() || '',
        baseMint: state.baseMint?.toBase58?.() || '',
        quoteMint: state.quoteMint?.toBase58?.() || '',
        baseVault: state.baseVault?.toBase58?.() || '',
        quoteVault: state.quoteVault?.toBase58?.() || '',
        creator: state.creator?.toBase58?.() || '',
        migrationOption: migrationOptionNum ?? 1,
        migrationOptionLabel,
        baseReserve: state.baseReserve ? state.baseReserve.toString() : '0',
        quoteReserve: state.quoteReserve ? state.quoteReserve.toString() : '0',
        quoteThreshold: '0',
        currentPrice: 0,
        startPrice: 0,
        migrationPrice: 0,
        quoteCurveProgressPct: 0,
        baseCurveProgressPct: 0,
        isMigrated: !!state.isMigrated,
        baseFeeBps: state.baseFeeBps || 50,
      };
    });
  } catch (err) {
    console.error('Error fetching creator pools from Meteora SDK:', err);
    return [];
  }
}

export { DYNAMIC_BONDING_CURVE_PROGRAM_ID };
