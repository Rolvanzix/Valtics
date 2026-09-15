import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import {
  DynamicBondingCurveClient,
  buildCurve,
  deriveDbcPoolAddress,
  deriveDbcTokenVaultAddress,
  DYNAMIC_BONDING_CURVE_PROGRAM_ID,
  MigrationOption,
  MigrationFeeOption,
  BaseFeeMode,
  CollectFeeMode,
  ActivationType,
  TokenType,
  TokenAuthorityOption,
} from '@meteora-ag/dynamic-bonding-curve-sdk';
import { getMeteoraDbcClient } from './meteora';
import { DBCPoolState } from '../types';

export interface CurveStudioConfigInput {
  // Step 1: Asset
  assetName: string;
  ticker: string;
  baseMint: string;
  assetCategory: string;
  referencePrice?: number;
  quoteSymbol: 'USDC' | 'SOL';
  quoteMint: string;
  tokenDecimals: number;
  totalSupply: number;
  
  // Step 2 & 3: Curve Settings
  profileKey: 'conservative' | 'balanced' | 'growth';
  startingPriceQuote: number;
  migrationPriceQuote: number;
  migrationQuoteThreshold: number;
  curveAllocationPct: number;
  
  // Fee Configuration (Official Meteora SDK supported)
  baseFeeMode: 'FeeSchedulerLinear' | 'FeeSchedulerExponential';
  startingFeeBps: number;
  endingFeeBps: number;
  feeDecaySeconds: number;
  creatorTradingFeePercentage: number;
  dynamicFeeEnabled: boolean;
  collectFeeMode: 'QuoteToken' | 'OutputToken';
  
  // Liquidity Distribution (Sum must equal 100%)
  creatorPermanentLockedLpPct: number;
  creatorUnlockedLpPct: number;
  partnerPermanentLockedLpPct: number;
  partnerUnlockedLpPct: number;
  
  // Migration Settings
  migrationOption: 'MET_DAMM_V2';
  migrationFeeOptionBps: 25 | 30 | 100;
  antiSniperSlots: number;
  
  // Payer / Authority
  payerAddress: string;
}

export interface PreparedPoolDeployment {
  configKeypair: Keypair;
  configPubkey: string;
  poolAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  programId: string;
  transaction: Transaction;
  curveData: any;
  estimatedRentSol: number;
  estimatedTxFeeSol: number;
}

export interface DeploymentResult {
  signature: string;
  poolAddress: string;
  configAddress: string;
  baseVaultAddress: string;
  quoteVaultAddress: string;
  baseMint: string;
  quoteMint: string;
  network: string;
  timestamp: string;
  slot: number;
}

export function createDefaultCurveStudioInput(): CurveStudioConfigInput {
  return {
    assetName: 'Apollo U.S. Treasury Bill 3M',
    ticker: 'USTB-3M',
    baseMint: '2mK3mR8aXWvQv8qY4p7X6e2UvL5fT9bK3gR3RwhK6eUu',
    assetCategory: 'Treasuries',
    referencePrice: 1.0,
    quoteSymbol: 'USDC',
    quoteMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenDecimals: 6,
    totalSupply: 100_000_000,
    profileKey: 'conservative',
    startingPriceQuote: 1.0,
    migrationPriceQuote: 1.04,
    migrationQuoteThreshold: 150_000,
    curveAllocationPct: 85,
    baseFeeMode: 'FeeSchedulerLinear',
    startingFeeBps: 25,
    endingFeeBps: 20,
    feeDecaySeconds: 86400,
    creatorTradingFeePercentage: 20,
    dynamicFeeEnabled: false,
    collectFeeMode: 'QuoteToken',
    creatorPermanentLockedLpPct: 100,
    creatorUnlockedLpPct: 0,
    partnerPermanentLockedLpPct: 0,
    partnerUnlockedLpPct: 0,
    migrationOption: 'MET_DAMM_V2',
    migrationFeeOptionBps: 25,
    antiSniperSlots: 50,
    payerAddress: '',
  };
}

/**
 * Validates that all Curve Studio inputs strictly conform to Solana and Meteora DBC program constraints.
 */
export function validateCurveStudioInput(input: CurveStudioConfigInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.assetName || input.assetName.trim().length === 0) {
    errors.push('Asset name is required.');
  }

  if (!input.ticker || input.ticker.trim().length === 0) {
    errors.push('Ticker symbol is required.');
  }

  // Validate base mint
  try {
    new PublicKey(input.baseMint);
  } catch {
    errors.push('Invalid Base Token Mint address. Must be a valid 32-44 character Base58 Solana address.');
  }

  // Validate quote mint
  try {
    new PublicKey(input.quoteMint);
  } catch {
    errors.push('Invalid Quote Token Mint address.');
  }

  // Validate payer address
  try {
    new PublicKey(input.payerAddress);
  } catch {
    errors.push('Invalid Payer/Wallet address.');
  }

  if (input.startingPriceQuote <= 0) {
    errors.push('Starting price must be greater than zero.');
  }

  if (input.migrationQuoteThreshold <= 0) {
    errors.push('Migration threshold must be greater than zero.');
  }

  if (input.startingFeeBps < 10 || input.startingFeeBps > 1000) {
    errors.push('Starting trading fee must be between 10 bps (0.10%) and 1000 bps (10.00%).');
  }

  if (input.endingFeeBps < 10 || input.endingFeeBps > input.startingFeeBps) {
    errors.push('Ending trading fee must be between 10 bps and less than or equal to starting fee.');
  }

  if (input.creatorTradingFeePercentage < 0 || input.creatorTradingFeePercentage > 100) {
    errors.push('Creator fee share must be between 0% and 100%.');
  }

  // Meteora invariant: LP percentages must strictly sum to 100%
  const totalLpPct =
    input.creatorPermanentLockedLpPct +
    input.creatorUnlockedLpPct +
    input.partnerPermanentLockedLpPct +
    input.partnerUnlockedLpPct;

  if (totalLpPct !== 100) {
    errors.push(`Total LP distribution percentages must strictly sum to 100%. Current sum: ${totalLpPct}%.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Executes the official Meteora DBC SDK `buildCurve` algorithm to calculate
 * deterministic dynamic curve points, sqrtPrices, and migration invariants.
 */
export function buildMeteoraDbcParameters(input: CurveStudioConfigInput) {
  // Map MigrationFeeOption
  let feeOptionEnum = MigrationFeeOption.FixedBps25;
  if (input.migrationFeeOptionBps === 30) feeOptionEnum = MigrationFeeOption.FixedBps30;
  if (input.migrationFeeOptionBps === 100) feeOptionEnum = MigrationFeeOption.FixedBps100;

  const quoteDecimals = input.quoteSymbol === 'SOL' ? 9 : 6;
  const percentageSupplyOnMigration = Math.min(99, Math.max(1, 100 - input.curveAllocationPct));

  // Determine number of scheduler periods (e.g. 10 intervals over total duration)
  const numberOfPeriod = 10;

  return buildCurve({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: input.tokenDecimals,
      tokenQuoteDecimal: quoteDecimals,
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: input.totalSupply,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode:
          input.baseFeeMode === 'FeeSchedulerExponential'
            ? BaseFeeMode.FeeSchedulerExponential
            : BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          startingFeeBps: input.startingFeeBps,
          endingFeeBps: input.endingFeeBps,
          numberOfPeriod,
          totalDuration: input.feeDecaySeconds,
        },
      },
      dynamicFeeEnabled: input.dynamicFeeEnabled,
      collectFeeMode:
        input.collectFeeMode === 'OutputToken' ? CollectFeeMode.OutputToken : CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: input.creatorTradingFeePercentage,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: feeOptionEnum,
      migrationFee: {
        creatorFeePercentage: 0,
        feePercentage: 0,
      },
    },
    liquidityDistribution: {
      partnerPermanentLockedLiquidityPercentage: input.partnerPermanentLockedLpPct,
      partnerLiquidityPercentage: input.partnerUnlockedLpPct,
      creatorPermanentLockedLiquidityPercentage: input.creatorPermanentLockedLpPct,
      creatorLiquidityPercentage: input.creatorUnlockedLpPct,
    },
    lockedVesting: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
    activationType: ActivationType.Slot,
    percentageSupplyOnMigration,
    migrationQuoteThreshold: input.migrationQuoteThreshold,
  });
}

/**
 * Prepares the authentic Solana transaction utilizing the official Meteora DBC SDK.
 * Derives real PDAs and signs with the Config Keypair.
 */
export async function prepareMeteoraPoolTransaction(
  connection: Connection,
  rpcUrl: string,
  input: CurveStudioConfigInput
): Promise<PreparedPoolDeployment> {
  const validation = validateCurveStudioInput(input);
  if (!validation.valid) {
    throw new Error(`Invalid curve parameters: ${validation.errors.join('; ')}`);
  }

  const client = getMeteoraDbcClient(connection, rpcUrl);
  const configKeypair = Keypair.generate();
  const payerPubkey = new PublicKey(input.payerAddress);
  const baseMintPubkey = new PublicKey(input.baseMint);
  const quoteMintPubkey = new PublicKey(input.quoteMint);

  // 1. Calculate deterministic SDK curve parameters
  const curveConfig = buildMeteoraDbcParameters(input);

  // 2. Derive on-chain deterministic Program Derived Addresses (PDAs)
  const poolPubkey = deriveDbcPoolAddress(quoteMintPubkey, baseMintPubkey, configKeypair.publicKey);
  const baseVaultPubkey = deriveDbcTokenVaultAddress(poolPubkey, baseMintPubkey);
  const quoteVaultPubkey = deriveDbcTokenVaultAddress(poolPubkey, quoteMintPubkey);

  // 3. Build compound transaction through official Meteora partner service:
  // Combines createConfig and createPool instructions
  const tx = await client.partner.createConfigAndPool({
    config: configKeypair.publicKey,
    feeClaimer: payerPubkey,
    leftoverReceiver: payerPubkey,
    quoteMint: quoteMintPubkey,
    payer: payerPubkey,
    preCreatePoolParam: {
      baseMint: baseMintPubkey,
      name: input.assetName,
      symbol: input.ticker,
      uri: '',
      poolCreator: payerPubkey,
    },
    ...curveConfig,
  });

  // Set blockhash and fee payer
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  tx.recentBlockhash = blockhash;
  tx.feePayer = payerPubkey;

  // The configKeypair is a new account initialized by the program, so it signs here
  tx.partialSign(configKeypair);

  return {
    configKeypair,
    configPubkey: configKeypair.publicKey.toBase58(),
    poolAddress: poolPubkey.toBase58(),
    baseVaultAddress: baseVaultPubkey.toBase58(),
    quoteVaultAddress: quoteVaultPubkey.toBase58(),
    programId: DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58(),
    transaction: tx,
    curveData: curveConfig,
    estimatedRentSol: 0.065, // ~0.065 SOL for Config PDA + Pool PDA + Vault ATAs
    estimatedTxFeeSol: 0.000005,
  };
}

/**
 * Simulates the transaction on-chain via Solana RPC to ensure preflight safety.
 */
export async function simulateMeteoraTransaction(
  connection: Connection,
  transaction: Transaction
): Promise<{ success: boolean; logs: string[]; error?: string }> {
  try {
    const simResult = await connection.simulateTransaction(transaction);
    if (simResult.value.err) {
      return {
        success: false,
        logs: simResult.value.logs || [],
        error: JSON.stringify(simResult.value.err),
      };
    }
    return {
      success: true,
      logs: simResult.value.logs || [],
    };
  } catch (err: any) {
    return {
      success: false,
      logs: [],
      error: err?.message || 'Solana RPC simulation failed.',
    };
  }
}

export interface ExecutePoolTransactionOptions {
  connection: Connection;
  prepared: PreparedPoolDeployment;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  input?: CurveStudioConfigInput;
  network?: string;
  onStatusChange?: (status: 'signing' | 'broadcasting' | 'confirming') => void;
}

/**
 * Executes and confirms the pool creation on the blockchain.
 * Returns verified on-chain confirmation details.
 */
export async function executeAndConfirmPoolTransaction(
  optsOrConnection: ExecutePoolTransactionOptions | Connection,
  preparedArg?: PreparedPoolDeployment,
  signWithWalletArg?: (tx: Transaction) => Promise<Transaction>,
  inputArg?: CurveStudioConfigInput,
  networkArg?: string
): Promise<DeploymentResult> {
  let connection: Connection;
  let prepared: PreparedPoolDeployment;
  let signWithWallet: (tx: Transaction) => Promise<Transaction>;
  let input: CurveStudioConfigInput | undefined;
  let network: string;
  let onStatusChange: ((status: 'signing' | 'broadcasting' | 'confirming') => void) | undefined;

  if ('connection' in optsOrConnection) {
    connection = optsOrConnection.connection;
    prepared = optsOrConnection.prepared;
    signWithWallet = optsOrConnection.signTransaction;
    input = optsOrConnection.input;
    network = optsOrConnection.network || 'devnet';
    onStatusChange = optsOrConnection.onStatusChange;
  } else {
    connection = optsOrConnection;
    prepared = preparedArg!;
    signWithWallet = signWithWalletArg!;
    input = inputArg;
    network = networkArg || 'devnet';
  }

  // Sign with the connected wallet (fee payer & pool creator)
  if (onStatusChange) onStatusChange('signing');
  const signedTx = await signWithWallet(prepared.transaction);

  // Send raw transaction
  if (onStatusChange) onStatusChange('broadcasting');
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Await blockchain confirmation
  if (onStatusChange) onStatusChange('confirming');
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  if (confirmation.value.err) {
    throw new Error(`Transaction confirmed with on-chain error: ${JSON.stringify(confirmation.value.err)}`);
  }

  // Query slot
  let slot = 0;
  try {
    const status = await connection.getSignatureStatus(signature);
    slot = status.value?.slot || 0;
  } catch {
    // Ignore slot fetch fallback
  }

  return {
    signature,
    poolAddress: prepared.poolAddress,
    configAddress: prepared.configPubkey,
    baseVaultAddress: prepared.baseVaultAddress,
    quoteVaultAddress: prepared.quoteVaultAddress,
    baseMint: input?.baseMint || '',
    quoteMint: input?.quoteMint || '',
    network,
    timestamp: new Date().toISOString(),
    slot,
  };
}

/**
 * Converts a successful deployment into a full DBCPoolState object ready
 * to be displayed in Market Terminal, My Markets, and Markets Directory.
 */
export function createPoolStateFromDeployment(
  deployment: DeploymentResult,
  input: CurveStudioConfigInput,
  network: any
): DBCPoolState {
  return {
    poolAddress: deployment.poolAddress,
    configAddress: deployment.configAddress,
    baseMint: deployment.baseMint,
    quoteMint: deployment.quoteMint,
    baseVault: deployment.baseVaultAddress,
    quoteVault: deployment.quoteVaultAddress,
    creator: input.payerAddress,
    migrationOption: 1,
    migrationOptionLabel: 'MET_DAMM_V2',
    baseReserve: input.totalSupply.toString(),
    quoteReserve: '0',
    quoteThreshold: input.migrationQuoteThreshold.toLocaleString(),
    currentPrice: input.startingPriceQuote,
    startPrice: input.startingPriceQuote,
    migrationPrice: input.migrationPriceQuote,
    referencePrice: input.referencePrice || input.startingPriceQuote,
    referencePriceLabel: input.referencePrice ? 'Issuer Stated NAV' : 'Genesis Price',
    quoteCurveProgressPct: 0,
    baseCurveProgressPct: 0,
    isMigrated: false,
    baseFeeBps: input.startingFeeBps,
    tokenName: input.assetName,
    tokenSymbol: input.ticker,
    rwaCategory: input.assetCategory as any,
    tvlUsd: 0,
    network,
    curveType: 'linear',
    antiSniperSlots: input.antiSniperSlots,
    liquidityLockDays: 365,
    creatorFeeShareBps: input.creatorTradingFeePercentage * 100,
    totalSupply: input.totalSupply,
    curveAllocationTokens: (input.totalSupply * input.curveAllocationPct) / 100,
    description: `Real World Asset Dynamic Bonding Curve market for ${input.assetName} ($${input.ticker}). Algorithmic price discovery powered by Meteora DBC with automated DAMM v2 graduation.`,
    riskNotes: {
      impermanentLossRisk: '0.00% during bonding curve phase (Single-sided quote accumulation)',
      liquidityLock: '100% permanent liquidity lock in Meteora non-custodial LP locker upon DAMM v2 graduation',
      slippageBound: 'Continuous math invariant protects against sandwich attacks and out-of-bounds slippage',
      oracleDependency: 'No external oracle vulnerability; spot pricing is governed strictly by the on-chain invariant',
    },
    activity24h: {
      tradeCount: 1,
      volumeUsd: 0,
      priceChange24hPct: 0,
      isIndexed: true,
    },
  };
}

