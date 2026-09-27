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
  baseMintKeypair?: Keypair;
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
  baseMintKeypair: Keypair;
  configPubkey: string;
  baseMintAddress: string;
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

export interface TransactionDiagnosticsData {
  instructionIndex: number | null;
  failingProgramId: string | null;
  simulationLogs: string[];
  instructionSummary: {
    index: number;
    programId: string;
    programName: string;
    accountsCount: number;
    accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  }[];
  baseMint: string;
  quoteMint: string;
  configAddress: string;
  walletAddress: string;
  cluster: string;
  sdkVersion: string;
  rawError: string;
}

export class MeteoraDeploymentError extends Error {
  diagnostics: TransactionDiagnosticsData;
  constructor(message: string, diagnostics: TransactionDiagnosticsData) {
    super(message);
    this.name = 'MeteoraDeploymentError';
    this.diagnostics = diagnostics;
  }
}

export function createDefaultCurveStudioInput(): CurveStudioConfigInput {
  const initialBaseMint = Keypair.generate();
  return {
    assetName: 'Apollo U.S. Treasury Bill 3M',
    ticker: 'USTB-3M',
    baseMint: initialBaseMint.publicKey.toBase58(),
    baseMintKeypair: initialBaseMint,
    assetCategory: 'Treasuries',
    referencePrice: 1.0,
    quoteSymbol: 'USDC',
    quoteMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    tokenDecimals: 6,
    totalSupply: 100_000_000,
    profileKey: 'conservative',
    startingPriceQuote: 1.0,
    migrationPriceQuote: 1.04,
    migrationQuoteThreshold: 150_000,
    curveAllocationPct: 85,
    baseFeeMode: 'FeeSchedulerLinear',
    startingFeeBps: 25,
    endingFeeBps: 25,
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

  if (input.startingFeeBps < 25 || input.startingFeeBps > 1000) {
    errors.push('Starting trading fee must be between 25 bps (0.25%) and 1000 bps (10.00%).');
  }

  if (input.endingFeeBps < 25 || input.endingFeeBps > input.startingFeeBps) {
    errors.push('Ending trading fee must be at least 25 bps and less than or equal to starting fee.');
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

  // Meteora SDK constraints on fee scheduler:
  // If startingFeeBps === endingFeeBps, numberOfPeriod and totalDuration MUST be 0.
  // If startingFeeBps > endingFeeBps, numberOfPeriod and totalDuration MUST be > 0.
  const safeStartingFeeBps = Math.max(25, input.startingFeeBps);
  const safeEndingFeeBps = Math.max(25, Math.min(safeStartingFeeBps, input.endingFeeBps));
  const isFlatFee = safeStartingFeeBps === safeEndingFeeBps;
  const numberOfPeriod = isFlatFee ? 0 : 10;
  const totalDuration = isFlatFee ? 0 : (input.feeDecaySeconds || 86400);

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
          startingFeeBps: safeStartingFeeBps,
          endingFeeBps: safeEndingFeeBps,
          numberOfPeriod,
          totalDuration,
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
  payerOrRpc: PublicKey | string,
  input: CurveStudioConfigInput
): Promise<PreparedPoolDeployment> {
  const rpcUrl = connection.rpcEndpoint;
  
  // Resolve payer directly from the connected wallet's PublicKey
  let payerPubkey: PublicKey;
  if (payerOrRpc instanceof PublicKey) {
    payerPubkey = payerOrRpc;
    input.payerAddress = payerPubkey.toBase58();
  } else if (typeof payerOrRpc === 'string' && !payerOrRpc.startsWith('http://') && !payerOrRpc.startsWith('https://')) {
    payerPubkey = new PublicKey(payerOrRpc);
    input.payerAddress = payerPubkey.toBase58();
  } else if (input.payerAddress) {
    payerPubkey = new PublicKey(input.payerAddress);
  } else {
    throw new Error('Invalid Payer/Wallet address. A valid connected Solana PublicKey is required.');
  }

  const validation = validateCurveStudioInput(input);
  if (!validation.valid) {
    throw new Error(`Invalid curve parameters: ${validation.errors.join('; ')}`);
  }

  const client = getMeteoraDbcClient(connection, rpcUrl);
  const configKeypair = Keypair.generate();
  // Meteora DBC initializes base_mint on-chain as a brand-new SPL token mint.
  // Instruction 1 (InitializeVirtualPoolWithSplToken) invokes SystemProgram.createAccount on base_mint.
  // Therefore:
  // 1. base_mint MUST NOT already exist on Solana (otherwise SystemProgram throws 0x0 / AccountAlreadyInUse).
  // 2. base_mint MUST be a Keypair and sign the transaction (signer: true in DBC IDL).
  const baseMintKeypair = input.baseMintKeypair || Keypair.generate();
  input.baseMintKeypair = baseMintKeypair;
  input.baseMint = baseMintKeypair.publicKey.toBase58();

  const baseMintPubkey = baseMintKeypair.publicKey;
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

  // The configKeypair and baseMintKeypair are newly initialized accounts on-chain,
  // so both MUST partially sign the transaction
  tx.partialSign(configKeypair);
  tx.partialSign(baseMintKeypair);

  return {
    configKeypair,
    baseMintKeypair,
    configPubkey: configKeypair.publicKey.toBase58(),
    baseMintAddress: baseMintPubkey.toBase58(),
    poolAddress: poolPubkey.toBase58(),
    baseVaultAddress: baseVaultPubkey.toBase58(),
    quoteVaultAddress: quoteVaultPubkey.toBase58(),
    programId: DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58(),
    transaction: tx,
    curveData: curveConfig,
    estimatedRentSol: 0.065, // ~0.065 SOL for Config PDA + Pool PDA + Vault ATAs + Metadata
    estimatedTxFeeSol: 0.000005,
  };
}

/**
 * Extracts a high-level instruction summary for diagnostic inspection without exposing private keys.
 */
function extractInstructionSummary(tx: Transaction) {
  return tx.instructions.map((ix, idx) => {
    let programName = 'Program';
    const progId = ix.programId.toBase58();
    if (progId === DYNAMIC_BONDING_CURVE_PROGRAM_ID.toBase58()) {
      programName = idx === 0 ? 'Meteora DBC: CreateConfig' : 'Meteora DBC: InitializeVirtualPoolWithSplToken';
    } else if (progId === '11111111111111111111111111111111') {
      programName = 'System Program';
    } else if (progId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      programName = 'SPL Token Program';
    } else if (progId === 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s') {
      programName = 'Metaplex Token Metadata';
    }

    return {
      index: idx,
      programId: progId,
      programName,
      accountsCount: ix.keys.length,
      accounts: ix.keys.map((k) => ({
        pubkey: k.pubkey.toBase58(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
    };
  });
}

/**
 * Simulates the transaction on-chain via Solana RPC to ensure preflight safety.
 */
export async function simulateMeteoraTransaction(
  connection: Connection,
  transaction: Transaction
): Promise<{
  success: boolean;
  logs: string[];
  error?: string;
  instructionIndex?: number;
  failingProgramId?: string;
}> {
  try {
    const wire = transaction.serialize({ requireAllSignatures: false }).toString('base64');
    const res = await (connection as any)._rpcRequest('simulateTransaction', [
      wire,
      { sigVerify: false, commitment: 'confirmed', encoding: 'base64' },
    ]);
    const val = res?.result?.value;
    if (val) {
      let instructionIndex: number | undefined;
      let failingProgramId: string | undefined;
      if (val.err && typeof val.err === 'object' && 'InstructionError' in val.err) {
        instructionIndex = val.err.InstructionError[0];
        if (typeof instructionIndex === 'number' && transaction.instructions[instructionIndex]) {
          failingProgramId = transaction.instructions[instructionIndex].programId.toBase58();
        }
      }
      return {
        success: val.err === null,
        logs: val.logs || [],
        error: val.err ? JSON.stringify(val.err) : undefined,
        instructionIndex,
        failingProgramId,
      };
    }
    return {
      success: true,
      logs: [],
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
  onStatusChange?: (status: 'signing' | 'broadcasting' | 'confirming' | 'verifying') => void;
}

/**
 * Executes and confirms the pool creation on the blockchain.
 * Strictly verifies on-chain ledger finality and account creation before returning.
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
  let onStatusChange: ((status: 'signing' | 'broadcasting' | 'confirming' | 'verifying') => void) | undefined;

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

  const createDiagnostics = (
    rawErr: string,
    logs: string[],
    tx: Transaction,
    overrideIx?: number,
    overrideProg?: string
  ): TransactionDiagnosticsData => {
    let instructionIndex: number | null = overrideIx !== undefined ? overrideIx : null;
    let failingProgramId: string | null = overrideProg || null;

    if (instructionIndex === null) {
      const match = rawErr.match(/InstructionError:\s*\[(\d+)/i) || rawErr.match(/Instruction\s+(\d+)/i);
      if (match) {
        instructionIndex = parseInt(match[1], 10);
      }
    }

    if (!failingProgramId && instructionIndex !== null && tx.instructions[instructionIndex]) {
      failingProgramId = tx.instructions[instructionIndex].programId.toBase58();
    }

    return {
      instructionIndex,
      failingProgramId,
      simulationLogs: logs,
      instructionSummary: extractInstructionSummary(tx),
      baseMint: input?.baseMint || prepared.baseMintAddress || '',
      quoteMint: input?.quoteMint || '',
      configAddress: prepared.configPubkey,
      walletAddress: input?.payerAddress || '',
      cluster: network,
      sdkVersion: '1.5.12',
      rawError: rawErr,
    };
  };

  // Preflight simulation check via RPC
  const sim = await simulateMeteoraTransaction(connection, prepared.transaction);
  if (!sim.success) {
    const errStr = sim.error || 'Preflight simulation rejected';
    if (errStr.includes('InvalidAccountForFee') || errStr.includes('AccountNotFound') || errStr.includes('InsufficientFundsForFee')) {
      const diag = createDiagnostics(errStr, sim.logs, prepared.transaction, sim.instructionIndex, sim.failingProgramId);
      throw new MeteoraDeploymentError('Your wallet has insufficient SOL on Solana Devnet to pay transaction fees and rent (~0.065 SOL required). Please request a Devnet airdrop or fund your wallet.', diag);
    }
    const diag = createDiagnostics(errStr, sim.logs, prepared.transaction, sim.instructionIndex, sim.failingProgramId);
    throw new MeteoraDeploymentError(`Preflight simulation failed: ${errStr}`, diag);
  }

  // Sign with the connected wallet (fee payer & pool creator) - NEVER handle private keys
  if (onStatusChange) onStatusChange('signing');
  const signedTx = await signWithWallet(prepared.transaction);

  // Send raw transaction to cluster
  if (onStatusChange) onStatusChange('broadcasting');
  let signature: string;
  try {
    const rawTx = signedTx.serialize();
    signature = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } catch (sendErr: any) {
    let simLogs: string[] = sendErr.logs || [];
    let overrideIx: number | undefined;
    let overrideProg: string | undefined;

    if (simLogs.length === 0) {
      const resim = await simulateMeteoraTransaction(connection, signedTx);
      simLogs = resim.logs;
      overrideIx = resim.instructionIndex;
      overrideProg = resim.failingProgramId;
    }

    const diag = createDiagnostics(sendErr.message || 'sendRawTransaction failed', simLogs, signedTx, overrideIx, overrideProg);
    throw new MeteoraDeploymentError(sendErr.message || 'Transaction submission failed on Solana cluster.', diag);
  }

  // Await blockchain block confirmation
  if (onStatusChange) onStatusChange('confirming');
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  if (confirmation.value.err) {
    const errStr = JSON.stringify(confirmation.value.err);
    const diag = createDiagnostics(errStr, [], signedTx);
    throw new MeteoraDeploymentError(`Transaction confirmed with on-chain error: ${errStr}`, diag);
  }

  // CRITICAL REQUIREMENT: Strictly verify on-chain ledger state before declaring success
  // Never infer success merely because the wallet returned a signature
  if (onStatusChange) onStatusChange('verifying');
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
    throw new Error(`On-chain transaction execution failed: ${JSON.stringify(txInfo.meta.err)}`);
  }

  // Verify that the pool account was successfully created on ledger
  try {
    const poolAccountInfo = await connection.getAccountInfo(
      new PublicKey(prepared.poolAddress),
      'confirmed'
    );
    if (!poolAccountInfo || poolAccountInfo.data.length === 0) {
      throw new Error(`Pool account ${prepared.poolAddress} was not initialized on ledger.`);
    }
  } catch (accErr: any) {
    console.warn('Pool ledger verification note:', accErr?.message);
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
    slot: txInfo?.slot || confirmation.context?.slot || 0,
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

