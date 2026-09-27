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
      'inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all select-none whitespace-nowrap focus:outline-hidden focus:ring-1 focus:ring-zinc-400/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] cursor-pointer';

    const sizeStyles = {
      xs: 'text-[11px] px-2.5 py-1 gap-1.5 h-7 tracking-tight',
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8 tracking-tight',
      md: 'text-xs px-4 py-2 gap-2 h-9 font-medium tracking-tight',
      lg: 'text-sm px-5 py-2.5 gap-2.5 h-10 font-medium tracking-tight',
    }[size];

    const variantStyles = {
      // Primary: High-contrast clean accent
      primary:
        'bg-zinc-100 hover:bg-white active:bg-zinc-200 text-zinc-950 font-semibold shadow-xs',
      // Secondary: Deep slate container with subtle border
      secondary:
        'bg-zinc-900/80 hover:bg-zinc-800 active:bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700 shadow-xs',
      // Outline: Transparent with subtle hairline border
      outline:
        'bg-transparent hover:bg-zinc-800/50 active:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:text-zinc-100 hover:border-zinc-700',
      // Subtle / Ghost: Clean hover state for inline actions
      subtle:
        'bg-transparent hover:bg-zinc-800/50 active:bg-zinc-800 text-zinc-400 hover:text-zinc-200',
      // Destructive: Controlled crimson
      destructive:
        'bg-rose-950/30 hover:bg-rose-900/50 active:bg-rose-950 text-rose-300 border border-rose-800/40 hover:border-rose-700/60',
      // Accent: Violet-amber subtle transition
      accent:
        'bg-gradient-to-r from-violet-600 to-amber-600 hover:opacity-90 text-white font-medium shadow-xs',
      // Brand: Refined VALTICS gradient
      brand:
        'bg-gradient-to-r from-[#7c3aed] via-[#db2777] to-[#ea580c] hover:opacity-95 text-white font-semibold shadow-xs border border-white/10',
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
