import React from 'react';
import { 
  Sliders, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Coins, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  Info,
  Percent,
  Layers
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { formatCurrency, formatNumber, formatBps } from '../../utils/format';

interface Step3CurveConfigProps {
  input: CurveStudioConfigInput;
  onChange: (updated: CurveStudioConfigInput) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3CurveConfig: React.FC<Step3CurveConfigProps> = ({
  input,
  onChange,
  onNext,
  onBack,
}) => {
  const totalLpPct =
    input.creatorPermanentLockedLpPct +
    input.creatorUnlockedLpPct +
    input.partnerPermanentLockedLpPct +
    input.partnerUnlockedLpPct;

  const isLpDistributionValid = totalLpPct === 100;

  const curveTokenAllocation = (input.totalSupply * input.curveAllocationPct) / 100;
  const impliedMarketCapAtMigration = input.migrationPriceQuote * input.totalSupply;

  const handleStartPriceChange = (val: number) => {
    const safeVal = Math.max(0.000001, val);
    // Keep migration price proportional or higher
    const deltaRatio = input.migrationPriceQuote / (input.startingPriceQuote || 1);
    const newMigration = safeVal * (deltaRatio > 1 ? deltaRatio : 1.25);
    onChange({
      ...input,
      startingPriceQuote: safeVal,
      migrationPriceQuote: Number(newMigration.toFixed(6)),
    });
  };

  const handleMigrationPriceChange = (val: number) => {
    onChange({
      ...input,
      migrationPriceQuote: Math.max(input.startingPriceQuote * 1.001, val),
    });
  };

  const isConfigValid =
    input.startingPriceQuote > 0 &&
    input.migrationQuoteThreshold > 0 &&
    input.startingFeeBps >= 10 &&
    input.startingFeeBps <= 1000 &&
    input.endingFeeBps <= input.startingFeeBps &&
    isLpDistributionValid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Step 3 — Curve Configuration</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Adjust verified parameters supported by the official Meteora Dynamic Bonding Curve smart contract and SDK.
        </p>
      </div>

      {/* Grid of DBC Parameter Sections */}
      <div className="space-y-5">
        {/* Section 1: Spot Pricing & Graduation Threshold */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-3">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>1. Pricing & Graduation Threshold</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Starting Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Starting Spot Price ({input.quoteSymbol}) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  value={input.startingPriceQuote}
                  onChange={(e) => handleStartPriceChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Genesis price per token. {input.referencePrice ? `Reference NAV is $${input.referencePrice}.` : ''}
              </p>
            </div>

            {/* Migration / Graduation Threshold */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Graduation Reserve Threshold ({input.quoteSymbol}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="100"
                value={input.migrationQuoteThreshold}
                onChange={(e) => onChange({ ...input, migrationQuoteThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-400">Total quote accumulated in vault to trigger DAMM v2 migration.</p>
            </div>

            {/* Migration Target Spot Price */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Migration Spot Price ({input.quoteSymbol})
              </label>
              <input
                type="number"
                step="any"
                min={input.startingPriceQuote}
                value={input.migrationPriceQuote}
                onChange={(e) => handleMigrationPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-400">
                End price at 100% curve completion (+
                {(((input.migrationPriceQuote - input.startingPriceQuote) / input.startingPriceQuote) * 100).toFixed(1)}
                % delta).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Curve Shape & Supply Allocation */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-3">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>2. Curve Shape & Token Supply Allocation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Supply */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Total Asset Token Supply</label>
              <input
                type="number"
                min="1000"
                value={input.totalSupply}
                onChange={(e) => onChange({ ...input, totalSupply: parseInt(e.target.value) || 0 })}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-[11px] text-zinc-400">Total authorized tokens minted by the issuer.</p>
            </div>

            {/* Percentage Supply on Curve */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">Curve Allocation</label>
                <span className="text-xs font-mono font-bold text-amber-400">{input.curveAllocationPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={input.curveAllocationPct}
                onChange={(e) => onChange({ ...input, curveAllocationPct: parseInt(e.target.value) || 75 })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-400">
                {formatNumber(curveTokenAllocation)} tokens allocated to the bonding curve vault.
              </p>
            </div>

            {/* Implied Market Cap at Migration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Implied Valuation at Migration</label>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 font-mono text-sm text-zinc-200">
                {formatCurrency(impliedMarketCapAtMigration, input.quoteSymbol)}
              </div>
              <p className="text-[11px] text-zinc-400">Calculated as: Total Supply × Migration Spot Price.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Fee Architecture (Official Meteora SDK) */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>3. Dynamic Fee Architecture & Scheduler</span>
            </div>
            <span className="text-[11px] text-zinc-400">Supported by Meteora DBC FeeScheduler</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Base Fee Mode */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Fee Scheduler Algorithm</label>
              <select
                value={input.baseFeeMode}
                onChange={(e) => onChange({ ...input, baseFeeMode: e.target.value as any })}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="FeeSchedulerLinear">FeeSchedulerLinear (Smooth linear decay)</option>
                <option value="FeeSchedulerExponential">FeeSchedulerExponential (Accelerated decay)</option>
              </select>
              <p className="text-[11px] text-zinc-400">Governs the mathematical curve of fee reduction over time.</p>
            </div>

            {/* Starting Fee BPS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">Starting Fee (bps)</label>
                <span className="text-xs font-mono font-semibold text-zinc-200">
                  {input.startingFeeBps} bps ({(input.startingFeeBps / 100).toFixed(2)}%)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={input.startingFeeBps}
                onChange={(e) => onChange({ ...input, startingFeeBps: parseInt(e.target.value) || 50 })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-400">Initial trading fee applied at curve genesis.</p>
            </div>

            {/* Ending Fee BPS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">Ending Fee (bps)</label>
                <span className="text-xs font-mono font-semibold text-zinc-200">
                  {input.endingFeeBps} bps ({(input.endingFeeBps / 100).toFixed(2)}%)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max={input.startingFeeBps}
                step="5"
                value={input.endingFeeBps}
                onChange={(e) => onChange({ ...input, endingFeeBps: parseInt(e.target.value) || 25 })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-400">Terminal trading fee post-decay duration.</p>
            </div>

            {/* Scheduler Decay Duration */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Decay Window Duration</label>
              <select
                value={input.feeDecaySeconds}
                onChange={(e) => onChange({ ...input, feeDecaySeconds: parseInt(e.target.value) || 86400 })}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={43200}>12 Hours (Rapid normalization)</option>
                <option value={86400}>24 Hours (1 Day — Standard)</option>
                <option value={172800}>48 Hours (2 Days)</option>
                <option value={604800}>7 Days (Extended curve launch)</option>
              </select>
              <p className="text-[11px] text-zinc-400">Time elapsed before fee reaches the minimum ending BPS.</p>
            </div>

            {/* Creator Trading Fee Share Percentage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">Creator Revenue Share</label>
                <span className="text-xs font-mono font-semibold text-amber-400">
                  {input.creatorTradingFeePercentage}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={input.creatorTradingFeePercentage}
                onChange={(e) => onChange({ ...input, creatorTradingFeePercentage: parseInt(e.target.value) || 20 })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-zinc-400">Percentage of trading fees claimable by the issuer wallet.</p>
            </div>

            {/* Dynamic Volatility Fee Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Dynamic Volatility Surcharge</label>
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ ...input, dynamicFeeEnabled: !input.dynamicFeeEnabled })}
                  className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-2 ${
                    input.dynamicFeeEnabled
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{input.dynamicFeeEnabled ? 'Enabled (Active)' : 'Disabled'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">Dynamically spikes trading fees during rapid price fluctuations.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Liquidity Distribution (Enforced 100% Invariant) */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>4. Post-Graduation Liquidity Distribution</span>
            </div>
            <div
              className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold flex items-center gap-1.5 ${
                isLpDistributionValid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              <span>Total LP: {totalLpPct}%</span>
              <span>{isLpDistributionValid ? '✓ Valid (100%)' : '⚠ Must equal 100%'}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            Governs the ownership and permanent lockup of LP tokens upon DAMM v2 graduation. By default, 100% is locked in Meteora's non-custodial LP locker.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Creator Permanent Locked LP */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">Creator Permanent Locked LP</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {input.creatorPermanentLockedLpPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={input.creatorPermanentLockedLpPct}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChange({
                    ...input,
                    creatorPermanentLockedLpPct: val,
                    creatorUnlockedLpPct: 100 - val - input.partnerPermanentLockedLpPct - input.partnerUnlockedLpPct,
                  });
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400">
                Permanently locked in non-custodial contract. Generates ongoing fee yield without withdrawal risk.
              </p>
            </div>

            {/* Creator Unlocked LP */}
            <div className="space-y-1.5 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">Creator Unlocked Liquid LP</span>
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {input.creatorUnlockedLpPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={input.creatorUnlockedLpPct}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  onChange({
                    ...input,
                    creatorUnlockedLpPct: val,
                    creatorPermanentLockedLpPct: 100 - val - input.partnerPermanentLockedLpPct - input.partnerUnlockedLpPct,
                  });
                }}
                className="w-full accent-zinc-500 cursor-pointer"
              />
              <p className="text-[10px] text-zinc-400">
                Immediately transferable LP position delivered to creator wallet post-graduation.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Relevant Migration Settings */}
        <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-zinc-800/80 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>5. Migration Destination & Protection Settings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Migration Target Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Migration Target Protocol</label>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200">
                MET_DAMM_V2 (Meteora Dynamic AMM v2 with DLMM Bins)
              </div>
              <p className="text-[11px] text-zinc-400">Official Meteora concentrated liquidity engine (DAMM v1 is deprecated).</p>
            </div>

            {/* Migration Fee Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Post-Migration Pool Fee Tier</label>
              <select
                value={input.migrationFeeOptionBps}
                onChange={(e) => onChange({ ...input, migrationFeeOptionBps: parseInt(e.target.value) as any })}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={25}>Fixed 25 bps (0.25% — Institutional Tier)</option>
                <option value={30}>Fixed 30 bps (0.30% — Standard RWA Tier)</option>
                <option value={100}>Fixed 100 bps (1.00% — Growth Tier)</option>
              </select>
              <p className="text-[11px] text-zinc-400">Trading fee charged by the graduated Meteora DAMM v2 pool.</p>
            </div>

            {/* Anti-Sniper Slots */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">Anti-Sniper Rate Limiter</label>
              <select
                value={input.antiSniperSlots}
                onChange={(e) => onChange({ ...input, antiSniperSlots: parseInt(e.target.value) || 100 })}
                className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={50}>50 Slots (~20 Seconds)</option>
                <option value={100}>100 Slots (~40 Seconds)</option>
                <option value={200}>200 Slots (~80 Seconds)</option>
                <option value={500}>500 Slots (~3.5 Minutes)</option>
              </select>
              <p className="text-[11px] text-zinc-400">Dampens MEV sandwich bots during initial trading slots.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </button>

        <button
          type="button"
          disabled={!isConfigValid}
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Review Curve Visualization</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
