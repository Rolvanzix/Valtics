import React, { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: ReactNode;
  rightElement?: ReactNode;
  prefixText?: string;
  suffixText?: string;
  badge?: string;
  tabular?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      leftIcon,
      rightElement,
      prefixText,
      suffixText,
      badge,
      tabular = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = !!errorText;

    return (
      <div className="w-full space-y-1.5">
        {/* Label and optional badge/helper */}
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-[#F7F3FF] tracking-tight">
              {label}
            </label>
            {badge && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#1C0142] text-[#B8A9CC] border border-[#670CDC]/30">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Input Wrapper */}
        <div
          className={`relative flex items-center w-full rounded-md border transition-all ${
            hasError
              ? 'border-[#BA3351] bg-[#250315] focus-within:ring-2 focus-within:ring-[#BA3351]/40'
              : 'border-[#670CDC]/30 bg-[#120128] focus-within:border-[#670CDC] focus-within:ring-2 focus-within:ring-[#670CDC]/35 hover:border-[#670CDC]/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-[#140130]/60' : ''}`}
        >
          {leftIcon && (
            <div className="pl-3 pr-1 text-[#B8A9CC] flex items-center justify-center shrink-0">
              {leftIcon}
            </div>
          )}

          {prefixText && (
            <span className="pl-3 pr-1 text-xs text-[#B8A9CC] select-none font-mono-nums shrink-0">
              {prefixText}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full py-2 px-3 bg-transparent text-xs text-[#F7F3FF] placeholder-[#7E6D96] focus:outline-hidden disabled:cursor-not-allowed ${
              tabular ? 'font-mono-nums tracking-tight' : ''
            } ${leftIcon || prefixText ? 'pl-1.5' : ''} ${
              rightElement || suffixText ? 'pr-2' : ''
            } ${className}`}
            {...props}
          />

          {suffixText && (
            <span className="pr-3 pl-1 text-xs text-[#B8A9CC] select-none font-mono shrink-0">
              {suffixText}
            </span>
          )}

          {rightElement && (
            <div className="pr-2 flex items-center shrink-0">{rightElement}</div>
          )}
        </div>

        {/* Error or Helper text */}
        {hasError ? (
          <div className="flex items-center gap-1.5 text-[11px] text-[#FF9EAF]">
            <AlertCircle className="w-3 h-3 shrink-0 text-[#BA3351]" />
            <span>{errorText}</span>
          </div>
        ) : helperText ? (
          <p className="text-[11px] text-[#B8A9CC] leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
