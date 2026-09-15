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
            <label htmlFor={inputId} className="text-xs font-semibold text-zinc-300 tracking-tight">
              {label}
            </label>
            {badge && (
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Input Wrapper */}
        <div
          className={`relative flex items-center w-full rounded-md border transition-all ${
            hasError
              ? 'border-rose-500/80 bg-[#160e12] focus-within:ring-1 focus-within:ring-rose-500'
              : 'border-zinc-700/80 bg-[#0e141f] focus-within:border-amber-500/80 focus-within:ring-1 focus-within:ring-amber-500/40'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900/60' : 'hover:border-zinc-600'}`}
        >
          {leftIcon && (
            <div className="pl-3 pr-1 text-zinc-400 flex items-center justify-center shrink-0">
              {leftIcon}
            </div>
          )}

          {prefixText && (
            <span className="pl-3 pr-1 text-xs text-zinc-400 select-none font-mono-nums shrink-0">
              {prefixText}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full py-2 px-3 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden disabled:cursor-not-allowed ${
              tabular ? 'font-mono-nums tracking-tight' : ''
            } ${leftIcon || prefixText ? 'pl-1.5' : ''} ${
              rightElement || suffixText ? 'pr-2' : ''
            } ${className}`}
            {...props}
          />

          {suffixText && (
            <span className="pr-3 pl-1 text-xs text-zinc-400 select-none font-mono shrink-0">
              {suffixText}
            </span>
          )}

          {rightElement && (
            <div className="pr-2 flex items-center shrink-0">{rightElement}</div>
          )}
        </div>

        {/* Error or Helper text */}
        {hasError ? (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{errorText}</span>
          </div>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-400 leading-normal">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
