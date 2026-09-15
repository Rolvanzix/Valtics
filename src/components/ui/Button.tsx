import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'subtle' | 'destructive' | 'accent' | 'brand';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all select-none whitespace-nowrap focus:outline-hidden focus:ring-1 focus:ring-zinc-400/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99]';

    const sizeStyles = {
      xs: 'text-[11px] px-2 py-1 gap-1.5 h-6.5 tracking-tight',
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8 tracking-tight',
      md: 'text-xs px-3.5 py-2 gap-2 h-9.5 font-semibold tracking-tight',
      lg: 'text-sm px-5 py-2.5 gap-2.5 h-11 font-semibold tracking-tight',
    }[size];

    const variantStyles = {
      // Primary Institutional Accent: Warm amber / gold with dark contrast
      primary:
        'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-semibold shadow-xs hover:shadow-amber-500/10',
      // Secondary: Deep Slate container with crisp border
      secondary:
        'bg-[#121824] hover:bg-[#182133] active:bg-[#0e141f] text-zinc-200 border border-zinc-700/80 shadow-xs hover:border-zinc-600',
      // Outline: Transparent with clean border
      outline:
        'bg-transparent hover:bg-zinc-800/60 active:bg-zinc-800 text-zinc-300 border border-zinc-700/80 hover:text-zinc-100 hover:border-zinc-500',
      // Subtle / Ghost: Minimal container for inline toolbar actions
      subtle:
        'bg-transparent hover:bg-zinc-800/60 active:bg-zinc-800 text-zinc-400 hover:text-zinc-200',
      // Destructive: Controlled crimson
      destructive:
        'bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-950 text-rose-300 border border-rose-800/60 hover:border-rose-700',
      // Accent: Violet-amber hybrid for high-conviction issuance
      accent:
        'bg-gradient-to-r from-violet-600 via-purple-600 to-amber-500 hover:opacity-95 text-white font-semibold shadow-md',
      // Brand: Signature VALTICS Gradient (Violet -> Rose -> Amber) matching Brand Kit
      brand:
        'bg-gradient-to-r from-[#8b5cf6] via-[#ec4899] to-[#f59e0b] hover:opacity-95 active:scale-[0.98] text-white font-bold shadow-lg shadow-violet-900/25 border border-white/10',
    }[variant];

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
