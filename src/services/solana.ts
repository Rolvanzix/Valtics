import { Connection, PublicKey } from '@solana/web3.js';
import { TokenMetadata } from '../types';
import { getExplorerUrl } from '../config/constants';

export interface RealOnChainTxItem {
  signature: string;
  slot: number;
  blockTime: number | null;
  timestampFormatted: string;
  status: 'Finalized' | 'Confirmed' | 'Failed';
  type: string;
  network: string;
  err: string | null;
  explorerUrl: string;
  memo?: string | null;
}

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

const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export async function inspectSplTokenMint(
  connection: Connection,
  mintAddress: string
): Promise<TokenMetadata> {
  const trimmed = mintAddress.trim();
  let pubkey: PublicKey;

  try {
    pubkey = new PublicKey(trimmed);
  } catch {
    throw new Error('Invalid address format. Expected a 32-44 character Base58 Solana public key.');
  }

  // 1. Fetch parsed account info from Solana Devnet RPC
  let parsedAccount;
  try {
    parsedAccount = await connection.getParsedAccountInfo(pubkey, 'confirmed');
  } catch (rpcErr: any) {
    throw new Error(`RPC connection error checking Devnet address: ${rpcErr?.message || 'Network timeout'}`);
  }

  if (!parsedAccount.value) {
    throw new Error('Account does not exist on Solana Devnet. The entered address is not deployed on this network.');
  }

  const ownerStr = parsedAccount.value.owner.toBase58();
  const isSplToken = ownerStr === SPL_TOKEN_PROGRAM_ID;
  const isToken2022 = ownerStr === TOKEN_2022_PROGRAM_ID;

  if (!isSplToken && !isToken2022) {
    throw new Error(
      `Account is owned by program ${ownerStr}, not an SPL Token or Token-2022 program. Only verified token mints can be onboarded.`
    );
  }

  const data = parsedAccount.value.data;
  if (!data || typeof data !== 'object' || !('parsed' in data)) {
    throw new Error('Unable to parse token data structure on Devnet.');
  }

  if (data.parsed.type !== 'mint') {
    throw new Error(
      `Address belongs to a "${data.parsed.type}" account, not an initialized token mint. Please enter the token's Mint address.`
    );
  }

  const info = data.parsed.info;
  if (!info.isInitialized) {
    throw new Error('Token mint account exists on Devnet but has not been initialized.');
  }

  const decimals = info.decimals;
  const rawSupply = info.supply;
  
  // Reliably format supply
  let supplyStr = '0';
  try {
    const rawBig = BigInt(rawSupply);
    const factor = BigInt(10 ** decimals);
    const whole = rawBig / factor;
    const frac = rawBig % factor;
    supplyStr = whole.toLocaleString('en-US');
    if (decimals > 0 && frac > 0n) {
      const fracFormatted = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
      supplyStr += '.' + fracFormatted;
    }
  } catch {
    supplyStr = info.supply || '0';
  }

  let tokenName = '';
  let tokenSymbol = '';
  let tokenUri: string | undefined = undefined;

  // 2. Query real on-chain Metaplex metadata PDA
  try {
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('metadata'), METAPLEX_PROGRAM_ID.toBuffer(), pubkey.toBuffer()],
      METAPLEX_PROGRAM_ID
    );
    const metaAccount = await connection.getAccountInfo(metadataPDA, 'confirmed');
    if (metaAccount && metaAccount.data.length > 68) {
      const metaData = metaAccount.data;
      let offset = 1 + 32 + 32;
      const nameLen = metaData.readUInt32LE(offset);
      offset += 4;
      if (nameLen > 0 && offset + nameLen <= metaData.length) {
        const rawName = metaData.subarray(offset, offset + nameLen).toString('utf8').replace(/\0/g, '').trim();
        if (rawName) tokenName = rawName;
      }
      offset += nameLen;
      const symLen = metaData.readUInt32LE(offset);
      offset += 4;
      if (symLen > 0 && offset + symLen <= metaData.length) {
        const rawSym = metaData.subarray(offset, offset + symLen).toString('utf8').replace(/\0/g, '').trim();
        if (rawSym) tokenSymbol = rawSym;
      }
      offset += symLen;
      const uriLen = metaData.readUInt32LE(offset);
      offset += 4;
      if (uriLen > 0 && offset + uriLen <= metaData.length) {
        const rawUri = metaData.subarray(offset, offset + uriLen).toString('utf8').replace(/\0/g, '').trim();
        if (rawUri) tokenUri = rawUri;
      }
    }
  } catch {
    // Non-fatal if Metaplex PDA does not exist
  }

  // Fallback labels if on-chain Metaplex metadata is not registered
  if (!tokenName) {
    tokenName = `Token ${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
  }
  if (!tokenSymbol) {
    tokenSymbol = 'TKN';
  }

  return {
    mint: trimmed,
    name: tokenName,
    symbol: tokenSymbol,
    decimals,
    supply: supplyStr,
    rawSupply,
    uri: tokenUri,
    mintAuthority: info.mintAuthority || null,
    freezeAuthority: info.freezeAuthority || null,
    isToken2022,
    programId: ownerStr,
  };
}

/**
 * Queries real on-chain transaction signatures from Solana RPC for any address.
 * Never generates mock transaction signatures.
 */
export async function fetchRealOnChainSignaturesForAddress(
  connection: Connection,
  address: string,
  network: string,
  limit = 15
): Promise<RealOnChainTxItem[]> {
  try {
    const pubkey = new PublicKey(address);
    const signatures = await connection.getSignaturesForAddress(pubkey, { limit });
    if (!signatures || signatures.length === 0) {
      return [];
    }

    return signatures.map((sig) => {
      const isErr = !!sig.err;
      const status: 'Finalized' | 'Confirmed' | 'Failed' = isErr
        ? 'Failed'
        : sig.confirmationStatus === 'finalized'
        ? 'Finalized'
        : 'Confirmed';

      let txType = 'Meteora DBC Instruction';
      if (sig.memo) {
        txType = `Memo: ${sig.memo.slice(0, 28)}`;
      }

      const timestampFormatted = sig.blockTime
        ? new Date(sig.blockTime * 1000).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          })
        : 'Pending confirmation';

      return {
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime ?? null,
        timestampFormatted,
        status,
        type: txType,
        network,
        err: isErr ? JSON.stringify(sig.err) : null,
        explorerUrl: getExplorerUrl(sig.signature, 'tx', network as any),
        memo: sig.memo,
      };
    });
  } catch (err) {
    console.warn(`Could not fetch signatures for address ${address}:`, err);
    return [];
  }
}
