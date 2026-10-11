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
      className={`inline-flex items-center rounded-lg border border-[#670CDC]/25 bg-[#140130] ${sizeStyles} ${
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
            className={`relative flex items-center justify-center gap-1.5 rounded-md font-medium transition-all cursor-pointer ${itemSizeStyles} ${
              fullWidth ? 'flex-1' : ''
            } ${
              isSelected
                ? 'bg-[#3B0489] text-[#F7F3FF] shadow-xs border border-[#670CDC]/50 font-semibold'
                : 'text-[#B8A9CC] hover:text-[#F7F3FF] hover:bg-[#1C0142]/60'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span className="truncate">{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-[#F99225]/20 text-[#F99225]' : 'bg-[#1C0142] text-[#B8A9CC]'
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
