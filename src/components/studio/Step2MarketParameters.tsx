import React from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  TrendingUp, 
  Scale, 
  Lock,
  Layers
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { 
  MARKET_PROFILES, 
  MarketProfileKey, 
  applyProfilePresetToInput 
} from '../../config/marketProfiles';
import { QUOTE_MINTS } from '../../config/constants';
import { formatCurrency, formatBps } from '../../utils/format';

interface Step2MarketParametersProps {
  input: CurveStudioConfigInput;
  onChange: (updated: CurveStudioConfigInput) => void;
  selectedProfile: MarketProfileKey;
  onSelectProfile: (key: MarketProfileKey) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2MarketParameters: React.FC<Step2MarketParametersProps> = ({
  input,
  onChange,
  selectedProfile,
  onSelectProfile,
  onNext,
  onBack,
}) => {
  const activeQuoteMints = QUOTE_MINTS.devnet;

  const handleProfileClick = (key: MarketProfileKey) => {
    onSelectProfile(key);
    const updated = applyProfilePresetToInput(input, key, input.referencePrice || 1.0);
    onChange(updated);
  };

  const handleQuoteChange = (symbol: 'USDC' | 'SOL') => {
    const quote = activeQuoteMints[symbol];
    if (quote) {
      onChange({
        ...input,
        quoteSymbol: symbol,
        quoteMint: quote.mint,
      });
    }
  };

  const handleFeeChange = (feeBps: number) => {
    onChange({
      ...input,
      baseFeeBps: feeBps,
    });
  };

  const profiles: { key: MarketProfileKey; title: string; desc: string; icon: typeof ShieldCheck; tag: string }[] = [
    {
      key: 'conservative',
      title: 'Conservative RWA',
      desc: 'Low delta price band designed for treasuries and yield notes.',
      icon: ShieldCheck,
      tag: 'TIGHT BAND',
    },
    {
      key: 'balanced',
      title: 'Balanced Growth',
      desc: 'Moderate slope for structured debt, real estate, and funds.',
      icon: Scale,
      tag: 'MODERATE',
    },
    {
      key: 'growth',
      title: 'Capital Formation',
      desc: 'Higher slope for early asset bootstrapping and initial price discovery.',
      icon: TrendingUp,
      tag: 'DYNAMIC',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#670CDC]/20 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#F7F3FF] font-sans tracking-tight">Market Parameters</h2>
          <p className="text-xs text-[#B8A9CC] mt-0.5">
            Configure the quote currency, operational profile, and liquidity fee tier.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#B8A9CC] px-2.5 py-1 rounded bg-[#100126] border border-[#670CDC]/30">
          Step 2 of 5
        </span>
      </div>

      {/* Quote Asset Selector */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-4 space-y-3 shadow-md shadow-[#09011B]/60">
        <label className="block text-xs font-semibold text-[#F7F3FF]">
          Quote Settlement Currency
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['USDC', 'SOL'] as const).map((sym) => {
            const isSelected = input.quoteSymbol === sym;
            return (
              <button
                key={sym}
                type="button"
                onClick={() => handleQuoteChange(sym)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C0142] border-[#670CDC] text-[#F7F3FF] shadow-sm shadow-[#670CDC]/20'
                    : 'bg-[#100126] border-[#670CDC]/20 text-[#B8A9CC] hover:border-[#670CDC]/40'
                }`}
              >
                <div>
                  <div className="font-mono font-bold text-sm text-[#F7F3FF]">{sym}</div>
                  <div className="text-[11px] text-[#B8A9CC] font-sans">
                    {sym === 'USDC' ? 'SPL Stablecoin (6 Decimals)' : 'Native Wrapped SOL'}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-[#F99225] bg-[#F99225]' : 'border-[#670CDC]/40'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#09011B]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Market Profile Presets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#F7F3FF]">
            Market Operational Profile
          </label>
          <span className="text-[11px] text-[#7E6D96] font-sans">
            Presets automatically calculate optimal curve slope
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedProfile === p.key;
            return (
              <div
                key={p.key}
                onClick={() => handleProfileClick(p.key)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-md shadow-[#09011B]/60 ${
                  isSelected
                    ? 'bg-[#1C0142] border-[#670CDC] shadow-sm shadow-[#670CDC]/20'
                    : 'bg-[#140130] border-[#670CDC]/25 hover:border-[#670CDC]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#670CDC]/20 text-[#D76EDD]' : 'bg-[#100126] text-[#7E6D96]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-[#F7F3FF] font-sans">
                      {p.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#100126] text-[#D76EDD] border border-[#670CDC]/25">
                    {p.tag}
                  </span>
                </div>

                <p className="text-[11px] text-[#B8A9CC] font-sans leading-snug">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trading Fee Schedule */}
      <div className="bg-[#140130] border border-[#670CDC]/25 rounded-xl p-4 space-y-3 shadow-md shadow-[#09011B]/60">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-[#F7F3FF]">
            Base Swap Fee
          </label>
          <span className="text-[11px] font-mono text-[#F99225] font-semibold">
            {formatBps(input.baseFeeBps)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { bps: 25, label: '0.25% (Low)', desc: 'Liquid RWAs' },
            { bps: 50, label: '0.50% (Standard)', desc: 'Standard pools' },
            { bps: 100, label: '1.00% (High)', desc: 'High volatility' },
          ].map((tier) => {
            const isSelected = input.baseFeeBps === tier.bps;
            return (
              <button
                key={tier.bps}
                type="button"
                onClick={() => handleFeeChange(tier.bps)}
                className={`py-2 px-3 rounded-lg border text-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C0142] border-[#670CDC] text-[#F7F3FF] font-medium'
                    : 'bg-[#100126] border-[#670CDC]/20 text-[#B8A9CC] hover:border-[#670CDC]/40'
                }`}
              >
                <div className="text-xs font-semibold">{tier.label}</div>
                <div className="text-[10px] text-[#7E6D96]">{tier.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#670CDC]/20">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 min-h-[44px] rounded-lg border border-[#670CDC]/30 bg-[#1C0142] hover:bg-[#26035A] text-[#EDE4FA] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 min-h-[44px] rounded-lg bg-[#F99225] hover:bg-[#FFA742] text-[#09011B] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#F99225]/20 active:scale-[0.99]"
        >
          <span>Next: Bonding Curve</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
