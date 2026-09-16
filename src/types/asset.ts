import { ClusterNetwork } from './index';

export type VerificationStatus = 'Verified' | 'Issuer provided' | 'Unverified' | 'Data unavailable';

export type AssetClassificationType =
  | 'Tokenized Treasury / Sovereign Debt'
  | 'Commercial Real Estate Debt / Senior Note'
  | 'Private Credit Facility'
  | 'Equity-Like Tracking Token'
  | 'Tokenized Real Estate Equity'
  | 'Structured Commodity Offset Note'
  | 'Digital Asset / Permissionless Utility';

export interface IssuerProfile {
  name: string;
  entityType: string; // e.g. "Delaware Statutory Trust", "LP Fund SPV", "Public Corporation", "Unregistered Syndicate"
  jurisdiction: string;
  registrationNumber?: string;
  leiCode?: string; // Legal Entity Identifier
  authorityWallet: string;
  website?: string;
  contactEmail?: string;
}

export interface AttestationDetails {
  attestationHash?: string;
  auditorOrValuer?: string;
  documentType?: string; // e.g. "Independent Appraisal", "Custodian Holding Attestation", "Audited Financials"
  documentUrl?: string; // IPFS CID or verifiable URL
  verificationDate?: string;
  verificationMethod?: string;
  certifyingEntity?: string;
}

export interface OnChainMarketDataLayer {
  poolAddress: string;
  programId: string;
  network: ClusterNetwork;
  spotPrice: number;
  quoteSymbol: string;
  quoteReserve: string;
  baseReserve: string;
  curveProgressPct: number;
  isMigrated: boolean;
  tokenProgram: 'Token-2022' | 'SPL Token';
  currentSlot?: number;
  creationSlot?: number;
  liquidityLockDays?: number;
}

export interface ExternalReferenceDataLayer {
  referencePrice: number | null; // Strictly null if Data unavailable
  priceSource: string; // e.g. "Chainlink RWA NAV Oracle", "CBRE Independent Appraisal", "Data unavailable"
  sourceType: 'Oracle Feed' | 'Audit / Appraisal' | 'Regulatory Filing' | 'Exchange Benchmark' | 'Data unavailable';
  benchmarkYieldOrReturn?: string;
  isinOrCusip?: string;
  lastOraclePing?: string;
  confidenceInterval?: string;
  isLiveFeed: boolean;
}

export interface IssuerProvidedDataLayer {
  description: string;
  offeringSummary: string;
  targetApyOrDividend?: string;
  investorAccreditationRequired: boolean;
  distributionSchedule?: string;
  legalStructure: string;
  transferRestrictions?: string;
  prospectusIpfsCid?: string;
}

export interface CalculatedMetricsLayer {
  premiumDiscountToNavPct: number | null; // Derived: ((spotPrice - referencePrice) / referencePrice) * 100
  marketCapUsd: number;
  tvlUsd: number;
  liquidityDepthUsd: number;
  distanceToGraduationQuote: string;
  effectiveSpreadBps: number;
}

export interface StructuredAssetProfile {
  id: string;
  assetName: string;
  ticker: string;
  assetType: AssetClassificationType;
  underlyingReferenceAsset: string;
  tokenMint: string;
  issuer: IssuerProfile;
  referencePrice: number | null;
  referencePriceFormatted?: string;
  priceSource: string;
  verificationStatus: VerificationStatus;
  lastUpdatedTimestamp: string;
  lastUpdatedEpoch: number;
  
  // Regulatory & Trust Disclosure: strictly enforced
  representsRealWorldSecurity: boolean;
  legalDisclaimer: string;
  attestationDetails?: AttestationDetails;

  // The 4 strictly separated and labeled data layers
  onChainData: OnChainMarketDataLayer;
  externalReferenceData: ExternalReferenceDataLayer;
  issuerProvidedData: IssuerProvidedDataLayer;
  calculatedMetrics: CalculatedMetricsLayer;
}
