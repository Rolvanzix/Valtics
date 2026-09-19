import React from 'react';
import { 
  Shield, 
  TrendingUp, 
  Scale, 
  AlertTriangle, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Info,
  Sliders
} from 'lucide-react';
import { 
  MARKET_PROFILES, 
  MarketProfileKey, 
  MarketProfilePreset, 
  NON_FINANCIAL_ADVICE_DISCLAIMER 
} from '../../config/marketProfiles';
import { formatCurrency, formatBps, formatPercent } from '../../utils/format';

interface Step2MarketProfileProps {
  selectedProfile: MarketProfileKey;
  onSelectProfile: (key: MarketProfileKey) => void;
  onNext: () => void;
  onBack: () => void;
  quoteSymbol: 'USDC' | 'SOL';
}

export const Step2MarketProfile: React.FC<Step2MarketProfileProps> = ({
  selectedProfile,
  onSelectProfile,
  onNext,
  onBack,
  quoteSymbol,
}) => {
  const activePreset = MARKET_PROFILES[selectedProfile];

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-zinc-800/80 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Step 2 — Market Profile Presets</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Select an institutional market profile to pre-configure curve steepness, fee schedules, and graduation thresholds. You can fine-tune every parameter in Step 3.
        </p>
      </div>

      {/* Mandatory Non-Financial Advice Disclaimer Banner */}
      <div className="bg-amber-950/20 border border-amber-900/50 rounded-xl p-4 text-xs text-amber-200/90 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-300 block text-xs uppercase tracking-wide">
            Institutional Notice: Non-Financial & Non-Investment Presets
          </span>
          <p className="text-[11px] leading-relaxed text-amber-200/80">
            {NON_FINANCIAL_ADVICE_DISCLAIMER}
          </p>
        </div>
      </div>

      {/* 3 Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(Object.keys(MARKET_PROFILES) as MarketProfileKey[]).map((key) => {
          const profile = MARKET_PROFILES[key];
          const isSelected = selectedProfile === key;

          return (
            <div
              key={key}
              onClick={() => onSelectProfile(key)}
              className={`rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-[#0c101a] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
              }`}
            >
              <div className="space-y-3">
                {/* Badge & Selection Check */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] uppercase font-sans font-semibold tracking-wider px-2 py-0.5 rounded ${
                      key === 'conservative'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : key === 'balanced'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {profile.name}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'border border-zinc-700 text-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-base font-bold text-white">{profile.name} Profile</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{profile.tagline}</p>
                </div>

                {/* Core Telemetry Specs */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3 font-mono-nums text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-sans text-zinc-400 block">Curve Delta</span>
                    <span className="font-bold text-zinc-200">+{profile.curveDeltaPct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-zinc-400 block">Target Threshold</span>
                    <span className="font-bold text-amber-400">
                      {formatCurrency(profile.defaultThresholdQuote, quoteSymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-zinc-400 block">Base Fee Schedule</span>
                    <span className="text-zinc-200 font-medium">
                      {profile.startingFeeBps} → {profile.endingFeeBps} bps
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-zinc-400 block">LP Lock</span>
                    <span className="text-emerald-400 font-medium">100% Permanent</span>
                  </div>
                </div>

                {/* Recommended Asset Types */}
                <div>
                  <span className="text-[11px] text-zinc-400 block mb-1">Recommended Asset Classes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.recommendedAssetTypes.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-sans px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Economic Rationales */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-sans text-zinc-400 font-semibold block">
                  What this profile changes:
                </span>
                <ul className="space-y-1 text-[11px] text-zinc-300">
                  {profile.economicRationales.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 shrink-0">•</span>
                      <span className="leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Explanation of What Each Profile Changes */}
      <div className="bg-[#0c101a] border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Active Preset Breakdown: {activePreset.name}</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {activePreset.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">1. Mathematical Slope</span>
            <p className="text-zinc-300 text-[11px]">
              Sets curve starting vs migration price ratio at <strong>+{activePreset.curveDeltaPct}%</strong> to control secondary price discovery corridor.
            </p>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">2. Fee Decay Invariant</span>
            <p className="text-zinc-300 text-[11px]">
              Configures initial <strong>{activePreset.startingFeeBps} bps</strong> decaying linearly to <strong>{activePreset.endingFeeBps} bps</strong> over {activePreset.feeDecaySeconds / 3600} hours.
            </p>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">3. Graduation Liquidity</span>
            <p className="text-zinc-300 text-[11px]">
              Upon collecting <strong>{formatCurrency(activePreset.defaultThresholdQuote, quoteSymbol)}</strong>, 100% of accumulated quote and remaining tokens migrate to Meteora DAMM v2.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs shadow-amber-500/20"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
