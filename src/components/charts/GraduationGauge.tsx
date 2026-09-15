import React from 'react';
import { Target, CheckCircle2, Lock } from 'lucide-react';
import { formatPercent } from '../../utils/format';

interface GraduationGaugeProps {
  progressPct: number;
  currentQuoteSol: number;
  thresholdSol: number;
  isMigrated?: boolean;
  lockPeriodDays?: number;
}

export const GraduationGauge: React.FC<GraduationGaugeProps> = ({
  progressPct,
  currentQuoteSol,
  thresholdSol,
  isMigrated = false,
  lockPeriodDays = 180,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progressPct));
  const remainingSol = Math.max(0, thresholdSol - currentQuoteSol);

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#0c1018] p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-200">
            Graduation Threshold
          </h4>
        </div>
        {isMigrated ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40">
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            Graduated to DAMM v2
          </span>
        ) : (
          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
            Bonding Curve Active
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono-nums text-zinc-100">
            {formatPercent(clampedProgress)}
          </span>
          <span className="text-xs font-mono-nums text-zinc-400">
            {currentQuoteSol.toFixed(2)} / {thresholdSol.toFixed(2)} SOL Target
          </span>
        </div>

        {/* Multi-segment institutional gauge bar */}
        <div className="w-full h-2 rounded-full bg-[#080c14] border border-zinc-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 ${
              isMigrated ? 'bg-sky-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono-nums">
        <div className="bg-[#090d14] p-2 rounded border border-zinc-800/80">
          <span className="text-[9px] uppercase font-sans text-zinc-500 block">Remaining SOL</span>
          <span className="text-zinc-200 font-semibold">
            {remainingSol > 0 ? `${remainingSol.toFixed(2)} SOL` : 'Threshold Met'}
          </span>
        </div>
        <div className="bg-[#090d14] p-2 rounded border border-zinc-800/80">
          <span className="text-[9px] uppercase font-sans text-zinc-500 block">LP Token Lock</span>
          <span className="text-zinc-200 font-semibold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-zinc-400" />
            {lockPeriodDays} Days Locked
          </span>
        </div>
      </div>
    </div>
  );
};
