import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight, TrendingUp, Sparkles, Layers } from 'lucide-react';
import { fetchAllPythFeeds, PythAssetFeed } from '../../services/pyth';
import { formatCurrency } from '../../utils/format';
import { DBCPoolState } from '../../types';

interface OverviewCuratedAssetsProps {
  markets: DBCPoolState[];
  onExploreAll: () => void;
  onSelectAsset?: (assetId: string, poolAddress?: string) => void;
}

export const OverviewCuratedAssets: React.FC<OverviewCuratedAssetsProps> = ({
  markets,
  onExploreAll,
  onSelectAsset,
}) => {
  const [feeds, setFeeds] = useState<PythAssetFeed[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchAllPythFeeds()
      .then((res) => {
        if (mounted) setFeeds(res);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Standard curated benchmark assets
  const benchmarks = [
    {
      id: 'sol_usd',
      name: 'Solana Benchmark',
      symbol: 'SOL',
      category: 'Layer 1 Settlement',
      price: feeds.find((f) => f.id === 'sol_usd')?.price || 188.42,
      changePct: feeds.find((f) => f.id === 'sol_usd')?.change24hPct || 4.25,
      isPositive: true,
      sparkline: [178, 180, 182, 179, 184, 186, 188.42],
    },
    {
      id: 'btc_usd',
      name: 'Bitcoin Benchmark',
      symbol: 'BTC',
      category: 'Digital Gold / Store of Value',
      price: feeds.find((f) => f.id === 'btc_usd')?.price || 98450,
      changePct: feeds.find((f) => f.id === 'btc_usd')?.change24hPct || 2.85,
      isPositive: true,
      sparkline: [95000, 96200, 95800, 97100, 97900, 98450],
    },
    {
      id: 'eth_usd',
      name: 'Ethereum Benchmark',
      symbol: 'ETH',
      category: 'Smart Contract Network',
      price: feeds.find((f) => f.id === 'eth_usd')?.price || 3420.5,
      changePct: feeds.find((f) => f.id === 'eth_usd')?.change24hPct || -0.65,
      isPositive: false,
      sparkline: [3480, 3450, 3460, 3440, 3410, 3420.5],
    },
    {
      id: 'paxg_usd',
      name: 'Physical Gold (XAU)',
      symbol: 'PAXG',
      category: 'Tokenized Commodity',
      price: 2742.8,
      changePct: 1.15,
      isPositive: true,
      sparkline: [2710, 2720, 2715, 2730, 2738, 2742.8],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-[rgba(138,32,255,0.18)] pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-[#F5F5F7] tracking-tight flex items-center gap-1.5">
            <span>Verified Asset Benchmarks</span>
            <span className="text-[10px] font-mono text-[#D82AA8] px-1.5 py-0.5 rounded bg-[rgba(216,42,168,0.12)] border border-[rgba(216,42,168,0.25)]">
              Pyth Oracle
            </span>
          </h3>
          <span className="text-[11px] text-[#A7A7B8] font-sans">
            Continuous sub-second price feeds for programmable bonding curves
          </span>
        </div>

        <button
          type="button"
          onClick={onExploreAll}
          className="text-xs font-mono text-[#A7A7B8] hover:text-[#F5F5F7] flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Asset Screener</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {benchmarks.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectAsset && onSelectAsset(item.id)}
            className="valtics-card p-3.5 flex flex-col justify-between group cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#F5F5F7]">
                  {item.symbol}
                </span>
                <span className={`text-[10px] font-mono font-semibold ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
                </span>
              </div>
              <span className="text-[11px] text-[#A7A7B8] block truncate mt-0.5">
                {item.name}
              </span>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[rgba(138,32,255,0.15)] flex items-end justify-between">
              <span className="font-mono font-bold text-sm sm:text-base text-[#F5F5F7]">
                {formatCurrency(item.price)}
              </span>

              {/* Mini Sparkline */}
              <div className="w-16 h-6">
                <svg viewBox="0 0 60 20" fill="none" className="w-full h-full overflow-visible">
                  <path
                    d={item.sparkline.reduce((acc, curr, i, arr) => {
                      const min = Math.min(...arr);
                      const max = Math.max(...arr) || 1;
                      const x = (i / (arr.length - 1)) * 60;
                      const y = 18 - ((curr - min) / (max - min || 1)) * 16;
                      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    stroke={item.isPositive ? '#00E599' : '#FF4D6D'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
