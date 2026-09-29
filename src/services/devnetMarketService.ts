import crypto from 'crypto';
import { DBCPoolState } from '../types';

// In-memory market registry for Devnet
const devnetMarkets: DBCPoolState[] = [];

/**
 * Creates a Devnet Market.
 * Frictionless for developer testing and demonstration on Solana Devnet.
 */
export function createDevnetMarket(
  marketPayload: any
): { success: boolean; market: DBCPoolState } {
  const marketId = 'devnet-mkt-' + crypto.randomUUID();
  const now = new Date();

  const newMarket: DBCPoolState = {
    ...marketPayload,
    poolAddress: marketPayload.poolAddress || 'devnet_' + crypto.randomBytes(16).toString('hex'),
    configAddress: marketPayload.configAddress || 'devnet_cfg_' + crypto.randomBytes(16).toString('hex'),
    baseMint: marketPayload.baseMint || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    quoteMint: marketPayload.quoteMint || 'So11111111111111111111111111111111111111112',
    creator: marketPayload.creator || 'devnet-demo-creator',
    network: 'devnet',
    createdAt: now.toISOString(),
    creationDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    ...({
      environment: 'devnet',
      marketId,
      authenticatedCreatorWallet: marketPayload.creator || 'devnet-demo-creator',
      authorityType: 'devnet_permissionless',
    } as any),
  };

  devnetMarkets.unshift(newMarket);
  return { success: true, market: newMarket };
}

/**
 * Returns all Devnet markets.
 */
export function getDevnetMarkets(): DBCPoolState[] {
  return [...devnetMarkets];
}
