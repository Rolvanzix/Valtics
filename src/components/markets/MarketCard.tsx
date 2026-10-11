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

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {pool.deploymentStatus === 'verified' ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                VERIFIED
              </span>
            ) : pool.deploymentStatus === 'submitted' ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                SUBMITTED
              </span>
            ) : pool.deploymentStatus === 'verification_required' || pool.deploymentStatus === 'verification_failed' ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                UNVERIFIED
              </span>
            ) : pool.isLocalRecord || pool.deploymentStatus === 'draft' ? (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                LOCAL DRAFT
              </span>
            ) : (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#140130] text-[#B8A9CC] border border-[#670CDC]/25">
                REFERENCE
              </span>
            )}

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                pool.isMigrated
                  ? 'bg-[#670CDC]/25 text-[#E6DCFA] border border-[#670CDC]/40 font-semibold'
                  : 'bg-[#140130] text-[#7E6D96] border border-[#670CDC]/20'
              }`}
            >
              {pool.isMigrated ? 'Graduated' : 'Active Curve'}
            </span>
          </div>
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
          {pool.onChainVerified && typeof pool.tvlUsd === 'number'
            ? `TVL: ${formatCurrency(pool.tvlUsd)}`
            : pool.isLocalRecord
            ? 'TVL: — (Draft)'
            : 'TVL: — (Reference)'}
        </span>
        <span className="text-[#B8A9CC] group-hover:text-[#F99225] font-medium flex items-center gap-1 transition-colors">
          <span>View market</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#B8A9CC] group-hover:text-[#F99225] transition-colors" />
        </span>
      </div>
    </div>
  );
};
