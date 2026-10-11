import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  MessageSquareCode,
  ShieldCheck,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

interface AgentExploreViewProps {
  onExploreInChat: (query: string) => void;
}

export const AgentExploreView: React.FC<AgentExploreViewProps> = ({ onExploreInChat }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('treasuries');

  const topics = [
    {
      id: 'treasuries',
      title: 'Tokenized US Treasuries',
      category: 'Sovereign Debt',
      badge: 'Par NAV ($1.00)',
      summary: 'Deterministic bonding curve dynamics for risk-free yield instruments and short-duration T-bills.',
      overview: 'Tokenized short-term government debt requires pricing models anchored to Par ($1.00) with minimal volatility. Meteora Linear curves provide tight bid-ask spreads (25 bps) while accumulating Devnet USDC reserves until maturity or secondary DAMM migration.',
      keyVariables: [
        'Par NAV Anchor ($1.00)',
        'Quote Asset: Devnet USDC',
        'Recommended Spread: 25 bps',
        'Graduation Target: $10M - $25M',
      ],
      devnetNote: 'Testing on Solana Devnet allows issuers to simulate coupon reinvestment and instantaneous atomic swaps against USDC.',
      suggestedQuery: 'Explain how tokenized US Treasuries maintain $1.00 Par NAV on a Meteora Linear Dynamic Bonding Curve.',
    },
    {
      id: 'damm-migration',
      title: 'Meteora DAMM Graduation',
      category: 'Liquidity Architecture',
      badge: 'Autonomous Migration',
      summary: 'Atomic transition of accumulated quote reserves from bonding curve into permanent AMM pools.',
      overview: 'When a bonding curve pool achieves its target quote threshold, the Meteora DBC contract atomically deposits quote and base reserves into a Meteora Dynamic AMM (DAMM) pool. Liquidity is permanently locked according to the issuer vesting duration.',
      keyVariables: [
        'Atomic Program Instruction',
        'Zero Centralized Custodian',
        'Configurable Vesting Days',
        'Permanent LP Token Lock',
      ],
      devnetNote: 'All graduation events on Devnet can be triggered safely with test SOL or test USDC.',
      suggestedQuery: 'Walk me through the exact step-by-step smart contract execution when a Meteora DBC pool graduates to DAMM.',
    },
    {
      id: 'private-credit',
      title: 'Private Credit Facilities',
      category: 'Structured Yield',
      badge: 'S-Curve Pricing',
      summary: 'Non-bank lending and debt facility tokenization with Sigmoid pricing plateaus.',
      overview: 'Private credit requires controlled price discovery where early participants absorb risk while late-stage liquidity stabilizes around loan face value. Sigmoid curves simulate this by providing slow initial growth, a steep discovery phase, and a flat valuation ceiling.',
      keyVariables: [
        'Sigmoid Curve Architecture',
        'Higher Base Spread (50 - 100 bps)',
        'Quarterly Appraised NAV Inputs',
        'Controlled Supply Vesting',
      ],
      devnetNote: 'Devnet simulation allows testing credit tranche tranches without exposing unhedged real-world capital.',
      suggestedQuery: 'Why is a Sigmoid (S-curve) curve shape best suited for tokenized private credit and structured debt facilities?',
    },
    {
      id: 'anti-sniper',
      title: 'Anti-MEV & Anti-Sniper Windows',
      category: 'Launch Protection',
      badge: 'Rate Limiting',
      summary: 'Slot-based protection mechanisms that prevent frontrunning bots from exploiting block 0 liquidity.',
      overview: 'Public token launches often suffer from sniper bots consuming entire early reserves in block 0. Meteora DBC solves this via slot-based rate limiters, capping trade volume per wallet across the first 40-100 slots (~16-40 seconds).',
      keyVariables: [
        'Slot-Based Volume Capping',
        'Dynamic Slippage Degradation',
        'Fair Market Participant Entry',
        'Automated Decay Schedule',
      ],
      devnetNote: 'Solana Devnet transactions allow developers to test bot simulation scripts and measure anti-sniper effectiveness.',
      suggestedQuery: 'How does Meteora DBC slot-based rate limiting prevent MEV frontrunning and sniper bot attacks on launch?',
    },
    {
      id: 'pyth-oracles',
      title: 'Pyth Oracle Benchmarking',
      category: 'Oracle Infrastructure',
      badge: 'Sub-Second Feeds',
      summary: 'Pulling real-time reference prices for commodities, foreign exchange, and equity indices.',
      overview: 'VALTICS integrates Pyth Network Hermes oracle feeds to provide reference valuations for real-world assets. Feeds provide confidence intervals and publish timestamps to verify price freshness before market parameters are locked.',
      keyVariables: [
        'Hermes REST & WebSocket API',
        'Publish Time Staleness Checks',
        'Confidence Interval Bounds',
        'Market Hours Awareness',
      ],
      devnetNote: 'Pyth feeds update continuously, allowing Devnet issuers to cross-reference spot prices against real-world assets.',
      suggestedQuery: 'How does VALTICS use Pyth Network price feeds to benchmark bonding curve starting prices for tokenized RWAs?',
    },
  ];

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-2 shadow-md shadow-[#09011B]/60">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#100126] text-[#D76EDD] border border-[#670CDC]/30">
            GUIDED RESEARCH
          </span>
          <span className="text-[11px] text-[#7E6D96] font-mono">Market Exploration Core</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#F7F3FF] tracking-tight font-sans">
          Institutional Market Exploration
        </h2>
        <p className="text-xs text-[#B8A9CC] font-sans max-w-2xl">
          Investigate key topics and structural mechanisms shaping tokenized programmable markets on Solana Devnet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topic Navigation List */}
        <div className="space-y-2">
          <span className="text-xs font-mono text-[#B8A9CC] uppercase tracking-wider block">
            Select Exploration Subject
          </span>
          <div className="space-y-2">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTopicId(t.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedTopicId === t.id
                    ? 'border-[#670CDC] bg-[#1C0142] text-[#F7F3FF] shadow-md shadow-[#670CDC]/20'
                    : 'border-[#670CDC]/20 bg-[#140130] hover:border-[#670CDC]/40 text-[#B8A9CC]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#100126] border border-[#670CDC]/25 text-[#D76EDD]">
                    {t.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#F99225] font-semibold">{t.badge}</span>
                </div>
                <h4 className="font-semibold text-xs text-[#F7F3FF]">{t.title}</h4>
                <p className="text-[11px] text-[#B8A9CC] mt-1 line-clamp-2 font-sans">{t.summary}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Deep Research Briefing Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-6 space-y-5 shadow-md shadow-[#09011B]/60">
            <div className="border-b border-[#670CDC]/20 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#D76EDD]">{selectedTopic.category}</span>
                <span className="text-[#670CDC]/60">·</span>
                <span className="text-xs font-mono text-[#F99225] font-semibold">{selectedTopic.badge}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#F7F3FF] font-sans">
                {selectedTopic.title}
              </h3>
            </div>

            {/* Overview Section */}
            <div className="space-y-2 text-xs text-[#EDE4FA] leading-relaxed font-sans">
              <h4 className="font-semibold text-[#D76EDD] font-mono text-[11px] uppercase tracking-wider">
                Subject Analysis & Principles
              </h4>
              <p>{selectedTopic.overview}</p>
            </div>

            {/* Key Variables Grid */}
            <div className="space-y-2">
              <h4 className="font-semibold text-[#D76EDD] font-mono text-[11px] uppercase tracking-wider">
                Key Economic & Architectural Variables
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {selectedTopic.keyVariables.map((v, i) => (
                  <div key={i} className="bg-[#100126] p-2.5 rounded-lg border border-[#670CDC]/25 flex items-center gap-2">
                    <span className="text-[#F99225]">•</span>
                    <span className="text-[#EDE4FA]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Devnet Cluster Context */}
            <div className="bg-[#100126] p-3.5 rounded-lg border border-[#670CDC]/25 text-xs text-[#B8A9CC] space-y-1 font-sans">
              <span className="text-[#F99225] font-mono text-[11px] font-semibold block uppercase">
                Solana Devnet Considerations:
              </span>
              <p>{selectedTopic.devnetNote}</p>
            </div>

            {/* Action Strip: Inquire with Agent */}
            <div className="pt-3 border-t border-[#670CDC]/20 flex items-center justify-between">
              <span className="text-[11px] text-[#7E6D96] font-mono">
                Want to investigate this topic further?
              </span>
              <button
                type="button"
                onClick={() => onExploreInChat(selectedTopic.suggestedQuery)}
                className="px-4 py-2 rounded-lg bg-[#670CDC] hover:bg-[#7C18F0] text-[#F7F3FF] font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-[#670CDC]/30"
              >
                <MessageSquareCode className="w-3.5 h-3.5" />
                <span>Deep-Dive with Agent</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
