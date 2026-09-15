import React from 'react';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface ActivityStep {
  slot: number;
  type: 'buy' | 'sell';
  volumeSol: number;
  priceUsd: number;
  timeLabel: string;
}

interface MarketActivityChartProps {
  data?: ActivityStep[];
}

export const MarketActivityChart: React.FC<MarketActivityChartProps> = ({ data }) => {
  // Default mock recent trade volume bars if empty
  const defaultSteps: ActivityStep[] = [
    { slot: 326190, type: 'buy', volumeSol: 12.5, priceUsd: 0.12, timeLabel: '10m ago' },
    { slot: 326195, type: 'buy', volumeSol: 28.0, priceUsd: 0.14, timeLabel: '8m ago' },
    { slot: 326201, type: 'sell', volumeSol: 8.2, priceUsd: 0.13, timeLabel: '6m ago' },
    { slot: 326210, type: 'buy', volumeSol: 45.1, priceUsd: 0.17, timeLabel: '4m ago' },
    { slot: 326218, type: 'buy', volumeSol: 34.0, priceUsd: 0.19, timeLabel: '2m ago' },
    { slot: 326225, type: 'buy', volumeSol: 19.8, priceUsd: 0.21, timeLabel: 'Just now' },
  ];

  const steps = data && data.length > 0 ? data : defaultSteps;
  const maxVol = Math.max(...steps.map((s) => s.volumeSol), 1);

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#0c1018] p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h4 className="font-semibold text-xs uppercase tracking-wider text-zinc-200">
            Market Flow & Trade Execution Volume
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Buy Inflow
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-mono">
            <span className="w-2 h-2 rounded-xs bg-rose-500" /> Sell Outflow
          </span>
        </div>
      </div>

      {/* Volume bars */}
      <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2">
        {steps.map((step, idx) => {
          const heightPct = Math.max(12, (step.volumeSol / maxVol) * 100);
          const isBuy = step.type === 'buy';

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              {/* Hover Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-[#090d14] border border-zinc-700 p-2 rounded text-[10px] font-mono pointer-events-none z-20 whitespace-nowrap shadow-xl">
                <div className="font-semibold text-zinc-200 uppercase">{step.type} Order</div>
                <div className="text-amber-400">{step.volumeSol} SOL</div>
                <div className="text-zinc-400">{formatCurrency(step.priceUsd)}</div>
                <div className="text-zinc-500">{step.timeLabel}</div>
              </div>

              {/* Bar */}
              <div
                className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                  isBuy
                    ? 'bg-emerald-500/80 hover:bg-emerald-400'
                    : 'bg-rose-500/80 hover:bg-rose-400'
                }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Time Label */}
              <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[40px]">
                {step.timeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
