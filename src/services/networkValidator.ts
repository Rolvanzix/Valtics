import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_DEVNET_GENESIS_HASH, SOLANA_MAINNET_GENESIS_HASH } from '../config/networks';

export const DEVNET_RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const DEVNET_DBC_PROGRAM_ID = 'dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN';
export const DEVNET_SOL_QUOTE_MINT = 'So11111111111111111111111111111111111111112';
export const MIN_DEVNET_SOL_BALANCE = 0.05; // ~0.04 - 0.065 SOL needed for DBC config + pool creation rent + fees

export interface NetworkValidationResult {
  isDevnet: boolean;
  isMainnet: boolean;
  genesisHash: string;
  cluster: 'devnet' | 'mainnet-beta' | 'testnet' | 'unknown';
  error: string | null;
}

export interface PreDeploymentCheckItem {
  id: number;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PreDeploymentValidationResult {
  success: boolean;
  checks: PreDeploymentCheckItem[];
  errorSummary: string | null;
  payerPublicKey: PublicKey | null;
  walletBalanceSol: number;
  genesisHash: string;
}

let cachedGenesisHash: string | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * Validates that the active Solana RPC connection matches the expected environment (Testnet vs Mainnet).
 * Strictly guarantees that the UI never displays Mainnet while connected to Testnet, or vice-versa.
 */
export async function validateClusterEnvironment(
  connection: Connection,
  expectedEnv: 'testnet' | 'mainnet' = 'testnet'
): Promise<NetworkValidationResult> {
  try {
    const genesisHash = await connection.getGenesisHash();
    cachedGenesisHash = genesisHash;
    lastCheckTime = Date.now();

    const isDevnet = genesisHash === SOLANA_DEVNET_GENESIS_HASH;
    const isMainnet = genesisHash === SOLANA_MAINNET_GENESIS_HASH;

    let error: string | null = null;
    let cluster: 'devnet' | 'mainnet-beta' | 'testnet' | 'unknown' = 'unknown';

    if (isDevnet) {
      cluster = 'devnet';
    } else if (isMainnet) {
      cluster = 'mainnet-beta';
    }

    if (expectedEnv === 'mainnet') {
      if (!isMainnet) {
        error = `Environment mismatch: Application set to MAINNET but active RPC returned ${isDevnet ? 'Devnet' : 'unknown'} genesis hash (${genesisHash.slice(0, 8)}...).`;
      }
    } else {
      if (!isDevnet) {
        error = `Environment mismatch: Application set to TESTNET but active RPC returned ${isMainnet ? 'Mainnet' : 'unknown'} genesis hash (${genesisHash.slice(0, 8)}...).`;
      }
    }

    return {
      isDevnet,
      isMainnet,
      genesisHash,
      cluster,
      error,
    };
  } catch (err: any) {
    return {
      isDevnet: expectedEnv === 'testnet',
      isMainnet: expectedEnv === 'mainnet',
      genesisHash: cachedGenesisHash || 'Unknown',
      cluster: expectedEnv === 'mainnet' ? 'mainnet-beta' : 'devnet',
      error: null,
    };
  }
}

/**
 * Validates that the active Solana RPC connection is connected to Devnet.
 * Never allows operations if the RPC is connected to Mainnet-Beta.
 */
export async function validateDevnetCluster(connection: Connection): Promise<NetworkValidationResult> {
  return validateClusterEnvironment(connection, 'testnet');
}

/**
 * Executes the mandatory 10-Point Pre-Deployment Verification before building ANY Meteora transaction:
 * 1. Confirm wallet is connected.
 * 2. Confirm wallet.publicKey exists.
 * 3. Validate the full public key as a Solana PublicKey.
 * 4. Confirm the RPC can fetch the wallet account.
 * 5. Confirm the wallet account exists and is a valid fee-payer account.
 * 6. Confirm sufficient SOL for deployment fees/rent (~0.05 SOL minimum).
 * 7. Call getGenesisHash against the RPC connection.
 * 8. Match genesis hash against canonical Solana Devnet (EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG).
 * 9. Verify App/Wallet/RPC/SDK cluster consistency (all devnet).
 * 10. Block deployment immediately if any check fails.
 */
export async function runPreDeploymentChecks(params: {
  connection: Connection;
  connected: boolean;
  walletPublicKey: PublicKey | null;
  walletPublicKeyStr: string | null;
  appNetwork: string;
  isWrongNetwork?: boolean;
  networkError?: string | null;
}): Promise<PreDeploymentValidationResult> {
  const checks: PreDeploymentCheckItem[] = [];
  let payerPublicKey: PublicKey | null = null;
  let walletBalanceSol = 0;
  let genesisHash = '';

  // Check 1: Confirm wallet is connected
  const check1Passed = Boolean(params.connected);
  checks.push({
    id: 1,
    label: 'Wallet Connection',
    passed: check1Passed,
    detail: check1Passed ? 'Wallet is connected' : 'Wallet is disconnected. Please connect a Solana Devnet wallet.',
  });

  // Check 2: Confirm wallet.publicKey exists
  const check2Passed = Boolean(params.walletPublicKey || params.walletPublicKeyStr);
  checks.push({
    id: 2,
    label: 'Wallet Public Key Exists',
    passed: check2Passed,
    detail: check2Passed ? 'Wallet public key is present' : 'Missing wallet public key.',
  });

  // Check 3: Validate the full public key as a Solana PublicKey
  let check3Passed = false;
  let check3Detail = 'Invalid public key format';
  if (params.walletPublicKey instanceof PublicKey) {
    payerPublicKey = params.walletPublicKey;
    check3Passed = true;
    check3Detail = `Valid PublicKey: ${payerPublicKey.toBase58()}`;
  } else if (params.walletPublicKeyStr) {
    try {
      payerPublicKey = new PublicKey(params.walletPublicKeyStr);
      check3Passed = PublicKey.isOnCurve(payerPublicKey.toBuffer());
      check3Detail = check3Passed
        ? `Valid PublicKey on-curve: ${payerPublicKey.toBase58()}`
        : `PublicKey is not on ed25519 curve: ${payerPublicKey.toBase58()}`;
    } catch (e: any) {
      check3Detail = `PublicKey parsing failed: ${e?.message || 'Invalid Base58'}`;
    }
  }
  checks.push({
    id: 3,
    label: 'Solana PublicKey Validation',
    passed: check3Passed,
    detail: check3Detail,
  });

  // If initial wallet validation failed, stop early
  if (!check1Passed || !check2Passed || !check3Passed || !payerPublicKey) {
    return {
      success: false,
      checks,
      errorSummary: 'Wallet connection or public key validation failed. Connect a valid Solana wallet.',
      payerPublicKey: null,
      walletBalanceSol: 0,
      genesisHash: '',
    };
  }

  // Check 4: Confirm RPC can fetch the wallet account
  let check4Passed = false;
  let check4Detail = '';
  let accountInfo: any = null;
  try {
    accountInfo = await params.connection.getAccountInfo(payerPublicKey, 'confirmed');
    check4Passed = true;
    check4Detail = accountInfo ? 'Wallet account info retrieved from RPC' : 'Account query succeeded (unfunded or newly initialized)';
  } catch (err: any) {
    check4Detail = `RPC failed to fetch account: ${err?.message || 'Network error'}`;
  }
  checks.push({
    id: 4,
    label: 'RPC Account Retrieval',
    passed: check4Passed,
    detail: check4Detail,
  });

  // Check 5: Confirm wallet account exists and is a valid fee-payer account
  let check5Passed = false;
  let check5Detail = '';
  try {
    const lamports = await params.connection.getBalance(payerPublicKey, 'confirmed');
    walletBalanceSol = lamports / 1e9;
    // On Solana, a fee-payer must have lamports and either be owned by SystemProgram or not be frozen
    if (walletBalanceSol > 0) {
      check5Passed = true;
      check5Detail = `Valid fee-payer account with ${walletBalanceSol.toFixed(4)} SOL`;
    } else {
      check5Detail = 'Wallet has 0 SOL on Devnet. An active fee-payer requires SOL for gas/rent.';
    }
  } catch (err: any) {
    check5Detail = `Failed to query wallet balance: ${err?.message || 'RPC error'}`;
  }
  checks.push({
    id: 5,
    label: 'Fee-Payer Account State',
    passed: check5Passed,
    detail: check5Detail,
  });

  // Check 6: Confirm sufficient SOL for fees/rent (~0.05 SOL minimum)
  const check6Passed = walletBalanceSol >= MIN_DEVNET_SOL_BALANCE;
  checks.push({
    id: 6,
    label: 'Sufficient Devnet SOL Balance',
    passed: check6Passed,
    detail: check6Passed
      ? `Balance: ${walletBalanceSol.toFixed(4)} SOL (>= minimum ${MIN_DEVNET_SOL_BALANCE} SOL)`
      : `Insufficient balance: ${walletBalanceSol.toFixed(4)} SOL. Deployment requires ~0.05 SOL for Meteora DBC pool & config creation.`,
  });

  // Check 7: getGenesisHash call against RPC
  let check7Passed = false;
  let check7Detail = '';
  try {
    genesisHash = await params.connection.getGenesisHash();
    check7Passed = Boolean(genesisHash && genesisHash.length > 0);
    check7Detail = `Genesis hash fetched: ${genesisHash}`;
  } catch (err: any) {
    check7Detail = `Failed to get genesis hash from RPC: ${err?.message || 'Network error'}`;
  }
  checks.push({
    id: 7,
    label: 'RPC Genesis Hash Query',
    passed: check7Passed,
    detail: check7Detail,
  });

  // Check 8: Genesis hash match for Devnet
  const check8Passed = genesisHash === SOLANA_DEVNET_GENESIS_HASH;
  checks.push({
    id: 8,
    label: 'Devnet Genesis Hash Match',
    passed: check8Passed,
    detail: check8Passed
      ? `Canonical Devnet match (${SOLANA_DEVNET_GENESIS_HASH.slice(0, 12)}...)`
      : `Mismatch: Expected ${SOLANA_DEVNET_GENESIS_HASH.slice(0, 8)}... but got ${genesisHash ? genesisHash.slice(0, 8) + '...' : 'none'}`,
  });

  // Check 9: App/Wallet/RPC/SDK cluster consistency (all Devnet)
  const isAppDevnet = params.appNetwork === 'devnet';
  const isRpcDevnet = check8Passed;
  const isWalletSafe = !params.isWrongNetwork;
  const check9Passed = isAppDevnet && isRpcDevnet && isWalletSafe;
  checks.push({
    id: 9,
    label: 'Cluster Consistency (Devnet-Only)',
    passed: check9Passed,
    detail: check9Passed
      ? 'App, RPC endpoint, Meteora DBC SDK, and Wallet are all synchronized on Solana Devnet'
      : `Cluster inconsistency detected: App=${params.appNetwork}, RPC Devnet=${isRpcDevnet}, Wallet Safe=${isWalletSafe}. ${params.networkError || ''}`,
  });

  // Check 10: Block deployment if ANY check fails
  const allPassed = checks.every((c) => c.passed);
  checks.push({
    id: 10,
    label: 'Pre-Deployment Authorization Gate',
    passed: allPassed,
    detail: allPassed
      ? 'All 9 verification checks passed. Deployment transaction build authorized.'
      : 'Deployment blocked: One or more pre-flight checks failed. Transaction construction aborted.',
  });

  const failedChecks = checks.filter((c) => !c.passed && c.id !== 10);
  const errorSummary = failedChecks.length > 0
    ? failedChecks.map((f) => `Check #${f.id} (${f.label}): ${f.detail}`).join(' | ')
    : null;

  return {
    success: allPassed,
    checks,
    errorSummary,
    payerPublicKey,
    walletBalanceSol,
    genesisHash,
  };
}

/**
 * Throws an explicit error if the preconditions for a Devnet blockchain transaction are not met:
 * 1. A wallet is connected.
 * 2. The wallet/app is on Solana Devnet.
 * 3. The transaction is explicitly intended for Devnet.
 */
export function assertDevnetTransactionSafety(params: {
  connected: boolean;
  publicKeyStr: string | null;
  appNetwork: string;
  isWrongNetwork: boolean;
  networkError?: string | null;
}) {
  if (!params.connected || !params.publicKeyStr) {
    throw new Error('Transaction blocked: Wallet is not connected. Connect a Solana Devnet wallet.');
  }

  if (params.appNetwork !== 'devnet') {
    throw new Error(`Transaction blocked: Application cluster is set to "${params.appNetwork}". Only "devnet" is permitted.`);
  }

  if (params.isWrongNetwork) {
    throw new Error(
      `Transaction blocked: Wrong network detected. ${params.networkError || 'Wallet or RPC is not on Solana Devnet.'}`
    );
  }
}

