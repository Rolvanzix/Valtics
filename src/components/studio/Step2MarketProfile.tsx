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
      <div className="border-b border-[#670CDC]/20 pb-4">
        <h2 className="text-xl font-bold text-[#F7F3FF] tracking-tight">Step 2 — Market Profile Presets</h2>
        <p className="text-xs text-[#B8A9CC] mt-1">
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
                  ? 'bg-[#F99225]/10 border-[#F99225] shadow-md shadow-[#F99225]/10 ring-1 ring-[#F99225]/50'
                  : 'bg-[#140130] border-[#670CDC]/25 hover:border-[#670CDC]/40 hover:bg-[#18013A]'
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
                        ? 'bg-[#670CDC]/20 text-[#EDE4FA] border border-[#670CDC]/40'
                        : 'bg-[#D11CA5]/20 text-[#F7F3FF] border border-[#D11CA5]/40'
                    }`}
                  >
                    {profile.name}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                      isSelected
                        ? 'bg-[#F99225] text-[#09011B] font-bold'
                        : 'border border-[#670CDC]/30 text-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-base font-bold text-[#F7F3FF]">{profile.name} Profile</h3>
                  <p className="text-xs text-[#B8A9CC] mt-1 leading-relaxed">{profile.tagline}</p>
                </div>

                {/* Core Telemetry Specs */}
                <div className="grid grid-cols-2 gap-2 bg-[#100126] border border-[#670CDC]/20 rounded-lg p-3 font-mono-nums text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">Curve Delta</span>
                    <span className="font-bold text-[#EDE4FA]">+{profile.curveDeltaPct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">Target Threshold</span>
                    <span className="font-bold text-[#F99225]">
                      {formatCurrency(profile.defaultThresholdQuote, quoteSymbol)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">Base Fee Schedule</span>
                    <span className="text-[#EDE4FA] font-medium">
                      {profile.startingFeeBps} → {profile.endingFeeBps} bps
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-sans text-[#7E6D96] block">LP Lock</span>
                    <span className="text-emerald-400 font-medium">100% Permanent</span>
                  </div>
                </div>

                {/* Recommended Asset Types */}
                <div>
                  <span className="text-[11px] text-[#B8A9CC] block mb-1">Recommended Asset Classes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.recommendedAssetTypes.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#1E0148] text-[#EDE4FA] border border-[#670CDC]/25"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Economic Rationales */}
              <div className="pt-4 mt-4 border-t border-[#670CDC]/20 space-y-1.5">
                <span className="text-[10px] uppercase font-sans text-[#B8A9CC] font-semibold block">
                  What this profile changes:
                </span>
                <ul className="space-y-1 text-[11px] text-[#EDE4FA]">
                  {profile.economicRationales.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#F99225] shrink-0">•</span>
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
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3FF]">
          <Sliders className="w-4 h-4 text-[#F99225]" />
          <span>Active Preset Breakdown: {activePreset.name}</span>
        </div>
        <p className="text-xs text-[#EDE4FA] leading-relaxed">
          {activePreset.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-[#100126] border border-[#670CDC]/20 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-[#7E6D96] uppercase font-semibold block">1. Mathematical Slope</span>
            <p className="text-[#EDE4FA] text-[11px]">
              Sets curve starting vs migration price ratio at <strong>+{activePreset.curveDeltaPct}%</strong> to control secondary price discovery corridor.
            </p>
          </div>
          <div className="bg-[#100126] border border-[#670CDC]/20 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-[#7E6D96] uppercase font-semibold block">2. Fee Decay Invariant</span>
            <p className="text-[#EDE4FA] text-[11px]">
              Configures initial <strong>{activePreset.startingFeeBps} bps</strong> decaying linearly to <strong>{activePreset.endingFeeBps} bps</strong> over {activePreset.feeDecaySeconds / 3600} hours.
            </p>
          </div>
          <div className="bg-[#100126] border border-[#670CDC]/20 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-[#7E6D96] uppercase font-semibold block">3. Graduation Liquidity</span>
            <p className="text-[#EDE4FA] text-[11px]">
              Upon collecting <strong>{formatCurrency(activePreset.defaultThresholdQuote, quoteSymbol)}</strong>, 100% of accumulated quote and remaining tokens migrate to Meteora DAMM v2.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#670CDC]/20">
        <button
          type="button"
          onClick={onBack}
          className="py-2.5 px-4 rounded-lg bg-[#1C0142] hover:bg-[#26035A] border border-[#670CDC]/30 text-[#EDE4FA] font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="py-2.5 px-6 rounded-lg bg-[#F99225] hover:bg-[#FFA33D] text-[#09011B] font-bold text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-[#F99225]/20"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
