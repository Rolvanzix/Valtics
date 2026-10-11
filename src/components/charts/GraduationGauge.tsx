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
    <div className="rounded-xl border border-[#670CDC]/25 bg-[#140130] p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#F99225]" />
          <h4 className="font-semibold text-xs uppercase tracking-wider text-[#F7F3FF]">
            Graduation Threshold
          </h4>
        </div>
        {isMigrated ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-800/40">
            <CheckCircle2 className="w-3 h-3 text-[#D76EDD]" />
            Graduated to DAMM v2
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#F99225] bg-[#F99225]/10 px-2 py-0.5 rounded-md border border-[#F99225]/30">
            Bonding Curve Active
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono-nums text-[#F7F3FF]">
            {formatPercent(clampedProgress)}
          </span>
          <span className="text-xs font-mono-nums text-[#B8A9CC]">
            {currentQuoteSol.toFixed(2)} / {thresholdSol.toFixed(2)} SOL Target
          </span>
        </div>

        {/* Multi-segment institutional gauge bar */}
        <div className="w-full h-2 rounded-full bg-[#0E0124] border border-[#670CDC]/25 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 ${
              isMigrated ? 'bg-gradient-to-r from-[#670CDC] to-[#D76EDD]' : 'bg-gradient-to-r from-[#670CDC] via-[#D76EDD] to-[#F99225]'
            }`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono-nums">
        <div className="bg-[#100126] p-2 rounded-lg border border-[#670CDC]/20">
          <span className="text-[9px] uppercase font-sans text-[#7E6D96] block">Remaining SOL</span>
          <span className="text-[#F7F3FF] font-semibold">
            {remainingSol > 0 ? `${remainingSol.toFixed(2)} SOL` : 'Threshold Met'}
          </span>
        </div>
        <div className="bg-[#100126] p-2 rounded-lg border border-[#670CDC]/20">
          <span className="text-[9px] uppercase font-sans text-[#7E6D96] block">LP Token Lock</span>
          <span className="text-[#F7F3FF] font-semibold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-[#B8A9CC]" />
            {lockPeriodDays} Days Locked
          </span>
        </div>
      </div>
    </div>
  );
};
