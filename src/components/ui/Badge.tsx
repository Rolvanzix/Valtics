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
    neutral: 'bg-[#1C0142] text-[#B8A9CC] border-[#670CDC]/25',
    positive: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    negative: 'bg-[#BA3351]/20 text-[#FF9EAF] border-[#BA3351]/40',
    warning: 'bg-[#F99225]/15 text-[#F99225] border-[#F99225]/35',
    accent: 'bg-[#D76EDD]/15 text-[#D76EDD] border-[#D76EDD]/35',
    brand: 'bg-[#3B0489]/50 text-[#F7F3FF] border-[#670CDC]/60 font-semibold shadow-xs shadow-[#670CDC]/20',
    live: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 font-medium',
    graduated: 'bg-[#670CDC]/25 text-[#E6DCFA] border-[#670CDC]/40 font-medium',
    migrating: 'bg-[#F99225]/20 text-[#F99225] border-[#F99225]/40 font-medium',
    draft: 'bg-[#140130] text-[#7E6D96] border-[#670CDC]/20',
  }[variant];

  const dotColors = {
    neutral: 'bg-[#B8A9CC]',
    positive: 'bg-emerald-400',
    negative: 'bg-[#BA3351]',
    warning: 'bg-[#F99225]',
    accent: 'bg-[#D76EDD]',
    brand: 'bg-[#670CDC]',
    live: 'bg-emerald-400',
    graduated: 'bg-[#D76EDD]',
    migrating: 'bg-[#F99225]',
    draft: 'bg-[#7E6D96]',
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
