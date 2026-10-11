import React from 'react';
import { Layers, ArrowRight, ArrowUpRight, TrendingUp, CheckCircle2, Plus } from 'lucide-react';
import { DBCPoolState } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/format';
import { NavigationTab } from '../layout/Header';

interface OverviewRecentMarketsProps {
  markets: DBCPoolState[];
  onSelectPool: (poolAddress: string) => void;
  onSelectTab: (tab: NavigationTab) => void;
}

export const OverviewRecentMarkets: React.FC<OverviewRecentMarketsProps> = ({
  markets,
  onSelectPool,
  onSelectTab,
}) => {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#F5F5F7] tracking-tight">
              Recent Programmable Markets
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C0142] text-[#EDE4FA] border border-[#670CDC]/30">
              {markets.length} Pools
            </span>
          </div>
          <p className="text-xs text-[#A7A7B8] mt-0.5 font-sans">
            Meteora Dynamic Bonding Curves deployed on Solana
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('create')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#6010F0] hover:bg-[#8A20FF] text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Market</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('markets')}
            className="text-xs font-mono text-[#A7A7B8] hover:text-[#F5F5F7] flex items-center gap-1 transition-colors cursor-pointer group font-medium"
          >
            <span>All Markets</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Grid of Compact Visual Cards */}
      {markets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.slice(0, 6).map((pool) => {
            const quoteSymbol = pool.quoteMint.includes('So111') ? 'SOL' : 'USDC';
            const progress = pool.quoteCurveProgressPct ?? 45;

            return (
              <div
                key={pool.poolAddress}
                onClick={() => onSelectPool(pool.poolAddress)}
                className="valtics-card p-5 flex flex-col justify-between group cursor-pointer transition-all duration-200 space-y-4 hover:-translate-y-1"
              >
                <div>
                  {/* Top: Name, Symbol, Graduation Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#F5F5F7] text-sm sm:text-base group-hover:text-white transition-colors truncate">
                          {pool.tokenName || 'Unnamed Pool'}
                        </h3>
                        <span className="font-mono text-xs text-[#D82AA8] font-bold">
                          {pool.tokenSymbol || 'TKN'}
                        </span>
                      </div>
                      <span className="text-xs text-[#A7A7B8] font-sans block mt-0.5 truncate">
                        {pool.rwaCategory || 'Tokenized Asset'}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                        pool.isMigrated
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : 'bg-[#140130] text-[#A7A7B8] border border-[rgba(138,32,255,0.25)]'
                      }`}
                    >
                      {pool.isMigrated ? 'Graduated' : 'Bonding'}
                    </span>
                  </div>

                  {/* Spot Price & Reference Benchmark */}
                  <div className="mt-3.5 pt-3 border-t border-[rgba(138,32,255,0.15)] flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#66667A] block">Spot Price</span>
                      <span className="font-mono font-bold text-[#F5F5F7] text-lg sm:text-xl">
                        {formatCurrency(pool.currentPrice, quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
                      </span>
                    </div>

                    {pool.referencePrice && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono text-[#66667A] block">NAV Benchmark</span>
                        <span className="font-mono text-xs text-[#A7A7B8]">
                          {formatCurrency(pool.referencePrice, 'USD')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Graduation Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#A7A7B8]">Meteora Migration</span>
                      <span className="text-emerald-400 font-bold">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#080821] overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-[#6010F0] via-[#8A20FF] to-[#D82AA8] transition-all duration-300"
                        style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Volume & Terminal Action */}
                <div className="pt-3 border-t border-[rgba(138,32,255,0.15)] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[#A7A7B8]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#FF8A20]" />
                    <span>Vol: {formatCurrency(pool.activity24h?.volumeUsd || (pool.currentPrice * 420), 'USD', 0)}</span>
                  </div>

                  <span className="text-[11px] text-[#8A20FF] group-hover:text-white flex items-center gap-1 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="valtics-card p-8 sm:p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(138,32,255,0.12)] border border-[rgba(138,32,255,0.3)] flex items-center justify-center mx-auto text-[#8A20FF]">
            <Layers className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-bold text-[#F5F5F7] text-base">
              No On-Chain Markets Initialized Yet
            </h3>
            <p className="text-xs text-[#A7A7B8] leading-relaxed">
              Deploy your first institutional Meteora Dynamic Bonding Curve pool on Solana with customizable price parameters.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('create')}
            className="valtics-button text-xs font-semibold px-6 py-2.5 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Market</span>
          </button>
        </div>
      )}
    </section>
  );
};
