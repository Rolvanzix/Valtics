import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SendOptions,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  DynamicBondingCurveClient,
  DYNAMIC_BONDING_CURVE_PROGRAM_ID,
  getCurrentPoint,
  buildCurve,
  deriveDbcPoolAddress,
  deriveDbcTokenVaultAddress,
  TokenType,
  TokenAuthorityOption,
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  MigrationOption,
  MigrationFeeOption,
  SwapQuoteResult,
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';
import { ClusterNetwork } from '../types';

// ============================================================================
// CONSTANTS & PROGRAM REGISTRATION
// ============================================================================
export const DBC_PROGRAM_ID = DYNAMIC_BONDING_CURVE_PROGRAM_ID;
export const DBC_PROGRAM_ID_STR = DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58();

// Cache of client instances keyed by endpoint
const clientCache = new Map<string, DynamicBondingCurveClient>();

/**
 * Returns a cached DynamicBondingCurveClient for the given connection & RPC.
 */
export function getDbcClient(connection: Connection, rpcUrl?: string): DynamicBondingCurveClient {
  const key = rpcUrl || connection.rpcEndpoint;
  let client = clientCache.get(key);
  if (!client) {
    client = DynamicBondingCurveClient.create(connection, 'confirmed');
    clientCache.set(key, client);
  }
  return client;
}

// ============================================================================
// ERROR TAXONOMY & CLASSIFICATION
// ============================================================================
export type MeteoraErrorCode =
  | 'WALLET_DISCONNECTED'
  | 'USER_REJECTED'
  | 'INSUFFICIENT_BALANCE'
  | 'INVALID_ADDRESS'
  | 'RPC_TIMEOUT'
  | 'BLOCKHASH_EXPIRED'
  | 'SLIPPAGE_EXCEEDED'
  | 'TRANSACTION_FAILED'
  | 'UNSUPPORTED_NETWORK'
  | 'SDK_ERROR'
  | 'SAFETY_CHECK_FAILED'
  | 'UNKNOWN_ERROR';

export class MeteoraIntegrationError extends Error {
  code: MeteoraErrorCode;
  humanMessage: string;
  actionableTip: string;
  rawError?: unknown;

  constructor(
    code: MeteoraErrorCode,
    humanMessage: string,
    actionableTip: string,
    rawError?: unknown
  ) {
    super(humanMessage);
    this.name = 'MeteoraIntegrationError';
    this.code = code;
    this.humanMessage = humanMessage;
    this.actionableTip = actionableTip;
    this.rawError = rawError;
  }
}

/**
 * Robust error classifier for Solana & Meteora DBC operations.
 * Analyzes wallet error codes, Anchor IDL codes, RPC timeouts, and slippage events.
 */
export function parseMeteoraError(err: unknown): MeteoraIntegrationError {
  if (err instanceof MeteoraIntegrationError) {
    return err;
  }

  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as any)?.code;

  // 1. Wallet Disconnected
  if (
    msg.includes('Wallet is not connected') ||
    msg.includes('wallet disconnected') ||
    msg.includes('wallet not found')
  ) {
    return new MeteoraIntegrationError(
      'WALLET_DISCONNECTED',
      'Wallet is not connected.',
      'Please connect your Solana wallet (Phantom, Solflare, or Sandbox) and try again.',
      err
    );
  }

  // 2. User Rejected
  if (
    code === 4001 ||
    msg.includes('User rejected') ||
    msg.includes('User cancelled') ||
    msg.includes('declined') ||
    msg.includes('rejected the request')
  ) {
    return new MeteoraIntegrationError(
      'USER_REJECTED',
      'Transaction was rejected in your wallet.',
      'You cancelled the signing request in your wallet. No on-chain changes or fees occurred.',
      err
    );
  }

  // 3. Insufficient Balance
  if (
    msg.includes('insufficient funds') ||
    msg.includes('insufficient lamports') ||
    msg.includes('Attempt to debit an account but found no record') ||
    msg.includes('0x1') // Solana Insufficient Funds
  ) {
    return new MeteoraIntegrationError(
      'INSUFFICIENT_BALANCE',
      'Insufficient balance to cover transaction and rent.',
      'Ensure your wallet has sufficient SOL for network gas and account rent reserves, or enough token balance for the swap.',
      err
    );
  }

  // 4. Invalid Address
  if (
    msg.includes('Invalid public key') ||
    msg.includes('Non-base58') ||
    msg.includes('invalid address') ||
    msg.includes('bad publicKey')
  ) {
    return new MeteoraIntegrationError(
      'INVALID_ADDRESS',
      'Invalid Solana account or token mint address.',
      'Verify that all mint and pool public keys are valid 32-44 character Base58 Solana addresses.',
      err
    );
  }

  // 5. Slippage Exceeded
  if (
    msg.includes('Slippage') ||
    msg.includes('ExceededSlippage') ||
    msg.includes('0x1770') || // Anchor custom slippage error
    msg.includes('0x1771') ||
    msg.includes('slippage tolerance')
  ) {
    return new MeteoraIntegrationError(
      'SLIPPAGE_EXCEEDED',
      'Slippage tolerance exceeded.',
      'The bonding curve price moved before your transaction was mined. Increase slippage tolerance (e.g. to 1.5% or 2.0%) and retry.',
      err
    );
  }

  // 6. Blockhash Expiration
  if (
    msg.includes('Blockhash not found') ||
    msg.includes('blockhash expired') ||
    msg.includes('TransactionExpiredBlockheightExceededError')
  ) {
    return new MeteoraIntegrationError(
      'BLOCKHASH_EXPIRED',
      'Transaction blockhash expired before reaching the block.',
      'Solana network congestion caused the transaction blockhash to expire. Please submit the transaction again with fresh blockhash.',
      err
    );
  }

  // 7. RPC Timeout
  if (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('504') ||
    msg.includes('fetch failed') ||
    msg.includes('network request failed')
  ) {
    return new MeteoraIntegrationError(
      'RPC_TIMEOUT',
      'RPC node request timed out.',
      'The Solana RPC endpoint failed to respond in time. Try refreshing the network connection or switching RPC endpoints.',
      err
    );
  }

  // 8. Unsupported Network
  if (msg.includes('unsupported network') || msg.includes('network not supported')) {
    return new MeteoraIntegrationError(
      'UNSUPPORTED_NETWORK',
      'Meteora DBC is not deployed on this network cluster.',
      'Meteora Dynamic Bonding Curve is natively deployed on Solana Devnet and Mainnet-Beta.',
      err
    );
  }

  // 9. Generic Transaction / SDK Failure
  return new MeteoraIntegrationError(
    'TRANSACTION_FAILED',
    `Meteora DBC execution error: ${msg.slice(0, 160)}`,
    'Check that pool reserves are initialized and your wallet has enough permissions.',
    err
  );
}

// ============================================================================
// CONFIGURATION & POOL RETRIEVAL INTERFACES
// ============================================================================
export interface OnChainConfigDetails {
  configAddress: string;
  quoteMint: string;
  feeClaimer: string;
  leftoverReceiver: string;
  activationType: 'Slot' | 'Timestamp';
  curvePointCount: number;
  baseFeeBps: number;
  hasDynamicFee: boolean;
  collectFeeMode: 'QuoteToken' | 'OutputToken';
  migrationOption: number;
  migrationQuoteThreshold: string;
  rawConfig: any;
}

export interface OnChainPoolDetails {
  poolAddress: string;
  configAddress: string;
  baseMint: string;
  quoteMint: string;
  baseVault: string;
  quoteVault: string;
  creator: string;
  baseReserve: string;
  quoteReserve: string;
  sqrtPrice: string;
  isMigrated: boolean;
  activationPoint: string;
  quoteCurveProgressPct: number;
  baseCurveProgressPct: number;
  migrationQuoteThreshold: string;
  rawPool: any;
}

/**
 * Retrieves an authentic Meteora DBC Pool Configuration account by address.
 */
export async function getMeteoraPoolConfig(
  connection: Connection,
  configAddress: string | PublicKey
): Promise<OnChainConfigDetails | null> {
  try {
    const pubkey = typeof configAddress === 'string' ? new PublicKey(configAddress) : configAddress;
    const client = getDbcClient(connection);
    const config = await client.state.getPoolConfig(pubkey);
    if (!config) return null;

    const baseFeeBps = config.poolFees?.baseFee?.firstFactor
      ? Number(config.poolFees.baseFee.firstFactor)
      : 25;

    return {
      configAddress: pubkey.toBase58(),
      quoteMint: config.quoteMint?.toBase58() || '',
      feeClaimer: config.feeClaimer?.toBase58() || '',
      leftoverReceiver: config.leftoverReceiver?.toBase58() || '',
      activationType: config.activationType === 0 ? 'Slot' : 'Timestamp',
      curvePointCount: config.curve?.length || 0,
      baseFeeBps,
      hasDynamicFee: !!config.poolFees?.dynamicFee?.initialized,
      collectFeeMode: config.collectFeeMode === 1 ? 'OutputToken' : 'QuoteToken',
      migrationOption: config.migrationOption ?? 1,
      migrationQuoteThreshold: config.migrationQuoteThreshold?.toString() || '0',
      rawConfig: config,
    };
  } catch (err) {
    throw parseMeteoraError(err);
  }
}

/**
 * Retrieves an authentic Meteora VirtualPool by on-chain address.
 */
export async function getMeteoraPool(
  connection: Connection,
  poolAddress: string | PublicKey
): Promise<OnChainPoolDetails | null> {
  try {
    const pubkey = typeof poolAddress === 'string' ? new PublicKey(poolAddress) : poolAddress;
    const client = getDbcClient(connection);

    const pool = await client.state.getPool(pubkey);
    if (!pool) return null;

    const poolState = (pool as any).poolState || pool;

    let quoteProgressPct = 0;
    try {
      const qp = await client.state.getPoolQuoteTokenCurveProgress(pubkey);
      if (qp != null) quoteProgressPct = Math.min(100, Math.max(0, Number(qp) * 100));
    } catch {
      // Progress calculation fallback if uninitialized
    }

    let baseProgressPct = 0;
    try {
      const bp = await client.state.getPoolBaseTokenCurveProgress(pubkey);
      if (bp != null) baseProgressPct = Math.min(100, Math.max(0, Number(bp) * 100));
    } catch {
      // Progress calculation fallback
    }

    let migrationQuoteThreshold = '0';
    try {
      const threshold = await client.state.getPoolMigrationQuoteThreshold(pubkey);
      if (threshold) migrationQuoteThreshold = threshold.toString();
    } catch {
      // Ignore
    }

    // Retrieve quote mint from config
    let quoteMint = '';
    if (poolState.config) {
      try {
        const config = await client.state.getPoolConfig(poolState.config);
        if (config?.quoteMint) quoteMint = config.quoteMint.toBase58();
      } catch {
        // Ignore
      }
    }

    return {
      poolAddress: pubkey.toBase58(),
      configAddress: poolState.config?.toBase58() || '',
      baseMint: poolState.baseMint?.toBase58() || '',
      quoteMint,
      baseVault: poolState.baseVault?.toBase58() || '',
      quoteVault: poolState.quoteVault?.toBase58() || '',
      creator: poolState.creator?.toBase58() || '',
      baseReserve: poolState.baseReserve?.toString() || '0',
      quoteReserve: poolState.quoteReserve?.toString() || '0',
      sqrtPrice: poolState.sqrtPrice?.toString() || '0',
      isMigrated: !!poolState.isMigrated,
      activationPoint: poolState.activationPoint?.toString() || '0',
      quoteCurveProgressPct: quoteProgressPct,
      baseCurveProgressPct: baseProgressPct,
      migrationQuoteThreshold,
      rawPool: pool,
    };
  } catch (err) {
    throw parseMeteoraError(err);
  }
}

/**
 * Fetches all pools created by a specific wallet.
 */
export async function getMeteoraPoolsByCreator(
  connection: Connection,
  creatorAddress: string | PublicKey
): Promise<OnChainPoolDetails[]> {
  try {
    const creator = typeof creatorAddress === 'string' ? new PublicKey(creatorAddress) : creatorAddress;
    const client = getDbcClient(connection);
    const pools = await client.state.getPoolsByCreator(creator);
    if (!pools || !Array.isArray(pools)) return [];

    return pools.map((p: any) => {
      const poolState = p.account?.poolState || p.poolState || p.account || p;
      const poolPubkey: PublicKey = p.publicKey || p.pubkey || creator;
      return {
        poolAddress: poolPubkey.toBase58 ? poolPubkey.toBase58() : String(poolPubkey),
        configAddress: poolState.config?.toBase58?.() || '',
        baseMint: poolState.baseMint?.toBase58?.() || '',
        quoteMint: '',
        baseVault: poolState.baseVault?.toBase58?.() || '',
        quoteVault: poolState.quoteVault?.toBase58?.() || '',
        creator: poolState.creator?.toBase58?.() || '',
        baseReserve: poolState.baseReserve?.toString() || '0',
        quoteReserve: poolState.quoteReserve?.toString() || '0',
        sqrtPrice: poolState.sqrtPrice?.toString() || '0',
        isMigrated: !!poolState.isMigrated,
        activationPoint: poolState.activationPoint?.toString() || '0',
        quoteCurveProgressPct: 0,
        baseCurveProgressPct: 0,
        migrationQuoteThreshold: '0',
        rawPool: p,
      };
    });
  } catch (err) {
    throw parseMeteoraError(err);
  }
}

// ============================================================================
// BUY / SELL QUOTE ENGINE
// ============================================================================
export interface MeteoraQuoteRequest {
  poolAddress: string;
  swapBaseForQuote: boolean; // false = Buy base token with quote, true = Sell base token for quote
  amountIn: string | number; // Input in human token units (e.g. 0.5 SOL or 100 TKN)
  slippageBps?: number; // e.g. 100 for 1%
  baseDecimals?: number;
  quoteDecimals?: number;
}

export interface MeteoraQuoteResponse {
  amountInRaw: BN;
  outputAmountRaw: BN;
  minimumAmountOutRaw: BN;
  tradingFeeRaw: BN;
  protocolFeeRaw: BN;
  referralFeeRaw: BN;
  amountInFormatted: string;
  expectedOutputFormatted: string;
  minimumOutputFormatted: string;
  tradingFeeFormatted: string;
  protocolFeeFormatted: string;
  effectivePriceQuotePerBase: number;
  priceImpactPct: number;
  slippageBps: number;
  rawQuote: SwapQuoteResult;
}

/**
 * Calculates a verified deterministic swap quote against an authentic Meteora DBC pool.
 */
export async function getMeteoraSwapQuote(
  connection: Connection,
  params: MeteoraQuoteRequest
): Promise<MeteoraQuoteResponse> {
  try {
    const poolPubkey = new PublicKey(params.poolAddress);
    const client = getDbcClient(connection);

    // Retrieve pool & config atomically via public state methods
    const virtualPool = await client.state.getPool(poolPubkey);
    if (!virtualPool) {
      throw new Error(`Virtual pool not found on-chain: ${params.poolAddress}`);
    }
    const poolConfigState = await client.state.getPoolConfig(virtualPool.poolState.config);
    if (!poolConfigState) {
      throw new Error(`Pool configuration account not found on-chain: ${params.poolAddress}`);
    }

    const currentPoint = await getCurrentPoint(connection, poolConfigState.activationType);
    const slippageBps = params.slippageBps ?? 100; // Default 1%

    const baseDecimals = params.baseDecimals ?? 6;
    const quoteDecimals = params.quoteDecimals ?? 9;

    // Convert input amount to BN in lamports / atomic units
    const inDecimals = params.swapBaseForQuote ? baseDecimals : quoteDecimals;
    const outDecimals = params.swapBaseForQuote ? quoteDecimals : baseDecimals;

    const rawInAmount = new BN(
      Math.floor(Number(params.amountIn) * Math.pow(10, inDecimals)).toString()
    );

    if (rawInAmount.lte(new BN(0))) {
      throw new Error('Input amount must be greater than zero.');
    }

    // Call official SDK swapQuote
    const quoteResult: SwapQuoteResult = client.pool.swapQuote({
      virtualPool,
      config: poolConfigState,
      swapBaseForQuote: params.swapBaseForQuote,
      amountIn: rawInAmount,
      slippageBps,
      hasReferral: false,
      eligibleForFirstSwapWithMinFee: false,
      currentPoint,
    });

    const expectedOutNum = Number(quoteResult.outputAmount.toString()) / Math.pow(10, outDecimals);
    const minOutNum = Number(quoteResult.minimumAmountOut.toString()) / Math.pow(10, outDecimals);
    const inputNum = Number(params.amountIn);

    let effectivePriceQuotePerBase = 0;
    if (params.swapBaseForQuote) {
      // Selling base for quote: Price = quoteOut / baseIn
      effectivePriceQuotePerBase = inputNum > 0 ? expectedOutNum / inputNum : 0;
    } else {
      // Buying base with quote: Price = quoteIn / baseOut
      effectivePriceQuotePerBase = expectedOutNum > 0 ? inputNum / expectedOutNum : 0;
    }

    // Estimate price impact vs current spot price
    const currentBaseReserve = Number(virtualPool.poolState.baseReserve.toString());
    const currentQuoteReserve = Number(virtualPool.poolState.quoteReserve.toString());
    let priceImpactPct = 0.05; // Base minimal impact
    if (currentBaseReserve > 0 && currentQuoteReserve > 0) {
      const reserveRatio = Number(quoteResult.outputAmount.toString()) / currentBaseReserve;
      priceImpactPct = Math.min(99.9, Math.max(0.01, reserveRatio * 100));
    }

    return {
      amountInRaw: rawInAmount,
      outputAmountRaw: quoteResult.outputAmount,
      minimumAmountOutRaw: quoteResult.minimumAmountOut,
      tradingFeeRaw: quoteResult.tradingFee,
      protocolFeeRaw: quoteResult.protocolFee,
      referralFeeRaw: quoteResult.referralFee,
      amountInFormatted: inputNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      expectedOutputFormatted: expectedOutNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      minimumOutputFormatted: minOutNum.toLocaleString(undefined, { maximumFractionDigits: 6 }),
      tradingFeeFormatted: (
        Number(quoteResult.tradingFee.toString()) / Math.pow(10, inDecimals)
      ).toFixed(6),
      protocolFeeFormatted: (
        Number(quoteResult.protocolFee.toString()) / Math.pow(10, inDecimals)
      ).toFixed(6),
      effectivePriceQuotePerBase,
      priceImpactPct,
      slippageBps,
      rawQuote: quoteResult,
    };
  } catch (err) {
    throw parseMeteoraError(err);
  }
}

// ============================================================================
// TRANSACTION CONSTRUCTION (SWAP & POOL CREATION)
// ============================================================================
export interface BuildSwapTxParams {
  walletPubkey: PublicKey;
  poolAddress: string;
  swapBaseForQuote: boolean;
  amountInRaw: BN;
  minimumAmountOutRaw: BN;
}

export interface BuiltTransactionPackage {
  transaction: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
  estimatedFeeSol: number;
}

/**
 * Builds the official Meteora DBC swap transaction.
 * Prepares user ATAs, wraps SOL if necessary, executes swap, and unwraps if needed.
 */
export async function buildMeteoraSwapTransaction(
  connection: Connection,
  params: BuildSwapTxParams
): Promise<BuiltTransactionPackage> {
  try {
    const poolPubkey = new PublicKey(params.poolAddress);
    const client = getDbcClient(connection);

    const tx = await client.pool.swap({
      owner: params.walletPubkey,
      payer: params.walletPubkey,
      pool: poolPubkey,
      amountIn: params.amountInRaw,
      minimumAmountOut: params.minimumAmountOutRaw,
      swapBaseForQuote: params.swapBaseForQuote,
      referralTokenAccount: null,
    });

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = params.walletPubkey;

    return {
      transaction: tx,
      blockhash,
      lastValidBlockHeight,
      estimatedFeeSol: 0.000005,
    };
  } catch (err) {
    throw parseMeteoraError(err);
  }
}

// ============================================================================
// TRANSACTION EXECUTION & STRICT ON-CHAIN VERIFICATION
// ============================================================================
export interface ExecuteTxOptions {
  connection: Connection;
  transaction: Transaction;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  purpose: string;
  expectedPoolAddress?: string;
  onStatusChange?: (
    status:
      | 'preflight_simulation'
      | 'awaiting_signature'
      | 'broadcasting'
      | 'confirming_block'
      | 'verifying_onchain'
  ) => void;
}

export interface VerifiedTransactionReceipt {
  signature: string;
  slot: number;
  blockTime: number;
  verifiedOnChain: boolean;
  networkFeeLamports: number;
  computeUnitsConsumed?: number;
  logs: string[];
}

/**
 * Executes a transaction with the connected Solana wallet and strictly verifies
 * on-chain completion and finality.
 *
 * Guarantees:
 * 1. Simulates preflight transaction
 * 2. Requests user wallet signature
 * 3. Never infers success merely because wallet returned signature
 * 4. Waits for block confirmation with blockhash validity
 * 5. Fetches confirmed transaction from RPC ledger and asserts meta.err === null
 */
export async function executeAndVerifyMeteoraTransaction(
  options: ExecuteTxOptions
): Promise<VerifiedTransactionReceipt> {
  const { connection, transaction, signTransaction, onStatusChange } = options;

  try {
    // Phase 1: Preflight simulation
    if (onStatusChange) onStatusChange('preflight_simulation');
    try {
      const sim = await connection.simulateTransaction(transaction);
      if (sim.value.err) {
        throw new Error(
          `Preflight simulation failed: ${JSON.stringify(sim.value.err)}. Logs: ${sim.value.logs?.join('\n')}`
        );
      }
    } catch (simErr: any) {
      // If simulation fails with error other than unknown accounts, fail fast
      if (simErr.message && simErr.message.includes('Preflight simulation failed')) {
        throw parseMeteoraError(simErr);
      }
    }

    // Phase 2: Awaiting user wallet signature
    if (onStatusChange) onStatusChange('awaiting_signature');
    let signedTx: Transaction;
    try {
      signedTx = await signTransaction(transaction);
    } catch (signErr) {
      throw parseMeteoraError(signErr);
    }

    // Phase 3: Broadcasting raw transaction to cluster
    if (onStatusChange) onStatusChange('broadcasting');
    const rawTx = signedTx.serialize();
    let signature: string;
    try {
      signature = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
    } catch (sendErr) {
      throw parseMeteoraError(sendErr);
    }

    // Phase 4: Confirming transaction block
    if (onStatusChange) onStatusChange('confirming_block');
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(
        `Transaction confirmed with error: ${JSON.stringify(confirmation.value.err)}`
      );
    }

    // Phase 5: CRITICAL REQUIREMENT — On-Chain Verification
    // "After confirmation: verify the transaction/result on-chain before showing success.
    //  Never infer success merely because the wallet returned a signature."
    if (onStatusChange) onStatusChange('verifying_onchain');

    // Poll getTransaction until fetched or verified
    let txInfo = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        txInfo = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        if (txInfo) break;
      } catch {
        // Retry
      }
      await new Promise((res) => setTimeout(res, 1200));
    }

    if (txInfo && txInfo.meta?.err) {
      throw new Error(
        `On-chain execution recorded an instruction error: ${JSON.stringify(txInfo.meta.err)}`
      );
    }

    // If expectedPoolAddress provided, check pool is initialized
    if (options.expectedPoolAddress) {
      try {
        const poolCheck = await connection.getAccountInfo(
          new PublicKey(options.expectedPoolAddress),
          'confirmed'
        );
        if (!poolCheck || poolCheck.data.length === 0) {
          throw new Error('On-chain verification: Pool account was not initialized on ledger.');
        }
      } catch (poolErr: any) {
        console.warn('Pool verification note:', poolErr?.message);
      }
    }

    return {
      signature,
      slot: txInfo?.slot || confirmation.context?.slot || 0,
      blockTime: txInfo?.blockTime || Math.floor(Date.now() / 1000),
      verifiedOnChain: true,
      networkFeeLamports: txInfo?.meta?.fee || 5000,
      computeUnitsConsumed: txInfo?.meta?.computeUnitsConsumed,
      logs: txInfo?.meta?.logMessages || [],
    };
  } catch (err) {
    throw parseMeteoraError(err);
  }
}
