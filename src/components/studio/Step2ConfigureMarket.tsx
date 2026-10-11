import React, { useState } from 'react';
import { 
  Sliders, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Coins, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  Check, 
  Percent, 
  Layers,
  AlertTriangle
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { 
  MARKET_PROFILES, 
  MarketProfileKey, 
  applyProfilePresetToInput 
} from '../../config/marketProfiles';
import { formatCurrency, formatNumber, formatBps } from '../../utils/format';

interface Step2ConfigureMarketProps {
  input: CurveStudioConfigInput;
  onChange: (updated: CurveStudioConfigInput) => void;
  selectedProfile: MarketProfileKey;
  onSelectProfile: (key: MarketProfileKey) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2ConfigureMarket: React.FC<Step2ConfigureMarketProps> = ({
  input,
  onChange,
  selectedProfile,
  onSelectProfile,
  onNext,
  onBack,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleProfileClick = (key: MarketProfileKey) => {
    onSelectProfile(key);
    const updated = applyProfilePresetToInput(input, key, input.referencePrice || 1.0);
    onChange(updated);
  };

  const handleStartPriceChange = (val: number) => {
    const safeVal = Math.max(0.000001, val);
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

  const curveTokenAllocation = (input.totalSupply * input.curveAllocationPct) / 100;
  const impliedMarketCapAtMigration = input.migrationPriceQuote * input.totalSupply;

  return (
    <div className="space-y-6">
      {/* Contextual Header */}
      <div className="border-b border-[#670CDC]/20 pb-4">
        <h2 className="text-xl font-bold text-[#F7F3FF] tracking-tight font-sans">
          Market Configuration
        </h2>
        <p className="text-xs text-[#B8A9CC] mt-1">
          Configure bonding curve parameters, pricing corridor, and trading fees.
        </p>
      </div>

      {/* 1. Market Profile Presets */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#B8A9CC] uppercase tracking-wider block font-sans">
          Market Profile Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(MARKET_PROFILES) as MarketProfileKey[]).map((key) => {
            const profile = MARKET_PROFILES[key];
            const isSelected = selectedProfile === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleProfileClick(key)}
                className={`p-4 rounded-xl text-left transition-all border cursor-pointer relative shadow-md shadow-[#09011B]/60 ${
                  isSelected
                    ? 'bg-[#1C0142] border-[#670CDC] text-[#F7F3FF] shadow-sm shadow-[#670CDC]/20'
                    : 'bg-[#140130] border-[#670CDC]/25 text-[#B8A9CC] hover:border-[#670CDC]/50 hover:text-[#EDE4FA]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#F99225] text-[#09011B] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
                <div className="font-bold text-sm text-[#F7F3FF] font-sans">{profile.name}</div>
                <div className="text-[11px] text-[#B8A9CC] mt-1 line-clamp-2 leading-relaxed">
                  {profile.description}
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#670CDC]/20 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#7E6D96]">Base fee</span>
                  <span className="text-[#EDE4FA]">{formatBps(profile.startingFeeBps)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Curve Pricing Parameters */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-5">
        <h3 className="text-xs font-bold text-[#F7F3FF] uppercase tracking-wider font-sans flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#F99225]" />
          <span>Pricing & Graduation Target</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#B8A9CC] font-medium">Starting Price ({input.quoteSymbol})</label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                value={input.startingPriceQuote}
                onChange={(e) => handleStartPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#F7F3FF] focus:outline-hidden focus:border-[#670CDC]"
              />
              <span className="absolute right-3 top-2 text-[10px] font-mono text-[#7E6D96]">
                {input.quoteSymbol}
              </span>
            </div>
            <p className="text-[10px] text-[#7E6D96]">Initial price on the bonding curve.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#B8A9CC] font-medium">Migration Target Price ({input.quoteSymbol})</label>
            <div className="relative">
              <input
                type="number"
                step="0.000001"
                min={input.startingPriceQuote}
                value={input.migrationPriceQuote}
                onChange={(e) => handleMigrationPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#F7F3FF] focus:outline-hidden focus:border-[#670CDC]"
              />
              <span className="absolute right-3 top-2 text-[10px] font-mono text-[#7E6D96]">
                {input.quoteSymbol}
              </span>
            </div>
            <p className="text-[10px] text-[#7E6D96]">Price when pool graduates to DAMM v2.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#B8A9CC] font-medium">Graduation Target ({input.quoteSymbol})</label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="100"
                value={input.migrationQuoteThreshold}
                onChange={(e) => onChange({ ...input, migrationQuoteThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#F7F3FF] focus:outline-hidden focus:border-[#670CDC]"
              />
              <span className="absolute right-3 top-2 text-[10px] font-mono text-[#7E6D96]">
                {input.quoteSymbol}
              </span>
            </div>
            <p className="text-[10px] text-[#7E6D96]">Quote reserve required to graduate.</p>
          </div>
        </div>

        {/* Financial Specification Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#670CDC]/20">
          <div className="p-2.5 rounded-lg bg-[#100126] border border-[#670CDC]/20">
            <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Starting Market Cap</span>
            <span className="text-xs font-mono font-semibold text-[#EDE4FA]">
              {formatCurrency(input.startingPriceQuote * input.totalSupply, input.quoteSymbol)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#100126] border border-[#670CDC]/20">
            <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Graduation Market Cap</span>
            <span className="text-xs font-mono font-semibold text-[#F99225]">
              {formatCurrency(impliedMarketCapAtMigration, input.quoteSymbol)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#100126] border border-[#670CDC]/20">
            <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Curve Token Allocation</span>
            <span className="text-xs font-mono font-semibold text-[#EDE4FA]">
              {formatNumber(curveTokenAllocation, 0)} ({input.curveAllocationPct}%)
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#100126] border border-[#670CDC]/20">
            <span className="text-[10px] uppercase font-mono text-[#7E6D96] block">Base Fee Tier</span>
            <span className="text-xs font-mono font-semibold text-emerald-400">
              {formatBps(input.startingFeeBps)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Fee & Liquidity Protection Controls */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#F7F3FF] uppercase tracking-wider font-sans flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Liquidity Lock & Protocol Protection</span>
          </h3>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[#F99225] hover:text-[#ff9f3b] font-medium cursor-pointer"
          >
            {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#B8A9CC] font-medium">Post-Graduation LP Lock</label>
            <select
              value={input.creatorPermanentLockedLpPct === 100 ? 'permanent' : 'unlocked'}
              onChange={(e) => {
                if (e.target.value === 'permanent') {
                  onChange({
                    ...input,
                    creatorPermanentLockedLpPct: 100,
                    creatorUnlockedLpPct: 0,
                  });
                } else {
                  onChange({
                    ...input,
                    creatorPermanentLockedLpPct: 0,
                    creatorUnlockedLpPct: 100,
                  });
                }
              }}
              className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs text-[#F7F3FF] focus:outline-hidden focus:border-[#670CDC]"
            >
              <option value="permanent">100% Permanent LP Lock (Recommended)</option>
              <option value="unlocked">Issuer Unlocked LP</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#B8A9CC] font-medium">Dynamic Volatility Fee</label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="dynFee"
                checked={input.dynamicFeeEnabled}
                onChange={(e) => onChange({ ...input, dynamicFeeEnabled: e.target.checked })}
                className="rounded border-[#670CDC]/40 text-[#670CDC] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="dynFee" className="text-xs text-[#EDE4FA] cursor-pointer">
                Enable Meteora Dynamic Fee Engine
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[#B8A9CC] font-medium">Anti-Sniper Protection</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={input.antiSniperSlots}
                onChange={(e) => onChange({ ...input, antiSniperSlots: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#F7F3FF] focus:outline-hidden focus:border-[#670CDC]"
              />
              <span className="text-[10px] text-[#7E6D96] shrink-0 font-mono">slots (~{((input.antiSniperSlots * 400) / 1000).toFixed(1)}s)</span>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <div className="pt-3 border-t border-[#670CDC]/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-[#B8A9CC] font-medium">Fee Decay Model</label>
              <select
                value={input.baseFeeMode}
                onChange={(e) => onChange({ ...input, baseFeeMode: e.target.value as any })}
                className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs text-[#F7F3FF]"
              >
                <option value="FeeSchedulerLinear">Linear Fee Decay</option>
                <option value="FeeSchedulerExponential">Exponential Fee Decay</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[#B8A9CC] font-medium">Creator Fee Share</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={input.creatorTradingFeePercentage}
                  onChange={(e) => onChange({ ...input, creatorTradingFeePercentage: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-[#0C001C] border border-[#670CDC]/30 rounded-lg px-3 py-2 text-xs font-mono text-[#F7F3FF]"
                />
                <span className="absolute right-3 top-2 text-[10px] text-[#7E6D96]">% of trading fees</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-5 py-2 rounded-lg bg-[#1E0148] hover:bg-[#280261] text-[#EDE4FA] text-xs font-medium cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-[#670CDC]/30"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[44px] px-6 py-2 rounded-lg bg-[#F99225] hover:bg-[#FFA742] text-[#09011B] text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-[#F99225]/20 active:scale-[0.99]"
        >
          <span>Next: Review</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
