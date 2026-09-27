import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { DBCPoolState } from '../../types';
import { formatCurrency } from '../../utils/format';

interface MarketCardProps {
  pool: DBCPoolState;
  onSelect: (poolAddress: string) => void;
  className?: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  pool,
  onSelect,
  className = '',
}) => {
  const quoteSymbol = pool.quoteMint.includes('So111') ? 'SOL' : 'USDC';
  const progress = pool.quoteCurveProgressPct ?? 0;

  return (
    <div
      onClick={() => onSelect(pool.poolAddress)}
      className={`rounded-xl border border-zinc-800 bg-[#0b0f17] hover:bg-[#0e141f] hover:border-zinc-700 p-5 flex flex-col justify-between transition-colors cursor-pointer group ${className}`}
    >
      <div>
        {/* Top: Name, Symbol, Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 text-base group-hover:text-white transition-colors truncate font-sans">
              {pool.tokenName || 'Unnamed Pool'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-zinc-400 font-medium">
                {pool.tokenSymbol || 'TKN'}
              </span>
              <span className="text-zinc-600 text-xs">·</span>
              <span className="text-xs text-zinc-500 font-sans">
                {pool.rwaCategory || 'Tokenized Asset'}
              </span>
            </div>
          </div>

          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              pool.isMigrated
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                : 'bg-zinc-800/80 text-zinc-300'
            }`}
          >
            {pool.isMigrated ? 'Graduated' : 'Active'}
          </span>
        </div>

        {/* Spot Price & Reference */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-zinc-500 font-sans">Spot Price</span>
            <span className="font-mono font-bold text-zinc-100 text-lg">
              {formatCurrency(pool.currentPrice, quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
            </span>
          </div>

          {pool.referencePrice && (
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-zinc-500 font-sans">Reference NAV</span>
              <span className="font-mono text-zinc-400">
                {formatCurrency(pool.referencePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-400 font-sans">
            <span>Liquidity progress</span>
            <span className="font-mono text-zinc-300">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-500 font-mono text-[11px]">
          TVL: {formatCurrency(pool.tvlUsd || 0)}
        </span>
        <span className="text-zinc-300 group-hover:text-white font-medium flex items-center gap-1 transition-colors">
          <span>View market</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
        </span>
      </div>
    </div>
  );
};
