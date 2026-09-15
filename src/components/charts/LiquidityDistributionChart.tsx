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
    <div className="rounded-xl border border-zinc-800/90 bg-[#0c1018] p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div>
          <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-200">
            Vault Liquidity & Curve Reserves
          </h4>
          <p className="text-[11px] text-zinc-400">
            Real-time on-chain split between active curve inventory and migration pool
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
          SPL Vault
        </span>
      </div>

      {/* Progress Bar towards DEX Migration */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-400 font-medium">DAMM v2 Graduation Progress</span>
          <span className="font-mono-nums font-bold text-amber-400">
            {formatPercent(quoteProgress)} ({quoteReserve.toFixed(2)} / {quoteTarget.toFixed(2)} {quoteSymbol})
          </span>
        </div>

        {/* Dual Stacked Progress Line */}
        <div className="w-full h-3 rounded-md bg-[#090d14] border border-zinc-800 overflow-hidden flex p-0.5">
          <div
            className={`h-full rounded-sm transition-all duration-500 ${
              isMigrated ? 'bg-sky-500' : 'bg-gradient-to-r from-amber-600 to-amber-400'
            }`}
            style={{ width: `${Math.max(2, quoteProgress)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
          <span>Genesis: 0 {quoteSymbol}</span>
          <span>{remainingQuote > 0 ? `${remainingQuote.toFixed(2)} ${quoteSymbol} to DAMM Graduation` : 'Graduated'}</span>
          <span>Threshold: {quoteTarget.toFixed(0)} {quoteSymbol}</span>
        </div>
      </div>

      {/* Reserves breakdown cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div className="bg-[#090d14] p-3 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-400 uppercase block font-medium">Base Token Reserve</span>
          <div className="font-mono-nums font-bold text-sm text-zinc-100 mt-1 truncate">
            {baseReserve.toLocaleString()} {baseSymbol}
          </div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">DBC Vault Authority</span>
        </div>

        <div className="bg-[#090d14] p-3 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-400 uppercase block font-medium">Quote Reserve</span>
          <div className="font-mono-nums font-bold text-sm text-amber-400 mt-1 truncate">
            {quoteReserve.toFixed(3)} {quoteSymbol}
          </div>
          <span className="text-[10px] text-zinc-400 block mt-0.5">Accumulated SOL</span>
        </div>

        <div className="bg-[#090d14] p-3 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-400 uppercase block font-medium">Migration Destination</span>
          <div className="font-mono-nums font-bold text-sm text-sky-300 mt-1 truncate">
            Meteora DAMM v2
          </div>
          <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">Dynamic Fee LP</span>
        </div>
      </div>
    </div>
  );
};
