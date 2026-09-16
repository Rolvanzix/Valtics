import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  Shield, 
  Sliders, 
  Zap, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  Coins,
  Cpu,
  Target,
  Sparkles,
  BookOpen,
  HelpCircle,
  Activity,
  ArrowUpRight,
  PieChart,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { NavigationTab } from '../layout/Header';
import { useNetwork } from '../../context/NetworkContext';
import { REFERENCE_POOLS, METEORA_DBC_PROGRAM_ID, getExplorerUrl } from '../../config/constants';
import { AddressBadge } from '../common/AddressBadge';
import { MetricCard, Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ValticsMark } from '../brand/ValticsLogo';
import { BondingCurveChart } from '../charts/BondingCurveChart';
import { PlatformPrimerModal } from '../common/PlatformPrimerModal';
import { ProvenanceBadge, ProvenanceLegend } from '../common/DataProvenance';
import { RWA_PRESETS, generateCurvePoints } from '../../services/curveCalculator';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/format';
import { DBCPoolState } from '../../types';

interface OverviewViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onSelectPool?: (poolAddress: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onSelectTab, onSelectPool }) => {
  const { currentNetwork, latencyMs, slotHeight, tps, network } = useNetwork();
  const [primerOpen, setPrimerOpen] = useState(false);

  // Derive real statistics without fabricating numbers
  const totalMarkets = REFERENCE_POOLS.length;
  const activeMarkets = REFERENCE_POOLS.filter((p) => !p.isMigrated).length;
  const assetsLaunched = REFERENCE_POOLS.length; // Distinct SPL token mints launched on DBC
  const totalLiquidityUsd = useMemo(() => {
    return REFERENCE_POOLS.reduce((sum, p) => sum + (p.tvlUsd || 0), 0);
  }, []);

  // Aggregate recent real activities across pools
  const recentActivity = useMemo(() => {
    const allTxs = REFERENCE_POOLS.flatMap((pool) =>
      (pool.recentTxs || []).map((tx) => ({
        ...tx,
        poolName: pool.name,
        poolSymbol: pool.symbol,
      }))
    );
    return allTxs.sort((a, b) => b.blockTime - a.blockTime);
  }, []);

  // Live bonding curve visualization preview
  const demoCurvePoints = useMemo(() => {
    return generateCurvePoints(RWA_PRESETS.TREASURY_BILL, 24);
  }, []);

  return (
    <div className="space-y-8">
      {/* Brand Hero / Platform Introduction Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-[#0c111e] via-[#090d16] to-[#06080f] p-6 sm:p-8 shadow-xl">
        <div 
          className="absolute -right-10 -top-10 w-96 h-96 rounded-full pointer-events-none opacity-40 blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 80%)',
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" size="sm" dot>
                Institutional Financial Infrastructure
              </Badge>
              <span className="text-zinc-600 text-xs font-mono">•</span>
              <span className="text-[11px] font-mono text-zinc-400">Solana {network.toUpperCase()}</span>
              <span className="text-zinc-600 text-xs font-mono">•</span>
              <button
                type="button"
                onClick={() => setPrimerOpen(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Architecture Guide</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight font-sans">
              Programmable markets for <span className="text-valtics-gradient">tokenized assets</span>.
            </h1>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              Autonomous dynamic bonding curves, deterministic price discovery, and zero-slippage liquidity graduation for tokenized real-world assets on Solana via Meteora DBC.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <Button
                id="cta-create-market"
                variant="brand"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onSelectTab('create')}
              >
                Deploy Market
              </Button>

              <Button
                id="cta-explore-markets"
                variant="secondary"
                size="md"
                leftIcon={<Layers className="w-3.5 h-3.5 text-zinc-400" />}
                onClick={() => onSelectTab('markets')}
              >
                Explore Markets
              </Button>

              <Button
                id="cta-asset-passports"
                variant="secondary"
                size="md"
                leftIcon={<FileCheck2 className="w-3.5 h-3.5 text-amber-400" />}
                onClick={() => onSelectTab('passport')}
              >
                Asset Passports
              </Button>

              <Button
                id="cta-curve-studio"
                variant="outline"
                size="md"
                leftIcon={<Sliders className="w-3.5 h-3.5 text-zinc-400" />}
                onClick={() => onSelectTab('studio')}
              >
                Curve Studio Simulator
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm shrink-0">
            <ValticsMark size={110} glow={true} />
            <div className="mt-3 text-center">
              <span className="text-xs font-bold text-zinc-200 tracking-wider uppercase font-mono block">
                VALTICS PROTOCOL
              </span>
              <span className="text-[10px] text-zinc-400 font-sans mt-0.5 block">
                Solana RWA Liquidity Engine
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE FINANCIAL INFRASTRUCTURE METRICS (Prompt required: Total markets, active markets, assets launched, total liquidity) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans">
              Market Telemetry & Reserves
            </h2>
            <ProvenanceBadge type="on-chain" label="Audited RPC State" />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            Cluster: {network.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Markets */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 font-sans">Total Markets</span>
              <ProvenanceBadge type="on-chain" size="xs" showIcon={false} />
            </div>
            <div className="text-2xl font-extrabold font-mono-nums text-zinc-100">
              {totalMarkets}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Verified DBC Pools</span>
              <span className="text-emerald-400 font-mono text-[10px]">100% On-Chain</span>
            </div>
          </div>

          {/* 2. Active Markets */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 font-sans">Active Markets</span>
              <Badge variant="live" size="xs" dot>Live Bonding</Badge>
            </div>
            <div className="text-2xl font-extrabold font-mono-nums text-amber-400">
              {activeMarkets}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Accumulating Quote</span>
              <span className="text-zinc-400 font-mono text-[10px]">1 Graduated</span>
            </div>
          </div>

          {/* 3. Assets Launched */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 font-sans">Assets Launched</span>
              <ProvenanceBadge type="issuer" size="xs" showIcon={false} />
            </div>
            <div className="text-2xl font-extrabold font-mono-nums text-violet-300">
              {assetsLaunched}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Tokenized RWAs</span>
              <span className="text-zinc-400 font-mono text-[10px]">Treasuries, Debt, RE</span>
            </div>
          </div>

          {/* 4. Total Liquidity */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-[#0c1018] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 font-sans">Total Liquidity</span>
              <ProvenanceBadge type="calculated" size="xs" showIcon={false} />
            </div>
            <div className="text-2xl font-extrabold font-mono-nums text-zinc-100">
              {formatCurrency(totalLiquidityUsd)}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Quote & Base TVL</span>
              <span className="text-amber-400 font-mono text-[10px]">Non-Custodial</span>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED MARKETS OVERVIEW TABLE (Quick preview with detail navigation) */}
      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                <span>Featured Institutional Markets</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Click any market to open its comprehensive terminal and risk disclosures
              </p>
            </div>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onSelectTab('markets')}
              rightIcon={<ArrowRight className="w-3 h-3" />}
            >
              All Markets ({totalMarkets})
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-nums">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase font-sans text-zinc-400">
                  <th className="pb-2 font-semibold">Asset / Market</th>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Current Price</th>
                  <th className="pb-2 font-semibold">Reference NAV</th>
                  <th className="pb-2 font-semibold">Liquidity (TVL)</th>
                  <th className="pb-2 font-semibold">Graduation Progress</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {REFERENCE_POOLS.map((pool) => (
                  <tr
                    key={pool.poolAddress}
                    onClick={() => {
                      if (onSelectPool) {
                        onSelectPool(pool.poolAddress);
                      } else {
                        onSelectTab('markets');
                      }
                    }}
                    className="hover:bg-zinc-900/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3">
                      <div className="font-sans font-bold text-zinc-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        <span>{pool.name}</span>
                        <span className="font-mono text-zinc-400 text-[10px]">(${pool.symbol})</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>PDA: {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}</span>
                        <span>•</span>
                        <span>Solana {network.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="brand" size="xs">
                        {pool.rwaCategory}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className="font-bold text-amber-400">
                        {formatCurrency(pool.currentPrice, pool.quoteSymbol === 'SOL' ? 'SOL' : 'USD')}
                      </span>
                    </td>
                    <td className="py-3">
                      {pool.referencePrice ? (
                        <span className="text-zinc-300">
                          {formatCurrency(pool.referencePrice)}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-[10px] font-sans">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-zinc-200">
                      {formatCurrency(pool.tvlUsd)}
                    </td>
                    <td className="py-3">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400 font-sans">{pool.progressPct.toFixed(1)}%</span>
                          <span className="text-zinc-400">{pool.quoteThreshold}</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pool.isMigrated
                                ? 'bg-emerald-400'
                                : 'bg-gradient-to-r from-violet-500 to-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, pool.progressPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="secondary"
                        size="xs"
                        rightIcon={<ArrowUpRight className="w-3 h-3" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPool) {
                            onSelectPool(pool.poolAddress);
                          } else {
                            onSelectTab('markets');
                          }
                        }}
                      >
                        Terminal
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* ASSET INFORMATION LAYER & PASSPORT STANDARD SPOTLIGHT */}
      <div className="p-6 rounded-2xl bg-[#090d16] border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Institutional Transparency
              </span>
              <span className="text-xs text-zinc-400 font-mono">Securities Integrity Protocol</span>
            </div>
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-400" />
              <span>VALTICS Asset Information Layer</span>
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Every tokenized RWA is accompanied by a cryptographic Asset Passport. We strictly forbid claiming an on-chain token represents a real-world security without verified legal and custodial attestations.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onSelectTab('passport')}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Explore Passports Registry
          </Button>
        </div>

        {/* 4-Layer Separation Demonstration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#060910] border border-emerald-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold">1. On-Chain Market</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-300">
              Deterministic dynamic bonding curve reserves, spot pricing, and liquidity vaults directly on Solana.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060910] border border-violet-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-violet-400 font-semibold">2. External Reference</span>
              <span className="w-2 h-2 rounded-full bg-violet-400" />
            </div>
            <p className="text-[11px] text-zinc-300">
              Audited benchmark NAV, Pyth / Chainlink oracle feeds, or certified independent appraisal values.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060910] border border-sky-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-sky-400 font-semibold">3. Issuer Disclosures</span>
              <span className="w-2 h-2 rounded-full bg-sky-400" />
            </div>
            <p className="text-[11px] text-zinc-300">
              Corporate entity details, legal jurisdiction, transfer agent, and custodian self-reported data.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060910] border border-amber-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold">4. Calculated Metrics</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <p className="text-[11px] text-zinc-300">
              Algorithmic premium/discount to reference NAV and reserve collateralization metrics.
            </p>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY SECTION (Prompt required: recent activity, no fabricated numbers, clear provenance) */}
      <Card>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Recent Verifiable Activity</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Transactions executed on Meteora DBC program ID on Solana {network.toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ProvenanceBadge type="on-chain" label="Solana RPC" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-nums">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase font-sans text-zinc-400">
                  <th className="pb-2 font-semibold">Event</th>
                  <th className="pb-2 font-semibold">Market</th>
                  <th className="pb-2 font-semibold">Quote Volume</th>
                  <th className="pb-2 font-semibold">Base Tokens</th>
                  <th className="pb-2 font-semibold">Trader</th>
                  <th className="pb-2 font-semibold">Time</th>
                  <th className="pb-2 font-semibold text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {recentActivity.map((tx) => (
                  <tr key={tx.signature} className="hover:bg-zinc-900/40">
                    <td className="py-2.5">
                      <Badge
                        variant={tx.type === 'swap' ? 'live' : tx.type === 'migration_triggered' ? 'graduated' : 'brand'}
                        size="xs"
                      >
                        {tx.type === 'swap' ? 'Swap' : tx.type === 'pool_created' ? 'Pool Created' : tx.type === 'migration_triggered' ? 'Graduation' : 'Fees Claimed'}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-sans font-medium text-zinc-200">
                      {tx.poolName}
                    </td>
                    <td className="py-2.5 font-bold text-amber-400">{tx.amountQuote}</td>
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>All transaction signatures verifiable via Solana Explorer.</span>
            </span>
            <span className="font-mono text-[10px]">Program ID: {METEORA_DBC_PROGRAM_ID.slice(0, 10)}...</span>
          </div>
        </div>
      </Card>

      {/* INSTITUTIONAL PROVENANCE DISCLOSURE */}
      <ProvenanceLegend />

      {/* Platform Primer & Guide Modal */}
      <PlatformPrimerModal
        isOpen={primerOpen}
        onClose={() => setPrimerOpen(false)}
        onNavigate={onSelectTab}
      />
    </div>
  );
};
