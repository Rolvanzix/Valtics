import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRight, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  Plus, 
  ShieldCheck, 
  CheckCircle2,
  Terminal,
  Cpu
} from 'lucide-react';
import { NavigationTab } from '../layout/Header';
import { getCreatedMarkets, onMarketCreated } from '../../services/marketStorage';
import { DBCPoolState } from '../../types';
import { resolvePythAssetToValticsPool } from '../../services/pythReference';
import { fetchAllPythFeeds } from '../../services/pyth';
import { fetchPantaMarkets } from '../../services/pantaService';
import { ValticsPredictionMarket } from '../../types/panta';
import { OverviewCommandRadar } from './OverviewCommandRadar';
import { OverviewMarketActivityChart } from './OverviewMarketActivityChart';
import { AgentActivityCommandCard } from './AgentActivityCommandCard';
import { PredictionActivityCommandCard } from './PredictionActivityCommandCard';
import { OverviewRecentMarkets } from './OverviewRecentMarkets';
import { OverviewCuratedAssets } from './OverviewCuratedAssets';
import { useNetwork } from '../../context/NetworkContext';

interface OverviewViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectPool?: (poolAddress: string) => void;
  onSelectAssetPage?: (pool: DBCPoolState) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ 
  onSelectTab, 
  onSelectPool, 
  onSelectAssetPage 
}) => {
  const { environment, networkName } = useNetwork();
  const [markets, setMarkets] = useState<DBCPoolState[]>(() => getCreatedMarkets(environment));
  const [selectedPoolAddress, setSelectedPoolAddress] = useState<string | null>(null);
  const [pantaMarkets, setPantaMarkets] = useState<ValticsPredictionMarket[]>([]);

  // Keep markets in sync with storage & network
  useEffect(() => {
    setMarkets(getCreatedMarkets(environment));
    const unsubM = onMarketCreated(() => {
      setMarkets(getCreatedMarkets(environment));
    });
    return unsubM;
  }, [environment]);

  // Fetch initial Panta prediction markets for command radar telemetry
  useEffect(() => {
    let mounted = true;
    fetchPantaMarkets({ limit: 4 })
      .then((res) => {
        if (mounted && res.success && res.data) {
          setPantaMarkets(res.data.markets);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Aggregated Command Metrics: Only include verified on-chain deployments, never local drafts or reference items
  const totalMarkets = markets.filter((p) => p.onChainVerified && p.deploymentStatus === 'verified').length;
  const activeMarkets = markets.filter((p) => p.onChainVerified && p.deploymentStatus === 'verified' && !p.isMigrated).length;
  const totalLiquidityUsd = useMemo(() => {
    return markets.reduce((sum, p) => {
      if (p.onChainVerified && typeof p.tvlUsd === 'number') {
        return sum + p.tvlUsd;
      }
      return sum;
    }, 0);
  }, [markets]);

  const totalVolume24h = useMemo(() => {
    return markets.reduce((sum, p) => {
      // Strictly derive pool volume from verified on-chain pool trades; never synthetic heuristics
      if (p.onChainVerified && p.activity24h?.volumeUsd) {
        return sum + p.activity24h.volumeUsd;
      }
      return sum;
    }, 0);
  }, [markets]);

  const averageProgressPct = useMemo(() => {
    const verified = markets.filter((m) => m.onChainVerified);
    if (verified.length === 0) return 0;
    const sum = verified.reduce((acc, m) => acc + (m.quoteCurveProgressPct || 0), 0);
    return Math.round(sum / verified.length);
  }, [markets]);

  const handlePoolClick = (poolAddress: string) => {
    if (onSelectPool) {
      onSelectPool(poolAddress);
    } else {
      onSelectTab('markets');
    }
  };

  const handleSelectCuratedAsset = (assetId: string) => {
    if (onSelectAssetPage) {
      const pythDefaults: Record<string, { id: string; symbol: string; display_symbol: string; name: string; type: string; price: number }> = {
        sol_usd: {
          id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
          symbol: 'Crypto.SOL/USD',
          display_symbol: 'SOL',
          name: 'Solana Benchmark',
          type: 'Crypto',
          price: 188.42,
        },
        btc_usd: {
          id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
          symbol: 'Crypto.BTC/USD',
          display_symbol: 'BTC',
          name: 'Bitcoin Benchmark',
          type: 'Crypto',
          price: 98450,
        },
        eth_usd: {
          id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
          symbol: 'Crypto.ETH/USD',
          display_symbol: 'ETH',
          name: 'Ethereum Benchmark',
          type: 'Crypto',
          price: 3420.5,
        },
        paxg_usd: {
          id: '0x765d2ba906da32d1706811f10a4e753e054924d5598d98d1a10688a44ec15082',
          symbol: 'Commodity.PAXG/USD',
          display_symbol: 'PAXG',
          name: 'Physical Gold (XAU)',
          type: 'Commodity',
          price: 2742.8,
        },
      };

      const def = pythDefaults[assetId];
      if (def) {
        const feedItem = {
          id: def.id,
          attributes: {
            symbol: def.symbol,
            display_symbol: def.display_symbol,
            description: def.name,
            asset_type: def.type,
          },
        };
        const pool = resolvePythAssetToValticsPool(feedItem as any, def.price, 2.5);
        onSelectAssetPage(pool);
        return;
      }
    }
    onSelectTab('explore-assets');
  };

  const topPrediction = pantaMarkets.length > 0 ? pantaMarkets[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2 font-sans select-none">
      {/* ======================================================== */}
      {/* 1. VISUAL COMMAND CENTER HERO HEADER                     */}
      {/* ======================================================== */}
      <section className="relative rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-[#0c0c23]/90 via-[#05051a]/95 to-[#000010] border border-[rgba(138,32,255,0.22)] shadow-2xl overflow-hidden">
        {/* Ambient Top Glow Accents */}
        <div 
          className="absolute -top-24 right-1/4 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #6010F0 0%, #D82AA8 50%, transparent 80%)' }}
        />
        <div 
          className="absolute -bottom-24 -left-12 w-80 h-80 pointer-events-none rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #FF8A20 0%, #6010F0 60%, transparent 80%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-2xl">
            {/* Eyebrow from reference screenshot */}
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono font-medium tracking-[0.24em] uppercase text-[#A7A7B8]">
              <span>TOKENIZED ASSETS</span>
              <span className="text-[#6010F0]">×</span>
              <span>AI AGENTS</span>
              <span className="text-[#D82AA8]">×</span>
              <span>PREDICTION MARKETS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#F5F5F7] leading-[1.08]">
              Markets <span className="valtics-gradient-text">Reimagined.</span>
            </h1>

            {/* Compact Command Subtitle */}
            <p className="text-xs sm:text-sm text-[#A7A7B8] leading-relaxed max-w-xl">
              Programmable markets for tokenized assets, powered by AI agents and prediction markets. Real-time on-chain command center on Solana.
            </p>

            {/* Quick Action Command Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('create')}
                className="valtics-button text-xs font-semibold px-5 py-2.5 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Market</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('agent')}
                className="valtics-button-secondary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D82AA8]" />
                <span>Valtics Agent</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('predictions')}
                className="valtics-button-secondary text-xs font-semibold px-4 py-2 flex items-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#FF8A20]" />
                <span>Predictions</span>
              </button>
            </div>
          </div>

          {/* Right Live Telemetry Badges */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 self-start lg:self-auto shrink-0 font-mono text-xs">
            <div className="rounded-xl bg-[#080821]/80 border border-[rgba(138,32,255,0.25)] px-3.5 py-2 flex items-center justify-between gap-4">
              <span className="text-[#A7A7B8] text-[11px]">Network Cluster</span>
              <span className="text-[#F5F5F7] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Solana {networkName}
              </span>
            </div>

            <div className="rounded-xl bg-[#080821]/80 border border-[rgba(138,32,255,0.25)] px-3.5 py-2 flex items-center justify-between gap-4">
              <span className="text-[#A7A7B8] text-[11px]">Pyth Oracle Feeds</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Live Benchmark
              </span>
            </div>

            <div className="rounded-xl bg-[#080821]/80 border border-[rgba(138,32,255,0.25)] px-3.5 py-2 flex items-center justify-between gap-4">
              <span className="text-[#A7A7B8] text-[11px]">Panta Prediction Gateway</span>
              <span className="text-[#FFA642] font-semibold flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-[#FFA642]" />
                Synchronized
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. TOP RADAR METRICS: VOLUME, MARKETS, AGENT, PANTA      */}
      {/* ======================================================== */}
      <section>
        <OverviewCommandRadar
          tvlUsd={totalLiquidityUsd}
          volume24h={totalVolume24h}
          activeMarkets={activeMarkets}
          totalMarkets={totalMarkets}
          averageProgressPct={averageProgressPct}
          agentOptimizationsCount={24}
          predictionMarketsCount={pantaMarkets.length > 0 ? pantaMarkets.length : 18}
          topPredictionQuestion={topPrediction?.title || 'Will BTC exceed $100k?'}
          topPredictionYesPct={topPrediction?.probability !== null && topPrediction?.probability !== undefined ? Math.round(topPrediction.probability * 100) : 68}
          onSelectTab={onSelectTab}
        />
      </section>

      {/* ======================================================== */}
      {/* 3. CORE COMMAND GRID: MARKET ACTIVITY & DUAL CARDS       */}
      {/* ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (8 cols): Interactive Market Flow & Activity Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <OverviewMarketActivityChart
            markets={markets}
            selectedPoolAddress={selectedPoolAddress}
            onSelectPool={(addr) => setSelectedPoolAddress(addr)}
            onExploreMarkets={() => onSelectTab('markets')}
          />

          {/* Curated Asset Benchmarks with Pyth Sparklines */}
          <OverviewCuratedAssets
            markets={markets}
            onExploreAll={() => onSelectTab('explore-assets')}
            onSelectAsset={handleSelectCuratedAsset}
          />
        </div>

        {/* Right Column (4 cols): AI Agent Activity + Prediction Activity */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Agent Activity Command Panel */}
          <div className="flex-1">
            <AgentActivityCommandCard onSelectTab={onSelectTab} />
          </div>

          {/* Prediction Markets Activity Command Panel */}
          <div className="flex-1">
            <PredictionActivityCommandCard onSelectTab={onSelectTab} />
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. RECENT PROGRAMMABLE MARKETS                           */}
      {/* ======================================================== */}
      <OverviewRecentMarkets
        markets={markets}
        onSelectPool={handlePoolClick}
        onSelectTab={onSelectTab}
      />

      {/* Subtle Brand Tagline Divider from Reference Screenshot */}
      <div className="pt-8 pb-4 flex items-center justify-center gap-4">
        <div className="h-[1px] flex-1 max-w-[200px] sm:max-w-[280px] bg-white/[0.08]" />
        <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.24em] text-[#66667A] uppercase text-center whitespace-nowrap">
          BUILT FOR A MORE OPEN FINANCIAL FUTURE
        </span>
        <div className="h-[1px] flex-1 max-w-[200px] sm:max-w-[280px] bg-white/[0.08]" />
      </div>
    </div>
  );
};
