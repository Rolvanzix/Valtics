import React from 'react';
import { formatCurrency } from '../../utils/format';

interface OverviewMetricsProps {
  tvlUsd: number;
  activeMarkets: number;
  assetsLaunched: number;
  tps?: number | null;
  slotHeight?: number | null;
  latencyMs?: number | null;
  networkName?: string;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  tvlUsd,
  activeMarkets,
  assetsLaunched,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Total Value Locked */}
      <div className="rounded-xl border border-zinc-800 bg-[#0b0f17] p-5">
        <span className="text-xs font-medium text-zinc-400">Total Value Locked</span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-zinc-100 tracking-tight">
          {formatCurrency(tvlUsd)}
        </div>
        <span className="mt-1.5 text-xs text-zinc-500 block">On-chain reserves & liquidity</span>
      </div>

      {/* 2. Active Markets */}
      <div className="rounded-xl border border-zinc-800 bg-[#0b0f17] p-5">
        <span className="text-xs font-medium text-zinc-400">Active Markets</span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-zinc-100 tracking-tight">
          {activeMarkets}
        </div>
        <span className="mt-1.5 text-xs text-zinc-500 block">Live bonding curve pools</span>
      </div>

      {/* 3. Assets Launched */}
      <div className="rounded-xl border border-zinc-800 bg-[#0b0f17] p-5">
        <span className="text-xs font-medium text-zinc-400">Assets Launched</span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-zinc-100 tracking-tight">
          {assetsLaunched}
        </div>
        <span className="mt-1.5 text-xs text-zinc-500 block">Verified tokenized assets</span>
      </div>
    </div>
  );
};
