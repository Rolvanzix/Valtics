import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { fetchAllPythFeeds, PythAssetFeed } from '../../services/pyth';
import { getRealPythMarketPrice } from '../../services/pythMarketData';
import { DBCPoolState } from '../../types';
import { formatCurrency } from '../../utils/format';

interface CuratedAssetDiscoveryProps {
  markets: DBCPoolState[];
  onExploreAll: () => void;
  onSelectAsset?: (assetId: string, poolAddress?: string) => void;
}

interface FeaturedAsset {
  id: string;
  name: string;
  symbol: string;
  category: string;
  price: number | null;
  changePct: number | null;
  poolAddress?: string;
}

export const CuratedAssetDiscovery: React.FC<CuratedAssetDiscoveryProps> = ({
  markets,
  onExploreAll,
  onSelectAsset,
}) => {
  const [pythFeeds, setPythFeeds] = useState<PythAssetFeed[]>([]);
  const [poolUnderlyingPrices, setPoolUnderlyingPrices] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let mounted = true;
    fetchAllPythFeeds()
      .then((feeds) => {
        if (mounted) setPythFeeds(feeds);
      })
      .catch(() => {});

    // Resolve real underlying Pyth market prices for tokenized pools
    markets.slice(0, 2).forEach((p) => {
      const sym = p.tokenSymbol || p.symbol || p.tokenName;
      if (sym) {
        getRealPythMarketPrice(sym).then((res) => {
          if (mounted) {
            setPoolUnderlyingPrices((prev) => ({
              ...prev,
              [p.poolAddress]: res.isAvailable && res.price !== null ? res.price : null,
            }));
          }
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [markets]);

  const featuredAssets = useMemo<FeaturedAsset[]>(() => {
    const list: FeaturedAsset[] = [];

    // 1. On-chain tokenized asset pool (underlying price from verified Pyth only)
    if (markets.length > 0) {
      const p = markets[0];
      const realPrice = poolUnderlyingPrices[p.poolAddress] ?? null;

      list.push({
        id: `pool:${p.poolAddress}`,
        name: p.tokenName || p.name,
        symbol: p.tokenSymbol || p.symbol || 'ASSET',
        category: p.rwaCategory || 'Tokenized',
        price: realPrice,
        changePct: p.activity24h?.priceChange24hPct ?? null,
        poolAddress: p.poolAddress,
      });
    }

    // 2. Solana (Real Pyth oracle)
    const sol = pythFeeds.find((f) => f.id === 'sol_usd');
    list.push({
      id: 'sol_usd',
      name: 'Solana',
      symbol: 'SOL',
      category: 'Layer 1',
      price: sol ? sol.price : null,
      changePct: sol ? sol.change24hPct : null,
    });

    // 3. Bitcoin (Real Pyth oracle)
    const btc = pythFeeds.find((f) => f.id === 'btc_usd');
    list.push({
      id: 'btc_usd',
      name: 'Bitcoin',
      symbol: 'BTC',
      category: 'Crypto',
      price: btc ? btc.price : null,
      changePct: btc ? btc.change24hPct : null,
    });

    // 4. Ethereum (Real Pyth oracle) or second tokenized market
    if (markets.length > 1) {
      const p2 = markets[1];
      const realPrice2 = poolUnderlyingPrices[p2.poolAddress] ?? null;

      list.push({
        id: `pool:${p2.poolAddress}`,
        name: p2.tokenName || p2.name,
        symbol: p2.tokenSymbol || p2.symbol || 'ASSET',
        category: p2.rwaCategory || 'Tokenized',
        price: realPrice2,
        changePct: p2.activity24h?.priceChange24hPct ?? null,
        poolAddress: p2.poolAddress,
      });
    } else {
      const eth = pythFeeds.find((f) => f.id === 'eth_usd');
      list.push({
        id: 'eth_usd',
        name: 'Ethereum',
        symbol: 'ETH',
        category: 'Layer 1',
        price: eth ? eth.price : null,
        changePct: eth ? eth.change24hPct : null,
      });
    }

    return list.slice(0, 4);
  }, [markets, pythFeeds, poolUnderlyingPrices]);

  return (
    <section className="space-y-4">
      {/* Header with Title and Single Clear Action */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-base font-semibold text-zinc-100 font-sans tracking-tight">
          Featured assets
        </h2>

        <button
          type="button"
          onClick={onExploreAll}
          className="text-xs font-sans text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer group font-medium"
        >
          <span>Explore all</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Visual Cards Grid with Strong Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredAssets.map((asset) => {
          const isPositive = asset.changePct !== null && asset.changePct >= 0;

          return (
            <div
              key={asset.id}
              onClick={() => {
                if (onSelectAsset) {
                  onSelectAsset(asset.id, asset.poolAddress);
                } else {
                  onExploreAll();
                }
              }}
              className="rounded-xl border border-zinc-800 bg-[#0b0f17] hover:bg-[#0e1420] hover:border-zinc-700 p-5 flex flex-col justify-between transition-colors cursor-pointer group"
            >
              {/* Top Row: Symbol Badge + Category */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono font-semibold text-xs flex items-center justify-center">
                    {asset.symbol.slice(0, 3)}
                  </div>
                  <span className="text-[11px] text-zinc-500 font-sans px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                    {asset.category}
                  </span>
                </div>

                {/* Asset Name and Symbol */}
                <div className="mt-4">
                  <h3 className="font-semibold text-zinc-100 text-base group-hover:text-white transition-colors truncate font-sans">
                    {asset.name}
                  </h3>
                  <span className="font-mono text-xs text-zinc-500 block mt-0.5">
                    {asset.symbol}
                  </span>
                </div>
              </div>

              {/* Bottom: Current Price and Movement */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-baseline justify-between">
                <span className="font-mono font-bold text-lg text-zinc-100">
                  {asset.price !== null ? formatCurrency(asset.price) : '—'}
                </span>

                {asset.changePct !== null ? (
                  <span
                    className={`font-mono text-xs font-medium ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {asset.changePct.toFixed(2)}%
                  </span>
                ) : (
                  <span className="text-zinc-600 text-xs font-mono">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
