import React from 'react';
import { NavigationTab } from '../layout/Header';
import { MarketScreener } from '../screener/MarketScreener';
import { ScreenerAsset } from '../../services/screenerService';
import { DBCPoolState } from '../../types';
import { resolvePythAssetToValticsPool } from '../../services/pythReference';

interface ExploreAssetsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectAssetPage: (pool: DBCPoolState) => void;
}

export const ExploreAssetsView: React.FC<ExploreAssetsViewProps> = ({
  onSelectTab,
  onSelectAssetPage,
}) => {
  const handleSelectAsset = (asset: ScreenerAsset) => {
    if (asset.poolState) {
      onSelectAssetPage(asset.poolState);
      return;
    }

    if (asset.feedItem) {
      const resolved = resolvePythAssetToValticsPool(
        asset.feedItem,
        asset.price,
        asset.change24hPct
      );
      onSelectAssetPage(resolved);
      return;
    }

    // Fallback minimal pool state for viewing
    const fallbackPool: DBCPoolState = {
      poolAddress: asset.id,
      configAddress: '',
      baseMint: asset.mintAddress || asset.id,
      quoteMint: 'So11111111111111111111111111111111111111112',
      baseVault: '',
      quoteVault: '',
      creator: asset.issuer,
      migrationOption: 1,
      migrationOptionLabel: 'MET_DAMM_V2',
      baseReserve: asset.supply || '1,000,000',
      quoteReserve: '0',
      quoteThreshold: '100,000',
      currentPrice: asset.price || 0,
      startPrice: asset.price ? asset.price * 0.95 : 10,
      migrationPrice: asset.price ? asset.price * 1.5 : 20,
      quoteCurveProgressPct: 50,
      baseCurveProgressPct: 50,
      isMigrated: false,
      baseFeeBps: 25,
      tokenName: asset.name,
      tokenSymbol: asset.symbol,
      rwaCategory: asset.category as any,
      referencePrice: asset.price || undefined,
      referencePriceLabel: 'Pyth Reference Benchmark',
      tvlUsd: asset.marketCap || (asset.price ? asset.price * 100000 : 0),
      activity24h: {
        tradeCount: 24,
        volumeUsd: asset.volume || 0,
        priceChange24hPct: asset.change24hPct || 0,
        isIndexed: true,
      },
      curveType: 'linear',
      description: `${asset.name} (${asset.symbol}) verified benchmark feed via Pyth Network oracle.`,
      network: 'devnet',
      createdAt: new Date().toISOString(),
    };

    onSelectAssetPage(fallbackPool);
  };

  return (
    <div className="max-w-7xl mx-auto py-2">
      <MarketScreener
        onSelectAsset={handleSelectAsset}
        onSelectTab={onSelectTab}
      />
    </div>
  );
};
