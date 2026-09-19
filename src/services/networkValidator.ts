import { Connection } from '@solana/web3.js';
import { SOLANA_DEVNET_GENESIS_HASH, SOLANA_MAINNET_GENESIS_HASH } from '../config/networks';

export interface NetworkValidationResult {
  isDevnet: boolean;
  isMainnet: boolean;
  genesisHash: string;
  cluster: 'devnet' | 'mainnet-beta' | 'testnet' | 'unknown';
  error: string | null;
}

let cachedGenesisHash: string | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Validates that the active Solana RPC connection is connected to Devnet.
 * Never allows operations if the RPC is connected to Mainnet-Beta.
 */
export async function validateDevnetCluster(connection: Connection): Promise<NetworkValidationResult> {
  const now = Date.now();
  if (cachedGenesisHash && now - lastCheckTime < CACHE_TTL_MS) {
    const isDevnet = cachedGenesisHash === SOLANA_DEVNET_GENESIS_HASH;
    const isMainnet = cachedGenesisHash === SOLANA_MAINNET_GENESIS_HASH;
    return {
      isDevnet,
      isMainnet,
      genesisHash: cachedGenesisHash,
      cluster: isDevnet ? 'devnet' : isMainnet ? 'mainnet-beta' : 'unknown',
      error: isDevnet
        ? null
        : isMainnet
        ? 'Fatal: Connected to Solana Mainnet-Beta. Valtics is restricted strictly to Solana Devnet for safety.'
        : 'Warning: Connected RPC genesis hash does not match Solana Devnet.',
    };
  }

  try {
    const genesisHash = await connection.getGenesisHash();
    cachedGenesisHash = genesisHash;
    lastCheckTime = now;

    const isDevnet = genesisHash === SOLANA_DEVNET_GENESIS_HASH;
    const isMainnet = genesisHash === SOLANA_MAINNET_GENESIS_HASH;

    let error: string | null = null;
    let cluster: 'devnet' | 'mainnet-beta' | 'testnet' | 'unknown' = 'unknown';

    if (isDevnet) {
      cluster = 'devnet';
    } else if (isMainnet) {
      cluster = 'mainnet-beta';
      error = 'Fatal: Connected to Solana Mainnet-Beta. Valtics is restricted strictly to Solana Devnet for safety.';
    } else {
      cluster = 'unknown';
      error = `RPC Genesis Hash (${genesisHash.slice(0, 8)}...) does not match canonical Solana Devnet (${SOLANA_DEVNET_GENESIS_HASH.slice(0, 8)}...).`;
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
      isDevnet: false,
      isMainnet: false,
      genesisHash: '',
      cluster: 'unknown',
      error: `Could not verify cluster genesis hash: ${err?.message || 'Network unreachable'}`,
    };
  }
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
