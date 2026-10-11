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
      className={`bg-[#1C0142]/85 border border-[#670CDC]/25 rounded-xl p-3.5 flex flex-col justify-between hover:border-[#670CDC]/60 hover:bg-[#26035A] transition-all font-sans shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#B8A9CC]">
          {label}
        </span>
        {change && (
          <span
            className={`text-[11px] font-mono-nums font-semibold px-1.5 py-0.5 rounded ${
              change.positive !== false
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/40'
                : 'text-[#FF9EAF] bg-[#BA3351]/20 border border-[#BA3351]/40'
            }`}
          >
            {change.value}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-lg md:text-xl font-bold text-[#F7F3FF] font-mono-nums tracking-tight">
          {value}
        </span>
      </div>

      {subtext && (
        <span className="text-[11px] text-[#7E6D96] mt-1 truncate">
          {subtext}
        </span>
      )}
    </div>
  );
};
