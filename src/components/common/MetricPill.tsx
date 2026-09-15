import React from 'react';

interface MetricPillProps {
  label: string;
  value: string | React.ReactNode;
  subtext?: string;
  change?: {
    value: string;
    positive?: boolean;
  };
  tooltip?: string;
  className?: string;
}

export const MetricPill: React.FC<MetricPillProps> = ({
  label,
  value,
  subtext,
  change,
  tooltip,
  className = '',
}) => {
  return (
    <div
      title={tooltip}
      className={`bg-[#0e131d] border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between hover:border-zinc-700/80 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        {change && (
          <span
            className={`text-[11px] font-mono-nums font-semibold px-1.5 py-0.5 rounded ${
              change.positive !== false
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/40'
                : 'text-rose-400 bg-rose-950/40 border border-rose-900/40'
            }`}
          >
            {change.value}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-lg md:text-xl font-semibold text-zinc-100 font-mono-nums tracking-tight">
          {value}
        </span>
      </div>

      {subtext && (
        <span className="text-[11px] text-zinc-400 mt-1 truncate">
          {subtext}
        </span>
      )}
    </div>
  );
};
