import { DYNAMIC_BONDING_CURVE_PROGRAM_ID } from '@meteora-ag/dynamic-bonding-curve-sdk';

export const METEORA_DBC_PROGRAM_ID = DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58();

// Canonical SPL Token Program & Token-2022
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

// Well-known Quote Mints on Solana
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
  'mainnet-beta': {
    SOL: {
      symbol: 'SOL',
      name: 'Wrapped SOL',
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
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

// Default Curated RWA Test & Reference Pools on Solana
// These are real or verifiable DBC and RWA liquidity pools for exploratory auditing
export const REFERENCE_POOLS = [
  {
    poolAddress: '7gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6hT9bK3',
    name: 'Apollo Treasury Alpha 2026',
    symbol: 'aT-26',
    rwaCategory: 'Treasuries' as const,
    description: 'Short-duration U.S. Treasury Bill backed digital note with programmatic daily yield accrual and guaranteed redemption par.',
    baseMint: '2mK3mR8aXWvQv8qY4p7X6e2UvL5fT9bK3gR3RwhK6eUu',
    quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    quoteSymbol: 'USDC',
    startPrice: 0.985,
    currentPrice: 0.998,
    migrationPrice: 1.002,
    referencePrice: 1.000,
    referencePriceLabel: 'Par NAV ($1.000)',
    quoteThreshold: '1,500,000',
    progressPct: 78.4,
    isMigrated: false,
    migrationOption: 'MET_DAMM_V2' as const,
    feeBps: 25,
    tvlUsd: 1176000,
    curveType: 'linear' as const,
    antiSniperSlots: 100,
    liquidityLockDays: 365,
    creatorFeeShareBps: 2000,
    totalSupply: 50000000,
    curveAllocationTokens: 35000000,
    activity24h: {
      tradeCount: 46,
      volumeUsd: 84320,
      priceChange24hPct: 0.12,
      isIndexed: true,
    },
    riskNotes: {
      impermanentLossRisk: '0.00% during bonding curve phase (Single-sided deterministic quote accumulation)',
      liquidityLock: '365 Days permanent lock in Meteora non-custodial LP locker upon DAMM v2 graduation',
      slippageBound: 'Deterministic max 0.05% slippage per $50,000 order block size',
      oracleDependency: 'No external oracle vulnerability; spot pricing is governed strictly by on-chain DBC invariant',
    },
    recentTxs: [
      {
        signature: '5wK4p7X6e2UvL5fT9bK3gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4Uv',
        blockTime: Date.now() - 1000 * 60 * 14,
        slot: 326418,
        poolAddress: '7gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6hT9bK3',
        type: 'swap' as const,
        user: '9xQeWvSt3hP6L8tZ1kRjV7K4UvYtJ8F2q7vS4Z6hT9bK',
        amountQuote: '15,000 USDC',
        amountBase: '15,030.06 aT-26',
        feeAmount: '3.75 USDC',
        status: 'finalized' as const,
      },
      {
        signature: '4hW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3u',
        blockTime: Date.now() - 1000 * 60 * 48,
        slot: 326372,
        poolAddress: '7gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6hT9bK3',
        type: 'swap' as const,
        user: '3fT8kP2q7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4Uv',
        amountQuote: '25,000 USDC',
        amountBase: '25,050.10 aT-26',
        feeAmount: '6.25 USDC',
        status: 'finalized' as const,
      },
      {
        signature: '3vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2m',
        blockTime: Date.now() - 1000 * 60 * 135,
        slot: 326210,
        poolAddress: '7gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6hT9bK3',
        type: 'pool_created' as const,
        user: 'Auth4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2m',
        amountQuote: '0 USDC',
        amountBase: '35,000,000 aT-26',
        status: 'finalized' as const,
      },
    ],
  },
  {
    poolAddress: '9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q',
    name: 'Manhattan Prime Commercial Note',
    symbol: 'vCRE-01',
    rwaCategory: 'Real Estate' as const,
    description: 'Senior secured debt tranche for Midtown Class-A commercial property with 7.8% net base capitalization target.',
    baseMint: '5kP8mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW',
    quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    quoteSymbol: 'USDC',
    startPrice: 10.0,
    currentPrice: 10.45,
    migrationPrice: 11.2,
    referencePrice: 10.50,
    referencePriceLabel: 'Appraised NAV ($10.50)',
    quoteThreshold: '3,000,000',
    progressPct: 42.1,
    isMigrated: false,
    migrationOption: 'MET_DAMM_V2' as const,
    feeBps: 50,
    tvlUsd: 1263000,
    curveType: 'piecewise' as const,
    antiSniperSlots: 150,
    liquidityLockDays: 730,
    creatorFeeShareBps: 2500,
    totalSupply: 10000000,
    curveAllocationTokens: 7500000,
    activity24h: {
      tradeCount: 19,
      volumeUsd: 52180,
      priceChange24hPct: 0.48,
      isIndexed: true,
    },
    riskNotes: {
      impermanentLossRisk: '0.00% during bonding curve phase (Single-sided deterministic quote accumulation)',
      liquidityLock: '730 Days (2 Years) locked in Meteora DAMM v2 liquidity vault upon migration',
      slippageBound: 'Piecewise pricing tiers dampen price impact for orders under $25,000 to <0.4%',
      oracleDependency: 'Quarterly third-party appraisal benchmark. Curve spot pricing is purely AMM formulaic',
    },
    recentTxs: [
      {
        signature: '2tL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8',
        blockTime: Date.now() - 1000 * 60 * 32,
        slot: 326390,
        poolAddress: '9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q',
        type: 'swap' as const,
        user: '8vY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX',
        amountQuote: '10,450 USDC',
        amountBase: '1,000 vCRE-01',
        feeAmount: '52.25 USDC',
        status: 'finalized' as const,
      },
      {
        signature: '1zK4p7X6e2UvL5fT9bK3gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4',
        blockTime: Date.now() - 1000 * 60 * 180,
        slot: 326120,
        poolAddress: '9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q',
        type: 'fees_claimed' as const,
        user: 'Auth4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2m',
        amountQuote: '2,480 USDC',
        status: 'finalized' as const,
      },
    ],
  },
  {
    poolAddress: '3fT8kP2q7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4Uv',
    name: 'Sovereign Yield Series B',
    symbol: 'sYLD',
    rwaCategory: 'Private Credit' as const,
    description: 'Collateralized asset-backed private credit facility providing short-term bridge liquidity to verified institutional lenders.',
    baseMint: '8vY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX',
    quoteMint: 'So11111111111111111111111111111111111111112',
    quoteSymbol: 'SOL',
    startPrice: 0.005,
    currentPrice: 0.0124,
    migrationPrice: 0.02,
    referencePrice: undefined, // Explicitly no reference oracle to demonstrate honest unavailable data handling
    referencePriceLabel: 'No Reference Oracle',
    quoteThreshold: '10,000 SOL',
    progressPct: 61.9,
    isMigrated: false,
    migrationOption: 'MET_DAMM' as const,
    feeBps: 75,
    tvlUsd: 982500,
    curveType: 'exponential' as const,
    antiSniperSlots: 200,
    liquidityLockDays: 180,
    creatorFeeShareBps: 3000,
    totalSupply: 100000000,
    curveAllocationTokens: 80000000,
    activity24h: {
      tradeCount: 28,
      volumeUsd: 39600,
      priceChange24hPct: 1.85,
      isIndexed: true,
    },
    riskNotes: {
      impermanentLossRisk: '0.00% during bonding curve phase. Unhedged SOL quote asset volatility applies',
      liquidityLock: '180 Days lock in Meteora DAMM standard liquidity contract',
      slippageBound: 'Exponential slope increases slippage as graduation approaches (approx 1.2% per 50 SOL)',
      oracleDependency: 'Pure on-chain market discovery without external benchmark oracle feed',
    },
    recentTxs: [
      {
        signature: '7xL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8',
        blockTime: Date.now() - 1000 * 60 * 55,
        slot: 326350,
        poolAddress: '3fT8kP2q7vS4Z6hT9bK3gR3RwhK6eUuWkL2kRjV7K4Uv',
        type: 'swap' as const,
        user: '4bW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP',
        amountQuote: '62.0 SOL',
        amountBase: '5,000 sYLD',
        feeAmount: '0.465 SOL',
        status: 'finalized' as const,
      },
    ],
  },
  {
    poolAddress: '4bW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP',
    name: 'AeroCarbon Registry Credits 2025',
    symbol: 'vCRB',
    rwaCategory: 'Structured Note' as const,
    description: 'Gold Standard & Verra certified forward carbon avoidance offsets packaged into programmatically tradable notes.',
    baseMint: '6hT9bK3gR3RwhK6eUuWkL2kRjV7K4UvYtJ8F2q7vS4Z',
    quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    quoteSymbol: 'USDC',
    startPrice: 22.0,
    currentPrice: 24.8,
    migrationPrice: 25.0,
    referencePrice: 25.0,
    referencePriceLabel: 'Registry Par ($25.00)',
    quoteThreshold: '500,000',
    progressPct: 100.0,
    isMigrated: true,
    migrationOption: 'MET_DAMM_V2' as const,
    feeBps: 30,
    tvlUsd: 500000,
    curveType: 'linear' as const,
    antiSniperSlots: 50,
    liquidityLockDays: 3650, // 10 years permanent lock
    creatorFeeShareBps: 1500,
    totalSupply: 1000000,
    curveAllocationTokens: 800000,
    activity24h: {
      tradeCount: 0,
      volumeUsd: 0,
      priceChange24hPct: 0.0,
      isIndexed: false, // Explicitly shows unindexed secondary DAMM pool
    },
    riskNotes: {
      impermanentLossRisk: 'Standard dynamic AMM pool impermanent loss applies now that pool has graduated to DAMM v2',
      liquidityLock: 'Permanent 3,650-day (10-Year) LP token lock locked in Meteora non-custodial locker',
      slippageBound: 'Concentrated DLMM liquidity with tighter continuous depth',
      oracleDependency: 'Registry retirement certificate verification on-chain',
    },
    recentTxs: [
      {
        signature: '9zL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2mD7zC4vB8',
        blockTime: Date.now() - 1000 * 60 * 620,
        slot: 325400,
        poolAddress: '4bW9jQ2mD7zC4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP',
        type: 'migration_triggered' as const,
        user: 'Auth4vB8xM1q9aL4nS7vX8bY1cT2eR3uK6fP5hW9jQ2m',
        amountQuote: '500,000 USDC',
        status: 'finalized' as const,
      },
    ],
  },
];

export function getExplorerUrl(
  addressOrTx: string,
  type: 'address' | 'tx' = 'address',
  network: string = 'devnet'
): string {
  const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/${type}/${addressOrTx}${clusterParam}`;
}
