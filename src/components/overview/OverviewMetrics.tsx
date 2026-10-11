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
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 shadow-lg shadow-[#09011B]/40">
        <span className="text-xs font-semibold text-[#B8A9CC]">Total Value Locked</span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#F7F3FF] tracking-tight">
          {formatCurrency(tvlUsd)}
        </div>
        <span className="mt-1.5 text-xs text-[#7E6D96] block">On-chain reserves & liquidity</span>
      </div>

      {/* 2. Active Markets */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 shadow-lg shadow-[#09011B]/40">
        <span className="text-xs font-semibold text-[#B8A9CC]">Active Markets</span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#F7F3FF] tracking-tight">
          {activeMarkets}
        </div>
        <span className="mt-1.5 text-xs text-[#7E6D96] block">Live bonding curve pools</span>
      </div>

      {/* 3. Assets Launched */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 shadow-lg shadow-[#09011B]/40">
        <span className="text-xs font-semibold text-[#B8A9CC]">Assets Launched</span>
        <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-[#F7F3FF] tracking-tight">
          {assetsLaunched}
        </div>
        <span className="mt-1.5 text-xs text-[#7E6D96] block">Verified tokenized assets</span>
      </div>
    </div>
  );
};
