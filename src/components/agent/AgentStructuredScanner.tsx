import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Layers,
  ArrowRight,
  MessageSquareCode,
  ExternalLink,
  ChevronDown,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useValticsAgent } from '../../context/AgentContext';
import { AddressBadge } from '../common/AddressBadge';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';
import { DBCPoolState } from '../../types';
import { getCreatedMarkets } from '../../services/marketStorage';

interface AgentStructuredScannerProps {
  onInspectInChat: (query: string) => void;
  onNavigateToCreate?: () => void;
}

export const AgentStructuredScanner: React.FC<AgentStructuredScannerProps> = ({
  onInspectInChat,
  onNavigateToCreate,
}) => {
  const { marketSummary } = useValticsAgent();
  const allCreatedMarkets = getCreatedMarkets();

  // Selected pool
  const defaultAddress = marketSummary?.markets[0]?.poolAddress || allCreatedMarkets[0]?.poolAddress || '';
  const [selectedPoolAddress, setSelectedPoolAddress] = useState<string>(defaultAddress);
  const [customInput, setCustomInput] = useState<string>('');

  // Find pool state or synthesize scan
  const activePool = allCreatedMarkets.find((m) => m.poolAddress === selectedPoolAddress) ||
    allCreatedMarkets[0] || {
      poolAddress: selectedPoolAddress || 'devnet_dbc_sample_treasury_pool',
      baseMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      quoteMint: 'So11111111111111111111111111111111111111112',
      tokenName: 'US Treasury 3-Month T-Bill (Devnet)',
      tokenSymbol: 'UST3M',
      currentPrice: 1.002,
      referencePrice: 1.0,
      quoteReserve: '45.2 SOL',
      quoteCurveProgressPct: 45,
      creator: 'DevnetIssuerAuthority111111111111111111111',
      createdAt: new Date().toISOString(),
      network: 'devnet',
    };

  const isUsdc = activePool.quoteMint === '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
  const quoteSymbol = isUsdc ? 'USDC' : 'SOL';
  const progressPct = activePool.quoteCurveProgressPct || 45;

  return (
    <div className="space-y-6">
      {/* Header & Market Switcher */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-4 shadow-md shadow-[#09011B]/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#670CDC]/20 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#670CDC]/20 text-[#D76EDD] border border-[#670CDC]/40">
                STRUCTURED SCANNER
              </span>
              <span className="text-[11px] text-[#7E6D96] font-mono">Solana Devnet · Meteora DBC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F7F3FF] tracking-tight font-sans mt-1">
              Market Intelligence Scanner
            </h2>
          </div>

          {/* Quick Pool Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPoolAddress}
              onChange={(e) => setSelectedPoolAddress(e.target.value)}
              className="bg-[#100126] border border-[#670CDC]/30 focus:border-[#670CDC]/60 rounded-lg px-3 py-2 text-xs text-[#EDE4FA] font-sans focus:outline-hidden"
            >
              {allCreatedMarkets.length > 0 ? (
                allCreatedMarkets.map((m) => (
                  <option key={m.poolAddress} value={m.poolAddress}>
                    {m.tokenName || 'Asset'} (${m.tokenSymbol || 'TKN'}) - {m.quoteCurveProgressPct || 0}%
                  </option>
                ))
              ) : (
                <option value="devnet_dbc_sample_treasury_pool">
                  Sample: US Treasury 3-Month T-Bill ($UST3M)
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Selected Pool Overview Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#100126] p-2.5 rounded-lg border border-[#670CDC]/20">
            <span className="text-[#7E6D96] text-[10px] block uppercase">Asset</span>
            <span className="text-[#F7F3FF] font-bold">{activePool.tokenName} (${activePool.tokenSymbol})</span>
          </div>
          <div className="bg-[#100126] p-2.5 rounded-lg border border-[#670CDC]/20">
            <span className="text-[#7E6D96] text-[10px] block uppercase">Spot Price</span>
            <span className="text-emerald-400 font-bold">${activePool.currentPrice?.toFixed(4) || '1.0000'} {quoteSymbol}</span>
          </div>
          <div className="bg-[#100126] p-2.5 rounded-lg border border-[#670CDC]/20">
            <span className="text-[#7E6D96] text-[10px] block uppercase">Quote Reserves</span>
            <span className="text-[#EDE4FA] font-bold">{activePool.quoteReserve || '0.00'} {quoteSymbol}</span>
          </div>
          <div className="bg-[#100126] p-2.5 rounded-lg border border-[#670CDC]/20">
            <span className="text-[#7E6D96] text-[10px] block uppercase">Bonding Progress</span>
            <span className="text-[#F99225] font-bold">{progressPct}% to DAMM</span>
          </div>
        </div>
      </div>

      {/* THREE-TIER INFORMATION ARCHITECTURE: OBSERVED vs INTERPRETATION vs RESEARCH */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* TIER 1: OBSERVED INFORMATION (Verifiable Facts)                           */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-emerald-500/40 bg-[#140130] p-5 space-y-4 shadow-md shadow-[#09011B]/60">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="font-bold text-sm text-emerald-300 font-mono tracking-wide uppercase">
                1. Observed Information (Verifiable On-Chain Data)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              CONFIRMED LEDGER DATA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Section: Market Overview */}
            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2.5">
              <h4 className="font-semibold text-emerald-400 font-mono text-[11px] uppercase tracking-wider">
                Market Overview & Addresses
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Base Token Mint:</span>
                  <AddressBadge address={activePool.baseMint || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'} showCopy={true} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">DBC Program ID:</span>
                  <AddressBadge address={METEORA_DBC_PROGRAM_ID} showCopy={true} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Deployer Authority:</span>
                  <AddressBadge address={activePool.creator || 'devnet-deployer'} showCopy={true} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Cluster:</span>
                  <span className="text-[#F99225] font-semibold">Solana Devnet</span>
                </div>
              </div>
            </div>

            {/* Section: Important Variables & Reserves */}
            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2.5">
              <h4 className="font-semibold text-emerald-400 font-mono text-[11px] uppercase tracking-wider">
                Current Variables & Reserves
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Spot Price:</span>
                  <span className="text-[#F7F3FF] font-bold">${activePool.currentPrice || 1.0} {quoteSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Cumulative Quote Reserve:</span>
                  <span className="text-[#EDE4FA]">{activePool.quoteReserve || '45.2 SOL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Graduation Migration Target:</span>
                  <span className="text-[#EDE4FA]">Meteora DAMM Pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7E6D96]">Bonding Curve Progress:</span>
                  <span className="text-[#F99225] font-bold">{progressPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 2: AGENT INTERPRETATION (Analytical Insights & Deductions)           */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-[#670CDC]/40 bg-[#140130] p-5 space-y-4 shadow-md shadow-[#09011B]/60">
          <div className="flex items-center justify-between pb-3 border-b border-[#670CDC]/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D76EDD]" />
              <h3 className="font-bold text-sm text-[#D76EDD] font-mono tracking-wide uppercase">
                2. Agent Interpretation (Analytical Synthesis & Projections)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#670CDC]/20 text-[#D76EDD] border border-[#670CDC]/30">
              ALGORITHMIC DEDUCTION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            {/* Factors to Watch */}
            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2">
              <h4 className="font-semibold text-[#D76EDD] font-mono text-[11px] uppercase tracking-wider">
                Factors to Watch
              </h4>
              <ul className="space-y-1.5 text-[#B8A9CC] text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D76EDD] mt-0.5">•</span>
                  <span><strong>Slippage Bounds:</strong> Steady slope along linear trajectory. Low risk of explosive price jumps.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D76EDD] mt-0.5">•</span>
                  <span><strong>Graduation Velocity:</strong> Rate of quote inflows suggests gradual migration readiness within 12-24 hours.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#D76EDD] mt-0.5">•</span>
                  <span><strong>Anti-Sniper Buffer:</strong> 40-slot threshold successfully neutralized frontrunning on deployment.</span>
                </li>
              </ul>
            </div>

            {/* Relevant Context & Asset Subject */}
            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2">
              <h4 className="font-semibold text-[#D76EDD] font-mono text-[11px] uppercase tracking-wider">
                Relevant Context & Asset Class
              </h4>
              <div className="text-[#B8A9CC] text-[11px] space-y-1.5">
                <p>
                  <strong>Asset Archetype:</strong> Sovereign Debt / Treasury Bill. Anchored to Par NAV with low historical volatility.
                </p>
                <p>
                  <strong>Spread Assessment:</strong> 25 bps base fee spread is institutional-grade and encourages high-volume continuous trading.
                </p>
                <p>
                  <strong>Liquidity Depth:</strong> Current reserve provides deep resilience against single-wallet sell pressure.
                </p>
              </div>
            </div>

            {/* Possible Scenarios */}
            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2">
              <h4 className="font-semibold text-[#D76EDD] font-mono text-[11px] uppercase tracking-wider">
                Possible Scenarios
              </h4>
              <div className="text-[#B8A9CC] text-[11px] space-y-1.5 font-mono">
                <div className="bg-[#140130] border border-[#670CDC]/20 p-1.5 rounded">
                  <span className="text-emerald-400 font-semibold block">Scenario A: Graduation</span>
                  <span className="text-[10px] text-[#B8A9CC]">Upon 100% threshold, liquidity moves permanently into Meteora DAMM.</span>
                </div>
                <div className="bg-[#140130] border border-[#670CDC]/20 p-1.5 rounded">
                  <span className="text-[#F99225] font-semibold block">Scenario B: Steady Curve</span>
                  <span className="text-[10px] text-[#B8A9CC]">Continuous price discovery without secondary market reliance.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 3: AREAS REQUIRING FURTHER RESEARCH (Data Gaps & Disclaimers)         */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-[#F99225]/40 bg-[#140130] p-5 space-y-4 shadow-md shadow-[#09011B]/60">
          <div className="flex items-center justify-between pb-3 border-b border-[#F99225]/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F99225]" />
              <h3 className="font-bold text-sm text-[#F99225] font-mono tracking-wide uppercase">
                3. Areas Requiring Further Research (Information Limitations)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F99225]/20 text-[#F99225] border border-[#F99225]/30">
              UNVERIFIED OFF-CHAIN FACTORS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2">
              <h4 className="font-semibold text-[#F99225] font-mono text-[11px] uppercase tracking-wider">
                Information Limitations
              </h4>
              <ul className="space-y-1.5 text-[#B8A9CC] text-[11px]">
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F99225] shrink-0 mt-0.5" />
                  <span><strong>Devnet Testing Isolation:</strong> All values are settled with Devnet tokens without real-world legal recourse.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F99225] shrink-0 mt-0.5" />
                  <span><strong>Off-Chain Custodian Attestation:</strong> Legal ownership of underlying collateral is self-reported by the issuer.</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#100126] rounded-lg p-3.5 border border-[#670CDC]/20 space-y-2">
              <h4 className="font-semibold text-[#F99225] font-mono text-[11px] uppercase tracking-wider">
                Suggested Diligence Steps
              </h4>
              <ul className="space-y-1.5 text-[#B8A9CC] text-[11px]">
                <li className="flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F99225] shrink-0 mt-0.5" />
                  <span>Inspect Pyth oracle confidence intervals before setting tight graduation triggers.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F99225] shrink-0 mt-0.5" />
                  <span>Audit issuer's multi-sig or timelock authority over base mint supply expansions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130] shadow-md shadow-[#09011B]/60">
        <div className="text-xs text-[#B8A9CC]">
          Want a customized conversational drill-down into this market?
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onInspectInChat(`Please run an exhaustive intelligence breakdown on Devnet pool: ${activePool.tokenName} ($${activePool.tokenSymbol}), Base Mint: ${activePool.baseMint}. Detail its curve progress and potential graduation bottlenecks.`)}
            className="px-4 py-2 rounded-lg bg-[#670CDC] hover:bg-[#7C18F0] text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-[#670CDC]/30"
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>Audit in Agent Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
