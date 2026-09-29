import React, { useState, useMemo } from 'react';
import { DBCPoolState } from '../../types';
import { getCreatedMarkets, onMarketCreated } from '../../services/marketStorage';
import { MarketDetailView } from './MarketDetailView';
import { NavigationTab } from '../layout/Header';
import { MarketScreener } from '../screener/MarketScreener';
import { ScreenerAsset } from '../../services/screenerService';
import { resolvePythAssetToValticsPool } from '../../services/pythReference';
import { useNetwork } from '../../context/NetworkContext';

interface MarketsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectPoolForInspector?: (pool: DBCPoolState) => void;
  selectedMarketAddress?: string | null;
  customActivePool?: DBCPoolState | null;
  onOpenWalletModal?: () => void;
  onBackToExplore?: () => void;
}

export const MarketsView: React.FC<MarketsViewProps> = ({
  onSelectTab,
  onSelectPoolForInspector,
  selectedMarketAddress,
  customActivePool,
  onOpenWalletModal,
  onBackToExplore,
}) => {
  const { environment } = useNetwork();
  // Environment-aware created markets
  const [createdPools, setCreatedPools] = useState<DBCPoolState[]>(() => getCreatedMarkets(environment));
  const [selectedScreenerAsset, setSelectedScreenerAsset] = useState<ScreenerAsset | null>(null);

  React.useEffect(() => {
    setCreatedPools(getCreatedMarkets(environment));
    const unsub = onMarketCreated(() => {
      setCreatedPools(getCreatedMarkets(environment));
    });
    return () => unsub();
  }, [environment]);

  // Standard pools from created markets
  const standardPools: DBCPoolState[] = createdPools;

  // Initial active detail pool if selectedMarketAddress or customActivePool is passed
  const initialPool = useMemo(() => {
    if (customActivePool) return customActivePool;
    if (!selectedMarketAddress) return null;
    return standardPools.find((p) => p.poolAddress === selectedMarketAddress) || null;
  }, [selectedMarketAddress, standardPools, customActivePool]);

  const [activeDetailPool, setActiveDetailPool] = useState<DBCPoolState | null>(initialPool);

  // If initialPool or customActivePool changes via prop, update activeDetailPool
  React.useEffect(() => {
    if (customActivePool) {
      setActiveDetailPool(customActivePool);
    } else if (selectedMarketAddress) {
      const match = standardPools.find((p) => p.poolAddress === selectedMarketAddress);
      if (match) setActiveDetailPool(match);
    }
  }, [customActivePool, selectedMarketAddress, standardPools]);

  const handleSelectScreenerAsset = (asset: ScreenerAsset) => {
    setSelectedScreenerAsset(asset);

    if (asset.poolState) {
      setActiveDetailPool(asset.poolState);
      if (onSelectPoolForInspector) onSelectPoolForInspector(asset.poolState);
      return;
    }

    if (asset.feedItem) {
      const resolved = resolvePythAssetToValticsPool(
        asset.feedItem,
        asset.price,
        asset.change24hPct
      );
      setActiveDetailPool(resolved);
      if (onSelectPoolForInspector) onSelectPoolForInspector(resolved);
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

    setActiveDetailPool(fallbackPool);
    if (onSelectPoolForInspector) onSelectPoolForInspector(fallbackPool);
  };

  // If a pool detail terminal is active, render the full MarketDetailView
  if (activeDetailPool) {
    return (
      <MarketDetailView
        pool={activeDetailPool}
        screenerAsset={selectedScreenerAsset}
        onBack={() => {
          setActiveDetailPool(null);
          setSelectedScreenerAsset(null);
          if (onBackToExplore) {
            onBackToExplore();
          }
        }}
        onSelectTab={onSelectTab}
        onOpenWalletModal={onOpenWalletModal}
      />
    );
  }

  return (
    <div className="space-y-6">
      <MarketScreener
        onSelectAsset={handleSelectScreenerAsset}
        onSelectTab={onSelectTab}
      />
    </div>
  );
};
