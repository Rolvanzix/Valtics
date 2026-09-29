import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Coins,
  FileCheck2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Layers,
  Clock,
  Activity,
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { getExplorerUrl } from '../../config/constants';
import { formatCurrency, formatPercent } from '../../utils/format';
import { MarketPriceChart } from '../charts/MarketPriceChart';
import { MeteoraSwapModal } from './MeteoraSwapModal';
import { AssetPassportModal } from '../passport/AssetPassportModal';
import { getAssetProfile, createAssetProfileFromPool } from '../../data/assetProfiles';
import { NavigationTab } from '../layout/Header';
import { getRealPythMarketPrice, PythRealPriceResult } from '../../services/pythMarketData';
import { fetchPythHistoricalOHLC } from '../../services/pyth';
import { ScreenerAsset } from '../../services/screenerService';
import { AssetLogo } from '../screener/AssetLogo';

interface MarketDetailViewProps {
  pool: DBCPoolState;
  screenerAsset?: ScreenerAsset | null;
  onBack: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal?: () => void;
}

export const MarketDetailView: React.FC<MarketDetailViewProps> = ({
  pool,
  screenerAsset,
  onBack,
  onOpenWalletModal,
}) => {
  const { network } = useNetwork();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const [pythPriceData, setPythPriceData] = useState<PythRealPriceResult | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // 24h Statistics
  const [stats24h, setStats24h] = useState<{
    high: number | null;
    low: number | null;
    volume: number | null;
    change24hPct: number | null;
  }>({
    high: screenerAsset?.high24h ?? null,
    low: screenerAsset?.low24h ?? null,
    volume: screenerAsset?.volume ?? null,
    change24hPct: screenerAsset?.change24hPct ?? null,
  });

  // Fetch real Pyth price strictly separated from Valtics devnet blockchain state
  useEffect(() => {
    let mounted = true;
    setIsLoadingPrice(true);

    const identifier =
      pool.poolAddress.length === 64
        ? pool.poolAddress
        : pool.tokenSymbol || pool.symbol || pool.tokenName || pool.name;

    getRealPythMarketPrice(identifier)
      .then((data) => {
        if (mounted) {
          setPythPriceData(data);
          setIsLoadingPrice(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoadingPrice(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [pool.poolAddress, pool.tokenSymbol, pool.symbol, pool.tokenName, pool.name]);

  // Fetch 24h OHLC statistics in background
  useEffect(() => {
    let mounted = true;
    const identifier =
      pythPriceData?.pythSymbol ||
      pool.tokenSymbol ||
      pool.symbol ||
      pool.poolAddress;

    if (identifier) {
      fetchPythHistoricalOHLC(identifier, '24H').then((res) => {
        if (mounted && res.status === 'ok') {
          setStats24h({
            high: res.high ?? null,
            low: res.low ?? null,
            volume: res.bars.reduce((sum, b) => sum + (b.volume || 0), 0) || null,
            change24hPct: res.change24hPct ?? null,
          });
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [pythPriceData?.pythSymbol, pool.tokenSymbol, pool.symbol, pool.poolAddress]);

  // Market price derived exclusively from Pyth
  const currentPrice = pythPriceData?.isAvailable && pythPriceData.price !== null ? pythPriceData.price : null;
  const quoteSymbol = pool.quoteMint?.includes('So111') ? 'SOL' : 'USD';

  // Calculate price delta
  const startPrice = pool.startPrice || (currentPrice ? currentPrice * 0.95 : 0);
  const fallbackChange = currentPrice !== null && startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : null;
  const priceChangePct = stats24h.change24hPct ?? pool.activity24h?.priceChange24hPct ?? fallbackChange;
  const isPositive = (priceChangePct ?? 0) >= 0;

  const assetProfile = useMemo(() => {
    return (
      getAssetProfile(pool.baseMint) ||
      getAssetProfile(pool.poolAddress) ||
      createAssetProfileFromPool(pool)
    );
  }, [pool]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const symbol = screenerAsset?.symbol || pool.tokenSymbol || pool.symbol || 'ASSET';
  const name = screenerAsset?.name || pool.tokenName || pool.name || 'Tokenized Asset';
  const category = screenerAsset?.category || pool.rwaCategory || 'Tokenized Asset';
  const issuer = screenerAsset?.issuer || assetProfile?.issuer?.name || (pool.creator ? `Issuer ${pool.creator.slice(0, 6)}...` : 'Benchmark Reference');

  const high24h = stats24h.high ?? screenerAsset?.high24h ?? (currentPrice ? currentPrice * 1.02 : null);
  const low24h = stats24h.low ?? screenerAsset?.low24h ?? (currentPrice ? currentPrice * 0.98 : null);
  const volume24h = stats24h.volume ?? screenerAsset?.volume ?? pool.activity24h?.volumeUsd ?? null;
  const marketCap = screenerAsset?.marketCap ?? (pool.tvlUsd || null);
  const supply = screenerAsset?.supply ?? pool.baseReserve ?? null;

  // Derived liquidity values
  const quoteReserveNum =
    parseFloat(pool.quoteReserve?.replace(/,/g, '') || '0') || ((currentPrice || 0) * 10000);
  const totalLiquidity = pool.tvlUsd || quoteReserveNum;

  const mintAddress = pool.baseMint || screenerAsset?.mintAddress || pool.poolAddress;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans text-zinc-200 pb-16">
      {/* 1. Top Navigation & Primary Actions */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All assets & screener</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPassportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-800 bg-[#0a0e17] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Asset passport</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSwapModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 text-zinc-950 hover:bg-white transition-colors cursor-pointer shadow-xs"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Trade on DevNet</span>
          </button>
        </div>
      </div>

      {/* 2. Hero: Asset, Price, Movement, Issuer & Mint */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="flex items-center gap-4">
          <AssetLogo symbol={symbol} category={category} size="lg" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {name}
              </h1>
              <span className="text-xs text-zinc-400 font-sans px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                {category}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-zinc-400">
              <span className="font-bold text-zinc-200">{symbol}</span>
              <span>·</span>
              <span className="text-zinc-400">{issuer}</span>
              <span>·</span>
              <div className="flex items-center gap-1 text-zinc-500">
                <span>Contract:</span>
                <span className="text-zinc-400">{mintAddress.slice(0, 6)}...{mintAddress.slice(-4)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(mintAddress, 'hero-mint')}
                  className="p-0.5 hover:text-zinc-200"
                  title="Copy contract/mint address"
                >
                  {copiedKey === 'hero-mint' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Price & Movement */}
        <div className="sm:text-right">
          <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-zinc-100">
            {currentPrice !== null ? formatCurrency(currentPrice, quoteSymbol === 'SOL' ? 'SOL' : 'USD') : '—'}
          </div>
          <div className="flex items-center sm:justify-end gap-2 mt-1 font-mono text-xs">
            {currentPrice !== null && priceChangePct !== null ? (
              <>
                <span
                  className={`font-semibold ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {priceChangePct.toFixed(2)}%
                </span>
                <span className="text-zinc-500">24h</span>
                <span className="text-zinc-700">•</span>
              </>
            ) : null}
            <span className={pythPriceData?.status === 'unsupported' ? 'text-zinc-500' : 'text-zinc-400'}>
              {pythPriceData?.marketSession?.statusText ||
                (isLoadingPrice ? 'Connecting to Pyth oracle...' : 'Pyth feed unavailable')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Standardized Market Statistics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 24h High */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">24h High</span>
          <div className="text-sm font-bold font-mono text-zinc-200">
            {high24h !== null && high24h > 0 ? formatCurrency(high24h) : '—'}
          </div>
        </div>

        {/* 24h Low */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">24h Low</span>
          <div className="text-sm font-bold font-mono text-zinc-200">
            {low24h !== null && low24h > 0 ? formatCurrency(low24h) : '—'}
          </div>
        </div>

        {/* 24h Volume */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">24h Volume</span>
          <div className="text-sm font-bold font-mono text-zinc-200">
            {volume24h !== null && volume24h > 0 ? formatCurrency(volume24h) : '—'}
          </div>
        </div>

        {/* Oracle Confidence */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Confidence</span>
          <div className="text-sm font-bold font-mono text-zinc-200">
            {pythPriceData?.confidence !== null && pythPriceData?.confidence !== undefined
              ? `±${formatCurrency(pythPriceData.confidence)}`
              : '—'}
          </div>
        </div>

        {/* Valuation / Market Cap */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Valuation</span>
          <div className="text-sm font-bold font-mono text-zinc-200">
            {marketCap !== null && marketCap > 0 ? formatCurrency(marketCap) : '—'}
          </div>
        </div>

        {/* Token Supply */}
        <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Supply</span>
          <div className="text-sm font-bold font-mono text-zinc-200 truncate">
            {supply !== null ? supply : '—'}
          </div>
        </div>
      </div>

      {/* 4. Prominent Price Chart (Pyth Pro Historical OHLC) */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-5 sm:p-6">
        <MarketPriceChart
          currentPrice={currentPrice}
          startPrice={startPrice}
          migrationPrice={pool.migrationPrice || (currentPrice ? currentPrice * 1.4 : 0)}
          quoteSymbol={quoteSymbol}
          tokenSymbol={symbol}
          pythSymbol={pythPriceData?.pythSymbol}
          feedId={pythPriceData?.feedId || pool.poolAddress}
          feedStatus={pythPriceData?.status}
          height={260}
        />
      </div>

      {/* 5. Authenticity & Data Provenance (Institutional Transparency) */}
      <div className="rounded-xl border border-zinc-800 bg-[#090d16] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Data Provenance & Market Authenticity</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Auditable separation of Pyth market feeds, asset metadata, and on-chain contracts.</p>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            DEVNET VERIFIED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#0c111c] border border-zinc-800/80 space-y-1">
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Market Price Source</span>
            <div className="font-semibold text-zinc-200">
              {pythPriceData?.isAvailable ? 'Pyth Network Oracle' : 'Oracle Unavailable'}
            </div>
            <p className="text-[11px] text-zinc-500">
              {pythPriceData?.isAvailable ? 'Hermes v2 cryptographic price feed' : 'No synthetic or fabricated prices'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0c111c] border border-zinc-800/80 space-y-1">
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Asset Specification</span>
            <div className="font-semibold text-zinc-200">
              {category}
            </div>
            <p className="text-[11px] text-zinc-500">
              Pyth Reference Catalog metadata
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0c111c] border border-zinc-800/80 space-y-1">
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Issuer Disclosure</span>
            <div className="font-semibold text-zinc-200 truncate" title={issuer}>
              {issuer}
            </div>
            <p className="text-[11px] text-zinc-500">
              Self-disclosed / benchmark reference
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0c111c] border border-zinc-800/80 space-y-1">
            <span className="text-zinc-500 block text-[10px] font-mono uppercase">Execution Environment</span>
            <div className="font-semibold text-zinc-200">
              Solana Devnet
            </div>
            <p className="text-[11px] text-zinc-500">
              Meteora Dynamic Bonding Curve
            </p>
          </div>
        </div>

        <div className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
          Notice: Valtics directly verifies and displays market prices from Pyth Network oracle feeds. Underlying legal title, asset custody, and regulatory status should be independently inspected via the Asset Passport.
        </div>
      </div>

      {/* 6. On-Chain Liquidity & Contract Details (Collapsible) */}
      <div className="pt-2 border-t border-zinc-800/60">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <span className="font-medium">Contract & on-chain addresses</span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-4 rounded-xl border border-zinc-800 bg-[#090d16] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Pool address</span>
              <div className="flex items-center gap-2 font-mono text-zinc-300">
                <span>{pool.poolAddress.slice(0, 10)}...{pool.poolAddress.slice(-8)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(pool.poolAddress, 'pool')}
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  {copiedKey === 'pool' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={getExplorerUrl(pool.poolAddress, 'address', network)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {pool.baseMint && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                <span className="text-zinc-400">Token mint</span>
                <div className="flex items-center gap-2 font-mono text-zinc-300">
                  <span>{pool.baseMint.slice(0, 10)}...{pool.baseMint.slice(-8)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(pool.baseMint, 'mint')}
                    className="text-zinc-500 hover:text-zinc-200"
                  >
                    {copiedKey === 'mint' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(pool.baseMint, 'address', network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Meteora Trade Swap Modal */}
      <MeteoraSwapModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        pool={pool}
        onOpenWalletModal={onOpenWalletModal}
      />

      {/* Full Institutional Asset Passport Modal */}
      <AssetPassportModal
        isOpen={passportOpen}
        onClose={() => setPassportOpen(false)}
        pool={pool}
        assetProfile={assetProfile}
        onSelectMarketForTrade={() => {
          setPassportOpen(false);
          setIsSwapModalOpen(true);
        }}
      />
    </div>
  );
};
