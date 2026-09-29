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
      'inline-flex items-center justify-center font-sans font-medium rounded-lg transition-all select-none whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-[#670CDC]/40 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.99] cursor-pointer';

    const sizeStyles = {
      xs: 'text-[11px] px-2.5 py-1 gap-1.5 h-7 tracking-tight',
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8 tracking-tight',
      md: 'text-xs px-4 py-2 gap-2 h-9 font-medium tracking-tight',
      lg: 'text-sm px-5 py-2.5 gap-2.5 h-10 font-medium tracking-tight',
    }[size];

    const variantStyles = {
      // Primary: High-visibility brand orange action with dark purple text
      primary:
        'bg-[#F99225] hover:bg-[#FFA33D] active:bg-[#E8831A] text-[#09011B] font-bold shadow-md shadow-[#F99225]/20',
      // Secondary: Dark purple container with electric violet border
      secondary:
        'bg-[#1C0142] hover:bg-[#26035A] active:bg-[#1C0142] text-[#F7F3FF] border border-[#670CDC]/35 hover:border-[#670CDC]/60 shadow-xs',
      // Outline: Transparent with subtle electric violet hairline border
      outline:
        'bg-transparent hover:bg-[#1C0142]/70 active:bg-[#1C0142] text-[#B8A9CC] border border-[#670CDC]/30 hover:text-[#F7F3FF] hover:border-[#670CDC]/60',
      // Subtle / Ghost: Clean hover state for inline actions
      subtle:
        'bg-transparent hover:bg-[#1C0142]/60 active:bg-[#1C0142] text-[#B8A9CC] hover:text-[#F7F3FF]',
      // Destructive: Controlled brand orange-red accent
      destructive:
        'bg-[#BA3351]/20 hover:bg-[#BA3351]/35 active:bg-[#BA3351]/40 text-[#FF9EAF] border border-[#BA3351]/50 hover:border-[#BA3351]/80',
      // Accent: Electric violet to magenta transition
      accent:
        'bg-gradient-to-r from-[#670CDC] to-[#D76EDD] hover:opacity-95 text-white font-semibold shadow-md shadow-[#670CDC]/25',
      // Brand: Official VALTICS gradient (Electric Violet -> Magenta -> Orange/Red -> Orange)
      brand:
        'bg-gradient-to-r from-[#670CDC] via-[#D76EDD] via-[#BA3351] to-[#F99225] hover:opacity-95 text-white font-semibold shadow-md shadow-[#670CDC]/30 border border-white/10',
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
