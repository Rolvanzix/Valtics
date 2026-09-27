import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Layers, 
  ArrowUpRight,
} from 'lucide-react';
import { NavigationTab } from '../layout/Header';
import { getCreatedMarkets, onMarketCreated } from '../../services/marketStorage';
import { Button } from '../ui/Button';
import { DBCPoolState } from '../../types';
import { HeroCurveGraphic } from './HeroCurveGraphic';
import { OverviewMetrics } from './OverviewMetrics';
import { MarketCard } from '../markets/MarketCard';
import { PremiumEmptyState } from '../common/PremiumEmptyState';
import { CuratedAssetDiscovery } from './CuratedAssetDiscovery';
import { resolvePythAssetToValticsPool } from '../../services/pythReference';

interface OverviewViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectPool?: (poolAddress: string) => void;
  onSelectAssetPage?: (pool: DBCPoolState) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onSelectTab, onSelectPool, onSelectAssetPage }) => {
  const [markets, setMarkets] = useState<DBCPoolState[]>(() => getCreatedMarkets());

  React.useEffect(() => {
    const unsubM = onMarketCreated(() => {
      setMarkets(getCreatedMarkets());
    });
    return unsubM;
  }, []);

  const totalMarkets = markets.length;
  const activeMarkets = markets.filter((p) => !p.isMigrated).length;
  const assetsLaunched = markets.length;
  const totalLiquidityUsd = useMemo(() => {
    return markets.reduce((sum, p) => sum + (p.tvlUsd || 0), 0);
  }, [markets]);

  const handlePoolClick = (poolAddress: string) => {
    if (onSelectPool) {
      onSelectPool(poolAddress);
    } else {
      onSelectTab('markets');
    }
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-2">
      {/* 1. PRODUCT HERO */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Valtics Protocol</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-sans leading-[1.15]">
            Tokenized asset markets.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed max-w-lg font-sans">
            Automated bonding curves, verifiable reference benchmarks, and programmable liquidity on Solana.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              id="cta-explore-assets"
              variant="brand"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onSelectTab('explore-assets')}
            >
              Explore assets
            </Button>

            <Button
              id="cta-create-market"
              variant="secondary"
              size="lg"
              leftIcon={<Layers className="w-4 h-4 text-zinc-400" />}
              onClick={() => onSelectTab('create')}
            >
              Create market
            </Button>
          </div>
        </div>

        {/* Right Column: Interactive Curve */}
        <div className="lg:col-span-6">
          <HeroCurveGraphic
            onExploreMarkets={() => onSelectTab('markets')}
            onCreateMarket={() => onSelectTab('create')}
          />
        </div>
      </section>

      {/* 2. THREE KEY METRICS */}
      <section>
        <OverviewMetrics
          tvlUsd={totalLiquidityUsd}
          activeMarkets={activeMarkets}
          assetsLaunched={assetsLaunched}
        />
      </section>

      {/* 3. CURATED ASSET DISCOVERY */}
      <CuratedAssetDiscovery
        markets={markets}
        onExploreAll={() => onSelectTab('explore-assets')}
        onSelectAsset={(assetId, poolAddress) => {
          if (poolAddress) {
            const found = markets.find((m) => m.poolAddress === poolAddress);
            if (found && onSelectAssetPage) {
              onSelectAssetPage(found);
            } else {
              handlePoolClick(poolAddress);
            }
          } else if (onSelectAssetPage) {
            const pythDefaults: Record<string, { id: string; symbol: string; display_symbol: string; name: string; type: string }> = {
              sol_usd: {
                id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
                symbol: 'Crypto.SOL/USD',
                display_symbol: 'SOL',
                name: 'Solana',
                type: 'Crypto',
              },
              btc_usd: {
                id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
                symbol: 'Crypto.BTC/USD',
                display_symbol: 'BTC',
                name: 'Bitcoin',
                type: 'Crypto',
              },
              eth_usd: {
                id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
                symbol: 'Crypto.ETH/USD',
                display_symbol: 'ETH',
                name: 'Ethereum',
                type: 'Crypto',
              },
            };

            const def = pythDefaults[assetId];
            if (def) {
              const mockFeedItem = {
                id: def.id,
                attributes: {
                  symbol: def.symbol,
                  display_symbol: def.display_symbol,
                  description: def.name,
                  asset_type: def.type,
                },
              };
              const pool = resolvePythAssetToValticsPool(mockFeedItem as any);
              onSelectAssetPage(pool);
            } else {
              onSelectTab('explore-assets');
            }
          } else {
            onSelectTab('explore-assets');
          }
        }}
      />

      {/* 4. RECENT MARKETS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 font-sans tracking-tight">
              Recent markets
            </h2>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Programmable liquidity pools initialized on Solana
            </p>
          </div>

          {markets.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab('markets')}
              className="text-xs font-sans text-zinc-200 hover:text-white flex items-center gap-1 transition-colors cursor-pointer group font-medium"
            >
              <span>All markets ({totalMarkets})</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          )}
        </div>

        {markets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.slice(0, 6).map((pool) => (
              <MarketCard
                key={pool.poolAddress}
                pool={pool}
                onSelect={handlePoolClick}
              />
            ))}
          </div>
        ) : (
          <PremiumEmptyState
            title="No markets yet"
            description="Create your first programmable market to begin trading."
            actionLabel="Create market"
            onAction={() => onSelectTab('create')}
          />
        )}
      </section>
    </div>
  );
};
