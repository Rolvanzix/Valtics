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
    xs: 'text-[10px] px-1.5 py-0.5 tracking-tight gap-1',
    sm: 'text-[11px] px-2 py-0.5 tracking-tight gap-1.5',
    md: 'text-xs px-2.5 py-1 tracking-tight gap-1.5',
  }[size];

  const variantStyles = {
    neutral: 'bg-zinc-800/60 text-zinc-300 border-zinc-800',
    positive: 'bg-emerald-950/30 text-emerald-300 border-emerald-800/30',
    negative: 'bg-rose-950/30 text-rose-300 border-rose-800/30',
    warning: 'bg-amber-950/30 text-amber-300 border-amber-800/30',
    accent: 'bg-violet-950/30 text-violet-300 border-violet-800/30',
    brand: 'bg-violet-950/40 text-violet-200 border-violet-800/40 font-medium',
    live: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 font-medium',
    graduated: 'bg-sky-950/40 text-sky-300 border-sky-800/40 font-medium',
    migrating: 'bg-amber-950/40 text-amber-300 border-amber-800/40 font-medium',
    draft: 'bg-zinc-900/60 text-zinc-400 border-zinc-800/60',
  }[variant];

  const dotColors = {
    neutral: 'bg-zinc-400',
    positive: 'bg-emerald-400',
    negative: 'bg-rose-400',
    warning: 'bg-amber-400',
    accent: 'bg-violet-400',
    brand: 'bg-violet-400',
    live: 'bg-emerald-400',
    graduated: 'bg-sky-400',
    migrating: 'bg-amber-400',
    draft: 'bg-zinc-500',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-sans font-medium rounded-md border select-none whitespace-nowrap ${sizeStyles} ${variantStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
