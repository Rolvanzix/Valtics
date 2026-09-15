export type MarketProfileKey = 'conservative' | 'balanced' | 'growth';

export interface MarketProfilePreset {
  key: MarketProfileKey;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  economicRationales: string[];
  recommendedAssetTypes: string[];
  
  // Curve Economics
  curveDeltaPct: number; // e.g. 5% vs 35% vs 80% price progression
  defaultThresholdQuote: number; // in quote units (e.g. 150k USDC)
  curveAllocationPct: number; // percentage of total supply on curve
  
  // Fee Architecture (Supported by Meteora SDK)
  startingFeeBps: number; // Basis points (e.g. 25 bps = 0.25%)
  endingFeeBps: number; // Basis points (e.g. 20 bps = 0.20%)
  feeDecaySeconds: number; // Scheduler duration in seconds
  creatorFeePercentage: number; // 0 to 100%
  dynamicFeeEnabled: boolean;
  
  // Migration & Protection
  migrationOption: 'MET_DAMM_V2';
  migrationFeeOptionBps: 25 | 30 | 100;
  antiSniperSlots: number;
  creatorPermanentLockedLpPct: number;
}

export const MARKET_PROFILES: Record<MarketProfileKey, MarketProfilePreset> = {
  conservative: {
    key: 'conservative',
    name: 'Conservative',
    badge: 'Capital Preservation & Par Stability',
    tagline: 'Minimal volatility corridor optimized for yield-bearing debt, treasuries, and par-backed assets.',
    description:
      'Engineered for assets with an established reference valuation (e.g. US Treasuries, Institutional Money Markets, Senior Investment-Grade Debt). The curve maintains a tight +/- 3-8% price discovery corridor to prevent speculative volatility while accumulating solid quote reserves before DAMM v2 graduation.',
    economicRationales: [
      'Tight 4.0% price corridor minimizes deviation from reference Net Asset Value (NAV)',
      'Subdued 25 bps (0.25%) base trading fee keeps institutional transaction frictions low',
      'Elevated graduation capital threshold ensures deep institutional liquidity prior to open AMM pools',
      '100% permanent liquidity lock guarantees zero rug risk and irrevocable post-graduation backing',
    ],
    recommendedAssetTypes: ['Treasuries', 'Private Credit', 'Structured Note'],
    curveDeltaPct: 4.0,
    defaultThresholdQuote: 150000,
    curveAllocationPct: 85,
    startingFeeBps: 25,
    endingFeeBps: 20,
    feeDecaySeconds: 86400, // 24 hours
    creatorFeePercentage: 20,
    dynamicFeeEnabled: false,
    migrationOption: 'MET_DAMM_V2',
    migrationFeeOptionBps: 25,
    antiSniperSlots: 50,
    creatorPermanentLockedLpPct: 100,
  },
  balanced: {
    key: 'balanced',
    name: 'Balanced',
    badge: 'Controlled Discovery & Standard RWA',
    tagline: 'Equilibrium curve balancing capital formation with steady asset appreciation.',
    description:
      'The standard institutional configuration for tokenized commercial real estate, asset-backed securities, and diversified credit funds. Features a moderate 25-35% price discovery slope, standard 50 bps base fee with linear decay to 25 bps, and robust anti-sniper slot dampening.',
    economicRationales: [
      'Balanced 25.0% price discovery gradient rewards early capital while preventing wild swings',
      'Standard 50 bps base fee with automated linear decay scheduler to 25 bps as volume establishes',
      'Moderate 75,000 quote asset graduation hurdle suited for syndications and mid-market offerings',
      '100% permanent liquidity lock with Meteora DAMM v2 DLMM bin concentration',
    ],
    recommendedAssetTypes: ['Real Estate', 'Private Credit', 'Commodities'],
    curveDeltaPct: 25.0,
    defaultThresholdQuote: 75000,
    curveAllocationPct: 75,
    startingFeeBps: 50,
    endingFeeBps: 25,
    feeDecaySeconds: 172800, // 48 hours
    creatorFeePercentage: 25,
    dynamicFeeEnabled: true,
    migrationOption: 'MET_DAMM_V2',
    migrationFeeOptionBps: 30,
    antiSniperSlots: 100,
    creatorPermanentLockedLpPct: 100,
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    badge: 'Maximum Price Discovery & Expansion',
    tagline: 'Expansive discovery curve designed for emerging asset classes, venture credit, and dynamic infrastructure.',
    description:
      'Constructed for early-stage real-world ventures, renewable infrastructure projects, and emerging revenue-share assets where secondary market valuation requires wider exploratory latitude. Features an expansive 60-100% curve delta, progressive fee decay to encourage early volume, and dynamic volatility filters.',
    economicRationales: [
      'Dynamic 65.0% price discovery gradient allows the secondary market to establish fair enterprise value',
      '100 bps starting fee dampens front-running and extracts protocol revenue, decaying to 50 bps',
      'Lower 25,000 quote threshold facilitates faster graduation into liquid concentrated AMM bins',
      'Dynamic fee tracking activates during high-volatility buy/sell spikes to protect liquidity providers',
    ],
    recommendedAssetTypes: ['Infrastructure', 'Structured Note', 'Private Credit'],
    curveDeltaPct: 65.0,
    defaultThresholdQuote: 25000,
    curveAllocationPct: 60,
    startingFeeBps: 100,
    endingFeeBps: 50,
    feeDecaySeconds: 259200, // 72 hours
    creatorFeePercentage: 30,
    dynamicFeeEnabled: true,
    migrationOption: 'MET_DAMM_V2',
    migrationFeeOptionBps: 30,
    antiSniperSlots: 200,
    creatorPermanentLockedLpPct: 100,
  },
};

export const NON_FINANCIAL_ADVICE_DISCLAIMER =
  'Notice: Market profiles are mechanical parameter presets for simulation and smart contract configuration purposes only. Presets do not constitute financial, investment, legal, or tax advice. Issuers remain solely responsible for conducting independent mathematical modeling and regulatory compliance reviews for their specific jurisdiction.';

export function applyProfilePresetToInput(
  input: any,
  profileKey: MarketProfileKey,
  referencePrice: number = 1.0
) {
  const profile = MARKET_PROFILES[profileKey];
  const startPrice = input.startingPriceQuote || referencePrice || 1.0;
  const migrationPrice = Number((startPrice * (1 + profile.curveDeltaPct / 100)).toFixed(6));

  return {
    ...input,
    profileKey,
    startingPriceQuote: startPrice,
    migrationPriceQuote: migrationPrice,
    migrationQuoteThreshold: profile.defaultThresholdQuote,
    curveAllocationPct: profile.curveAllocationPct,
    startingFeeBps: profile.startingFeeBps,
    endingFeeBps: profile.endingFeeBps,
    feeDecaySeconds: profile.feeDecaySeconds,
    creatorTradingFeePercentage: profile.creatorFeePercentage,
    dynamicFeeEnabled: profile.dynamicFeeEnabled,
    migrationOption: profile.migrationOption,
    migrationFeeOptionBps: profile.migrationFeeOptionBps,
    antiSniperSlots: profile.antiSniperSlots,
    creatorPermanentLockedLpPct: profile.creatorPermanentLockedLpPct,
    creatorUnlockedLpPct: 100 - profile.creatorPermanentLockedLpPct,
    partnerPermanentLockedLpPct: 0,
    partnerUnlockedLpPct: 0,
  };
}
