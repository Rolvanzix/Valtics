import React from 'react';
import { 
  Milestone, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  Layers, 
  Clock 
} from 'lucide-react';
import { DBCPoolState } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import { Badge } from '../ui/Badge';

interface GraduationMeterProps {
  pool: DBCPoolState;
  onSimulateQuoteDeposit?: () => void;
  onTriggerMigrationPreflight?: () => void;
}

export const GraduationMeter: React.FC<GraduationMeterProps> = ({
  pool,
  onSimulateQuoteDeposit,
  onTriggerMigrationPreflight,
}) => {
  const isMigrated = pool.isMigrated;
  const progressPct = Math.min(100, Math.max(0, pool.quoteCurveProgressPct || 0));
  const isThresholdMet = progressPct >= 100 && !isMigrated;

  // Derive quote unit
  const quoteUnit = pool.quoteMint.includes('So111111111') ? 'SOL' : 'USDC';

  // Parse reserves & thresholds
  const rawQuote = parseFloat((pool.quoteReserve || '0').replace(/[^0-9.]/g, '')) || 0;
  const rawThreshold = parseFloat((pool.quoteThreshold || '100').replace(/[^0-9.]/g, '')) || 100;
  const quoteRemaining = Math.max(0, rawThreshold - rawQuote);

  let statusLabel = 'Active Curve · Accumulating Liquidity';
  let statusVariant: 'live' | 'graduated' | 'warning' | 'neutral' = 'live';

  if (isMigrated) {
    statusLabel = `Graduated to ${pool.migrationOptionLabel || 'Meteora DLMM'}`;
    statusVariant = 'graduated';
  } else if (isThresholdMet) {
    statusLabel = 'Threshold Reached · Ready for AMM Migration';
    statusVariant = 'warning';
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0c1018] p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Milestone className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 font-sans tracking-tight">
              Meteora Liquidity Graduation Tracker
            </h3>
            <Badge variant={statusVariant} size="xs" dot>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 font-normal">
            Autonomous migration of accumulated bonding curve liquidity into permanent AMM pool
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400">Target Destination:</span>
          <span className="px-2 py-0.5 rounded-md bg-violet-950/40 border border-violet-800/40 text-violet-300 font-mono text-[11px] font-semibold">
            {pool.migrationOptionLabel || 'MET_DAMM_V2'}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar Component */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-sans">
            <span>Graduation Progress</span>
            <span className="font-mono text-amber-400 font-bold text-sm">
              {formatPercent(progressPct, 1)}
            </span>
          </span>
          <span className="font-mono text-zinc-400 text-[11px]">
            {rawQuote.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {rawThreshold.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quoteUnit}
          </span>
        </div>

        {/* Progress Track */}
        <div className="relative h-4 w-full rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
              isMigrated
                ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400'
                : isThresholdMet
                ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-300 animate-pulse'
                : 'bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500'
            }`}
            style={{ width: `${Math.max(2, progressPct)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>

          {/* 100% Milestone Marker */}
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        </div>

        {/* Progress Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
              Current Progress
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-zinc-100 font-mono">
                {rawQuote.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-mono text-zinc-400">{quoteUnit}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
              {pool.tvlUsd ? `~${formatCurrency(pool.tvlUsd)} TVL` : 'Bonding curve reserves'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
              Configured Threshold
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold text-zinc-100 font-mono">
                {rawThreshold.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-mono text-zinc-400">{quoteUnit}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
              Required for migration trigger
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0e1422] border border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
              Remaining to Threshold
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-bold font-mono text-amber-400">
                {isMigrated ? '0.00' : quoteRemaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-mono text-zinc-400">{quoteUnit}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
              {isMigrated ? 'Migration completed' : `${formatPercent(100 - progressPct, 1)} needed`}
            </span>
          </div>
        </div>
      </div>

      {/* MANDATORY COMPLIANCE & PROTOCOL ARCHITECTURE NOTICE */}
      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs flex items-start gap-3">
        <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-zinc-300">
          <span className="font-semibold text-amber-300 text-xs block font-sans">
            Protocol Invariant: Threshold-Triggered Migration
          </span>
          <p className="text-[11px] leading-relaxed text-zinc-300">
            Graduation to Meteora DLMM is strictly threshold-triggered by cumulative on-chain quote volume. In adherence with decentralized bonding curve mechanics, graduation cannot and will not happen at an exact future calendar time; migration activates automatically once the {rawThreshold.toLocaleString()} {quoteUnit} threshold is satisfied on-chain.
          </p>
        </div>
      </div>

      {/* Graduation Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
          <span>Permanent Liquidity Lock: {pool.liquidityLockDays ? `${pool.liquidityLockDays} Days` : 'Permanent Locked in Meteora Vault'}</span>
        </div>

        {isThresholdMet && onTriggerMigrationPreflight && (
          <button
            type="button"
            onClick={onTriggerMigrationPreflight}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Execute AMM Migration Pre-flight</span>
          </button>
        )}
      </div>
    </div>
  );
};
