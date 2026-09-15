import React, { ReactNode } from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'accent'
  | 'brand'
  | 'live'
  | 'graduated'
  | 'migrating'
  | 'draft';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  className?: string;
  icon?: ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  icon,
}) => {
  const sizeStyles = {
    xs: 'text-[9px] px-1.5 py-0.2 tracking-wider gap-1',
    sm: 'text-[10px] px-2 py-0.5 tracking-tight gap-1.5',
    md: 'text-xs px-2.5 py-1 tracking-tight gap-1.5',
  }[size];

  const variantStyles = {
    neutral: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
    positive: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50',
    negative: 'bg-rose-950/50 text-rose-300 border-rose-800/50',
    warning: 'bg-amber-950/50 text-amber-300 border-amber-800/50',
    accent: 'bg-violet-950/50 text-violet-300 border-violet-800/50',
    brand: 'bg-gradient-to-r from-violet-500/15 via-rose-500/10 to-amber-500/15 text-amber-200 border-amber-500/30 font-semibold',
    live: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 font-semibold',
    graduated: 'bg-sky-950/60 text-sky-300 border-sky-700/60 font-semibold',
    migrating: 'bg-amber-950/60 text-amber-300 border-amber-700/60 font-semibold',
    draft: 'bg-zinc-900/80 text-zinc-400 border-zinc-700/40',
  }[variant];

  const dotColors = {
    neutral: 'bg-zinc-400',
    positive: 'bg-emerald-400',
    negative: 'bg-rose-400',
    warning: 'bg-amber-400',
    accent: 'bg-violet-400',
    brand: 'bg-gradient-to-r from-violet-400 to-amber-400',
    live: 'bg-emerald-400 animate-pulse',
    graduated: 'bg-sky-400',
    migrating: 'bg-amber-400 animate-pulse',
    draft: 'bg-zinc-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border select-none whitespace-nowrap ${sizeStyles} ${variantStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
