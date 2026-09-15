import React from 'react';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const sizeStyles = {
    sm: 'p-0.5 text-[11px] h-7',
    md: 'p-1 text-xs h-8.5',
  }[size];

  const itemSizeStyles = {
    sm: 'px-2 py-0.5',
    md: 'px-2.5 py-1',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-zinc-800 bg-[#090d14] ${sizeStyles} ${
        fullWidth ? 'w-full flex' : ''
      } ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center justify-center gap-1.5 rounded-md font-medium transition-all ${itemSizeStyles} ${
              fullWidth ? 'flex-1' : ''
            } ${
              isSelected
                ? 'bg-[#182030] text-zinc-100 shadow-xs border border-zinc-700/80 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1 py-0.1 rounded ${
                  isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
