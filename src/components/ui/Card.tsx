import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-zinc-800/90 bg-[#0c1018] shadow-sm transition-all ${
        hoverable ? 'hover:border-zinc-700 hover:bg-[#0f1420] cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  badge?: ReactNode;
}> = ({ title, description, action, badge, className = '' }) => {
  return (
    <div className={`p-4 sm:p-5 border-b border-zinc-800/80 flex items-start justify-between gap-3 ${className}`}>
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          {typeof title === 'string' ? (
            <h3 className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight">{title}</h3>
          ) : (
            title
          )}
          {badge}
        </div>
        {description && (
          <p className="text-xs text-zinc-400 leading-normal">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`p-3.5 sm:p-4 border-t border-zinc-800/80 bg-[#0a0d14]/40 rounded-b-xl flex items-center justify-between text-xs text-zinc-400 ${className}`}>
      {children}
    </div>
  );
};

export interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: number; // e.g. +12.4%
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  tooltip?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  change,
  changeLabel,
  trend,
  tooltip,
  icon,
  badge,
  className = '',
  onClick,
}) => {
  const isPositive = trend === 'up' || (change !== undefined && change > 0);
  const isNegative = trend === 'down' || (change !== undefined && change < 0);

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-zinc-800/90 bg-[#0c1018] p-4 sm:p-5 flex flex-col justify-between transition-all ${
        onClick ? 'hover:border-zinc-700 hover:bg-[#0f1420] cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 mb-2">
        <div className="flex items-center gap-1.5 font-medium">
          {icon && <span className="text-zinc-500 shrink-0">{icon}</span>}
          <span>{label}</span>
          {tooltip && (
            <span title={tooltip} className="cursor-help text-zinc-500 hover:text-zinc-300">
              <HelpCircle className="w-3 h-3" />
            </span>
          )}
        </div>
        {badge}
      </div>

      <div className="space-y-1">
        <div className="font-mono-nums text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
          {value}
        </div>

        {(subValue || change !== undefined) && (
          <div className="flex items-center gap-2 text-xs">
            {change !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-medium px-1.5 py-0.2 rounded ${
                  isPositive
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : isNegative
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isPositive && <TrendingUp className="w-2.5 h-2.5" />}
                {isNegative && <TrendingDown className="w-2.5 h-2.5" />}
                <span>
                  {change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
                </span>
              </span>
            )}

            {changeLabel && (
              <span className="text-[11px] text-zinc-500">{changeLabel}</span>
            )}

            {subValue && !changeLabel && (
              <span className="text-[11px] text-zinc-400 font-mono-nums truncate">
                {subValue}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
