import React from 'react';
import { formatCurrency, formatPercent } from '../../utils/format';

interface LiquidityDistributionProps {
  baseReserve: number;
  baseSymbol: string;
  quoteReserve: number;
  quoteSymbol: string;
  targetQuoteThreshold: number;
  isMigrated?: boolean;
}

export const LiquidityDistributionChart: React.FC<LiquidityDistributionProps> = ({
  baseReserve,
  baseSymbol,
  quoteReserve,
  quoteSymbol,
  targetQuoteThreshold,
  isMigrated = false,
}) => {
  const quoteTarget = Math.max(targetQuoteThreshold, 1);
  const quoteProgress = Math.min(100, (quoteReserve / quoteTarget) * 100);
  const remainingQuote = Math.max(0, quoteTarget - quoteReserve);

  return (
    <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-3">
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider text-[#F7F3FF]">
            Vault Liquidity & Curve Reserves
          </h4>
          <p className="text-[11px] text-[#B8A9CC]">
            Real-time on-chain split between active curve inventory and migration pool
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#100126] text-[#D76EDD] border border-[#670CDC]/30">
          SPL Vault
        </span>
      </div>

      {/* Progress Bar towards DEX Migration */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[#B8A9CC] font-medium">DAMM v2 Graduation Progress</span>
          <span className="font-mono-nums font-bold text-[#F99225]">
            {formatPercent(quoteProgress)} ({quoteReserve.toFixed(2)} / {quoteTarget.toFixed(2)} {quoteSymbol})
          </span>
        </div>

        {/* Dual Stacked Progress Line */}
        <div className="w-full h-3 rounded-md bg-[#0E0124] border border-[#670CDC]/25 overflow-hidden flex p-0.5">
          <div
            className={`h-full rounded-xs transition-all duration-500 ${
              isMigrated
                ? 'bg-gradient-to-r from-[#670CDC] to-[#D76EDD]'
                : 'bg-gradient-to-r from-[#670CDC] via-[#D76EDD] to-[#F99225]'
            }`}
            style={{ width: `${Math.max(2, quoteProgress)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-[#7E6D96] font-mono">
          <span>Genesis: 0 {quoteSymbol}</span>
          <span>{remainingQuote > 0 ? `${remainingQuote.toFixed(2)} ${quoteSymbol} to DAMM Graduation` : 'Graduated'}</span>
          <span>Threshold: {quoteTarget.toFixed(0)} {quoteSymbol}</span>
        </div>
      </div>

      {/* Reserves breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-[#100126] p-3 rounded-xl border border-[#670CDC]/20">
          <span className="text-[10px] text-[#B8A9CC] uppercase block font-medium">Base Token Reserve</span>
          <div className="font-mono-nums font-bold text-sm text-[#F7F3FF] mt-1 truncate">
            {baseReserve.toLocaleString()} {baseSymbol}
          </div>
          <span className="text-[10px] text-[#7E6D96] block mt-0.5">DBC Vault Authority</span>
        </div>

        <div className="bg-[#100126] p-3 rounded-xl border border-[#670CDC]/20">
          <span className="text-[10px] text-[#B8A9CC] uppercase block font-medium">Quote Reserve</span>
          <div className="font-mono-nums font-bold text-sm text-[#F99225] mt-1 truncate">
            {quoteReserve.toFixed(3)} {quoteSymbol}
          </div>
          <span className="text-[10px] text-[#7E6D96] block mt-0.5">Accumulated SOL</span>
        </div>

        <div className="bg-[#100126] p-3 rounded-xl border border-[#670CDC]/20">
          <span className="text-[10px] text-[#B8A9CC] uppercase block font-medium">Migration Destination</span>
          <div className="font-mono-nums font-bold text-sm text-violet-300 mt-1 truncate">
            Meteora DAMM v2
          </div>
          <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">Dynamic Fee LP</span>
        </div>
      </div>
    </div>
  );
};
