import { AgentChatMessage, AgentMarketSummary, AgentActionRecommendation } from '../types/agent';
import { DBCPoolState } from '../types';

export interface AgentChatPayload {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  walletContext?: {
    connected: boolean;
    publicKey: string | null;
    balanceSol: number | null;
  };
  clientKnownMarkets?: DBCPoolState[];
}

export interface AgentChatResponse {
  success: boolean;
  message: string;
  recommendation?: AgentActionRecommendation;
  error?: string;
}

export async function sendAgentQuery(payload: AgentChatPayload): Promise<AgentChatResponse> {
  try {
    const res = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('[Valtics Agent Service] Error sending query:', err);
    return {
      success: false,
      message: 'Unable to communicate with the VALTICS Agent intelligence service. Please ensure the server is running.',
      error: err.message,
    };
  }
}

export async function fetchAgentMarketScan(clientKnownMarkets?: DBCPoolState[]): Promise<AgentMarketSummary> {
  try {
    const res = await fetch('/api/agent/scan-markets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientKnownMarkets: clientKnownMarkets || [] }),
    });

    if (!res.ok) {
      throw new Error(`Failed to scan markets: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('[Valtics Agent Service] Fallback client market scan:', err);
    // Client-side fallback if server scan fails
    const rawMarkets = clientKnownMarkets || [];
    const scanResults = rawMarkets.map((m) => {
      const progress = m.quoteCurveProgressPct || 0;
      let status: 'ACCUMULATING' | 'NEAR_GRADUATION' | 'GRADUATED' = 'ACCUMULATING';
      if (m.isMigrated || progress >= 100) status = 'GRADUATED';
      else if (progress >= 75) status = 'NEAR_GRADUATION';

      const healthScore: 'OPTIMAL' | 'MODERATE' | 'CAUTION' | 'EARLY' =
        progress > 80 ? 'OPTIMAL' : progress > 20 ? 'MODERATE' : 'EARLY';

      return {
        poolAddress: m.poolAddress,
        tokenName: m.tokenName || 'Asset Pool',
        tokenSymbol: m.tokenSymbol || 'ASSET',
        baseMint: m.baseMint,
        quoteSymbol: m.quoteMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'USDC',
        currentPrice: m.currentPrice || 0,
        quoteReserve: `${m.quoteReserve || '0'}`,
        quoteCurveProgressPct: progress,
        healthScore,
        healthAssessment: `Devnet pool active with ${progress}% curve completion towards Meteora DAMM migration.`,
        graduationStatus: status,
      };
    });

    return {
      totalMarkets: scanResults.length,
      totalTvlEstimated: rawMarkets.reduce((acc, m) => acc + (m.tvlUsd || 0), 0),
      avgCurveProgress: scanResults.length > 0
        ? Math.round(scanResults.reduce((acc, m) => acc + m.quoteCurveProgressPct, 0) / scanResults.length)
        : 0,
      nearGraduationCount: scanResults.filter((m) => m.graduationStatus === 'NEAR_GRADUATION').length,
      markets: scanResults,
      scanTimestamp: Date.now(),
    };
  }
}
