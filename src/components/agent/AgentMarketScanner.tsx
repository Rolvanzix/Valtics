import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  TrendingUp,
  Layers,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  MessageSquareCode,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { useValticsAgent } from '../../context/AgentContext';
import { AddressBadge } from '../common/AddressBadge';
import { getExplorerUrl } from '../../config/constants';
import { AgentScanResult } from '../../types/agent';

interface AgentMarketScannerProps {
  onInspectInChat: (poolQuery: string) => void;
  onNavigateToMarket?: (poolAddress: string) => void;
}

export const AgentMarketScanner: React.FC<AgentMarketScannerProps> = ({
  onInspectInChat,
  onNavigateToMarket,
}) => {
  const { marketSummary, summaryLoading, refreshMarketScan } = useValticsAgent();
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACCUMULATING' | 'NEAR_GRADUATION' | 'GRADUATED'>('ALL');

  const markets = marketSummary?.markets || [];

  const filteredMarkets = markets.filter((m) => {
    const matchesQuery =
      m.tokenName.toLowerCase().includes(filterText.toLowerCase()) ||
      m.tokenSymbol.toLowerCase().includes(filterText.toLowerCase()) ||
      m.baseMint.toLowerCase().includes(filterText.toLowerCase()) ||
      m.poolAddress.toLowerCase().includes(filterText.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.graduationStatus === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-zinc-800 bg-[#090d14]/80 p-4 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Devnet Markets Scanned
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              {marketSummary?.totalMarkets ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">registered</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">Active Meteora DBC contracts</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#090d14]/80 p-4 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Avg Bonding Progress
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {marketSummary?.avgCurveProgress ?? 0}%
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">completion</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">Across active reserve curves</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#090d14]/80 p-4 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Near Graduation
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {marketSummary?.nearGraduationCount ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">≥75% threshold</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">Ready for Meteora DAMM migration</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#090d14]/80 p-4 space-y-1">
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
            Devnet Cluster Status
          </span>
          <div className="flex items-center gap-2 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold font-mono text-zinc-200">OPTIMAL</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-sans">Continuous DBC price discovery</p>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#090d14] p-3 rounded-xl border border-zinc-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by token, symbol, or mint address..."
            className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-zinc-600 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Status Tabs */}
          {(['ALL', 'ACCUMULATING', 'NEAR_GRADUATION', 'GRADUATED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {status === 'ALL'
                ? 'All Pools'
                : status === 'ACCUMULATING'
                ? 'Accumulating'
                : status === 'NEAR_GRADUATION'
                ? 'Near Graduation'
                : 'Graduated'}
            </button>
          ))}

          <button
            type="button"
            onClick={refreshMarketScan}
            disabled={summaryLoading}
            title="Refresh Devnet scan"
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Markets List / Grid */}
      {filteredMarkets.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#090d14]/60 p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-300">No Devnet Pools Found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {filterText
              ? 'No pools match your search query. Try clearing the filter.'
              : 'There are currently no registered pools for this filter. Create a market to scan on-chain liquidity.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMarkets.map((market) => (
            <MarketScanCard
              key={market.poolAddress}
              market={market}
              onInspectInChat={onInspectInChat}
              onNavigateToMarket={onNavigateToMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MarketScanCard: React.FC<{
  market: AgentScanResult;
  onInspectInChat: (query: string) => void;
  onNavigateToMarket?: (address: string) => void;
}> = ({ market, onInspectInChat, onNavigateToMarket }) => {
  const getBadgeColor = (score: AgentScanResult['healthScore']) => {
    switch (score) {
      case 'OPTIMAL':
        return 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300';
      case 'MODERATE':
        return 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300';
      case 'CAUTION':
        return 'bg-amber-950/70 border-amber-500/40 text-amber-300';
      case 'EARLY':
      default:
        return 'bg-zinc-900 border-zinc-700 text-zinc-400';
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#090d14]/90 p-4 sm:p-5 hover:border-zinc-700 transition-all space-y-3">
      {/* Row Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-200">
            {market.tokenSymbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-zinc-100">{market.tokenName}</h4>
              <span className="text-xs font-mono text-zinc-400">${market.tokenSymbol}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getBadgeColor(
                  market.healthScore
                )}`}
              >
                {market.healthScore}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-0.5">
              <span>Base Mint:</span>
              <AddressBadge address={market.baseMint} showCopy={true} />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={() => onInspectInChat(`Please analyze Devnet market ${market.tokenSymbol} (Base Mint: ${market.baseMint}, Pool: ${market.poolAddress}). What is its health rating and curve trajectory?`)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit with Agent</span>
          </button>

          {onNavigateToMarket && (
            <button
              type="button"
              onClick={() => onNavigateToMarket(market.poolAddress)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
              title="Open Market View"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bonding Curve Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Bonding Curve Graduation Progress</span>
          <span className="text-emerald-400 font-semibold">{market.quoteCurveProgressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-500 to-cyan-400 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(2, market.quoteCurveProgressPct))}%` }}
          />
        </div>
      </div>

      {/* Metric Breakdown & AI Assessment */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60 text-xs font-mono">
        <div>
          <span className="text-zinc-500 text-[10px] block uppercase">Spot Price</span>
          <span className="text-zinc-200 font-semibold">${market.currentPrice.toFixed(4)} {market.quoteSymbol}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[10px] block uppercase">Quote Reserves</span>
          <span className="text-zinc-200 font-semibold">{market.quoteReserve} {market.quoteSymbol}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[10px] block uppercase">Status</span>
          <span className="text-zinc-200 font-semibold">{market.graduationStatus}</span>
        </div>
        <div>
          <span className="text-zinc-500 text-[10px] block uppercase">Cluster</span>
          <span className="text-amber-400 font-semibold">Solana Devnet</span>
        </div>
      </div>

      <div className="bg-zinc-950/40 rounded-lg p-2.5 border border-zinc-800/50 text-[11px] text-zinc-400 flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
        <span>{market.healthAssessment}</span>
      </div>
    </div>
  );
};
