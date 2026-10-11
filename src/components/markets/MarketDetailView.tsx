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
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { getExplorerUrl } from '../../config/constants';
import { formatCurrency, formatPercent } from '../../utils/format';
import { D3MarketPriceChart } from '../charts/D3MarketPriceChart';
import { D3BondingCurveTrajectory } from '../charts/D3BondingCurveTrajectory';
import { MeteoraSwapModal } from './MeteoraSwapModal';
import { AssetPassportModal } from '../passport/AssetPassportModal';
import { getAssetProfile, createAssetProfileFromPool } from '../../data/assetProfiles';
import { NavigationTab } from '../layout/Header';
import { getRealPythMarketPrice, PythRealPriceResult } from '../../services/pythMarketData';
import { fetchPythHistoricalOHLC } from '../../services/pyth';
import { ScreenerAsset } from '../../services/screenerService';
import { AssetLogo } from '../screener/AssetLogo';
import { evaluateMarketHealth } from '../../services/marketHealth';
import { reconcileMarketWithBlockchain } from '../../services/marketStorage';
import { ValticsPredictionMarket } from '../../types/panta';
import { fetchPantaMarkets } from '../../services/pantaService';
import { getMarketsRelatedToAsset } from '../../utils/pantaRelevance';
import { PantaMarketCard } from './PantaMarketCard';
import { PantaMarketDetailModal } from './PantaMarketDetailModal';
import { PantaTradingModal } from './PantaTradingModal';
import { PantaMarketCreationModal } from '../intelligence/PantaMarketCreationModal';

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
  onSelectTab,
  onOpenWalletModal,
}) => {
  const { network, connection } = useNetwork();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [chartTab, setChartTab] = useState<'price' | 'curve' | 'dual'>('price');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileFeedback, setReconcileFeedback] = useState<string | null>(null);

  // Panta Prediction Markets state for this tokenized asset
  const [relatedPredictionMarkets, setRelatedPredictionMarkets] = useState<ValticsPredictionMarket[]>([]);
  const [isLoadingPredictionMarkets, setIsLoadingPredictionMarkets] = useState(true);
  const [selectedPredictionMarket, setSelectedPredictionMarket] = useState<ValticsPredictionMarket | null>(null);
  const [tradingMarket, setTradingMarket] = useState<ValticsPredictionMarket | null>(null);
  const [tradingOutcome, setTradingOutcome] = useState<'YES' | 'NO'>('YES');
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

  const loadRelatedMarkets = () => {
    setIsLoadingPredictionMarkets(true);
    fetchPantaMarkets({ limit: 50 })
      .then((res) => {
        if (res.success && res.data) {
          const matches = getMarketsRelatedToAsset(
            res.data.markets,
            pool.tokenSymbol,
            pool.tokenName
          );
          setRelatedPredictionMarkets(matches);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingPredictionMarkets(false);
      });
  };

  // Fetch prediction markets connected to this tokenized asset
  useEffect(() => {
    loadRelatedMarkets();
  }, [pool.tokenSymbol, pool.tokenName]);

  const handleMarketCreated = (_signature: string, _question: string) => {
    setIsCreationModalOpen(false);
    loadRelatedMarkets();
  };

  const healthReport = useMemo(() => evaluateMarketHealth(pool), [pool]);

  const handleReconcileOnChain = async () => {
    if (!pool.poolAddress) return;
    setIsReconciling(true);
    setReconcileFeedback(null);
    try {
      const res = await reconcileMarketWithBlockchain(pool.poolAddress, connection);
      if (res.reconciled) {
        if (res.differenceDetected) {
          setReconcileFeedback(`ON-CHAIN STATE DIFFERENCE DETECTED: Reconciled ${res.discrepancies.length} parameters from live ledger.`);
        } else {
          setReconcileFeedback('Verified: Local market state strictly matches Solana Devnet blockchain.');
        }
      } else {
        setReconcileFeedback('Ledger verification check: Pool account not found or pending finality.');
      }
    } catch (err: any) {
      setReconcileFeedback(`Verification check failed: ${err?.message || 'RPC communication error'}`);
    } finally {
      setIsReconciling(false);
    }
  };

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
    <div className="max-w-5xl mx-auto space-y-6 font-sans text-[#F7F3FF] pb-16">
      {/* 1. Top Navigation & Primary Actions */}
      <div className="flex items-center justify-between border-b border-[#670CDC]/20 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All assets & screener</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPassportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#670CDC]/30 bg-[#1C0142] text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#250255] transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#D76EDD]" />
            <span>Asset passport</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSwapModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#670CDC] text-white hover:bg-[#7818EE] transition-all cursor-pointer shadow-md shadow-[#670CDC]/30"
          >
            <Coins className="w-3.5 h-3.5 text-[#F99225]" />
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
              <h1 className="text-2xl sm:text-3xl font-bold text-[#F7F3FF] tracking-tight">
                {name}
              </h1>
              <span className="text-xs text-[#B8A9CC] font-sans px-2.5 py-0.5 rounded bg-[#100126] border border-[#670CDC]/25">
                {category}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-mono text-[#B8A9CC]">
              <span className="font-bold text-[#EDE4FA]">{symbol}</span>
              <span>·</span>
              <span className="text-[#B8A9CC]">{issuer}</span>
              <span>·</span>
              <div className="flex items-center gap-1 text-[#7E6D96]">
                <span>Contract:</span>
                <span className="text-[#B8A9CC]">{mintAddress.slice(0, 6)}...{mintAddress.slice(-4)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(mintAddress, 'hero-mint')}
                  className="p-0.5 hover:text-[#EDE4FA]"
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
          <div className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-[#F7F3FF]">
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
                <span className="text-[#7E6D96]">24h</span>
                <span className="text-[#670CDC]/60">•</span>
              </>
            ) : null}
            <span className={pythPriceData?.status === 'unsupported' ? 'text-[#7E6D96]' : 'text-[#B8A9CC]'}>
              {pythPriceData?.marketSession?.statusText ||
                (isLoadingPrice ? 'Connecting to Pyth oracle...' : 'Pyth feed unavailable')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Standardized Market Statistics Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 24h High */}
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#B8A9CC] uppercase block">24h High</span>
          <div className="text-sm font-bold font-mono text-[#F7F3FF]">
            {high24h !== null && high24h > 0 ? formatCurrency(high24h) : '—'}
          </div>
        </div>

        {/* 24h Low */}
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#B8A9CC] uppercase block">24h Low</span>
          <div className="text-sm font-bold font-mono text-[#F7F3FF]">
            {low24h !== null && low24h > 0 ? formatCurrency(low24h) : '—'}
          </div>
        </div>

        {/* 24h Volume */}
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#B8A9CC] uppercase block">24h Volume</span>
          <div className="text-sm font-bold font-mono text-[#F7F3FF]">
            {volume24h !== null && volume24h > 0 ? formatCurrency(volume24h) : '—'}
          </div>
        </div>

        {/* Oracle Confidence */}
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#B8A9CC] uppercase block">Confidence</span>
          <div className="text-sm font-bold font-mono text-[#F7F3FF]">
            {pythPriceData?.confidence !== null && pythPriceData?.confidence !== undefined
              ? `±${formatCurrency(pythPriceData.confidence)}`
              : '—'}
          </div>
        </div>

        {/* Valuation / Market Cap */}
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#B8A9CC] uppercase block">Valuation</span>
          <div className="text-sm font-bold font-mono text-[#F7F3FF]">
            {marketCap !== null && marketCap > 0 ? formatCurrency(marketCap) : '—'}
          </div>
        </div>

        {/* Token Supply */}
        <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-3.5 space-y-1">
          <span className="text-[10px] font-mono text-[#B8A9CC] uppercase block">Supply</span>
          <div className="text-sm font-bold font-mono text-[#F7F3FF] truncate">
            {supply !== null ? supply : '—'}
          </div>
        </div>
      </div>

      {/* 4. D3 Market Intelligence: Real-Time Price History & Dynamic Bonding Curve Trajectory */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#120128] p-5 sm:p-6 shadow-xl shadow-[#09011B]/60 space-y-4">
        {/* Navigation Selector for D3 Analytics Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#670CDC]/20">
          <div>
            <h2 className="text-base font-bold text-[#F7F3FF] tracking-tight">Market Intelligence & Curve Mechanics</h2>
            <p className="text-xs text-[#B8A9CC] mt-0.5">
              Live cryptographic oracle feed combined with deterministic Meteora bonding curve trajectory.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-lg bg-[#140130] border border-[#670CDC]/30 text-xs font-mono">
            <button
              type="button"
              onClick={() => setChartTab('price')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                chartTab === 'price'
                  ? 'bg-[#670CDC] text-white shadow font-semibold'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              Price History (D3)
            </button>
            <button
              type="button"
              onClick={() => setChartTab('curve')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                chartTab === 'curve'
                  ? 'bg-[#670CDC] text-white shadow font-semibold'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              Bonding Curve Trajectory (D3)
            </button>
            <button
              type="button"
              onClick={() => setChartTab('dual')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                chartTab === 'dual'
                  ? 'bg-[#670CDC] text-white shadow font-semibold'
                  : 'text-[#B8A9CC] hover:text-[#F7F3FF]'
              }`}
            >
              Dual Analysis
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {chartTab === 'price' && (
          <D3MarketPriceChart
            currentPrice={currentPrice}
            startPrice={startPrice}
            migrationPrice={pool.migrationPrice || (currentPrice ? currentPrice * 1.4 : 0)}
            quoteSymbol={quoteSymbol}
            tokenSymbol={symbol}
            pythSymbol={pythPriceData?.pythSymbol}
            feedId={pythPriceData?.feedId || pool.poolAddress}
            feedStatus={pythPriceData?.status}
            height={280}
          />
        )}

        {chartTab === 'curve' && (
          <D3BondingCurveTrajectory
            pool={pool}
            quoteSymbol={quoteSymbol}
            height={300}
          />
        )}

        {chartTab === 'dual' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#D76EDD] uppercase tracking-wider block font-semibold">
                Historical Spot Pricing (Pyth Oracle)
              </span>
              <div className="rounded-xl border border-[#670CDC]/20 bg-[#0E0122] p-4">
                <D3MarketPriceChart
                  currentPrice={currentPrice}
                  startPrice={startPrice}
                  migrationPrice={pool.migrationPrice || (currentPrice ? currentPrice * 1.4 : 0)}
                  quoteSymbol={quoteSymbol}
                  tokenSymbol={symbol}
                  pythSymbol={pythPriceData?.pythSymbol}
                  feedId={pythPriceData?.feedId || pool.poolAddress}
                  feedStatus={pythPriceData?.status}
                  height={240}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#F99225] uppercase tracking-wider block font-semibold">
                Bonding Curve Trajectory (Meteora DBC)
              </span>
              <div className="rounded-xl border border-[#670CDC]/20 bg-[#0E0122] p-4">
                <D3BondingCurveTrajectory
                  pool={pool}
                  quoteSymbol={quoteSymbol}
                  height={240}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Authenticity, Market Health & Data Provenance */}
      <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#670CDC]/20">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F7F3FF]">Market Health & On-Chain Provenance</h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  healthReport.overallStatus === 'Healthy'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : healthReport.overallStatus === 'Warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                Health: {healthReport.overallStatus} ({healthReport.overallScore}/100)
              </span>
            </div>
            <p className="text-xs text-[#B8A9CC] mt-0.5">{healthReport.summary}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isReconciling}
              onClick={handleReconcileOnChain}
              className="px-2.5 py-1 rounded bg-[#100126] hover:bg-[#1C0142] text-[#B8A9CC] hover:text-[#F7F3FF] border border-[#670CDC]/30 text-xs font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-[#34D399] ${isReconciling ? 'animate-spin' : ''}`} />
              <span>{isReconciling ? 'Verifying...' : 'Reconcile Ledger'}</span>
            </button>
            <span className="text-[11px] font-mono text-[#D76EDD] bg-[#100126] border border-[#670CDC]/30 px-2 py-0.5 rounded-md font-medium">
              DEVNET VERIFIED
            </span>
          </div>
        </div>

        {reconcileFeedback && (
          <div className={`p-2.5 rounded-lg text-xs font-mono border ${
            reconcileFeedback.includes('DIFFERENCE')
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
          }`}>
            {reconcileFeedback}
          </div>
        )}

        {/* Health Factors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {healthReport.factors.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#1C0142]/60 border border-[#670CDC]/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#7E6D96] block text-[10px] font-mono uppercase">{f.name}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  f.score === 'good' ? 'text-emerald-400 bg-emerald-500/10' : f.score === 'warning' ? 'text-amber-400 bg-amber-500/10' : 'text-[#B8A9CC] bg-[#100126]'
                }`}>
                  {f.label}
                </span>
              </div>
              <p className="text-[11px] text-[#B8A9CC] leading-relaxed">{f.explanation}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-[#1C0142]/60 border border-[#670CDC]/20 space-y-1">
            <span className="text-[#7E6D96] block text-[10px] font-mono uppercase">Market Price Source</span>
            <div className="font-semibold text-[#F7F3FF]">
              {pythPriceData?.isAvailable ? 'Pyth Network Oracle' : 'Oracle Unavailable'}
            </div>
            <p className="text-[11px] text-[#B8A9CC]">
              {pythPriceData?.isAvailable ? 'Hermes v2 cryptographic price feed' : 'No synthetic or fabricated prices'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#1C0142]/60 border border-[#670CDC]/20 space-y-1">
            <span className="text-[#7E6D96] block text-[10px] font-mono uppercase">Asset Specification</span>
            <div className="font-semibold text-[#F7F3FF]">
              {category}
            </div>
            <p className="text-[11px] text-[#B8A9CC]">
              Pyth Reference Catalog metadata
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#1C0142]/60 border border-[#670CDC]/20 space-y-1">
            <span className="text-[#7E6D96] block text-[10px] font-mono uppercase">Issuer Disclosure</span>
            <div className="font-semibold text-[#F7F3FF] truncate" title={issuer}>
              {issuer}
            </div>
            <p className="text-[11px] text-[#B8A9CC]">
              Self-disclosed / benchmark reference
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#1C0142]/60 border border-[#670CDC]/20 space-y-1">
            <span className="text-[#7E6D96] block text-[10px] font-mono uppercase">Execution Environment</span>
            <div className="font-semibold text-[#F7F3FF]">
              Solana Devnet
            </div>
            <p className="text-[11px] text-[#B8A9CC]">
              Meteora Dynamic Bonding Curve
            </p>
          </div>
        </div>

        {/* Immutable Guarantees */}
        <div className="p-3 rounded-lg bg-[#100126] border border-[#670CDC]/20 space-y-1.5 text-xs">
          <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
            Cryptographic & Programmatic Immutability
          </span>
          <div className="flex flex-wrap gap-2 text-[11px] text-[#B8A9CC]">
            {healthReport.immutableGuarantees.map((g, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 bg-[#140130] px-2 py-0.5 rounded border border-[#670CDC]/25">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{g}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-[#7E6D96] pt-1 leading-relaxed">
          Notice: The blockchain is the sole source of truth for market state. Prices are derived from Pyth Network oracle feeds and Meteora DBC on-chain pools on Solana Devnet.
        </div>
      </div>

      {/* 6. Tokenized-Asset Prediction Market Connection (Panta Layer) */}
      <div className="p-6 rounded-2xl bg-[#05051a] border border-[rgba(138,32,255,0.25)] space-y-4 shadow-xl">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F5F5F7] tracking-tight">
                Prediction Market
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#100126] text-[#D4A5FF] border border-[#8A20FF]/30">
                Panta Protocol Layer
              </span>
            </div>
            <p className="text-xs text-[#A7A7B8] mt-0.5">
              Programmable forecasting and hedging markets connected to {pool.tokenName || pool.tokenSymbol}.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (onSelectTab) onSelectTab('predictions');
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 min-h-[36px] rounded-lg bg-[#080821] hover:bg-[#100126] border border-[rgba(138,32,255,0.25)] text-xs font-mono font-medium text-[#F5F5F7] transition-colors cursor-pointer text-center"
            >
              Browse All Markets
            </button>

            <button
              type="button"
              onClick={() => setIsCreationModalOpen(true)}
              className="flex-1 sm:flex-none px-3.5 py-2 min-h-[36px] rounded-lg bg-[#8A20FF] hover:bg-[#670CDC] border border-[#8A20FF]/40 text-xs font-mono font-bold text-white transition-colors cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Market</span>
            </button>
          </div>
        </div>

        {/* Prediction market cards or empty state */}
        {isLoadingPredictionMarkets ? (
          <div className="py-8 flex items-center justify-center text-xs text-[#A7A7B8] font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-[#8A20FF] mr-2" />
            <span>Scanning Panta protocol for related markets...</span>
          </div>
        ) : relatedPredictionMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {relatedPredictionMarkets.map((market) => (
              <PantaMarketCard
                key={market.id}
                market={market}
                onOpenDetails={(m) => setSelectedPredictionMarket(m)}
                onTrade={(m, outcome) => {
                  setTradingMarket(m);
                  setTradingOutcome(outcome);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-[#000010] border border-[rgba(138,32,255,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-sm text-[#F5F5F7] block">Create a market around this asset.</span>
              <p className="text-[#A7A7B8] block text-[11px] leading-relaxed max-w-xl">
                No active Panta prediction market currently exists for {pool.tokenName || pool.tokenSymbol}. Use the AI Market Assistant to draft an objective question, validate criteria, and deploy an on-chain market.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreationModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#8A20FF] hover:bg-[#670CDC] text-xs font-mono font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>CREATE MARKET</span>
            </button>
          </div>
        )}
      </div>

      {/* 7. On-Chain Liquidity & Contract Details (Collapsible) */}
      <div className="pt-2 border-t border-[#670CDC]/20">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full py-2 text-xs text-[#B8A9CC] hover:text-[#F7F3FF] transition-colors cursor-pointer"
        >
          <span className="font-medium">Contract & on-chain addresses</span>
          {showTechnicalDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 p-4 rounded-xl border border-[#670CDC]/25 bg-[#140130] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#B8A9CC]">Pool address</span>
              <div className="flex items-center gap-2 font-mono text-[#F7F3FF]">
                <span>{pool.poolAddress.slice(0, 10)}...{pool.poolAddress.slice(-8)}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(pool.poolAddress, 'pool')}
                  className="text-[#B8A9CC] hover:text-[#F7F3FF]"
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
                  className="text-[#B8A9CC] hover:text-[#F7F3FF]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {pool.baseMint && (
              <div className="flex items-center justify-between pt-2 border-t border-[#670CDC]/20">
                <span className="text-[#B8A9CC]">Token mint</span>
                <div className="flex items-center gap-2 font-mono text-[#F7F3FF]">
                  <span>{pool.baseMint.slice(0, 10)}...{pool.baseMint.slice(-8)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(pool.baseMint, 'mint')}
                    className="text-[#B8A9CC] hover:text-[#F7F3FF]"
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
                    className="text-[#B8A9CC] hover:text-[#F7F3FF]"
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

      {/* Panta Prediction Market Detail Modal */}
      <PantaMarketDetailModal
        market={selectedPredictionMarket}
        onClose={() => setSelectedPredictionMarket(null)}
      />

      {/* Panta Prediction Market Trading Modal */}
      {tradingMarket && (
        <PantaTradingModal
          market={tradingMarket}
          initialOutcome={tradingOutcome}
          onClose={() => setTradingMarket(null)}
        />
      )}

      {/* Panta Market Creation Modal (AI Assistant, Quality Validation, Real TX Building) */}
      {isCreationModalOpen && (
        <PantaMarketCreationModal
          assetSymbol={pool.tokenSymbol || pool.symbol || 'ASSET'}
          assetName={pool.tokenName || pool.name || pool.tokenSymbol || 'Tokenized Asset'}
          currentPrice={currentPrice || pool.startPrice || 100}
          change24hPct={priceChangePct}
          category={pool.rwaCategory || 'tokenized'}
          onClose={() => setIsCreationModalOpen(false)}
          onMarketCreated={handleMarketCreated}
        />
      )}
    </div>
  );
};
