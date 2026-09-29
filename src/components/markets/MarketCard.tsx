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
      className={`rounded-xl border border-[#670CDC]/25 bg-[#1C0142]/85 hover:bg-[#26035A] hover:border-[#670CDC]/60 p-5 flex flex-col justify-between transition-colors cursor-pointer group shadow-md shadow-[#09011B]/40 ${className}`}
    >
      <div>
        {/* Top: Name, Symbol, Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-[#F7F3FF] text-base group-hover:text-white transition-colors truncate font-sans">
              {pool.tokenName || 'Unnamed Pool'}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-[#D76EDD] font-medium">
                {pool.tokenSymbol || 'TKN'}
              </span>
              <span className="text-[#670CDC]/40 text-xs">·</span>
              <span className="text-xs text-[#B8A9CC] font-sans">
                {pool.rwaCategory || 'Tokenized Asset'}
              </span>
            </div>
          </div>

          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              pool.isMigrated
                ? 'bg-[#670CDC]/25 text-[#E6DCFA] border border-[#670CDC]/40'
                : 'bg-[#140130] text-[#B8A9CC] border border-[#670CDC]/25'
            }`}
          >
            {pool.isMigrated ? 'Graduated' : 'Active'}
          </span>
        </div>

        {/* Spot Price & Reference */}
        <div className="mt-4 pt-4 border-t border-[#670CDC]/20">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#B8A9CC] font-sans">Spot Price</span>
            <span className="font-mono font-bold text-[#F7F3FF] text-lg">
              {formatCurrency(pool.currentPrice, quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
            </span>
          </div>

          {pool.referencePrice && (
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-[#7E6D96] font-sans">Reference NAV</span>
              <span className="font-mono text-[#B8A9CC]">
                {formatCurrency(pool.referencePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-[#B8A9CC] font-sans">
            <span>Liquidity progress</span>
            <span className="font-mono text-[#F7F3FF] font-medium">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#140130] rounded-full overflow-hidden border border-[#670CDC]/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#670CDC] via-[#D76EDD] to-[#F99225] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3.5 border-t border-[#670CDC]/20 flex items-center justify-between text-xs">
        <span className="text-[#7E6D96] font-mono text-[11px]">
          TVL: {formatCurrency(pool.tvlUsd || 0)}
        </span>
        <span className="text-[#B8A9CC] group-hover:text-[#F99225] font-medium flex items-center gap-1 transition-colors">
          <span>View market</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#B8A9CC] group-hover:text-[#F99225] transition-colors" />
        </span>
      </div>
    </div>
  );
};
