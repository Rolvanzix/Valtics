import { StructuredAssetProfile, VerificationStatus } from '../types/asset';
import { DBCPoolState } from '../types';
import { getCreatedMarkets } from '../services/marketStorage';
import { METEORA_DBC_PROGRAM_ID } from '../config/constants';

// Predefined asset profiles: Empty by default.
// Only authentic, on-chain verified or created assets appear in Valtics.
export const STRUCTURED_ASSET_PROFILES: StructuredAssetProfile[] = [];

/**
 * Generate a dynamic StructuredAssetProfile from any real DBCPoolState.
 */
export function createAssetProfileFromPool(pool: DBCPoolState): StructuredAssetProfile {
  const hasRef = typeof pool.referencePrice === 'number' && pool.referencePrice > 0;
  const verificationStatus: VerificationStatus = hasRef ? 'Issuer provided' : 'Unverified';

  return {
    id: pool.baseMint ? pool.baseMint.slice(0, 8) : pool.poolAddress.slice(0, 8),
    assetName: pool.tokenName || `Asset ${pool.baseMint ? pool.baseMint.slice(0, 6) : 'DBC'}`,
    ticker: pool.tokenSymbol || 'ASSET',
    assetType: pool.rwaCategory
      ? pool.rwaCategory === 'Treasuries'
        ? 'Tokenized Treasury / Sovereign Debt'
        : pool.rwaCategory === 'Real Estate'
        ? 'Commercial Real Estate Debt / Senior Note'
        : pool.rwaCategory === 'Private Credit'
        ? 'Private Credit Facility'
        : 'Digital Asset / Permissionless Utility'
      : 'Digital Asset / Permissionless Utility',
    underlyingReferenceAsset: pool.description || 'On-chain market asset governed by Meteora Dynamic Bonding Curve.',
    tokenMint: pool.baseMint,
    issuer: {
      name: pool.creator ? `Issuer ${pool.creator.slice(0, 6)}...` : 'On-Chain Deployer',
      entityType: 'Solana Devnet Issuer',
      jurisdiction: 'Permissionless Solana Devnet',
      authorityWallet: pool.creator || 'Permissionless',
    },
    referencePrice: hasRef ? pool.referencePrice! : null,
    referencePriceFormatted: hasRef ? `$${pool.referencePrice!.toFixed(4)}` : 'Data unavailable',
    priceSource: hasRef ? (pool.referencePriceLabel || 'Issuer Self-Attestation') : 'Data unavailable',
    verificationStatus,
    lastUpdatedTimestamp: 'Live Solana RPC Ledger',
    lastUpdatedEpoch: Date.now(),
    representsRealWorldSecurity: false,
    legalDisclaimer: 'This market was deployed on Solana Devnet via Meteora Dynamic Bonding Curve smart contracts. Independent custodian and legal attestations apply when registered with verifiable on-chain certificates.',
    attestationDetails: {
      auditorOrValuer: 'Unverified on Devnet',
      documentType: 'Solana Program Account',
      verificationDate: 'Live',
      verificationMethod: 'Meteora DBC Smart Contract Validation',
      certifyingEntity: 'Solana Devnet Cluster',
    },
    onChainData: {
      poolAddress: pool.poolAddress,
      programId: METEORA_DBC_PROGRAM_ID,
      network: pool.network || 'devnet',
      spotPrice: pool.currentPrice || 0,
      quoteSymbol: pool.quoteMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'USDC',
      quoteReserve: `${pool.quoteReserve || '0'} quote`,
      baseReserve: `${pool.baseReserve || '0'} base`,
      curveProgressPct: pool.quoteCurveProgressPct || 0,
      isMigrated: pool.isMigrated || false,
      tokenProgram: 'SPL Token',
      currentSlot: pool.slot || 0,
      liquidityLockDays: pool.liquidityLockDays || 0,
    },
    externalReferenceData: {
      referencePrice: hasRef ? pool.referencePrice! : null,
      priceSource: hasRef ? (pool.referencePriceLabel || 'Self-Reported') : 'Data unavailable',
      sourceType: hasRef ? 'Regulatory Filing' : 'Data unavailable',
      benchmarkYieldOrReturn: undefined,
      lastOraclePing: hasRef ? 'Issuer Defined' : 'No Oracle Connected',
      confidenceInterval: 'N/A',
      isLiveFeed: false,
    },
    issuerProvidedData: {
      description: pool.description || 'Permissionless DBC pool on Solana.',
      offeringSummary: 'Market created via Meteora Dynamic Bonding Curve.',
      investorAccreditationRequired: false,
      legalStructure: 'On-Chain Smart Contract',
    },
    calculatedMetrics: {
      premiumDiscountToNavPct: hasRef && pool.referencePrice
        ? ((pool.currentPrice - pool.referencePrice) / pool.referencePrice) * 100
        : null,
      marketCapUsd: (pool.totalSupply || 10000000) * (pool.currentPrice || 0),
      tvlUsd: pool.tvlUsd || 0,
      liquidityDepthUsd: pool.tvlUsd || 0,
      distanceToGraduationQuote: pool.quoteThreshold || '0',
      effectiveSpreadBps: pool.baseFeeBps || 25,
    },
  };
}

/**
 * Returns all asset profiles, derived directly from created markets or user-validated tokens.
 */
export function getAllAssetProfiles(): StructuredAssetProfile[] {
  const result: StructuredAssetProfile[] = [];
  const knownMints = new Set<string>();
  const knownPools = new Set<string>();

  try {
    const createdMarkets = getCreatedMarkets();
    for (const pool of createdMarkets) {
      const mintLower = (pool.baseMint || '').toLowerCase();
      const poolLower = (pool.poolAddress || '').toLowerCase();
      if ((mintLower && !knownMints.has(mintLower)) || (poolLower && !knownPools.has(poolLower))) {
        result.push(createAssetProfileFromPool(pool));
        if (mintLower) knownMints.add(mintLower);
        if (poolLower) knownPools.add(poolLower);
      }
    }
  } catch {
    // Graceful fallback in environments without localStorage
  }

  return result;
}

/**
 * Looks up an asset profile by mint, pool address, or ticker across all authentic profiles.
 */
export function getAssetProfile(identifier: string): StructuredAssetProfile | undefined {
  if (!identifier) return undefined;
  const lower = identifier.toLowerCase();
  const all = getAllAssetProfiles();
  return all.find(
    (p) =>
      p.id.toLowerCase() === lower ||
      p.tokenMint.toLowerCase() === lower ||
      p.onChainData.poolAddress.toLowerCase() === lower ||
      p.ticker.toLowerCase() === lower
  );
}
