import { Connection, PublicKey } from '@solana/web3.js';
import { TokenMetadata } from '../types';

let currentConnection: Connection | null = null;
let currentEndpointUrl: string = '';

export function getSolanaConnection(rpcUrl: string): Connection {
  if (currentConnection && currentEndpointUrl === rpcUrl) {
    return currentConnection;
  }
  currentEndpointUrl = rpcUrl;
  currentConnection = new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });
  return currentConnection;
}

export async function checkRpcLatency(rpcUrl: string): Promise<{ latencyMs: number; slot: number; ok: boolean }> {
  const start = performance.now();
  try {
    const connection = getSolanaConnection(rpcUrl);
    const slot = await connection.getSlot('confirmed');
    const latencyMs = Math.round(performance.now() - start);
    return { latencyMs, slot, ok: true };
  } catch {
    return { latencyMs: -1, slot: 0, ok: false };
  }
}

export async function fetchSolBalance(connection: Connection, pubkeyStr: string): Promise<number | null> {
  try {
    const pubkey = new PublicKey(pubkeyStr);
    const lamports = await connection.getBalance(pubkey, 'confirmed');
    return lamports / 1e9;
  } catch (err) {
    console.error('Error fetching SOL balance:', err);
    return null;
  }
}

export async function fetchAccountInfo(connection: Connection, address: string) {
  try {
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey, 'confirmed');
    return accountInfo;
  } catch (err) {
    console.error('Error fetching account info:', err);
    return null;
  }
}

export async function inspectSplTokenMint(
  connection: Connection,
  mintAddress: string
): Promise<TokenMetadata | null> {
  try {
    const pubkey = new PublicKey(mintAddress);
    const accountInfo = await connection.getAccountInfo(pubkey, 'confirmed');
    if (!accountInfo) return null;

    const data = accountInfo.data;
    // Standard SPL Token Mint layout is 82 bytes
    // Decimals is at offset 44 (1 byte)
    // IsInitialized is at offset 45
    // Freeze Authority option is at offset 46 (4 bytes) and pubkey at 50
    let decimals = 9;
    let mintAuthority: string | null = null;
    let freezeAuthority: string | null = null;
    let supplyStr = '0';

    if (data.length >= 82) {
      // Mint authority option (first 4 bytes)
      const hasMintAuth = data.readUInt32LE(0) !== 0;
      if (hasMintAuth) {
        mintAuthority = new PublicKey(data.subarray(4, 36)).toBase58();
      }
      // Supply: uint64 at offset 36
      const supplyBigInt = data.readBigUInt64LE(36);
      decimals = data[44];
      supplyStr = (Number(supplyBigInt) / Math.pow(10, decimals)).toLocaleString();

      // Freeze authority option at offset 46
      const hasFreezeAuth = data.readUInt32LE(46) !== 0;
      if (hasFreezeAuth) {
        freezeAuthority = new PublicKey(data.subarray(50, 82)).toBase58();
      }
    }

    const isToken2022 = accountInfo.owner.toBase58() === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

    return {
      mint: mintAddress,
      name: `Token ${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`,
      symbol: 'TKN',
      decimals,
      supply: supplyStr,
      mintAuthority,
      freezeAuthority,
      isToken2022,
    };
  } catch (err) {
    console.error('Error inspecting SPL token mint:', err);
    return null;
  }
}
