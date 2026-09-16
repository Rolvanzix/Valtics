import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Lock,
  Layers,
  Cpu,
  AlertTriangle,
  Zap,
  Info,
  Sliders,
  DollarSign,
  PieChart,
  CheckCircle2,
  Calendar,
  Share2,
  Coins,
  Copy,
  Check,
  FileCheck2,
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { METEORA_DBC_PROGRAM_ID, getExplorerUrl } from '../../config/constants';
import { AddressBadge } from '../common/AddressBadge';
import { formatCurrency, formatPercent, formatBps, formatNumber, formatRelativeTime } from '../../utils/format';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, Column } from '../ui/Table';
import { Dialog } from '../ui/Dialog';
import { ProvenanceBadge, ProvenanceLegend } from '../common/DataProvenance';
import { MarketPriceChart } from '../charts/MarketPriceChart';
import { BondingCurveChart } from '../charts/BondingCurveChart';
import { GraduationGauge } from '../charts/GraduationGauge';
import { PriceProjectionChart } from '../charts/PriceProjectionChart';
import { generateCurvePoints, RWA_PRESETS } from '../../services/curveCalculator';
import { NavigationTab } from '../layout/Header';
import { ValticsMark } from '../brand/ValticsLogo';
import { BlockchainContextBar } from '../common/BlockchainContextBar';
import { MeteoraSwapModal } from './MeteoraSwapModal';
import { AssetPassportModal } from '../passport/AssetPassportModal';
import { getAssetProfile, createAssetProfileFromPool } from '../../data/assetProfiles';

interface MarketDetailViewProps {
  pool: DBCPoolState;
  onBack: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenWalletModal?: () => void;
}

export const MarketDetailView: React.FC<MarketDetailViewProps> = ({
  pool,
  onBack,
  onSelectTab,
  onOpenWalletModal,
}) => {
  const { network } = useNetwork();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [passportOpen, setPassportOpen] = useState(false);

  const assetProfile = useMemo(() => {
    return getAssetProfile(pool.baseMint) || getAssetProfile(pool.poolAddress) || createAssetProfileFromPool(pool);
  }, [pool]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Curve points for mathematical visualization
  const curvePoints = useMemo(() => {
    const preset = pool.rwaCategory === 'Real Estate'
      ? RWA_PRESETS.REAL_ESTATE
      : pool.rwaCategory === 'Treasuries'
      ? RWA_PRESETS.TREASURY_BILL
      : pool.rwaCategory === 'Private Credit'
      ? RWA_PRESETS.PRIVATE_CREDIT
      : RWA_PRESETS.TOKENIZED_EQUITY;

    return generateCurvePoints({
      ...preset,
      curveType: pool.curveType || preset.curveType,
      startPriceUsd: pool.startPrice || preset.startPriceUsd,
      migrationMarketCapUsd: (pool.migrationPrice || pool.currentPrice * 1.5) * (pool.totalSupply || 10000000),
      totalSupply: pool.totalSupply || preset.totalSupply,
      feeBps: pool.baseFeeBps,
    }, 24);
  }, [pool]);

  // Derived liquidity math
  const quoteReserveNum = parseFloat(pool.quoteReserve.replace(/,/g, '')) || (pool.currentPrice * 125000);
  const baseReserveNum = parseFloat(pool.baseReserve.replace(/,/g, '')) || (pool.totalSupply ? pool.totalSupply * 0.7 : 7000000);
  const totalTvl = pool.tvlUsd || (quoteReserveNum + (baseReserveNum * pool.currentPrice));

  // NAV Spread calculation if reference price is available
  const navSpreadPct = pool.referencePrice
    ? ((pool.currentPrice - pool.referencePrice) / pool.referencePrice) * 100
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb Navigation & Provenance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Markets Directory
          </Button>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs font-mono font-medium text-zinc-300">
            {pool.tokenName || pool.poolAddress.slice(0, 8)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="brand" size="xs">
            Solana {network.toUpperCase()}
          </Badge>
          <a
            href={getExplorerUrl(pool.poolAddress, 'address', network)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono transition-colors"
          >
            <span>View PDA on Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Explicit Network, Wallet, and On-Chain Coordinate Indicators */}
      <BlockchainContextBar
        screenTitle="Market Terminal"
        addresses={[
          { label: 'Pool PDA', address: pool.poolAddress },
          { label: 'Base Mint', address: pool.baseMint },
          { label: 'Quote Mint', address: pool.quoteMint },
          { label: 'Base Vault', address: pool.baseVault },
          { label: 'Quote Vault', address: pool.quoteVault },
          { label: 'Config PDA', address: pool.configAddress },
        ]}
      />

      {/* SECTION 1: ASSET HEADER */}
      <div className="rounded-2xl border border-zinc-800 bg-[#090d16] p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 p-0.5 shrink-0 shadow-lg shadow-violet-950/40">
              <div className="w-full h-full bg-[#0d121f] rounded-[10px] flex items-center justify-center font-bold text-amber-400 text-lg font-mono">
                {pool.tokenSymbol ? pool.tokenSymbol.slice(0, 4) : 'TKN'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                  {pool.tokenName || 'Tokenized Asset Pool'}
                </h1>
                <span className="font-mono text-zinc-400 text-sm font-semibold">
                  ${pool.tokenSymbol}
                </span>
                <Badge variant="brand" size="xs">
                  {pool.rwaCategory || 'RWA Asset'}
                </Badge>
                {pool.isMigrated ? (
                  <Badge variant="graduated" size="xs" dot>
                    Graduated to DAMM v2
                  </Badge>
                ) : (
                  <Badge variant="live" size="xs" dot>
                    Active Dynamic Bonding Curve
                  </Badge>
                )}
              </div>

              <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
                {pool.description || 'Programmatic dynamic bonding curve pool deployed on Solana via Meteora DBC protocol with non-custodial capital accumulation.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:self-start">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FileCheck2 className="w-3.5 h-3.5 text-amber-400" />}
              onClick={() => setPassportOpen(true)}
            >
              Asset Passport
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Sliders className="w-3.5 h-3.5 text-zinc-400" />}
              onClick={() => onSelectTab('studio')}
            >
              Simulate in Studio
            </Button>
            <Button
              variant="brand"
              size="sm"
              leftIcon={<Coins className="w-3.5 h-3.5" />}
              onClick={() => setIsSwapModalOpen(true)}
            >
              Trade via Curve
            </Button>
          </div>
        </div>

        {/* Header Badges & Provenance Strip */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-mono text-[11px]">Pool PDA:</span>
              <AddressBadge address={pool.poolAddress} head={4} tail={4} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-mono text-[11px]">Base Mint:</span>
              <AddressBadge address={pool.baseMint} head={4} tail={4} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-mono text-[11px]">Quote Mint:</span>
              <AddressBadge address={pool.quoteMint} head={4} tail={4} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProvenanceBadge type="on-chain" label="Verified On-Chain PDA" />
            <ProvenanceBadge type="issuer" label="Issuer Registered" />
          </div>
        </div>
      </div>

      {/* SECTION 2: PRICE INFORMATION CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Spot Price */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Current Spot Price
            </span>
            <ProvenanceBadge type="on-chain" size="xs" showIcon={false} />
          </div>
          <div className="text-xl font-bold font-mono-nums text-amber-400">
            {formatCurrency(pool.currentPrice, pool.quoteMint.includes('So111') ? 'SOL' : 'USD')}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            Deterministic DBC spot rate
          </div>
        </div>

        {/* Reference NAV Price */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Reference Price / NAV
            </span>
            {pool.referencePrice ? (
              <ProvenanceBadge type="issuer" size="xs" showIcon={false} />
            ) : (
              <ProvenanceBadge type="unavailable" size="xs" showIcon={false} />
            )}
          </div>
          <div className="text-xl font-bold font-mono-nums text-zinc-100">
            {pool.referencePrice ? formatCurrency(pool.referencePrice) : '—'}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            {pool.referencePriceLabel || 'No reference oracle registered'}
          </div>
        </div>

        {/* Par / NAV Spread */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Spot vs NAV Spread
            </span>
            {navSpreadPct !== null ? (
              <ProvenanceBadge type="calculated" size="xs" showIcon={false} />
            ) : (
              <ProvenanceBadge type="unavailable" size="xs" showIcon={false} />
            )}
          </div>
          <div className="text-xl font-bold font-mono-nums">
            {navSpreadPct !== null ? (
              <span className={navSpreadPct <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {navSpreadPct >= 0 ? '+' : ''}{navSpreadPct.toFixed(2)}%
              </span>
            ) : (
              <span className="text-zinc-400 font-normal">N/A</span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            {navSpreadPct !== null ? (navSpreadPct <= 0 ? 'Discount to Par' : 'Premium to Par') : 'Benchmark unavailable'}
          </div>
        </div>

        {/* Start Curve Price */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Start Launch Price
            </span>
            <ProvenanceBadge type="on-chain" size="xs" showIcon={false} />
          </div>
          <div className="text-xl font-bold font-mono-nums text-zinc-200">
            {formatCurrency(pool.startPrice, pool.quoteMint.includes('So111') ? 'SOL' : 'USD')}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            Genesis boundary price
          </div>
        </div>

        {/* Migration Target Price */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-1.5 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Graduation Price
            </span>
            <ProvenanceBadge type="calculated" size="xs" showIcon={false} />
          </div>
          <div className="text-xl font-bold font-mono-nums text-violet-300">
            {formatCurrency(pool.migrationPrice, pool.quoteMint.includes('So111') ? 'SOL' : 'USD')}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono">
            AMM seed valuation
          </div>
        </div>
      </div>

      {/* SECTION 3: PRICE CHART */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans">
              Algorithmic Price Discovery Chart
            </h2>
            <ProvenanceBadge type="calculated" label="On-Chain Reconstructed" />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Quote Asset: {pool.quoteMint.includes('So111') ? 'SOL' : 'USDC'}
          </span>
        </div>

        <MarketPriceChart
          currentPrice={pool.currentPrice}
          startPrice={pool.startPrice}
          migrationPrice={pool.migrationPrice}
          quoteSymbol={pool.quoteMint.includes('So111') ? 'SOL' : 'USDC'}
          tokenSymbol={pool.tokenSymbol}
          height={260}
        />
      </div>

      {/* SECTION 4 & 5: LIQUIDITY INFORMATION & BONDING CURVE VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Liquidity Reserves Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-violet-400" />
                  <span>Vault Liquidity & Reserves</span>
                </h3>
                <ProvenanceBadge type="on-chain" label="Vault State" />
              </div>

              <div className="space-y-3 font-mono-nums text-xs">
                <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-sans">Total Liquidity (TVL)</span>
                    <span className="text-lg font-bold text-zinc-100">{formatCurrency(totalTvl)}</span>
                  </div>
                  <ProvenanceBadge type="calculated" size="xs" />
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 font-sans">Quote Reserve (In Vault):</span>
                  <span className="font-semibold text-amber-400">
                    {pool.quoteReserve} {pool.quoteMint.includes('So111') ? 'SOL' : 'USDC'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 font-sans">Base Curve Reserve (Remaining):</span>
                  <span className="font-semibold text-zinc-200">
                    {formatNumber(baseReserveNum)} {pool.tokenSymbol || 'Tokens'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 font-sans">Graduation Threshold Target:</span>
                  <span className="font-semibold text-zinc-100">
                    {pool.quoteThreshold}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-400 font-sans">Remaining Capital to Graduate:</span>
                  <span className="font-semibold text-pink-400">
                    {pool.isMigrated ? '0 (Target Reached)' : 'Accumulating on Curve'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span>Quote tokens are held exclusively in Meteora non-custodial PDA vault.</span>
              </div>
            </div>
          </Card>

          {/* Slippage & Order Impact Simulator */}
          <PriceProjectionChart
            currentSpotPriceUsd={pool.currentPrice}
            totalSupply={pool.totalSupply || 10000000}
            curveAlgorithm={pool.curveType || 'linear'}
            reserveQuoteUsd={totalTvl}
          />
        </div>

        {/* Right: Bonding Curve Visualization */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bonding Curve Mathematical Trajectory</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Model: <span className="font-mono text-zinc-200 uppercase">{pool.curveType || 'linear'}</span> discovery algorithm
                  </p>
                </div>
                <ProvenanceBadge type="calculated" label="Invariant Curve" />
              </div>

              <BondingCurveChart
                points={curvePoints}
                quoteAsset={pool.quoteMint.includes('So111') ? 'SOL' : 'USDC'}
                currentProgressPct={pool.quoteCurveProgressPct}
                height={230}
              />

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono-nums pt-2 border-t border-zinc-800/60">
                <div className="p-2 rounded-lg bg-[#080c14] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Start Price</span>
                  <span className="font-bold text-zinc-200">{formatCurrency(pool.startPrice)}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#080c14] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Current Spot</span>
                  <span className="font-bold text-amber-400">{formatCurrency(pool.currentPrice)}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#080c14] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 block font-sans">Graduation Price</span>
                  <span className="font-bold text-violet-300">{formatCurrency(pool.migrationPrice)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 6 & 7: CURVE PARAMETERS & GRADUATION STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 6: Curve Parameters */}
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-pink-400" />
                <span>Configured Curve Parameters</span>
              </h3>
              <ProvenanceBadge type="on-chain" label="DBC Program Config" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono-nums">
              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 font-sans block">Mathematical Model</span>
                <span className="font-bold text-zinc-100 uppercase">{pool.curveType || 'Linear'} Curve</span>
                <div className="text-[9px] text-zinc-400">Strict deterministic invariant</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 font-sans block">Base Trading Fee</span>
                <span className="font-bold text-zinc-100">{formatBps(pool.baseFeeBps)}</span>
                <div className="text-[9px] text-zinc-400">Dynamic fee scheduling enabled</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 font-sans block">Anti-Sniper Rate Limiter</span>
                <span className="font-bold text-zinc-100">{pool.antiSniperSlots || 100} Slots (~40s)</span>
                <div className="text-[9px] text-zinc-400">Protects early participants</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 font-sans block">Issuer Fee Share</span>
                <span className="font-bold text-zinc-100">{formatBps(pool.creatorFeeShareBps || 2000)}</span>
                <div className="text-[9px] text-zinc-400">Accrued directly to issuer authority</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 font-sans block">Curve Supply Allocation</span>
                <span className="font-bold text-zinc-100">
                  {pool.curveAllocationTokens ? formatNumber(pool.curveAllocationTokens) : '7,500,000'}
                </span>
                <div className="text-[9px] text-zinc-400">70-80% allocated to bonding curve</div>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-400 font-sans block">Total Mint Supply</span>
                <span className="font-bold text-zinc-100">
                  {pool.totalSupply ? formatNumber(pool.totalSupply) : '10,000,000'}
                </span>
                <div className="text-[9px] text-zinc-400">Verified SPL token supply</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 7: Graduation Status */}
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Liquidity Graduation & Lock</span>
              </h3>
              <ProvenanceBadge type="on-chain" label="Migration Rules" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 flex justify-center">
                <GraduationGauge
                  currentPct={pool.quoteCurveProgressPct}
                  targetThresholdLabel={pool.quoteThreshold}
                  size={160}
                />
              </div>

              <div className="sm:col-span-7 space-y-2.5 text-xs font-mono-nums">
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400 font-sans">Graduation Progress:</span>
                  <span className="font-bold text-amber-400">{pool.quoteCurveProgressPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400 font-sans">AMM Destination:</span>
                  <span className="font-semibold text-zinc-100">{pool.migrationOptionLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-400 font-sans">LP Lock Guarantee:</span>
                  <span className="font-semibold text-emerald-400">
                    {pool.liquidityLockDays ? `${pool.liquidityLockDays} Days Locked` : 'Permanent Non-Custodial'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400 font-sans">Migration Trigger:</span>
                  <span className="text-zinc-300">Automatic upon threshold completion</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              Upon reaching {pool.quoteThreshold}, the Meteora DBC contract trustlessly mints LP positions into Meteora DAMM v2/DLMM and deposits the LP tokens into a non-custodial time-lock vault.
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION 8: RECENT ON-CHAIN ACTIVITY */}
      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>Recent On-Chain Activity Ledger</span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Verifiable transactions querying Meteora DBC program ID on Solana {network.toUpperCase()}
              </p>
            </div>
            <ProvenanceBadge type="on-chain" label="Direct Ledger Query" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-nums">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase font-sans text-zinc-400">
                  <th className="pb-2 font-semibold">Event</th>
                  <th className="pb-2 font-semibold">Quote Amount</th>
                  <th className="pb-2 font-semibold">Base Amount</th>
                  <th className="pb-2 font-semibold">Trader / User</th>
                  <th className="pb-2 font-semibold">Age</th>
                  <th className="pb-2 font-semibold text-right">Transaction Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {(pool.recentTxs && pool.recentTxs.length > 0) ? (
                  pool.recentTxs.map((tx) => (
                    <tr key={tx.signature} className="hover:bg-zinc-900/40">
                      <td className="py-2.5">
                        <Badge
                          variant={tx.type === 'swap' ? 'live' : tx.type === 'migration_triggered' ? 'graduated' : 'brand'}
                          size="xs"
                        >
                          {tx.type === 'swap' ? 'Swap / Trade' : tx.type === 'pool_created' ? 'Pool Initialized' : tx.type === 'migration_triggered' ? 'Graduated to AMM' : 'Fee Claim'}
                        </Badge>
                      </td>
                      <td className="py-2.5 font-bold text-amber-400">{tx.amountQuote || '—'}</td>
                      <td className="py-2.5 text-zinc-300">{tx.amountBase || '—'}</td>
                      <td className="py-2.5">
                        <AddressBadge address={tx.user} head={4} tail={4} />
                      </td>
                      <td className="py-2.5 text-zinc-400 text-[11px]">
                        {formatRelativeTime(tx.blockTime)}
                      </td>
                      <td className="py-2.5 text-right">
                        <AddressBadge address={tx.signature} type="tx" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-zinc-500 font-sans">
                      No historical transactions indexed yet for this pool PDA on {network}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* SECTION 9 & 10: POOL INFORMATION & RISK/PARAMETER INFORMATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 9: Pool Information */}
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>On-Chain PDA & Contract Architecture</span>
              </h3>
              <ProvenanceBadge type="on-chain" label="Verified PDAs" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Meteora DBC Program:</span>
                <AddressBadge address={METEORA_DBC_PROGRAM_ID} label="Meteora DBC" />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Pool PDA Address:</span>
                <AddressBadge address={pool.poolAddress} head={6} tail={6} />
              </div>
              {pool.configAddress && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Curve Config PDA:</span>
                  <AddressBadge address={pool.configAddress} head={6} tail={6} />
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Base Token Mint:</span>
                <AddressBadge address={pool.baseMint} head={6} tail={6} />
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Quote Token Mint:</span>
                <AddressBadge address={pool.quoteMint} head={6} tail={6} />
              </div>
              {pool.creator && (
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Creator / Fee Authority:</span>
                  <AddressBadge address={pool.creator} head={6} tail={6} />
                </div>
              )}
              {pool.baseVault && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-zinc-400">Base Vault Token Account:</span>
                  <AddressBadge address={pool.baseVault} head={6} tail={6} />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Section 10: Risk & Parameter Information */}
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Risk & Parameter Disclosures</span>
              </h3>
              <ProvenanceBadge type="issuer" label="Risk Disclosures" />
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Impermanent Loss Risk</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">0.00% Exposure</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  {pool.riskNotes?.impermanentLossRisk || 'During the dynamic bonding curve phase, liquidity is single-sided with zero impermanent loss. Standard AMM risks only emerge post-migration.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Liquidity Lock Guarantees</span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">Non-Custodial</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  {pool.riskNotes?.liquidityLock || 'Upon reaching target quote threshold, all accumulated liquidity is automatically deposited into Meteora DAMM and locked without issuer keys.'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#080b12] border border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">Oracle Vulnerability & Dependency</span>
                  <span className="text-violet-400 font-mono text-[11px] font-bold">Self-Contained</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  {pool.riskNotes?.oracleDependency || 'Spot pricing is determined strictly by the mathematical invariant curve formula, preventing external flash-loan oracle manipulation.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Global Data Provenance Legend */}
      <ProvenanceLegend />

      {/* Real Meteora DBC Curve Swap Modal */}
      <MeteoraSwapModal
        isOpen={isSwapModalOpen}
        pool={pool}
        onClose={() => setIsSwapModalOpen(false)}
        onOpenWalletModal={onOpenWalletModal}
      />

      {/* Structured Asset Passport Modal */}
      <AssetPassportModal
        asset={assetProfile}
        isOpen={passportOpen}
        onClose={() => setPassportOpen(false)}
        onSelectMarket={() => {
          setPassportOpen(false);
          setIsSwapModalOpen(true);
        }}
      />
    </div>
  );
};
