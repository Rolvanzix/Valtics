import { CurveModelParams, DBCPoolState } from './index';

export type AgentRole = 'user' | 'assistant' | 'system';

export type AgentWorkspaceMode = 'landing' | 'scan' | 'explore' | 'create' | 'understand' | 'chat';

export interface AgentActionRecommendation {
  type: 'curve_recommendation' | 'market_scan' | 'asset_analysis';
  title: string;
  summary: string;
  curveParams?: CurveModelParams;
  targetPoolAddress?: string;
}

export interface AgentChatMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: number;
  recommendation?: AgentActionRecommendation;
  sourceIndicators?: string[];
  marketDataSnippet?: {
    poolCount?: number;
    highlightPool?: string;
  };
}

export interface AgentScanResult {
  poolAddress: string;
  tokenName: string;
  tokenSymbol: string;
  baseMint: string;
  quoteSymbol: string;
  currentPrice: number;
  quoteReserve: string;
  quoteCurveProgressPct: number;
  healthScore: 'OPTIMAL' | 'MODERATE' | 'CAUTION' | 'EARLY';
  healthAssessment: string;
  graduationStatus: 'ACCUMULATING' | 'NEAR_GRADUATION' | 'GRADUATED';
}

export interface StructuredMarketAnalysis {
  poolAddress: string;
  tokenName: string;
  tokenSymbol: string;
  baseMint: string;
  quoteSymbol: string;

  // 1. Observed Information (Hard verifiable facts from on-chain & Pyth)
  observedInformation: {
    spotPrice: number;
    quoteReserve: string;
    baseReserve: string;
    curveProgressPct: number;
    network: 'Solana Devnet';
    programId: string;
    verifiedOraclePing: string | null;
    currentSlot: number;
  };

  // 2. Agent Interpretation (Analytical deduction & risk synthesis)
  agentInterpretation: {
    marketHealth: 'OPTIMAL' | 'MODERATE' | 'CAUTION';
    liquidityDepthRating: string;
    graduationProbability: string;
    spreadFairness: string;
    factorsToWatch: string[];
    possibleScenarios: {
      bullGraduation: string;
      steadyAccumulation: string;
      liquidityStall: string;
    };
  };

  // 3. Areas Requiring Further Research (Information gaps, off-chain assumptions)
  areasRequiringResearch: string[];
}

export interface GuidedMarketCreationState {
  step: number; // 1 to 10
  // 1. Market Idea
  marketIdea: string;
  // 2. Underlying Subject
  assetSubject: string;
  assetCategory: 'Treasuries' | 'Private Credit' | 'Real Estate' | 'Digital Asset' | 'Commodity';
  // 3. Market Question / Thesis
  marketQuestion: string;
  // 4. Possible Outcomes / Valuation Bounds
  startPrice: number;
  targetGraduationCap: number;
  // 5. Resolution Condition
  resolutionCondition: string;
  // 6. Resolution Data Source
  resolutionDataSource: string;
  // 7. Time Boundary & Rate Limiting
  antiSniperSlots: number;
  liquidityLockDays: number;
  // 8. Edge Cases Identified by Agent
  ambiguityChecklist: Array<{ text: string; resolved: boolean; mitigation: string }>;
  // 9. Review & Parameters
  quoteAsset: 'USDC' | 'SOL';
  curveType: 'linear' | 'sigmoid' | 'exponential' | 'piecewise';
  feeBps: number;
  totalSupply: number;
  curveAllocationPct: number;
  // 10. User Approval
  approvedByUser: boolean;
}

export interface AgentMarketSummary {
  totalMarkets: number;
  totalTvlEstimated: number;
  avgCurveProgress: number;
  nearGraduationCount: number;
  markets: AgentScanResult[];
  scanTimestamp: number;
}
