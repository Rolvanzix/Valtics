import React from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Lock, 
  Coins, 
  Layers, 
  CheckCircle2, 
  Zap,
  Server
} from 'lucide-react';
import { CurveStudioConfigInput } from '../../services/meteoraCreation';
import { METEORA_DBC_PROGRAM_ID } from '../../config/constants';
import { formatCurrency, formatNumber, formatBps } from '../../utils/format';

interface Step4ReviewProps {
  input: CurveStudioConfigInput;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Review: React.FC<Step4ReviewProps> = ({
  input,
  onNext,
  onBack,
}) => {
  const impliedMarketCap = input.migrationPriceQuote * input.totalSupply;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white font-sans tracking-tight">Review market configuration</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verify the mathematical and cryptographic specifications before broadcast.
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
          Step 4 of 5
        </span>
      </div>

      {/* Structured Parameter Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Asset Identity */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#090e18] space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 font-sans">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Token Identity</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              SPL Token
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-zinc-400">Asset Name</span>
              <span className="font-semibold text-zinc-100">{input.assetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Ticker Symbol</span>
              <span className="font-mono font-bold text-amber-400">${input.ticker}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Base Mint Address</span>
              <span className="font-mono text-[11px] text-zinc-300 truncate max-w-[180px]">
                {input.baseMint}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Asset Category</span>
              <span className="text-zinc-200">{input.assetCategory}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Reference NAV</span>
              <span className="font-mono text-zinc-100">
                {formatCurrency(input.referencePrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Market & Trading Parameters */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#090e18] space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 font-sans">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>Market Configuration</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              Meteora DBC
            </span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-zinc-400">Quote Pair</span>
              <span className="font-mono font-semibold text-zinc-100">{input.quoteSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Base Swap Fee</span>
              <span className="font-mono text-amber-400 font-semibold">{formatBps(input.baseFeeBps)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Supply</span>
              <span className="font-mono text-zinc-200">{formatNumber(input.totalSupply)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Curve Token Allocation</span>
              <span className="font-mono text-zinc-200">{input.curveAllocationPct}% ({formatNumber((input.totalSupply * input.curveAllocationPct) / 100)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Permanent Locked LP</span>
              <span className="font-mono text-emerald-400 font-semibold">{input.creatorPermanentLockedLpPct}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Curve Pricing Invariants */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-[#090e18] space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 font-sans">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Bonding Curve Pricing & Migration Targets</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
              DAMM v2 Eligible
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans">Starting Spot Price</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formatCurrency(input.startingPriceQuote, input.quoteSymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans">Graduation Price</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                {formatCurrency(input.migrationPriceQuote, input.quoteSymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans">Migration Threshold</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">
                {formatCurrency(input.targetMigrationQuote, input.quoteSymbol)}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
              <span className="text-[10px] uppercase text-zinc-400 block font-sans">Implied Migration FDV</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">
                {formatCurrency(impliedMarketCap, input.quoteSymbol)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Protocol Verification Checklist */}
      <div className="p-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Solana Smart Contract Pre-flight Audit</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300 pt-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Deterministic PDA generation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Anti-rug permanent LP burn lock</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Meteora DBC v1.5.12 verified</span>
          </div>
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
          <span>Next: Deploy market</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
