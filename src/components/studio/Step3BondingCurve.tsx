import React, { useMemo } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Coins, 
  TrendingUp,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { CurveChart } from './CurveChart';
import { CurvePoint } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/format';

interface Step3BondingCurveProps {
  input: CurveStudioConfigInput;
  onChange: (updated: CurveStudioConfigInput) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3BondingCurve: React.FC<Step3BondingCurveProps> = ({
  input,
  onChange,
  onNext,
  onBack,
}) => {
  // Generate 24 curve simulation points for the visual preview chart
  const points: CurvePoint[] = useMemo(() => {
    const steps = 24;
    const curveAllocationTokens = (input.totalSupply * input.curveAllocationPct) / 100;
    const startP = input.startingPriceQuote;
    const endP = input.migrationPriceQuote;
    const pts: CurvePoint[] = [];

    for (let i = 0; i <= steps; i++) {
      const pct = (i / steps) * 100;
      const progress = i / steps;
      // Exponential invariant pricing
      const spot = startP + (endP - startP) * Math.pow(progress, 1.6);
      const tokensSold = (curveAllocationTokens * pct) / 100;
      const accumulatedQuote = ((startP + spot) / 2) * tokensSold;

      pts.push({
        step: i,
        tokensSoldPct: pct,
        tokensSold,
        tokensRemaining: curveAllocationTokens - tokensSold,
        currentPriceUsd: spot,
        currentPriceQuote: spot,
        accumulatedQuote,
        accumulatedQuoteUsd: accumulatedQuote,
        marketCapUsd: spot * input.totalSupply,
        slippageBuy1000UsdPct: Math.min(5, 0.2 + progress * 1.5),
      });
    }
    return pts;
  }, [
    input.startingPriceQuote,
    input.migrationPriceQuote,
    input.totalSupply,
    input.curveAllocationPct,
  ]);

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

  const handleMigrationTargetChange = (val: number) => {
    onChange({
      ...input,
      targetMigrationQuote: Math.max(1, val),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-sans tracking-tight">Bonding curve</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure dynamic bonding curve pricing bands and migration parameters.
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
          Step 3 of 5
        </span>
      </div>

      {/* Visual Invariant Curve Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Deterministic Pricing Curve Preview</span>
          </span>
          <span className="font-mono text-[11px] text-zinc-400">
            DAMM v2 Graduation Target: {formatCurrency(input.targetMigrationQuote, input.quoteSymbol)}
          </span>
        </div>
        <CurveChart points={points} quoteAsset={input.quoteSymbol} />
      </div>

      {/* Numerical Curve Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-[#090e18] border border-zinc-800/90 rounded-xl p-4">
        {/* Starting Price */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Starting Spot Price ({input.quoteSymbol})
          </label>
          <input
            type="number"
            step="0.0001"
            min="0.000001"
            value={input.startingPriceQuote}
            onChange={(e) => handleStartPriceChange(parseFloat(e.target.value) || 0.001)}
            className="w-full bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
          />
          <span className="text-[10px] text-zinc-400 block font-mono">
            Initial liquidity bin price
          </span>
        </div>

        {/* Migration Target Price */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Graduation Price ({input.quoteSymbol})
          </label>
          <input
            type="number"
            step="0.0001"
            min="0.000001"
            value={input.migrationPriceQuote}
            onChange={(e) => handleMigrationPriceChange(parseFloat(e.target.value) || 0.002)}
            className="w-full bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500"
          />
          <span className="text-[10px] text-zinc-400 block font-mono">
            Price at migration threshold
          </span>
        </div>

        {/* Graduation Target Quote Threshold */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-300">
            Migration Target Threshold ({input.quoteSymbol})
          </label>
          <input
            type="number"
            step="1"
            min="1"
            value={input.targetMigrationQuote}
            onChange={(e) => handleMigrationTargetChange(parseFloat(e.target.value) || 85)}
            className="w-full bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-amber-500"
          />
          <span className="text-[10px] text-zinc-400 block font-mono">
            Triggers automated DAMM migration
          </span>
        </div>
      </div>

      {/* Liquidity Allocation & Locking */}
      <div className="bg-[#090e18] border border-zinc-800/90 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Permanent LP Protection</span>
          </span>
          <span className="font-mono text-emerald-400 text-[11px] font-semibold">
            {input.creatorPermanentLockedLpPct}% Locked
          </span>
        </div>

        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${input.creatorPermanentLockedLpPct}%` }}
            className="bg-emerald-400 h-full"
            title="Locked LP"
          />
          <div
            style={{ width: `${100 - input.creatorPermanentLockedLpPct}%` }}
            className="bg-amber-400 h-full"
            title="Unlocked LP"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Permanent Burnt LP (Anti-Rug)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Tradable LP ({100 - input.creatorPermanentLockedLpPct}%)
          </span>
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
          <span>Next: Review</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
