import crypto from 'crypto';
import { PublicKey } from '@solana/web3.js';
import { DBCPoolState } from '../types';

// In-memory market registry for Devnet
const devnetMarkets: DBCPoolState[] = [];

export function isValidSolanaAddress(address?: string | null): boolean {
  if (!address || typeof address !== 'string') return false;
  try {
    const pk = new PublicKey(address);
    return PublicKey.isOnCurve(pk.toBuffer());
  } catch {
    return false;
  }
}

export function isValidSolanaTxSignature(sig?: string | null): boolean {
  if (!sig || typeof sig !== 'string') return false;
  // Solana base58 signatures are typically 87-88 characters, occasionally 64-88
  return /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(sig.trim());
}

/**
 * Creates or registers a Devnet Market record.
 * Strictly separates local configurations/drafts from confirmed on-chain pools.
 */
export function createDevnetMarket(
  marketPayload: any
): { success: boolean; market: DBCPoolState } {
  const marketId = marketPayload.marketId || ('devnet-mkt-' + crypto.randomUUID());
  const now = new Date();

  const isVerifiedAddress = isValidSolanaAddress(marketPayload.poolAddress);
  const hasValidSignature = isValidSolanaTxSignature(marketPayload.txSignature);
  const isExplicitlyVerified = marketPayload.deploymentStatus === 'verified' && isVerifiedAddress && hasValidSignature;

  const deploymentStatus: DBCPoolState['deploymentStatus'] = isExplicitlyVerified
    ? 'verified'
    : marketPayload.deploymentStatus || (hasValidSignature ? 'submitted' : 'draft');

  const onChainVerified = isExplicitlyVerified;
  const isLocalRecord = !isExplicitlyVerified;

  // Never generate a fake base58 or hex address looking like an on-chain pool
  const poolAddress = isVerifiedAddress
    ? marketPayload.poolAddress
    : (marketPayload.poolAddress && marketPayload.poolAddress.startsWith('draft_')
        ? marketPayload.poolAddress
        : `draft_pool_${crypto.randomUUID().slice(0, 8)}`);

  const configAddress = isValidSolanaAddress(marketPayload.configAddress)
    ? marketPayload.configAddress
    : `draft_cfg_${crypto.randomUUID().slice(0, 8)}`;

  const newMarket: DBCPoolState = {
    ...marketPayload,
    poolAddress,
    configAddress,
    baseMint: marketPayload.baseMint || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    quoteMint: marketPayload.quoteMint || 'So11111111111111111111111111111111111111112',
    creator: marketPayload.creator || 'devnet-local-creator',
    network: 'devnet',
    createdAt: marketPayload.createdAt || now.toISOString(),
    creationDate: marketPayload.creationDate || now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    deploymentStatus,
    onChainVerified,
    isLocalRecord,
    txSignature: hasValidSignature ? marketPayload.txSignature : undefined,
    verificationTimestamp: isExplicitlyVerified ? (marketPayload.verificationTimestamp || now.getTime()) : undefined,
    verificationNote: isExplicitlyVerified
      ? 'Verified on Solana Devnet cluster'
      : (hasValidSignature
          ? 'Transaction submitted to Devnet; account verification pending'
          : 'Local configuration draft / simulation record (Not deployed on-chain)'),
    provenance: isExplicitlyVerified ? 'On-Chain Meteora DBC' : 'Local Draft / Studio Simulation',
    ...({
      environment: 'devnet',
      marketId,
      authenticatedCreatorWallet: marketPayload.creator || 'devnet-local-creator',
      authorityType: isExplicitlyVerified ? 'devnet_permissionless' : 'local_draft',
    } as any),
  };

  devnetMarkets.unshift(newMarket);
  return { success: true, market: newMarket };
}

/**
 * Returns all Devnet market records.
 */
export function getDevnetMarkets(): DBCPoolState[] {
  return [...devnetMarkets];
}

/**
 * Returns only verified on-chain Devnet markets.
 */
export function getVerifiedDevnetMarkets(): DBCPoolState[] {
  return devnetMarkets.filter((m) => m.onChainVerified && m.deploymentStatus === 'verified');
}

/**
 * Returns only local draft / simulated market records.
 */
export function getLocalDraftMarkets(): DBCPoolState[] {
  return devnetMarkets.filter((m) => !m.onChainVerified || m.deploymentStatus !== 'verified');
}

