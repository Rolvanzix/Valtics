/**
 * PANTA PREDICTION MARKET INTEGRATION TYPES
 * 
 * Formal type definitions for the Panta Market infrastructure layer on Solana,
 * and the normalized Valtics prediction-market model.
 * 
 * Architecture boundary:
 * Panta Raw API Contract -> Normalized Valtics Prediction Market -> UI Consumers
 */

/**
 * Valid market lifecycle states in Panta Market
 */
export type PantaMarketStatus = 'active' | 'resolving' | 'resolved' | 'disputed' | 'cancelled';

/**
 * Panta category classification
 */
export type PantaCategory = 
  | 'crypto'
  | 'technology'
  | 'politics'
  | 'sports'
  | 'entertainment'
  | 'finance'
  | 'current-events'
  | 'other';

/**
 * Raw outcome data from Panta Market
 */
export interface PantaOutcomeData {
  name: 'YES' | 'NO' | string;
  price?: number; // Share price in settlement currency (0.00 - 1.00)
  probability?: number; // 0.00 to 1.00
  sharesOutstanding?: number;
  totalInvested?: number;
}

/**
 * Raw Panta Market API schema representing a prediction market on Solana.
 * Defensively typed to accommodate alternative naming conventions used by Panta.
 */
export interface PantaRawMarket {
  // Identification
  id?: string;
  marketId?: string;
  address?: string;

  // Title / Question & Description
  title?: string;
  question?: string;
  description?: string;
  rules?: string;

  // Categorization
  category?: PantaCategory | string;
  tags?: string[];

  // Lifecycle Status
  status?: PantaMarketStatus | string;

  // Pricing & Probabilities
  yesPrice?: number;
  noPrice?: number;
  probability?: number; // Implied YES probability
  yesProbability?: number;
  noProbability?: number;
  outcomes?: PantaOutcomeData[];

  // Volume & Liquidity (SOL, USDC, or USD)
  volume?: number;
  volumeUsd?: number;
  liquidity?: number;
  liquidityUsd?: number;
  currency?: 'SOL' | 'USDC' | string;
  settlementCurrency?: string;

  // Timestamps (ISO 8601 strings or Unix ms/sec numbers)
  createdAt?: string | number;
  startTime?: string | number;
  expiresAt?: string | number;
  endTime?: string | number;
  resolutionDate?: string | number | null;
  resolutionTime?: string | number | null;

  // Resolution Details
  resolutionOutcome?: 'YES' | 'NO' | 'CANCELLED' | string | null;
  resolutionSource?: string;
  aiResolutionAgent?: {
    model?: string;
    resolvedAt?: string;
    confidence?: number;
    evidenceSummary?: string;
  };
  disputeWindowEndsAt?: string | number | null;

  // Visuals & URLs
  image?: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  canonicalUrl?: string;
  sourceUrl?: string;
  url?: string;

  // On-Chain Metadata
  creatorAddress?: string;
  creator?: string;
  creatorFeeBps?: number;
  programId?: string;
}

/**
 * Normalized Valtics Prediction Market Model.
 * This is the ONLY shape UI components (Markets page, future Predictions page) consume,
 * insulating Valtics from raw Panta API changes.
 */
export interface ValticsPredictionMarket {
  id: string; // Normalized ID (e.g. "panta-[market_id]")
  externalId: string; // Raw Panta market ID / Solana PDA
  title: string; // Question or title
  question: string; // Explicit alias for title/question
  description: string | null; // Rules or description if present
  status: PantaMarketStatus;
  category: string | null;
  tags: string[];
  
  // Probability & Price metrics
  yesPrice: number | null;
  noPrice: number | null;
  probability: number | null; // Main probability (YES probability, 0.00 to 1.00)
  
  // Volume & Liquidity
  volume: number | null; // Volume in settlement tokens / USD
  liquidity: number | null; // Active liquidity depth
  settlementCurrency: string | null; // e.g. "SOL" or "USDC"
  
  // Key Dates (standardized ISO 8601 strings or null)
  startTime: string | null;
  endTime: string | null;
  resolutionTime: string | null;
  
  // Visual Asset
  image: string | null;
  
  // Market Classification & Phase
  marketType: 'binary' | 'orderbook' | 'categorical' | 'scalar' | string | null;
  marketPhase: 'primary_issuance' | 'secondary_trading' | 'resolving' | 'resolved' | 'disputed' | string | null;
  
  // Activity Metrics
  tradeCount: number | null;
  tradersCount: number | null;
  
  // Primary vs Secondary Market Mechanisms
  primaryMarket?: {
    yesPrice: number | null;
    noPrice: number | null;
    impliedProbability: number | null;
    mechanism: string;
    description: string;
  } | null;
  secondaryMarket?: {
    bestBid: number | null;
    bestAsk: number | null;
    lastPrice: number | null;
    spread: number | null;
    mechanism: string;
    description: string;
    orderbook?: {
      bids: Array<{ price: number; size: number }>;
      asks: Array<{ price: number; size: number }>;
    };
  } | null;

  // Source & Canonical Reference
  source: 'panta';
  sourceUrl: string | null; // Canonical link if provided by Panta API (do not invent)
  
  // Resolution details if resolved or disputed
  resolutionCriteria: string | null;
  resolutionOutcome: 'YES' | 'NO' | 'UNRESOLVED' | 'CANCELLED' | null;
  resolutionSource: string | null;
  isDisputed: boolean;
  disputeWindowEndsAt: string | null;
  
  // On-chain creator address if available
  creatorAddress: string | null;
}

/**
 * Filter & query parameters for Panta market discovery
 */
export interface PantaMarketQueryParams {
  category?: string;
  status?: PantaMarketStatus | 'all';
  query?: string;
  sortBy?: 'volume' | 'liquidity' | 'createdAt' | 'endTime' | 'probability';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  cursor?: string | null;
}

/**
 * Paginated API envelope for Panta market list
 */
export interface PantaMarketsResponse {
  markets: ValticsPredictionMarket[];
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextCursor?: string | null;
  source: 'panta-market-solana';
  timestamp: number;
}

/**
 * Standardized API Error Container
 */
export interface PantaApiError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, any>;
}

/**
 * Synchronization and Health status for Panta API Key & Proxy
 */
export interface PantaSyncStatus {
  configured: boolean;
  keyFingerprint: string | null;
  keyLength?: number;
  apiUrl?: string;
  status?: string;
  liveUpstream?: boolean;
  upstreamStatus?: number;
  message?: string;
  timestamp?: number;
}

/**
 * Generic API result container with error handling
 */
export interface PantaApiResult<T> {
  success: boolean;
  data?: T;
  error?: PantaApiError;
  source?: string;
  timestamp?: number;
  syncStatus?: PantaSyncStatus;
}

/**
 * User wallet prediction position in Panta market
 */
export interface PantaPosition {
  id: string;
  marketId: string;
  marketTitle: string;
  walletAddress: string;
  outcome: 'YES' | 'NO';
  shares: number;
  averageCost: number;
  totalInvested: number;
  currentValue: number | null;
  currentPrice?: number | null;
  unrealizedPnl: number | null;
  canClaim: boolean;
  claimed: boolean;
  claimState?: 'not_claimable' | 'pending_resolution' | 'waiting_for_dispute' | 'claimable' | 'already_claimed' | 'claim_unavailable';
  claimableAmount?: number;
  settlementCurrency: string;
  marketPhase?: 'primary_issuance' | 'secondary_trading' | 'resolving' | 'resolved' | 'disputed' | string;
  marketStatus?: PantaMarketStatus;
  resolutionTime?: string | null;
  endTime?: string | null;
  resolutionOutcome?: 'YES' | 'NO' | 'UNRESOLVED' | 'CANCELLED' | null;
  updatedAt: string;
}

/**
 * Historical or recent trade record
 */
export interface PantaTrade {
  id: string;
  marketId: string;
  marketTitle: string;
  walletAddress: string;
  outcome: 'YES' | 'NO';
  amount: number;
  shares: number;
  price: number;
  transactionSignature?: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  attributionSource?: string;
}

/**
 * Quote for market creation
 */
export interface PantaMarketCreationQuote {
  rentFeeLamports: number;
  initialLiquidityRequired: number;
  creationFeeLamports: number;
  estimatedTotalSol: number;
  settlementCurrency: string;
  quoteExpiry: number;
}

/**
 * Quote for trading YES / NO shares
 */
export interface PantaTradeQuote {
  marketId: string;
  outcome: 'YES' | 'NO';
  amount: number;
  expectedShares: number;
  averagePrice: number;
  estimatedSlippagePct: number;
  feeLamports: number;
  potentialPayout: number;
  quoteExpiry: number;
}

/**
 * Unsigned transaction payload returned by server for wallet signing
 */
export interface PantaTransactionPayload {
  transactionBase64: string;
  lastValidBlockHeight?: number;
  recentBlockhash?: string;
  network: 'devnet' | 'testnet' | 'mainnet-beta';
  description: string;
}

/**
 * Formal health response for Panta and Solana infrastructure
 */
export interface PantaHealthResponse {
  pantaApi: 'CONNECTED' | 'ERROR';
  solanaRpc: 'CONNECTED' | 'ERROR';
  environment: 'DEVNET' | 'TESTNET';
  keyConfigured: boolean;
  keyFingerprint: string | null;
  solanaSlot?: number;
  latencyMs?: number;
  details?: Record<string, any>;
  timestamp: number;
}
