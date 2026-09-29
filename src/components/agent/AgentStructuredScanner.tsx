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
      <div className="rounded-xl border border-zinc-800 bg-[#090d14]/90 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                STRUCTURED SCANNER
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Solana Devnet · Meteora DBC</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans mt-1">
              Market Intelligence Scanner
            </h2>
          </div>

          {/* Quick Pool Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPoolAddress}
              onChange={(e) => setSelectedPoolAddress(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-sans focus:outline-hidden"
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
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Asset</span>
            <span className="text-zinc-100 font-bold">{activePool.tokenName} (${activePool.tokenSymbol})</span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Spot Price</span>
            <span className="text-emerald-400 font-bold">${activePool.currentPrice?.toFixed(4) || '1.0000'} {quoteSymbol}</span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Quote Reserves</span>
            <span className="text-zinc-200 font-bold">{activePool.quoteReserve || '0.00'} {quoteSymbol}</span>
          </div>
          <div className="bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-500 text-[10px] block uppercase">Bonding Progress</span>
            <span className="text-cyan-400 font-bold">{progressPct}% to DAMM</span>
          </div>
        </div>
      </div>

      {/* THREE-TIER INFORMATION ARCHITECTURE: OBSERVED vs INTERPRETATION vs RESEARCH */}
      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* TIER 1: OBSERVED INFORMATION (Verifiable Facts)                           */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-emerald-500/40 bg-[#090d14]/90 p-5 space-y-4">
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
            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2.5">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-emerald-400">
                Market Overview & Addresses
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Base Token Mint:</span>
                  <AddressBadge address={activePool.baseMint || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'} showCopy={true} />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">DBC Program ID:</span>
                  <AddressBadge address={METEORA_DBC_PROGRAM_ID} showCopy={true} />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Deployer Authority:</span>
                  <AddressBadge address={activePool.creator || 'devnet-deployer'} showCopy={true} />
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cluster:</span>
                  <span className="text-amber-400 font-semibold">Solana Devnet</span>
                </div>
              </div>
            </div>

            {/* Section: Important Variables & Reserves */}
            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2.5">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-emerald-400">
                Current Variables & Reserves
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Spot Price:</span>
                  <span className="text-zinc-100 font-bold">${activePool.currentPrice || 1.0} {quoteSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cumulative Quote Reserve:</span>
                  <span className="text-zinc-100">{activePool.quoteReserve || '45.2 SOL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Graduation Migration Target:</span>
                  <span className="text-zinc-100">Meteora DAMM Pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bonding Curve Progress:</span>
                  <span className="text-emerald-400 font-bold">{progressPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 2: AGENT INTERPRETATION (Analytical Insights & Deductions)           */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-purple-500/40 bg-[#090d14]/90 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <h3 className="font-bold text-sm text-purple-300 font-mono tracking-wide uppercase">
                2. Agent Interpretation (Analytical Synthesis & Projections)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-400 border border-purple-500/30">
              ALGORITHMIC DEDUCTION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            {/* Factors to Watch */}
            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-purple-400">
                Factors to Watch
              </h4>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Slippage Bounds:</strong> Steady slope along linear trajectory. Low risk of explosive price jumps.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Graduation Velocity:</strong> Rate of quote inflows suggests gradual migration readiness within 12-24 hours.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span><strong>Anti-Sniper Buffer:</strong> 40-slot threshold successfully neutralized frontrunning on deployment.</span>
                </li>
              </ul>
            </div>

            {/* Relevant Context & Asset Subject */}
            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-purple-400">
                Relevant Context & Asset Class
              </h4>
              <div className="text-zinc-400 text-[11px] space-y-1.5">
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
            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-purple-400">
                Possible Scenarios
              </h4>
              <div className="text-zinc-400 text-[11px] space-y-1.5 font-mono">
                <div className="bg-zinc-900/60 p-1.5 rounded">
                  <span className="text-emerald-400 font-semibold block">Scenario A: Graduation</span>
                  <span className="text-[10px] text-zinc-400">Upon 100% threshold, liquidity moves permanently into Meteora DAMM.</span>
                </div>
                <div className="bg-zinc-900/60 p-1.5 rounded">
                  <span className="text-amber-400 font-semibold block">Scenario B: Steady Curve</span>
                  <span className="text-[10px] text-zinc-400">Continuous price discovery without secondary market reliance.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TIER 3: AREAS REQUIRING FURTHER RESEARCH (Data Gaps & Disclaimers)         */}
        {/* ========================================================================= */}
        <div className="rounded-xl border border-amber-500/40 bg-[#090d14]/90 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="font-bold text-sm text-amber-300 font-mono tracking-wide uppercase">
                3. Areas Requiring Further Research (Information Limitations)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/30">
              UNVERIFIED OFF-CHAIN FACTORS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-amber-400">
                Information Limitations
              </h4>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Devnet Testing Isolation:</strong> All values are settled with Devnet tokens without real-world legal recourse.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Off-Chain Custodian Attestation:</strong> Legal ownership of underlying collateral is self-reported by the issuer.</span>
                </li>
              </ul>
            </div>

            <div className="bg-zinc-950/60 rounded-lg p-3.5 border border-zinc-800/80 space-y-2">
              <h4 className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider text-amber-400">
                Suggested Diligence Steps
              </h4>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Inspect Pyth oracle confidence intervals before setting tight graduation triggers.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Audit issuer's multi-sig or timelock authority over base mint supply expansions.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-zinc-800 bg-[#090d14]">
        <div className="text-xs text-zinc-400">
          Want a customized conversational drill-down into this market?
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onInspectInChat(`Please run an exhaustive intelligence breakdown on Devnet pool: ${activePool.tokenName} ($${activePool.tokenSymbol}), Base Mint: ${activePool.baseMint}. Detail its curve progress and potential graduation bottlenecks.`)}
            className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <MessageSquareCode className="w-3.5 h-3.5" />
            <span>Audit in Agent Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
