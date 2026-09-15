import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: ReactNode;
}

export interface SelectProps<T extends string | number = string> {
  label?: string;
  helperText?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (val: T) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function Select<T extends string | number = string>({
  label,
  helperText,
  options,
  value,
  onChange,
  disabled = false,
  className = '',
  placeholder = 'Select option...',
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-zinc-300 tracking-tight block">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between py-2 px-3 rounded-md border text-xs text-left transition-all ${
            isOpen
              ? 'border-amber-500/80 ring-1 ring-amber-500/40 bg-[#0e141f]'
              : 'border-zinc-700/80 bg-[#0e141f] hover:border-zinc-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-zinc-900/60' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
            <span className="text-zinc-100 font-medium truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span className="text-[10px] font-mono uppercase px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                {selectedOption.badge}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700/90 bg-[#0c1018] shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-300 font-medium'
                      : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.subLabel && (
                        <div className="text-[10px] text-zinc-500 truncate">{option.subLabel}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {helperText && <p className="text-[11px] text-zinc-400 leading-normal">{helperText}</p>}
    </div>
  );
}
