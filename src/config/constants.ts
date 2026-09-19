import { DYNAMIC_BONDING_CURVE_PROGRAM_ID } from '@meteora-ag/dynamic-bonding-curve-sdk';

export const METEORA_DBC_PROGRAM_ID = DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58();

// Canonical SPL Token Program & Token-2022
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

// Well-known Quote Mints on Solana Devnet
export const QUOTE_MINTS = {
  devnet: {
    SOL: {
      symbol: 'SOL',
      name: 'Wrapped SOL',
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin (Devnet)',
      mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      decimals: 6,
    },
  },
};

// Protocol Boundaries (aligned with Meteora Dynamic Bonding Curve specification)
export const PROTOCOL_BOUNDS = {
  MIN_FEE_BPS: 25, // 0.25%
  MAX_FEE_BPS: 1000, // 10%
  MAX_CREATOR_FEE_SHARE_BPS: 5000, // 50% max creator revenue share
  MIN_LOCK_DAYS: 0,
  MAX_LOCK_DAYS: 3650, // 10 years max liquidity lock
  MAX_RATE_LIMITER_SECONDS: 3600, // 1 hour anti-sniper window
};

// Reference DBC Pools on Solana Devnet (Clean: empty array, all pools must be real on-chain entities)
export const REFERENCE_POOLS: any[] = [];

export function getExplorerUrl(
  addressOrTx: string,
  type: 'address' | 'tx' = 'address',
  network: string = 'devnet'
): string {
  const clusterParam = '?cluster=devnet';
  return `https://explorer.solana.com/${type}/${addressOrTx}${clusterParam}`;
}
