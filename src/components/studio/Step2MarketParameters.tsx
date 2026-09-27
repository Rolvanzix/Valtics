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
      <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-sans tracking-tight">Market parameters</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure the quote currency, operational profile, and liquidity fee tier.
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
          Step 2 of 5
        </span>
      </div>

      {/* Quote Asset Selector */}
      <div className="bg-[#090e18] border border-zinc-800/90 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-semibold text-zinc-200">
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
                    ? 'bg-amber-500/10 border-amber-500/60 text-white ring-1 ring-amber-500/30'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="font-mono font-bold text-sm text-zinc-100">{sym}</div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    {sym === 'USDC' ? 'SPL Stablecoin (6 Decimals)' : 'Native Wrapped SOL'}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-amber-400 bg-amber-400 text-zinc-950' : 'border-zinc-700'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Market Profile Presets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-200">
            Market Operational Profile
          </label>
          <span className="text-[11px] text-zinc-400 font-sans">
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
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-violet-950/20 border-violet-500/60 ring-1 ring-violet-500/30'
                    : 'bg-[#090e18] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-zinc-100 font-sans">
                      {p.title}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {p.tag}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 font-sans leading-snug">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trading Fee Schedule */}
      <div className="bg-[#090e18] border border-zinc-800/90 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-zinc-200">
            Base Swap Fee
          </label>
          <span className="text-[11px] font-mono text-amber-400 font-semibold">
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
                    ? 'bg-amber-500/10 border-amber-500/60 text-amber-300 font-medium'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-semibold">{tier.label}</div>
                <div className="text-[10px] text-zinc-400">{tier.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-5 py-2 min-h-[44px] rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <span>Next: Bonding curve</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
