export type ClusterNetwork = 'devnet' | 'mainnet-beta' | 'custom';

export interface RpcEndpointConfig {
  name: string;
  network: ClusterNetwork;
  endpoint: string;
  wsEndpoint?: string;
  isCustom?: boolean;
}

export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  uri?: string;
  supply?: string;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  isToken2022?: boolean;
}

export type MigrationOptionType = 'MET_DAMM' | 'MET_DAMM_V2';

export interface DBCPoolState {
  poolAddress: string;
  configAddress: string;
  baseMint: string;
  quoteMint: string;
  baseVault: string;
  quoteVault: string;
  creator: string;
  migrationOption: number; // 0: DAMM v1, 1: DLMM/DAMM v2
  migrationOptionLabel: MigrationOptionType;
  baseReserve: string;
  quoteReserve: string;
  quoteThreshold: string;
  currentPrice: number; // Quote per base token
  startPrice: number;
  migrationPrice: number;
  quoteCurveProgressPct: number; // 0 to 100
  baseCurveProgressPct: number; // 0 to 100
  isMigrated: boolean;
  baseFeeBps: number;
  activationSlot?: number;
  slot?: number;
  lastUpdated?: number;
  tokenName?: string;
  tokenSymbol?: string;
  rwaCategory?: 'Real Estate' | 'Private Credit' | 'Treasuries' | 'Equity' | 'Structured Note';
  referencePrice?: number; // e.g. Par/NAV price if available ($1.00 or $10.50)
  referencePriceLabel?: string; // e.g. "Par NAV" or "Quarterly Appraised NAV"
  tvlUsd?: number; // Calculated TVL
  activity24h?: {
    tradeCount: number;
    volumeUsd: number;
    priceChange24hPct?: number;
    isIndexed: boolean; // false if indexer unavailable
  };
  curveType?: CurveAlgorithmType;
  antiSniperSlots?: number;
  liquidityLockDays?: number;
  creatorFeeShareBps?: number;
  totalSupply?: number;
  curveAllocationTokens?: number;
  network?: ClusterNetwork;
  description?: string;
  riskNotes?: {
    impermanentLossRisk: string;
    liquidityLock: string;
    slippageBound: string;
    oracleDependency: string;
  };
}

export type CurveAlgorithmType = 'linear' | 'exponential' | 'sigmoid' | 'piecewise';

export interface CurveModelParams {
  curveType: CurveAlgorithmType;
  totalSupply: number; // e.g. 100,000,000 tokens
  allocationToCurvePct: number; // e.g. 80%
  startPriceUsd: number; // Initial valuation / spot price in quote
  migrationMarketCapUsd: number; // Valuation at graduation
  quoteAsset: 'SOL' | 'USDC' | 'USDT';
  quotePriceUsd: number; // For conversions (e.g. SOL = $150)
  feeBps: number; // Basis points (e.g. 100 = 1%)
  antiSniperSlots: number; // Rate limiter slots
  migrationTarget: MigrationOptionType;
  vestingDays: number; // LP token vesting / lock period
}

export interface CurvePoint {
  step: number;
  tokensSold: number;
  tokensSoldPct: number;
  tokensRemaining: number;
  currentPriceQuote: number;
  currentPriceUsd: number;
  accumulatedQuote: number;
  accumulatedQuoteUsd: number;
  marketCapUsd: number;
  slippageBuy1000UsdPct: number;
}

export interface CreateMarketFormData {
  // Asset
  isNewMint: boolean;
  baseMint: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
  curveAllocationTokens: string;
  quoteMint: string;
  quoteSymbol: 'SOL' | 'USDC';
  
  // Curve Parameters
  curveType: CurveAlgorithmType;
  startingPriceQuote: string;
  migrationPriceQuote: string;
  migrationQuoteThreshold: string;
  
  // Fee Architecture
  baseFeeBps: number;
  dynamicFeeEnabled: boolean;
  feeDecaySeconds: number;
  maxPriceChangeBps: number;
  
  // Protection & Liquidity Migration
  antiSniperRateLimiterSeconds: number;
  migrationOption: MigrationOptionType;
  liquidityLockDays: number;
  creatorFeePercentage: number;
  
  // Verification
  rwaComplianceNotes?: string;
}

export interface TransactionIntent {
  title: string;
  description: string;
  programId: string;
  network: ClusterNetwork;
  instructionsCount: number;
  estimatedFeeSol: number;
  rentExemptReserveSol: number;
  requiredSigners: string[];
  accounts: {
    label: string;
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }[];
  criticalParameters: {
    label: string;
    value: string;
    flagged?: boolean;
  }[];
}

export interface OnChainActivityLog {
  signature: string;
  blockTime: number;
  slot: number;
  poolAddress: string;
  type: 'pool_created' | 'swap' | 'fees_claimed' | 'migration_triggered' | 'liquidity_locked';
  user: string;
  amountQuote?: string;
  amountBase?: string;
  feeAmount?: string;
  status: 'confirmed' | 'finalized' | 'failed';
}
